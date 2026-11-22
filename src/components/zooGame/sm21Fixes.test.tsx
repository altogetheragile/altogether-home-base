import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { PlanningPoker } from './PlanningPoker';
import { initialZooState } from './config';
import { availableItems, pokerHand } from './engine';
import type { ZooGameState } from './types';

// From the twenty-first scrum-master playtest (playtest-report-sm21).

const noop = () => {};
const planning = (s: ZooGameState) => render(
  <MemoryRouter>
    <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
      onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
      onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
  </MemoryRouter>,
);
const topicTwo = (base: ZooGameState) =>
  ({ ...base, phase: 'planning', planningTopic: 'what', sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'] }) as unknown as ZooGameState;

describe('sizing an item', () => {
  // "The sizing panel shows '8 5 8 5' ... no labels to say whose vote is whose."
  // "The 'Commit 2 pts' action felt like it was committing the item to the Sprint."
  it('shows one card for each Developer, under their name, and sizes rather than commits', () => {
    const s = initialZooState(1);
    const item = availableItems(s)[0];
    const { container } = render(<PlanningPoker item={item} state={s} seed={s.gameSeed} onCommit={noop} />);
    const cards = container.querySelectorAll('[data-part="poker-card"]');
    expect(cards.length, 'four cards for three Developers').toBe(s.team.developers.length);
    expect([...cards].map((c) => c.textContent?.replace(/[0-9]/g, ''))).toEqual(['Ada', 'Ben', 'Cara']);
    expect(screen.getByRole('button', { name: /^Size it at \d+ pts$/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Commit/ })).toBeNull();
  });

  it('deals as many cards as there are Developers', () => {
    const item = availableItems(initialZooState(1))[0];
    expect(pokerHand(item, 1, true, 3)).toHaveLength(3);
    expect(pokerHand(item, 1, true, 5)).toHaveLength(5);
  });
});

describe('topic two, before anything is measured', () => {
  // "'Expected velocity 21 pts' but also 'nothing measured at this Sprint length yet' - those two
  // statements feel contradictory."
  it('calls the number a first guess, not velocity', () => {
    const { container } = planning(topicTwo(initialZooState(1)));
    expect(container.textContent).toMatch(/First guess 21 pts/);
    expect(container.textContent).not.toMatch(/Expected velocity/);
  });

  // "'About 0 Sprints of ready work is waiting' yet there are 13 items listed."
  it('says why no ready work is waiting when nothing is sized', () => {
    const base = initialZooState(1);
    const s = topicTwo({ ...base, backlog: base.backlog.map((it) => ({ ...it, unsized: true })) } as ZooGameState);
    const { container } = planning(s);
    expect(container.textContent).toMatch(/No ready work is waiting: nothing on the Product Backlog is ready to pull yet/);
    expect(container.textContent).not.toMatch(/About 0 Sprints/);
  });
});
