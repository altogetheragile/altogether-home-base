import type { ZooGameState, BacklogItem } from './types';
import { zonePlots } from './parkZones';
import { waterRects } from './parkWater';
import { standingOnPark, parkPositions, restingPlace, apronRing, groundSize, quarterOf, parkType } from './parkModel';
import { currentDesign, isLandscapeType } from './design';
import { buildNav, navRoute, routeAcross, wet, type NavInput, type Pt, type Rect } from './parkNav';
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
      // The dry ground a bridge makes is a little wider than the bridge: it has approaches at both
      // ends, and a run of path leaving it at an angle has to get clear of the water before it is
      // out over it again. Without the margin, a path drawn diagonally off a bridge is refused
      // halfway across for no reason anybody can see - the bridge is built, the path is laid, and
      // the visitors still stand on the bank.
      const APPROACH = 18;
      crossings.push(rectOf(b.at, { w: size.w + APPROACH * 2, h: size.h + APPROACH * 2 }, b.item));
      paths.push([{ x: b.at.x, y: b.at.y - size.h / 2 - 10 }, { x: b.at.x, y: b.at.y + size.h / 2 + 10 }]);
      continue;
    }
    if (kind === 'river' || kind === 'pond') water.push(rectOf(b.at, size, b.item));
  }

  return { paths, water, crossings, solid };
}

/** Whether there is a made route from the way in to this thing - paths only, no walking over the
 *  grass to get there.
 *
 *  Two different questions, and the park needs both. Whether a visitor CAN get somewhere allows for
 *  cutting across the grass, because a guest who cannot get anywhere at all is a worse bug than one
 *  who clips a corner - that is `walkTo`. Whether they can get there ON A PATH is what a habitat's
 *  own criterion asks, and it is the one that makes laying a path necessary rather than decorative.
 *  Asking the first question for the second one made the criterion free everywhere except across
 *  water. */
export function pathTo(state: ZooGameState, item: BacklogItem): Pt[] | null {
  const boxes = boxOf(state);
  const stand = boxes.find((b) => b.item.id === item.id)
    ?? boxes.find((b) => b.item.id === item.enclosureId);
  if (!stand) return null;
  const nav = buildNav(parkNetwork(state));
  const to: Pt = { x: stand.at.x, y: stand.at.y + stand.size.h / 2 + 26 };
  return navRoute(nav, ENTRANCE, to);
}

/** Which areas of the zoo the made paths reach.
 *
 *  What the main pathways are FOR: the spine serves the areas, whether or not anything has been built
 *  in them yet. Judging it on open habitats instead made finishing the spine depend on finishing a
 *  habitat, which is the dependency this whole change exists to remove. */
export function areasOnAPath(state: ZooGameState): { zone: string; joined: boolean }[] {
  // Asked of the runs somebody drew, not of the routing. The routing will let a point join the
  // network from any distance - that is deliberate, because a visitor who cannot get anywhere is a
  // worse bug than one who clips a corner - and it made this question answer yes wherever the
  // promenade existed, which is everywhere. A run with an end in the area is what "it runs to the
  // Savanna" means.
  const EDGE = 40; // design px of slack round the area's own ground
  const ends = (state.connectors ?? []).flatMap((c) => [c.a, c.b]);
  return [...zonePlots(state).values()].map((p) => ({
    zone: p.zone,
    joined: ends.some((e) => e.x >= p.x0 - EDGE && e.x <= p.x1 + EDGE
      && e.y >= p.y0 - EDGE && e.y <= p.y1 + EDGE),
  }));
}

/** Everything with a made route to it from the way in, by id. One network for the whole zoo, because
 *  this is asked of every zone on every render and building the park's paths per habitat is how a
 *  cheap question becomes an expensive one. */
export function reachedByPath(state: ZooGameState): Set<string> {
  const boxes = boxOf(state);
  const nav = buildNav(parkNetwork(state));
  const out = new Set<string>();
  for (const b of boxes) {
    const to: Pt = { x: b.at.x, y: b.at.y + b.size.h / 2 + 26 };
    if (navRoute(nav, ENTRANCE, to)) out.add(b.item.id);
  }
  return out;
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

// ============= What nobody can get to =============
//
// A zoo is not paid for what it built. It is paid for what a visitor could walk up to and look at,
// and those are different things the moment there is water in the way.
//
// This is what the river is FOR. Ground on the far side cannot be reached until somebody builds a
// bridge, so "open the Penguins" quietly depends on a piece of work with no visitors of its own -
// and the Product Owner has to order that piece above the thing everyone actually wants. The lesson
// only lands if the Sprint Review proves it: deliver the habitat, deliver the animal, open the
// gates, and watch six hundred people stand on the far bank.

export type Stranded = { item: BacklogItem; why: 'water' | 'path' };

/** Everything delivered, split into what a visitor can get to and what they cannot - with the
 *  reason, because "nobody came" teaches nothing and "nobody could cross the river" teaches the
 *  whole lesson. One network, built once: this is asked per item and the answer is the same park. */
export function whatVisitorsCanReach(state: ZooGameState): { reached: BacklogItem[]; stranded: Stranded[] } {
  const boxes = boxOf(state);
  const nav = buildNav(parkNetwork(state));
  const reached: BacklogItem[] = [];
  const stranded: Stranded[] = [];
  for (const it of state.backlog) {
    if (it.status !== 'open') continue;
    const stand = boxes.find((b) => b.item.id === it.id)
      ?? boxes.find((b) => b.item.id === it.enclosureId);
    // Nothing that stands on the park - a path, the signposts - is nowhere to walk TO. It is what
    // everything else is walked to along, so it is never stranded.
    if (!stand) { reached.push(it); continue; }
    const to: Pt = { x: stand.at.x, y: stand.at.y + stand.size.h / 2 + 26 };
    if (routeAcross(nav, ENTRANCE, to)) { reached.push(it); continue; }
    // Why not: water that has no crossing on it is a different failure from no path at all, and the
    // fix is a different Product Backlog item.
    stranded.push({ item: it, why: wet(ENTRANCE, to, nav.input) ? 'water' : 'path' });
  }
  return { reached, stranded };
}
