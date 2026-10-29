import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { ZooGameState } from './types';
import { reducer } from './useZooGame';
import { splitEpic, pokerHand } from './engine';
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

  it('has the Product Owner take the visitors’ feedback onto the Product Backlog', () => {
    const s = at({ phase: 'review', signals: [{ suggestion: 'Somewhere to eat', drivenBy: 'food', estimatedValue: 'high' }] });
    const move = aiTurn(s, 'product_owner')!;
    expect(move.action.type).toBe('ACCEPT_SIGNAL');
    expect(move.says).toMatch(/Somewhere to eat/);
    // ...and nobody else may decide what goes on the Product Backlog
    expect(aiTurn(s, 'developer')).toBeNull();
    expect(aiTurn(s, 'scrum_master')).toBeNull();
  });

  it('never plays the Developers, at any point in the game', () => {
    // Al, 29 Oct 2026: "The AI building is just too clunky. Let a player take all the roles." The
    // game sizes nothing, forecasts nothing, plans nothing and builds nothing.
    for (const phase of ['refine', 'planning', 'sprint', 'review', 'retro'] as const) {
      for (const dayStage of ['building', 'dailyScrum'] as const) {
        const s = at({ phase, dayStage, sprintGoal: 'Open the Big Cats zone', planningTopic: 'what' });
        expect(aiTurn(s, 'developer'), `the game played the Developers in ${phase}`).toBeNull();
      }
    }
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

  it('stays deterministic, so a trainer can still replay a seed', () => {
    // The plan worried that AI seats would cost the reproducibility a shared debrief leans
    // on. These ones do not: same seed, same state, same move.
    const review = () => at({ phase: 'review', signals: [{ suggestion: 'Somewhere to eat', drivenBy: 'food', estimatedValue: 'high' }] });
    const a = aiTurn(review(), 'product_owner')!;
    const b = aiTurn(review(), 'product_owner')!;
    expect(a, 'the Product Owner had nothing to do, so nothing is being tested').toBeTruthy();
    expect(a).toEqual(b);
    // A different seed deals a different hand. Whether it lands on a different NUMBER is a
    // different question: the Fibonacci scale has 1, 2 and 3 at the small end, and most items in
    // this game are small - a habitat is eight points and an animal is two. See `effortOf`.
    const it = at({ phase: 'refine' }).backlog.find((x) => x.unsized && x.category !== 'epic')!;
    expect(pokerHand(it, 1)).not.toEqual(pokerHand(it, 2));
  });
});
