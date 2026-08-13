import { describe, it, expect } from 'vitest';
import { buildNav, routeAcross, wet, type NavInput, type Pt } from './parkNav';

const river = { x0: 0, y0: 200, x1: 880, y1: 250 };          // spans the park, fence to fence
const bridge = { x0: 400, y0: 190, x1: 480, y1: 260 };        // the one way over it
const bridgePath: Pt[] = [{ x: 440, y: 180 }, { x: 440, y: 270 }];

const empty: NavInput = { paths: [], water: [], crossings: [] };

describe('wet', () => {
  it('sees water in the way, and a bridge over it', () => {
    const cut: NavInput = { ...empty, water: [river] };
    expect(wet({ x: 440, y: 100 }, { x: 440, y: 400 }, cut)).toBe(true);
    expect(wet({ x: 100, y: 100 }, { x: 300, y: 150 }, cut)).toBe(false); // both sides of the bank
    expect(wet({ x: 440, y: 100 }, { x: 440, y: 400 }, { ...cut, crossings: [bridge] })).toBe(false);
  });
});

describe('turned water', () => {
  // the same river stood on its end: it now runs up and down the park instead of across it
  const upDown = { x0: 0, y0: 200, x1: 880, y1: 250, rot: 90 };
  it('blocks the ground it actually covers, not its bounding box', () => {
    const cut: NavInput = { paths: [], water: [upDown], crossings: [] };
    // turning about its centre (440, 225) puts the band across the park's middle, top to bottom
    expect(wet({ x: 300, y: 225 }, { x: 600, y: 225 }, cut)).toBe(true);   // straight through it
    // turned, the band covers x 415-465; alongside it is dry all the way down the park
    expect(wet({ x: 380, y: 100 }, { x: 380, y: 600 }, cut)).toBe(false);
  });

  it('lets a turned bridge over it be crossed', () => {
    const bridgeOnIt = { x0: 400, y0: 185, x1: 480, y1: 265, rot: 90 };
    const cut: NavInput = { paths: [], water: [upDown], crossings: [bridgeOnIt] };
    expect(wet({ x: 300, y: 225 }, { x: 600, y: 225 }, cut)).toBe(false); // over the bridge
    expect(wet({ x: 300, y: 400 }, { x: 600, y: 400 }, cut)).toBe(true);  // and still wet elsewhere
  });
});

describe('routeAcross', () => {
  it('cuts straight across the grass when the network is no help', () => {
    const nav = buildNav({ ...empty, paths: [[{ x: 10, y: 10 }, { x: 870, y: 10 }]] });
    expect(routeAcross(nav, { x: 100, y: 300 }, { x: 200, y: 320 })).toEqual([{ x: 200, y: 320 }]);
  });

  it('follows the path when it is a sensible way to go', () => {
    // a walkway straight from the gate to the exhibit: taking it is barely longer than the crow flies
    const nav = buildNav({ ...empty, paths: [[{ x: 440, y: 400 }, { x: 440, y: 100 }]] });
    const route = routeAcross(nav, { x: 442, y: 398 }, { x: 438, y: 104 })!;
    expect(route.length).toBeGreaterThan(2); // it is walking the path, not one straight hop
    expect(route.every((p) => Math.abs(p.x - 440) < 6)).toBe(true);
  });

  it('will not wade a river that has no bridge', () => {
    const nav = buildNav({ ...empty, water: [river], paths: [[{ x: 10, y: 10 }, { x: 10, y: 400 }]] });
    expect(routeAcross(nav, { x: 440, y: 400 }, { x: 440, y: 100 })).toBeNull();
  });

  it('goes round to the bridge to cross, however far out of its way that is', () => {
    const nav = buildNav({
      paths: [bridgePath, [{ x: 100, y: 300 }, { x: 440, y: 300 }], [{ x: 440, y: 150 }, { x: 800, y: 150 }]],
      water: [river], crossings: [bridge],
    });
    const from = { x: 100, y: 300 }, to = { x: 800, y: 150 };
    const route = routeAcross(nav, from, to)!;
    expect(route).not.toBeNull();
    // every step of the way is dry, and it does cross the river inside the bridge
    let at = from, crossed = false;
    for (const p of route) {
      expect(wet(at, p, nav.input)).toBe(false);
      if (at.y > river.y1 && p.y < river.y0) crossed = true;
      if ((at.y > river.y0 && at.y < river.y1) || (p.y > river.y0 && p.y < river.y1)) {
        expect(Math.max(at.x, p.x)).toBeGreaterThanOrEqual(bridge.x0);
        expect(Math.min(at.x, p.x)).toBeLessThanOrEqual(bridge.x1);
      }
      at = p;
    }
    expect(crossed || route.some((p) => p.y > river.y0 && p.y < river.y1)).toBe(true);
  });
});
