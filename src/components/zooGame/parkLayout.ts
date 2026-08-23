/** The park's own measurements, and how things are laid out in it when nobody has placed them.
 *
 *  Its own module so it can be tested with a full zoo's worth of boxes, which is the only way the
 *  interesting case - more rows than the park is tall - ever comes up.
 */

import { enclosureShapePoints } from './design';

/** Anything that takes up room in the park: an id and a footprint in design pixels. */
export interface LayoutBox { id: string; w: number; h: number }

// The park is one of three columns - Product Backlog, Sprint Backlog, product - so it is taller
// than it is wide. A landscape park squeezed into a third of the screen is a postage stamp.
export const CANVAS_W = 820;
// The park's own height, and it does not change. It used to be measured from wherever the lowest
// thing had ended up, which meant the park grew when you added a gift shop and the whole scene
// rescaled to fit - so laying down one more thing resized everything already laid down.
export const PLAY_H = 700;
export const PAD = 20;
export const GAP = 18;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Default tidy layout for features without a saved position: shelf-pack left-to-right,
 *  wrapping within the canvas width. Returns each feature's CENTRE in design px. */
export function autoLayout(boxes: LayoutBox[]): Map<string, { x: number; y: number }> {
  // Two passes: shelf-pack into rows by width, then space the rows down the park.
  //
  // It used to be one pass that clamped each feature into the park as it went, which was fine until
  // there were more rows than the park is tall - and then every row past the last one landed on the
  // same line at the bottom, one habitat drawn on top of another. You built a thing, it was
  // delivered, and you could not see it. Rows are laid out knowing how many there are now, so a
  // full zoo tightens up rather than piling up.
  const rows: LayoutBox[][] = [];
  let row: LayoutBox[] = [];
  let x = PAD;
  for (const f of boxes) {
    if (x + f.w > CANVAS_W - PAD && row.length) { rows.push(row); row = []; x = PAD; }
    row.push(f);
    x += f.w + GAP;
  }
  if (row.length) rows.push(row);

  const heights = rows.map((r) => Math.max(...r.map((f) => f.h)));
  const needed = heights.reduce((a, b) => a + b, 0) + GAP * Math.max(0, rows.length - 1);
  const room = PLAY_H - PAD * 2;
  // When it will not fit, close the gaps between rows first and overlap only as much as is left -
  // evenly, so no two rows sit exactly on top of each other.
  const squeeze = needed > room && rows.length > 1 ? (room - heights.reduce((a, b) => a + b, 0)) / (rows.length - 1) : GAP;

  const pos = new Map<string, { x: number; y: number }>();
  let top = PAD;
  rows.forEach((r, i) => {
    let cx = PAD;
    for (const f of r) {
      pos.set(f.id, { x: cx + f.w / 2, y: clamp(top + heights[i] / 2, PAD + f.h / 2, PLAY_H - PAD - f.h / 2) });
      cx += f.w + GAP;
    }
    top += heights[i] + squeeze;
  });
  return pos;
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
 *  was suddenly off the bottom of it. The item was still delivered, still on the Backlog, still
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
