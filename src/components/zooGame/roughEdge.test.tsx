import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { parkOutline, outlinePath, hedgePoints, EDGE_WANDER, CANVAS_W, PROMENADE_Y, PAD, HEDGE_STEP } from './parkLayout';
import type { ZooGameState } from './types';

// The park is a piece of land, not a green rectangle.
//
// Its boundary with the countryside wanders; the front, where the promenade and the car park are,
// is straight, because that edge was built rather than grown.
//
// The rules that matter are not about how pretty it is:
//
//  - ONE boundary. A plan that wanders and an isometric view that squares off would be two parks.
//    That exact mistake - one rule with two definitions - has cost us the Done gate, the habitat
//    size and the front of the park, so the shape lives in `parkLayout` and both views read it.
//  - The land is always bigger than what stands on it. The edge only ever comes INWARD, and never
//    further in than `PAD`, which is how far from the edge anything is allowed to stand. A boundary
//    that could cut inside that would leave a fence hanging over the countryside.

const park = (): ZooGameState => ({ ...initialZooState(3), phase: 'sprint' } as ZooGameState);

describe('the park’s edge', () => {
  it('is the same edge every time it is drawn', () => {
    // A coastline that reshuffled on every tick is a hedge nobody could aim a path at.
    expect(outlinePath(parkOutline())).toBe(outlinePath(parkOutline()));
  });

  it('never takes land from under anything that can stand on it', () => {
    expect(EDGE_WANDER, 'the edge can wander inside the ground things stand on').toBeLessThan(PAD);
    for (const p of parkOutline()) {
      expect(p.x, 'the boundary left the plot').toBeGreaterThanOrEqual(-0.01);
      expect(p.x).toBeLessThanOrEqual(CANVAS_W + 0.01);
      expect(p.y, 'the boundary wandered onto the promenade').toBeLessThanOrEqual(PROMENADE_Y + 0.01);
    }
  });

  it('is straight across the front, where the promenade is', () => {
    const front = parkOutline().filter((p) => Math.abs(p.y - PROMENADE_Y) < 0.01);
    expect(front.length, 'the front of the park has grown a wobble').toBeGreaterThanOrEqual(2);
    expect(Math.max(...front.map((p) => p.x)) - Math.min(...front.map((p) => p.x)),
      'the straight front does not run the width of the park').toBeGreaterThan(CANVAS_W * 0.9);
  });
});

describe('the wood along it', () => {
  // Reported from playing it: "can we also have trees of different types and more ad-hoc spacing and
  // clumping around the edge?" - of a boundary that was one drawing, at one size, repeated every
  // HEDGE_STEP the whole way round. It read as a fence made of trees.
  //
  // A wood is not a row. The rules below are what makes it one, and they live in `parkLayout` with
  // the boundary itself, so the plan and the Increment plant the same wood rather than each
  // inventing its own.
  const wood = hedgePoints(HEDGE_STEP);
  const gaps = wood.slice(1).map((t, i) => Math.hypot(t.x - wood[i].x, t.y - wood[i].y));

  it('is more than one kind of tree', () => {
    expect(new Set(wood.map((t) => t.piece)).size,
      'the whole boundary is one tree drawn over and over').toBeGreaterThan(2);
  });

  it('does not grow them all to the same height', () => {
    expect(new Set(wood.map((t) => Math.round(t.size * 20))).size,
      'every tree on the boundary is the same size').toBeGreaterThan(4);
  });

  it('does not stand them a fixed pace apart', () => {
    const wide = Math.max(...gaps), tight = Math.min(...gaps);
    expect(wide / Math.max(1, tight), 'the trees are a metronome').toBeGreaterThan(2);
  });

  it('grows in clumps, with clearings between them', () => {
    // Both halves matter: trees close enough to be a stand, and gaps wide enough to be a gap. Jitter
    // alone gives a wavy row, which is the same row.
    expect(gaps.filter((g) => g < HEDGE_STEP * 0.45).length, 'nothing on the boundary clumps').toBeGreaterThan(3);
    expect(gaps.filter((g) => g > HEDGE_STEP * 1.1).length, 'the wood has no clearings in it').toBeGreaterThan(3);
  });

  it('is the same wood every time it is asked', () => {
    // Redrawn on every tick of the clock. A wood that reshuffled would be a park that boiled.
    expect(hedgePoints(HEDGE_STEP)).toEqual(wood);
  });

  it('stands all of it on the land, and none across the front', () => {
    for (const t of wood) {
      expect(t.x, 'a tree grew off the side of the plot').toBeGreaterThanOrEqual(0);
      expect(t.x, 'a tree grew off the side of the plot').toBeLessThanOrEqual(CANVAS_W);
      expect(t.y, 'a tree grew across the way in').toBeLessThan(PROMENADE_Y);
    }
  });

  it('is drawn as the mixture it is, in both views', () => {
    const plan = render(<ParkPlan state={park()} />).container;
    const iso = render(<IsoZoo state={park()} height={460} />).container;
    const kinds = (el: Element) => new Set([...el.querySelectorAll('[data-tree]')]
      .map((n) => n.getAttribute('data-tree')));
    expect(kinds(plan).size, 'the plan paints every boundary tree the same').toBeGreaterThan(2);
    expect(kinds(iso).size, 'the Increment stands up one tree drawing repeated').toBeGreaterThan(2);
  });
});

describe('both drawings of it', () => {
  const bends = (d: string) => d.split('C').length - 1;

  it('the plan draws the boundary itself, not a rectangle', () => {
    const { container } = render(<ParkPlan state={park()} />);
    const land = [...container.querySelectorAll('path')]
      .find((p) => p.getAttribute('d') === outlinePath(parkOutline()));
    expect(land, 'the plan is painting a green rectangle again').toBeTruthy();
  });

  it('the isometric view draws the same boundary, through its own projection', () => {
    const { container } = render(<IsoZoo state={park()} height={460} />);
    const land = container.querySelector('[data-land="grass"]');
    expect(land?.tagName, 'the ground in the isometric view is a rectangle').toBe('path');
    expect(bends(land!.getAttribute('d') ?? ''),
      'the two views disagree about how many times the boundary turns')
      .toBe(bends(outlinePath(parkOutline())));
  });
});
