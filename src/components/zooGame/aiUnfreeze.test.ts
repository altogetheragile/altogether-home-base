import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { teamIsBusy, startNextSprint, startItem, buildLeftOf } from './engine';
import { aiTurn } from './aiSeats';
import type { ZooGameState } from './types';

// Work owed cannot freeze the game.
//
// Reported from a live game: Sprint 2 Planning, the Sprint Goal proposed and the Product Owner
// agreed, and the Developers and the Scrum Master waiting for ever. Nothing was wrong with the
// Planning screen. Seats played by the game take no new move while the team is busy, and "busy"
// was any unpaid second of owed work - which only ever drained during a building day. A second
// taken on late on the last day therefore froze every seat for the rest of the game.
//
// Building still to do is kept on the items now rather than in a pot on the state, and unfinished
// work leaves the Sprint at the Review, so a Sprint cannot begin owing time to the one before it.

const midSprint = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
  daySecondsLeft: DAY_SECONDS, sprintGoal: 'Deliver the Big Cats zone', sprintGoalAgreed: [],
} as ZooGameState);

describe('what the team owes', () => {
  /** A Sprint with one thing taken on, sized bigger than a day so there is building left over. */
  const owing = (over: Partial<ZooGameState> = {}): ZooGameState => {
    const base = { ...midSprint(), ...over } as ZooGameState;
    const it = base.backlog.find((x) => !x.unsized && x.category === 'enclosure')!;
    const s = { ...base, sprintNumber: 1,
      backlog: base.backlog.map((x) => (x.id === it.id
        ? { ...x, status: 'committed' as const, sprintNumber: 1, estimate: 20 } : x)) } as ZooGameState;
    return startItem(s, it.id);
  };

  it('is only ever owed to a day that is being built', () => {
    const s = owing();
    expect(teamIsBusy(s), 'a team building something owed is not busy').toBe(true);
    expect(teamIsBusy({ ...s, dayStage: 'dailyScrum' } as ZooGameState),
      'the team was still "busy" during an event').toBe(false);
    expect(teamIsBusy({ ...s, phase: 'planning' } as ZooGameState),
      'the team was still "busy" at Sprint Planning, where nobody is building anything').toBe(false);
  });

  it('survives the day it was taken in, because unfinished work is still work', () => {
    // The opposite of the old rule, and on purpose. Build time used to be a pot of seconds on the
    // state that a day boundary wiped, so anything that ran past the end of a day was free after
    // midnight - and a person who took on a whole Sprint in the first seconds of Day 1 owed nothing
    // by Day 2. Reported from playing it: "I finished everything 15 seconds into the second day."
    let s = owing({ daySecondsLeft: 2 });
    const id = s.backlog.find((it) => it.started)!.id;
    const left = () => buildLeftOf(s.backlog.find((it) => it.id === id)!);
    expect(left()).toBeGreaterThan(DAY_SECONDS);
    for (let i = 0; i < 5 && s.dayStage !== 'dailyScrum'; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    s = reducer(s, { type: 'RUN_DAILY_SCRUM' });
    expect(left(), 'yesterday’s building was forgiven overnight').toBeGreaterThan(0);
  });

  it('does not survive the Sprint either, so the next one starts free', () => {
    // An unfinished item goes back to the Product Backlog re-sized to what is left of it, and
    // whoever takes it on next takes on that. Seats played by the game take no move while the team
    // is busy, so building owed from Sprint 1 outliving it froze every one of them for good.
    const next = startNextSprint({ ...owing(), phase: 'retro' } as ZooGameState,
      'Finish fewer things properly, rather than starting more');
    expect(next.backlog.every((it) => buildLeftOf(it) === 0),
      'a Sprint began owing building time to the one before it').toBe(true);
    expect(teamIsBusy(next), 'the new Sprint began with the team already busy').toBe(false);
  });
});

describe('the seats that were frozen', () => {
  it('agree the Sprint Goal at the next Planning, whatever last Sprint owed', () => {
    // The exact shape of the report: Sprint 2, topic one, the Goal proposed and the Product Owner
    // agreed. With an unpaid second on the state, every seat played by the game had stopped.
    const planning = {
      ...initialZooState(3), phase: 'planning', sprintNumber: 2, planningTopic: 'why',
      sprintGoal: 'Our goal is to deliver lion and main pathways so that visitors have more to enjoy',
      sprintGoalAgreed: ['product_owner'], owedSeconds: 37,
    } as ZooGameState;
    expect(teamIsBusy(planning), 'Planning counted as the team being busy building').toBe(false);
    for (const seat of ['developer', 'scrum_master'] as const) {
      const move = aiTurn(planning, seat, ['product_owner', 'developer', 'scrum_master']);
      expect(move, `the ${seat} seat had nothing to say at topic one`).toBeTruthy();
      expect(move!.action.type, `the ${seat} seat did not agree the Sprint Goal`).toBe('AGREE_SPRINT_GOAL');
    }
  });
});
