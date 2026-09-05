import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { splitEpic, planSprint, secondsPerPoint, teamIsBusy } from './engine';
import type { ZooGameState } from './types';

// A Sprint takes a Sprint.
//
// Work used to be charged in a lump: a seat played by the game built a five-point habitat in one
// action and sixty-one seconds came off the day at once. A whole forecast went by in a few seconds,
// and the clock you were watching stopped being about anything - reported from playing it, twice.
//
// So the cost is OWED rather than taken. It drains a second per second while the day runs, the team
// takes no new work until it is worked off, and the day timer is the truth about how much building
// time is left.

/** A Sprint under way, with work forecast into it. */
function midSprint(): ZooGameState {
  let s = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = reducer(s, { type: 'ESTIMATE_ITEM', id: it.id, points: it.trueSize ?? 3 });
  const ids = s.backlog.filter((it) => it.status === 'backlog' && !it.unsized).slice(0, 3).map((it) => it.id);
  s = planSprint({ ...s, phase: 'planning' }, ids);
  return { ...s, dayStage: 'building', daySecondsLeft: DAY_SECONDS };
}

describe('what work costs the day', () => {
  it('does not take the cost out of the clock in one jump', () => {
    const s = midSprint();
    const cost = Math.round(secondsPerPoint(s) * 5);
    expect(cost, 'this test needs a cost worth watching').toBeGreaterThan(20);

    const after = reducer(s, { type: 'SPEND_DAY', seconds: cost });
    expect(after.daySecondsLeft, 'the day jumped the moment work was taken on').toBe(s.daySecondsLeft);
    expect(after.owedSeconds, 'the work was taken on and cost nothing').toBe(cost);
  });

  it('works it off a second at a time, with the day', () => {
    let s = reducer(midSprint(), { type: 'SPEND_DAY', seconds: 10 });
    const startedAt = s.daySecondsLeft;
    for (let i = 0; i < 4; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(s.daySecondsLeft, 'the day did not run').toBe(startedAt - 4);
    expect(s.owedSeconds, 'the work did not get worked off').toBe(6);
  });

  it('leaves the team busy until it is done, and free afterwards', () => {
    // This is what stops a whole forecast landing inside one beat: the seats build what they took
    // on before they take anything else.
    let s = reducer(midSprint(), { type: 'SPEND_DAY', seconds: 3 });
    expect(teamIsBusy(s), 'the team took work on and was free the same instant').toBe(true);
    for (let i = 0; i < 3; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    expect(teamIsBusy(s), 'the team was still busy after the work was worked off').toBe(false);
  });

  it('cannot spend more of a Sprint than the Sprint has', () => {
    // The point of the whole arrangement: a Sprint is a fixed box, and the work has to fit in it.
    // Ten days of work taken on at the start of a three-day Sprint does not fit, and the Sprint
    // ends when its days run out rather than when the work is finished.
    let s = reducer(midSprint(), { type: 'SPEND_DAY', seconds: DAY_SECONDS * 10 });
    let ticked = 0;
    while (s.phase === 'sprint' && ticked < DAY_SECONDS * 6) {
      // The days turn over through the Daily Scrum, the way they do in the game.
      if (s.dayStage === 'dailyScrum') { s = reducer(s, { type: 'RUN_DAILY_SCRUM' }); continue; }
      s = reducer(s, { type: 'TICK_DAY' });
      ticked += 1;
    }
    expect(s.phase, 'the Sprint ran past its own length to finish the work').not.toBe('sprint');
    expect(ticked, 'a three-day Sprint took more than three days of clock')
      .toBeLessThanOrEqual(DAY_SECONDS * 3 + 5);
    expect(s.owedSeconds ?? 0, 'work nobody had time for was quietly finished anyway').toBeGreaterThan(0);
  });

  it('is not charged in learn mode, where the clock is paused', () => {
    const s = reducer({ ...midSprint(), learnMode: true }, { type: 'SPEND_DAY', seconds: 30 });
    expect(s.owedSeconds ?? 0, 'learn mode started a clock nobody asked for').toBe(0);
  });
});
