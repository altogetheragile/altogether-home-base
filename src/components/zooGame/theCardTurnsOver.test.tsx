import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { OpenCard } from './OpenCard';
import { initialZooState } from './config';
import type { BacklogItem } from './types';

// The item you pick is a card with two sides: what it is on the front, its acceptance criteria on
// the back. Asked for from the mockup: "Can ACs be on the 'back' of a card? Can it flip over to show
// ACs? Also, 'Done when', followed by a list of ACs is suggesting ACs = DoD again." And then: "when
// a card flips the size does not change."

const item = (): BacklogItem => {
  const it = initialZooState(3).backlog.find((x) => (x.acceptance ?? []).length > 1)!;
  return { ...it, acceptance: ['It is bordered safely, with no way out', 'An animal can move about in it'] };
};

describe('the open card', () => {
  it('shows what it is first, and its criteria only once turned over', () => {
    const { container, getByRole } = render(<OpenCard item={item()} />);
    const card = container.querySelector('[data-part="open-card"]')!;
    expect(card.getAttribute('data-side')).toBe('front');
    expect(container.querySelector('[data-part="card-back"]')!.className).toMatch(/\binvisible\b/);
    fireEvent.click(getByRole('button', { name: /Turn over/ }));
    expect(card.getAttribute('data-side')).toBe('back');
    expect(container.querySelector('[data-part="card-front"]')!.className).toMatch(/\binvisible\b/);
    fireEvent.click(getByRole('button', { name: /Turn back/ }));
    expect(card.getAttribute('data-side')).toBe('front');
  });

  it('is the same size on both sides', () => {
    // One grid cell for both, so the card is as big as its bigger side whichever is showing.
    const { container } = render(<OpenCard item={item()} />);
    for (const side of ['card-front', 'card-back']) {
      expect(container.querySelector(`[data-part="${side}"]`)!.className, `${side} is not in the shared cell`).toMatch(/\[grid-area:1\/1\]/);
    }
  });

  it('calls them acceptance criteria, and says they are not the Definition of Done', () => {
    const { container } = render(<OpenCard item={item()} />);
    const back = container.querySelector('[data-part="card-back"]')!.textContent!;
    expect(back).toMatch(/^Acceptance criteria/);
    expect(back).not.toMatch(/Done when/i);
    expect(back).toMatch(/The Definition of Done covers every item/);
  });

  it('has nothing to turn over to when there are no criteria', () => {
    const { container } = render(<OpenCard item={{ ...item(), acceptance: [] }} />);
    expect(container.querySelector('[data-part="turn-card"]')).toBeNull();
    expect(container.querySelector('[data-part="card-back"]')).toBeNull();
  });
});
