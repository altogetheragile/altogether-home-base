import type {
  WorkItem,
  DayRollResult,
  DaySummaryData,
  RoundMetrics,
  RoundState,
  Specialism,
  ColumnId,
  ColumnSnapshot,
} from './types';
import {
  WORKERS,
  WORK_ITEMS,
  OFF_SPEC_MULTIPLIER,
  BLOCKER_CHANCE,
  BLOCKER_EFFORT,
} from './config';

// ============= Item Factory =============

export function createItems(): WorkItem[] {
  return WORK_ITEMS.map((def) => ({
    id: def.id,
    title: def.title,
    column: 'backlog' as ColumnId,
    effortRemaining: { ...def.effort },
    effortTotal: { ...def.effort },
    blocked: false,
    blockerEffort: 0,
    startDay: null,
    endDay: null,
  }));
}

// ============= Snapshot =============

export function snapshotColumns(items: WorkItem[]): ColumnSnapshot {
  const snap: ColumnSnapshot = { backlog: 0, analysis: 0, development: 0, test: 0, done: 0 };
  for (const item of items) {
    snap[item.column]++;
  }
  return snap;
}

// ============= Dice & Randomness =============

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// ============= Blocker Logic =============

export function applyBlockers(items: WorkItem[], _day: number): { items: WorkItem[]; blockedIds: string[] } {
  const blockedIds: string[] = [];
  const updated = items.map((item) => {
    if (item.column === 'backlog' || item.column === 'done' || item.blocked) return item;
    if (Math.random() < BLOCKER_CHANCE) {
      const column = item.column as Specialism;
      blockedIds.push(item.id);
      return { ...item, blocked: true, blockerEffort: BLOCKER_EFFORT[column] };
    }
    return item;
  });
  return { items: updated, blockedIds };
}

// ============= Day Simulation =============

function nextColumn(column: ColumnId): ColumnId | null {
  const order: ColumnId[] = ['backlog', 'analysis', 'development', 'test', 'done'];
  const idx = order.indexOf(column);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

export function applyDayBlockers(state: RoundState): { items: WorkItem[]; blockedIds: string[] } {
  return applyBlockers(state.items, state.day);
}

export function simulateDay(state: RoundState): { items: WorkItem[]; summary: DaySummaryData } {
  const day = state.day;

  // Blockers were already applied before assignment phase — don't re-apply
  // Step 1: Process worker assignments
  const rolls: DayRollResult[] = [];
  const workingItems = state.items.map((item) => ({ ...item }));
  const blockersCleared: string[] = [];

  for (const assignment of state.assignments) {
    const worker = WORKERS.find((w) => w.id === assignment.workerId);
    if (!worker) continue;

    const item = workingItems.find((i) => i.id === assignment.cardId);
    if (!item || item.column === 'backlog' || item.column === 'done') continue;

    const roll = rollDie();
    const column = item.column as Specialism;
    const isSpecialist = worker.specialism === column;
    const multiplier = isSpecialist ? 1 : OFF_SPEC_MULTIPLIER;
    const effectiveWork = Math.round(roll * multiplier);

    rolls.push({
      workerId: worker.id,
      cardId: item.id,
      roll,
      effectiveWork,
      isSpecialist,
    });

    // If blocked, apply work to blocker first
    if (item.blocked) {
      item.blockerEffort = Math.max(0, item.blockerEffort - effectiveWork);
      if (item.blockerEffort <= 0) {
        item.blocked = false;
        item.blockerEffort = 0;
        blockersCleared.push(item.id);
      }
    } else {
      // Apply work to current column's effort
      item.effortRemaining[column] = Math.max(0, item.effortRemaining[column] - effectiveWork);
    }
  }

  // Step 3: Move completed items forward & track completions
  // Respect WIP limits when advancing items between columns
  const wipLimits = state.wipLimits;
  const itemsCompleted: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of workingItems) {
      if (item.column === 'backlog' || item.column === 'done') continue;
      const col = item.column as Specialism;
      if (item.effortRemaining[col] <= 0 && !item.blocked) {
        const next = nextColumn(item.column);
        if (!next) continue;
        // Enforce WIP limit on the destination column (not done — done is unlimited)
        if (next !== 'done' && wipLimits) {
          const destCount = workingItems.filter((i) => i.column === next).length;
          if (destCount >= wipLimits[next as Specialism]) continue; // blocked by WIP limit
        }
        item.column = next;
        if (item.startDay === null && next !== 'backlog') {
          item.startDay = day;
        }
        if (next === 'done') {
          item.endDay = day;
          itemsCompleted.push(item.id);
        }
        changed = true;
      }
    }
  }

  return {
    items: workingItems,
    summary: {
      day,
      rolls,
      itemsCompleted,
      blockersApplied: [],
      blockersCleared,
      columnSnapshot: snapshotColumns(workingItems),
    },
  };
}

// ============= Metrics Calculation =============

export function calculateMetrics(dayHistory: DaySummaryData[], items: WorkItem[], totalDays: number): RoundMetrics {
  // Throughput per day
  const throughputPerDay = Array.from({ length: totalDays }, (_, i) => {
    const daySummary = dayHistory.find((d) => d.day === i + 1);
    return daySummary ? daySummary.itemsCompleted.length : 0;
  });

  // Cycle time per completed item
  const completedItems = items.filter((i) => i.endDay !== null && i.startDay !== null);
  const cycleTimePerItem = completedItems.map((item) => ({
    itemId: item.id,
    completionDay: item.endDay!,
    cycleTime: item.endDay! - item.startDay! + 1,
  }));

  // WIP per day — reconstruct from items
  const wipPerDay = Array.from({ length: totalDays }, (_, dayIdx) => {
    const day = dayIdx + 1;
    return items.filter((item) => {
      if (item.startDay === null) return false;
      if (item.startDay > day) return false;
      if (item.endDay !== null && item.endDay < day) return false;
      return true;
    }).length;
  });

  // CFD per day — use actual column snapshots from day history
  const cfdPerDay = Array.from({ length: totalDays }, (_, dayIdx) => {
    const day = dayIdx + 1;
    const daySummary = dayHistory.find((d) => d.day === day);
    if (daySummary) {
      return { day, ...daySummary.columnSnapshot };
    }
    // Fallback for days without a summary (shouldn't happen)
    return { day, backlog: items.length, analysis: 0, development: 0, test: 0, done: 0 };
  });

  // Averages
  const totalCompleted = completedItems.length;
  const averageCycleTime =
    totalCompleted > 0
      ? cycleTimePerItem.reduce((sum, ct) => sum + ct.cycleTime, 0) / totalCompleted
      : 0;
  const averageWip = wipPerDay.length > 0 ? wipPerDay.reduce((a, b) => a + b, 0) / wipPerDay.length : 0;
  const throughputRate = totalCompleted / totalDays;

  return {
    throughputPerDay,
    cycleTimePerItem,
    wipPerDay,
    cfdPerDay,
    averageCycleTime,
    averageWip,
    throughputRate,
    totalCompleted,
  };
}
