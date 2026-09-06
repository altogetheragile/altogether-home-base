import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ZooShell } from './ZooShell';
import { BoardTools } from './BoardTools';
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

  it('carries the pane height down to the column, so a full column scrolls', () => {
    // Reported from a live game: "I can't scroll on the Scrum board so cannot Open items lower
    // down." Six items in To Do, one visible, no scrollbar. The cell the column sits in had no
    // height of its own, so the column grew to its cards and the region simply cut them off.
    const { container } = board();
    const heading = [...container.querySelectorAll('h3')].find((h) => /^To Do/.test(h.textContent ?? ''))!;
    const column = heading.closest('div')!.parentElement!;
    const cell = column.parentElement!;
    const region = cell.parentElement!;
    expect(/grid-rows-1/.test(region.className), 'the row of columns takes its height from its cards').toBe(true);
    for (const cls of ['flex', 'min-h-0', 'flex-col']) {
      expect(cell.className, `the cell the column sits in is not a ${cls} box`).toContain(cls);
    }
    expect(column.className, 'the column does not fill its cell').toMatch(/h-full|flex-1/);
    const body = column.lastElementChild!;
    expect(body.className, 'the column itself does not scroll').toContain('overflow-y-auto');
  });

  it('keeps the game’s tools on the strip, and off the play space', () => {
    // They were two rows above the columns: a help button on one, the burndown and the gear on the
    // other, with a band of empty space under them. "Maximise the play space" - so they ride on the
    // strip beside Learn, where the other things you reach for are.
    expect(controls(board().container),
      'the tools are back on the board, above the work').toBeFalsy();

    const { container } = render(
      <MemoryRouter>
        <ZooShell state={state()} tools={<BoardTools state={state()} onSetScrumAt={noop} onSetLearnMode={noop} />}>
          <div>the board</div>
        </ZooShell>
      </MemoryRouter>,
    );
    const row = controls(container);
    expect(row, 'the tools are nowhere at all').toBeTruthy();
    expect(row.closest('.zoo-band'), 'the tools are not on the strip').toBeTruthy();
    expect(row.querySelector('[aria-label="Board settings"]'), 'the settings did not come with them').toBeTruthy();
  });
});
