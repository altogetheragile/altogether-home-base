import { ANIMAL_ART, type AnimalArt } from './animalArt.generated';

/** How many units of the source sheet one park grid cell is worth.
 *
 *  One number sets every animal's size, because the sheets are drawn to a single scale: pick it so
 *  a lion looks right and the giraffe towers over it and the penguin comes up to its knee, all
 *  without a per-species figure to maintain. Raise it to shrink the whole menagerie. */
export const UNITS_PER_CELL = 6.5;

/** The species we have a drawing for. Everything else falls back to the built sprite, so a zoo can
 *  hold a toucan and a tiger at once even though only one of them has been drawn yet. */
export const hasAnimalArt = (species?: string): boolean => !!species && species in ANIMAL_ART;

/** The drawing for one animal.
 *
 *  A species can be drawn more than once - a lion has a mane and a lioness does not, and a zoo that
 *  draws them the same is telling a room full of people something untrue about lions. Where a sheet
 *  gives us the difference, `lion_females` sits beside `lion` and is asked for by kind.
 *
 *  A young lion is a small lion WITHOUT a mane, so juveniles and cubs take the female drawing where
 *  there is one - it is nearer the truth than a miniature male, and nearer than nothing. They are
 *  already drawn smaller; see KIND_SCALE. */
export const animalArtFor = (species?: string, kind?: string): AnimalArt | undefined => {
  if (!species) return undefined;
  if (kind) {
    const own = ANIMAL_ART[`${species}_${kind}`];
    if (own) return own;
    if (kind === 'juveniles' || kind === 'cubs') {
      const young = ANIMAL_ART[`${species}_females`];
      if (young) return young;
    }
  }
  return ANIMAL_ART[species];
};

/** The drawing's size in pixels at a given cell size, keeping its own proportions. */
export function animalArtSize(art: AnimalArt, cell: number): { w: number; h: number } {
  const px = cell / UNITS_PER_CELL;
  return { w: Math.max(1, Math.round(art.w * px)), h: Math.max(1, Math.round(art.h * px)) };
}

/** The size a drawing comes out at when it has to fit a given box, keeping its proportions.
 *
 *  For a picker, not for the park. On the park an elephant is drawn bigger than a meerkat because
 *  it IS bigger - that is the whole point of `animalArtSize`. In a list of cards every animal gets
 *  the same square of space, so scaling by how big the animal is fills the card with elephant and
 *  crops its head off, while the meerkat sits in the middle as a dot. */
export function animalArtFit(art: AnimalArt, maxW: number, maxH: number): { w: number; h: number } {
  const k = Math.min(maxW / art.w, maxH / art.h);
  return { w: Math.max(1, Math.round(art.w * k)), h: Math.max(1, Math.round(art.h * k)) };
}

/** A coat is a decision about what the zoo is for, so it has to be visible. A drawing cannot have
 *  its parts recoloured the way a built sprite could, but a pale morph reads as a pale morph: lift
 *  the whole animal towards white and drain some of the colour out of it, or take it the other way
 *  for a dark one. Anything else is left exactly as the illustrator drew it. */
/** The colour an animal was given, as something that can be laid over the drawing of it.
 *
 *  The artwork is a photograph's worth of detail - a lion is twenty browns, not one - so it cannot
 *  simply be filled with the colour somebody picked. What it can be is MOVED: how far the chosen
 *  colour is from the animal's own, in hue, in how strong it is, and in how light. A cream lion goes
 *  pale, a black one goes dark, and a lion left the colour a lion is stays exactly as drawn.
 *
 *  The same trick the planting uses for foliage, which is why it is worth having twice: a control
 *  that writes a colour nothing draws is not a control, and this one wrote to `colors.coat` while
 *  the park read `parts.coat`, which nothing has ever written. Reported from playing it: "changing
 *  the colour of a lion does nothing."
 */
export function coatTint(coat?: string, own?: string): string | undefined {
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
  const want = hsl(coat), base = hsl(own) ?? { h: 33, s: 0.52, l: 0.52 };
  if (!want) return undefined;
  const turn = Math.round(((want.h - base.h + 540) % 360) - 180);
  const sat = Math.max(0.1, Math.min(2.4, want.s / Math.max(0.08, base.s)));
  const lit = Math.max(0.45, Math.min(1.75, want.l / Math.max(0.1, base.l)));
  // Near enough to what it already is that a filter would be a lie about having done something.
  if (Math.abs(turn) < 6 && Math.abs(sat - 1) < 0.12 && Math.abs(lit - 1) < 0.1) return undefined;
  return `hue-rotate(${turn}deg) saturate(${sat.toFixed(2)}) brightness(${lit.toFixed(2)})`;
}

export type { AnimalArt };
