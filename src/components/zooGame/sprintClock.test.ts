import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, startItem, buildCost, buildLeftOf, teamIsBusy } from './engine';
import type { ZooGameState } from './types';

// A Sprint takes a Sprint.
//
// Work used to be charged in a lump: a seat played by the game built a five-point habitat in one
// action and sixty-one seconds came off the day at once. A whole forecast went by in a few seconds,
// and the clock you were watching stopped being about anything - reported from playing it, twice.
//
// So the cost is BUILDING STILL TO DO rather than time taken off a clock. It is written on the item
// when the Developers take it on, it draws down a second per second while the day runs - shared
// between whatever else is in flight - and nothing may be moved to Done until its own is finished.
// The day timer is then the truth about how much building time is left.

/** A Sprint under way, with work forecast into it. */
function midSprint(): ZooGameState {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const ids = s.backlog.filter((it) => it.status === 'backlog' && !it.unsized).slice(0, 3).map((it) => it.id);
  s = planSprint({ ...s, phase: 'planning' }, ids);
  return { ...s, dayStage: 'building', daySecondsLeft: DAY_SECONDS };
}

describe('what work costs the day', () => {
  /** The first thing in the Sprint, taken on. */
  const taken = (s: ZooGameState = midSprint()) => {
    const it = s.backlog.find((x) => x.status === 'committed')!;
    return { before: s, item: it, after: startItem(s, it.id) };
  };
  const leftOn = (s: ZooGameState, id: string) => buildLeftOf(s.backlog.find((x) => x.id === id)!);

  it('does not take the cost out of the clock in one jump', () => {
    const { before, item, after } = taken();
    expect(buildCost(before, item), 'this test needs a cost worth watching').toBeGreaterThan(20);
    expect(after.daySecondsLeft, 'the day jumped the moment work was taken on').toBe(before.daySecondsLeft);
    expect(leftOn(after, item.id), 'the work was taken on and cost nothing')
      .toBeCloseTo(buildCost(before, item), 5);
  });

  it('works it off a second at a time, with the day', () => {
    const { before, item } = taken();
    let s = startItem(before, item.id);
    const startedAt = s.daySecondsLeft;
    for (let i = 0; i < 4; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(s.daySecondsLeft, 'the day did not run').toBe(startedAt - 4);
    expect(leftOn(s, item.id), 'the work did not get worked off')
      .toBeCloseTo(buildCost(before, item) - 4, 5);
  });

  it('leaves the team busy until it is done, and free afterwards', () => {
    // This is what stops a whole forecast landing inside one beat: the seats build what they took
    // on before they take anything else.
    const { before, item } = taken();
    let s = startItem(before, item.id);
    expect(teamIsBusy(s), 'the team took work on and was free the same instant').toBe(true);
    for (let i = 0; i < Math.ceil(buildCost(before, item)); i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(teamIsBusy(s), 'the team was still busy after the work was worked off').toBe(false);
  });

  it('cannot spend more of a Sprint than the Sprint has', () => {
    // The point of the whole arrangement: a Sprint is a fixed box, and the work has to fit in it.
    // Everything in the Sprint taken on at once does not fit in three days, and the Sprint ends
    // when its days run out rather than when the work is finished.
    // Sized far bigger than the Sprint, so that what is taken on cannot possibly fit in the days.
    let s = midSprint();
    s = { ...s, backlog: s.backlog.map((it) => (it.status === 'committed' ? { ...it, estimate: 20 } : it)) } as ZooGameState;
    for (const it of s.backlog.filter((x) => x.status === 'committed')) s = startItem(s, it.id);
    expect(s.backlog.reduce((n, it) => n + buildLeftOf(it), 0), 'this test needs more work than a Sprint holds')
      .toBeGreaterThan(DAY_SECONDS * 3);
    let ticked = 0;
    while (s.phase === 'sprint' && ticked < DAY_SECONDS * 6) {
      // The days turn over through the Daily Scrum, the way they do in the game.
      if (s.pendingImpediment) { s = reducer(s, { type: 'ANSWER_IMPEDIMENT', how: 'remove' }); continue; }
      if (s.dayStage === 'dailyScrum') { s = reducer(s, { type: 'RUN_DAILY_SCRUM' }); continue; }
      s = reducer(s, { type: 'TICK_DAY' });
      ticked += 1;
    }
    expect(s.phase, 'the Sprint ran past its own length to finish the work').not.toBe('sprint');
    expect(ticked, 'a three-day Sprint took more than three days of clock')
      .toBeLessThanOrEqual(DAY_SECONDS * 3 + 5);
    // ...and the work nobody had time for is not quietly finished: it goes back to the Product Backlog.
    expect(s.backlog.some((it) => it.carriedOver || it.status === 'backlog'),
      'work nobody had time for was quietly finished anyway').toBe(true);
    // Half-built work does not come back half-built. It is re-sized to what is left of it, and
    // whoever takes it on next takes on that - so nothing carries a debt across a Sprint boundary.
    expect(s.backlog.every((it) => buildLeftOf(it) === 0),
      'building owed in one Sprint was still owed in the next').toBe(true);
  });

  it('is not charged in learn mode, where the clock is paused', () => {
    // Nothing drains while the clock is off, so anything charged then could never be finished.
    const s = { ...midSprint(), learnMode: true } as ZooGameState;
    const it = s.backlog.find((x) => x.status === 'committed')!;
    expect(buildLeftOf(startItem(s, it.id).backlog.find((x) => x.id === it.id)!),
      'learn mode started a clock nobody asked for').toBe(0);
  });
});
