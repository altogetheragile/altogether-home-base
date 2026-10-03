import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { ParkInspector } from './ParkInspector';
import { initialZooState } from './config';
import { ACCEPTANCE_CRITERIA } from './parkChecks';
import type { ZooGameState, BacklogItem } from './types';

// The button on the strip says where it goes.
//
// It carried the item's name and a bare count - "Lion Enclosure  0 of 5" - and nothing on it said
// what the five were. The panel it opens is headed "Acceptance criteria · 0 of 5", so the words
// existed; they were just on the far side of the press. Asked of it directly: "can we call this
// acceptance criteria - it is not clear what is behind it."
//
// Which makes the two of them one sentence in two halves, and halves drift. They read one string.

const noop = () => {};
const api = { onDesign: noop, onSetEnclosure: noop, onAddInside: noop, onInside: noop,
  onTurn: noop, onUnplace: noop, onOpenCard: noop };
const game = (): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', dayStage: 'building', sprintNumber: 1,
} as ZooGameState);
const of = (s: ZooGameState, c: string): BacklogItem => s.backlog.find((it) => it.category === c)!;
const strip = (s: ZooGameState, item: BacklogItem) => render(
  <MemoryRouter><ParkOptions state={s} item={item} api={api} /></MemoryRouter>,
).container;

describe('the chip on the build strip', () => {
  it('names what its count is a count of', () => {
    const s = game();
    const chip = strip(s, of(s, 'enclosure')).querySelector('[data-part="pbi-chip"]')!;
    expect(chip.textContent, 'the chip does not say what is behind it')
      .toContain(ACCEPTANCE_CRITERIA);
    expect(chip.textContent, 'the count went with it').toMatch(/\d+ of \d+/);
  });

  it('still says which item it is', () => {
    // The thing the second line must not cost: this button and a card on the board are both called
    // "Lion", and a newcomer stopped on that three times.
    const s = game();
    const lion = of(s, 'exhibit');
    const chip = strip(s, lion).querySelector('[data-part="pbi-chip"]')!;
    expect(chip.textContent, 'the item lost its name').toContain(lion.name);
    expect(chip.getAttribute('aria-label'), 'the accessible name lost the item')
      .toContain(lion.name);
  });

  it('says nothing about criteria for an item that has none', () => {
    const s = game();
    const bare = { ...of(s, 'enclosure'), acceptance: [] };
    const chip = strip(s, bare).querySelector('[data-part="pbi-chip"]')!;
    expect(chip.textContent, 'an item with no criteria is offered a count of them')
      .not.toContain(ACCEPTANCE_CRITERIA);
  });
});

describe('the button and the panel it opens', () => {
  // The panel has two shapes - a pill while something else has the floor, and the open list - and
  // they are written in two places. Checking one of them is how renaming the other got past this
  // test the first time it was run against a mutation.
  const panel = (props: Record<string, unknown>) => {
    const s = game();
    const item = of(s, 'enclosure');
    return render(<MemoryRouter><ParkInspector state={s} item={item} {...props} /></MemoryRouter>)
      .container.querySelector('[data-part="park-inspector"]');
  };
  // Read off the line itself. Taken off the whole chip, the item's name runs straight into it -
  // "Lion EnclosureAcceptance criteria" - and a pattern loose enough to find the words in that is
  // loose enough to find them in anything.
  const said = (el: Element | null) => (el?.textContent ?? '').match(/[A-Z][a-z]+ criteria/)?.[0] ?? '';

  it('use the same words, from the same place', () => {
    // Rendered rather than grepped: a shared constant that one of them stopped importing would
    // still be a shared constant.
    const s = game();
    const item = of(s, 'enclosure');
    const line = strip(s, item).querySelector('[data-part="pbi-criteria"]');
    expect(line, 'the chip has no line naming what its count is of').toBeTruthy();
    expect(said(line), 'the chip calls it something of its own').toBe(ACCEPTANCE_CRITERIA);
  });

  it('say it the same way whether the panel is a pill or open', () => {
    const shut = panel({ collapsed: true });
    const open = panel({ open: true, onOpenChange: () => {} });
    expect(shut, 'no pill to read').toBeTruthy();
    expect(open, 'the panel did not open').toBeTruthy();
    expect(open!.querySelector('[data-part="inspector-grip"]'),
      'the open panel is the pill again, so its heading was never read').toBeTruthy();
    expect(said(shut), 'the pill calls it something else').toBe(ACCEPTANCE_CRITERIA);
    expect(said(open), 'the open panel calls it something else').toBe(ACCEPTANCE_CRITERIA);
  });
});
