import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintBoard } from './SprintBoard';
import { ActionRail } from './ActionRail';
import { initialZooState } from './config';
import { startOnTheBoard } from './engine';
import type { ZooGameState } from './types';

// Getting the first piece of work started.
//
// A newcomer played the live game through the playtest harness and never managed it. Fifteen of
// eighteen steps went on one item:
//
//   "Clicking 'Lion Enclosure 8' three times still hasn't done anything obvious."
//   "The instructions say 'Drag a card to Doing to start building' but I cannot drag with these
//    controls. There is no obvious way to move a card into the Doing column."
//
// Two separate faults, and they compound: the way in that was named could not be used, and the way
// in that could be used was not named - and was broken where a pointer actually lands.

const noop = () => {};
// Sprint 1 as the game hands it over: planned, with work sitting in To Do. The same state a
// player is in three clicks after the first screen, which is where the newcomer got stuck.
const sprint = (over: Partial<ZooGameState> = {}): ZooGameState =>
  ({ ...startOnTheBoard(initialZooState(1) as ZooGameState), dayStage: 'building', ...over }) as ZooGameState;

const board = (over: Partial<ZooGameState> = {}) => render(
  <MemoryRouter>
    <SprintBoard state={sprint(over)}
      onEstimate={noop} onToggleTask={noop} onFinishItem={noop}
      onStartItem={noop} onPull={noop} onSplitEpic={noop} onReorderSprint={noop}
      onAssignDev={noop} onOpen={noop} onEndDay={noop}
      onHoldDailyScrum={noop} onSkipDailyScrum={noop} onStartDay={noop} onBuilding={noop} />
  </MemoryRouter>,
).container;

describe('the reorder arrows on a card', () => {
  // They are a sibling laid OVER the card rather than inside it, because a button inside a button
  // is a thing browsers are left to guess about. The cost of that is a layer across the corner of
  // the card, and the layer was taking clicks the card should have had.
  it('let the card underneath have every click that is not on an arrow', () => {
    const layer = board().querySelector('[data-part="sprint-up"]')?.parentElement;
    expect(layer, 'the arrows are not laid over the card any more').toBeTruthy();
    expect(layer!.className, 'the layer swallows clicks meant for the card it sits on')
      .toMatch(/pointer-events-none/);
  });

  it('still take their own', () => {
    const c = board();
    for (const part of ['sprint-up', 'sprint-down']) {
      const b = c.querySelector(`[data-part="${part}"]`) as HTMLElement;
      expect(b, `there is no ${part}`).toBeTruthy();
      expect(b.className, `${part} went deaf along with the layer it sits in`).toMatch(/pointer-events-auto/);
    }
  });

  it('does not leave a dead patch where an arrow is switched off', () => {
    // The first card's "up" is disabled, and `disabled:pointer-events-none` drops its half of the
    // layer through to the layer itself. With the layer listening, that half ate the click; the
    // card never heard it. First and last card in the column, every time.
    const c = board();
    const up = c.querySelector('[data-part="sprint-up"]') as HTMLButtonElement;
    expect(up.disabled, 'the first card can be moved up, so this test is checking nothing').toBe(true);
    const layer = up.parentElement!;
    expect(layer.className).toMatch(/pointer-events-none/);
  });
});

describe('the card itself', () => {
  it('says it opens, and is a control that can be reached', () => {
    const card = board().querySelector('[data-part="board-card"]') as HTMLButtonElement;
    expect(card, 'there is no card on the board').toBeTruthy();
    expect(card.tagName, 'the card is not a control at all').toBe('BUTTON');
    expect(card.getAttribute('title') ?? '', 'the card does not say what clicking it does').toMatch(/open it/i);
  });
});

describe('what the rail says when nothing is being built', () => {
  it('names both ways to start, not only the one that needs a mouse', () => {
    const text = render(
      <MemoryRouter><ActionRail state={sprint()} /></MemoryRouter>,
    ).container.textContent ?? '';
    expect(text, 'the rail has nothing to say about starting work').toMatch(/start building/i);
    expect(text, 'drag is still the only way in it names - and it cannot be done from a keyboard')
      .toMatch(/open the card/i);
  });
});
