// ============= The plan, drawn as a plan =============
//
// The plan view used to be a second picture of the park: grass with a texture on it, drawn animals,
// pixel-art buildings, visitors strolling the promenade. It was competing with the isometric view,
// which does all of that better - and losing, while carrying the cost of every feature twice.
//
// So it is a blueprint now, and the two views mean different things:
//
//   the PLAN is the drawing you build from - what is where, how big, how it connects;
//   the ISOMETRIC view is the thing you built - what a visitor actually sees.
//
// That is worth more to the game than a second park. It is the Increment and the design for it,
// side by side, which is the distinction the whole thing is trying to teach.
//
// Everything here is a line on a field. Colour is used for meaning and never for decoration: the
// zone an item belongs to, water, work under way, and what is selected. Nothing is shaded, nothing
// is textured, nothing is drawn that a plan would not draw.

/** The field the drawing is on - the blue a cyanotype actually is, rather than a navy. Light enough
 *  that the ruling and the linework read as drawing rather than as glow on a dark screen. */
export const FIELD = '#1d5b8a';
/** ...and the quieter band at the foot of it, where the promenade runs. */
export const FIELD_EDGE = '#194e77';

/** The line everything is drawn in, and its quieter and louder weights. */
export const INK = '#eaf4ff';
export const INK_DIM = 'rgba(234,244,255,0.60)';
export const INK_FAINT = 'rgba(234,244,255,0.26)';

/** Ruled paper. Fine squares, with a heavier line every fifth one, the way a drawing sheet is
 *  ruled - it gives the eye a scale to judge sizes against, which is the plan's whole job. */
export const GRID = 20;
export const gridPaint = (zoom = 1): React.CSSProperties => ({
  backgroundColor: FIELD,
  backgroundImage: [
    `linear-gradient(to right, rgba(234,244,255,0.26) 1px, transparent 1px)`,
    `linear-gradient(to bottom, rgba(234,244,255,0.26) 1px, transparent 1px)`,
    `linear-gradient(to right, rgba(234,244,255,0.12) 1px, transparent 1px)`,
    `linear-gradient(to bottom, rgba(234,244,255,0.12) 1px, transparent 1px)`,
  ].join(','),
  backgroundSize: [
    `${GRID * 5}px ${GRID * 5}px`, `${GRID * 5}px ${GRID * 5}px`,
    `${GRID}px ${GRID}px`, `${GRID}px ${GRID}px`,
  ].join(','),
  // The rule stays the same weight however far you zoom in: a drawing sheet does not get thicker
  // lines when you lean towards it.
  backgroundPosition: '0 0',
  ...(zoom !== 1 ? {} : {}),
});

/** Water, on a plan: shown, not painted. */
export const WATER_LINE = '#cdeeff';
export const WATER_FILL = 'rgba(205,238,255,0.30)';

/** Work under way. Amber survives on a blue field, and it is the colour the hoardings already were
 *  in both views - the one thing on the plan that is deliberately louder than the drawing. */
export const SITE = '#f5a524';
/** What is picked up. The same orange the isometric view rings a held item with. */
export const HELD = '#f97316';

/** A zone's line colour: its own hue, pulled towards the ink so a plan stays a plan. Zones are the
 *  one thing on here that must be told apart at a glance, and a hue does that without shouting. */
export function zoneInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return INK;
  const v = parseInt(m[1], 16);
  const mix = (c: number, towards: number) => Math.round(c + (towards - c) * 0.5);
  const r = mix((v >> 16) & 0xff, 0xea), g = mix((v >> 8) & 0xff, 0xf4), b = mix(v & 0xff, 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** A wash of a zone's colour, for the inside of its habitat - enough to tell two zones apart on a
 *  crowded sheet, not enough to become a fill. */
export const zoneWash = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 'rgba(234,244,255,0.12)';
  const v = parseInt(m[1], 16);
  return `rgba(${(v >> 16) & 0xff},${(v >> 8) & 0xff},${v & 0xff},0.22)`;
};

/** Type on a drawing: small, wide-tracked, and never in the way of the lines it is labelling. */
export const LABEL = 'text-[10px] font-medium uppercase tracking-[0.08em]';
