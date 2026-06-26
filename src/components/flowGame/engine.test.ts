import { describe, it, expect } from 'vitest';
import { createItems, simulateDay, applyBlockers, calculateMetrics, makeSeededRng } from './engine';
import type { Rng } from './engine';
import { stageOf, laneOf, colId, pullTarget, stageCount, underfilledStage, bottleneckStage } from './config';
import type { RoundState, WorkItem, DaySummaryData } from './types';

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
    expect(pullTarget('backlog')).toBe('analysis-active');
    expect(pullTarget('analysis-done')).toBe('development-active');
    expect(pullTarget('development-done')).toBe('test-active');
    expect(pullTarget('test-done')).toBe('done');
    // Active lanes and Done are not player-pullable.
    expect(pullTarget('analysis-active')).toBeNull();
    expect(pullTarget('done')).toBeNull();
  });

  it('underfilledStage flags a stage below its limit with upstream work (Maximize WIP)', () => {
    const items = createItems(); // all 20 in backlog
    const limits = { analysis: 3, development: 3, test: 3 };
    // Analysis is empty (0/3) with a full backlog upstream -> underfilled.
    expect(underfilledStage(items, limits)).toBe('analysis');
    // Fill analysis to its limit (all Active, nothing handed to analysis-done yet);
    // now no stage is underfilled — dev/test have no upstream work waiting.
    items[0].column = 'analysis-active';
    items[1].column = 'analysis-active';
    items[2].column = 'analysis-active';
    expect(underfilledStage(items, limits)).toBeNull();
    // Hand one analysis item to its Done lane -> development is now underfilled (fed).
    items[2].column = 'analysis-done';
    expect(underfilledStage(items, limits)).toBe('development');
    // No limits -> never underfilled.
    expect(underfilledStage(items, null)).toBeNull();
  });

  it('bottleneckStage flags a full stage with work queued in front of it', () => {
    const items = createItems();
    const limits = { analysis: 3, development: 2, test: 3 };
    // Development is full (2/2) and Analysis-Done has work waiting to enter it.
    items[0].column = 'development-active';
    items[1].column = 'development-active';
    items[2].column = 'analysis-done';
    items[3].column = 'analysis-done';
    expect(bottleneckStage(items, limits)).toBe('development');
    // Drain development below its limit -> no longer the constraint.
    items[1].column = 'development-done'; // still counts toward dev stage... keep it full
    // Move one dev item onward to test so development stageCount drops to 1 (< 2).
    items[1].column = 'test-active';
    expect(bottleneckStage(items, limits)).toBeNull();
    expect(bottleneckStage(items, null)).toBeNull();
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
    const m = calculateMetrics(dayHistory, items, 5);

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
