import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import type { ZooGameState } from './types';

// Touching a part of a habitat in the view the game opens in.
//
// The design bench says "touch a part of it on the park to open that part's controls here", and in
// this view there was nothing to touch: the whole habitat is drawn, so the whole habitat is what a
// pointer found. The answer is read off what was actually drawn under the pointer rather than
// worked out from the box, so the part you get is the part you can see.

const ENC = 'e-parts';

/** A habitat with water in the corner of it, standing in the middle of the park. */
function parkWithWater(): ZooGameState {
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const one = base.backlog.find((it) => it.category === 'enclosure')!;
  return {
    ...base,
    backlog: base.backlog.map((it) => (it.id === one.id
      ? {
        ...it, id: ENC, status: 'open' as const, enclosureSize: 'large' as const, pos: { x: 350, y: 320 },
        design: { parts: { shape: 'rounded', water: 'on' }, colors: { ground: '#8fbf6a', fence: '#a8794a', water: '#5aa9c8' } },
      }
      : it)),
  } as ZooGameState;
}

/** jsdom has no layout, so the drawing has no size and the projection cannot be run backwards. */
function sized(svg: SVGElement) {
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** Where a drawn shape is, in the coordinates a pointer arrives in. The drawing is scaled to the
 *  width it was given, so a point in the picture has to be scaled the same way to press on it. */
function pressAt(svg: SVGElement, shape: Element): [number, number] {
  const vw = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
  const pts = (shape.getAttribute('points') ?? '').trim().split(/\s+/).map((q) => q.split(',').map(Number));
  const mid = pts.reduce((acc, [x, y]) => [acc[0] + x / pts.length, acc[1] + y / pts.length], [0, 0]);
  const k = svg.getBoundingClientRect().width / vw;
  return [mid[0] * k, mid[1] * k];
}

describe('touching a part of a habitat', () => {
  it('says which part was touched, not just which habitat', () => {
    const onPart = vi.fn();
    const { container } = render(
      <IsoZoo state={parkWithWater()} building={ENC} onPart={onPart} onPlaceItem={() => {}} />,
    );
    sized(container.querySelector('svg')!);

    for (const key of ['ground', 'fence', 'water']) {
      onPart.mockClear();
      const el = container.querySelector(`[data-item="${ENC}"][data-part="${key}"]`);
      expect(el, `the ${key} is not drawn as something a pointer can find`).toBeTruthy();
      fireEvent.pointerDown(el!, { clientX: 450, clientY: 350 });
      expect(onPart, `touching the ${key} opened the wrong controls`).toHaveBeenCalledWith({ id: ENC, key });
    }
  });

  it('gives the fence a band to touch, not a picket to hit', () => {
    // A picket is a few pixels of drawing. Found by clicking one in a browser: the pointer missed
    // it by a hair, landed on the grass behind, and colouring a fence became a game of its own.
    const { container } = render(<IsoZoo state={parkWithWater()} building={ENC} onPart={() => {}} onPlaceItem={() => {}} />);
    const floor = container.querySelector(`polygon[data-item="${ENC}"][data-part="ground"]`)!;
    const band = container.querySelector(`polygon[data-item="${ENC}"][data-part="fence"]`);
    expect(band, 'there is nothing round the habitat to touch for its fence').toBeTruthy();
    expect(band!.getAttribute('points'), 'the band does not follow the shape the habitat was given')
      .toBe(floor.getAttribute('points'));
    expect(Number(band!.getAttribute('stroke-width')), 'the band is too thin to hit').toBeGreaterThan(2);
  });

  it('answers only for the thing on the bench', () => {
    // Every fence in the park opening somebody else's controls is a park you cannot build in.
    const onPart = vi.fn();
    const { container } = render(
      <IsoZoo state={parkWithWater()} building="some-other-item" onPart={onPart} onPlaceItem={() => {}} />,
    );
    sized(container.querySelector('svg')!);
    fireEvent.pointerDown(container.querySelector(`[data-item="${ENC}"][data-part="ground"]`)!, { clientX: 450, clientY: 350 });
    expect(onPart, 'a habitat nobody has open answered for itself').not.toHaveBeenCalled();
  });

  it('drops the part when the press turns into a drag', () => {
    // Dragging a habitat about is moving it, not choosing its ground.
    const onPart = vi.fn();
    const moved: string[] = [];
    const { container } = render(
      <IsoZoo state={parkWithWater()} building={ENC} onPart={onPart} onPlaceItem={(id) => moved.push(id)} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const floor = container.querySelector(`[data-item="${ENC}"][data-part="ground"]`)!;
    // Press on the middle of the habitat's ground, then drag well clear of where it started.
    const [px, py] = pressAt(svg, floor);
    fireEvent.pointerDown(floor, { clientX: px, clientY: py });
    expect(onPart).toHaveBeenCalledWith({ id: ENC, key: 'ground' });
    fireEvent.pointerMove(window, { clientX: px + 120, clientY: py + 60 });
    expect(moved, 'the habitat was never picked up, so this proves nothing about dragging').toContain(ENC);
    expect(onPart, 'the part stayed open while the habitat was being dragged').toHaveBeenLastCalledWith(null);
    fireEvent.pointerUp(window, { clientX: px + 120, clientY: py + 60 });
  });

  it('says nothing while the pen is out', () => {
    // Drawing a path across a habitat is not choosing its fence.
    const onPart = vi.fn();
    const { container } = render(
      <IsoZoo state={parkWithWater()} building={ENC} onPart={onPart} tool="connect" onAddConnector={() => {}} />,
    );
    sized(container.querySelector('svg')!);
    fireEvent.pointerDown(container.querySelector(`[data-item="${ENC}"][data-part="fence"]`)!, { clientX: 450, clientY: 350 });
    expect(onPart, 'laying a path opened a part of what it was drawn over').not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { clientX: 450, clientY: 350 });
  });
});
