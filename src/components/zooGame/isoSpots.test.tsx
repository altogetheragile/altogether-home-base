import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { splitEpic } from './engine';
import type { BacklogItem, ZooGameState } from './types';

// Arranging what stands inside a habitat, in the view the game opens in.
//
// A pride is not a blob. Where each animal stands is a decision somebody makes one animal at a
// time, and this view could only move the habitat as a whole - so arranging a family meant going
// back to the blueprint. A spot is a fraction of its own habitat, which is why it survives the
// habitat being moved, resized, or the park being zoomed.

const ENC = 'e-spots';
const LION = 'a-lion';
const TREE = 'f-tree';
const BENCH = 'am-bench';

/** A habitat in the middle of the park with a family of three in it, and a tree standing outside. */
function stocked(): ZooGameState {
  const base = splitEpic(initialZooState(1), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  const one = base.backlog.find((it) => it.category === 'enclosure')!;
  const enc: BacklogItem = {
    ...one, id: ENC, status: 'done', enclosureSize: 'large', pos: { x: 340, y: 300 },
    design: { parts: { shape: 'rounded' }, colors: {} },
  } as BacklogItem;
  const lion: BacklogItem = {
    ...one, id: LION, name: 'Lion', category: 'exhibit', template: 'lion', status: 'done',
    enclosureId: ENC, pos: undefined, design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 1, cubs: 0 } },
  } as BacklogItem;
  const tree: BacklogItem = {
    ...one, id: TREE, name: 'Oak', category: 'flora', template: 'tree', status: 'done',
    enclosureId: undefined, pos: { x: 620, y: 520 }, design: { parts: { type: 'tree' }, colors: {} },
  } as BacklogItem;
  return { ...base, backlog: [enc, lion, tree, ...base.backlog.filter((it) => it.id !== one.id)] } as ZooGameState;
}

function sized(svg: SVGElement) {
  svg.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 900, bottom: 700,
    width: 900, height: 700, toJSON: () => ({}) }) as DOMRect;
  return svg;
}

/** The middle of a habitat, in the coordinates a pointer arrives in - read off the ground it is
 *  drawn on, which is the only thing in the picture that says where the habitat actually is. */
function middleOf(svg: SVGElement, encId: string): [number, number] {
  const floor = svg.querySelector(`polygon[data-item="${encId}"][data-part="ground"]`)!;
  const vw = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
  const pts = floor.getAttribute('points')!.trim().split(/\s+/).map((q) => q.split(',').map(Number));
  const mid = pts.reduce((acc, [x, y]) => [acc[0] + x / pts.length, acc[1] + y / pts.length], [0, 0]);
  const k = svg.getBoundingClientRect().width / vw;
  return [mid[0] * k, mid[1] * k];
}

/** Press on a thing in the drawing. Which thing is read off what the pointer landed on, so the
 *  coordinates only have to be somewhere sensible - here, the middle of its habitat. */
function pressOn(el: Element, at: [number, number], to: [number, number]) {
  fireEvent.pointerDown(el, { clientX: at[0], clientY: at[1] });
  fireEvent.pointerMove(window, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(window, { clientX: to[0], clientY: to[1] });
}

const last = (calls: unknown[][]) => calls[calls.length - 1];

describe('arranging a family inside its habitat', () => {
  it('moves the one animal that was picked up, not the whole exhibit', () => {
    const onSetMemberSpot = vi.fn();
    const onPlaceItem = vi.fn();
    const { container } = render(
      <IsoZoo state={stocked()} onSetSpot={() => {}} onSetMemberSpot={onSetMemberSpot} onPlaceItem={onPlaceItem} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const one = container.querySelector(`[data-spot="${LION}:1"]`);
    expect(one, 'the second of the family is not something a pointer can find').toBeTruthy();
    const [mx, my] = middleOf(svg, ENC);
    pressOn(one!, [mx, my], [mx + 40, my + 20]);

    expect(onSetMemberSpot, 'nothing was put anywhere').toHaveBeenCalled();
    const [id, member, spot] = last(onSetMemberSpot.mock.calls) as [string, number, { x: number; y: number }];
    expect(id).toBe(LION);
    expect(member, 'the wrong one of the family was moved').toBe(1);
    expect(spot.x).toBeGreaterThanOrEqual(0.08);
    expect(spot.x).toBeLessThanOrEqual(0.92);
    expect(onPlaceItem, 'picking up one animal moved the whole habitat').not.toHaveBeenCalled();
  });

  it('keeps it inside its own fence', () => {
    const onSetMemberSpot = vi.fn();
    const { container } = render(
      <IsoZoo state={stocked()} onSetSpot={() => {}} onSetMemberSpot={onSetMemberSpot} onPlaceItem={() => {}} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const [mx, my] = middleOf(svg, ENC);
    // Dragged right off the drawing: an animal has no way out of its habitat.
    pressOn(container.querySelector(`[data-spot="${LION}:0"]`)!, [mx, my], [mx + 800, my + 600]);
    const spot = last(onSetMemberSpot.mock.calls)![2] as { x: number; y: number };
    expect(spot.x, 'an animal was dragged out through its own fence').toBeLessThanOrEqual(0.92);
    expect(spot.y).toBeLessThanOrEqual(0.94);
  });
});

describe('planting a tree in a habitat', () => {
  it('plants it where it was let go', () => {
    const onNest = vi.fn();
    const { container } = render(
      <IsoZoo state={stocked()} onPlaceItem={() => {}} onNest={onNest} onSetSpot={() => {}} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const tree = container.querySelector(`[data-item="${TREE}"]`);
    expect(tree, 'the tree standing in the park is not something a pointer can find').toBeTruthy();
    const [ex, ey] = middleOf(svg, ENC);
    pressOn(tree!, [ex + 200, ey + 120], [ex, ey]);

    expect(onNest, 'a tree dropped on a habitat was left standing on top of it').toHaveBeenCalled();
    const [id, encId, spot] = last(onNest.mock.calls) as [string, string, { x: number; y: number }];
    expect(id).toBe(TREE);
    expect(encId).toBe(ENC);
    // Let go over the middle of the habitat, so that is where it is planted.
    expect(spot.x).toBeGreaterThan(0.3);
    expect(spot.x).toBeLessThan(0.7);
  });

  it('puts a tree where it was let go, not a stride behind it', () => {
    // A tree is drawn above the ground it stands on, so the pointer that grabs its canopy is
    // nowhere near its feet. Keeping that offset walked the tree along a stride behind wherever it
    // was let go - found by dragging one in a browser.
    const placed: { x: number; y: number }[] = [];
    const { container } = render(
      <IsoZoo state={stocked()} onPlaceItem={(_id, pos) => placed.push(pos)} onSetSpot={() => {}} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const [mx, my] = middleOf(svg, ENC);
    pressOn(container.querySelector(`[data-item="${TREE}"]`)!, [mx + 200, my + 120], [mx, my]);

    expect(placed.length, 'the tree was never picked up').toBeGreaterThan(0);
    const at = placed[placed.length - 1];
    // Let go over the middle of the habitat, which stands at 340,300 in the park.
    expect(Math.hypot(at.x - 340, at.y - 300), 'the tree landed a stride from where it was let go')
      .toBeLessThan(30);
  });

  it('leaves everything else standing on top: only planting is planted', () => {
    // A bench let go over a habitat is a bench somebody is still moving, not a bench inside the
    // fence with the lions. Only planting goes in, because only planting is planted.
    const onNest = vi.fn();
    const onPlaceItem = vi.fn();
    const state = stocked();
    const bench: BacklogItem = {
      ...state.backlog.find((it) => it.id === TREE)!, id: BENCH, name: 'Bench', category: 'amenity',
      template: 'bench', enclosureId: undefined, pos: { x: 600, y: 500 },
      design: { parts: { type: 'bench' }, colors: {} },
    } as BacklogItem;
    const { container } = render(
      <IsoZoo state={{ ...state, backlog: [...state.backlog, bench] }}
        onPlaceItem={onPlaceItem} onNest={onNest} onSetSpot={() => {}} />,
    );
    const svg = sized(container.querySelector('svg')!);
    const [ex, ey] = middleOf(svg, ENC);
    const drawn = container.querySelector(`[data-item="${BENCH}"]`);
    expect(drawn, 'the bench standing in the park is not something a pointer can find').toBeTruthy();
    pressOn(drawn!, [ex + 200, ey + 120], [ex, ey]);
    expect(onPlaceItem, 'the bench was never picked up, so this proves nothing').toHaveBeenCalled();
    expect(onNest, 'a bench was planted in a habitat by being dropped on it').not.toHaveBeenCalled();
  });
});
