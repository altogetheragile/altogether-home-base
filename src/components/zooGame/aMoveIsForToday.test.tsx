import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { openGroup } from './openGroup';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState } from './types';

// Move picks up something already standing, to put it down somewhere else. Nothing ended a Move but
// putting the thing down, so one pressed and left lived as long as the screen did:
//
//   "When I pull in an enclosure that was partially Done I get the place the enclosure cursor again."
//   "When I look inside an enclosure to place rocks, etc I get the placement cursor."
//
// A Move now counts on the day it was pressed, and going inside a habitat puts it down.

const noop = () => {};
const game = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const pen = base.backlog.find((it) => it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintNumber: 1,
    sprintGoal: 'Open the Big Cats zone', committedIds: [pen.id],
    backlog: base.backlog.map((it) => (it.id === pen.id
      ? { ...it, status: 'committed' as const, started: true, sprintNumber: 1, design: presetFor(it), pos: { x: 300, y: 300 } } : it)),
    ...over,
  } as ZooGameState;
};
const penId = (s: ZooGameState) => s.backlog.find((it) => it.category === 'enclosure')!.id;
const shell = (s: ZooGameState) => (
  <MemoryRouter>
    <ZooShell state={s} onSetClockPaused={noop} building={penId(s)}
      edit={{ onDesign: noop, onSetEnclosure: noop, onAddInside: noop }}><div>the board</div></ZooShell>
  </MemoryRouter>
);
const carrying = () => !!document.querySelector('[aria-label^="Putting down"]');
const pressMove = () => {
  fireEvent.click([...openGroup('park').querySelectorAll('button')].find((b) => b.textContent === 'Move')!);
};

describe('a Move', () => {
  it('puts the habitat in your hand', () => {
    render(shell(game()));
    expect(carrying(), 'standing still, it is already in your hand').toBe(false);
    pressMove();
    expect(carrying(), 'Move did not pick it up').toBe(true);
  });

  it('is over when the day is', () => {
    const s = game();
    const { rerender } = render(shell(s));
    pressMove();
    expect(carrying()).toBe(true);
    // The same habitat, still in hand, on another day: the next Sprint, carried over.
    rerender(shell({ ...s, sprintNumber: 2,
      backlog: s.backlog.map((it) => (it.id === penId(s) ? { ...it, sprintNumber: 2 } : it)) } as ZooGameState));
    expect(carrying(), 'a Move from last Sprint is still in your hand').toBe(false);
  });

  it('is put down when you go inside the habitat', () => {
    const s = game();
    const { rerender } = render(shell(s));
    pressMove();
    expect(carrying()).toBe(true);
    const look = [...openGroup('inside').querySelectorAll('button')].find((b) => /Look inside/i.test(b.textContent ?? ''));
    expect(look, 'no way to look inside').toBeTruthy();
    fireEvent.click(look!);
    rerender(shell(s));
    expect(carrying(), 'inside the habitat, the whole of it is still in your hand').toBe(false);
  });
});
