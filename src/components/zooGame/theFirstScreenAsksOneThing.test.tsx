import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "The screen is confusing. Too many things going on. The green guidance is off the screen. Are
// there any gaming patterns we can draw on to ease newbies into a game?" (5 Nov 2026)
//
// One objective at a time, things unlocked when they can be used, and a small first level: the
// first screen asks one thing, in the card under Priya's line; what is settled is a line each; the
// ground arrives when there is something to spend; what is for later folds away.

const noop = () => {};
const screen = (over: Partial<ZooGameState> = {}) => render(
  <MemoryRouter>
    <RefineBacklog state={{ ...initialZooState(3), phase: 'refine', ...over } as ZooGameState}
      onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
      onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
      onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
      onDuplicatePbi={noop} onPlan={noop} onOpenGround={noop} />
  </MemoryRouter>,
).container;

describe('the first screen', () => {
  it('asks one thing, and the Definition of Done is done inside the card that asks for it', () => {
    const c = screen();
    expect(c.querySelectorAll('[data-part="needs-you"]')).toHaveLength(1);
    const card = c.querySelector('[data-part="needs-you"]')!;
    expect(card.textContent).toMatch(/Agree the Definition of Done/);
    expect([...card.querySelectorAll('button')].some((b) => /We agree/.test(b.textContent ?? ''))).toBe(true);
    // No numbered steps beside it.
    expect(c.textContent).not.toMatch(/First, agree how long a Sprint is/);
  });

  it('says what is settled as a line each, with a way to change it', () => {
    const c = screen();
    const length = c.querySelector('[data-part="settled-length"]')!;
    expect(length.textContent).toMatch(/Sprints are 3 days/);
    fireEvent.click(length.querySelector('button')!);
    expect(c.querySelector('[data-part="settled-length"]')!.textContent, 'the length cannot be changed').toMatch(/day/);
    expect(c.querySelector('[data-part="enough-to-start"]')!.textContent).toMatch(/Enough to start/);
  });

  it('keeps the ground until there is something to spend', () => {
    expect(screen().querySelector('[data-part="ground"]'), 'a panel of dead buttons on the first screen').toBeNull();
    expect(screen({ sprintNumber: 2, velocity: [8] }).querySelector('[data-part="ground"]')).toBeTruthy();
  });

  it('folds what is for later into one row', () => {
    const c = screen();
    const fold = c.querySelector('[data-part="later-fold"]') as HTMLButtonElement;
    expect(fold.textContent).toMatch(/\d+ more, refined in later Sprints/);
    expect(c.querySelector('[data-part="later"]')).toBeNull();
    fireEvent.click(fold);
    expect(c.querySelectorAll('[data-part="later"]').length).toBeGreaterThan(0);
  });
});
