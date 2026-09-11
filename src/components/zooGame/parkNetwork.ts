import type { ZooGameState, BacklogItem } from './types';
import { zonePlots } from './parkZones';
import { waterRects } from './parkWater';
import { standingOnPark, parkPositions, restingPlace, apronRing, groundSize, quarterOf, parkType } from './parkModel';
import { currentDesign, isLandscapeType } from './design';
import { buildNav, routeAcross, type NavInput, type Pt, type Rect } from './parkNav';
import { CANVAS_W, FRONT_Y } from './parkLayout';

// ============= Where a visitor can go =============
//
// One definition of the walkable park, read off the model rather than collected while something is
// being drawn. Both drawings and anything that asks "can somebody actually get there?" use it, so
// they cannot disagree - which is the rule the isometric view lives by and the seventh disagreement
// between two drawings of the same state is the reason it is written down here.
//
// What makes a park walkable: the runs the Developers laid, the walkway round every habitat, the
// promenade along the front and the way in from the car park. What stops a visitor: water, unless
// there is a bridge over it. What they walk around rather than through: the habitats.

/** Where a visitor comes in, at the front of the park. */
export const ENTRANCE: Pt = { x: CANVAS_W / 2, y: FRONT_Y };

const boxOf = (state: ZooGameState) => {
  const standing = standingOnPark(state);
  const auto = parkPositions(standing, zonePlots(state));
  return standing.map((s) => ({ item: s.item, size: s.size, at: restingPlace(s.item, s.size, auto) }));
};

const rectOf = (at: Pt, size: { w: number; h: number }, item: BacklogItem): Rect => ({
  x0: at.x - size.w / 2, y0: at.y - size.h / 2, x1: at.x + size.w / 2, y1: at.y + size.h / 2,
  rot: quarterOf(item) * 90,
});

/** The park as somewhere to walk: paths, water, the crossings over it, and what to walk around. */
export function parkNetwork(state: ZooGameState): NavInput {
  const boxes = boxOf(state);
  const paths: Pt[][] = [];
  // The river is terrain: it is in the way whether or not anybody has built anything. Everything
  // else here is read off what the Scrum Team has delivered; this is read off the plot.
  const water: Rect[] = [...waterRects()];
  const crossings: Rect[] = [];
  const solid: Rect[] = [];

  // The promenade along the front, and the way in from the car park.
  // Along the middle of the promenade - the same band the plan paints and the isometric view walks.
  paths.push([{ x: 20, y: FRONT_Y }, { x: CANVAS_W - 20, y: FRONT_Y }]);
  paths.push([ENTRANCE, { x: ENTRANCE.x, y: FRONT_Y - 50 }]);

  // The runs the Developers laid.
  for (const c of state.connectors ?? []) {
    const a = c.a.featureId ? boxes.find((b) => b.item.id === c.a.featureId)?.at ?? { x: c.a.x, y: c.a.y } : { x: c.a.x, y: c.a.y };
    const z = c.b.featureId ? boxes.find((b) => b.item.id === c.b.featureId)?.at ?? { x: c.b.x, y: c.b.y } : { x: c.b.x, y: c.b.y };
    if (Number.isFinite(a.x) && Number.isFinite(z.x)) paths.push([a, z]);
  }

  for (const b of boxes) {
    if (b.item.category === 'enclosure') {
      // Round every habitat, and never through one.
      const ring = apronRing(b.at, b.size);
      for (let i = 0; i < ring.length - 1; i += 1) paths.push([ring[i], ring[i + 1]]);
      solid.push(rectOf(b.at, b.size, b.item));
      continue;
    }
    if (b.item.category !== 'flora') continue;
    const kind = currentDesign(b.item).parts.type ?? parkType(b.item);
    if (!isLandscapeType(kind)) continue;
    const size = groundSize(b.item);
    if (kind === 'bridge') {
      crossings.push(rectOf(b.at, size, b.item));
      paths.push([{ x: b.at.x, y: b.at.y - size.h / 2 - 10 }, { x: b.at.x, y: b.at.y + size.h / 2 + 10 }]);
      continue;
    }
    if (kind === 'river' || kind === 'pond') water.push(rectOf(b.at, size, b.item));
  }

  return { paths, water, crossings, solid };
}

/** Whether a visitor can get from the way in to this thing, and by what route. */
export function walkTo(state: ZooGameState, item: BacklogItem): Pt[] | null {
  const boxes = boxOf(state);
  const stand = boxes.find((b) => b.item.id === item.id);
  // An animal has no ground of its own: you go to the habitat it lives in.
  const target = stand ?? boxes.find((b) => b.item.id === item.enclosureId);
  if (!target) return null;
  const nav = buildNav(parkNetwork(state));
  const to: Pt = { x: target.at.x, y: target.at.y + target.size.h / 2 + 26 };
  return routeAcross(nav, ENTRANCE, to);
}

/** Everything delivered in one Sprint, in the order a visitor coming through the gate would meet
 *  it - nearest first along the paths that exist, with whatever cannot be reached at all last,
 *  because that is the part of the tour worth stopping on. */
export interface Delivered { item: BacklogItem; reachable: boolean; steps: number }

export function deliveredThisSprint(state: ZooGameState, sprint = state.sprintNumber): Delivered[] {
  const nav = buildNav(parkNetwork(state));
  const boxes = boxOf(state);
  const out = state.backlog
    .filter((it) => (it.status === 'done' || it.status === 'open')
      && (it.openedIn === sprint || it.sprintNumber === sprint))
    .map((item) => {
      const stand = boxes.find((b) => b.item.id === item.id)
        ?? boxes.find((b) => b.item.id === item.enclosureId);
      if (!stand) return { item, reachable: false, steps: Number.POSITIVE_INFINITY };
      const to: Pt = { x: stand.at.x, y: stand.at.y + stand.size.h / 2 + 26 };
      const route = routeAcross(nav, ENTRANCE, to);
      const steps = route
        ? route.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - route[i - 1].x, p.y - route[i - 1].y) : 0), 0)
        : Number.POSITIVE_INFINITY;
      return { item, reachable: !!route, steps };
    });
  return out.sort((a, z) => a.steps - z.steps);
}
