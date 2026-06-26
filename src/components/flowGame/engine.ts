import type {
  WorkItem,
  DayRollResult,
  DaySummaryData,
  RoundMetrics,
  RoundState,
  ColumnId,
  ColumnSnapshot,
} from './types';
import {
  WORKERS,
  WORK_ITEMS,
  OFF_SPEC_MULTIPLIER,
  BLOCKER_CHANCE,
  BLOCKER_EFFORT,
  stageOf,
  laneOf,
  colId,
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
  // Aggregate the split lanes back to one band per stage so the CFD stays readable.
  const snap: ColumnSnapshot = { backlog: 0, analysis: 0, development: 0, test: 0, done: 0 };
  for (const item of items) {
    if (item.column === 'backlog') snap.backlog++;
    else if (item.column === 'done') snap.done++;
    else snap[stageOf(item.column)!]++;
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
    // Only items actively being worked (an Active lane) can get blocked.
    if (laneOf(item.column) !== 'active' || item.blocked) return item;
    if (Math.random() < BLOCKER_CHANCE) {
      const stage = stageOf(item.column)!;
      blockedIds.push(item.id);
      return { ...item, blocked: true, blockerEffort: BLOCKER_EFFORT[stage] };
    }
    return item;
  });
  return { items: updated, blockedIds };
}

// ============= Day Simulation =============

export function applyDayBlockers(state: RoundState): { items: WorkItem[]; blockedIds: string[] } {
  return applyBlockers(state.items, state.day);
}

export function simulateDay(state: RoundState): { items: WorkItem[]; summary: DaySummaryData } {
  const day = state.day;

  // Blockers were already applied before the assignment phase — don't re-apply.
  // Workers do their effort; an item that finishes its stage drops into that
  // stage's Done lane (waiting to be PULLED onward — the player decides that,
  // not the engine). No cross-stage advance, no auto-pull from backlog.
  const rolls: DayRollResult[] = [];
  const workingItems = state.items.map((item) => ({ ...item }));
  const blockersCleared: string[] = [];

  for (const assignment of state.assignments) {
    const worker = WORKERS.find((w) => w.id === assignment.workerId);
    if (!worker) continue;

    const item = workingItems.find((i) => i.id === assignment.cardId);
    // Workers can only act on items in an Active lane.
    if (!item || laneOf(item.column) !== 'active') continue;

    const stage = stageOf(item.column)!;
    const roll = rollDie();
    const isSpecialist = worker.specialism === stage;
    const multiplier = isSpecialist ? 1 : OFF_SPEC_MULTIPLIER;
    const effectiveWork = Math.round(roll * multiplier);

    rolls.push({ workerId: worker.id, cardId: item.id, roll, effectiveWork, isSpecialist });

    if (item.blocked) {
      item.blockerEffort = Math.max(0, item.blockerEffort - effectiveWork);
      if (item.blockerEffort <= 0) {
        item.blocked = false;
        item.blockerEffort = 0;
        blockersCleared.push(item.id);
      }
    } else {
      item.effortRemaining[stage] = Math.max(0, item.effortRemaining[stage] - effectiveWork);
    }
  }

  // Finished-this-stage → move to the stage's Done lane (intra-stage only).
  for (const item of workingItems) {
    if (laneOf(item.column) !== 'active' || item.blocked) continue;
    const stage = stageOf(item.column)!;
    if (item.effortRemaining[stage] <= 0) {
      item.column = colId(stage, 'done');
    }
  }

  return {
    items: workingItems,
    summary: {
      day,
      rolls,
      itemsCompleted: [], // completion now happens via the player's PULL to Done
      blockersApplied: [],
      blockersCleared,
      columnSnapshot: snapshotColumns(workingItems),
    },
  };
}

// ============= Metrics Calculation =============

export function calculateMetrics(dayHistory: DaySummaryData[], items: WorkItem[], totalDays: number): RoundMetrics {
  // Throughput per day — items now reach Done via the player's PULL, so count by
  // each item's endDay rather than the (now empty) per-day itemsCompleted list.
  const throughputPerDay = Array.from({ length: totalDays }, (_, i) =>
    items.filter((it) => it.endDay === i + 1).length,
  );

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
