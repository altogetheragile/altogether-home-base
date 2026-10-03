import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import { BOARD_ICONS } from './board/boardIcons';
import type { ZooGameState } from './types';

// The three artifacts wear the board's own marks.
//
// `docs/scrum-board/COURSE-AND-BOARD.md` maps them tab by tab - the Product Backlog icon to the
// Product Backlog tab, the Sprint Backlog icon to the Sprint Backlog tab, the Increment cube to
// the Increment tab - and the point of it is one visual language across the board, the game and
// the lesson cards.
//
// The game had a clipboard, a checklist and a clump of trees: good icons, and nothing to do with
// the board a learner had been reading ten minutes earlier. Asked after the first round of this
// work shipped: "Should I now see the DoD and the new icons, or?" - and the answer for the icons
// was no, because the first round changed the Artifacts panel inside Learn and left the tabs,
// which is what the mapping actually names.

const shell = () => render(
  <MemoryRouter>
    <ZooShell state={startOnTheBoard(initialZooState(1) as ZooGameState)}><div /></ZooShell>
  </MemoryRouter>,
).container;

/** A tab's icon, as the markup inside it. */
const markOn = (c: HTMLElement, label: string) => {
  const tab = [...c.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(label));
  expect(tab, `there is no ${label} tab`).toBeTruthy();
  return tab!.querySelector('svg')?.innerHTML ?? '';
};

describe('the three artifact tabs', () => {
  it('are drawn with the board\'s own icons, not lucide\'s', () => {
    const c = shell();
    for (const [label, icon] of [
      ['Product Backlog', 'product_backlog'],
      ['Sprint Backlog', 'sprint_backlog'],
      ['Increment', 'increment'],
    ] as const) {
      const mark = markOn(c, label);
      expect(mark.length, `the ${label} tab has no icon at all`).toBeGreaterThan(20);
      // Compared against a distinctive piece of the board's drawing rather than the whole of it:
      // the tab renders it at a different size, and what matters is that it is the same artwork.
      const want = BOARD_ICONS[icon].inner.slice(0, 60);
      expect(mark, `the ${label} tab is not wearing the board's ${icon}`).toContain(want);
    }
  });

  it('are not all the same mark, which would be worse than three different ones', () => {
    const c = shell();
    const marks = ['Product Backlog', 'Sprint Backlog', 'Increment'].map((l) => markOn(c, l));
    expect(new Set(marks).size, 'two tabs wear the same icon').toBe(3);
  });
});
