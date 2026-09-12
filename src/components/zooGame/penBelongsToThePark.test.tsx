import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ZooShell } from './ZooShell';
import { initialZooState } from './config';
import { presetFor, addFloraTo, addWaterTo, HABITAT_FEATURE_TYPES } from './design';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';

// The pen belongs to the park.
//
// Reported from playing it: "the path drawing tool kept active during the Look Inside". Inside a
// habitat the strip stops offering the pen - there is nothing to draw a path to in there - but the
// tool was still out, invisibly. So every press inside the pen was read as drawing a run, arranging
// a pool or a tree stopped working, and runs appeared that nobody meant to lay.
//
// Going inside puts the pen away. It draws the way IN to a habitat, which is a thing you can only
// see from outside it.

const game = (): { state: ZooGameState; pen: BacklogItem } => {
  const base = initialZooState(3);
  const found = base.backlog.find((it) => it.category === 'enclosure')!;
  const p = presetFor(found);
  const pen = { ...found, status: 'committed' as const, started: true, sprintNumber: 1,
    design: { ...p, colors: { ...p.colors, ground: '#c8a06a' },
      flora: addFloraTo({ ...p, flora: [] }, HABITAT_FEATURE_TYPES[0]),
      water: addWaterTo({ ...p, water: [] }) } } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintNumber: 1,
      sprintGoal: 'Deliver the Big Cats zone so visitors have more to enjoy',
      committedIds: [pen.id],
      backlog: base.backlog.map((it) => (it.id === pen.id ? pen : it)) } as ZooGameState,
    pen,
  };
};

const shell = (state: ZooGameState, pen: BacklogItem, more: Record<string, unknown> = {}) => render(
  <MemoryRouter>
    <ZooShell state={state} onSetClockPaused={() => {}} building={pen.id} drawing
      edit={{ onDesign: () => {}, onSetEnclosure: () => {}, onAddInside: () => {} }}
      drawRoute={{ id: pen.id, name: pen.name, style: { thickness: 14, color: '#c9a86a' } }}
      {...more}><div>the board</div></ZooShell>
  </MemoryRouter>,
);

const press = (container: HTMLElement, label: RegExp) => {
  const btn = [...container.querySelectorAll('button')]
    .find((b) => label.test(b.textContent?.replace(/\s+/g, ' ').trim() ?? ''));
  expect(btn, `nothing to press for ${label}`).toBeTruthy();
  fireEvent.click(btn!);
};

describe('going inside a habitat', () => {
  it('puts the pen away, so a press in there is not a run', () => {
    const { state, pen } = game();
    const laid: ZooConnector[] = [];
    const askedFor: boolean[] = [];   // what the shell asked for: false means "put the pen away"
    const { container } = shell(state, pen, {
      onAddConnector: (c: ZooConnector) => laid.push(c),
      onDrawing: (on: boolean) => askedFor.push(on),
    });

    // The pen is out on the park, which is where it belongs.
    const strip = () => container.querySelector('[data-part="park-options"]')!;
    expect(strip().textContent, 'the pen was not out to begin with').toMatch(/Drawing|Draw a path to it/i);

    press(container, /^Look inside$/i);
    expect(askedFor, 'going inside did not put the pen away').toEqual([false]);
    expect(strip().textContent, 'the inside of a habitat is offering a pen').not.toMatch(/Draw a path to it/i);

    const svg = container.querySelector('[data-part="park-plan"]')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    fireEvent.pointerDown(svg, { clientX: 200, clientY: 400 });
    fireEvent.pointerDown(svg, { clientX: 300, clientY: 500 });
    expect(laid, 'two presses inside a habitat drew a run across it').toEqual([]);
  });
});
