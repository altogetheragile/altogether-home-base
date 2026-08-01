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

const set = (g: (string | null)[][], cells: Cell[], color: string | null) => {
  if (!color) return;
  for (const [cx, cy] of cells) {
    const x = Math.round(cx), y = Math.round(cy);
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) g[y][x] = color;
  }
};
const blank = (): (string | null)[][] => Array.from({ length: GRID_H }, () => Array<string | null>(GRID_W).fill(null));

/** Markings painted over a region (body or face): vertical stripes, scattered spots,
 *  or a pale belly patch. */
function markingsOn(cells: Cell[], shape: string): Cell[] {
  if (shape === 'none' || cells.length === 0) return [];
  if (shape === 'stripes') return cells.filter(([x]) => x % 3 === 0);
  if (shape === 'spots') return cells.filter(([x, y]) => (x * 7 + y * 13) % 9 < 2);
  const maxY = Math.max(...cells.map((c) => c[1])); // patches: central lower belly
  return cells.filter(([x, y]) => y >= maxY - 3 && Math.abs(x - 8) <= 2);
}

/** A recognisable front-facing creature assembled from the chosen parts: a face
 *  (with optional mane, ears, beak, eyes) above a body, with a tail and markings.
 *  A 'finned' body or headless head is drawn instead as a side-on swimmer. */
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
    set(g, body, col('body'));
    set(g, markingsOn(body, markShape), col('markings'));
    set(g, [[11, 7]], EYE);
    return g;
  }

  const upright = bodyShape === 'upright';
  const headCY = upright ? 4.3 : 5.4;
  const headR = upright ? 2.5 : 3.2;
  const bodyCY = headCY + headR + (upright ? 3 : 2.3);
  const bodyRX = bodyShape === 'long' ? 4.7 : upright ? 2.9 : 3.7;
  const bodyRY = upright ? 4.2 : 2.9;
  const head = ellipse(8, headCY, headR, headR);
  const body = ellipse(8, bodyCY, bodyRX, bodyRY).filter(([, y]) => y < GRID_H);
  const mane = headShape === 'maned' ? ring(8, headCY, headR + 1.6, headR - 0.3) : [];

  const ey = headCY - headR + 0.2;
  let ears: Cell[] = [];
  if (earsShape === 'round') ears = [...ellipse(8 - 2.3, ey, 1.2, 1.2), ...ellipse(8 + 2.3, ey, 1.2, 1.2)];
  else if (earsShape === 'pointed') ears = [[6, ey - 1], [6, ey], [5, ey - 1], [10, ey - 1], [10, ey], [11, ey - 1]];

  const tx = Math.round(8 + bodyRX - 0.5), ty = Math.round(bodyCY + 0.6);
  let tail: Cell[] = [];
  if (tailShape === 'tufted') tail = [[tx, ty], [tx + 1, ty], [tx + 1, ty - 1]];
  else if (tailShape === 'long') tail = [[tx, ty], [tx + 1, ty - 1], [tx + 2, ty - 2], [tx + 2, ty - 3]];
  else if (tailShape === 'fin') tail = ellipse(tx + 1, ty, 1.3, 1.8);

  const beak: Cell[] = headShape === 'beaked' ? [[8, headCY + 0.6], [7, headCY + 1.2], [8, headCY + 1.2], [9, headCY + 1.2]] : [];
  const eyes: Cell[] = [[Math.round(8 - 1.3), Math.round(headCY - 0.2)], [Math.round(8 + 1.3), Math.round(headCY - 0.2)]];

  set(g, tail, has('tail') ? col('tail') : col('body'));
  set(g, mane, col('ears'));               // mane uses the ears/mane colour, behind the face
  set(g, ears, col('ears'));
  set(g, body, col('body'));
  set(g, markingsOn(body, markShape), col('markings'));
  set(g, head, col('head'));
  if (markShape === 'stripes' || markShape === 'spots') set(g, markingsOn(head, markShape), col('markings'));
  set(g, beak, BEAK);
  set(g, eyes, EYE);
  return g;
}

/** Render the assembled design as a GRID_H x GRID_W colour grid (null = empty). Used
 *  by the studio preview and the park sprites, so both always match. */
export function renderDesign(item: BacklogItem, design: ItemDesign): (string | null)[][] {
  if (item.category === 'exhibit') return creatureGrid(design);

  // Building: walls, roof, door, glass, optional sign.
  const g = blank();
  const col = (k: string) => design.colors[k] ?? PLACEHOLDER;
  for (let y = 6; y <= 12; y++) for (let x = 4; x <= 12; x++) g[y][x] = col('walls');
  for (let y = 3; y <= 5; y++) for (let x = 4 + (5 - y); x <= 12 - (5 - y); x++) g[y][x] = col('roof'); // gable roof
  for (let y = 8; y <= 12; y++) for (let x = 7; x <= 9; x++) g[y][x] = col('door'); // door
  g[8][5] = '#a9d3ea'; g[8][11] = '#a9d3ea'; // windows
  if (design.parts.sign === 'on') for (let x = 5; x <= 11; x++) g[1][x] = col('sign');
  return g;
}

// ---- Parts metadata for the studio ----

export interface PartSpec { key: string; label: string; options: string[]; colorKey: string; optional?: boolean }
export const EXHIBIT_PARTS: PartSpec[] = [
  { key: 'body', label: 'Body', options: ['round', 'long', 'upright', 'finned'], colorKey: 'body' },
  { key: 'head', label: 'Head', options: ['round', 'maned', 'beaked', 'none'], colorKey: 'head' },
  { key: 'ears', label: 'Ears / mane', options: ['none', 'round', 'pointed'], colorKey: 'ears', optional: true },
  { key: 'tail', label: 'Tail / fin', options: ['none', 'tufted', 'long', 'fin'], colorKey: 'tail', optional: true },
  { key: 'markings', label: 'Markings', options: ['none', 'stripes', 'spots', 'patches'], colorKey: 'markings', optional: true },
];
export const AMENITY_COLORS: { key: string; label: string }[] = [
  { key: 'walls', label: 'Walls' }, { key: 'roof', label: 'Roof' }, { key: 'door', label: 'Door' }, { key: 'sign', label: 'Sign' },
];
/** Quick colour suggestions offered next to each picker (still fully editable). */
export const SWATCHES = ['#c8873b', '#e6842a', '#e3c66b', '#8a5a2b', '#2a2622', '#f0efe9', '#43a047', '#ef6f53', '#f4c430', '#4a90d9'];

// ---- Presets: a recognisable starting shape per species (uncoloured) ----

const PART_PRESETS: Record<string, Record<string, string>> = {
  lion: { body: 'round', head: 'maned', ears: 'round', tail: 'tufted', markings: 'none' },
  tiger: { body: 'long', head: 'round', ears: 'pointed', tail: 'long', markings: 'stripes' },
  leopard: { body: 'long', head: 'round', ears: 'round', tail: 'long', markings: 'spots' },
  penguins: { body: 'upright', head: 'beaked', ears: 'none', tail: 'none', markings: 'patches' },
  reef: { body: 'finned', head: 'none', ears: 'none', tail: 'fin', markings: 'stripes' },
};
const GENERIC_EXHIBIT = { body: 'round', head: 'round', ears: 'round', tail: 'tufted', markings: 'none' };

/** The starting design for an item: a recognisable shape (for exhibits) with no
 *  colours yet, so the player colours it in. */
export function presetFor(item: BacklogItem): ItemDesign {
  if (item.category !== 'exhibit') return { parts: { sign: 'on' }, colors: {} };
  return { parts: { ...(PART_PRESETS[item.id] ?? GENERIC_EXHIBIT) }, colors: {} };
}
export const emptyDesign = (item: BacklogItem): ItemDesign => presetFor(item);

// ---- The Done gate: acceptance criteria ----

const coloured = (d: ItemDesign) => Object.values(d.colors).filter(Boolean).length;

export function designCriteria(item: BacklogItem, design: ItemDesign): { label: string; pass: boolean }[] {
  if (item.category !== 'exhibit') {
    return [
      { label: 'Colour the walls', pass: !!design.colors.walls },
      { label: 'Colour the roof', pass: !!design.colors.roof },
      { label: 'Add a sign so visitors can find it', pass: design.parts.sign === 'on' && !!design.colors.sign },
    ];
  }
  const fish = design.parts.head === 'none';
  const distinctivePart = (['markings', 'ears', 'tail'] as const).find((k) => (design.parts[k] ?? 'none') !== 'none');
  const distinctive = !!distinctivePart && !!design.colors[distinctivePart!];
  return [
    { label: 'Colour the body', pass: !!design.colors.body },
    { label: fish ? 'Colour the fins' : 'Colour the head', pass: !!design.colors[fish ? 'tail' : 'head'] },
    { label: 'Add and colour a distinctive feature (markings, ears or tail)', pass: distinctive },
    { label: 'Give it a full finish: colour at least three parts', pass: coloured(design) >= 3 },
  ];
}

export const isDesignDone = (item: BacklogItem, design: ItemDesign): boolean => designCriteria(item, design).every((x) => x.pass);

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
