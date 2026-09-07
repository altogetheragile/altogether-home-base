import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Twenty-three items on one screen.
//
// Refinement is reading an order and changing it, and you cannot read an order four items at a
// time. Rows are one line each - icon, name, type, ready, points - the groups collapse, and the
// paragraphs explaining what refinement is have gone to Learn where they can be read once.

const noop = () => {};
const before = (): ZooGameState => ({ ...initialZooState(3), phase: 'refine' }) as ZooGameState;

const screen = () => render(
  <MemoryRouter>
    <RefineBacklog state={before()} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
      onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
      onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} />
  </MemoryRouter>,
);

describe('refinement, compact', () => {
  it('draws one row per item rather than a card', () => {
    const { container } = screen();
    const rows = [...container.querySelectorAll('[aria-label^="Refine "]')];
    expect(rows.length, 'the Backlog is not on the screen').toBeGreaterThan(10);
    // One line each: the name and its chips share a row, so twenty-three of them fit a screen.
    for (const r of rows.slice(0, 5)) {
      expect(r.innerHTML, 'the row is stacked into two lines again').toMatch(/h-\[1\.75rem\]/);
    }
  });

  it('says plainly that nobody has agreed the Definition of Done', () => {
    // It used to show a count, which reads as "there is one" - and the whole teaching of starting
    // without one is that nobody agreed it.
    const { container } = screen();
    expect(container.textContent).toMatch(/nobody has agreed it yet/i);
  });

  it('leaves the explaining to Learn', () => {
    const { container } = screen();
    expect(container.textContent, 'the screen is explaining refinement over the top of it')
      .not.toMatch(/Estimate the unsized items and order the list/);
  });
});
