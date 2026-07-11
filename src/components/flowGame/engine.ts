import type {
  WorkItem,
  DayRollResult,
  DaySummaryData,
  RoundMetrics,
  RoundState,
  ColumnId,
  ColumnSnapshot,
  StageDef,
  StartScenario,
} from './types';
import {
  WORK_ITEMS,
  DEFAULT_WORKFLOW,
  itemEffort,
  OFF_SPEC_MULTIPLIER,
  BLOCKER_CHANCE,
  BLOCKER_EFFORT,
  stageOf,
  laneOf,
  colId,
  isLastStage,
} from './config';

// ============= Item Factory =============

export function createItems(scenario: StartScenario = 'empty', stages: StageDef[] = DEFAULT_WORKFLOW.stages): WorkItem[] {
  const items: WorkItem[] = WORK_ITEMS.map((def, i) => {
    // Effort is generated for the CURRENT stages so a custom pipeline gets real
    // work per stage rather than the fixed analysis/development/test triple.
    const effort = itemEffort(i, stages);
    return {
      id: def.id,
      title: def.title,
      column: 'backlog' as ColumnId,
      effortRemaining: { ...effort },
      effortTotal: { ...effort },
      blocked: false,
      blockerEffort: 0,
      startDay: null,
      endDay: null,
    };
  });
  seedScenario(items, stages, scenario);
  return items;
}

// Seed the board to mimic an established team already mid-flow. Deterministic (a
// fixed layout, not RNG) so BOTH rounds start from the same board and stay
// comparable. Placement is by pipeline position so it holds for any stage set.
//
// In-flight work starts aging from day 1 (startDay = 1), so the board's day
// counter and each card's age always agree — stuck items visibly grow older as
// play goes on. Already-shipped items sit in Done as backstory, dated before the
// round (endDay <= 0); calculateMetrics only counts completions from day 1 on, so
// that history does not distort the round's throughput / cycle-time comparison.
function seedScenario(items: WorkItem[], stages: StageDef[], scenario: StartScenario): void {
  if (scenario === 'empty' || stages.length === 0) return;
  const lastIdx = stages.length - 1;
  let cursor = 0;
  const next = (): WorkItem | null => (cursor < items.length ? items[cursor++] : null);

  // Already delivered before the round (backstory: endDay <= 0 so it is not
  // counted in the round's metrics). `cycle` is the historical cycle time shown
  // on the Done card.
  const ship = (cycle: number) => {
    const it = next();
    if (!it) return;
    it.column = 'done';
    it.startDay = 1 - cycle;
    it.endDay = 0;
    for (const s of stages) it.effortRemaining[s.id] = 0;
  };

  // In flow at a stage from day 1: earlier stages finished, this stage part-worked
  // (active) or finished and waiting to be pulled (done lane).
  const inFlow = (stageIdx: number, lane: 'active' | 'done', remaining: number, blocked = false) => {
    const it = next();
    const sId = stages[stageIdx]?.id;
    if (!it || !sId) return;
    it.column = colId(sId, lane);
    it.startDay = 1;
    for (let i = 0; i < stageIdx; i++) it.effortRemaining[stages[i].id] = 0;
    it.effortRemaining[sId] = lane === 'done' ? 0 : Math.max(1, Math.min(it.effortTotal[sId] ?? 1, remaining));
    if (blocked) {
      it.blocked = true;
      it.blockerEffort = BLOCKER_EFFORT[sId] ?? 3;
    }
  };

  if (scenario === 'healthy') {
    // Steady delivery: a handful shipped, every stage busy but within a ~3 WIP
    // rhythm, plenty still to come in the backlog.
    for (let s = 0; s < 5; s++) ship(4 + s);
    stages.forEach((_, i) => {
      inFlow(i, 'active', 3);
      inFlow(i, 'active', 2);
      if (i !== lastIdx) inFlow(i, 'done', 0);
    });
  } else if (scenario === 'struggling') {
    // Too much WIP: barely anything shipped, the upstream/middle stages jammed
    // well over a 3 WIP limit with a couple of blockers, the last stage starved
    // because nothing reaches it. The stuck work then ages as the round plays out.
    ship(9);
    ship(12);
    const mid = Math.floor(lastIdx / 2);
    stages.forEach((_, i) => {
      if (i === lastIdx && stages.length > 1) return; // downstream starved
      const count = i <= mid ? 5 : 3;                 // WIP breached upstream/mid
      for (let k = 0; k < count; k++) {
        const lane: 'active' | 'done' = k % 2 === 0 ? 'active' : 'done';
        const blocked = lane === 'active' && i === mid && k < 4; // a couple stuck
        inFlow(i, lane, 5, blocked);
      }
    });
  }
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

  // Cycle time per completed item — only items delivered DURING the round
  // (endDay >= 1). Items shipped as pre-seeded backstory (endDay <= 0) are
  // excluded so a mid-flow start does not distort the round's numbers; in-flight
  // items that started before day 1 still count their full age when they finish.
  const completedItems = items.filter((i) => i.endDay !== null && i.endDay >= 1 && i.startDay !== null);
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
