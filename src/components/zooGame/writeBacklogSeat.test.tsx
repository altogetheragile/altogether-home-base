import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BacklogWizard } from './BacklogWizard';
import { aiTurn } from './aiSeats';
import { reducer } from './useZooGame';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Nobody is left on a screen they cannot act on.
//
// Reported from a live session: "I chose a Dev role and got stuck at this screen." The screen was
// the third of the three questions that write the Product Backlog, with a button that writes it.
// Writing the Product Backlog is the Product Owner's, so the press was refused - and the seat
// playing the Product Owner had nothing it could do before a Product Backlog existed, so the game sat
// there. Two faults, and either one alone would still have left a learner stuck.

const brief = (): ZooGameState => ({ ...initialZooState(3), phase: 'brief' }) as ZooGameState;

describe('the Product Owner seat, played by the game', () => {
  it('writes the Product Backlog, which is the only way off that screen', () => {
    const move = aiTurn(brief(), 'product_owner');
    expect(move, 'the seat that owns the Product Backlog had nothing to do before there was one').toBeTruthy();
    expect(move!.action.type).toBe('WRITE_BACKLOG');
    expect(move!.says, 'it writes a Product Backlog without saying what it chose').toMatch(/open/i);
  });

  it('and the Product Backlog it writes is a real one', () => {
    const move = aiTurn(brief(), 'product_owner')!;
    const after = reducer(brief(), move.action);
    expect(after.phase, 'writing the Product Backlog did not move the game on').toBe('refine');
    expect(after.backlog.length, 'the Product Backlog is empty').toBeGreaterThan(5);
    expect(after.zones.length, 'the zoo has no areas').toBeGreaterThan(1);
  });

  it('leaves the other seats alone before there is a Product Backlog', () => {
    for (const seat of ['developer', 'scrum_master'] as const) {
      expect(aiTurn(brief(), seat), `the ${seat} seat wrote the Product Backlog`).toBeNull();
    }
  });
});

describe('the screen, to a seat that is not the Product Owner', () => {
  const wizard = (props: Partial<Parameters<typeof BacklogWizard>[0]> = {}) => render(
    <MemoryRouter>
      <BacklogWizard productGoal="Open a zoo that visitors love and come back to." onBuild={vi.fn()} {...props} />
    </MemoryRouter>,
  );

  it('says whose it is, rather than refusing the press', () => {
    const { container } = wizard({ seat: 'developer' });
    const note = container.querySelector('[data-part="not-yours"]')!;
    expect(note, 'a Developer is offered the Product Owner’s work with nothing said').toBeTruthy();
    expect(note.textContent).toMatch(/Product Owner/);
  });

  /** The three questions used to be three screens, walked with two presses of Next. They are one
   *  page now, so there is nowhere to walk to: the write button is on it from the start. */
  const toTheEnd = () => {};

  it('does not offer a button that will be refused', () => {
    wizard({ seat: 'developer' });
    toTheEnd();
    expect(screen.getByRole('button', { name: /Write the Product Backlog/ }),
      'the button is gone rather than plainly not yours').toBeTruthy();
    expect(screen.getByRole('button', { name: /Write the Product Backlog/ }).hasAttribute('disabled'),
      'a Developer can still press write, and the press is thrown away').toBe(true);
  });

  it('says nothing of the sort to the Product Owner, or to a solo player', () => {
    for (const seat of ['product_owner', null] as const) {
      const { container } = wizard({ seat });
      toTheEnd();
      expect(container.querySelector('[data-part="not-yours"]'),
        `${seat ?? 'a solo player'} was told the Product Backlog was somebody else’s`).toBeNull();
      expect(screen.getAllByRole('button', { name: /Write the Product Backlog/ })
        .some((b) => !b.hasAttribute('disabled')), 'they cannot write it either').toBe(true);
    }
  });
});
