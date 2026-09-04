import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SprintRetro } from './SprintRetro';
import { DailyScrum } from './DailyScrum';
import { initialZooState } from './config';
import type { TeamDecision, ZooGameState } from './types';

// What you did, beside what happened.
//
// The Retrospective inspects how the team worked, and a team cannot inspect what it cannot
// remember. The log is what the game noticed at the time - attributed, because "somebody carried on
// past the blocker" is a different conversation from "the Developers did" - and carrying its cost
// where the game knows one, because "carried on past the blocker" learns less beside "45% of the
// next day".

const decision = (over: Partial<TeamDecision>): TeamDecision =>
  ({ sprint: 1, kind: 'moved', what: 'did a thing', ...over });

const retro = (over: Partial<ZooGameState> = {}) => {
  const base = initialZooState(3);
  const state: ZooGameState = {
    ...base, phase: 'retro', sprintNumber: 1, sprintGoal: 'Open the Big Cats zone',
    sprintGoalMet: true, velocity: [16],
    decisions: [
      decision({ by: 'developer', what: 'The Developers chose the Sprint Backlog: 5 items, 18 points.' }),
      decision({ kind: 'daily-scrum', by: 'developer', what: 'Day 2: the Daily Scrum was skipped, with something waiting to be raised.',
        cost: 'the blocker grew overnight: about 45% of the next day' }),
      decision({ by: 'product_owner', what: 'The Product Owner declined the fence feedback at the Review.' }),
    ],
    ...over,
  } as ZooGameState;
  return render(<SprintRetro state={state} onNextSprint={() => {}} onSetDod={() => {}} />).container;
};

describe('the Retrospective reads the Sprint back', () => {
  it('shows the decision log, attributed', () => {
    const text = retro().textContent ?? '';
    expect(text).toContain('Decision log');
    expect(text, 'a decision was listed with nobody attached to it').toContain('Developers');
    expect(text).toContain('Product Owner');
  });

  it('puts the cost beside the decision that carried one', () => {
    const text = retro().textContent ?? '';
    expect(text, 'carrying on past a blocker was recorded without what it cost')
      .toMatch(/45% of the next day/);
  });

  it('says what the Sprint cost and what it earned', () => {
    const text = retro().textContent ?? '';
    expect(text).toContain('What it cost, and what it earned');
    expect(text, 'the goal verdict is missing').toMatch(/goal met/i);
    expect(text, 'velocity is not read back').toMatch(/Velocity so far/i);
  });

  it('says the goal was not met when it was not', () => {
    expect(retro({ sprintGoalMet: false }).textContent ?? '').toMatch(/goal not met/i);
  });
});

describe('the Daily Scrum counts one day one way', () => {
  it('includes the day it is held on, the same as the decision under it', () => {
    // Two numbers for the same thing on one screen is worse than either of them being wrong.
    const state = { ...initialZooState(3), phase: 'sprint', dayStage: 'dailyScrum',
      sprintDays: 3, dayNumber: 2, sprintGoal: 'Open the Big Cats zone' } as ZooGameState;
    const { container } = render(<DailyScrum state={state} onHold={() => {}} onSkip={() => {}} />);
    const figures = [...container.querySelectorAll('div')]
      .map((d) => d.textContent ?? '').filter((t) => /Days left$/.test(t.trim()));
    expect(figures.length, 'the day figure is not on the screen').toBeGreaterThan(0);
    expect(figures.join(' '), 'day 2 of 3 should have two days left, today included').toMatch(/2/);
  });
});
