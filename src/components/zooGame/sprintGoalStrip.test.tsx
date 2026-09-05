import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The Sprint Goal is on screen at all times, and a band is one row tall. A goal is a sentence, so
// on anything narrower than the sentence the end of it went missing: "...so that visitors have more
// to ..." and no way at all to reach the rest. Reported from playing it.
//
// The chip still says as much as fits. The whole of it opens from the chip.

const GOAL = 'Our goal is to deliver the Big Cats zone so that visitors have more to enjoy';
const state = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', sprintGoal: GOAL, ...over }) as ZooGameState;

const goalChip = (c: HTMLElement) => [...c.querySelectorAll('button')].find((b) => b.getAttribute('title') === GOAL);

describe('the Sprint Goal on the band', () => {
  it('carries the whole goal, not just the part that fits', () => {
    const { container } = render(<MemoryRouter><ZooShell state={state()}><div /></ZooShell></MemoryRouter>);
    const chip = goalChip(container);
    expect(chip, 'the goal on the band cannot be reached').toBeTruthy();
    // Open it: the goal in full, wrapped, ending in the word it actually ends on. Checked inside
    // the panel itself - the chip's own text is complete in the DOM whatever the CSS does with it,
    // so reading the page as a whole would pass even with nothing behind the chip at all.
    fireEvent.click(chip!);
    const panel = document.querySelector('[role="dialog"]');
    expect(panel, 'the goal does not open').toBeTruthy();
    expect(panel!.textContent).toContain(GOAL);
  });

  it('says there is not one yet rather than showing an empty box', () => {
    const { container } = render(<MemoryRouter><ZooShell state={state({ sprintGoal: '' })}><div /></ZooShell></MemoryRouter>);
    expect(container.textContent).toMatch(/No Sprint Goal yet/i);
  });
});
