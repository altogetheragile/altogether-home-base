import type { BacklogItem } from './types';
import type { SegmentId } from './simulation/types';

// ============= Design and build =============
//
// Building an item is not one click: you pick a template (given shape) and tailor
// the finish from curated options. It is Done when it meets its acceptance criteria.
// The design choices are the product: they shape how much each visitor group values
// an exhibit. (Templates here are generic per category; per-animal art comes later.)

export interface ItemDesign {
  /** Index into the palettes for this item's category, or null if not chosen. */
  palette: number | null;
  pattern: 'none' | 'stripes' | 'spots';
  /** Which optional features are on. */
  features: string[];
}

export const emptyDesign = (): ItemDesign => ({ palette: null, pattern: 'none', features: [] });

export interface Palette {
  name: string;
  colors: Record<string, string>;
  /** How bright/bold this scheme reads, 0..1. Families reward it, Comfort Seekers do not. */
  bright: number;
}

export interface Template {
  w: number;
  h: number;
  /** Grid of role letters ('.' = empty). Feature letters render only when that feature is on. */
  grid: string[];
  /** Role letter -> palette colour key. */
  roles: Record<string, string>;
  /** The role a pattern decorates. */
  primary: string;
  features: { id: string; label: string; role: string }[];
  /** The feature Enthusiasts prize. */
  signature: string;
}

const CREATURE: Template = {
  w: 9, h: 7,
  grid: ['...C.C...', '..BBBBB..', '.BBBBBBBT', 'BBkBBBBBT', '.BBBBBBBT', '..BBBBB..', '..L...L..'],
  roles: { B: 'primary', k: 'eye', C: 'accent', T: 'accent', L: 'leg' },
  primary: 'B',
  features: [{ id: 'ears', label: 'Ears', role: 'C' }, { id: 'tail', label: 'Tail', role: 'T' }],
  signature: 'ears',
};

const BUILDING: Template = {
  w: 9, h: 7,
  grid: ['...SSS...', '.RRRRRRR.', 'RRRRRRRRR', '.WWWWWWW.', '.WNWDWNW.', '.WWWDWWW.', '.AA...AA.'],
  roles: { W: 'primary', R: 'secondary', D: 'accent', N: 'glass', S: 'accent', A: 'accent' },
  primary: 'W',
  features: [{ id: 'sign', label: 'Sign', role: 'S' }, { id: 'awning', label: 'Awning', role: 'A' }],
  signature: 'sign',
};

const EXHIBIT_PALETTES: Palette[] = [
  { name: 'Tropical', bright: 0.85, colors: { primary: '#43a047', accent: '#f4c430', eye: '#26221e', leg: '#6b4a2a' } },
  { name: 'Sunset', bright: 0.65, colors: { primary: '#e6842a', accent: '#d1495b', eye: '#26221e', leg: '#6b4a2a' } },
  { name: 'Natural', bright: 0.45, colors: { primary: '#8a6a44', accent: '#c9b18a', eye: '#26221e', leg: '#5a4630' } },
];

const AMENITY_PALETTES: Palette[] = [
  { name: 'Rustic', bright: 0.5, colors: { primary: '#c8a26a', secondary: '#8a5a2b', accent: '#6b4a2a', glass: '#a9d3ea' } },
  { name: 'Bright', bright: 0.9, colors: { primary: '#f0be34', secondary: '#d1495b', accent: '#cc4433', glass: '#a9d3ea' } },
  { name: 'Modern', bright: 0.45, colors: { primary: '#cfd4d8', secondary: '#6b7076', accent: '#3a3f44', glass: '#a9d3ea' } },
];

export const templateFor = (item: BacklogItem): Template => (item.category === 'exhibit' ? CREATURE : BUILDING);
export const palettesFor = (item: BacklogItem): Palette[] => (item.category === 'exhibit' ? EXHIBIT_PALETTES : AMENITY_PALETTES);

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The colour a cell renders, or null (empty / hidden feature). '#ccc' outline while
 *  no scheme is chosen. */
export function cellColor(item: BacklogItem, design: ItemDesign, role: string, r: number, c: number): string | null {
  if (role === '.') return null;
  const t = templateFor(item);
  const feat = t.features.find((f) => f.role === role);
  if (feat && !design.features.includes(feat.id)) return null;
  if (design.palette === null) return '#cbcdc6';
  const pal = palettesFor(item)[design.palette];
  let col = pal.colors[t.roles[role]] ?? pal.colors.primary;
  if (role === t.primary && design.pattern !== 'none') {
    if (design.pattern === 'stripes' && c % 2 === 1) col = pal.colors.accent ?? col;
    if (design.pattern === 'spots' && (r * 5 + c * 3) % 6 === 0) col = pal.colors.accent ?? col;
  }
  return col;
}

/** Design completeness: the checkable gate for "Done". The item's descriptive
 *  acceptance criteria are shown alongside as what it should be. */
export function designCriteria(item: BacklogItem, design: ItemDesign): { label: string; pass: boolean }[] {
  const distinctive = design.pattern !== 'none' || design.features.length > 0;
  const list = [
    { label: 'Choose a colour scheme', pass: design.palette !== null },
    { label: 'Give it something distinctive (a feature or a pattern)', pass: distinctive },
  ];
  if (item.category === 'amenity') list.push({ label: 'Add a sign so visitors can find it', pass: design.features.includes('sign') });
  return list;
}

export const isDesignDone = (item: BacklogItem, design: ItemDesign): boolean => designCriteria(item, design).every((x) => x.pass);

/** Turn design choices into appeal per segment for an exhibit. The base appeal is
 *  the animal's inherent draw; the design tilts it: Families reward bright and busy,
 *  Comfort Seekers reward calm and muted, Enthusiasts reward the signature feature
 *  and dislike clutter. So the same lion can be built for different crowds. */
export function appealFromDesign(item: BacklogItem, design: ItemDesign): Record<SegmentId, number> | undefined {
  if (item.category !== 'exhibit' || !item.appeal || design.palette === null) return item.appeal;
  const t = templateFor(item);
  const pal = palettesFor(item)[design.palette];
  const bright = pal.bright;
  const busy = (design.features.length + (design.pattern !== 'none' ? 1 : 0)) / (t.features.length + 1);
  const signatureOn = design.features.includes(t.signature);
  const mult: Record<SegmentId, number> = {
    families: clamp(0.7 + 0.5 * (0.5 * bright + 0.5 * busy), 0.5, 1.25),
    enthusiasts: clamp(0.8 + 0.35 * (signatureOn ? 1 : 0) - 0.15 * busy - 0.1 * bright, 0.5, 1.25),
    comfortSeekers: clamp(0.7 + 0.5 * (1 - busy) * (1 - 0.5 * bright), 0.5, 1.25),
  };
  return {
    families: clamp(item.appeal.families * mult.families, 0, 10),
    enthusiasts: clamp(item.appeal.enthusiasts * mult.enthusiasts, 0, 10),
    comfortSeekers: clamp(item.appeal.comfortSeekers * mult.comfortSeekers, 0, 10),
  };
}
