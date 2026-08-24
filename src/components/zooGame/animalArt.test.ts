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
    // Whichever species that is is found rather than named: naming one dates the test the day
    // somebody draws it, which is exactly what happened to the toucan.
    const undrawn = [...exhibitTemplates].filter((t) => !hasAnimalArt(t));
    expect(undrawn.length, 'every species is drawn - the fallback is now dead code').toBeGreaterThan(0);
    expect(animalArtFor(undrawn[0])).toBeUndefined();
    expect(hasAnimalArt(undefined)).toBe(false);
    expect(hasAnimalArt('not-an-animal')).toBe(false);
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

  it('brings a species in from a second sheet at the right size', () => {
    // The flamingo comes off a different sheet with its own units. If the scaling were dropped it
    // would tower over the giraffe or vanish beside the penguin, and the giveaway is silent.
    const flamingo = animalArtFor('flamingo')!;
    const penguins = animalArtFor('penguins')!;
    const giraffe = animalArtFor('giraffe')!;
    expect(flamingo.h).toBeGreaterThan(penguins.h);
    expect(flamingo.h).toBeLessThan(giraffe.h / 2);
  });

  it('leaves no drawing empty, however it was cut out', () => {
    // Both of these have been real: a sheet whose exporter gives every path an id had the drawing
    // pruned away as if it were an unused definition, and a box measured before the shadow was
    // dropped left the animal squashed. Either way the failure is a correctly sized nothing.
    for (const [species, art] of Object.entries(ANIMAL_ART)) {
      expect(art.body.length, `${species} is empty`).toBeGreaterThan(400);
      expect(art.body, species).toMatch(/<(path|polygon|g)[\s>]/);
      expect(art.w, species).toBeGreaterThan(0);
      expect(art.h, species).toBeGreaterThan(0);
    }
  });

  it('drops the sheet\'s own backdrop rather than parking it on the grass', () => {
    // The flamingo sheet draws each bird on a teal shadow puddle the colour of its own background.
    const flamingo = animalArtFor('flamingo')!;
    for (const teal of ['#4FC1AB', '#64D4BF', '4FC1AB', '64D4BF']) {
      expect(flamingo.body.toUpperCase()).not.toContain(teal.toUpperCase());
    }
  });

  it('holds nothing but drawing', () => {
    // The markup is injected with dangerouslySetInnerHTML. It comes from our own extraction of a
    // licensed file rather than from anything a player typed, and this is what says so.
    for (const [species, art] of Object.entries(ANIMAL_ART)) {
      expect(art.body, species).not.toMatch(/<script|<foreignObject|<iframe|<image|<use\b/i);
      expect(art.body, species).not.toMatch(/\son\w+\s*=/i);
      expect(art.body, species).not.toMatch(/javascript:|data:text\/html/i);
      // Starts with something drawable. Not specifically a <g>: a drawing cut out by region rather
      // than lifted from a group arrives as bare paths, having had its empty wrappers pruned.
      expect(art.body.trimStart(), species).toMatch(/^<(g|path|polygon|circle|ellipse|rect|defs)[\s>]/);
      expect(art.viewBox, species).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    }
  });
});
