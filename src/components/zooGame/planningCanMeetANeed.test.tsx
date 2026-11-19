import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// From the scrum-master playtest sm10: at Sprint 2's Planning, "Somewhere to sit" said "Not ready -
// nobody has decided what will meet this" and "You can put that right here", and its only button
// was "Size it". Sizing does not decide what meets a need, so the persona sized it, closed it and
// opened it again for the last fifty-five steps of the run.

const planningWhat = (): ZooGameState => {
  const base = initialZooState(1);
  const sit = base.backlog.find((it) => it.category === 'need')!;
  return { ...base, phase: 'planning', planningTopic: 'what', sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'],
    backlog: base.backlog.map((it) => (it.id === sit.id ? { ...it, estimate: 1, unsized: false } : it)) } as ZooGameState;
};

describe('a Need at Sprint Planning', () => {
  it('offers to decide what will meet it, and the choice reaches the game', () => {
    const s = planningWhat();
    const need = s.backlog.find((it) => it.category === 'need')!;
    const chosen: [string, string][] = [];
    render(
      <MemoryRouter>
        <SprintPlanning state={s} onPlan={() => {}} onSetForecast={() => {}} onSetSprintGoal={() => {}}
          onEstimate={() => {}} onSetTasks={() => {}} onPlanShape={() => {}} onToggleGoalCritical={() => {}}
          onReorderForecast={() => {}} onRefine={() => {}} onTakeSignal={() => {}} onSplitEpic={() => {}}
          onChooseSolution={(id, pick) => chosen.push([id, pick])} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(need.name) })[0]);
    expect(screen.queryByRole('button', { name: /Size it/ }), 'sizing does not decide what meets a need').toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /What will meet this\?/ }));
    const pick = document.querySelector('[data-part="choose-solution"]') as HTMLElement;
    expect(pick, 'no choice was offered').not.toBeNull();
    fireEvent.click(pick);
    expect(chosen).toEqual([[need.id, pick.getAttribute('data-pick')]]);
  });
});
