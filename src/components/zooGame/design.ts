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
}

/** A water feature inside an enclosure: position and size as fractions of the habitat box. */
export interface WaterFeature { x: number; y: number; w: number; h: number }

/** A plant placed inside an enclosure: position (0..1 fractions of the box), scale, and shape. */
export interface EnclosureFlora { x: number; y: number; s: number; type: string }

/** A new plant of the given type, offset a little each time so it doesn't stack exactly. */
export function defaultFlora(type: string, n = 0): EnclosureFlora {
  const cols = [0.28, 0.72, 0.5, 0.16, 0.84, 0.4];
  return { x: cols[n % cols.length], y: 0.42 + (n % 3) * 0.13, s: 1, type };
}

/** The planting to draw inside an enclosure (empty if none added). */
export function enclosureFlora(design: ItemDesign): EnclosureFlora[] {
  return design.flora ?? [];
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
function shade(hex: string, amt: number): string {
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
  if (type === 'bush') { paintShaded(g, ellipse(8, 9, 4.2, 3.4).filter(([, y]) => y >= 6), foliage, 22, -20); return g; }
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
  { key: 'ears', label: 'Ears / mane', options: ['none', 'round', 'pointed', 'floppy'], colorKey: 'ears', optional: true },
  { key: 'tail', label: 'Tail / fin', options: ['none', 'tufted', 'long', 'bushy', 'fin'], colorKey: 'tail', optional: true },
  { key: 'markings', label: 'Markings', options: ['none', 'stripes', 'spots', 'dapples', 'saddle', 'patches'], colorKey: 'markings', optional: true },
];
export const AMENITY_COLORS: { key: string; label: string }[] = [
  { key: 'walls', label: 'Walls' }, { key: 'roof', label: 'Roof' }, { key: 'door', label: 'Door' }, { key: 'sign', label: 'Sign' },
];
export const FLORA_TYPES = ['tree', 'bush', 'flowers', 'signpost', 'hedge', 'rocks', 'pond', 'river', 'fountain', 'entrance', 'carpark'];
export const BUILDING_TYPES = ['shop', 'kiosk', 'cafe', 'stall', 'toilets'];

/** Path widths a Pathway can be designed at; the px is the connector thickness it deploys with. */
export const PATH_WIDTHS: { key: string; label: string; px: number }[] = [
  { key: 'thin', label: 'Thin', px: 5 },
  { key: 'medium', label: 'Medium', px: 9 },
  { key: 'thick', label: 'Thick', px: 14 },
];
export const pathWidthPx = (thickness?: string): number => PATH_WIDTHS.find((w) => w.key === thickness)?.px ?? 9;

/** Acceptance criteria that fit a piece of scenery/landscape from its type (a river reads as water,
 *  an entrance marks the way in), so each backlog item is judged against something sensible. */
export function floraAcceptance(type?: string): string[] {
  switch (type) {
    case 'signpost': return ['Clearly readable', 'Coloured'];
    case 'river': case 'pond': case 'fountain': return ['Reads as water', 'Sized to fit the space'];
    case 'rocks': return ['Reads as rock', 'Sized to fit the space'];
    case 'entrance': return ['Clearly marks the way in', 'Coloured'];
    case 'carpark': return ['Clearly marked out', 'Sized to fit the space'];
    case 'hedge': return ['Reads as a hedge', 'Sized to fit the space'];
    default: return ['Fits the planting', 'Coloured, no bare patches'];
  }
}

/** Scenery types that are placed as a resizable footprint on the park (stretch a river across it),
 *  rather than a fixed little sprite like a tree or bush. */
export const LANDSCAPE_TYPES = ['river', 'pond', 'rocks', 'hedge', 'fountain', 'entrance', 'carpark'];
export const isLandscapeType = (type?: string): boolean => !!type && LANDSCAPE_TYPES.includes(type);

/** The starting footprint (design px) for a landscape feature - a river starts wide, a fountain
 *  square - then you resize it on the park. */
export function landscapeDefaultSize(type?: string): { w: number; h: number } {
  switch (type) {
    case 'river': return { w: 220, h: 46 };
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
  if (services === 'toilet' || /toilet|\bwc\b|loo/.test(n)) return ['Clearly signed', 'Has enough cubicles'];
  if (/gift|shop|souvenir|store|retail/.test(n)) return ['Clearly signed', 'Sells a range of souvenirs'];
  if (services === 'food' || /kiosk|caf|coffee|restaurant|snack|food|drink|refresh|outlet/.test(n)) return ['Clearly signed', 'Serves food and drink'];
  if (services === 'rest' || /picnic|seat|bench|shade|rest|viewing/.test(n)) return ['Clearly signed', 'Enough seating and shade'];
  return ['Clearly signed', 'Fit for its purpose'];
}
export const FLORA_COLORS: { key: string; label: string }[] = [
  { key: 'foliage', label: 'Foliage' }, { key: 'trunk', label: 'Trunk / bed' },
];
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
export function presetFor(item: BacklogItem): ItemDesign {
  if (item.category === 'path') return { parts: { thickness: 'medium' }, colors: { path: '#c9a86a' } };
  if (item.category === 'enclosure') return { parts: { water: 'on' }, colors: {} };
  if (item.category === 'flora') return { parts: { type: item.template ?? 'tree' }, colors: {} };
  if (item.category === 'amenity') return { parts: { type: item.template ?? buildingTypeFor(item.name, item.services), sign: 'on' }, colors: {} };
  return { parts: { ...(PART_PRESETS[item.template ?? item.id] ?? GENERIC_EXHIBIT) }, colors: {} };
}
export const emptyDesign = (item: BacklogItem): ItemDesign => presetFor(item);

// ---- The Done gate: acceptance criteria ----

const coloured = (d: ItemDesign) => Object.values(d.colors).filter(Boolean).length;

export function designCriteria(item: BacklogItem, design: ItemDesign): { label: string; pass: boolean }[] {
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
  // Criteria reflect the animal's ACTUAL parts, so they read sensibly per species
  // (a penguin is not asked for a tail; a lion is asked to colour its mane).
  const p = design.parts;
  const fish = p.head === 'none';

  // Heads whose feature (mane/horn/crest/tusks) is coloured through the ears slot.
  const earFeature = p.head === 'maned' || p.head === 'horned' || p.head === 'crested' || p.head === 'tusked';

  // Colourable parts this animal actually has.
  const present: string[] = ['body'];
  if (!fish) present.push('head');
  if ((p.ears && p.ears !== 'none') || earFeature) present.push('ears');
  if (p.tail && p.tail !== 'none') present.push('tail');
  if (p.markings && p.markings !== 'none') present.push('markings');

  // Its signature feature, named naturally for the criterion.
  const markLabel: Record<string, string> = { stripes: 'stripes', spots: 'spots', dapples: 'dapples', saddle: 'saddle', patches: 'belly' };
  let sig: { key: string; label: string } | null = null;
  if (p.markings && p.markings !== 'none') sig = { key: 'markings', label: markLabel[p.markings] ?? 'markings' };
  else if (p.head === 'maned') sig = { key: 'ears', label: 'mane' };
  else if (p.head === 'horned') sig = { key: 'ears', label: 'horn' };
  else if (p.head === 'crested') sig = { key: 'ears', label: 'crest' };
  else if (p.head === 'tusked') sig = { key: 'ears', label: 'tusks' };
  else if (p.ears && p.ears !== 'none') sig = { key: 'ears', label: 'ears' };
  else if (p.tail && p.tail !== 'none') sig = { key: 'tail', label: fish ? 'fins' : 'tail' };

  const list = [
    { label: 'Colour its body', pass: !!design.colors.body },
    { label: fish ? 'Colour its fins' : 'Colour its head', pass: !!design.colors[fish ? 'tail' : 'head'] },
  ];
  if (sig) list.push({ label: `Colour its ${sig.label}`, pass: !!design.colors[sig.key] });
  else list.push({ label: 'Give it a distinctive feature (ears, a tail or markings)', pass: false });
  list.push({ label: 'Finish every part it has', pass: present.every((k) => !!design.colors[k]) });
  return list;
}

export const isDesignDone = (item: BacklogItem, design: ItemDesign): boolean => designCriteria(item, design).every((x) => x.pass);

/** Whether the actual design work for a plan task has been done - so the studio can tick the
 *  plan off automatically as you build, instead of making you check boxes for work you just
 *  did. Matched loosely by keyword against the generated task labels; a custom/unmatched task
 *  returns false and stays a manual tick. */
export function designSatisfiesTask(item: BacklogItem, design: ItemDesign, label: string): boolean {
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
  const activeParts = ['ears', 'tail', 'markings'].filter((k) => (design.parts[k] ?? 'none') !== 'none').length;
  const busy = activeParts / 3;
  const distinctive = (design.parts.markings ?? 'none') !== 'none';
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
