import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RefineBacklog } from './RefineBacklog';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import type { ZooGameState } from './types';

// "They might decide not to do upfront refinement and refine an item in Sprint Planning with
// additional mid-sprint refinement." (Al, 5 Nov 2026.) The Guide allows it: "The Scrum Team may
// refine these items during this process." The button to Planning was disabled until something was
// sized, which decided for the team that refinement happens first.

const noop = () => {};
const nothingReady = (): ZooGameState => {
  const s = { ...initialZooState(3), phase: 'refine', adopted: ['refinement'] } as ZooGameState;
  return { ...s, backlog: s.backlog.map((it) => ({ ...it, unsized: true })) } as ZooGameState;
};

describe('going to Sprint Planning with nothing Ready', () => {
  it('is a choice the screen offers, not one it refuses', () => {
    render(<MemoryRouter>
      <RefineBacklog state={nothingReady()} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop}
        onEstimate={noop} onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop}
        onMoveBefore={noop} onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop}
        onDuplicatePbi={noop} onPlan={noop} />
    </MemoryRouter>);
    const go = screen.getByRole('button', { name: /Go to Sprint Planning/ });
    expect(go).not.toBeDisabled();
    expect(document.body.textContent).toMatch(/refine in Sprint Planning/i);
  });

  it('arrives at Planning, where the items can still be refined', () => {
    const s = reducer(nothingReady(), { type: 'SET_PHASE', phase: 'planning' });
    expect(s.phase).toBe('planning');
    render(<MemoryRouter>
      <SprintPlanning state={{ ...s, planningTopic: 'what' } as ZooGameState} onPlan={noop} onSetForecast={noop}
        onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
        onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} onSetSprintGoal={noop} />
    </MemoryRouter>);
    // Opening an item that is not Ready offers to put it right, at Planning's cost.
    const first = s.backlog.find((it) => it.status === 'backlog')!;
    fireEvent.click(screen.getAllByText(first.name)[0]);
    expect(screen.getAllByRole('button').some((b) => /^(Split it|Size it)$/.test(b.textContent?.trim() ?? '')),
      'Planning offers no way to refine what is not Ready').toBe(true);
  });
});
