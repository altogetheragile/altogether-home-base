import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, startItem, teamIsBusy } from './engine';
import type { ZooGameState } from './types';

// A Sprint takes a Sprint.
//
// Work used to be charged in a lump: a seat played by the game built a five-point habitat in one
// action and sixty-one seconds came off the day at once. A whole forecast went by in a few seconds,
// and the clock you were watching stopped being about anything - reported from playing it, twice.
//
// Not by pricing the work, though. That was tried: each item owing so many seconds of day, drained
// by the clock, and nothing allowed to be Done until its seconds had been spent. It paced a Sprint
// correctly and was a timer you sat and watched. Reported from playing it: "watching a timer count
// down the work is not fun or useful."
//
// A day is a timebox. It runs, it ends, the Sprint has three of them, and what a team gets through
// in one is their velocity - measured at the Review, and what the next Sprint is forecast from.

/** A Sprint under way, with work forecast into it. */
function midSprint(): ZooGameState {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const ids = s.backlog.filter((it) => it.status === 'backlog' && !it.unsized).slice(0, 3).map((it) => it.id);
  s = planSprint({ ...s, phase: 'planning' }, ids);
  return { ...s, dayStage: 'building', daySecondsLeft: DAY_SECONDS };
}

describe('what a day is', () => {
  const held = (s: ZooGameState) => s.backlog.find((x) => x.status === 'committed')!;

  it('does not charge for work being taken on', () => {
    const s = midSprint();
    expect(startItem(s, held(s).id).daySecondsLeft, 'taking work into Doing took a bite out of the day')
      .toBe(s.daySecondsLeft);
  });

  it('runs a second at a time and ends when it runs out', () => {
    let s = midSprint();
    const startedAt = s.daySecondsLeft;
    for (let i = 0; i < 4; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(s.daySecondsLeft, 'the day did not run').toBe(startedAt - 4);
  });

  it('leaves the team busy until what they took on is built', () => {
    // This is what stops a whole forecast landing inside one beat: the seats build what they took
    // on before they take anything else.
    let s = startItem(midSprint(), held(midSprint()).id);
    expect(teamIsBusy(s), 'the team took work on and was free the same instant').toBe(true);
    const it = s.backlog.find((x) => x.started)!;
    s = { ...s, backlog: s.backlog.map((x) => (x.id === it.id ? { ...x, design: { parts: {}, colors: {} } } : x)) } as ZooGameState;
    expect(teamIsBusy(s), 'the team was still busy after the work was built').toBe(false);
  });

  it('cannot give a Sprint more days than the Sprint has', () => {
    // The point of the whole arrangement: a Sprint is a fixed box of days, and it ends when they
    // run out rather than when the work is finished.
    let s = midSprint();
    for (const it of s.backlog.filter((x) => x.status === 'committed')) s = startItem(s, it.id);
    let ticked = 0;
    while (s.phase === 'sprint' && ticked < DAY_SECONDS * 6) {
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
  });

  it('does not run at all in learn mode, where the clock is off', () => {
    const s = { ...midSprint(), learnMode: true } as ZooGameState;
    expect(reducer(s, { type: 'TICK_DAY' }).daySecondsLeft, 'learn mode started a clock nobody asked for')
      .toBe(s.daySecondsLeft);
  });
});
