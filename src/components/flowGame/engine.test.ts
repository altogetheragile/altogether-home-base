import { describe, it, expect, afterEach, vi } from 'vitest';
import { createItems, simulateDay, applyBlockers, calculateMetrics } from './engine';
import { stageOf, laneOf, colId, pullTarget, stageCount } from './config';
import type { RoundState, WorkItem, DaySummaryData } from './types';

/** Force the d6 to a known value (rollDie = floor(random*6)+1). */
function mockRoll(value: number) {
  // value 1..6 -> random in [(v-1)/6, v/6); pick the midpoint
  vi.spyOn(Math, 'random').mockReturnValue((value - 0.5) / 6);
}
afterEach(() => vi.restoreAllMocks());

function round(items: WorkItem[], over: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    day: 1,
    items,
    assignments: [],
    dayHistory: [],
    wipLimits: null,
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
    mockRoll(4);
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w1', cardId: item.id }] }), // w1 = analysis specialist
    );
    expect(out[0].effortRemaining.analysis).toBe(2); // 6 - 4
    expect(out[0].column).toBe('analysis-active'); // not finished, stays active
  });

  it('an off-spec worker applies 60% of the roll (rounded)', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'analysis-active';
    item.effortRemaining = { analysis: 10, development: 6, test: 6 };
    mockRoll(5);
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w3', cardId: item.id }] }), // w3 = development (off-spec here)
    );
    // round(5 * 0.6) = round(3) = 3
    expect(out[0].effortRemaining.analysis).toBe(7);
  });

  it('finishing a stage moves the item to that stage Done lane (no auto-advance)', () => {
    const items = createItems();
    const item = items[0];
    item.column = 'development-active';
    item.effortRemaining = { analysis: 0, development: 3, test: 6 };
    mockRoll(6); // 6 >= 3 -> finishes development
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w3', cardId: item.id }] }),
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
    mockRoll(6);
    const { items: out } = simulateDay(
      round([a], { assignments: [{ workerId: 'w3', cardId: a.id }] }),
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
    mockRoll(4); // 4 clears the 3-effort blocker
    const { items: out } = simulateDay(
      round([item], { assignments: [{ workerId: 'w1', cardId: item.id }] }),
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
    vi.spyOn(Math, 'random').mockReturnValue(0); // always below BLOCKER_CHANCE
    const { items: out } = applyBlockers(items, 1);
    expect(out[0].blocked).toBe(true); // active -> can block
    expect(out[1].blocked).toBe(false); // done lane -> never
    expect(out[2].blocked).toBe(false); // backlog -> never
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
