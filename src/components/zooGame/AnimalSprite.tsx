import { animalArtFor, animalArtSize, animalArtFit, coatFilter } from './art/animalArt';

/** A stocked animal, drawn from the illustration sheet rather than built out of coloured squares.
 *
 *  It sizes itself from the drawing's own dimensions, so a giraffe is tall and narrow and an
 *  elephant is wide and the park gets the proportions of a real menagerie without a table of
 *  per-species sizes to keep in step. Drawings that face left in the source are mirrored, so every
 *  animal in the zoo looks the same way and a group reads as a group rather than a standoff.
 *
 *  The markup is generated from licensed artwork by scripts/extract-animal-art.mjs at development
 *  time and committed - it is never anything a player typed. */
export function AnimalSprite({ species, cell, coat, fit }: { species: string; cell: number; coat?: string;
  /** Fit the drawing inside this box instead of sizing it by how big the animal is. For pickers,
   *  where every animal gets the same square of space and none of them may overflow it. */
  fit?: { w: number; h: number } }) {
  const art = animalArtFor(species);
  if (!art) return null;
  const { w, h } = fit ? animalArtFit(art, fit.w, fit.h) : animalArtSize(art, cell);
  return (
    <svg viewBox={art.viewBox} width={w} height={h} role="img" aria-hidden focusable="false"
      style={{ display: 'block', filter: coatFilter(coat), transform: art.flip ? 'scaleX(-1)' : undefined }}
      dangerouslySetInnerHTML={{ __html: art.body }} />
  );
}
