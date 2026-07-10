import { describe, it, expect } from 'vitest';
import { createItems, simulateDay, applyBlockers, calculateMetrics, makeSeededRng } from './engine';
import type { Rng } from './engine';
import { WORKERS, DEFAULT_WORKFLOW, itemEffort, stageOf, laneOf, colId, pullTarget, stageCount, underfilledStage, bottleneckStage } from './config';
import type { RoundState, WorkItem, DaySummaryData, StageDef } from './types';

/** The default three stages, passed to the stage-aware helpers under test. */
const S = DEFAULT_WORKFLOW.stages;

/** A stub RNG that makes every d6 roll a known value (rollDie = floor(rng*6)+1). */
function fixedRoll(value: number): Rng {
  return () => (value - 0.5) / 6; // midpoint of the bucket that maps to `value`
}
/** A stub RNG returning a constant 0..1 (e.g. 0 always blocks, 1 never blocks). */
function fixedRng(value: number): Rng {
  return () => value;
}

function round(items: WorkItem[], over: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    day: 1,
    items,
    assignments: [],
    dayHistory: [],
    wipLimits: null,
    enforceWip: false,
    maximizeWip: false,
    seed: 1,
    dayPhase: 'assign',
    newBlockers: [],
    workers: WORKERS,
    stages: DEFAULT_WORKFLOW.stages,
    ...over,
  };
}

describe('flow game config helpers', () => {
  it('classifies columns into stage + lane', () => {
    expect(stageOf('analysis-active')).toBe('analysis');
    expect(stageOf('development-done')).toBe('development');
    expect(stageOf('backlog')).toBeNull();
    expect(stageOf('done')).toBeNull();
    expect(laneOf('test-active')).toBe('active');
    expect(laneOf('test-done')).toBe('done');
    expect(laneOf('backlog')).toBeNull();
    expect(colId('analysis', 'done')).toBe('analysis-done');
  });

  it('maps the player pull path Backlog -> stages -> Done', () => {
    expect(pullTarget('backlog', S)).toBe('analysis-active');
    expect(pullTarget('analysis-done', S)).toBe('development-active');
    expect(pullTarget('development-done', S)).toBe('test-active');
    expect(pullTarget('test-done', S)).toBe('done');
    // Active lanes and Done are not player-pullable.
    expect(pullTarget('analysis-active', S)).toBeNull();
    expect(pullTarget('done', S)).toBeNull();
  });

  it('underfilledStage flags a stage below its limit with upstream work (Maximize WIP)', () => {
    const items = createItems(); // all 20 in backlog
    const limits = { analysis: 3, development: 3, test: 3 };
    // Analysis is empty (0/3) with a full backlog upstream -> underfilled.
    expect(underfilledStage(items, limits, S)).toBe('analysis');
    // Fill analysis to its limit (all Active, nothing handed to analysis-done yet);
    // now no stage is underfilled — dev/test have no upstream work waiting.
    items[0].column = 'analysis-active';
    items[1].column = 'analysis-active';
    items[2].column = 'analysis-active';
    expect(underfilledStage(items, limits, S)).toBeNull();
    // Hand one analysis item to its Done lane -> development is now underfilled (fed).
    items[2].column = 'analysis-done';
    expect(underfilledStage(items, limits, S)).toBe('development');
    // No limits -> never underfilled.
    expect(underfilledStage(items, null, S)).toBeNull();
  });

  it('bottleneckStage flags a full stage with work queued in front of it', () => {
    const items = createItems();
    const limits = { analysis: 3, development: 2, test: 3 };
    // Development is full (2/2) and Analysis-Done has work waiting to enter it.
    items[0].column = 'development-active';
    items[1].column = 'development-active';
    items[2].column = 'analysis-done';
    items[3].column = 'analysis-done';
    expect(bottleneckStage(items, limits, S)).toBe('development');
    // Drain development below its limit -> no longer the constraint.
    items[1].column = 'development-done'; // still counts toward dev stage... keep it full
    // Move one dev item onward to test so development stageCount drops to 1 (< 2).
    items[1].column = 'test-active';
    expect(bottleneckStage(items, limits, S)).toBeNull();
    expect(bottleneckStage(items, null, S)).toBeNull();
  });

  it('a full first stage with only the backlog behind it is NOT a bottleneck', () => {
    // Analysis at its WIP limit (3/3) with a full backlog is the pull system
    // working, not a constraint - the backlog is raw demand, not stuck work.
    const items = createItems();
    const limits = { analysis: 3, development: 3, test: 3 };
    items[0].column = 'analysis-active';
    items[1].column = 'analysis-active';
    items[2].column = 'analysis-active'; // Analysis full; items[3..] stay in backlog
    expect(bottleneckStage(items, limits, S)).toBeNull();
  });

  it('stageCount counts both lanes of a stage (what WIP caps)', () => {
    const items = createItems();
    items[0].column = 'analysis-active';
    items[1].column = 'analysis-done';
    items[2].column = 'development-active';
    expect(stageCount(items, 'analysis')).toBe(2);
    expect(stageCount(items, 'development')).toBe(1);
    expect(stageCount(items, 'test')).toBe(0);
  });
});

describe('createItems', () => {
  it('starts every item in the backlog with full effort and no dates', () => {
    const items = createItems();
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.column).toBe('backlog');
      expect(it.startDay).toBeNull();
      expect(it.endDay).toBeNull();
      expect(it.effortRemaining).toEqual(it.effortTotal);
    }
  });

  it('warm start seeds work across the pipeline (upstream done, started day 1, rest in backlog)', () => {
    const items = createItems(true, S);
    const inFlow = items.filter((i) => i.column !== 'backlog');
    expect(inFlow.length).toBeGreaterThan(0);
    // Seeded items are mid-flow: entered on day 1, not yet finished.
    for (const it of inFlow) {
      expect(it.startDay).toBe(1);
      expect(it.endDay).toBeNull();
    }
    // Work sits in every active stage, and the rest stays in the backlog.
    const cols = new Set(inFlow.map((i) => i.column));
    expect(cols.has('analysis-active')).toBe(true);
    expect(cols.has('development-active')).toBe(true);
    expect(cols.has('test-active')).toBe(true);
    expect(items.some((i) => i.column === 'backlog')).toBe(true);
    // A development item has its upstream (analysis) stage complete.
    const devItem = inFlow.find((i) => i.column === 'development-active')!;
    expect(devItem.effortRemaining.analysis).toBe(0);
  });
});

describe('simulateDay — worker effort', () => {
  it('a specialist reduces the current stage effort by the full roll', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'analysis-active';
    item.effortRemaining = { analysis: 6, development: 6, test: 6 };
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w1', cardId: item.id }] }), // w1 = analysis specialist
      fixedRoll(4),
    );
    expect(out[0].effortRemaining.analysis).toBe(2); // 6 - 4
    expect(out[0].column).toBe('analysis-active'); // not finished, stays active
  });

  it('an off-spec worker applies 60% of the roll (rounded)', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'analysis-active';
    item.effortRemaining = { analysis: 10, development: 6, test: 6 };
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w3', cardId: item.id }] }), // w3 = development (off-spec here)
      fixedRoll(5),
    );
    // round(5 * 0.6) = round(3) = 3
    expect(out[0].effortRemaining.analysis).toBe(7);
  });

  it('finishing a stage moves the item to that stage Done lane (no auto-advance)', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'development-active';
    item.effortRemaining = { analysis: 0, development: 3, test: 6 };
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w3', cardId: item.id }] }),
      fixedRoll(6), // 6 >= 3 -> finishes development
    );
    expect(out[0].effortRemaining.development).toBe(0);
    expect(out[0].column).toBe('development-done'); // waits to be pulled, does NOT jump to test
    expect(out[0].endDay).toBeNull(); // completion only happens on pull to Done
  });

  it('reports items that finished a stage this day in summary.advanced', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'development-active';
    item.effortRemaining = { analysis: 0, development: 3, test: 6 };
    const { summary } = simulateDay(
      round([item], { assignments: [{ workerId: 'w3', cardId: item.id }] }),
      fixedRoll(6), // finishes development this day
    );
    expect(summary.advanced).toEqual([item.id]);
  });

  it('a finished TEST item goes straight to Done (no Test-Done lane) and is recorded complete', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'test-active';
    item.startDay = 1;
    item.effortRemaining = { analysis: 0, development: 0, test: 3 };
    const { items: out, summary } = simulateDay(
      round([item], { day: 5, assignments: [{ workerId: 'w5', cardId: item.id }] }), // w5 = test specialist
      fixedRoll(6), // finishes test this day
    );
    expect(out[0].column).toBe('done');       // completed, not 'test-done'
    expect(out[0].endDay).toBe(5);            // cycle time recorded here
    expect(summary.itemsCompleted).toEqual([item.id]);
    expect(summary.advanced).not.toContain(item.id);
  });

  it('does not work items sitting in a Done lane or backlog', () => {
    const items = createItems();
    const a = items[0];
    a.column = 'analysis-done';
    a.effortRemaining = { analysis: 0, development: 6, test: 6 };
    const { items: out } = simulateDay(
      round([a], { assignments: [{ workerId: 'w3', cardId: a.id }] }),
      fixedRoll(6),
    );
    expect(out[0].column).toBe('analysis-done'); // untouched
    expect(out[0].effortRemaining.development).toBe(6);
  });
});

describe('simulateDay — blockers', () => {
  it('work clears the blocker first, then the item is workable again', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'analysis-active';
    item.blocked = true;
    item.blockerEffort = 3;
    item.effortRemaining = { analysis: 6, development: 6, test: 6 };
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w1', cardId: item.id }] }),
      fixedRoll(4), // 4 clears the 3-effort blocker
    );
    expect(out[0].blocked).toBe(false);
    expect(out[0].blockerEffort).toBe(0);
    expect(out[0].effortRemaining.analysis).toBe(6); // effort untouched while clearing blocker
  });
});

describe('applyBlockers', () => {
  it('only items in an Active lane can become blocked', () => {
    const items = createItems();
    items[0].column = 'analysis-active';
    items[1].column = 'analysis-done';
    items[2].column = 'backlog';
    const { items: out } = applyBlockers(items, 1, fixedRng(0)); // 0 < BLOCKER_CHANCE -> always blocks
    expect(out[0].blocked).toBe(true); // active -> can block
    expect(out[1].blocked).toBe(false); // done lane -> never
    expect(out[2].blocked).toBe(false); // backlog -> never
  });
});

describe('makeSeededRng', () => {
  it('is deterministic for a seed+key and varies across keys (fair, reproducible luck)', () => {
    const a = makeSeededRng(42);
    const b = makeSeededRng(42);
    // same seed + same key -> identical draw (so both rounds see the same variability)
    expect(a(5, 'item-3', 'w1')).toBe(b(5, 'item-3', 'w1'));
    // different keys generally differ
    expect(a(5, 'item-3', 'w1')).not.toBe(a(6, 'item-3', 'w1'));
    // a different seed gives a different stream
    expect(makeSeededRng(43)(5, 'item-3', 'w1')).not.toBe(a(5, 'item-3', 'w1'));
    // every draw is a valid probability
    for (let d = 1; d <= 20; d++) {
      const v = a(d, 'item-1', 'w2');
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('calculateMetrics', () => {
  it('derives cycle time, throughput and totals from pulled-to-Done items', () => {
    const items = createItems().slice(0, 3);
    // item 1: started day 1, done day 5  -> cycle 5
    items[0].column = 'done'; items[0].startDay = 1; items[0].endDay = 5;
    // item 2: started day 2, done day 5  -> cycle 4
    items[1].column = 'done'; items[1].startDay = 2; items[1].endDay = 5;
    // item 3: still in flow, never completed
    items[2].column = 'development-active'; items[2].startDay = 3; items[2].endDay = null;

    const dayHistory: DaySummaryData[] = [];
    const m = calculateMetrics(dayHistory, items, 5, S);

    expect(m.totalCompleted).toBe(2);
    expect(m.cycleTimePerItem.map((c) => c.cycleTime).sort()).toEqual([4, 5]);
    expect(m.averageCycleTime).toBeCloseTo(4.5);
    expect(m.throughputRate).toBeCloseTo(2 / 5);
    // throughput is keyed by endDay: both completed on day 5
    expect(m.throughputPerDay).toEqual([0, 0, 0, 0, 2]);
    // WIP per day counts items in flow (started, not yet done) — day 3: items 1,2,3 all active
    expect(m.wipPerDay[2]).toBe(3);
  });
});

describe('configurable workflow', () => {
  const CUSTOM: StageDef[] = [
    { id: 'design', name: 'Design' },
    { id: 'build', name: 'Build' },
    { id: 'qa', name: 'QA' },
    { id: 'release', name: 'Release' },
  ];

  it('itemEffort reproduces the default triple for the default three stages', () => {
    // pattern[0] = [4, 8, 4] keyed by analysis/development/test.
    expect(itemEffort(0, S)).toEqual({ analysis: 4, development: 8, test: 4 });
  });

  it('a custom pipeline gets real per-stage effort (added stages are not free)', () => {
    const items = createItems(false, CUSTOM);
    expect(Object.keys(items[0].effortTotal).sort()).toEqual(['build', 'design', 'qa', 'release']);
    // Every stage carries positive effort, so nothing passes straight through.
    for (const s of CUSTOM) expect(items[0].effortTotal[s.id]).toBeGreaterThan(0);
    expect(items[0].effortRemaining).toEqual(items[0].effortTotal);
  });

  it('maps the pull path across an arbitrary number of stages', () => {
    expect(pullTarget('backlog', CUSTOM)).toBe('design-active');
    expect(pullTarget('design-done', CUSTOM)).toBe('build-active');
    expect(pullTarget('qa-done', CUSTOM)).toBe('release-active');
    // The last stage completes straight to Done.
    expect(pullTarget('release-done', CUSTOM)).toBe('done');
  });

  it('the configured last stage completes to Done (not a hardcoded "test")', () => {
    const item = createItems(false, CUSTOM)[0];
    item.column = 'release-active';
    item.startDay = 1;
    item.effortRemaining = { design: 0, build: 0, qa: 0, release: 3 };
    const { items: out, summary } = simulateDay(
      round([item], { stages: CUSTOM, day: 4, assignments: [{ workerId: 'w1', cardId: item.id }] }),
      fixedRoll(6), // off-spec 60% of 6 = round(3.6) = 4 >= 3 -> finishes
    );
    expect(out[0].column).toBe('done');
    expect(out[0].endDay).toBe(4);
    expect(summary.itemsCompleted).toEqual([item.id]);
  });
});

import { autoPlayRound, sweepWipLimit, findSweetSpot } from './experiment';

describe('WIP sweep experiment', () => {
  it('auto-play is deterministic for a given WIP limit + seed', () => {
    const a = autoPlayRound(3);
    const b = autoPlayRound(3);
    expect(a.totalCompleted).toBe(b.totalCompleted);
    expect(a.averageCycleTime).toBe(b.averageCycleTime);
    expect(a.throughputRate).toBe(b.throughputRate);
  });

  it('a too-low WIP limit starves throughput vs a healthy one', () => {
    const starved = autoPlayRound(1);
    const healthy = autoPlayRound(4);
    expect(healthy.throughputRate).toBeGreaterThan(starved.throughputRate);
  });

  it('sweep covers the range and finds a sweet spot at near-max throughput', () => {
    const sweep = sweepWipLimit(1, 8);
    expect(sweep.map((p) => p.wipLimit)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const maxThr = Math.max(...sweep.map((p) => p.throughputRate));
    const sweet = findSweetSpot(sweep)!;
    expect(sweet).not.toBeNull();
    // The sweet spot delivers near-max throughput...
    expect(sweet.throughputRate).toBeGreaterThanOrEqual(maxThr * 0.95);
    // ...at the LEAST WIP that does so (no earlier point qualifies).
    const earlier = sweep.filter((p) => p.wipLimit < sweet.wipLimit);
    for (const p of earlier) expect(p.throughputRate).toBeLessThan(maxThr * 0.95);
  });
});

import { keepActiveAssignments } from './useFlowGame';

describe('keepActiveAssignments (workers stay on unfinished work)', () => {
  it('keeps a worker whose card is still in an active lane, drops one whose card finished', () => {
    const items = createItems();
    items[0].column = 'analysis-active';    // still being worked
    items[1].column = 'development-done';   // finished its stage this day
    items[2].column = 'done';               // completed
    const assignments = [
      { workerId: 'w1', cardId: items[0].id },
      { workerId: 'w3', cardId: items[1].id },
      { workerId: 'w5', cardId: items[2].id },
    ];
    const kept = keepActiveAssignments(assignments, items);
    expect(kept).toEqual([{ workerId: 'w1', cardId: items[0].id }]);
  });

  it('drops an assignment whose card no longer exists', () => {
    const items = createItems();
    items[0].column = 'analysis-active';
    const kept = keepActiveAssignments([{ workerId: 'w1', cardId: 'ghost' }], items);
    expect(kept).toEqual([]);
  });
});
