import { describe, it, expect } from 'vitest';
import { ANIMAL_ART } from './art/animalArt.generated';
import { hasAnimalArt, animalArtFor, animalArtSize, coatFilter, UNITS_PER_CELL } from './art/animalArt';
import { TOOLBOX } from './toolboxItems';

const exhibitTemplates = new Set(
  TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'exhibit').map((i) => i.template!),
);

describe('animal artwork', () => {
  it('draws only species the toolbox actually offers', () => {
    // Art for a species nobody can pick is art nobody will see, and usually a typo in the config.
    const orphans = Object.keys(ANIMAL_ART).filter((s) => !exhibitTemplates.has(s));
    expect(orphans).toEqual([]);
  });

  it('leaves the species it has no drawing for on their built sprites', () => {
    // The two kinds of sprite live side by side on purpose. If this ever came back true for
    // everything, the fallback would be dead code and an unillustrated animal would vanish.
    expect(hasAnimalArt('toucan')).toBe(false);
    expect(hasAnimalArt(undefined)).toBe(false);
    expect(animalArtFor('toucan')).toBeUndefined();
    expect([...exhibitTemplates].some((t) => !hasAnimalArt(t))).toBe(true);
  });

  it('sizes each animal from its own drawing, so the park is to scale', () => {
    const lion = animalArtFor('lion')!;
    const giraffe = animalArtFor('giraffe')!;
    const penguins = animalArtFor('penguins')!;
    const at = (a: typeof lion) => animalArtSize(a, 2);
    expect(at(giraffe).h).toBeGreaterThan(at(lion).h);
    expect(at(lion).h).toBeGreaterThan(at(penguins).h);
    expect(at(giraffe).h).toBeGreaterThan(at(giraffe).w); // tall and narrow
  });

  it('keeps a drawing in proportion at any cell size', () => {
    for (const [species, art] of Object.entries(ANIMAL_ART)) {
      const small = animalArtSize(art, 1);
      const large = animalArtSize(art, 8);
      const ratio = art.w / art.h;
      expect(small.w / small.h, `${species} at cell 1`).toBeCloseTo(ratio, 0);
      expect(large.w / large.h, `${species} at cell 8`).toBeCloseTo(ratio, 1);
      expect(small.w, `${species} never vanishes`).toBeGreaterThanOrEqual(1);
    }
  });

  it('scales with the cell, so a crowded enclosure draws its animals smaller', () => {
    expect(animalArtSize(animalArtFor('lion')!, 1).w).toBeLessThan(animalArtSize(animalArtFor('lion')!, 2).w);
    expect(UNITS_PER_CELL).toBeGreaterThan(0);
  });

  it('carries a coat through as a visible change, or leaves the drawing alone', () => {
    expect(coatFilter('pale')).toBeTruthy();
    expect(coatFilter('dark')).toBeTruthy();
    expect(coatFilter('pale')).not.toEqual(coatFilter('dark'));
    expect(coatFilter('common')).toBeUndefined();
    expect(coatFilter(undefined)).toBeUndefined();
  });

  it('holds nothing but drawing', () => {
    // The markup is injected with dangerouslySetInnerHTML. It comes from our own extraction of a
    // licensed file rather than from anything a player typed, and this is what says so.
    for (const [species, art] of Object.entries(ANIMAL_ART)) {
      expect(art.body, species).not.toMatch(/<script|<foreignObject|<iframe|<image|<use\b/i);
      expect(art.body, species).not.toMatch(/\son\w+\s*=/i);
      expect(art.body, species).not.toMatch(/javascript:|data:text\/html/i);
      expect(art.body, species).toMatch(/^<g[\s>]/);
      expect(art.viewBox, species).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    }
  });
});
