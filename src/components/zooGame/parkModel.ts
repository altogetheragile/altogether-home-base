import type { BacklogItem, ZooGameState } from './types';
import { standsOnPark } from './engine';
import { ENCLOSURE_SIZE, footprintFor, presetFor, isLandscapeType, type ItemDesign } from './design';
import { autoLayout, insidePark, CANVAS_W, PAD } from './parkLayout';

// ============= One park, described once =============
//
// The plan view and the isometric view are two drawings of the same zoo. They were also two
// independent answers to the same three questions - what is standing on the park, what does it look
// like, and how much ground does it take - and the answers drifted apart five times in a week:
//
//   - how long a river is lived in the plan view, so the isometric view drew a 220px puddle;
//   - the extra plants of a planting item were not drawn in the isometric view at all;
//   - the isometric view scattered its visitors, so people stood in the river;
//   - the isometric view drew only DELIVERED work, so building in it showed nothing;
//   - it painted a habitat from its zone's theme, so the ground and fence you chose did nothing.
//
// Every one of those was found by somebody using the game, because a feature added to one view is
// invisible in the other until it is missed. The answers live here now, so a change lands in both
// views or in neither.
//
// This module knows nothing about drawing. It says what is there, not what it looks like on screen -
// that is still each view's own business, and rightly so: one is a plan and one is a photograph.

/** What an item looks like RIGHT NOW.
 *
 *  What has been designed, or the draft being designed, or the shape it starts as. The thing being
 *  built is exactly the thing whose ground, fence and walls are being chosen, so a view that reads
 *  only the finished design shows you none of your own choices until you press Done - which is the
 *  opposite of building in place. There is no preview; the thing itself is what you look at. */
export const workingDesign = (item: BacklogItem): ItemDesign =>
  item.design ?? item.draftDesign ?? presetFor(item);

/** What kind of thing it is, as far as drawing is concerned - a lion, a kiosk, a river. */
export const parkType = (item: BacklogItem): string | undefined =>
  workingDesign(item).parts.type ?? item.template;

/** How much ground it takes, in design px.
 *
 *  A habitat's size is chosen from a few standard ones; everything else has a footprint per kind, so
 *  that a cafe is plainly a bigger thing than a kiosk and a signpost is plainly a post. */
export const groundSize = (item: BacklogItem): { w: number; h: number } =>
  item.category === 'enclosure' ? ENCLOSURE_SIZE[item.enclosureSize ?? 'medium'] : footprintFor(item);

/** One thing standing on the park, and what is standing in it. */
export interface Standing {
  item: BacklogItem;
  /** Still being built, so it stands behind hoardings. */
  underWay: boolean;
  /** Its own patch of ground. */
  size: { w: number; h: number };
  /** The animals living in it - habitats only, including any being stocked right now. */
  animals: BacklogItem[];
  /** Planting planted inside it. */
  plants: BacklogItem[];
}

/** Everything standing on the park, in the order it is laid out in.
 *
 *  Delivered work AND work under way: an item that has been started is on the park from that moment,
 *  which is the Increment made into something you watch happen. A path is the exception - a route
 *  between things has no square of ground to hoard off, so it is laid out by drawing the route.
 *
 *  The order matters and is not incidental: it is the order the automatic layout fills the park in,
 *  so changing it moves somebody's zoo. Habitats, then animals with nowhere to live, then whatever
 *  sits loose on the grounds, then the building sites.
 */
export function standingOnPark(state: ZooGameState): Standing[] {
  const open = state.backlog.filter(standsOnPark);
  const builtEnc = open.filter((it) => it.category === 'enclosure');
  const isBuilt = (id?: string) => builtEnc.some((e) => e.id === id);
  // An animal being STOCKED goes into its habitat, not into a hoarding of its own. The point of
  // choosing a family rather than assembling a lion is watching the family turn up, and it cannot
  // turn up in a building site next door to the habitat it belongs in.
  const stocking = state.backlog.filter((it) => it.status === 'committed' && it.started && it.category === 'exhibit');
  const nested = (o: BacklogItem) => o.category === 'flora' && isBuilt(o.enclosureId);

  const out: Standing[] = [];
  const stand = (item: BacklogItem, underWay: boolean, animals: BacklogItem[] = [], plants: BacklogItem[] = []) =>
    out.push({ item, underWay, size: groundSize(item), animals, plants });

  for (const e of builtEnc) {
    stand(e, false,
      [...open, ...stocking].filter((o) => o.category === 'exhibit' && o.enclosureId === e.id),
      open.filter((o) => nested(o) && o.enclosureId === e.id));
  }
  // An animal whose habitat is not up yet has nowhere to stand, so it gets its own plot rather than
  // vanishing. It should not normally happen - the habitat is built before the animal.
  for (const o of open.filter((o) => o.category === 'exhibit' && !isBuilt(o.enclosureId))) stand(o, false);
  for (const a of open.filter((o) => o.category === 'amenity' || (o.category === 'flora' && !nested(o)))) stand(a, false);

  const housed = new Set(stocking.filter((a) => isBuilt(a.enclosureId)).map((a) => a.id));
  for (const w of state.backlog.filter((it) => it.status === 'committed' && it.started
    && !it.enhancesId && it.category !== 'path' && !housed.has(it.id))) stand(w, true);

  return out;
}

/** Where everything stands when nothing is being dragged.
 *
 *  An item that has been dragged holds its spot. Everything else is laid out automatically, and both
 *  views have to lay it out the SAME way or the two drawings disagree about where the zoo is. */
export function parkPositions(standing: Standing[]): Map<string, { x: number; y: number }> {
  return autoLayout(standing.map((s) => ({ id: s.item.id, w: s.size.w, h: s.size.h })));
}

/** Where one thing stands, given how much ground it takes. */
export function restingPlace(item: BacklogItem, size: { w: number; h: number },
  auto: Map<string, { x: number; y: number }>): { x: number; y: number } {
  const base = item.pos ?? auto.get(item.id) ?? { x: PAD, y: PAD };
  // A river starts life running across the middle; from there it can be dragged and turned.
  const at = parkType(item) === 'river' && !item.pos ? { x: CANVAS_W / 2, y: base.y } : base;
  // Read through the park's bounds, so a position saved when the park was a different size cannot
  // leave a delivered thing drawn somewhere nobody can look.
  return insidePark(size, at);
}

/** Where one thing stands. */
export const positionOf = (s: Standing, auto: Map<string, { x: number; y: number }>) =>
  restingPlace(s.item, s.size, auto);

/** Landscape - a river, a pond, a bridge - which takes a patch of ground rather than standing on it. */
export const isLandscape = (item: BacklogItem): boolean =>
  item.category === 'flora' && isLandscapeType(parkType(item));

/** The ways round one animal, for the rest of its family to stand in. */
const HERD = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
const hold = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** How far apart animals standing together are, in design px - about an animal's own width. */
const APART = 30;

/** Where an animal stands INSIDE its habitat, as fractions of the habitat box.
 *
 *  Dragged on the Plan, it keeps the spot it was put on; otherwise the herd arranges itself along
 *  the floor, staggered so two animals do not stand on each other.
 *
 *  One Backlog item can be a whole family - a pride is one "Lion" with several lions in it - and the
 *  dragged spot belongs to the ITEM. So the one you took hold of stands on the spot and the rest of
 *  the family gather round it. Reading the item's spot for every member of it put the whole pride on
 *  a single point, one lion thick, which is what "they all group together in one spot" was.
 *
 *  Both views ask this, because "where is the lion" has one answer. The isometric view used to
 *  scatter them with its own jitter and never looked at `spot` at all, so moving a lion on the Plan
 *  moved nothing in the Increment - the sixth time in a week the two drawings disagreed about the
 *  same state, and the reason this module exists.
 */
export function habitatSpot(animal: BacklogItem, i: number, n: number,
  /** Which of its own family this one is. The first stands where it was put. */
  member = 0,
  /** How big the habitat is, so the family stands an animal's width apart rather than a fixed
   *  fraction of a box that might be any size. Without it they bunch up in a big habitat. */
  box?: { w: number; h: number }): { x: number; y: number } {
  // Put there by hand, one animal at a time. A pride is not a blob.
  const own = animal.spots?.[member];
  if (own) return own;
  if (animal.spot) {
    if (member === 0) return animal.spot;
    const [dx, dy] = HERD[(member - 1) % HERD.length];
    const ring = 1 + Math.floor((member - 1) / HERD.length);
    const sx = (box ? APART / box.w : 0.16) * ring;
    const sy = (box ? APART / box.h : 0.16) * ring;
    return { x: hold(animal.spot.x + dx * sx, 0.08, 0.92), y: hold(animal.spot.y + dy * sy, 0.1, 0.94) };
  }
  return { x: n <= 1 ? 0.5 : 0.14 + (i / (n - 1)) * 0.72, y: 0.62 + (i % 2 === 0 ? -0.06 : 0.06) };
}
