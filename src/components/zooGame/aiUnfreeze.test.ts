import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { reducer } from './useZooGame';
import { teamIsBusy, startNextSprint } from './engine';
import { aiTurn } from './aiSeats';
import type { ZooGameState } from './types';

// A debt cannot outlive the day it was taken in.
//
// Reported from a live game: Sprint 2 Planning, the Sprint Goal proposed and the Product Owner
// agreed, and the Developers and the Scrum Master waiting for ever. Nothing was wrong with the
// Planning screen. Seats played by the game take no new move while the team is busy, and "busy"
// was any unpaid second of owed work - which only ever drained during a building day. A second
// taken on late on the last day therefore froze every seat for the rest of the game.

const midSprint = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
  daySecondsLeft: DAY_SECONDS, sprintGoal: 'Deliver the Big Cats zone', sprintGoalAgreed: [],
} as ZooGameState);

describe('what the team owes', () => {
  it('is only ever owed to a day that is being built', () => {
    const owing = { ...midSprint(), owedSeconds: 30 } as ZooGameState;
    expect(teamIsBusy(owing), 'a team building something owed is not busy').toBe(true);
    expect(teamIsBusy({ ...owing, dayStage: 'dailyScrum' } as ZooGameState),
      'the team was still "busy" during an event').toBe(false);
    expect(teamIsBusy({ ...owing, phase: 'planning' } as ZooGameState),
      'the team was still "busy" at Sprint Planning, where nobody is building anything').toBe(false);
  });

  it('does not survive the day it was taken in', () => {
    let s = reducer({ ...midSprint(), daySecondsLeft: 2 }, { type: 'SPEND_DAY', seconds: DAY_SECONDS * 2 });
    expect(s.owedSeconds ?? 0).toBeGreaterThan(0);
    // Run the clock out and turn the day over the way the game does.
    for (let i = 0; i < 5 && s.dayStage !== 'dailyScrum'; i += 1) s = reducer(s, { type: 'TICK_DAY' });
    s = reducer(s, { type: 'RUN_DAILY_SCRUM' });
    expect(s.owedSeconds ?? 0, 'yesterday’s debt was carried into today').toBe(0);
  });

  it('does not survive the Sprint either, so the next one starts free', () => {
    const owing = { ...midSprint(), owedSeconds: 40, phase: 'retro' } as ZooGameState;
    const next = startNextSprint(owing, 'Finish fewer things properly, rather than starting more');
    expect(next.owedSeconds ?? 0, 'a Sprint began owing time to the one before it').toBe(0);
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
