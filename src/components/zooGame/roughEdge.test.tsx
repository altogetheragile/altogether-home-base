import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { parkOutline, outlinePath, EDGE_WANDER, CANVAS_W, PROMENADE_Y, PAD } from './parkLayout';
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
