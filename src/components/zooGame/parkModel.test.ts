import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { standingOnPark, groundSize, workingDesign, parkPositions, restingPlace } from './parkModel';
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
