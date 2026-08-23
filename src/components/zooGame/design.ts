import type { BacklogItem } from './types';
import type { SegmentId } from './simulation/types';

// ============= Design and build (parametric) =============
//
// Building an item is a real task: you assemble it from swappable parts and colour
// each one. An exhibit is a creature kit - body, head, ears, tail, markings - and a
// species like "lion" is a preset you refine, not a fixed shape. It starts
// uncoloured, so colouring it is the work. The choices are the product: they shape
// how much each visitor group values it. Amenities are buildings with editable
// colours and a sign.

export interface ItemDesign {
  /** Chosen shape per part (exhibit: body/head/ears/tail/markings; amenity: sign). */
  parts: Record<string, string>;
  /** Editable colour per part / building surface, as hex. Missing = not coloured yet. */
  colors: Record<string, string>;
  /** Enclosure water features - as many as you like, each a fraction of the habitat box
   *  (0..1), movable and resizable in the studio. Absent = the legacy single-water flag. */
  water?: WaterFeature[];
  /** Enclosure planting - decorative flora placed inside the habitat in the studio, just like
   *  water features (add / drag / resize / remove). Each is a plant type at a fractional spot. */
  flora?: EnclosureFlora[];
  /** How many animals this exhibit holds, and of what ages. See STOCKING below. */
  group?: AnimalGroup;
}

/** The animals in one exhibit. A zoo does not BUILD a lion - it decides how many lions, of what
 *  ages, and whether it can house them. */
export interface AnimalGroup { adults: number; juveniles: number; cubs: number }

/** A water feature inside an enclosure: position and size as fractions of the habitat box. */
export interface WaterFeature { x: number; y: number; w: number; h: number }

/** A plant placed inside an enclosure: position (0..1 fractions of the box), scale, and shape. */
export interface EnclosureFlora { x: number; y: number; s: number; type: string; foliage?: string; trunk?: string }

/** A sensible starting colour per plant/feature type, so a new rock is grey and a new tree green
 *  whatever was added before it (each item keeps its own colours). */
export function floraDefaultColors(type: string): { foliage: string; trunk: string } {
  if (type === 'tree' || type === 'bush') return { foliage: '#43a047', trunk: '#7a5230' };
  if (type === 'flowers') return { foliage: '#e0679a', trunk: '#6a8f3a' };
  const p = landscapePalette(type); // rocks, pond, hedge... get their natural colours
  return { foliage: p.primary, trunk: p.secondary };
}

/** A new plant of the given type, offset a little each time so it doesn't stack exactly, and given
 *  its own sensible colours so it doesn't inherit the last item's. */
export function defaultFlora(type: string, n = 0): EnclosureFlora {
  const cols = [0.28, 0.72, 0.5, 0.16, 0.84, 0.4];
  return { x: cols[n % cols.length], y: 0.42 + (n % 3) * 0.13, s: 1, type, ...floraDefaultColors(type) };
}

/** The planting to draw inside an enclosure (empty if none added). */
export function enclosureFlora(design: ItemDesign): EnclosureFlora[] {
  return design.flora ?? [];
}

// Roughly how much of the habitat box one plant or feature covers, as a radius in box fractions -
// enough to keep two of them from sitting on top of each other.
const FLORA_R = 0.11;

/** Somewhere free to put something new inside the habitat, so nothing lands on top of anything.
 *  What "on top of" means depends on what is being placed: two plants must not overlap at all (they
 *  are objects sitting on the ground), while a pool is ground - a plant may stand at its edge, but
 *  not in it, and a new pool must not swallow a plant that is already there. If the habitat is too
 *  full for a clear spot it gives the emptiest one, rather than refusing to place anything. */
export function freeSpot(design: ItemDesign, foot: { rx: number; ry: number } = { rx: FLORA_R, ry: FLORA_R }, kind: 'plant' | 'water' = 'plant'): { x: number; y: number } {
  const flora = enclosureFlora(design), water = enclosureWater(design);
  // How far a point is outside an ellipse, roughly, in box fractions (negative = inside it). The
  // pad keeps a plant's sprite out of the water, not just the point it is pinned at.
  const PAD = FLORA_R * 0.55;
  const outside = (px: number, py: number, cx: number, cy: number, rx: number, ry: number) =>
    (Math.hypot((px - cx) / rx, (py - cy) / ry) - 1) * Math.min(rx, ry) - PAD;
  const gapAt = (x: number, y: number) => {
    let gap = Infinity;
    for (const f of flora) {
      const fr = FLORA_R * (f.s || 1);
      gap = Math.min(gap, kind === 'plant'
        ? Math.hypot(f.x - x, f.y - y) - (foot.rx + fr) // two sprites must not overlap
        : outside(f.x, f.y, x, y, foot.rx, foot.ry));   // a new pool must not swallow a plant
    }
    for (const w of water) {
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2, rx = w.w / 2, ry = w.h / 2;
      gap = Math.min(gap, kind === 'plant'
        ? outside(x, y, cx, cy, rx, ry)                          // a plant stands out of the water
        : Math.hypot(cx - x, cy - y) - (foot.rx + rx));          // pools sit side by side, not stacked
    }
    return gap;
  };
  const round = (v: number) => Math.round(v * 1000) / 1000;
  let best = { x: 0.5, y: 0.55 }, bestGap = -Infinity;
  for (let y = 0.3; y <= 0.82; y += 0.04) {
    for (let x = 0.12; x <= 0.88; x += 0.038) {
      const gap = gapAt(x, y);
      if (gap > 0) return { x: round(x), y: round(y) };
      if (gap > bestGap) { bestGap = gap; best = { x: round(x), y: round(y) }; }
    }
  }
  return best;
}

/** Add a plant or habitat feature, in a spot that is clear of everything already in the habitat. */
export function addFloraTo(design: ItemDesign, type: string): EnclosureFlora[] {
  const flora = enclosureFlora(design);
  return [...flora, { ...defaultFlora(type, flora.length), ...freeSpot(design) }];
}

/** Add a pool, likewise in a spot that is clear - and kept inside the habitat box. */
export function addWaterTo(design: ItemDesign): WaterFeature[] {
  const water = enclosureWater(design);
  const next = defaultWater(water.length);
  const c = freeSpot(design, { rx: next.w / 2, ry: next.h / 2 }, 'water');
  const clamp01 = (v: number, size: number) => Math.max(0.02, Math.min(0.98 - size, v));
  return [...water, { ...next, x: clamp01(c.x - next.w / 2, next.w), y: clamp01(c.y - next.h / 2, next.h) }];
}

/** A sensible starting pool, offset a little each time so a new one doesn't stack exactly. */
export function defaultWater(n = 0): WaterFeature {
  const off = (n % 3) * 0.12;
  return { x: Math.min(0.55, 0.1 + off), y: Math.min(0.6, 0.5 + off * 0.4), w: 0.32, h: 0.28 };
}

/** The water features to draw for an enclosure design, honouring the legacy single-water flag. */
export function enclosureWater(design: ItemDesign): WaterFeature[] {
  if (design.water && design.water.length) return design.water;
  if (design.parts.water === 'on') return [{ x: 0.12, y: 0.55, w: 0.34, h: 0.3 }];
  return [];
}

// ---- Grid + geometry ----

export const GRID_W = 16;
export const GRID_H = 14;
const PLACEHOLDER = '#cbcdc6';
const EYE = '#26221e';
const BEAK = '#e8a13a';

type Cell = [number, number];
const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
function ellipse(cx: number, cy: number, rx: number, ry: number): Cell[] {
  const out: Cell[] = [];
  for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) if (inEllipse(x, y, cx, cy, rx, ry)) out.push([x, y]);
  return out;
}
const ring = (cx: number, cy: number, rOut: number, rIn: number): Cell[] =>
  ellipse(cx, cy, rOut, rOut).filter(([x, y]) => !inEllipse(x, y, cx, cy, rIn, rIn));

const OUTLINE = '#241812';
const HILITE = '#ffffff';

const setCell = (g: (string | null)[][], cx: number, cy: number, color: string) => {
  const x = Math.round(cx), y = Math.round(cy);
  if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) g[y][x] = color;
};
const set = (g: (string | null)[][], cells: Cell[], color: string | null) => {
  if (!color) return;
  for (const [x, y] of cells) setCell(g, x, y, color);
};
const blank = (): (string | null)[][] => Array.from({ length: GRID_H }, () => Array<string | null>(GRID_W).fill(null));

/** Lighten (amt > 0) or darken (amt < 0) a hex colour, for pixel-art shading. */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const ch = (i: number) => Math.max(0, Math.min(255, parseInt(h.slice(i, i + 2), 16) + amt));
  return '#' + [ch(0), ch(2), ch(4)].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** Paint a region with soft top-light / belly-dark shading, the trick that gives the
 *  reference sprites their rounded, hand-drawn feel. */
function paintShaded(g: (string | null)[][], cells: Cell[], hex: string, top = 20, bot = -28) {
  if (!cells.length) return;
  const ys = cells.map((c) => c[1]);
  const y0 = Math.min(...ys), span = Math.max(1, Math.max(...ys) - y0);
  for (const [x, y] of cells) setCell(g, x, y, shade(hex, Math.round(top + (bot - top) * ((y - y0) / span))));
}

/** Wrap the filled silhouette in a 1px dark outline, so each creature reads as a
 *  clean sticker like the reference art. */
function outlined(g: (string | null)[][]): (string | null)[][] {
  const out = g.map((row) => row.slice());
  for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
    if (g[y][x] !== null) continue;
    if ((g[y - 1]?.[x] ?? null) !== null || (g[y + 1]?.[x] ?? null) !== null || (g[y][x - 1] ?? null) !== null || (g[y][x + 1] ?? null) !== null) out[y][x] = OUTLINE;
  }
  return out;
}

/** Markings painted over a region (body or face): vertical stripes, scattered spots,
 *  or a pale belly patch. */
function markingsOn(cells: Cell[], shape: string): Cell[] {
  if (shape === 'none' || cells.length === 0) return [];
  if (shape === 'stripes') return cells.filter(([x]) => x % 3 === 0);
  if (shape === 'spots') return cells.filter(([x, y]) => (x * 7 + y * 13) % 9 < 2);
  if (shape === 'dapples') return cells.filter(([x, y]) => (x * 5 + y * 11) % 5 < 2); // denser flecks
  if (shape === 'saddle') { const y0 = Math.min(...cells.map((c) => c[1])); return cells.filter(([, y]) => y >= y0 + 1 && y <= y0 + 3); } // a band over the back
  const maxY = Math.max(...cells.map((c) => c[1])); // patches: central lower belly
  return cells.filter(([x, y]) => y >= maxY - 3 && Math.abs(x - 8) <= 2);
}

/** A recognisable front-facing creature assembled from the chosen parts: a face
 *  (with optional mane, ears, beak, eyes) above a body, with a tail and markings.
 *  A 'finned' body or headless head is drawn instead as a side-on swimmer. Shaded
 *  in the pixel-art style of the reference pack. */
function creatureGrid(design: ItemDesign): (string | null)[][] {
  const g = blank();
  const col = (k: string) => design.colors[k] ?? PLACEHOLDER;
  const has = (k: string) => !!design.colors[k];
  const bodyShape = design.parts.body ?? 'round';
  const headShape = design.parts.head ?? 'round';
  const earsShape = design.parts.ears ?? 'none';
  const tailShape = design.parts.tail ?? 'none';
  const markShape = design.parts.markings ?? 'none';

  // Fish / headless: a side-on swimmer whose body is the whole animal.
  if (bodyShape === 'finned' || headShape === 'none') {
    const body = ellipse(8, 8, 4.6, 2.8);
    set(g, ellipse(2, 8, 1.9, 2.6), has('tail') ? col('tail') : col('body')); // tail fin
    paintShaded(g, body, col('body'));
    set(g, markingsOn(body, markShape), col('markings'));
    setCell(g, 11, 7, EYE); setCell(g, 11, 6, HILITE);
    return g;
  }

  const upright = bodyShape === 'upright';
  const bulky = bodyShape === 'bulky';
  const tall = bodyShape === 'tall'; // long neck (giraffe): head high, small body low

  const headCY = tall ? 2.6 : upright ? 4.3 : 5.4;
  const headR = tall ? 2.0 : upright ? 2.5 : bulky ? 3.5 : 3.2;
  const bodyCY = tall ? 10.6 : headCY + headR + (upright ? 3 : bulky ? 2.6 : 2.3);
  const bodyRX = tall ? 3.3 : bodyShape === 'long' ? 4.7 : upright ? 2.9 : bulky ? 4.8 : 3.7;
  const bodyRY = tall ? 2.7 : upright ? 4.2 : bulky ? 3.5 : 2.9;
  const head = ellipse(8, headCY, headR, headR);
  const body = ellipse(8, bodyCY, bodyRX, bodyRY).filter(([, y]) => y < GRID_H);
  const mane = headShape === 'maned' ? ring(8, headCY, headR + 1.6, headR - 0.3) : [];

  // A neck column links a small high head to the body (giraffe).
  const neck: Cell[] = [];
  if (tall) for (let y = Math.round(headCY + headR - 1); y <= Math.round(bodyCY - bodyRY + 1); y++) { neck.push([7, y], [8, y]); }

  const ey = headCY - headR + 0.2;
  let ears: Cell[] = [];
  const bigEars = headShape === 'trunk'; // elephant ears
  if (bigEars) ears = [...ellipse(8 - 2.7, headCY - 0.4, 1.8, 2), ...ellipse(8 + 2.7, headCY - 0.4, 1.8, 2)];
  else if (earsShape === 'round') ears = [...ellipse(8 - 2.3, ey, 1.2, 1.2), ...ellipse(8 + 2.3, ey, 1.2, 1.2)];
  else if (earsShape === 'pointed') ears = [[6, ey - 1], [6, ey], [5, ey - 1], [10, ey - 1], [10, ey], [11, ey - 1]];
  else if (earsShape === 'floppy') ears = [...ellipse(8 - 2.6, ey + 1.6, 1.2, 2.3), ...ellipse(8 + 2.6, ey + 1.6, 1.2, 2.3)]; // long droopy ears

  // Horns / antlers above the head.
  const horns: Cell[] = headShape === 'horned' ? [[6, headCY - headR - 1], [6, headCY - headR], [10, headCY - headR - 1], [10, headCY - headR]] : [];
  // A crest / plume standing up on top of the head.
  const cy0 = Math.round(headCY - headR);
  const crest: Cell[] = headShape === 'crested' ? [[8, cy0], [8, cy0 - 1], [8, cy0 - 2], [7, cy0 - 1], [9, cy0 - 1]] : [];
  // Tusks curving down from the face.
  const ty0 = Math.round(headCY + headR - 0.5);
  const tusks: Cell[] = headShape === 'tusked' ? [[6, ty0], [6, ty0 + 1], [10, ty0], [10, ty0 + 1]] : [];
  // Trunk hanging from the face (elephant).
  const trunk: Cell[] = [];
  if (headShape === 'trunk') for (let y = Math.round(headCY); y <= Math.round(headCY + headR + 2.5); y++) trunk.push([8, y]);

  const tx = Math.round(8 + bodyRX - 0.5), ty = Math.round(bodyCY + 0.6);
  let tail: Cell[] = [];
  if (tailShape === 'tufted') tail = [[tx, ty], [tx + 1, ty], [tx + 1, ty - 1]];
  else if (tailShape === 'long') tail = [[tx, ty], [tx + 1, ty - 1], [tx + 2, ty - 2], [tx + 2, ty - 3]];
  else if (tailShape === 'fin') tail = ellipse(tx + 1, ty, 1.3, 1.8);
  else if (tailShape === 'bushy') tail = ellipse(tx + 1, ty - 0.3, 1.9, 1.7); // big fluffy brush

  // Little feet peeking out under the body, for groundedness.
  const byMax = Math.max(...body.map((c) => c[1]));
  const feet: Cell[] = upright ? [[7, byMax], [9, byMax]] : [[6, byMax], [10, byMax]];

  const beak: Cell[] = headShape === 'beaked' ? [[8, headCY + 0.6], [7, headCY + 1.2], [8, headCY + 1.2], [9, headCY + 1.2]] : [];
  const eyeY = Math.round(headCY - 0.2);
  const eyeDX = tall ? 0.9 : 1.3;
  const eyeL = Math.round(8 - eyeDX), eyeR = Math.round(8 + eyeDX);

  set(g, feet, shade(col('body'), -46));
  set(g, tail, has('tail') ? col('tail') : shade(col('body'), -10));
  paintShaded(g, neck, col('body'));
  paintShaded(g, mane, col('ears'), 12, -22);      // mane behind the face
  set(g, horns, has('ears') ? col('ears') : '#d8cbb0'); // horn/antler colour (editable via ears slot)
  set(g, ears, bigEars && !has('ears') ? shade(col('body'), -8) : col('ears'));
  paintShaded(g, body, col('body'));
  set(g, markingsOn(body, markShape), col('markings'));
  set(g, trunk, col('head'));
  paintShaded(g, head, col('head'), 22, -18);
  if (markShape === 'stripes' || markShape === 'spots' || markShape === 'dapples') set(g, markingsOn(head, markShape), col('markings'));
  set(g, beak, BEAK);
  set(g, crest, has('ears') ? col('ears') : '#caa15a');   // crest / plume (editable via the ears slot)
  set(g, tusks, has('ears') ? col('ears') : '#efe6d0');   // ivory tusks (editable via the ears slot)
  setCell(g, eyeL, eyeY, EYE); setCell(g, eyeR, eyeY, EYE);
  setCell(g, eyeL, eyeY - 1, HILITE); setCell(g, eyeR, eyeY - 1, HILITE); // eye sparkle
  return g;
}

/** A little building for an amenity: walls, gable roof, door, windows and an
 *  optional sign, shaded and outlined to match the creatures. */
function buildingGrid(design: ItemDesign): (string | null)[][] {
  const g = blank();
  const col = (k: string) => design.colors[k] ?? PLACEHOLDER;
  const win = '#a9d3ea';
  const wallC = col('walls'), roofC = col('roof'), doorC = col('door'), signC = col('sign');
  const type = design.parts.type ?? 'shop';
  const sign = (row: number, x0 = 5, x1 = 11) => { if (design.parts.sign === 'on') for (let x = x0; x <= x1; x++) g[row][x] = signC; };

  if (type === 'kiosk') {
    // A small stall: body with an open counter under a striped flat awning.
    const wall: Cell[] = []; for (let y = 7; y <= 12; y++) for (let x = 5; x <= 11; x++) wall.push([x, y]);
    paintShaded(g, wall, wallC, 14, -18);
    for (let x = 4; x <= 12; x++) { g[5][x] = shade(roofC, 10); g[6][x] = roofC; }
    for (let x = 4; x <= 12; x += 2) g[6][x] = shade(roofC, -28); // awning stripes
    for (let y = 8; y <= 9; y++) for (let x = 6; x <= 10; x++) g[y][x] = win; // counter opening
    g[13][5] = wallC; g[13][11] = wallC; // legs
    sign(3, 6, 10);
    return g;
  }
  if (type === 'stall') {
    // An open canopy on posts (picnic/seating): striped roof, a counter, no walls.
    for (let x = 3; x <= 13; x++) { g[4][x] = shade(roofC, 12); g[5][x] = roofC; }
    for (let x = 3; x <= 13; x += 2) g[5][x] = shade(roofC, -28);
    for (let y = 6; y <= 13; y++) { g[y][3] = wallC; g[y][13] = wallC; } // posts
    for (let y = 10; y <= 11; y++) for (let x = 6; x <= 10; x++) g[y][x] = doorC; // table/counter
    sign(2);
    return g;
  }
  if (type === 'toilets') {
    // A blocky flat-roofed building with a prominent sign panel.
    const wall: Cell[] = []; for (let y = 5; y <= 13; y++) for (let x = 5; x <= 11; x++) wall.push([x, y]);
    paintShaded(g, wall, wallC, 12, -16);
    for (let x = 5; x <= 11; x++) { g[4][x] = roofC; g[5][x] = shade(roofC, -14); }
    for (let y = 8; y <= 13; y++) for (let x = 7; x <= 9; x++) g[y][x] = doorC; // door
    g[7][6] = win; g[7][10] = win;
    if (design.parts.sign === 'on') for (let y = 1; y <= 3; y++) for (let x = 5; x <= 11; x++) g[y][x] = signC; // big sign
    return g;
  }
  if (type === 'cafe') {
    // A house with a striped side awning.
    const wall: Cell[] = [], roof: Cell[] = [];
    for (let y = 6; y <= 12; y++) for (let x = 5; x <= 12; x++) wall.push([x, y]);
    for (let y = 3; y <= 5; y++) for (let x = 5 + (5 - y); x <= 12 - (5 - y); x++) roof.push([x, y]);
    paintShaded(g, wall, wallC, 14, -18);
    paintShaded(g, roof, roofC, 16, -20);
    for (let y = 8; y <= 12; y++) for (let x = 8; x <= 10; x++) g[y][x] = doorC;
    g[8][6] = win; g[8][11] = win;
    for (let x = 1; x <= 4; x++) g[9][x] = shade(roofC, 10); // side awning
    for (let x = 1; x <= 4; x += 2) g[9][x] = shade(roofC, -28);
    g[12][2] = doorC; g[11][2] = shade(wallC, -10); // little table + post
    sign(2, 6, 11);
    return g;
  }
  // Default 'shop': the classic pitched-roof building with door, two windows and a sign.
  const wall: Cell[] = [], roof: Cell[] = [];
  for (let y = 6; y <= 12; y++) for (let x = 4; x <= 12; x++) wall.push([x, y]);
  for (let y = 3; y <= 5; y++) for (let x = 4 + (5 - y); x <= 12 - (5 - y); x++) roof.push([x, y]);
  paintShaded(g, wall, wallC, 14, -18);
  paintShaded(g, roof, roofC, 16, -20);
  for (let y = 8; y <= 12; y++) for (let x = 7; x <= 9; x++) g[y][x] = doorC;
  g[8][5] = win; g[8][11] = win;
  sign(1);
  return g;
}

/** Scenery: a tree, bush or flowerbed, with editable foliage (and trunk) colours. */
function floraGrid(design: ItemDesign): (string | null)[][] {
  const g = blank();
  const foliage = design.colors.foliage ?? PLACEHOLDER;
  const trunk = design.colors.trunk ?? '#7a5230';
  const type = design.parts.type ?? 'tree';
  if (type === 'flowers') {
    for (let x = 3; x <= 12; x++) for (let y = 10; y <= 12; y++) g[y][x] = shade(trunk, y === 10 ? 6 : -10); // bed
    for (const [fx, fy] of [[4, 8], [7, 7], [10, 8], [5, 9], [11, 9]] as Cell[]) { set(g, ellipse(fx, fy, 1.2, 1.2), foliage); setCell(g, fx, fy, '#f4d03a'); }
    return g;
  }
  if (type === 'signpost') {
    // A board on a post: the "trunk" colour is the post, the "foliage" colour the sign board.
    for (let y = 5; y <= 13; y++) { g[y][8] = trunk; g[y][9] = shade(trunk, -16); } // post
    for (let x = 3; x <= 13; x++) for (let y = 2; y <= 6; y++) g[y][x] = shade(foliage, y === 2 ? 10 : y === 6 ? -14 : 0); // board
    for (let x = 5; x <= 11; x += 2) g[4][x] = shade(foliage, -30); // a couple of "letters" so it reads as a sign
    return g;
  }
  if (type === 'river') {
    // A wavy water band across the tile; place several to run a stream through the park.
    const water = design.colors.foliage ?? '#5aa9c8';
    const wave = [0, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1];
    for (let x = 0; x < GRID_W; x++) { const cy = 7 + wave[x]; for (let y = cy - 2; y <= cy + 2; y++) if (y >= 0 && y < GRID_H) g[y][x] = shade(water, y === cy - 2 ? 14 : y === cy + 2 ? -14 : 0); }
    return g;
  }
  if (type === 'pond') {
    const water = design.colors.foliage ?? '#5aa9c8';
    const bank = design.colors.trunk ?? '#b7965f';
    set(g, ellipse(8, 8, 6, 4.6), bank);
    paintShaded(g, ellipse(8, 8, 4.9, 3.6), water, 18, -16);
    set(g, ellipse(6, 6.5, 1.5, 0.9), shade(water, 24)); // highlight
    return g;
  }
  if (type === 'rocks') {
    const rock = design.colors.foliage ?? '#9aa1a8';
    paintShaded(g, ellipse(6, 9, 3, 2.4), rock, 20, -22);
    paintShaded(g, ellipse(10.5, 8, 3.4, 2.9), shade(rock, -8), 20, -22);
    paintShaded(g, ellipse(8, 11, 2.6, 1.6), shade(rock, 8), 18, -20);
    return g;
  }
  if (type === 'hedge') {
    const leaf = design.colors.foliage ?? '#4f8f3a';
    for (let y = 5; y <= 12; y++) for (let x = 2; x <= 13; x++) g[y][x] = shade(leaf, y <= 6 ? 10 : y === 12 ? -16 : 0);
    for (let x = 3; x <= 12; x += 3) { setCell(g, x, 4, shade(leaf, 12)); setCell(g, x + 1, 4, shade(leaf, 12)); } // rounded top bumps
    return g;
  }
  if (type === 'fountain') {
    const stone = design.colors.trunk ?? '#c9cdd2';
    const water = design.colors.foliage ?? '#5aa9c8';
    set(g, ellipse(8, 10, 5.5, 2.6), stone); // basin rim
    paintShaded(g, ellipse(8, 10, 4.3, 1.9), water, 16, -14); // basin water
    for (let y = 4; y <= 9; y++) g[y][8] = stone; // central column
    set(g, ellipse(8, 4, 2.2, 1.4), shade(water, 26)); // spouting water
    g[3][6] = shade(water, 32); g[3][10] = shade(water, 32);
    return g;
  }
  if (type === 'entrance') {
    const post = design.colors.trunk ?? '#8a5a2b';
    const arch = design.colors.foliage ?? '#e6842a';
    for (let y = 3; y <= 13; y++) { g[y][3] = post; g[y][4] = shade(post, -12); g[y][11] = post; g[y][12] = shade(post, -12); } // posts
    for (let x = 3; x <= 12; x++) { g[2][x] = arch; g[3][x] = shade(arch, -10); } // banner
    for (let x = 5; x <= 10; x += 2) g[2][x] = shade(arch, -30); // banner lettering
    return g;
  }
  if (type === 'carpark') {
    const tarmac = design.colors.foliage ?? '#8a8f96';
    const line = design.colors.trunk ?? '#eaeaea';
    for (let y = 4; y <= 13; y++) for (let x = 2; x <= 13; x++) g[y][x] = shade(tarmac, (x + y) % 2 ? 0 : -6);
    for (let x = 4; x <= 12; x += 4) for (let y = 5; y <= 12; y++) g[y][x] = line; // bay lines
    set(g, ellipse(6, 8, 1.7, 1.1), '#c0533b'); g[7][6] = '#a9d3ea'; // a parked car
    return g;
  }
  if (type === 'bridge') {
    // A plank deck crossing water: water bands top and bottom, a wooden deck across the middle with
    // vertical plank seams, and a railing along each long edge. Drop it over a river to cross it.
    const deck = design.colors.foliage ?? '#c8965a';
    const rail = design.colors.trunk ?? '#7a5230';
    const water = '#7fc5e0';
    for (let x = 0; x < GRID_W; x++) for (const y of [0, 1, 12, 13]) g[y][x] = shade(water, y < 2 ? 10 : -8); // water it spans
    for (let y = 3; y <= 10; y++) for (let x = 0; x < GRID_W; x++) g[y][x] = shade(deck, y % 2 ? 0 : -8); // deck planks
    for (let x = 2; x < GRID_W; x += 3) for (let y = 3; y <= 10; y++) g[y][x] = shade(deck, -18); // plank seams
    for (let x = 0; x < GRID_W; x++) { g[2][x] = rail; g[11][x] = rail; } // railings
    for (let x = 1; x < GRID_W; x += 3) { g[2][x] = shade(rail, 16); g[11][x] = shade(rail, 16); } // rail posts
    return g;
  }
  if (type === 'bush') { paintShaded(g, ellipse(8, 9, 4.2, 3.4).filter(([, y]) => y >= 6), foliage, 22, -20); return g; }

  // Trees come in kinds. A round crown on a stick was every tree in the park, so a Forest and a
  // Waterside were the same planting in different places.
  const piece = design.parts.piece;
  if (piece === 'pine') {
    for (let y = 10; y <= 13; y++) { g[y][7] = trunk; g[y][8] = shade(trunk, -14); }
    // Tiers, narrow at the top - drawn back to front so each skirt overlaps the one above.
    for (const [cy, half] of [[3, 1], [5, 2], [7, 3], [9, 4]] as [number, number][]) {
      for (let dy = 0; dy < 2; dy++) for (let x = 8 - half - dy; x <= 8 + half + dy; x++) {
        if (x >= 0 && x < GRID_W && cy + dy < GRID_H) g[cy + dy][x] = shade(foliage, dy ? -12 : 8);
      }
    }
    return g;
  }
  if (piece === 'palm') {
    for (let y = 6; y <= 13; y++) { const x = 8 + (y < 9 ? 1 : 0); g[y][x] = trunk; g[y][x - 1] = shade(trunk, -14); }
    // Fronds, drooping away from the crown on both sides.
    for (const [dx, dy] of [[-4, 0], [-3, -1], [-2, -1], [4, 0], [3, -1], [2, -1]] as Cell[]) {
      const x = 9 + dx, y = 5 + dy;
      if (x >= 0 && x < GRID_W && y >= 0) { g[y][x] = shade(foliage, dx < 0 ? 10 : -6); if (y + 1 < GRID_H) g[y + 1][x] = shade(foliage, -16); }
    }
    set(g, ellipse(9, 4, 1.6, 1), shade(foliage, 16));
    return g;
  }
  if (piece === 'bare') {
    const bark = design.colors.trunk ?? '#7a5228';
    for (let y = 6; y <= 13; y++) { g[y][7] = bark; g[y][8] = shade(bark, -14); }
    for (const [x, y] of [[5, 6], [4, 5], [10, 6], [11, 5], [6, 4], [9, 4], [7, 3], [8, 3]] as Cell[]) setCell(g, x, y, shade(bark, 8));
    return g;
  }

  paintShaded(g, ellipse(8, 6, 4.4, 4).filter(([, y]) => y <= 10), foliage, 24, -22); // crown
  for (let y = 10; y <= 13; y++) { g[y][7] = trunk; g[y][8] = shade(trunk, -14); } // trunk
  return g;
}

/** Render the assembled design as a GRID_H x GRID_W colour grid (null = empty), with
 *  a dark outline. Used by the studio preview and the park sprites, so both match. */
export function renderDesign(item: BacklogItem, design: ItemDesign): (string | null)[][] {
  const grid = item.category === 'exhibit' ? creatureGrid(design) : item.category === 'flora' ? floraGrid(design) : buildingGrid(design);
  return outlined(grid);
}

// ---- Parts metadata for the studio ----

export interface PartSpec { key: string; label: string; options: string[]; colorKey: string; optional?: boolean }
export const EXHIBIT_PARTS: PartSpec[] = [
  { key: 'body', label: 'Body', options: ['round', 'long', 'upright', 'bulky', 'tall', 'finned'], colorKey: 'body' },
  { key: 'head', label: 'Head', options: ['round', 'maned', 'beaked', 'horned', 'crested', 'tusked', 'trunk', 'none'], colorKey: 'head' },
  { key: 'ears', label: 'Ears', options: ['none', 'round', 'pointed', 'floppy'], colorKey: 'ears', optional: true },
  { key: 'tail', label: 'Tail', options: ['none', 'tufted', 'long', 'bushy', 'fin'], colorKey: 'tail', optional: true },
  { key: 'markings', label: 'Markings', options: ['none', 'stripes', 'spots', 'dapples', 'saddle', 'patches'], colorKey: 'markings', optional: true },
];
export const AMENITY_COLORS: { key: string; label: string }[] = [
  { key: 'walls', label: 'Walls' }, { key: 'roof', label: 'Roof' }, { key: 'door', label: 'Door' }, { key: 'sign', label: 'Sign' },
];
export const FLORA_TYPES = ['tree', 'bush', 'flowers', 'signpost', 'hedge', 'rocks', 'pond', 'river', 'fountain', 'bridge', 'entrance', 'carpark'];
/** Inside an enclosure you can add plants and natural habitat features, split so scenery isn't
 *  mislabelled as "planting". Park-only wayfinding (signpost, entrance, car park) is left out - it
 *  belongs on the grounds, not in a habitat. */
export const PLANTING_TYPES = ['tree', 'bush', 'flowers', 'hedge'];
// Rivers and fountains are park-scale features, so they stay out on the grounds, not in a habitat.
export const HABITAT_FEATURE_TYPES = ['rocks', 'pond'];
export const BUILDING_TYPES = ['shop', 'kiosk', 'cafe', 'stall', 'toilets'];

/** Scenery, grouped by what KIND of thing it is.
 *
 *  A Product Backlog item has already settled what it is: "Trees" is planting, "River" is water,
 *  "Signposts" is wayfinding. What is still open is which sort - a tree or a hedge, a pond or a
 *  fountain. Offering the whole catalogue on every one of them meant a PBI called Trees could be
 *  turned into a car park, which is not a design decision, it is a different item.
 */
const FLORA_FAMILIES: string[][] = [
  ['tree', 'bush', 'flowers', 'hedge'],       // planting
  ['pond', 'river', 'fountain'],              // water
  ['rocks', 'bridge', 'signpost', 'entrance', 'carpark'], // built and laid features
];
/** The sorts this thing could reasonably be instead - its own family, never the whole catalogue. */
export function floraFamily(type?: string): string[] {
  return FLORA_FAMILIES.find((f) => f.includes(type ?? 'tree')) ?? FLORA_FAMILIES[0];
}

/** Path widths a Pathway can be designed at; the px is the connector thickness it deploys with. */
export const PATH_WIDTHS: { key: string; label: string; px: number }[] = [
  { key: 'thin', label: 'Thin', px: 5 },
  { key: 'medium', label: 'Medium', px: 9 },
  { key: 'thick', label: 'Thick', px: 14 },
];
export const pathWidthPx = (thickness?: string): number => PATH_WIDTHS.find((w) => w.key === thickness)?.px ?? 9;

/** Acceptance criteria that fit a piece of scenery/landscape from its type (a river reads as water,
 *  an entrance marks the way in), so each backlog item is judged against something sensible. */
// ============= How an acceptance criterion is written =============
//
// Every one of them is a question, beginning "Can I". Not a house style: a statement can be waved
// through, and a question has to be answered - which is what an acceptance criterion is for. It
// also forces you to say who is doing the looking, and the answer is always a visitor standing in
// the park rather than a developer looking at a spec.
//
// It caught a criterion that had been sitting there since the first version. Planting had to meet
// "Fits the planting" - the planting fits the planting - which cannot be failed because it does not
// mean anything. In the question form it will not even write: "Can I... fit the planting?" is
// obvious nonsense, where the statement had passed for a year.
//
// The dividend is that several of them are now things the game itself can answer. "Can I get to
// this zone without crossing the grass?" is exactly what the visitors' pathfinding computes. Half
// of them stay a matter of judgement, which is true of real acceptance criteria too - and worth the
// player noticing.

export function floraAcceptance(type?: string): string[] {
  // Each list ends with a PLACEMENT criterion, confirmed once it is on the park; the rest are about
  // the thing itself. See ACCEPTANCE_FORM above for why they are all questions.
  switch (type) {
    case 'signpost': return ['Can I read it from a few steps away?', 'Can I tell which way to go from here?'];
    case 'river': case 'pond': case 'fountain': return ['Can I tell that is water at a glance?', 'Can I see it from across the park?', 'Can visitors still get round it?'];
    case 'rocks': return ['Can I tell that is rock at a glance?', 'Can I see it from across the park?', 'Can visitors still get round it?'];
    case 'bridge': return ['Can I see it is something you cross?', 'Can I cross the water on it?'];
    case 'entrance': return ['Can I tell this is the way in?', 'Can I find it from the car park?'];
    case 'carpark': return ['Can I tell where to park?', 'Can I walk from it to the entrance?'];
    default: return ['Can I tell what kind of place this is from the planting?', 'Can I see greenery from the path?', 'Can I still get past it?'];
  }
}

/** Build + placement acceptance criteria for an enclosure (habitat). The footprint is a studio
 *  (build) decision; where it sits in the park is the deploy one. */
export function enclosureAcceptance(): string[] {
  // Outcomes, not build steps. These used to read almost word for word like the Developers' plan
  // ("Fence it securely" / "Securely fenced"), so the player met two near-identical lists and only
  // one of them ticked itself - which reads as busywork rather than as the difference between how
  // you build a thing and what the Product Owner asked for. The plan is the work; these are what
  // somebody would notice if the work were not done.
  return ['Can I see a fence with no way out of it?', 'Can an animal move about in here?', 'Can I tell an animal lives here, not a shed?', 'Can I walk right round it?'];
}

/** Build + placement acceptance criteria for an exhibit (animal): built to look right, then settled
 *  into its enclosure. Handles plural names ("Penguins" -> "recognisable as penguins"). */
export function exhibitAcceptance(name: string): string[] {
  const what = /s$/.test(name) ? name.toLowerCase() : 'a ' + name.toLowerCase();
  // All four can fail. Two of them used to be free - the template made it recognisable and colouring
  // it in made it finished - which meant a criterion nobody could fail, and those teach nothing.
  return [
    `Can I tell they are ${what} without reading the sign?`,
    'Can I see a group rather than one animal on its own?',
    'Can I fit them in the habitat with room to spare?',
    'Can I find them in their habitat?',
  ];
}

/** Build + placement acceptance criteria for a pathway: designed as a width + colour in the studio,
 *  then routed (placed) on the park to link things - the route can only be judged once drawn. */
export function pathAcceptance(): string[] {
  return ['Can two people walk it side by side?', 'Can I get to this zone without crossing the grass?'];
}

/** The criteria that can only be answered once the thing is standing in the park - about where it
 *  is rather than what it is. Named outright, because the wording no longer gives them away: the
 *  old rule sniffed for "placed" or "sized", which worked while the criteria were statements and
 *  stopped working the moment they became questions. A list you have to keep up to date is worse
 *  than a rule that keeps itself up to date, but not as bad as a rule that quietly stops matching. */
const PLACEMENT_CRITERIA = new Set([
  'Can I walk right round it?',
  'Can I find them in their habitat?',
  'Can I find it in its habitat?',   // the wording before exhibits became groups
  'Can I still get past it?',
  'Can visitors still get round it?',
  'Can I tell which way to go from here?',
  'Can I cross the water on it?',
  'Can I find it from the car park?',
  'Can I walk from it to the entrance?',
  'Can I get to this zone without crossing the grass?',
  'Can I find it from the entrance?',
]);

export function isDeployAcceptance(label: string): boolean {
  // The regex is the fallback for games saved before the rewrite, whose items still carry the old
  // wording. It costs nothing and it keeps somebody's half-built zoo working.
  return PLACEMENT_CRITERIA.has(label) || /\bsized?\b|fit the space|placed|placement|position/i.test(label);
}

/** A landscape feature's two working colours (primary fill, secondary trim), taking the player's
 *  chosen colours where set and falling back to a sensible default per type. Used to draw the
 *  smooth, resizable scenery on the park (the keys mirror floraColors: foliage + trunk). */
export function landscapePalette(type: string | undefined, colors?: Record<string, string>): { primary: string; secondary: string } {
  const c = colors ?? {};
  const def: Record<string, [string, string]> = {
    river: ['#5aa9c8', '#b7965f'], pond: ['#5aa9c8', '#b7965f'], rocks: ['#9aa1a8', '#6f757b'],
    hedge: ['#4f8f3a', '#3a6b2a'], fountain: ['#5aa9c8', '#c9cdd2'], bridge: ['#c8965a', '#7a5230'],
    entrance: ['#e6842a', '#8a5a2b'], carpark: ['#8a8f96', '#eaeaea'],
  };
  const [p, s] = def[type ?? ''] ?? ['#5aa9c8', '#b7965f'];
  return { primary: c.foliage ?? p, secondary: c.trunk ?? s };
}

/** Scenery types that are placed as a resizable footprint on the park (stretch a river across it),
 *  rather than a fixed little sprite like a tree or bush. */
export const LANDSCAPE_TYPES = ['river', 'pond', 'rocks', 'hedge', 'fountain', 'bridge', 'entrance', 'carpark'];
export const isLandscapeType = (type?: string): boolean => !!type && LANDSCAPE_TYPES.includes(type);

/** The starting footprint (design px) for a landscape feature - a river starts wide, a fountain
 *  square - then you resize it on the park. */
export function landscapeDefaultSize(type?: string): { w: number; h: number } {
  switch (type) {
    case 'river': return { w: 220, h: 46 };
    case 'bridge': return { w: 120, h: 60 };
    case 'hedge': return { w: 150, h: 44 };
    case 'carpark': return { w: 150, h: 104 };
    case 'pond': return { w: 120, h: 88 };
    case 'entrance': return { w: 96, h: 96 };
    default: return { w: 96, h: 80 }; // rocks, fountain
  }
}

/** A sensible building shape for an amenity from its name/services, so every facility (toolbox,
 *  initial backlog, split epics, visitor signals) starts as a fitting building - overridable in
 *  the studio. */
export function buildingTypeFor(name: string, services?: string): string {
  const n = name.toLowerCase();
  if (services === 'toilet' || /toilet|\bwc\b|loo/.test(n)) return 'toilets';
  if (/gift|shop|souvenir|store|retail/.test(n)) return 'shop';       // retail, even though it may sit in the "food" group
  if (/caf|coffee|restaurant/.test(n)) return 'cafe';
  if (/kiosk|stall|stand|snack|food|drink|refresh|outlet/.test(n) || services === 'food') return 'kiosk';
  if (/picnic|seat|bench|shade|rest|viewing/.test(n) || services === 'rest') return 'stall';
  return 'shop';
}

/** Acceptance criteria that fit what the building actually is (a gift shop sells souvenirs; it does
 *  not serve food). Keyed on the name first, so retail is distinguished from food even when both sit
 *  in the same service group. */
export function amenityAcceptance(name: string, services?: string): string[] {
  const n = name.toLowerCase();
  const outside = 'Can I tell what it is from outside?';
  const build = (services === 'toilet' || /toilet|\bwc\b|loo/.test(n)) ? [outside, 'Can I find a free cubicle at a busy time?']
    : /gift|shop|souvenir|store|retail/.test(n) ? [outside, 'Can I buy something to take home?']
    : (services === 'food' || /kiosk|caf|coffee|restaurant|snack|food|drink|refresh|outlet/.test(n)) ? [outside, 'Can I buy food and a drink here?']
    : (services === 'rest' || /picnic|seat|bench|shade|rest|viewing/.test(n)) ? [outside, 'Can I sit down in the shade?']
    : [outside, 'Can I get what I came for?'];
  // ...and then the one that can only be answered once it is standing in the park.
  return [...build, 'Can I find it from the entrance?'];
}
// ============= Stocking, not modelling =============
//
// An animal used to be assembled from five shape menus and five colour wells - on a creature whose
// template had already made it a lion. You were not designing a lion; you were re-specifying one
// that was correct when it arrived, from menus that could only make it wrong. And it spent real
// minutes of a ninety-second day on pixel art, in a game about Scrum.
//
// So an exhibit is a STOCKING decision: how many, of what ages. It has a trade-off in it, which the
// part menus never did - a family draws more visitors than a specimen and needs more room to do it,
// so the animal item and the habitat item finally depend on each other. Build one without thinking
// about the other and the Product Owner's criteria say so.
//
// The species is still the species: `presetFor` gives a lion a lion's shape, and the coat is the
// one thing left to choose, because a white tiger is a decision about value.

export const AGES = ['adults', 'juveniles', 'cubs'] as const;
export type Age = typeof AGES[number];

/** How big each age is drawn, against a full-grown animal. */
export const AGE_SCALE: Record<Age, number> = { adults: 1, juveniles: 0.72, cubs: 0.55 };

export const DEFAULT_GROUP: AnimalGroup = { adults: 1, juveniles: 0, cubs: 0 };

/** How many animals in total. */
export const groupSize = (g?: AnimalGroup): number =>
  (g?.adults ?? DEFAULT_GROUP.adults) + (g?.juveniles ?? 0) + (g?.cubs ?? 0);

/** The group as one entry per animal, largest first so the little ones draw in front. */
export function groupMembers(g?: AnimalGroup): { age: Age; scale: number }[] {
  const grp = g ?? DEFAULT_GROUP;
  return AGES.flatMap((age) => Array.from({ length: Math.max(0, grp[age]) }, () => ({ age, scale: AGE_SCALE[age] })));
}

/** How many animals a habitat of this size can hold with room to roam. A cub takes less room than a
 *  full-grown adult, which is the whole reason ages are worth choosing. */
export const ROOM: Record<'small' | 'medium' | 'large', number> = { small: 2, medium: 4, large: 7 };

/** What the group costs in room, in adult-equivalents. */
export const roomNeeded = (g?: AnimalGroup): number => {
  const grp = g ?? DEFAULT_GROUP;
  return grp.adults + grp.juveniles * 0.6 + grp.cubs * 0.35;
};

/** Whether they have room to roam in a habitat of this size - a criterion the park can answer for
 *  itself, which is the point of asking it as a question. */
export const hasRoomToRoam = (g: AnimalGroup | undefined, size: 'small' | 'medium' | 'large' | undefined): boolean =>
  roomNeeded(g) <= ROOM[size ?? 'medium'];

/** Coats a species can come in. The rare one is a real Product Owner decision: more appeal, and the
 *  Backlog item costs the same either way. */
export const COATS: { key: string; label: string; rare?: boolean }[] = [
  { key: 'common', label: 'Common' },
  { key: 'pale', label: 'Pale', rare: true },
  { key: 'dark', label: 'Dark', rare: true },
];

// ============= Ready pieces =============
//
// Choosing "green" from a grid of swatches is a weak decision: no answer is wrong, none of them is
// obviously better than the default, and what comes out rarely looks like anything. Choosing an oak
// is a real one - it is faster, it looks better, and you can have an opinion about it.
//
// So scenery is picked from finished pieces with their colours already right, and the colour wells
// stay one level down as TAILORING, for the player who wants an autumn oak. Same catalogue whatever
// zone the item belongs to: an oak is an oak wherever it is planted. The zone belongs to the
// Product Backlog item, not to the piece.
//
// A piece is a type plus a look. `parts.type` still says what the thing IS - that is what the
// renderer and the visitors' pathfinding read - and `parts.piece` says which of that type it is.

export interface FloraPiece {
  key: string;
  label: string;
  /** What it is - the renderer's type, unchanged. */
  type: string;
  colors: Record<string, string>;
}

export const FLORA_PIECES: FloraPiece[] = [
  // Planting
  { key: 'oak', label: 'Oak', type: 'tree', colors: { foliage: '#4e9146', trunk: '#7a5228' } },
  { key: 'pine', label: 'Pine', type: 'tree', colors: { foliage: '#2f6b3b', trunk: '#6b4a25' } },
  { key: 'palm', label: 'Palm', type: 'tree', colors: { foliage: '#5ca352', trunk: '#8a6134' } },
  { key: 'blossom', label: 'Blossom', type: 'tree', colors: { foliage: '#e8a6c0', trunk: '#7a5228' } },
  { key: 'bare', label: 'Bare', type: 'tree', colors: { foliage: '#8a6134', trunk: '#7a5228' } },
  { key: 'bush', label: 'Bush', type: 'bush', colors: { foliage: '#4f8f3a', trunk: '#7a5230' } },
  { key: 'flowers', label: 'Flowerbed', type: 'flowers', colors: { foliage: '#e05c5c', trunk: '#8a6134' } },
  { key: 'hedge', label: 'Hedge', type: 'hedge', colors: { foliage: '#4f8f3a', trunk: '#3a6b2a' } },
  // Landscape
  { key: 'pond', label: 'Pond', type: 'pond', colors: { foliage: '#5aa9c8', trunk: '#b7965f' } },
  { key: 'stream', label: 'Stream', type: 'river', colors: { foliage: '#5aa9c8', trunk: '#b7965f' } },
  { key: 'fountain', label: 'Fountain', type: 'fountain', colors: { foliage: '#5aa9c8', trunk: '#c9cdd2' } },
  { key: 'boulders', label: 'Boulders', type: 'rocks', colors: { foliage: '#9aa1a8', trunk: '#6f757b' } },
  // Infrastructure - one piece each, so the catalogue still shows what it is
  { key: 'signpost', label: 'Signpost', type: 'signpost', colors: { foliage: '#c8873b', trunk: '#7a5230' } },
  { key: 'bridge', label: 'Bridge', type: 'bridge', colors: { foliage: '#c8965a', trunk: '#7a5230' } },
  { key: 'entrance', label: 'Entrance', type: 'entrance', colors: { foliage: '#e6842a', trunk: '#8a5a2b' } },
  { key: 'carpark', label: 'Car park', type: 'carpark', colors: { foliage: '#8a8f96', trunk: '#eaeaea' } },
];

/** The pieces this item could be - the ones of its own kind, never the whole catalogue. */
export function piecesFor(type?: string): FloraPiece[] {
  const family = floraFamily(type);
  return FLORA_PIECES.filter((p) => family.includes(p.type));
}

/** Which piece a design is showing: the one it was given, or the first of its type. */
export function pieceOf(design: ItemDesign, template?: string): FloraPiece | undefined {
  const key = design.parts.piece;
  if (key) return FLORA_PIECES.find((p) => p.key === key);
  const type = design.parts.type ?? template;
  return FLORA_PIECES.find((p) => p.type === type);
}

/** Choosing a piece sets what it is AND how it looks - that is what makes it a finished piece
 *  rather than a shape you then have to paint. Tailoring afterwards is the player's business. */
export function applyPiece(design: ItemDesign, piece: FloraPiece): ItemDesign {
  return {
    ...design,
    parts: { ...design.parts, type: piece.type, piece: piece.key },
    colors: { ...design.colors, ...piece.colors },
  };
}

export const FLORA_COLORS: { key: string; label: string }[] = [
  { key: 'foliage', label: 'Foliage' }, { key: 'trunk', label: 'Trunk / bed' },
];
/** The colours a scenery type actually uses, named for what they are - a river has water, not
 *  "foliage"; a car park has tarmac and markings. The keys stay 'foliage'/'trunk' (what the
 *  renderer reads); only the labels change, and a type that uses one colour shows just the one. */
export function floraColors(type?: string): { key: string; label: string }[] {
  switch (type) {
    case 'river': return [{ key: 'foliage', label: 'Water' }];
    case 'rocks': return [{ key: 'foliage', label: 'Rock' }];
    case 'hedge': return [{ key: 'foliage', label: 'Leaves' }];
    case 'pond': return [{ key: 'foliage', label: 'Water' }, { key: 'trunk', label: 'Bank' }];
    case 'fountain': return [{ key: 'foliage', label: 'Water' }, { key: 'trunk', label: 'Stone' }];
    case 'bridge': return [{ key: 'foliage', label: 'Deck' }, { key: 'trunk', label: 'Railings' }];
    case 'entrance': return [{ key: 'foliage', label: 'Banner' }, { key: 'trunk', label: 'Posts' }];
    case 'carpark': return [{ key: 'foliage', label: 'Tarmac' }, { key: 'trunk', label: 'Markings' }];
    case 'signpost': return [{ key: 'foliage', label: 'Sign' }, { key: 'trunk', label: 'Post' }];
    case 'flowers': return [{ key: 'foliage', label: 'Flowers' }, { key: 'trunk', label: 'Bed' }];
    default: return [{ key: 'foliage', label: 'Foliage' }, { key: 'trunk', label: 'Trunk' }];
  }
}
/** Quick colour suggestions offered next to each picker (still fully editable). */
export const SWATCHES = ['#c8873b', '#e6842a', '#e3c66b', '#8a5a2b', '#2a2622', '#f0efe9', '#43a047', '#ef6f53', '#f4c430', '#4a90d9'];

// ---- Presets: a recognisable starting shape per species (uncoloured) ----

/** Recognisable starting shapes per species, assembled from the creature-kit parts.
 *  These are the animal TEMPLATES the toolbox offers; a PBI keeps its template key so
 *  the studio starts from the right shape (then you tailor the colours and features). */
export const PART_PRESETS: Record<string, Record<string, string>> = {
  lion: { body: 'round', head: 'maned', ears: 'round', tail: 'tufted', markings: 'none' },
  tiger: { body: 'long', head: 'round', ears: 'pointed', tail: 'long', markings: 'stripes' },
  leopard: { body: 'long', head: 'round', ears: 'round', tail: 'long', markings: 'spots' },
  cheetah: { body: 'long', head: 'round', ears: 'round', tail: 'long', markings: 'spots' },
  penguins: { body: 'upright', head: 'beaked', ears: 'none', tail: 'none', markings: 'patches' },
  reef: { body: 'finned', head: 'none', ears: 'none', tail: 'fin', markings: 'stripes' },
  seal: { body: 'finned', head: 'none', ears: 'none', tail: 'fin', markings: 'none' },
  otter: { body: 'finned', head: 'none', ears: 'none', tail: 'fin', markings: 'none' },
  flamingo: { body: 'tall', head: 'beaked', ears: 'none', tail: 'none', markings: 'none' },
  elephant: { body: 'bulky', head: 'trunk', ears: 'round', tail: 'long', markings: 'none' },
  giraffe: { body: 'tall', head: 'round', ears: 'pointed', tail: 'long', markings: 'spots' },
  zebra: { body: 'long', head: 'round', ears: 'pointed', tail: 'long', markings: 'stripes' },
  rhino: { body: 'bulky', head: 'horned', ears: 'round', tail: 'long', markings: 'none' },
  hippo: { body: 'bulky', head: 'round', ears: 'round', tail: 'tufted', markings: 'none' },
  buffalo: { body: 'bulky', head: 'horned', ears: 'round', tail: 'tufted', markings: 'none' },
  antelope: { body: 'tall', head: 'horned', ears: 'pointed', tail: 'tufted', markings: 'none' },
  meerkat: { body: 'upright', head: 'round', ears: 'round', tail: 'long', markings: 'none' },
  bear: { body: 'bulky', head: 'round', ears: 'round', tail: 'none', markings: 'none' },
  panda: { body: 'bulky', head: 'round', ears: 'round', tail: 'none', markings: 'patches' },
  wolf: { body: 'long', head: 'round', ears: 'pointed', tail: 'long', markings: 'none' },
  fox: { body: 'long', head: 'round', ears: 'pointed', tail: 'long', markings: 'none' },
  gorilla: { body: 'bulky', head: 'round', ears: 'round', tail: 'none', markings: 'none' },
  monkey: { body: 'round', head: 'round', ears: 'round', tail: 'long', markings: 'none' },
  kangaroo: { body: 'upright', head: 'round', ears: 'pointed', tail: 'long', markings: 'none' },
  camel: { body: 'tall', head: 'round', ears: 'round', tail: 'tufted', markings: 'none' },
  // Birds - beaked heads, assembled from the shared kit.
  eagle: { body: 'upright', head: 'beaked', ears: 'none', tail: 'long', markings: 'none' },
  parrot: { body: 'round', head: 'beaked', ears: 'none', tail: 'long', markings: 'patches' },
  owl: { body: 'round', head: 'beaked', ears: 'pointed', tail: 'none', markings: 'dapples' },
  toucan: { body: 'round', head: 'beaked', ears: 'none', tail: 'long', markings: 'patches' },
  peacock: { body: 'tall', head: 'beaked', ears: 'none', tail: 'long', markings: 'spots' },
  ostrich: { body: 'tall', head: 'beaked', ears: 'none', tail: 'tufted', markings: 'none' },
  emu: { body: 'tall', head: 'beaked', ears: 'none', tail: 'bushy', markings: 'none' },
};
const GENERIC_EXHIBIT = { body: 'round', head: 'round', ears: 'round', tail: 'tufted', markings: 'none' };

/** Base silhouettes a bespoke (New PBI) animal can start from, then tailor in the studio.
 *  Just a starting shape - the name is only the silhouette's origin, not the animal. */
export const SPECIES_SHAPES: { key: string; label: string }[] = Object.keys(PART_PRESETS).map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1) }));

/** The starting design for an item: a recognisable shape (for exhibits) with no
 *  colours yet, so the player colours it in. Uses the item's toolbox template (falling
 *  back to its id) to pick the species shape. */
/** What a species actually looks like. Nobody paints an animal any more - you stock it - so it has
 *  to arrive wearing its own colours. A grey lion was the price of taking the colour wells away, and
 *  it is not one worth paying: the template already knew it was a lion, and now it looks like one. */
const SPECIES_COLORS: Record<string, Record<string, string>> = {
  lion: { body: '#c9963f', head: '#a9702c', ears: '#7a4d1c', tail: '#7a4d1c' },
  tiger: { body: '#d98338', head: '#d98338', ears: '#2a2622', tail: '#2a2622', markings: '#2a2622' },
  leopard: { body: '#d9b45f', head: '#d9b45f', ears: '#5a4426', tail: '#5a4426', markings: '#3b3128' },
  cheetah: { body: '#dcc07a', head: '#dcc07a', ears: '#5a4426', tail: '#5a4426', markings: '#3b3128' },
  penguins: { body: '#2c2f36', head: '#f2f0ea', ears: '#e8a33d', tail: '#2c2f36', markings: '#f2f0ea' },
  reef: { body: '#e2803c', head: '#e2803c', tail: '#f0c05a', markings: '#f2f0ea' },
  seal: { body: '#6b7079', head: '#6b7079', tail: '#585d66' },
  otter: { body: '#7d5a3a', head: '#7d5a3a', tail: '#5f4429' },
  elephant: { body: '#9099a1', head: '#9099a1', ears: '#7d868e', tail: '#7d868e' },
  giraffe: { body: '#e2be6a', head: '#e2be6a', ears: '#8a6134', tail: '#8a6134', markings: '#a4682c' },
  zebra: { body: '#f0eee8', head: '#f0eee8', ears: '#2a2622', tail: '#2a2622', markings: '#2a2622' },
  rhino: { body: '#8d9299', head: '#8d9299', ears: '#767b81', tail: '#767b81' },
  bear: { body: '#6b4a2f', head: '#6b4a2f', ears: '#4f3620', tail: '#4f3620' },
  monkey: { body: '#8a5f39', head: '#c79a6b', ears: '#c79a6b', tail: '#6f4b2c' },
};
const GENERIC_COLORS = { body: '#a6835a', head: '#8d6c46', ears: '#6f5334', tail: '#6f5334' };

/** A coat shifts every colour the animal has. A pale morph is a real decision about value - the
 *  enthusiasts come a long way for one - and it costs a Backlog item the same as a common coat. */
export function coatColors(base: Record<string, string>, coat?: string): Record<string, string> {
  if (!coat || coat === 'common') return base;
  const by = coat === 'pale' ? 34 : -30;
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, shade(v, by)]));
}

export function speciesColors(item: BacklogItem, coat?: string): Record<string, string> {
  return coatColors(SPECIES_COLORS[item.template ?? item.id] ?? GENERIC_COLORS, coat);
}

export function presetFor(item: BacklogItem): ItemDesign {
  if (item.category === 'path') return { parts: { thickness: 'medium' }, colors: { path: '#c9a86a' } };
  // A habitat starts as bare ground: water is something you choose to add, not something every
  // enclosure is born with. (Designs saved before this still honour the old `water: 'on'` flag.)
  if (item.category === 'enclosure') return { parts: {}, colors: {} };
  if (item.category === 'flora') return { parts: { type: item.template ?? 'tree' }, colors: {} };
  if (item.category === 'amenity') return { parts: { type: item.template ?? buildingTypeFor(item.name, item.services), sign: 'on' }, colors: {} };
  return { parts: { ...(PART_PRESETS[item.template ?? item.id] ?? GENERIC_EXHIBIT) }, colors: speciesColors(item) };
}
export const emptyDesign = (item: BacklogItem): ItemDesign => presetFor(item);

// ---- The Done gate: acceptance criteria ----

const coloured = (d: ItemDesign) => Object.values(d.colors).filter(Boolean).length;

export function designCriteria(item: BacklogItem, design: ItemDesign): { label: string; pass: boolean }[] {
  // An exhibit is stocked rather than built: how many animals, and whether the habitat can hold
  // them. The second one is the only place in the game where one Backlog item's design is measured
  // against another's, which is what makes an animal and its habitat a pair rather than two jobs.
  if (item.category === 'exhibit') return [
    { label: 'Decide how many, and of what ages', pass: !!design.group && groupSize(design.group) > 0 },
    // Not decided is not the same as fits: an undecided exhibit would otherwise pass this on the
    // default of one animal, which is a criterion that cannot be failed - the thing this whole
    // rewrite was for.
    { label: 'They fit the habitat with room to roam', pass: !!design.group && hasRoomToRoam(design.group, item.enclosureSize) },
  ];
  // A path is designed as a width and a colour in the studio; the route itself is drawn on the
  // park when you deploy it.
  if (item.category === 'path') return [
    { label: 'Set the path width', pass: !!design.parts.thickness },
    { label: 'Choose the path colour', pass: !!design.colors.path },
  ];
  if (item.category === 'enclosure') {
    return [
      { label: 'Lay the ground', pass: !!design.colors.ground },
      { label: 'Fence it securely', pass: !!design.colors.fence },
    ];
  }
  if (item.category === 'flora') {
    return [
      { label: 'Choose a plant type', pass: !!design.parts.type },
      { label: 'Colour the foliage', pass: !!design.colors.foliage },
    ];
  }
  if (item.category === 'amenity') {
    return [
      { label: 'Colour the walls', pass: !!design.colors.walls },
      { label: 'Colour the roof', pass: !!design.colors.roof },
      { label: 'Add a sign so visitors can find it', pass: design.parts.sign === 'on' && !!design.colors.sign },
    ];
  }
  // Exhibits are handled at the top: an exhibit is stocked, not painted, so the criteria that used
  // to be built out of its parts - colour the body, give it a distinctive feature - are gone rather
  // than left behind. Dead code that still reads as the rule is worse than no code at all.
  return [];
}

export const isDesignDone = (item: BacklogItem, design: ItemDesign): boolean => designCriteria(item, design).every((x) => x.pass);

/** Whether the actual design work for a plan task has been done - so the studio can tick the
 *  plan off automatically as you build, instead of making you check boxes for work you just
 *  did. Matched loosely by keyword against the generated task labels; a custom/unmatched task
 *  returns false and stays a manual tick. */
export function designSatisfiesTask(item: BacklogItem, design: ItemDesign, label: string): boolean {
  if (item.category === 'exhibit') {
    const s = label.toLowerCase();
    if (/how many|ages|stock|group/.test(s)) return !!design.group && groupSize(design.group) > 0;
    // Not decided is not the same as fits - it would otherwise tick itself before you had chosen.
    if (/fit the habitat|room/.test(s)) return !!design.group && hasRoomToRoam(design.group, item.enclosureSize);
    if (/coat/.test(s)) return !!design.parts.coat;
    return false;
  }
  const s = label.toLowerCase();
  const c = design.colors, p = design.parts;
  if (item.category === 'path') return !!p.thickness && !!c.path; // width + colour chosen
  if (item.category === 'enclosure') {
    if (/footprint|size/.test(s)) return !!item.enclosureSize;
    if (/fence/.test(s)) return !!c.fence;
    if (/ground|shelter|water|lay/.test(s)) return !!c.ground;
    return false;
  }
  if (item.category === 'flora') {
    if (/plant|type/.test(s)) return !!p.type;
    if (/foliage|colou?r/.test(s)) return !!c.foliage;
    return false;
  }
  if (item.category === 'amenity') {
    if (/sign/.test(s)) return p.sign === 'on' && !!c.sign;
    if (/colou?r|design/.test(s)) return !!c.walls || !!c.roof;
    return false;
  }
  // exhibit (an animal)
  if (/marking|feature/.test(s)) return isDesignDone(item, design);
  if (/sketch|shape|look/.test(s)) return !!c.body || !!c.head;
  if (/colou?r|paint|body|head/.test(s)) return !!c.body;
  return false;
}

// ---- Enclosure shapes: a habitat can be more than a rectangle ----

/** The habitat shapes an enclosure can take. Stored on the design (design.parts.shape). */
export const ENCLOSURE_SHAPES = [
  { key: 'rounded', label: 'Rounded' },
  { key: 'pill', label: 'Pill' },
  { key: 'circle', label: 'Round' },
  { key: 'hexagon', label: 'Hexagon' },
  { key: 'octagon', label: 'Octagon' },
] as const;

/** SVG polygon points for a shaped enclosure at w x h (inset by the stroke width s so the fence
 *  stays inside the box). Returns null for shapes drawn with an ellipse/rect instead of a polygon. */
export function enclosureShapePoints(shape: string, w: number, h: number, s = 3): string | null {
  const P = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;
  if (shape === 'hexagon') return [P(w * 0.24, s), P(w * 0.76, s), P(w - s, h / 2), P(w * 0.76, h - s), P(w * 0.24, h - s), P(s, h / 2)].join(' ');
  if (shape === 'octagon') { const c = Math.min(w, h) * 0.29; return [P(c, s), P(w - c, s), P(w - s, c), P(w - s, h - c), P(w - c, h - s), P(c, h - s), P(s, h - c), P(s, c)].join(' '); }
  return null;
}

// ---- Appeal: the design choices are the product ----

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function luminance(hex?: string): number {
  if (!hex) return 0.5;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Turn design choices into appeal per segment for an exhibit. Base appeal is the
 *  animal's inherent draw; the design tilts it: Families reward bright and busy,
 *  Comfort Seekers reward calm and muted, Enthusiasts reward a distinctive, well
 *  finished creature. So the same lion can be built for different crowds. */
export function appealFromDesign(item: BacklogItem, design: ItemDesign): Record<SegmentId, number> | undefined {
  if (item.category !== 'exhibit' || !item.appeal) return item.appeal;
  const bright = (luminance(design.colors.body) + luminance(design.colors.markings ?? design.colors.body)) / 2;
  // A group is worth more than a specimen, and a rare coat is worth more than the common one. Both
  // cost something - room, and the decision to spend a Backlog item on it - which is what makes
  // them decisions rather than dials. Diminishing: the fourth lion adds less than the second.
  const size = groupSize(design.group);
  const crowd = clamp(Math.log2(1 + size) / 2, 0, 1);
  const rare = COATS.find((c) => c.key === design.parts.coat)?.rare ? 1 : 0;
  const busy = clamp(0.4 + 0.6 * crowd, 0, 1);
  const distinctive = rare === 1;
  const finish = clamp(coloured(design) / 4, 0, 1);
  const mult: Record<SegmentId, number> = {
    families: clamp(0.7 + 0.5 * (0.5 * bright + 0.5 * busy), 0.5, 1.25),
    enthusiasts: clamp(0.75 + 0.3 * (distinctive ? 1 : 0) + 0.15 * finish - 0.1 * bright, 0.5, 1.25),
    comfortSeekers: clamp(0.7 + 0.5 * (1 - busy) * (1 - 0.5 * bright), 0.5, 1.25),
  };
  return {
    families: clamp(item.appeal.families * mult.families, 0, 10),
    enthusiasts: clamp(item.appeal.enthusiasts * mult.enthusiasts, 0, 10),
    comfortSeekers: clamp(item.appeal.comfortSeekers * mult.comfortSeekers, 0, 10),
  };
}
