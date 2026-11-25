import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductBacklogSidebar } from './Board';
import { BacklogTab } from './BacklogBench';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "The product goal is still basically invisible on the screen. Can we move it so it's at the top
// of the product backlog because it is the commitment for the product backlog" (Al, 25 November
// 2026). The 2020 Guide: "The Product Goal is in the Product Backlog." So it is drawn as part of the
// list, above its first item, on every screen the list is on.

const noop = () => {};
const GOAL = 'Open the Big Cats area to visitors.';
const at = (phase: ZooGameState['phase']): ZooGameState =>
  ({ ...initialZooState(3), phase, productGoal: GOAL }) as ZooGameState;

/** The Product Goal is in the list, and comes before every item in it. */
function headsTheList(root: HTMLElement) {
  const goal = root.querySelector('[data-part="product-goal"]');
  expect(goal, 'no Product Goal on the Product Backlog').not.toBeNull();
  expect(goal!.textContent).toContain(GOAL);
  // Above every item: the Goal's words come before any item's name in the list's own text.
  const text = root.textContent ?? '';
  const names = initialZooState(3).backlog.map((it) => it.name).filter((n) => text.includes(n));
  expect(names.length, 'no items to compare against').toBeGreaterThan(0);
  for (const n of names) expect(text.indexOf(GOAL), `${n} came before the Product Goal`).toBeLessThan(text.indexOf(n));
}

describe('the Product Goal heads the Product Backlog', () => {
  for (const mode of ['refine', 'plan', 'sprint', 'view'] as const) {
    it(`in the list, when it is shown to ${mode}`, () => {
      const { container } = render(<MemoryRouter>
        <ProductBacklogSidebar state={at(mode === 'sprint' ? 'sprint' : mode === 'refine' ? 'refine' : 'planning')} mode={mode}
          onAddPbi={noop} onRefinePbi={noop} onSetUseStories={noop} onFocus={noop} />
      </MemoryRouter>);
      headsTheList(container);
    });
  }

  it('once on the Product Backlog tab, not twice', () => {
    const { container } = render(<MemoryRouter>
      <BacklogTab state={at('sprint')} onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop}
        onMoveZone={noop} onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop}
        onDeletePbi={noop} onDuplicatePbi={noop} />
    </MemoryRouter>);
    expect(container.querySelectorAll('[data-part="product-goal"]')).toHaveLength(1);
    headsTheList(container);
  });

  it('says there is none yet, rather than vanishing', () => {
    const { container } = render(<MemoryRouter>
      <ProductBacklogSidebar state={{ ...at('refine'), productGoal: '' }} mode="refine" onAddPbi={noop} onRefinePbi={noop} onSetUseStories={noop} />
    </MemoryRouter>);
    expect(container.querySelector('[data-part="product-goal"]')?.textContent).toMatch(/No Product Goal set yet/);
  });
});
