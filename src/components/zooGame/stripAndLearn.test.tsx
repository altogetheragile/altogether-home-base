import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import { tickDay } from './engine';
import type { ZooGameState } from './types';

// What matters on the screen, in order.
//
// The strip carried twelve pills of equal weight: four value dials with no values, an Artifacts
// button, a Scrum button, a help icon, a wordmark, the clock, the goal, the seat, the phase. When
// nothing is bigger, nothing is important - and the clock, the one thing that changes what a
// learner does next, was the same size as an abbreviation nobody had explained.
//
// The rule: the screen keeps the work, the drawer keeps the words.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintDays: 3,
    daySecondsLeft: 88, dayTimeMult: 1, sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    committedIds: take.map((it) => it.id),
    forecastPoints: take.reduce((s, it) => s + it.estimate, 0),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1, goalCritical: true } : it)),
    ...over,
  } as ZooGameState;
};

const shell = (state: ZooGameState, onSetClockPaused: (p: boolean) => void = () => {}) =>
  render(<MemoryRouter><ZooShell state={state} onSetClockPaused={onSetClockPaused}><div>the screen</div></ZooShell></MemoryRouter>);

describe('the strip', () => {
  it('draws the day as a clock, on the row where the eye already goes', () => {
    // It was a line of text on the strip - where a learner reads where they are, not where they
    // watch time run out. It is a clock now: digits, a bar, and a hand you can put on it.
    const { container } = shell(sprint());
    const clock = container.querySelector('[data-part="day-clock"]');
    expect(clock, 'no clock on the screen at all').toBeTruthy();
    expect(clock!.textContent).toMatch(/1:28/);
    expect(clock!.textContent).toMatch(/left of\s*today/);
    expect(clock!.innerHTML, 'the clock is chip-sized again').toMatch(/text-2xl/);
    expect(container.querySelector('.zoo-band [data-part="day-clock"]'),
      'the clock is back in the strip, competing with where you are').toBeNull();
  });

  it('says whether the Sprint Goal is safe, above the Goal itself', () => {
    const { container } = shell(sprint());
    const line = container.querySelector('[data-part="goal-line"]')!;
    expect(line.textContent).toMatch(/Goal safe/);
    expect(line.textContent, 'the Goal itself is not under its own verdict').toContain('Deliver the Big Cats zone');
  });

  it('drops one sentence when the Goal is at risk, and nothing else moves', () => {
    const risky = sprint({ dayNumber: 3, daySecondsLeft: 22 });
    const { container } = shell(risky);
    expect(container.querySelector('[data-part="goal-line"]')!.textContent).toMatch(/Goal at risk/);
    const warning = container.querySelector('[data-part="goal-warning"]');
    expect(warning, 'the Goal is at risk and the screen says nothing').toBeTruthy();
    expect(warning!.textContent).toMatch(/22 seconds left today/);
    expect(warning!.textContent, 'the warning offers no way out of it').toMatch(/Finish it, or stop/);
    // A safe Sprint carries no warning at all.
    expect(shell(sprint()).container.querySelector('[data-part="goal-warning"]')).toBeNull();
  });

  it('carries one button for everything that is words', () => {
    const { container } = shell(sprint());
    const strip = container.querySelector('.zoo-band')!;
    const buttons = [...strip.querySelectorAll('button')].map((b) => (b.textContent ?? '').trim());
    expect(buttons, 'Learn is not in the strip').toContain('Learn');
    // What went: the drawers that were controls of their own, and four dials with no values.
    expect(buttons.some((b) => /^Artifacts/.test(b)), 'the Artifacts drawer is still a control').toBe(false);
    expect(buttons.some((b) => /^Scrum$/.test(b)), 'the Scrum drawer is still a control').toBe(false);
    expect(strip.textContent, 'the value dials are still on the strip').not.toMatch(/\bCV\b|\bT2M\b|\bA2I\b/);
  });
});

describe('the Learn drawer', () => {
  const open = (state = sprint()) => {
    shell(state);
    fireEvent.click(screen.getByRole('button', { name: /^Learn$/ }));
    return screen.getByRole('dialog', { name: 'Learn' });
  };

  it('holds Scrum, Value, This Sprint and Notes', () => {
    const drawer = open();
    for (const section of ['Scrum', 'Value', 'This Sprint', 'Notes']) {
      expect(within(drawer).getByRole('button', { name: section }), `${section} is missing from Learn`).toBeTruthy();
    }
  });

  it('explains each value measure rather than showing four letters', () => {
    // The dials were four abbreviations with no values and no explanation. Each is a card now: what
    // it is, how this zoo computes it, and what moves it.
    const drawer = open();
    fireEvent.click(within(drawer).getByRole('button', { name: 'Value' }));
    expect(drawer.textContent).toContain('Current Value');
    expect(drawer.textContent, 'the measure is named but not explained').toContain('How happy today’s visitors are.');
    expect(drawer.textContent).toMatch(/How:/);
    expect(drawer.textContent, 'nothing says what moves it').toMatch(/Moves:/);
    expect(drawer.textContent).toContain('Time to Market');
  });

  it('keeps this Sprint’s commitments and its decisions', () => {
    const drawer = open();
    fireEvent.click(within(drawer).getByRole('button', { name: 'This Sprint' }));
    expect(drawer.textContent).toContain('Deliver the Big Cats zone');
    expect(drawer.textContent, 'the Definition of Done did not come with it').toMatch(/Definition of Done|Increment/);
    expect(drawer.textContent).toMatch(/Decision log/);
  });
});

// A hand on the clock.
//
// From the layout sketch: a clock big enough to read across a room, with pause and play. Holding it
// is a decision somebody takes, and it is game state rather than one browser's idea - so in a shared
// game everybody is held at the same second, which is the trainer's pause-all in miniature.
describe('holding the clock', () => {
  it('offers the hand, and says what it does', () => {
    const { container } = shell(sprint());
    const hold = screen.getByRole('button', { name: /Hold the clock/i });
    expect(hold, 'there is no way to stop the day').toBeTruthy();
    expect(hold.getAttribute('title')).toMatch(/for everybody/);
    expect(container.querySelector('[data-part="day-clock"]')!.textContent).not.toMatch(/held/);
  });

  it('stops the day while it is held, and says so', () => {
    const { container } = shell(sprint({ clockPaused: true } as Partial<ZooGameState>));
    expect(container.querySelector('[data-part="day-clock"]')!.textContent).toMatch(/held/);
    expect(screen.getByRole('button', { name: /Start the clock/i }), 'no way to start it again').toBeTruthy();
    // ...and the reducer is what actually holds it.
    const running = sprint();
    expect(tickDay({ ...running, clockPaused: true } as ZooGameState).daySecondsLeft,
      'the day ran on while the clock was held').toBe(running.daySecondsLeft);
    expect(tickDay(running).daySecondsLeft).toBe(running.daySecondsLeft - 1);
  });

  it('says nothing about holding a clock that is not running', () => {
    // Learn mode already stops it: two ways to say "paused" on one clock is one too many.
    shell(sprint({ learnMode: true } as Partial<ZooGameState>));
    expect(screen.queryByRole('button', { name: /Hold the clock/i })).toBeNull();
  });
});
