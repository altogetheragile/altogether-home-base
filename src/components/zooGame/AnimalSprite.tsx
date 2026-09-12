import { useId } from 'react';
import { animalArtFor, animalArtSize, animalArtFit } from './art/animalArt';
import { coatTint, tintRef } from './art/tint';
import { TintDefs } from './art/TintDefs';

/** A stocked animal, drawn from the illustration sheet rather than built out of coloured squares.
 *
 *  It sizes itself from the drawing's own dimensions, so a giraffe is tall and narrow and an
 *  elephant is wide and the park gets the proportions of a real menagerie without a table of
 *  per-species sizes to keep in step. Drawings that face left in the source are mirrored, so every
 *  animal in the zoo looks the same way and a group reads as a group rather than a standoff.
 *
 *  The markup is generated from licensed artwork by scripts/extract-animal-art.mjs at development
 *  time and committed - it is never anything a player typed. */
export function AnimalSprite({ species, cell, coat, own, fit }: { species: string; cell: number;
  /** The colour this one was given, if it was given one. */
  coat?: string;
  /** ...and the colour the species is, which is what the given one is measured against. */
  own?: string;
  /** Fit the drawing inside this box instead of sizing it by how big the animal is. For pickers,
   *  where every animal gets the same square of space and none of them may overflow it. */
  fit?: { w: number; h: number } }) {
  // This sprite's own filter, because several of them share a page and must not share an id.
  const where = `coat-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const art = animalArtFor(species);
  if (!art) return null;
  const { w, h } = fit ? animalArtFit(art, fit.w, fit.h) : animalArtSize(art, cell);
  const paint = coatTint(coat, own);
  return (
    <svg viewBox={art.viewBox} width={w} height={h} role="img" aria-hidden focusable="false"
      style={{ display: 'block', transform: art.flip ? 'scaleX(-1)' : undefined }}>
      <TintDefs where={where} tints={paint ? [paint] : []} />
      {/* The tint rides on a group, as an SVG filter. Set as a CSS style on the drawing it was
          ignored by WebKit entirely - see `art/tint` for the measurements. */}
      <g filter={paint ? tintRef(where, paint) : undefined}
        dangerouslySetInnerHTML={{ __html: art.body }} />
    </svg>
  );
}
