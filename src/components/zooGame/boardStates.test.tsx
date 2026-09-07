import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// Two states of the Sprint Backlog tab, and one place an item's detail lives.
//
// From the screen flow of 7 September. The board carried everything on the cards - the plan, the
// criteria, the reasons, two buttons each - and four of those in a column is a wall. You cannot
// watch work move through a wall. So a card carries four things: name, points, who is on it, and a
// dot per step. The rest is one click away in the dialog.

const noop = () => {};
const base = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const s = initialZooState(3);
  const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 3);
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, daySecondsLeft: 80,
    committedIds: take.map((it) => it.id),
    backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
    ...over,
  } as ZooGameState;
};

const board = (state: ZooGameState, props: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <SprintBoard state={state}
      onEstimate={noop} onToggleTask={noop} onConfirmAc={noop} onFinishItem={noop} onStartItem={noop}
      onSetLearnMode={noop} onSetScrumAt={noop} onPull={noop} onSplitEpic={noop} onAssignDev={noop}
      onRenameMember={noop} onOpen={noop} onEndDay={noop} onHoldDailyScrum={noop} onSkipDailyScrum={noop}
      onStartDay={noop} onBuilding={noop} {...props} />
  </MemoryRouter>,
);

/** A drag payload the way the browser carries one. */
const payload = (data: string) => {
  const store: Record<string, string> = { 'text/plain': data };
  return { types: ['text/plain'], getData: (k: string) => store[k] ?? '', setData: () => {}, effectAllowed: '' };
};

describe('a card on the board', () => {
  it('carries four things and no buttons', () => {
    const { container } = board(base());
    const card = [...container.querySelectorAll('[data-part="board-card"]')]
      .find((c) => /Lion Enclosure/.test(c.textContent ?? ''))!;
    expect(card, 'the board has no cards on it').toBeTruthy();
    expect(card.textContent, 'the card does not say what it is worth').toMatch(/\d+/);
    expect(card.querySelectorAll('button').length, 'the card grew buttons again').toBe(0);
    // No step text on the board: the dots say how far along, and the dialog says what the steps are.
    expect(card.textContent, 'the plan is written out on the card').not.toMatch(/Set the footprint size/);
  });

  it('opens the dialog when you click it, and that is where the detail is', () => {
    const { container } = board(base());
    fireEvent.click([...container.querySelectorAll('[data-part="board-card"]')]
      .find((c) => /Lion Enclosure/.test(c.textContent ?? ''))!);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/^Steps$/), 'the dialog has no plan on it').toBeTruthy();
    expect(within(dialog).getByText(/What this needs to be/), 'the criteria are not in the dialog').toBeTruthy();
    // The Definition of Done is the product's bar, not this item's - it is named, and it is not listed.
    expect(dialog.textContent).toMatch(/Definition of Done is the same for every item/);
    expect(within(dialog).queryByText(/Peer-reviewed by another Developer/),
      'the Definition of Done was merged into the item’s own criteria').toBeNull();
  });

  it('does not offer a start that would be refused, and says why', () => {
    // An animal waits for its habitat. The button used to be pressable and the press thrown away.
    const s = base();
    const animal = s.backlog.find((it) => it.status === 'committed' && it.category === 'exhibit')!;
    const { container } = board(s);
    // "Lion" and "Lion Enclosure" both begin with Lion, so match the name exactly.
    fireEvent.click([...container.querySelectorAll('[data-part="board-card"]')]
      .find((c) => new RegExp(`^\\s*${animal.name}\\s*\\d`).test(c.textContent ?? ''))!);
    const start = screen.getByRole('button', { name: /Start it/ });
    expect(start.hasAttribute('disabled'), 'an animal could be started before its habitat').toBe(true);
    expect(screen.getByRole('dialog').textContent).toMatch(/has to be built first/);
  });

  it('tells the truth about what the park has checked', () => {
    // The park's verdicts are about a thing that has been built. On work nobody has started they
    // are about the preset it would start from, and a green tick there is a lie.
    const { container } = board(base());
    fireEvent.click([...container.querySelectorAll('[data-part="board-card"]')]
      .find((c) => /Lion Enclosure/.test(c.textContent ?? ''))!);
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelectorAll('.line-through').length,
      'criteria were ticked green on work nobody has begun').toBe(0);
  });
});

describe('the two states of the tab', () => {
  it('is the board when nothing is in hand', () => {
    const { container } = board(base());
    expect(container.querySelector('[data-part="token-rail"]'), 'the board is a rail with nothing in hand').toBeNull();
    expect(container.querySelectorAll('[data-part="board-card"]').length).toBeGreaterThan(1);
  });

  it('asks who takes it when a card is dropped on Doing', () => {
    // Nobody assigns work. The question on the drop is which of the Developers is picking it up,
    // and more than one may - that is swarming.
    const onStartItem = vi.fn();
    const s = base();
    const item = s.backlog.find((it) => it.status === 'committed' && it.category === 'enclosure')!;
    const { container } = board(s, { onStartItem });
    const card = [...container.querySelectorAll('[draggable="true"]')]
      .find((el) => (el.textContent ?? '').trim().startsWith(item.name))!;
    fireEvent.dragStart(card, { dataTransfer: payload(item.id) });
    const doing = [...container.querySelectorAll('h3')].find((h) => /^Doing/.test(h.textContent ?? ''))!
      .closest('div')!.parentElement!.parentElement!;
    fireEvent.dragOver(doing, { dataTransfer: payload(item.id) });
    fireEvent.drop(doing, { dataTransfer: payload(item.id) });

    expect(onStartItem, 'dropping a card on Doing did not start it').toHaveBeenCalledWith(item.id);
    const who = container.querySelector('[data-part="who-takes-it"]');
    expect(who, 'the card was taken into Doing and nobody was asked who is on it').toBeTruthy();
    for (const dev of s.team.developers) expect(who!.textContent).toContain(dev.name);
    expect(who!.textContent).toMatch(/swarming/);
  });
});
