import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// "What do all of these do? 2 seem to do nothing" (Al, 25 November 2026), of the strip before the
// first Sprint: a heart with a 0, "no Sprint yet" in the middle, and "No Sprint yet" again on the
// right. The heart was a label with a hover tooltip, which a tablet never shows; the right one was
// the Sprint Goal's button, saying the middle's words again and opening to say them a third time.

const at = (phase: ZooGameState['phase']) => ({ ...initialZooState(3), phase } as ZooGameState);
const shell = (state: ZooGameState) =>
  render(<MemoryRouter><ZooShell state={state}><div>the screen</div></ZooShell></MemoryRouter>).container;

describe('the strip before the first Sprint', () => {
  it('says "no Sprint yet" once', () => {
    const strip = shell(at('refine')).querySelector('.zoo-band')!;
    expect(strip.textContent!.match(/no Sprint yet/gi), 'said more than once').toHaveLength(1);
    expect(strip.querySelector('[data-part="goal-line"]'), 'a Sprint Goal button with no Sprint').toBeNull();
  });

  it('opens the value counter to say what it is', () => {
    const strip = shell(at('refine')).querySelector('.zoo-band')!;
    const heart = strip.querySelector('[data-part="value"]')!;
    expect(heart.tagName, 'the counter is still a label').toBe('BUTTON');
    fireEvent.click(heart);
    const told = document.querySelector('[data-part="value-explained"]');
    expect(told, 'pressing it did nothing').not.toBeNull();
    expect(told!.textContent).toMatch(/every visit to the zoo that was worth making/);
    expect(told!.textContent).toMatch(/game.s score, not a Scrum measure/);
    expect(screen.getByText('0 so far')).toBeTruthy();
  });
});

describe('the Sprint Goal button', () => {
  it('arrives with Sprint Planning', () => {
    expect(shell(at('planning')).querySelector('[data-part="goal-line"]')).not.toBeNull();
  });
});
