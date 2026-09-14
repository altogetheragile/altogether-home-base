import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import { teamIsBusy, startNextSprint, startItem, reviewSprint } from './engine';
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

describe('what the team is busy with', () => {
  /** A Sprint with something taken on and not built yet. */
  const owing = (over: Partial<ZooGameState> = {}): ZooGameState => {
    const base = { ...midSprint(), ...over } as ZooGameState;
    const it = base.backlog.find((x) => !x.unsized && x.category === 'enclosure')!;
    const s = { ...base, sprintNumber: 1,
      backlog: base.backlog.map((x) => (x.id === it.id
        ? { ...x, status: 'committed' as const, sprintNumber: 1 } : x)) } as ZooGameState;
    return startItem(s, it.id);
  };

  it('is only ever busy on a day that is being built', () => {
    const s = owing();
    expect(teamIsBusy(s), 'a team with work taken on and not built is not busy').toBe(true);
    expect(teamIsBusy({ ...s, dayStage: 'dailyScrum' } as ZooGameState),
      'the team was still "busy" during an event').toBe(false);
    expect(teamIsBusy({ ...s, phase: 'planning' } as ZooGameState),
      'the team was still "busy" at Sprint Planning, where nobody is building anything').toBe(false);
  });

  it('is not a debt that can outlive anything', () => {
    // It used to be a pot of seconds on the state, and seats played by the game take no move while
    // the team is busy - so one unpaid second from Sprint 1 froze every one of them for the rest of
    // the game. Busy is now a fact about the work on the board: taken on, not built yet.
    const s = owing();
    const built = { ...s, backlog: s.backlog.map((x) => (x.started
      ? { ...x, design: { parts: {}, colors: {} } } : x)) } as ZooGameState;
    expect(teamIsBusy(built), 'the work was built and the team was still busy with it').toBe(false);
  });

  it('does not follow them into the next Sprint', () => {
    // Unfinished work leaves the Sprint at the Review, re-sized to what is left of it, so nothing
    // arrives in the next one already half taken on.
    const next = startNextSprint(reviewSprint(owing()),
      'Finish fewer things properly, rather than starting more');
    expect(next.backlog.some((it) => it.status === 'committed' && it.started && !it.design),
      'a Sprint began with work already taken on from the one before it').toBe(false);
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
