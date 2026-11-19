import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { SprintPlanning } from './SprintPlanning';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// From the thirteenth scrum-master playtest (playtest-report-sm13).

const noop = () => {};
// A Sprint with everything in it Done and a Product Backlog with nothing sized: the board offers
// "Pull more in", and nothing in the panel it opens can come in.
const emptySprint = (): ZooGameState => {
  const s = initialZooState(3);
  const one = s.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 2, daySecondsLeft: 80,
    committedIds: [one.id],
    backlog: s.backlog.map((it) => (it.id === one.id
      ? { ...it, status: 'open' as const, sprintNumber: 1, started: true }
      : { ...it, unsized: true })),
  } as ZooGameState;
};
const board = (state: ZooGameState) => render(
  <MemoryRouter>
    <SprintBoard state={state}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop} onStartItem={noop}
      onPull={noop} onSplitEpic={noop} onAssignDev={noop}
      onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
      onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

describe('pulling more in, mid-Sprint, when nothing is ready', () => {
  // "The 'Pull more in' button has been clicked twice already and nothing has moved into To Do."
  it('says nothing is ready, and why, and stops offering the button it just pressed', () => {
    const { container } = board(emptySprint());
    fireEvent.click(screen.getByRole('button', { name: 'Pull more in' }));
    expect(container.querySelector('[data-part="nothing-ready"]')?.textContent).toMatch(/Nothing here is ready to pull in yet\. Open one and size it first/);
    expect(screen.queryByRole('button', { name: 'Pull more in' }), 'the button that opened it is still offered').toBeNull();
  });
});

describe('the refinement question at Sprint Planning', () => {
  // "None / 1 pt / 2 pts / 3 pts ... a game mechanic I haven't seen before" - every run.
  it('says what the points are, and that budgeting them is the game\'s', () => {
    const base = initialZooState(1);
    const s = { ...base, phase: 'planning', planningTopic: 'how', sprintGoal: 'A pleasanter park', sprintGoalAgreed: ['developer'] } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintPlanning state={s} onPlan={noop} onSetForecast={noop} onSetSprintGoal={noop}
          onEstimate={noop} onSetTasks={noop} onPlanShape={noop} onToggleGoalCritical={noop}
          onReorderForecast={noop} onRefine={noop} onTakeSignal={noop} onSplitEpic={noop} />
      </MemoryRouter>,
    );
    const said = container.querySelector('[data-part="refine-points-mean"]')?.textContent ?? '';
    expect(said).toMatch(/set aside from this Sprint.s work for the whole Scrum Team to refine the Product Backlog/);
    expect(said).toMatch(/this game.s way/);
  });
});
