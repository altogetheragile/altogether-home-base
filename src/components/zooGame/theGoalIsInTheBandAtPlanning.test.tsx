import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SeatBand } from './SeatBand';
import { TaskEditor } from './Board';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Topics two and three of Sprint Planning carry the agreed Sprint Goal in the band, the same place
// the Sprint does, and the page no longer says it a second time. Asked for while playing it.

const GOAL = 'Open the Big Cats zone so that visitors have something to see on their first visit';
const planning = (planningTopic: 'why' | 'what' | 'how', sprintGoal = GOAL): ZooGameState => ({
  ...initialZooState(3), phase: 'planning', planningTopic, sprintGoal,
} as ZooGameState);
const band = (s: ZooGameState) => render(<MemoryRouter><SeatBand state={s} /></MemoryRouter>).container;

describe('the band at Sprint Planning', () => {
  it('carries the Goal at topics two and three', () => {
    for (const t of ['what', 'how'] as const) {
      const goal = band(planning(t)).querySelector('[data-part="sprint-goal"]');
      expect(goal, `no Goal in the band at ${t}`).toBeTruthy();
      expect(goal!.textContent).toContain(GOAL);
    }
  });

  it('not at topic one, where the Goal is still being written on the page', () => {
    expect(band(planning('why')).querySelector('[data-part="sprint-goal"]')).toBeNull();
  });

  it('not when there is no Goal yet', () => {
    expect(band(planning('what', '')).querySelector('[data-part="sprint-goal"]')).toBeNull();
  });
});

describe('Steps to build it, before any are written', () => {
  it('shows what a step looks like, without adding it to the plan', () => {
    const item = initialZooState(3).backlog[0];
    let set = 0;
    const c = render(<TaskEditor item={{ ...item, tasks: [] }} onSetTasks={() => { set++; }} />).container;
    expect(c.querySelector('[data-part="step-example"]')?.textContent).toMatch(/For example:/);
    expect(c.querySelectorAll('input').length, 'the example became a step').toBe(0);
    expect(set).toBe(0);
  });

  it('goes once there is a step of their own', () => {
    const item = initialZooState(3).backlog[0];
    const c = render(<TaskEditor item={{ ...item, tasks: [{ id: 't', label: 'Fence it', done: false }] }} onSetTasks={() => {}} />).container;
    expect(c.querySelector('[data-part="step-example"]')).toBeNull();
  });
});
