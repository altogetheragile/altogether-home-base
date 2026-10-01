import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CardDialog } from './CardDialog';
import { initialZooState, effortOf } from './config';
import { outgrown } from './engine';
import type { ZooGameState, BacklogItem } from './types';

// "Sized as 1 points of work".
//
// Found by a newcomer playing the live game cold, reading the card it was about to start:
// "The card says 'Sized as 1 points of work; it is 5 now' - I am not sure what that means."
//
// Re-sizing an item from one point is the ordinary case, not an edge: a one-point item is the
// smallest thing on the board, and growing is exactly what the Daily Scrum is meant to catch.

const state = (): ZooGameState => initialZooState(3) as ZooGameState;

// The note is `outgrown(item)`, which compares what the item was SIZED as against what the work
// turned out to be - `sizedAs` against `effortOf`, not the fields a card happens to show. Built
// through the engine so the test cannot pass against a card that is saying nothing.
const card = (was: number) => {
  const base = state();
  const from = base.backlog.find((b) => b.category !== 'enclosure' && !b.unsized && effortOf(b) !== was)!;
  expect(from, 'no item in the Product Backlog can be made to have outgrown its size').toBeTruthy();
  const item = { ...from, sizedAs: was, status: 'committed' } as BacklogItem;
  const moved = outgrown(item);
  expect(moved, 'this item is not shown as having outgrown anything, so the card says nothing').toBeTruthy();
  expect(moved!.was, 'the note is not about the size this test set').toBe(was);
  // The dialog is portalled to the body, so its own container is empty.
  render(
    <MemoryRouter>
      <CardDialog state={{ ...base, backlog: [item, ...base.backlog.filter((b) => b.id !== item.id)] } as ZooGameState}
        item={item} onClose={() => {}} />
    </MemoryRouter>,
  );
  return document.body.textContent ?? '';
};

describe('an item that was sized at one point', () => {
  it('is described as one point, not one points', () => {
    const text = card(1);
    expect(text, 'the card says nothing about the re-sizing at all').toMatch(/Sized as 1 point/);
    expect(text, 'it says "1 points"').not.toMatch(/\b1 points\b/);
  });

  it('still says points for more than one', () => {
    expect(card(3), 'it says "3 point"').toMatch(/Sized as 3 points of work/);
  });
});
