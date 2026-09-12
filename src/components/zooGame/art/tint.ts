/** Recolouring a drawing, in a way Safari also does.
 *
 *  The artwork is a photograph's worth of detail - a lion is twenty browns, not one - so it cannot be
 *  filled with the colour somebody picked. What it can be is MOVED: how far the chosen colour is from
 *  the drawing's own, in hue, in how strong it is, and in how light.
 *
 *  This was a CSS `filter` string, set as a style on the nested `<svg>` that holds the drawing. It
 *  worked in Chromium, which is what every test and every driver here runs in, and **WebKit ignores
 *  it** - so in Safari an animal simply never changed colour, and neither did any planting. Measured,
 *  not guessed: the same rectangle, tinted three ways, sampled in both engines.
 *
 *    | engine   | plain       | CSS filter      | SVG filter attribute |
 *    | Chromium | 201,150,63  | 75,69,62        | 74,68,62             |
 *    | WebKit   | 201,150,63  | 201,150,63 (!)  | 74,68,62             |
 *
 *  So a tint is the three NUMBERS now, and what carries them to the screen is an SVG `<filter>`
 *  referenced by the `filter` attribute - SVG 1.1, understood everywhere. Reported from playing it,
 *  twice, on a build where the tests were green: "the lions on the isometric are not changing
 *  colour."
 */
export interface Tint {
  /** Degrees round the colour wheel. */
  hue: number;
  /** How much more or less colourful, 1 being as drawn. */
  sat: number;
  /** How much lighter or darker, 1 being as drawn. */
  bright: number;
}

const hsl = (hex?: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 0xff) / 255, g = ((v >> 8) & 0xff) / 255, b = (v & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
};

/** Moved from one colour towards another, or nothing at all when the two are near enough that a
 *  filter would be a lie about having done something. */
function shift(want: string | undefined, own: { h: number; s: number; l: number },
  limits: { sat: [number, number]; bright: [number, number] }): Tint | undefined {
  const to = hsl(want);
  if (!to) return undefined;
  const hue = Math.round(((to.h - own.h + 540) % 360) - 180);
  const sat = Math.max(limits.sat[0], Math.min(limits.sat[1], to.s / Math.max(0.08, own.s)));
  const bright = Math.max(limits.bright[0], Math.min(limits.bright[1], to.l / Math.max(0.1, own.l)));
  if (Math.abs(hue) < 6 && Math.abs(sat - 1) < 0.12 && Math.abs(bright - 1) < 0.1) return undefined;
  return { hue, sat, bright };
}

/** The look an animal was given, against the colour its species already is. */
export const coatTint = (coat?: string, own?: string): Tint | undefined =>
  shift(coat, hsl(own) ?? { h: 33, s: 0.52, l: 0.52 }, { sat: [0.1, 2.4], bright: [0.45, 1.75] });

/** The colour a planting was given, against what the foliage artwork already is: a mid, fairly
 *  saturated green. */
export const foliageTint = (hex?: string): Tint | undefined =>
  shift(hex, { h: 104, s: 0.42, l: 0.42 }, { sat: [0.15, 3], bright: [0.55, 1.5] });

/** The same tint always gets the same name, so one `<filter>` serves every drawing wearing it. */
export const tintKey = (t: Tint): string =>
  `t${Math.round(t.hue) + 180}_${Math.round(t.sat * 100)}_${Math.round(t.bright * 100)}`;

/** What to put in the `filter` attribute. `where` scopes the ids to one drawing of the park, because
 *  two parks on one page (the Increment tab and the Review) must not share them. */
export const tintRef = (where: string, t: Tint): string => `url(#${where}-${tintKey(t)})`;
