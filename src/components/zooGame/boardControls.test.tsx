import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// One Sprint Backlog screen.
//
// It was two states with a switch between them - Plan for the board, Build for the thing in your
// hands - and the switch was reported as confusing. It is: the board, the item and the park it
// stands on are the same work, and hiding two of them to show the third made you flip back and
// forth to answer one question. There is no switch now, and nothing to hide behind it.

const noop = () => {};
const state = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...initialZooState(3), phase: 'sprint', dayStage: 'building', ...over }) as ZooGameState;

const board = () => render(
  <MemoryRouter>
    <SprintBoard state={state()}
      onAddAnother={noop} onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
      onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
      onAssignDev={noop} onRenameMember={noop} onOpen={noop} onPlaceOnPark={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

const controls = (c: HTMLElement) => c.querySelector('[data-part="board-controls"]') as HTMLElement;

describe('the Sprint Backlog screen', () => {
  it('has no Plan and Build switch to get lost in', () => {
    render(
      <MemoryRouter>
        <ZooShell state={state()}><div>the board</div></ZooShell>
      </MemoryRouter>,
    );
    const labels = screen.getAllByRole('button').map((b) => (b.textContent ?? '').trim());
    expect(labels.includes('Plan'), 'the switch is back').toBe(false);
    expect(labels.includes('Build'), 'the switch is back').toBe(false);
  });

  it('shows the board itself, in the three columns work moves through', () => {
    const { container } = board();
    for (const column of ['To Do', 'Doing', 'Done']) {
      expect(container.textContent, `the ${column} column is missing`).toContain(column);
    }
    // The Product Backlog is a tab with a bench on it, not a fourth column here: pulling mid-Sprint
    // is a negotiation, and it belongs where the cost of it can be shown.
    const headings = [...container.querySelectorAll('h3, h4')].map((h) => (h.textContent ?? '').trim());
    expect(headings.some((h) => /^Product Backlog/.test(h)), 'the Product Backlog is a column again').toBe(false);
  });

  it('keeps what is left of the controls in one cluster', () => {
    const { container } = board();
    const row = controls(container);
    expect(row, 'the board controls are not a cluster at all').toBeTruthy();
    expect(/justify-between/.test(row.parentElement!.className),
      'the toolbar splits left and right, so the controls move when it wraps').toBe(false);
  });
});
