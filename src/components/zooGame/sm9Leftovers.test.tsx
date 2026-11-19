import { describe, it, expect } from 'vitest';
import { render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Refinement planned in at Sprint Planning, on the board. It sat in To Do as a card beside the
// Lion, counted in the column, and the scrum-master playtests read it as a Sprint Backlog item
// (sm9, sm11, sm12): "refinement appearing as a Sprint Backlog item is unusual".

const noop = () => {};
const sprint = (refinement: { points: number; done: boolean }): ZooGameState => {
  const s = initialZooState(3);
  const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 2);
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 2, dayNumber: 1, daySecondsLeft: 80,
    committedIds: take.map((it) => it.id), sprintRefinement: refinement, plannedRefinement: true,
    backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id) ? { ...it, status: 'committed' as const, sprintNumber: 2 } : it)),
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
).container;

describe('refinement planned into a Sprint', () => {
  it('is a note over the board, not a card in To Do', () => {
    const c = board(sprint({ points: 1, done: false }));
    const note = c.querySelector('[data-part="refine-note"]');
    expect(note?.textContent).toMatch(/Refining the Product Backlog is planned this Sprint/);
    expect(within(note as HTMLElement).getByRole('button', { name: 'Hold it now' })).toBeTruthy();
    const todo = c.querySelector('[data-column="todo"]')!;
    expect(todo.textContent, 'it is still a card in To Do').not.toMatch(/Refin/);
    expect(todo.textContent, 'it is still counted in To Do').toMatch(/To Do\s*\(2\)/);
  });

  it('says so once it is held, and is not counted in Done', () => {
    const c = board(sprint({ points: 1, done: true }));
    expect(c.querySelector('[data-part="refine-note"]')?.textContent).toMatch(/Refined the Product Backlog this Sprint/);
    expect(c.querySelector('[data-column="done"]')?.textContent ?? '').not.toMatch(/Refin/);
  });
});
