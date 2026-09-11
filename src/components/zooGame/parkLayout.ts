/** The park's own measurements, and how things are laid out in it when nobody has placed them.
 *
 *  Its own module so it can be tested with a full zoo's worth of boxes, which is the only way the
 *  interesting case - more rows than the park is tall - ever comes up.
 */

import { enclosureShapePoints } from './design';

/** Anything that takes up room in the park: an id and a footprint in design pixels. */
export interface LayoutBox { id: string; w: number; h: number }

// The plot is sized from what has to FIT on it, not from the pane it is drawn in.
//
// Six areas of the zoo, three across and two deep, and an area has to hold its animals: the Big
// Cats is a lion, a tiger, a leopard and a kiosk, with room to walk between them. That is about
// 520 x 400 an area, which is where these numbers come from. Reported from playing it, looking at
// a finished Big Cats: "if this is the finished Big Cats Zone then it is too small."
//
// It is bigger than a pane, and that is the point of the park having levels: the whole zoo is for
// reading and planning, one area is for building in. Drawn all at once, a habitat is sixty pixels
// wide and nothing can be dropped on it accurately.
export const CANVAS_W = 1760;
// The park's own height, and it does not change. It used to be measured from wherever the lowest
// thing had ended up, which meant the park grew when you added a gift shop and the whole scene
// rescaled to fit - so laying down one more thing resized everything already laid down.
export const PLAY_H = 1080;
// Room to walk. The park's edge is a boundary, not a wall you can put a habitat against: a
// visitor asked "can I walk right round it?" and a Product Owner looking at an enclosure jammed
// into the corner has to answer no, with nothing they can do about it - the layout put it there.
// Wide enough for the path a person would take, so the criterion is answerable either way.
export const PAD = 56;
// The front of the park: a promenade along it, and then the car park beyond the park's own edge.
//
// One definition, because there were three. The plan painted the car park INSIDE the play area, over
// the bottom 90 of it; the isometric view put the promenade in the last 40 and the tarmac beyond
// PLAY_H entirely; and the routing walked a line at PLAY_H - 50. So a run drawn to the tarmac on the
// plan stopped in the middle of the grass in the isometric view - reported from playing it: "the
// drawn path on the build park view extends to the car park, the path on the isometric view falls
// short of it". Two drawings of one park have to agree about where the park ends.
export const PROMENADE_H = 40;
/** The top edge of the promenade. Below this is the way in, not ground you build on. */
export const PROMENADE_Y = PLAY_H - PROMENADE_H;
/** Where a visitor walks along the front, and where a run meeting the front should end. */
export const FRONT_Y = PLAY_H - PROMENADE_H / 2;
export const GAP = 18;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Default tidy layout for features without a saved position: shelf-pack left-to-right,
 *  wrapping within the canvas width. Returns each feature's CENTRE in design px. */
export function autoLayout(boxes: LayoutBox[], taken: (LayoutBox & { x: number; y: number })[] = [],
  /** The ground to lay them out on. The whole park unless an area of the zoo owns this lot - the
   *  packing is the same either way, so an area and the park cannot drift apart in how they fill. */
  area: { x0: number; y0: number; x1: number; y1: number } = { x0: PAD, y0: PAD, x1: CANVAS_W - PAD, y1: PLAY_H - PAD },
): Map<string, { x: number; y: number }> {
  // Two passes: shelf-pack into rows by width, then space the rows down the park.
  //
  // It used to be one pass that clamped each feature into the park as it went, which was fine until
  // there were more rows than the park is tall - and then every row past the last one landed on the
  // same line at the bottom, one habitat drawn on top of another. You built a thing, it was
  // delivered, and you could not see it. Rows are laid out knowing how many there are now, so a
  // full zoo tightens up rather than piling up.
  const rows: LayoutBox[][] = [];
  let row: LayoutBox[] = [];
  let x = area.x0;
  for (const f of boxes) {
    if (x + f.w > area.x1 && row.length) { rows.push(row); row = []; x = area.x0; }
    row.push(f);
    x += f.w + GAP;
  }
  if (row.length) rows.push(row);

  const heights = rows.map((r) => Math.max(...r.map((f) => f.h)));
  const needed = heights.reduce((a, b) => a + b, 0) + GAP * Math.max(0, rows.length - 1);
  const room = area.y1 - area.y0;
  // When it will not fit, close the gaps between rows first and overlap only as much as is left -
  // evenly, so no two rows sit exactly on top of each other.
  const squeeze = needed > room && rows.length > 1 ? (room - heights.reduce((a, b) => a + b, 0)) / (rows.length - 1) : GAP;

  const pos = new Map<string, { x: number; y: number }>();
  let top = area.y0;
  rows.forEach((r, i) => {
    let cx = area.x0;
    for (const f of r) {
      pos.set(f.id, { x: cx + f.w / 2, y: clamp(top + heights[i] / 2,
        Math.min(area.y0 + f.h / 2, area.y1 - f.h / 2), area.y1 - f.h / 2) });
      cx += f.w + GAP;
    }
    top += heights[i] + squeeze;
  });
  // Anything standing where somebody put it is ground that is already spoken for.
  //
  // The packer used to lay out EVERYTHING, including items that carry their own position - it
  // reserved them a slot in the shelf, and then they went and stood somewhere else, leaving the
  // slot to be handed to the next item and the ground they actually occupy free to be handed out
  // too. So a Tiger Enclosure was laid down on top of a Lion Enclosure somebody had placed by hand.
  // Reported from a live game.
  //
  // Now the shelf slot is a preference rather than a verdict: where it collides with occupied
  // ground, the item takes the nearest clear ground to it, and joins the occupied list itself.
  if (!taken.length) return pos;
  const occupied = [...taken];
  const out = new Map<string, { x: number; y: number }>();
  for (const f of boxes) {
    const want = pos.get(f.id);
    if (!want) continue;
    const at = nearestFreeSpot(occupied, f, want);
    occupied.push({ ...f, ...at });
    out.set(f.id, at);
  }
  return out;
}


// ============= The park's own edge =============
//
// The park is a piece of ground, not a rectangle of green. Its boundary with the countryside
// wanders; the front, where the promenade and the car park are, is straight, because that edge is
// built rather than grown.
//
// This is the one definition, and both drawings read it. A plan with a wandering edge and an
// isometric view with a square one would be two parks - and the two views disagreeing about where
// the ground is has cost us three bugs in a fortnight.
//
// It is decoration that cannot lie: the wander only ever comes INWARD by `EDGE_WANDER`, and nothing
// may stand within `PAD` of the rectangle, so the land is always wider than anything on it. That is
// held by a test rather than by this paragraph.
export const EDGE_WANDER = 34;

/** A hash, not a random number. A park has one coastline and keeps it: the scene is redrawn on
 *  every tick, and an edge that reshuffled would be a hedge nobody could aim at. */
const wobble = (i: number): number => {
  let h = (i * 374761393 + 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** The same hash, for anything that has to vary ALONG the boundary and still come out the same in
 *  both drawings - the size of the trees standing on it, for one. */
export const edgeNoise = (i: number): number => wobble(i * 7 + 5);

/** The park's boundary, in park coordinates, going round.
 *
 *  Few points, well apart: the curve drawn through them is what makes the edge, and a point every
 *  50 gives a shaky hand rather than a hedge line. */
export function parkOutline(wander = EDGE_WANDER): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  // Far enough in that the treeline, which stands just OUTSIDE the grass, is still on the plot: a
  // tree planted beyond the lot gets held to the edge by the drawing, and a prop standing exactly on
  // the boundary is a prop half off the park.
  const inset = 18;
  const round = wander * 0.9; // how far the two back corners are cut off
  const side = (ax: number, ay: number, bx: number, by: number, k: number, step = 108, amp = wander) => {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(2, Math.round(len / step));
    // Inward only: the normal points into the park, so the boundary never claims ground the model
    // does not have, and never takes any from under something standing on it.
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      // Held at both ends, so the corners stay where the corners are and only the middle wanders.
      const ease = Math.sin(Math.PI * t);
      const w = (0.25 + 0.75 * wobble(k * 131 + i)) * amp * ease;
      pts.push({ x: ax + (bx - ax) * t + nx * w, y: ay + (by - ay) * t + ny * w });
    }
  };
  const L = inset, R = CANVAS_W - inset, T = inset, B = PROMENADE_Y;
  side(L, B, L, T + round, 1);            // the left boundary, up
  side(L + round, T, R - round, T, 2);    // the back, its corners cut off
  side(R, T + round, R, B, 3);            // the right, down
  // ...and the front is straight: the promenade is built, and the car park is beyond it. Points
  // along it as well as at its ends, or the curve closing the shape bows out over the promenade and
  // the tarmac - a green hook drawn across the car park.
  side(R, B, L, B, 4, 108, 0);
  return pts;
}

/** Trees along the boundary, one every `step` of it, and none across the front - that is the way
 *  in. Where the treeline runs is decided here, once; how finely each drawing plants it is the
 *  drawing's own business, because a canopy from above and a tree in the round are not the same
 *  width on the screen. */
/** How far apart the trees along the boundary stand, and how big their canopies are drawn: both in
 *  proportion to the plot, so that growing the park plants a bigger wood rather than the same number
 *  of trees stretched thin - or, as it did the day the plot doubled, four times as many of them and
 *  a park too slow to draw. */
export const HEDGE_STEP = CANVAS_W / 36;
export const HEDGE_R = CANVAS_W / 73;

export function hedgePoints(step: number): { x: number; y: number; n: number }[] {
  const ring = parkOutline();
  const out: { x: number; y: number; n: number }[] = [];
  let n = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = -(b.y - a.y) / (len || 1), ny = (b.x - a.x) / (len || 1);
    for (let d = 0; d < len; d += step) {
      const t = d / len;
      // Off the line by a few paces, and always OUTWARD, on the countryside side: a stand of trees
      // rather than beads threaded on a string, and no canopy hanging over ground something is
      // allowed to stand on.
      const off = -(2 + 10 * edgeNoise(n + 40));
      const p = { x: a.x + (b.x - a.x) * t + nx * off, y: a.y + (b.y - a.y) * t + ny * off, n };
      n += 1;
      if (p.y < PROMENADE_Y - 12) out.push(p);
    }
  }
  return out;
}

/** A closed path through those points, rounded off. Whatever space the points are in - park
 *  coordinates for the plan, screen coordinates for the isometric view - the curve through them is
 *  worked out the same way, so the same boundary comes out the same shape in both drawings. */
export function outlinePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 3) return '';
  const at = (i: number) => pts[(i + n) % n];
  let d = `M ${at(0).x.toFixed(1)} ${at(0).y.toFixed(1)}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return `${d} Z`;
}

/** Where a thing of this size is allowed to stand. One rule, used both while dragging and when a
 *  saved position is read back - so a position can never be outside the park, whoever wrote it.
 *
 *  A river is cut longer than the park is wide and is meant to run off both edges, so it is held by
 *  its centre rather than by its sides.
 */
export function parkBounds(box: { w: number; h: number }): { minX: number; maxX: number; minY: number; maxY: number } {
  const spans = box.w > CANVAS_W - 8;
  return {
    minX: spans ? 8 : box.w / 2 + 4,
    maxX: spans ? CANVAS_W - 8 : CANVAS_W - box.w / 2 - 4,
    minY: spans ? 8 : box.h / 2 + 4,
    maxY: PLAY_H - PAD - (spans ? 0 : box.h / 2),
  };
}

/** A position brought inside the park.
 *
 *  Saved games are why this exists. The park used to GROW with its contents, so a habitat could
 *  quite legally be standing at y=780 - and when the park became a fixed 700 tall, that position
 *  was suddenly off the bottom of it. The item was still delivered, still on the Product Backlog, still
 *  Done; it was simply drawn somewhere you could not look. Nobody's zoo should need a migration to
 *  be visible, so every position is read through this.
 */
export function insidePark(box: { w: number; h: number }, pos: { x: number; y: number }): { x: number; y: number } {
  const b = parkBounds(box);
  return { x: clamp(pos.x, b.minX, b.maxX), y: clamp(pos.y, b.minY, b.maxY) };
}

/** Whether a point (relative to the centre) is inside a feature's perimeter, for the shape that
 *  perimeter is actually drawn in. The loop round a habitat follows its chosen shape - an ellipse
 *  for a round one, a polygon for a hexagon - while a path was being stopped at the bounding
 *  RECTANGLE, which is outside the loop everywhere except the four cardinal points. Hence a gap at
 *  the end of every path that arrived diagonally, and only on the habitats that are not rectangles.
 */
export function insideShape(shape: string, dx: number, dy: number, hw: number, hh: number): boolean {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (shape === 'circle') return (dx / hw) ** 2 + (dy / hh) ** 2 <= 1;
  if (shape === 'pill') {
    const r = hh, flat = Math.max(0, hw - r);
    return ax <= flat ? ay <= r : Math.hypot(ax - flat, dy) <= r;
  }
  if (shape === 'hexagon' || shape === 'octagon') {
    const pts = (enclosureShapePoints(shape, hw * 2, hh * 2, 0) ?? '').split(' ')
      .map((p) => p.split(',').map(Number))
      .map(([x, y]) => [x - hw, y - hh] as [number, number]);
    if (pts.length < 3) return ax <= hw && ay <= hh;
    // Even-odd crossing test against the polygon the loop is drawn from.
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > dy) !== (yj > dy) && dx < ((xj - xi) * (dy - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // The default loop is a rounded rectangle, corner radius 14.
  const r = Math.min(14, hw, hh);
  if (ax > hw || ay > hh) return false;
  if (ax <= hw - r || ay <= hh - r) return true;
  return Math.hypot(ax - (hw - r), ay - (hh - r)) <= r;
}

/** The point on a shaped perimeter along the ray from its centre toward a target. Marched rather
 *  than solved, because one predicate per shape is a great deal less to get wrong than one closed
 *  form per shape - and a pixel of precision is all a path needs. */
export function shapeEdge(shape: string, cx: number, cy: number, hw: number, hh: number, tx: number, ty: number): { x: number; y: number } {
  const dx = tx - cx, dy = ty - cy;
  const len = Math.hypot(dx, dy);
  if (!len) return { x: cx, y: cy };
  const ux = dx / len, uy = dy / len;
  const reach = Math.min(len, Math.hypot(hw, hh) + 2);
  let last = 0;
  for (let t = 0; t <= reach; t += 1) {
    if (!insideShape(shape, ux * t, uy * t, hw, hh)) break;
    last = t;
  }
  return { x: cx + ux * last, y: cy + uy * last };
}

/** The nearest clear ground to where somebody asked for a thing to go.
 *
 *  A Product Owner saying "by the entrance" means roughly there, not exactly there and on top of
 *  the gift shop. So the answer is honoured as closely as the park allows: search outwards from
 *  the spot they chose until there is room for the thing. */
export function nearestFreeSpot(taken: (LayoutBox & { x: number; y: number })[], box: LayoutBox,
  preferred: { x: number; y: number }): { x: number; y: number } {
  const clear = (x: number, y: number) => taken.every((t) =>
    Math.abs(t.x - x) >= (t.w + box.w) / 2 + GAP || Math.abs(t.y - y) >= (t.h + box.h) / 2 + GAP);
  const b = parkBounds(box);
  const fit = (x: number, y: number) => ({ x: clamp(x, b.minX, b.maxX), y: clamp(y, b.minY, b.maxY) });
  const first = fit(preferred.x, preferred.y);
  if (clear(first.x, first.y)) return first;
  for (let r = 24; r <= 480; r += 24) {
    for (let a = 0; a < 12; a += 1) {
      const p = fit(preferred.x + r * Math.cos((a * Math.PI) / 6), preferred.y + r * Math.sin((a * Math.PI) / 6));
      if (clear(p.x, p.y)) return p;
    }
  }
  // Twelve directions off a ring is a coarse net, and it missed room that was plainly there: with
  // two habitats placed by hand, a third was reported standing on one of them in a park that was
  // half empty. So where the rings find nothing, sweep the whole park on a grid and take the
  // nearest clear ground to where they asked. Only ever runs when the quick search has failed.
  let best: { x: number; y: number } | null = null;
  let bestD = Infinity;
  for (let y = b.minY; y <= b.maxY; y += 12) {
    for (let x = b.minX; x <= b.maxX; x += 12) {
      if (!clear(x, y)) continue;
      const d = (x - first.x) ** 2 + (y - first.y) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best ?? first;   // a full park. Where they asked for, and they can see the problem.
}
