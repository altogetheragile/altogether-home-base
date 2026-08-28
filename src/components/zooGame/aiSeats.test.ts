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
