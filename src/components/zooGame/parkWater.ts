import { CANVAS_W, PLAY_H, edgeNoise } from './parkLayout';

/** The river that was here before the zoo was.
 *
 *  It is terrain, not work. Nobody builds it, it is on nobody's Product Backlog, and it cannot be
 *  moved: it runs bank to bank across the plot, and the zoo is laid out around it. That is the whole
 *  point of it - a constraint the Scrum Team is given rather than one they chose, which is what most
 *  constraints on a real product are.
 *
 *  What it buys the game is the Bridge. Ground on the far side cannot be reached until somebody
 *  builds one, so "open the Penguins" quietly depends on a piece of work with no visitors of its
 *  own. That is enabling work, and it is the one lesson that is hard to stage any other way: the
 *  Product Owner has to order it above the thing everyone actually wants, and the Sprint Review
 *  proves it either way.
 *
 *  The area the zoo opens first is on THIS side of it, so Sprint 1 is dry.
 */

/** How far down the park the water runs, and how wide and wandering it is. */
export const RIVER_Y = Math.round(PLAY_H * 0.46);
export const RIVER_W = 40;
const WANDER = 26;

/** How far either side of the water nothing may be built. The zones are laid out clear of this, so
 *  it is the bank as well as a margin: a paddock whose fence is in the river is not a paddock. */
export const BANK = 14;

/** The top and bottom of the ground the water and its banks take up, right across the park. */
export const riverBand = (): { y0: number; y1: number } => ({
  y0: RIVER_Y - WANDER - RIVER_W / 2 - BANK,
  y1: RIVER_Y + WANDER + RIVER_W / 2 + BANK,
});

/** Where the water runs, as a function of how far across the park you are.
 *
 *  A FUNCTION, not a list of points, and that is the whole of it. It began as a list sampled at
 *  whatever step the caller asked for - and since the wander was worked out per sample, asking for a
 *  different step gave a different river. The plan drew one course, the routing walked another, and
 *  guests were stopped on ground the plan drew as grass. One curve, sampled as finely as anybody
 *  likes, is the only version of this that cannot drift.
 */
const CTRL = 9;
const START = -6, SPAN = CANVAS_W + 12;

const ctrlY = (k: number): number => {
  const t = Math.max(0, Math.min(1, k / CTRL));
  // Held level where it leaves the park at either end, so it meets both banks square rather than
  // slicing off a corner of the countryside.
  const ease = Math.sin(Math.PI * t) ** 0.7;
  return RIVER_Y + (edgeNoise(k * 3 + 17) - 0.5) * 2 * WANDER * ease;
};

/** The middle of the water at this point across the park. */
export function riverY(x: number): number {
  const t = Math.max(0, Math.min(1, (x - START) / SPAN)) * CTRL;
  const k = Math.min(CTRL - 1, Math.floor(t));
  const f = t - k;
  return ctrlY(k) + (ctrlY(k + 1) - ctrlY(k)) * (f * f * (3 - 2 * f));
}

/** The middle of the water, as it winds from one bank of the park to the other. */
export function riverCourse(step = 82): { x: number; y: number }[] {
  const n = Math.max(3, Math.round(SPAN / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = START + (i / n) * SPAN;
    return { x, y: riverY(x) };
  });
}

/** The water's edge, going round: down one bank and back along the other. */
export function riverOutline(): { x: number; y: number }[] {
  const mid = riverCourse();
  const side = (sign: number) => mid.map((p) => ({ x: p.x, y: p.y + (sign * RIVER_W) / 2 }));
  return [...side(-1), ...side(1).reverse()];
}

/** The middle of the water here, or null where the park has none. */
const courseAt = (x: number): number | null =>
  (x < START || x > START + SPAN ? null : riverY(x));

/** Whether this point is in the water. */
export function onWater(p: { x: number; y: number }): boolean {
  const y = courseAt(p.x);
  return y != null && Math.abs(p.y - y) <= RIVER_W / 2;
}

/** Whether something of this size, standing here, has any part of itself in the water.
 *
 *  The whole footprint, not the middle of it: a habitat with one corner in the river is a habitat
 *  with a drowned corner, and the middle of it is nowhere near the water. */
export function inWater(box: { w: number; h: number }, at: { x: number; y: number }): boolean {
  const x0 = at.x - box.w / 2, x1 = at.x + box.w / 2;
  const y0 = at.y - box.h / 2, y1 = at.y + box.h / 2;
  for (let x = x0; x <= x1; x += 8) {
    const y = courseAt(x);
    if (y == null) continue;
    if (y + RIVER_W / 2 >= y0 && y - RIVER_W / 2 <= y1) return true;
  }
  return false;
}

/** The water as ground to walk on - or rather not to. Rectangles, because that is what the routing
 *  understands, in thin slices because each one is the BOUNDING BOX of its stretch of river: cut
 *  coarsely, a sloping stretch gives a box far taller than the water, and guests are stopped on
 *  ground the plan draws as grass - a river two definitions wide. Thin slices keep the water the
 *  routing knows about within a few paces of the water anybody can see. */
export function waterRects(step = 16): { x0: number; y0: number; x1: number; y1: number; rot: number }[] {
  const mid = riverCourse(step);
  const out: { x0: number; y0: number; x1: number; y1: number; rot: number }[] = [];
  for (let i = 0; i < mid.length - 1; i += 1) {
    const a = mid[i], b = mid[i + 1];
    out.push({
      x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x),
      y0: Math.min(a.y, b.y) - RIVER_W / 2, y1: Math.max(a.y, b.y) + RIVER_W / 2, rot: 0,
    });
  }
  return out;
}
