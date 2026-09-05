import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
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

const shell = (state: ZooGameState) =>
  render(<MemoryRouter><ZooShell state={state} onEndDay={() => {}}><div>the screen</div></ZooShell></MemoryRouter>);

describe('the strip', () => {
  it('draws the clock as the biggest thing on it', () => {
    const { container } = shell(sprint());
    const clock = container.querySelector('[data-part="day-clock"]');
    expect(clock, 'no clock in the strip at all').toBeTruthy();
    expect(clock!.textContent).toMatch(/1:28/);
    expect(clock!.textContent).toMatch(/left today/);
    // Big means big: a type scale, not a chip. The pill it used to be was text-[11px].
    expect(clock!.innerHTML, 'the clock is still chip-sized').toMatch(/text-3xl/);
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
