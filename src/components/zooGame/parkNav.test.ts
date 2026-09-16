import { describe, it, expect } from 'vitest';
import { buildNav, routeAcross, throughSolid, wet, type NavInput, type Pt } from './parkNav';

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

describe('parkNav: buildings are walked around, not through', () => {
  // A kiosk sitting square in the middle, with a path that goes round it.
  const kiosk = { x0: 380, y0: 260, x1: 460, y1: 340 };
  const nav = () => buildNav({
    paths: [
      [{ x: 100, y: 300 }, { x: 360, y: 300 }, { x: 360, y: 200 }, { x: 480, y: 200 }, { x: 480, y: 300 }, { x: 800, y: 300 }],
    ],
    water: [], crossings: [], solid: [kiosk],
  });

  it('will not cut a straight line through a building', () => {
    const n = nav();
    expect(throughSolid({ x: 100, y: 300 }, { x: 800, y: 300 }, n.input)).toBe(true);
    const route = routeAcross(n, { x: 100, y: 300 }, { x: 800, y: 300 })!;
    expect(route).not.toBeNull();
    let at = { x: 100, y: 300 };
    for (const p of route) { expect(throughSolid(at, p, n.input)).toBe(false); at = p; }
    expect(route.some((p) => p.y < kiosk.y0)).toBe(true); // it went round the top
  });

  it('lets a guest reach the building they are heading for', () => {
    const n = nav();
    const counter = { x: 420, y: 300 }; // inside the kiosk
    expect(throughSolid({ x: 100, y: 300 }, counter, n.input)).toBe(false);
    expect(routeAcross(n, { x: 100, y: 300 }, counter)).not.toBeNull();
    // ...and back out again
    expect(routeAcross(n, counter, { x: 800, y: 300 })).not.toBeNull();
  });

  it('never strands a guest when there is no way round', () => {
    // No path at all, just a building between the two points: they walk, rather than disappear.
    const n = buildNav({ paths: [], water: [], crossings: [], solid: [kiosk] });
    expect(routeAcross(n, { x: 100, y: 300 }, { x: 800, y: 300 })).not.toBeNull();
  });
});

describe('the paths people actually walk', () => {
  // A made path round the edge of an area is easily twice the diagonal, so at the old threshold
  // guests cut the corner and crossed the grass - and the picture showed people wandering about a
  // field while the path the player had just built stood empty. "Can I walk to it from the way in?"
  // is an acceptance criterion; a zoo where visitors ignore the paths is one where satisfying it
  // looks pointless.
  // A path that goes right round three sides to get somewhere 566 away in a straight line: 1,600
  // of walking, which is 2.8 times the crow's flight. Under the old threshold they cut across.
  const corner = () => buildNav({
    paths: [[{ x: 0, y: 0 }, { x: 0, y: 800 }], [{ x: 0, y: 800 }, { x: 400, y: 800 }],
      [{ x: 400, y: 800 }, { x: 400, y: 400 }]],
    water: [], crossings: [], solid: [],
  });

  it('goes the long way round rather than cutting across', () => {
    const route = routeAcross(corner(), { x: 0, y: 0 }, { x: 400, y: 400 })!;
    expect(route, 'nobody could get there at all').toBeTruthy();
    // Straight across is one leg. Round the two sides is several.
    expect(route.length, 'they cut the corner instead of taking the path').toBeGreaterThan(1);
    // ...and the way round passes the corner, which a straight line never does.
    expect(route.some((p) => p.y > 700), 'the route never went round the long way').toBe(true);
  });

  it('still walks when there is no made route at all', () => {
    // The fallback is deliberate: a guest who cannot get anywhere is a worse bug than one who
    // clips a corner.
    const route = routeAcross(buildNav({ paths: [], water: [], crossings: [], solid: [] }),
      { x: 0, y: 0 }, { x: 300, y: 300 });
    expect(route, 'a zoo with no paths yet strands everybody').toBeTruthy();
  });
});
