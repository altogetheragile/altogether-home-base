import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkOptions } from './ParkOptions';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';

// The pen, in the player's hand.
//
// Both of these were found by playing it, and both are the same shape of fault: the rule was right
// and the control was missing, so the one criterion the park answers by looking for a path could not
// be met by hand at all. The Developers laid runs and a person could not.

const game = (over: Partial<ZooGameState> = {}): ZooGameState => {
  const base = initialZooState(3);
  const pen = base.backlog.find((it) => it.category === 'enclosure')!;
  return {
    ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintNumber: 1,
    sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
    committedIds: [pen.id],
    backlog: base.backlog.map((it) => (it.id === pen.id
      // In hand: started, being built, and standing wherever the park seated it. No `pos` - nobody
      // has dragged it, which is the ordinary case and was the broken one.
      ? { ...it, status: 'committed' as const, started: true, sprintNumber: 1, design: presetFor(it) } : it)),
    ...over,
  } as ZooGameState;
};
const penOf = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.category === 'enclosure')!;

describe('the pen is offered for a habitat', () => {
  it('even when nobody has dragged it, because the park seated it', () => {
    // Reported by playing it: the strip offered a fence, a footprint, a ground and a turn, and no
    // way to draw the path its own criterion asks for. The control was gated on the item carrying a
    // position of its own, which only happens once somebody has moved it.
    const s = game();
    const { container } = render(
      <MemoryRouter>
        <ParkOptions state={s} item={penOf(s)} inside={null} onDrawing={() => {}}
          api={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {} }} />
      </MemoryRouter>,
    );
    const strip = container.querySelector('[data-part="park-options"]')!;
    expect(strip.textContent, 'the habitat was offered no pen to draw its way in with')
      .toMatch(/Draw a path to it/i);
  });
});

describe('a run drawn to a habitat belongs to it', () => {
  it('is the habitat’s own work, not a run that belongs to nobody', () => {
    // The other half. Without this the run counted for the criterion - the park only asks whether
    // anything reaches the pen - but it belonged to no item, so the Developers laid a second one
    // beside it and the work the player did was not the work the card was Done by.
    const s = game();
    const pen = penOf(s);
    const laid: ZooConnector[] = [];
    const { container } = render(
      <MemoryRouter>
        <ZooShell state={s} onSetClockPaused={() => {}} building={pen.id} drawing
          drawRoute={{ id: pen.id, name: pen.name, style: { thickness: 14, color: '#c9a86a' } }}
          onAddConnector={(c: ZooConnector) => laid.push(c)}><div>the board</div></ZooShell>
      </MemoryRouter>,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    // jsdom lays nothing out, and the park maps a pointer through its own box.
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(svg, { clientX: 40, clientY: 700 });
    fireEvent.pointerDown(svg, { clientX: 120, clientY: 400 });
    expect(laid.length, 'two clicks on the park drew nothing').toBe(1);
    expect(laid[0].itemId, 'the run the player drew belonged to nobody').toBe(pen.id);
  });
});
