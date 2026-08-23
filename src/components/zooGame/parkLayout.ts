/** The park's own measurements, and how things are laid out in it when nobody has placed them.
 *
 *  Its own module so it can be tested with a full zoo's worth of boxes, which is the only way the
 *  interesting case - more rows than the park is tall - ever comes up.
 */

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

