import { describe, it, expect } from 'vitest';
import { viewingSpot, apronRing, APRON_GAP, APRON_WIDTH } from './parkModel';
import { buildNav, routeAcross } from './parkNav';

// Nobody goes in with the lions.
//
// Reported from playing it, over a picture of a family standing in the lion enclosure: "visitors in
// the lion enclosure is not a good idea." They were walking to the exhibit's own position, which is
// the middle of the pen, and nothing told the routing that a fence is something you walk around.

const pen = { at: { x: 400, y: 300 }, size: { w: 180, h: 120 } };
const rect = {
  x0: pen.at.x - pen.size.w / 2, y0: pen.at.y - pen.size.h / 2,
  x1: pen.at.x + pen.size.w / 2, y1: pen.at.y + pen.size.h / 2,
};
const inside = (p: { x: number; y: number }) => p.x > rect.x0 && p.x < rect.x1 && p.y > rect.y0 && p.y < rect.y1;

describe('where a visitor stands to see a habitat', () => {
  it('is outside the fence', () => {
    const spot = viewingSpot(pen.at, pen.size);
    expect(inside(spot), 'a visitor was sent inside the pen').toBe(false);
  });

  it('is on the walkway that goes round it', () => {
    const spot = viewingSpot(pen.at, pen.size);
    const ring = apronRing(pen.at, pen.size);
    const near = ring.some((p) => Math.hypot(p.x - spot.x, p.y - spot.y) < pen.size.w);
    expect(near, 'the viewing spot is nowhere near the walkway').toBe(true);
    // ...and clear of the fence by the width of the walkway, not standing on it.
    expect(spot.y - rect.y1).toBeGreaterThanOrEqual(APRON_GAP);
    expect(spot.y - rect.y1).toBeLessThanOrEqual(APRON_GAP + APRON_WIDTH);
  });
});

describe('the way there', () => {
  it('does not cut through the pen', () => {
    // The apron is walkable and the pen is solid, so a route from the front of the park to the far
    // side of the habitat goes round it.
    const ring = apronRing(pen.at, pen.size);
    const paths = ring.slice(0, -1).map((p, i) => [p, ring[i + 1]]);
    const nav = buildNav({
      paths: [[{ x: 400, y: 700 }, { x: 400, y: 480 }], ...paths],
      water: [], crossings: [], solid: [rect],
    });
    const route = routeAcross(nav, { x: 400, y: 700 }, { x: pen.at.x, y: rect.y0 - APRON_GAP - APRON_WIDTH / 2 });
    expect(route, 'there is no way round to the far side at all').toBeTruthy();
    expect(route!.some(inside), 'the way to the far side went through the pen').toBe(false);
  });
});
