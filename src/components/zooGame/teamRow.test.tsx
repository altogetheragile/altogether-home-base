import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ZooShell } from './ZooShell';
import { TeamRow, MEMBER_DRAG } from './ScrumTeam';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Somebody takes the work; nobody is given it.
//
// Dragging a person onto a Product Backlog item is how the Flow Game says "I will take that", and
// it is what a self-managing team does. The Scrum Guide has the Product Owner and the Scrum Master
// taking part as Developers only when they are working on Sprint Backlog items, so their names do
// not go on the cards here - and the game says why rather than doing nothing.

const noop = () => {};
const state = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const item = base.backlog.find((it) => !it.unsized && it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, daySecondsLeft: 80,
    committedIds: [item.id],
    backlog: base.backlog.map((it) => (it.id === item.id
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

const board = (onAssignDev = noop) => render(
  <MemoryRouter>
    <SprintBoard state={state()} onAssignDev={onAssignDev}
      onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop}
      onStartItem={noop} onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop}
      onRenameMember={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
);

/** A drag payload the way the browser carries one. */
const payload = (data: string) => {
  const store: Record<string, string> = { 'text/plain': data };
  return { types: ['text/plain'], getData: (k: string) => store[k] ?? '', setData: () => {}, effectAllowed: '' };
};

describe('the team along the top', () => {
  it('is a band under the tabs, saying what each of them is doing', () => {
    // The accountabilities were invisible: a row of name chips that said who was on the team and
    // nothing about what any of them were for. The band says it continuously.
    const { container } = render(
      <MemoryRouter><ZooShell state={state()} onRenameMember={noop}><div>the screen</div></ZooShell></MemoryRouter>,
    );
    const row = container.querySelector('[data-part="seat-band"]')!;
    expect(row, 'the team is not on the screen at all').toBeTruthy();
    expect(row.textContent).toMatch(/PO/);
    expect(row.textContent).toMatch(/SM/);
    for (const dev of state().team.developers) expect(row.textContent).toContain(dev.name);
    expect(board().container.querySelector('[data-part="seat-band"]'),
      'the team is back above the board, pushing the work down').toBeNull();
  });

  it('lets a Developer be dragged onto a card, and that is them taking it', () => {
    const onAssignDev = vi.fn();
    const { container } = board(onAssignDev);
    const dev = state().team.developers[0];
    const card = [...container.querySelectorAll('[draggable="true"]')]
      .find((el) => /Lion Enclosure/.test(el.textContent ?? ''))!;
    fireEvent.drop(card, { dataTransfer: payload(MEMBER_DRAG + dev.id) });
    expect(onAssignDev, 'dropping a Developer on the work did nothing').toHaveBeenCalledWith(
      expect.stringContaining('lion'), dev.id,
    );
  });

  it('leaves a card being moved to the column that handles it', () => {
    // The card is draggable itself - that is how work moves between columns - so anything that is
    // not a person has to fall through rather than being swallowed here.
    const onAssignDev = vi.fn();
    const { container } = board(onAssignDev);
    const card = [...container.querySelectorAll('[draggable="true"]')]
      .find((el) => /Lion Enclosure/.test(el.textContent ?? ''))!;
    fireEvent.drop(card, { dataTransfer: payload('lion-enc') });
    expect(onAssignDev, 'a card being moved was read as somebody taking it').not.toHaveBeenCalled();
  });

  it('says why the Product Owner’s name does not go on the work', () => {
    const onWho = vi.fn();
    render(<MemoryRouter><TeamRow team={state().team} onWho={onWho} /></MemoryRouter>);
    const po = screen.getByTitle('The Product Owner');
    fireEvent.dragStart(po, { dataTransfer: payload('') });
    expect(onWho, 'dragging the Product Owner did nothing and explained nothing').toHaveBeenCalled();
    expect(onWho.mock.calls[0][0]).toMatch(/working on Sprint Backlog items/);
  });
});
