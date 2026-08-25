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
export function coatFilter(coat?: string): string | undefined {
  if (coat === 'pale') return 'brightness(1.22) saturate(0.55)';
  if (coat === 'dark') return 'brightness(0.72) saturate(1.1)';
  return undefined;
}

export type { AnimalArt };
