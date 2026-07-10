import type {
  WorkItem,
  DayRollResult,
  DaySummaryData,
  RoundMetrics,
  RoundState,
  ColumnId,
  ColumnSnapshot,
  Specialism,
  StageDef,
} from './types';
import {
  WORK_ITEMS,
  OFF_SPEC_MULTIPLIER,
  BLOCKER_CHANCE,
  BLOCKER_EFFORT,
  stageOf,
  laneOf,
  colId,
  isLastStage,
} from './config';

// ============= Item Factory =============

export function createItems(warmStart = false, stages: StageDef[] = []): WorkItem[] {
  const items: WorkItem[] = WORK_ITEMS.map((def) => ({
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
  if (warmStart) seedWarmStart(items, stages);
  return items;
}

// A "warm start" board: a handful of items already spread across the pipeline so
// the player continues mid-flow instead of pulling everything from an empty
// backlog. Deterministic (a fixed layout, not RNG) so BOTH rounds start from the
// same board and stay comparable. Upstream stages are marked done (0 remaining),
// the current stage is part-worked, and each in-flow item started on day 1. Kept
// under the default 3/3/3 WIP limits, and includes a Done-lane item to pull.
function seedWarmStart(items: WorkItem[], stages: StageDef[]): void {
  // Placement is by pipeline position so it holds for any stage set: the first
  // few items sit part-worked across the opening stages, one waits in a Done lane
  // to pull. Needs at least two stages; degrades to fewer placements otherwise.
  const stageId = (idx: number): Specialism | null => stages[idx]?.id ?? null;
  const place = (
    index: number,
    stageIdx: number,
    lane: 'active' | 'done',
    partialRemaining?: number,
  ) => {
    const item = items[index];
    const sId = stageId(stageIdx);
    if (!item || !sId) return;
    item.column = colId(sId, lane);
    item.startDay = 1;
    // Every earlier stage is finished (0 remaining).
    for (let i = 0; i < stageIdx; i++) {
      const prev = stageId(i);
      if (prev) item.effortRemaining[prev] = 0;
    }
    if (lane === 'done') {
      item.effortRemaining[sId] = 0;
    } else if (partialRemaining !== undefined) {
      item.effortRemaining[sId] = Math.max(0, Math.min(item.effortTotal[sId] ?? 0, partialRemaining));
    }
  };
  // item-1: in the first stage, part-way through it.
  place(0, 0, 'active', 2);
  // item-2: first stage done, part-way through the second.
  place(1, 1, 'active', 3);
  // item-3: through the second stage, waiting in its Done lane to be pulled.
  place(2, 1, 'done');
  // item-4: part-way through the third stage (if one exists).
  place(3, 2, 'active', 2);
}

// ============= Snapshot =============

export function snapshotColumns(items: WorkItem[], stages: StageDef[]): ColumnSnapshot {
  // Aggregate the split lanes back to one band per stage so the CFD stays readable.
  const snap: ColumnSnapshot = { backlog: 0, done: 0 };
  for (const s of stages) snap[s.id] = 0;
  for (const item of items) {
    if (item.column === 'backlog') snap.backlog++;
    else if (item.column === 'done') snap.done++;
    else snap[stageOf(item.column)!] = (snap[stageOf(item.column)!] ?? 0) + 1;
  }
  return snap;
}

// ============= Dice & Randomness =============

/** A pure RNG keyed by arbitrary parts. Same key + same seed → same value, so a
 *  given (day, item, worker) draws identically in BOTH rounds: the variability
 *  is held fixed and only the player's WIP decisions change the outcome. */
export type Rng = (...parts: (string | number)[]) => number;

export function makeSeededRng(seed: number): Rng {
  return (...parts) => {
    let h = seed >>> 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
    }
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  };
}

/** Roll a d6 from the seeded stream, keyed so the draw is reproducible. */
export function rollDie(rng: Rng, ...key: (string | number)[]): number {
  return Math.floor(rng(...key) * 6) + 1;
}

// ============= Blocker Logic =============

export function applyBlockers(items: WorkItem[], day: number, rng: Rng): { items: WorkItem[]; blockedIds: string[] } {
  const blockedIds: string[] = [];
  const updated = items.map((item) => {
    // Only items actively being worked (an Active lane) can get blocked.
    if (laneOf(item.column) !== 'active' || item.blocked) return item;
    if (rng(day, item.id, 'blocker') < BLOCKER_CHANCE) {
      const stage = stageOf(item.column)!;
      blockedIds.push(item.id);
      return { ...item, blocked: true, blockerEffort: BLOCKER_EFFORT[stage] ?? 3 };
    }
    return item;
  });
  return { items: updated, blockedIds };
}

// ============= Day Simulation =============

export function applyDayBlockers(state: RoundState): { items: WorkItem[]; blockedIds: string[] } {
  return applyBlockers(state.items, state.day, makeSeededRng(state.seed));
}

export function simulateDay(state: RoundState, rng: Rng = makeSeededRng(state.seed)): { items: WorkItem[]; summary: DaySummaryData } {
  const day = state.day;

  // Blockers were already applied before the assignment phase — don't re-apply.
  // Workers do their effort; an item that finishes its stage drops into that
  // stage's Done lane (waiting to be PULLED onward — the player decides that,
  // not the engine). No cross-stage advance, no auto-pull from backlog.
  const rolls: DayRollResult[] = [];
  const workingItems = state.items.map((item) => ({ ...item }));
  const blockersCleared: string[] = [];

  for (const assignment of state.assignments) {
    const worker = state.workers.find((w) => w.id === assignment.workerId);
    if (!worker) continue;

    const item = workingItems.find((i) => i.id === assignment.cardId);
    // Workers can only act on items in an Active lane.
    if (!item || laneOf(item.column) !== 'active') continue;

    const stage = stageOf(item.column)!;
    const roll = rollDie(rng, day, item.id, worker.id);
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

  // Finished-this-stage → the item moves on. Analysis/Development drop into their
  // Done lane to wait for the player's pull. Test is the last stage, so a finished
  // test item goes straight to the Done column (no redundant Test-Done lane) and
  // its cycle time is recorded there.
  const advanced: string[] = [];
  const itemsCompleted: string[] = [];
  for (const item of workingItems) {
    if (laneOf(item.column) !== 'active' || item.blocked) continue;
    const stage = stageOf(item.column)!;
    if (item.effortRemaining[stage] <= 0) {
      if (isLastStage(stage, state.stages)) {
        item.column = 'done';
        item.endDay = day;
        itemsCompleted.push(item.id);
      } else {
        item.column = colId(stage, 'done');
        advanced.push(item.id);
      }
    }
  }

  return {
    items: workingItems,
    summary: {
      day,
      rolls,
      itemsCompleted, // test items that finished and reached Done this day
      advanced,
      blockersApplied: [],
      blockersCleared,
      columnSnapshot: snapshotColumns(workingItems, state.stages),
    },
  };
}

// ============= Metrics Calculation =============

export function calculateMetrics(dayHistory: DaySummaryData[], items: WorkItem[], totalDays: number, stages: StageDef[]): RoundMetrics {
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
    const empty: ColumnSnapshot = { backlog: items.length, done: 0 };
    for (const s of stages) empty[s.id] = 0;
    return { day, ...empty };
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
