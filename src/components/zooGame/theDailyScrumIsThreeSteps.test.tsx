import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DailyScrum } from './DailyScrum';
import { goalAtRisk } from './engine';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// The Daily Scrum in three numbered steps: will we make the Sprint Goal, your turn round the room,
// and change today's plan.
//
// Asked while playing it: "The Daily scrum dialog is also confusing - what is important? What
// should I do?" It had a paragraph, three stat boxes, a burndown and a decision panel of the same
// weight, and it said "the Sprint Goal is at risk" in one panel and "On track for the Sprint Goal"
// in the line under it.

const noop = () => {};
const scrum = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const take = base.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 3);
  return {
    ...base, phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 3, sprintDays: 3, sprintNumber: 1,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy', scrumSecondsLeft: 17,
    committedIds: take.map((it) => it.id),
    backlog: base.backlog.map((it) => (take.some((t) => t.id === it.id) ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};
const screen = (s: ZooGameState) => render(
  <MemoryRouter><DailyScrum state={s} onHold={noop} onSkip={noop} onDrop={noop} onSay={noop} /></MemoryRouter>,
).container;
const titles = (c: HTMLElement) => [...c.querySelectorAll('[data-step] h2')].map((h) => h.textContent);

describe('the Daily Scrum, in three steps', () => {
  it('asks its questions in order: the Goal, your turn, the plan', () => {
    expect(titles(screen(scrum()))).toEqual(['Will we make the Sprint Goal?', 'Your turn round the room', 'Change today’s plan']);
  });

  it('has one move, and it is the last step', () => {
    const c = screen(scrum());
    const moves = c.querySelectorAll('[data-move]');
    expect(moves.length, 'more than one thing asks to be done').toBe(1);
    const steps = c.querySelectorAll('[data-step]');
    expect(steps[steps.length - 1].contains(moves[0])).toBe(true);
  });

  it('gives one verdict, and does not contradict it', () => {
    const s = scrum();
    expect(goalAtRisk(s), 'this scene was meant to be at risk').toBe(true);
    const c = screen(s);
    expect(c.querySelector('[data-part="verdict"]')!.getAttribute('data-tone')).toBe('danger');
    expect(c.textContent, 'it says on track on a screen that says at risk').not.toMatch(/on track/i);
  });

  it('says yes, in green, when the Goal is safe', () => {
    const c = screen(scrum({ dayNumber: 1, sprintDays: 9 }));
    expect(c.querySelector('[data-part="verdict"]')!.getAttribute('data-tone')).toBe('done');
    expect(c.querySelector('[data-part="verdict"]')!.textContent).toMatch(/Yes/);
  });

  it('drops the stat boxes and the paragraph, which are folded into the verdict', () => {
    const c = screen(scrum());
    expect(c.textContent).not.toMatch(/Points done|Days left|runs in the game.s own seconds/);
    expect(c.querySelector('[data-part="verdict"]')!.textContent).toMatch(/points left/);
  });
});
