import type { ZooGameState } from './types';
import { CANVAS_W, PROMENADE_Y } from './parkLayout';
import { zonePlots, type Plot } from './parkZones';

// The skeleton a zone is built on.
//
// Reported, twice: "the enclosure was placed by the AI across a path and blocking the main
// entrance. I pointed this out before - AI places things in weird places."
//
// The cause was not a bad score. Placement is `nearestFreeSpot(taken, box, aim)` - aim at a rough
// point, then find the nearest spot that does not collide - and `taken` is **other items only**.
// It knew about the water and about buildings; it knew nothing about paths, the promenade or the
// way in. "Across a path" was not an unlikely position. It was a position the game had never been
// told about.
//
// The spec's answer to this (§5) is to score candidate plots and pick the best. That keeps every
// bad place in the search space and leans on the score being right. This is the other answer: give
// the zone an outline, and make the bad places unrepresentable.
//
//   ZONE
//   ┌───────────────────────────────┐
//   │  [slot]    ║     [slot]       │
//   │            ║                  │     ║  the spine: reserved, nothing is built on it
//   │  [slot]    ║     [slot]       │
//   └────────────╫──────────────────┘
//                gate
//   ════════════ promenade ═════════
//
// The spine is RESERVED GROUND, not a path. The team still builds the path - "Main Pathways" is a
// Product Backlog item and should stay one - and the outline only says where it has to be able to
// go. Draw it as a path and the item would be pointless; leave it unreserved and something gets
// built across it, which is the bug.

/** How wide the reserved corridor is. Wide enough for a path and two people to pass on it. */
export const SPINE_W = 72;
/** Breathing room between a slot and whatever is next to it. */
export const SLOT_GAP = 24;
/** The smallest a slot is worth being. The largest footprint in the game is 172 x 114 (a large
 *  enclosure, turned), so a slot under this could not hold one and is not a slot. */
export const SLOT_MIN = { w: 190, h: 132 };
/** How far the way in has to stay clear. Somebody standing at the gate of the zoo should be able
 *  to see where to go, which they cannot through the side of a lion enclosure. */
export const ENTRANCE_CLEAR = { w: 220, h: 120 };

export interface Pt { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }

/** One place a thing can stand, and which way it faces the path. */
export interface Slot {
  id: string;
  zone: string;
  /** The middle of it: where a thing's centre goes. */
  at: Pt;
  /** How much room it has. */
  size: { w: number; h: number };
  /** Which way the spine is from here, which is the side a door or a frontage belongs on. */
  faces: 'left' | 'right';
}

/** A zone's skeleton: where it is entered, where its path must be able to run, and where things
 *  can stand. */
export interface Outline {
  zone: string;
  /** Where the zone meets the rest of the park. Everything inside is reached through here, which
   *  is what makes "a visitor can get to it" a property of the shape rather than a test. */
  gate: Pt;
  /** The reserved corridor, from the gate to the back of the plot. */
  spine: Box;
  slots: Slot[];
}

/** The ground the way in needs to keep clear, as a box like any other.
 *
 *  Not part of a zone - it is in front of all of them - so it is its own thing and is reserved for
 *  everybody. "Blocking the main entrance" was the other half of the report. */
export const entranceApron = (): Box => ({
  x: CANVAS_W / 2, y: PROMENADE_Y - ENTRANCE_CLEAR.h / 2,
  w: ENTRANCE_CLEAR.w, h: ENTRANCE_CLEAR.h,
});

/** The skeleton of one plot.
 *
 *  The gate is the middle of the bottom edge, because visitors arrive from the front of the park
 *  and the promenade runs along it - so every zone is entered from the same side, and a zone
 *  across the water is entered from the same side too, over a bridge. The spine runs from the gate
 *  straight up the middle, and the slots take what is left, in as many rows as will fit.
 *
 *  One uniform rule rather than a shape per zone. A park where every area is laid out the same way
 *  is a park a visitor can find their way around, which is the point of an outline, and it is also
 *  the version that cannot drift between the two renderers. */
export function outlineOf(plot: Plot): Outline {
  const cx = (plot.x0 + plot.x1) / 2;
  const spine: Box = {
    x: cx, y: (plot.y0 + plot.y1) / 2,
    w: SPINE_W, h: plot.y1 - plot.y0,
  };
  const sideW = (plot.x1 - plot.x0 - SPINE_W) / 2 - SLOT_GAP * 1.5;
  const usable = plot.y1 - plot.y0 - SLOT_GAP;
  const rows = Math.max(1, Math.floor(usable / (SLOT_MIN.h + SLOT_GAP)));
  const rowH = (usable - SLOT_GAP * (rows - 1)) / rows;
  const slots: Slot[] = [];
  // Nearest the gate first, so "the next free slot" is the one closest to where people come in.
  // A zoo fills up from the entrance, which is also how the first thing anybody built should read.
  for (let r = 0; r < rows; r += 1) {
    const cy = plot.y1 - SLOT_GAP / 2 - rowH / 2 - r * (rowH + SLOT_GAP);
    for (const faces of ['right', 'left'] as const) {
      // `faces` is where the SPINE is from the slot: a slot on the left of the plot faces right.
      const x = faces === 'right'
        ? cx - SPINE_W / 2 - SLOT_GAP - sideW / 2
        : cx + SPINE_W / 2 + SLOT_GAP + sideW / 2;
      slots.push({
        id: `${plot.zone}:${r}:${faces}`, zone: plot.zone,
        at: { x: Math.round(x), y: Math.round(cy) },
        size: { w: Math.round(sideW), h: Math.round(rowH) },
        faces,
      });
    }
  }
  return { zone: plot.zone, gate: { x: Math.round(cx), y: Math.round(plot.y1) }, spine, slots };
}

/** Every zone's skeleton, in the order the zones take ground. */
export function outlines(state: Parameters<typeof zonePlots>[0]): Outline[] {
  return [...zonePlots(state).values()].map(outlineOf);
}

/** Every slot in the park, nearest the way in first.
 *
 *  Ordered once, here, so that "the next free slot" means the same thing to the Developers played
 *  by the game, to the placement question and to anybody reading a test. */
export function allSlots(state: Parameters<typeof zonePlots>[0]): Slot[] {
  return outlines(state).flatMap((o) => o.slots);
}

/** The ground nothing may be built on: every spine, and the apron in front of the way in. */
export function reserved(state: Parameters<typeof zonePlots>[0]): Box[] {
  return [...outlines(state).map((o) => o.spine), entranceApron()];
}

const overlaps = (a: Box, b: Box): boolean =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

/** Whether a thing standing here would be on ground that is kept clear. The one question the park
 *  could not answer, and the reason a lion enclosure ended up across a path. */
export const onReservedGround = (state: ZooGameState, box: Box): boolean =>
  reserved(state).some((r) => overlaps(r, box));

/** Which slot, if any, something standing here is in. */
export const slotAt = (state: ZooGameState, at: Pt): Slot | undefined =>
  allSlots(state).find((s) => Math.abs(s.at.x - at.x) <= s.size.w / 2
    && Math.abs(s.at.y - at.y) <= s.size.h / 2);

/** The slots nothing is standing in, nearest the way in first. */
export function freeSlots(state: ZooGameState, ignore?: string): Slot[] {
  const standing = state.backlog.filter((it) => it.pos && it.id !== ignore);
  return allSlots(state).filter((s) => !standing.some((it) =>
    Math.abs(it.pos!.x - s.at.x) <= s.size.w / 2 && Math.abs(it.pos!.y - s.at.y) <= s.size.h / 2));
}
