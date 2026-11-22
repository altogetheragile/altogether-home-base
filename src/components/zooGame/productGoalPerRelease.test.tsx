import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { initialZooState, priyaGoal } from './config';
import { areaOpen, productGoalMet, productGoalProgress, nextGoalArea, takeNextProductGoal } from './engine';
import { reducer } from './useZooGame';
import { aiTurn } from './aiSeats';
import { ownedBy } from './seatRules';
import type { ZooGameState } from './types';

// "The initial product goal is for a whole zoo. That seems unrealistic. It is more likely a PG
// related to a first release e.g. a Big Cat Zone. Subsequent PGs would build on that to move
// towards a full zoo." And the next one is Priya's to write: "she is the PO".

const fresh = () => initialZooState(1) as ZooGameState;
/** Everything in an area open to visitors, as if built, accepted and opened; an epic nobody split is
 *  counted as its pieces, so it goes too. */
const opened = (s: ZooGameState, area: string): ZooGameState => ({
  ...s, backlog: s.backlog.filter((it) => !(it.zone === area && it.category === 'epic'))
    .map((it) => (it.zone === area ? { ...it, status: 'open' as const } : it)),
});

describe('the first Product Goal is a first release', () => {
  it('opens one area, and is measured by how much of it visitors can walk into', () => {
    const s = fresh();
    expect(s.goalArea).toBe('Big Cats');
    expect(s.productGoal).toBe(priyaGoal(null));
    const { open, total } = areaOpen(s, 'Big Cats');
    expect(open).toBe(0);
    expect(total, 'the area has nothing in it to open').toBeGreaterThan(2);
    expect(productGoalProgress(s)).toBe(0);
    expect(productGoalMet(s)).toBe(false);
  });

  it('is met once all of that area is open', () => {
    const s = opened(fresh(), 'Big Cats');
    expect(productGoalProgress(s)).toBe(1);
    expect(productGoalMet(s)).toBe(true);
  });

  it('a Goal the Scrum Team wrote has no area, and is measured by visitor happiness as before', () => {
    const s = reducer(fresh(), { type: 'SET_PRODUCT_GOAL', goal: 'A zoo worth the train fare.' });
    expect(s.goalArea).toBeUndefined();
    expect(productGoalProgress(s)).toBe(0);
    const loved = { ...s, lastReview: { overallHappiness: 80 } } as unknown as ZooGameState;
    expect(productGoalMet(loved)).toBe(true);
  });

  it('suggesting an area on the opening screen makes that the first release', () => {
    const s = reducer(fresh(), { type: 'SET_PRODUCT_GOAL', goal: priyaGoal('Waterside'), focus: 'Waterside' });
    expect(s.goalArea).toBe('Waterside');
  });
});

describe('the next Product Goal builds on the last', () => {
  it('is refused while the current one is not met', () => {
    const s = fresh();
    expect(takeNextProductGoal(s)).toBe(s);
  });

  it('opens the next area in the Product Backlog, keeps the met one, and orders the Backlog for it', () => {
    const met = opened(fresh(), 'Big Cats');
    const next = nextGoalArea(met)!;
    expect(next, 'no area left to open after the first').toBeTruthy();
    expect(next).not.toBe('Big Cats');
    const after = takeNextProductGoal({ ...met, sprintNumber: 3 });
    expect(after.goalArea).toBe(next);
    expect(after.productGoal).toBe(priyaGoal(next, true));
    expect(after.pastGoals).toEqual([{ goal: priyaGoal(null), area: 'Big Cats', metIn: 3 }]);
    const firstWaiting = after.backlog.find((it) => it.status === 'backlog')!;
    expect(firstWaiting.zone, 'the next area is not at the top of the Product Backlog').toBe(next);
    expect(after.decisions?.slice(-1)[0]?.what).toMatch(/Big Cats area is open: Product Goal met/);
    expect(productGoalProgress(after), 'the new Goal starts from nothing open').toBe(0);
  });

  it('has nowhere to go once every area is open', () => {
    let s = fresh();
    for (const area of new Set(s.backlog.map((it) => it.zone))) s = opened(s, area);
    expect(nextGoalArea(s)).toBeNull();
    expect(takeNextProductGoal(s)).toBe(s);
  });

  it('is Priya\'s to call and to write', () => {
    expect(ownedBy('product_owner')).toContain('NEXT_PRODUCT_GOAL');
    const atReview = { ...opened(fresh(), 'Big Cats'), phase: 'review', signals: [], sprintGoal: '' } as ZooGameState;
    const move = aiTurn(atReview, 'product_owner');
    expect(move?.action).toEqual({ type: 'NEXT_PRODUCT_GOAL' });
    expect(move?.says).toMatch(/Big Cats area is open, so I am calling our Product Goal met/);
  });
});

describe('the Review says where the Goal stands', () => {
  const review = (state: ZooGameState) => render(
    <MemoryRouter><SprintReview state={{ ...state, phase: 'review' } as ZooGameState} onContinue={() => {}} onOpen={() => {}} onWrapUp={() => {}} /></MemoryRouter>,
  ).container;

  it('counts the pieces of the area that are open', () => {
    const c = review(fresh());
    expect(c.querySelector('[data-part="goal-area-progress"]')?.textContent).toMatch(/0 of \d+ pieces of the Big Cats area are open to visitors/);
  });

  it('after Priya calls it, lists the met Goal and says what she took on next', () => {
    const after = takeNextProductGoal({ ...opened(fresh(), 'Big Cats'), sprintNumber: 2 });
    const c = review(after);
    expect(c.querySelector('[data-part="past-goals"]')?.textContent).toMatch(/Met in Sprint 2: Open the Big Cats area/);
    // The call itself comes at the end of the Review, after the visitors.
    fireEvent.click(screen.getByRole('button', { name: /Next: the visitors/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next: what we do about it/i }));
    expect(c.querySelector('[data-part="goal-call"]')?.textContent).toMatch(/Priya called it: the Big Cats area is open/);
  });
});
