import type { ZooGameState, BacklogItem } from './types';
import { deliveredThisSprint, ENTRANCE } from './parkNetwork';
import { whereItStands, viewingSpot, standingOnPark } from './parkModel';
import { zoneSlices } from './engine';

// ============= Walking the Increment =============
//
// A tour of what this Sprint delivered, taken the way a visitor takes it: in at the gate, along the
// paths, nearest thing first, stopping at each one long enough to look at it.
//
// It follows a visitor rather than touring a list, and that is the difference that matters. A thing
// delivered that nobody can walk to is still a stop on this tour, and the caption says so: a Sprint
// that finished five things behind a river with no bridge looks finished on the board, and is not.
// The board cannot tell you that. The park can, and the walk is how it says it.
//
// Pure - the stops and where the camera has to be for each one. What moves the camera and when is
// `useWalkThrough`; what the camera does to the picture is `IsoZoo`.

/** How long the camera rests on each thing, and how long it takes getting there. */
export const HOLD_MS = 2500;
export const TRAVEL_MS = 900;
/** How far in the camera goes. Enough to read a habitat; not so far that you lose the park. */
export const WALK_ZOOM = 2.1;

export interface WalkStop {
  id: string;
  /** Where the camera looks, in the park's own coordinates. */
  at: { x: number; y: number };
  /** How far in it looks. The gate is the whole park; a delivered thing is close up. */
  zoom: number;
  caption: string;
  why: string;
  /** Whether a visitor could actually get here from the gate. */
  reachable: boolean;
  /** Whether anybody can actually come and see this today - the walk's whole point. Reachable is
   *  not enough: a released lion in a zone with no way in is delivered and unvisitable, and that is
   *  the stop the room should look at hardest. */
  visitable: boolean;
  item?: BacklogItem;
}

/** What the caption says about a stop.
 *
 *  It says what the rest of the game says. "Open to visitors" means the item has been released; a
 *  ZONE opens on three things - somewhere to see an animal, an animal to see, and a path to walk in
 *  on - so a released lion in a zone with no path is not something anybody can come and see. The
 *  Review says exactly that, in a panel beside this picture, and a caption reading "open to
 *  visitors" next to it is the game contradicting itself in one glance. */
const said = (state: ZooGameState, d: { item: BacklogItem; reachable: boolean }): { why: string; visitable: boolean } => {
  if (!d.reachable) {
    return { why: 'delivered - and nobody can walk to it: there is no way here from the gate', visitable: false };
  }
  if (d.item.status !== 'open') {
    return { why: 'delivered this Sprint, not released to visitors yet', visitable: false };
  }
  const zone = zoneSlices(state).find((z) => z.zone === d.item.zone);
  if (zone && !zone.open) {
    return { why: `delivered - but ${zone.zone} needs ${zone.missing.join(' and ')}`, visitable: false };
  }
  return { why: 'delivered this Sprint, and open to visitors', visitable: true };
};

/** The tour, in the order a visitor coming through the gate would meet it. */
export function walkStops(state: ZooGameState, sprint = state.sprintNumber): WalkStop[] {
  const delivered = deliveredThisSprint(state, sprint);
  if (!delivered.length) return [];
  const standing = standingOnPark(state);
  const stops: WalkStop[] = [{
    id: 'gate',
    at: ENTRANCE,
    // The gate is where the walk starts, and the whole park is what you see from it.
    zoom: 1,
    caption: 'In at the gate',
    why: `what Sprint ${sprint} delivered, as a visitor meets it`,
    reachable: true,
    visitable: true,
  }];
  for (const d of delivered) {
    // An animal has no ground of its own: you go and stand where its habitat is.
    const home = d.item.enclosureId
      ? state.backlog.find((i) => i.id === d.item.enclosureId) : undefined;
    const stood = whereItStands(state, d.item) ?? (home ? whereItStands(state, home) : null);
    if (!stood) continue;
    const size = standing.find((s) => s.item.id === (home?.id ?? d.item.id))?.size;
    stops.push({
      id: d.item.id,
      // Where a visitor stands to look at it, not the middle of the pen - which for a habitat is
      // inside the fence, where nobody is.
      at: size ? viewingSpot(stood, size) : stood,
      zoom: WALK_ZOOM,
      caption: d.item.name,
      ...said(state, d),
      reachable: d.reachable,
      item: d.item,
    });
  }
  // A tour of the gate alone is not a tour.
  return stops.length > 1 ? stops : [];
}

/** Whether there is anything to walk at all - cheap, because it is asked on every render, and
 *  working out the routes is not. */
export function canWalk(state: ZooGameState, sprint = state.sprintNumber): boolean {
  return state.backlog.some((it) => (it.status === 'done' || it.status === 'open')
    && (it.openedIn === sprint || it.sprintNumber === sprint));
}
