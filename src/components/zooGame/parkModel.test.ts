import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { standingOnPark, groundSize, quarterOf, workingDesign, parkPositions, restingPlace, habitatSpot, type Standing } from './parkModel';
import { CANVAS_W } from './parkLayout';

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: over.id ?? 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [],
  ...over,
} as BacklogItem);

const zoo = (backlog: BacklogItem[]): ZooGameState =>
  ({ ...initialZooState(), zones: ['Big Cats'], backlog } as ZooGameState);

const ids = (s: ZooGameState) => standingOnPark(s).map((x) => x.item.id);

describe('what is standing on the park', () => {
  it('counts work under way, not only work delivered', () => {
    // The isometric view answered this question separately and answered it "delivered only", so
    // building in it showed nothing at all. One answer now, for both drawings.
    const s = zoo([
      item({ id: 'done', name: 'Lion Enclosure' }),
      item({ id: 'building', name: 'Tiger Enclosure', status: 'committed', started: true }),
      item({ id: 'waiting', name: 'Leopard Enclosure', status: 'committed', started: false }),
      item({ id: 'idea', name: 'Panda Enclosure', status: 'backlog' }),
    ]);
    expect(ids(s)).toEqual(['done', 'building']);
    expect(standingOnPark(s).find((x) => x.item.id === 'building')!.underWay).toBe(true);
    expect(standingOnPark(s).find((x) => x.item.id === 'done')!.underWay).toBe(false);
  });

  it('leaves a pathway off it - a route between things has no patch of ground', () => {
    expect(ids(zoo([item({ id: 'route', category: 'path', status: 'committed', started: true })]))).toEqual([]);
  });

  it('puts an animal in its habitat, and gives it its own plot when the habitat is not up yet', () => {
    const housed = zoo([
      item({ id: 'enc', name: 'Lion Enclosure' }),
      item({ id: 'lion', category: 'exhibit', template: 'lion', enclosureId: 'enc', status: 'committed', started: true }),
    ]);
    // It lives IN the habitat rather than beside it - the point of choosing a family is watching the
    // family turn up, and it cannot turn up in a building site next door.
    expect(ids(housed)).toEqual(['enc']);
    expect(standingOnPark(housed)[0].animals.map((a) => a.id)).toEqual(['lion']);

    const homeless = zoo([item({ id: 'lion', category: 'exhibit', template: 'lion', enclosureId: 'nowhere' })]);
    expect(ids(homeless)).toEqual(['lion']);
  });

  it('gives a building site the ground the building will actually need', () => {
    // Every site used to be hoarded off at a flat 64x60 whatever was being built, so a shop was
    // fenced into a kiosk-sized square and jumped to its real size on delivery.
    const shop = item({ id: 'shop', category: 'amenity', template: 'shop', status: 'committed', started: true });
    const kiosk = item({ id: 'kiosk', category: 'amenity', template: 'kiosk', status: 'committed', started: true });
    expect(groundSize(shop).w).toBeGreaterThan(groundSize(kiosk).w);
    // and the site is the same size as the finished thing, so nothing jumps when it is delivered
    expect(groundSize(shop)).toEqual(groundSize({ ...shop, status: 'open' }));
  });

  it('shows what is being designed, not only what was finished', () => {
    const draft = item({ id: 'e', status: 'committed', started: true,
      draftDesign: { parts: {}, colors: { ground: '#123456' } } });
    expect(workingDesign(draft).colors.ground).toBe('#123456');
    // a finished design wins over the draft it came from
    expect(workingDesign({ ...draft, design: { parts: {}, colors: { ground: '#abcdef' } } }).colors.ground).toBe('#abcdef');
    // and something never designed still has the shape it starts as, rather than nothing
    expect(workingDesign(item({ id: 'p', category: 'exhibit', template: 'lion' }))).toBeTruthy();
  });

  it('runs a river across the middle until somebody moves it', () => {
    // This rule lived in the plan view, so the isometric view drew a 220px puddle in a corner.
    const river = item({ id: 'riv', category: 'flora', template: 'river' });
    const s = zoo([river]);
    const standing = standingOnPark(s);
    const auto = parkPositions(standing);
    expect(restingPlace(river, standing[0].size, auto).x).toBe(CANVAS_W / 2);
    // dragged, it stays where it was put
    const moved = { ...river, pos: { x: 200, y: 300 } };
    expect(restingPlace(moved, standing[0].size, auto).x).toBe(200);
  });

  it('lays everything out somewhere on the park', () => {
    const s = zoo([
      item({ id: 'a', name: 'Lion Enclosure' }),
      item({ id: 'b', name: 'Tiger Enclosure', enclosureSize: 'large' }),
      item({ id: 'c', category: 'amenity', template: 'cafe' }),
      item({ id: 'd', category: 'flora', template: 'oak' }),
    ]);
    const standing = standingOnPark(s);
    const auto = parkPositions(standing);
    for (const st of standing) {
      const p = restingPlace(st.item, st.size, auto);
      expect(p.x, st.item.id).toBeGreaterThan(0);
      expect(p.x, st.item.id).toBeLessThan(CANVAS_W);
      expect(p.y, st.item.id).toBeGreaterThan(0);
    }
    // nothing laid on top of anything else
    const places = standing.map((st) => JSON.stringify(restingPlace(st.item, st.size, auto)));
    expect(new Set(places).size).toBe(places.length);
  });
});

describe('a family stands together, not on top of each other', () => {
  const pride = (spot?: { x: number; y: number }) =>
    item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion',
           enclosureId: 'enc', spot, design: { parts: { group: 'family' }, colors: {} } });

  it('gathers the family round the one that was moved', () => {
    // The dragged spot belongs to the ITEM, and one item can be a whole pride. Reading it for every
    // member put the lot on a single point, one lion thick: "when I select a lion to move they all
    // group together in one spot".
    const lion = pride({ x: 0.3, y: 0.4 });
    const places = [0, 1, 2, 3].map((m) => habitatSpot(lion, 0, 4, m));
    // the one that was taken hold of is exactly where it was put
    expect(places[0]).toEqual({ x: 0.3, y: 0.4 });
    // and no two of them are standing in the same place
    expect(new Set(places.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size).toBe(4);
    // ...but they are a family, so they are all near it, and all still inside the habitat
    for (const p of places) {
      expect(Math.hypot(p.x - 0.3, p.y - 0.4)).toBeLessThan(0.3);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(1);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(1);
    }
  });

  it('lays an unplaced herd along the floor', () => {
    const roaming = pride();
    const places = [0, 1, 2, 3].map((i) => habitatSpot(roaming, i, 4));
    expect(new Set(places.map((p) => `${p.x},${p.y}`)).size).toBe(4);
    expect(places[0].x).toBeLessThan(places[3].x); // spread out, left to right
  });

  it('keeps a big family inside the fence', () => {
    // Dropped in a corner, a pride of twelve must not put half of itself through the fence.
    const corner = pride({ x: 0.9, y: 0.92 });
    for (let m = 0; m < 12; m += 1) {
      const p = habitatSpot(corner, 0, 12, m);
      expect(p.x, `member ${m}`).toBeLessThanOrEqual(0.92);
      expect(p.y, `member ${m}`).toBeLessThanOrEqual(0.94);
    }
  });
});

describe('turning a box', () => {
  const box = (over: Partial<BacklogItem>) => item({ id: 'b', ...over });

  it('makes it as wide as it was deep, and only in quarters', () => {
    // A quarter turn of a box IS the swap - that is the whole of what it means for the ground it
    // takes. Answered here so both drawings, the automatic layout, the visitor routing and the hit
    // area all get the same answer rather than each working it out again.
    const shop = box({ category: 'amenity', template: 'shop' });
    const flat = groundSize(shop);
    expect(groundSize({ ...shop, rot: 90 })).toEqual({ w: flat.h, h: flat.w });
    expect(groundSize({ ...shop, rot: 180 })).toEqual(flat);
    expect(groundSize({ ...shop, rot: 270 })).toEqual({ w: flat.h, h: flat.w });

    const enc = box({ category: 'enclosure', enclosureSize: 'large' });
    const wide = groundSize(enc);
    expect(wide.w).toBeGreaterThan(wide.h);
    expect(groundSize({ ...enc, rot: 90 }).h).toBeGreaterThan(groundSize({ ...enc, rot: 90 }).w);
  });

  it('rounds a box to the nearest quarter, and leaves landscape at any angle it likes', () => {
    // Everything in an isometric park shares two axes, and that shared grid IS the look: a cafe at
    // 37 degrees stops agreeing with its own roof ridge, its awning and the fence next door. A
    // river is an organic shape and 37 degrees looks like a river, so landscape is left alone.
    expect(quarterOf(box({ category: 'amenity', template: 'shop', rot: 37 }))).toBe(0);
    expect(quarterOf(box({ category: 'amenity', template: 'shop', rot: 80 }))).toBe(1);
    expect(quarterOf(box({ category: 'amenity', template: 'shop', rot: -90 }))).toBe(3);
    // ...and a river keeps its own angle, which the drawing reads straight off `rot`.
    const river = box({ category: 'flora', template: 'river', rot: 37 });
    expect(quarterOf(river), 'a river was snapped to a quarter').toBe(0);
    expect(groundSize(river), 'a river had its length and width swapped').toEqual(groundSize({ ...river, rot: 0 }));
  });
});

// Nothing stands on top of anything else.
//
// Reported from a live game: "The Tiger enclosure was placed over the lion enclosure." The packer
// laid out every standing item, including the ones carrying a position of their own - so it
// reserved them a slot they were never going to stand in, and handed the ground they actually
// occupy to the next thing built.
describe('two things cannot stand on the same ground', () => {
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

  it('lays a new habitat clear of one somebody has placed', () => {
    const size = { w: 220, h: 160 };
    const placed = { item: { id: 'lion-enc', pos: { x: 300, y: 300 } }, size } as unknown as Standing;
    const fresh = { item: { id: 'tiger-enc' }, size } as unknown as Standing;
    const where = parkPositions([placed, fresh]);
    const tiger = where.get('tiger-enc')!;
    expect(tiger, 'the new habitat was never given a place at all').toBeTruthy();
    expect(overlap({ ...tiger, ...size }, { x: 300, y: 300, ...size }),
      'the new habitat was laid down on top of the one that was already there').toBe(false);
  });

  it('keeps every automatic position clear of every other one', () => {
    const size = { w: 200, h: 150 };
    const standing = [
      { item: { id: 'a', pos: { x: 200, y: 200 } }, size },
      { item: { id: 'b', pos: { x: 520, y: 220 } }, size },
      ...['c', 'd', 'e'].map((id) => ({ item: { id }, size })),
    ] as unknown as Standing[];
    const where = parkPositions(standing);
    const boxes = standing.map((s) => ({ id: s.item.id, ...size, ...(s.item.pos ?? where.get(s.item.id)!) }));
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(overlap(boxes[i], boxes[j]), `${boxes[i].id} and ${boxes[j].id} are standing on each other`).toBe(false);
      }
    }
  });
});
