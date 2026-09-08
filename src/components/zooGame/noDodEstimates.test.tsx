import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PlanningPoker } from './PlanningPoker';
import { pokerHand, handSpread } from './engine';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Without an agreed Definition of Done, nobody is sizing the same piece of work.
//
// Asked for directly: "When there is no agreed DoD then there is not a collective understanding of
// finished for a PBI. Can the estimates be deliberately bad to highlight this?" They can, and they
// are - one Developer is costing a fence, another a fence that has been reviewed, placed and
// released, and the cards come out miles apart. The spread is the evidence, not a punishment.

const state = (dodAgreed: boolean): ZooGameState =>
  ({ ...initialZooState(3), dodAgreed }) as ZooGameState;
const item = () => initialZooState(3).backlog.find((it) => !it.unsized)!;

describe('estimating without an agreed Definition of Done', () => {
  it('spreads the cards much further than a team that has agreed one', () => {
    const agreed = pokerHand(item(), 42, true);
    const not = pokerHand(item(), 42, false);
    expect(handSpread(not), 'the cards agree as though finished meant one thing')
      .toBeGreaterThan(handSpread(agreed) * 1.5);
  });

  it('never sizes anything at nothing', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      for (const c of pokerHand(item(), seed, false)) expect(c).toBeGreaterThan(0);
    }
  });

  it('is the same hand every time, so a trainer can replay it', () => {
    expect(pokerHand(item(), 7, false)).toEqual(pokerHand(item(), 7, false));
  });

  it('says why the cards disagree, where they disagree', () => {
    const { container } = render(
      <MemoryRouter>
        <PlanningPoker item={item()} state={state(false)} seed={3} onCommit={() => {}} />
      </MemoryRouter>,
    );
    const said = container.querySelector('[data-part="no-dod-spread"]');
    expect(said, 'the cards are miles apart and nothing says why').toBeTruthy();
    expect(said!.textContent).toMatch(/Definition of Done/);
    expect(said!.textContent, 'it does not say what to do about it').toMatch(/Agree one/);
  });

  it('says nothing of the sort once the team has agreed one', () => {
    const { container } = render(
      <MemoryRouter>
        <PlanningPoker item={item()} state={state(true)} seed={3} onCommit={() => {}} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="no-dod-spread"]'),
      'a team with a Definition of Done was told its cards were miles apart').toBeNull();
  });
});
