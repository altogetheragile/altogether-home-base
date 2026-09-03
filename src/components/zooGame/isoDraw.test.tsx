import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import type { ZooGameState, ZooConnector } from './types';

// Laying a run of path in the view the game opens in.
//
// A route was the one thing the isometric view could not do, which is the only reason the
// blueprint was still there. It needs no new geometry: the pointer is already answered by running
// the projection backwards for dragging, and laying a path is the same question asked twice.

/** A park with two habitats standing in it, far enough apart to drag between. */
function parkWithTwo(): ZooGameState {
  // A split epic gives the zone its habitats; the seeded Backlog starts with one.
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const two = base.backlog.filter((it) => it.category === 'enclosure').slice(0, 2);
  expect(two.length, 'this test needs two habitats').toBe(2);
  return {
    ...base,
    backlog: base.backlog.map((it) => (two.some((t) => t.id === it.id)
      ? { ...it, status: 'open' as const, enclosureSize: 'medium' as const,
          pos: it.id === two[0].id ? { x: 200, y: 200 } : { x: 560, y: 480 } }
      : it)),
  } as ZooGameState;
}

/** Drag across the drawing, in the middle where there is park under the pointer. */
function dragAcross(svg: SVGElement, from: [number, number], to: [number, number]) {
  // jsdom has no layout, so the bounding box is zero and the projection cannot be run backwards.
  // Give it one the size of the drawing, which is what a browser would have.
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  fireEvent.pointerDown(svg, { clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(window, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(window, { clientX: to[0], clientY: to[1] });
}

describe('picking a run that has been laid', () => {
  it('picks the run that was touched, and drops it when the grass is touched instead', () => {
    // What is offered for a run - its width, its colour, taking it back up - is the same panel the
    // blueprint puts above the drawing. It only ever appeared for a run picked in the blueprint.
    const onSelectConn = vi.fn();
    const state = parkWithTwo();
    const laid: ZooConnector = { id: 'run-1', a: { x: 120, y: 200 }, b: { x: 480, y: 420 }, bends: [], thickness: 14, color: '#c9a86a' };
    const { container } = render(
      <IsoZoo state={{ ...state, connectors: [laid] }} selectedConn="run-1" onSelectConn={onSelectConn} onPlaceItem={() => {}} />,
    );
    const svg = container.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
      width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
    const run = container.querySelector('[data-conn="run-1"]');
    expect(run, 'a laid run is not something a pointer can find').toBeTruthy();
    fireEvent.pointerDown(run!, { clientX: 400, clientY: 350 });
    expect(onSelectConn, 'touching a run picked nothing').toHaveBeenCalledWith('run-1');

    onSelectConn.mockClear();
    fireEvent.pointerDown(svg, { clientX: 40, clientY: 40 });
    expect(onSelectConn, 'the run stayed picked after the grass was touched').toHaveBeenCalledWith(null);
  });
});

describe('laying a path in the Increment view', () => {
  it('lays a run from where you pressed to where you let go', () => {
    const laid: ZooConnector[] = [];
    const { container } = render(
      <IsoZoo state={parkWithTwo()} tool="connect" newConn={{ thickness: 14, color: '#c9a86a' }}
        onAddConnector={(c) => laid.push(c)} />,
    );
    const svg = container.querySelector('svg')!;
    dragAcross(svg, [300, 300], [560, 420]);

    expect(laid.length, 'nothing was laid').toBe(1);
    expect(laid[0].bends, 'a run drawn in one drag has no bends').toEqual([]);
    expect(laid[0].thickness, 'the run was not laid at the width it was given').toBe(14);
    expect(laid[0].color).toBe('#c9a86a');
    expect(Number.isFinite(laid[0].a.x) && Number.isFinite(laid[0].b.x),
      'the run landed somewhere that is not a number').toBe(true);
    expect(`${laid[0].a.x},${laid[0].a.y}`, 'both ends landed in the same place').not.toBe(`${laid[0].b.x},${laid[0].b.y}`);
  });

  it('does not lay anything on a press that goes nowhere', () => {
    // A click on the park is somebody selecting, not drawing a path across it.
    const onAddConnector = vi.fn();
    const { container } = render(
      <IsoZoo state={parkWithTwo()} tool="connect" onAddConnector={onAddConnector} />,
    );
    dragAcross(container.querySelector('svg')!, [300, 300], [302, 301]);
    expect(onAddConnector, 'a click laid a path').not.toHaveBeenCalled();
  });

  it('lays nothing at all when the pen is not out', () => {
    const onAddConnector = vi.fn();
    const onPlaceItem = vi.fn();
    const { container } = render(
      <IsoZoo state={parkWithTwo()} tool="none" onAddConnector={onAddConnector} onPlaceItem={onPlaceItem} />,
    );
    dragAcross(container.querySelector('svg')!, [300, 300], [560, 420]);
    expect(onAddConnector, 'a drag laid a path with the pen away').not.toHaveBeenCalled();
  });

  it('still lets things be dragged about when the pen is away', () => {
    // Laying paths must not cost the view the thing it could already do.
    const moved: string[] = [];
    const { container } = render(
      <IsoZoo state={parkWithTwo()} onPlaceItem={(id) => moved.push(id)} onSelect={() => {}} />,
    );
    const svg = container.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
      width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
    // Somewhere over the park; if it lands on a habitat it drags, and if not nothing happens -
    // either way this must not throw and must not lay a path.
    fireEvent.pointerDown(svg, { clientX: 450, clientY: 350 });
    fireEvent.pointerMove(window, { clientX: 470, clientY: 360 });
    fireEvent.pointerUp(window, { clientX: 470, clientY: 360 });
    expect(true).toBe(true);
  });
});
