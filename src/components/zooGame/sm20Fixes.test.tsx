import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { availableItems } from './engine';
import type { ZooGameState } from './types';

// From the twentieth scrum-master playtest (playtest-report-sm20).

const noop = () => {};

describe('topic three, with one item and no steps yet', () => {
  // "The steps area says 'No other item is waiting for a plan' yet Tiger is selected and shows
  // 'no steps yet'. It is unclear whether I need to add steps for Tiger."
  it('says this is the only item still without a plan, not that nothing is waiting', () => {
    const base = initialZooState(1);
    const one = availableItems(base).find((it) => !it.unsized)!;
    const s = { ...base, phase: 'planning', planningTopic: 'how', forecast: [one.id], sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'],
      backlog: base.backlog.map((it) => (it.id === one.id ? { ...it, tasks: [] } : it)) } as unknown as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
          onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
          onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
      </MemoryRouter>,
    );
    expect(container.textContent).toMatch(/This is the only item still without a plan/);
    expect(container.textContent).not.toMatch(/No other item is waiting for a plan/);
  });
});
