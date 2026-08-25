import { describe, it, expect } from 'vitest';
import { ANIMAL_ART } from './art/animalArt.generated';
import { hasAnimalArt, animalArtFor, animalArtSize, animalArtFit, coatFilter, UNITS_PER_CELL } from './art/animalArt';
import { TOOLBOX } from './toolboxItems';

const exhibitTemplates = new Set(
  TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'exhibit').map((i) => i.template!),
);

describe('animal artwork', () => {
  it('draws only species the toolbox actually offers', () => {
    // Art for a species nobody can pick is art nobody will see, and usually a typo in the config.
    // `lion_females` is a VARIANT of a species, not a species: a lioness has no mane, and the game
    // asks for the drawing by kind. A variant is still only allowed if its species is offered, so a
    // typo in either half is still caught.
    const orphans = Object.keys(ANIMAL_ART).filter((s) => !exhibitTemplates.has(s.split('_')[0]));
    expect(orphans).toEqual([]);
  });

  it('draws a lioness without a mane, and a young lion as a small one', () => {
    // "Not all lions have manes." The group already knew who was in it; there was one drawing.
    expect(animalArtFor('lion', 'females')).toBeTruthy();
    expect(animalArtFor('lion', 'females')).not.toBe(animalArtFor('lion', 'males'));
    // A cub has a drawing of its own - a lion's proportions are not an adult's shrunk down.
    expect(animalArtFor('lion', 'cubs')).toBeTruthy();
    expect(animalArtFor('lion', 'cubs')).not.toBe(animalArtFor('lion', 'females'));
    // A juvenile has no drawing of its own, and is a small lion that has not grown a mane - so it
    // takes the maneless adult rather than a miniature male. Drawn smaller by KIND_SCALE.
    expect(animalArtFor('lion', 'juveniles')).toBe(animalArtFor('lion', 'females'));
    // A species with only one drawing gives that drawing whatever is asked for, rather than nothing.
    expect(animalArtFor('zebra', 'females')).toBe(animalArtFor('zebra'));
  });

  it('leaves a species it has no drawing for on its built sprite', () => {
    // The two kinds of sprite live side by side on purpose. This used to hunt for a real species the
    // toolbox offered and nobody had illustrated - then somebody drew the last two, the emu and the
    // kangaroo, and the hunt came back empty and the test failed for the happiest possible reason.
    //
    // The fallback is not dead code. It is what stands on the park the day a new animal is added to
    // the toolbox and before anyone has drawn it, and that day will come again. So the test uses a
    // species nobody has, rather than depending on one existing.
    expect(hasAnimalArt('quagga')).toBe(false);
    expect(animalArtFor('quagga')).toBeUndefined();
    expect(animalArtFor('quagga', 'females')).toBeUndefined();
    expect(hasAnimalArt(undefined)).toBe(false);
    expect(animalArtFor(undefined)).toBeUndefined();
  });

  it('has now drawn every species the toolbox offers', () => {
    // Worth saying out loud, and worth knowing if it stops being true: adding a species to the
    // toolbox without drawing it is allowed, and this is where you find out you did it.
    const undrawn = [...exhibitTemplates].filter((t) => !hasAnimalArt(t));
    expect(undrawn, `not drawn yet: ${undrawn.join(', ')}`).toEqual([]);
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

  it('fits every animal into a picker\'s card, whatever size the animal is', () => {
    // The park sizes an animal by how big it is, which is the point of it. A picker cannot: every
    // card is the same, so scaling by size fills one with elephant and crops its head off while
    // the meerkat sits in the middle as a dot. This is the other mode.
    const BOX = { w: 48, h: 42 };
    for (const [species, art] of Object.entries(ANIMAL_ART)) {
      const fitted = animalArtFit(art, BOX.w, BOX.h);
      expect(fitted.w, `${species} overflows the card`).toBeLessThanOrEqual(BOX.w);
      expect(fitted.h, `${species} overflows the card`).toBeLessThanOrEqual(BOX.h);
      // And it fills one dimension, so nothing is a speck in the middle of its card.
      expect(fitted.w === BOX.w || fitted.h === BOX.h, `${species} does not fill its card`).toBe(true);
      expect(fitted.w / fitted.h).toBeCloseTo(art.w / art.h, 0);
    }
  });

  it('still sizes the park by how big the animal is', () => {
    // The two modes must not collapse into one: an elephant on the park is drawn bigger than a
    // meerkat, and in a picker they are the same.
    const el = animalArtFor('elephant')!, mk = animalArtFor('meerkat')!;
    expect(animalArtSize(el, 2).h).toBeGreaterThan(animalArtSize(mk, 2).h);
    expect(animalArtFit(el, 48, 42).h).toBeLessThanOrEqual(42);
    expect(animalArtFit(mk, 48, 42).h).toBe(42);
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
