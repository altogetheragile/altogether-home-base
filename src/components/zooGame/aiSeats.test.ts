import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import { reducer } from './useZooGame';
import { splitEpic } from './engine';
import { aiTurn } from './aiSeats';

// AI seats exist so one person can see a whole Scrum Team work. These check that each seat
// only does its own job, that it says why, and - the one that would really bite - that a
// seat cannot get into a loop with itself.

// A Backlog with unsized pieces in it, which is what a split leaves behind and what the
// Developers are for. The bare initial state has no Backlog at all - it is written by the
// wizard - so a fixture without one gives the Developers nothing to do.
const withWork = (seed = 1): ZooGameState =>
  splitEpic(initialZooState(seed), 'bigcats', ['tiger', 'leopard', 'kiosk']);
const at = (over: Partial<ZooGameState>, seed = 1): ZooGameState => ({ ...withWork(seed), ...over });

describe('a seat nobody is sitting in', () => {
  it('has the Developers size the work, and say the number', () => {
    const s = at({ phase: 'refine' });
    const move = aiTurn(s, 'developer');
    expect(move, 'the Developers had nothing to size').not.toBeNull();
    expect(move!.action.type).toBe('ESTIMATE_ITEM');
    expect(move!.says, 'the seat applied a number without saying it').toMatch(/sized .* at \d+/);
  });

  it('does not let the Product Owner size the work', () => {
    // The gate would refuse it anyway, but a seat that keeps trying something it may not do
    // would sit there proposing refused moves forever.
    const s = at({ phase: 'refine' });
    expect(aiTurn(s, 'product_owner'), 'the Product Owner tried to size the work').toBeNull();
  });

  it('has the Scrum Master hold the Daily Scrum rather than skip it', () => {
    const s = at({ phase: 'sprint', dayStage: 'dailyScrum' });
    const move = aiTurn(s, 'scrum_master')!;
    expect(move.action.type).toBe('RUN_DAILY_SCRUM');
    expect(move.says).toMatch(/Daily Scrum/);
    // and it is not their job to size or to pull
    expect(aiTurn(at({ phase: 'refine' }), 'scrum_master')).toBeNull();
  });

  it('has the Product Owner take the visitors’ feedback onto the Backlog', () => {
    const s = at({ phase: 'review', signals: [{ suggestion: 'Somewhere to eat', drivenBy: 'food', estimatedValue: 'high' }] });
    const move = aiTurn(s, 'product_owner')!;
    expect(move.action.type).toBe('ACCEPT_SIGNAL');
    expect(move.says).toMatch(/Somewhere to eat/);
    // ...and nobody else may decide what goes on the Backlog
    expect(aiTurn(s, 'developer')).toBeNull();
    expect(aiTurn(s, 'scrum_master')).toBeNull();
  });

  it('will not let one person decree the Sprint Goal', () => {
    // "A PO can propose a Sprint Goal, but the Scrum Team must all agree." The Guide: the
    // Product Owner proposes how the product could increase in value, and the whole Scrum
    // Team then collaborates to define the Goal. So a typed sentence is a proposal.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    expect(s.sprintGoalAgreed, 'writing it counted as agreeing to it').toHaveLength(0);

    for (const seat of ['developer', 'scrum_master', 'product_owner'] as const) {
      const move = aiTurn(s, seat);
      expect(move, `the ${seat} never said whether they agreed`).not.toBeNull();
      expect(move!.action.type).toBe('AGREE_SPRINT_GOAL');
      s = reducer(s, move!.action);
    }
    expect(s.sprintGoalAgreed.sort()).toEqual(['developer', 'product_owner', 'scrum_master']);
  });

  it('clears the agreement when the wording changes', () => {
    // The agreement was to the words that were there. Carrying it silently across a rewrite
    // is how a Sprint Goal becomes one person's sentence with everybody's name on it.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'developer' });
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'scrum_master' });
    expect(s.sprintGoalAgreed).toHaveLength(2);

    s = reducer(s, { type: 'SET_SPRINT_GOAL', goal: 'Something else entirely' });
    expect(s.sprintGoalAgreed, 'agreement survived a rewrite').toHaveLength(0);

    // ...but tidying the same sentence is not a new Goal
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'developer' });
    s = reducer(s, { type: 'SET_SPRINT_GOAL', goal: '  Something else entirely  ' });
    expect(s.sprintGoalAgreed, 'trimming whitespace threw the agreement away').toHaveLength(1);
  });

  it('gets a lone Product Owner through Sprint Planning', () => {
    // The reported deadlock. Sitting as Product Owner, topic three needs steps, SET_TASKS is
    // the Developers' and correctly refused - so with nobody in those seats the game sat on
    // "5 items have no steps yet" forever and Start Sprint stayed disabled.
    let s = at({ phase: 'planning', sprintGoal: 'Open the Big Cats zone' });
    const moves: string[] = [];
    for (let i = 0; i < 200; i += 1) {
      const move = aiTurn(s, 'developer');
      if (!move) break;
      moves.push(move.action.type);
      s = reducer(s, move.action);
    }
    expect(moves, 'the Developers never selected anything').toContain('SET_FORECAST');
    expect(moves, 'the Developers never planned the steps').toContain('SET_TASKS');
    expect(s.forecast.length, 'nothing was forecast').toBeGreaterThan(0);
    const unplanned = s.backlog.filter((it) => s.forecast.includes(it.id) && !(it.tasks ?? []).some((t) => t.label.trim()));
    expect(unplanned, 'items were left without steps, so Start Sprint stays disabled').toHaveLength(0);
  });

  it('lets every seat get a turn, rather than one starving the others', () => {
    // The reported symptom: Developers and Product Owner agreed, the Scrum Master sat on
    // "waiting" forever. The cause was upstream - an AI move was judged against whoever was
    // sitting at the browser, so every Developer action was refused while a human held the
    // Product Owner seat, and the loop returned on that seat every tick without ever
    // reaching the Scrum Master. This pins the sequence the loop is supposed to produce.
    const ai = ['developer', 'scrum_master'] as const;
    let s: ZooGameState = { ...withWork(1), phase: 'planning', sprintGoal: 'Open the Grounds zone' };
    s = reducer(s, { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' });
    for (let i = 0; i < 60; i += 1) {
      let took = null;
      for (const seat of ai) { const m = aiTurn(s, seat); if (m) { took = m; break; } }
      if (!took) break;
      s = reducer(s, took.action);
    }
    expect(s.sprintGoalAgreed.sort(), 'somebody never got to agree')
      .toEqual(['developer', 'product_owner', 'scrum_master']);
  });

  it('runs out of things to do instead of looping', () => {
    // The property that matters most: each move has to make its own condition stop holding,
    // or a seat sits there sizing the same item forever and burns a session down.
    let s = at({ phase: 'refine' });
    let moves = 0;
    for (let i = 0; i < 500; i += 1) {
      const move = aiTurn(s, 'developer');
      if (!move) break;
      s = reducer(s, move.action);
      moves += 1;
    }
    expect(moves, 'the Developers had nothing to do at all').toBeGreaterThan(0);
    expect(moves, 'the seat looped instead of finishing').toBeLessThan(500);
    expect(aiTurn(s, 'developer'), 'it should be finished once everything is sized').toBeNull();
  });

  it('stays deterministic, so a trainer can still replay a seed', () => {
    // The plan worried that AI seats would cost the reproducibility a shared debrief leans
    // on. These ones do not: same seed, same state, same move.
    const a = aiTurn(at({ phase: 'refine' }), 'developer')!;
    const b = aiTurn(at({ phase: 'refine' }), 'developer')!;
    expect(a).toEqual(b);
    const other = aiTurn(at({ phase: 'refine' }, 2), 'developer')!;
    expect(other.action).not.toEqual(a.action);   // a different seed sizes differently
  });
});
