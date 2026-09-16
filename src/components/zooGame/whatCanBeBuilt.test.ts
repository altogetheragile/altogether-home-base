import { describe, it, expect } from 'vitest';
import { CRITERIA, criterionFor } from './parkChecks';
import { TOOLBOX, meetsOf, CATALOGUE_MEETS } from './toolboxItems';

// Can the zoo actually build what it can be asked for?
//
// A need is a set of criteria. If nothing in the catalogue can settle one of them, it is not an
// ambition, it is a dead end: the item can be written, forecast, started and never finished, and
// the only way out is the Product Owner waiving it. This game has been there three times already.
//
// So the catalogue says what each piece can settle, and this is the test that keeps the two ends
// in step.

/** Criteria nothing in the catalogue can meet, and why each one is like that.
 *
 *  Not a list of bugs. Three different reasons, and they are worth telling apart - the first is
 *  fine, the second is scenery, and the third is the interesting one. Adding to this list should
 *  take an argument; taking one off it should take a commit. */
const CANNOT_BE_BUILT: Record<string, string> = {
  // A facility that offers none of the three things visitors need falls back to this. Every piece
  // in the Facilities drawer offers something, so nothing there asks it: it is reachable only by
  // writing an item by hand. Fine, and worth knowing.
  'what-i-came-for': 'only ever asked of a facility somebody wrote by hand',

  // The car park is drawn by the park, not placed on it. These are its criteria and there is no
  // piece that builds one, so a Product Owner could ask for somewhere to park and nobody could
  // deliver it.
  'where-to-park': 'the car park is scenery the park draws, not a piece anybody can build',
  'walk-to-entrance': 'the car park is scenery the park draws, not a piece anybody can build',

  // An AREA, before it is broken up. Epics come from the opening wizard and nowhere else, so an
  // area-level need cannot be written from the catalogue. This is the one that matters: under the
  // needs model an area is exactly the shape of thing a Product Owner should be asking for, and
  // today there is no way to ask for one after the zoo has opened.
  'animals-named': 'an area epic, and only the opening wizard makes those',
  'species-apart': 'an area epic, and only the opening wizard makes those',
  'served-here': 'an area epic, and only the opening wizard makes those',

  // The item the visitors ask for when they queue. It arrives by accepting a signal at a Review,
  // and there is no way to choose one deliberately.
  'eases-queues': 'arrives by accepting a crowding signal, and cannot be picked',
  'sightlines': 'arrives by accepting a crowding signal, and cannot be picked',
};

describe('what the catalogue can settle', () => {
  it('names only criteria that exist', () => {
    // The other half of the registry's invariant, from the catalogue's side: a piece cannot claim
    // to meet something imaginary.
    const made = new Map(CRITERIA.map((c) => [c.id, c]));
    const bad: string[] = [];
    for (const g of TOOLBOX) {
      for (const t of g.items) {
        for (const id of meetsOf(t)) if (!made.has(id)) bad.push(`${t.name}: ${id}`);
      }
    }
    expect(bad, 'these pieces claim to meet a criterion nothing asks').toEqual([]);
  });

  it('covers every criterion except the ones we know it does not', () => {
    const can = CATALOGUE_MEETS();
    const uncovered = CRITERIA.filter((c) => !can.has(c.id)).map((c) => c.id).sort();
    expect(uncovered, 'a criterion can be asked for that nothing in the studio can build')
      .toEqual(Object.keys(CANNOT_BE_BUILT).sort());
  });

  it('gives every gap a reason', () => {
    for (const [id, why] of Object.entries(CANNOT_BE_BUILT)) {
      expect(criterionFor(CRITERIA.find((c) => c.id === id)!.asks)?.id,
        `${id} is listed as unbuildable and is not a criterion`).toBe(id);
      expect(why.length, `${id} has no reason against it`).toBeGreaterThan(20);
    }
  });

  it('knows what a path is for, which is not its own criterion', () => {
    // A pathway is judged on whether it joins the areas up. Drawing one is ALSO how a habitat
    // becomes walkable to, and that capability belongs to the pathway - it is the whole reason a
    // catalogue is worth having. The Product Owner asks for a way to reach the lions; the
    // Developers know a path is the answer.
    const path = TOOLBOX.flatMap((g) => g.items).find((t) => t.name === 'Pathway')!;
    expect(meetsOf(path)).toContain('joins-up');
    expect(meetsOf(path), 'nothing in the catalogue knows how to make something reachable')
      .toContain('walkable-to');
    const bridge = TOOLBOX.flatMap((g) => g.items).find((t) => t.name === 'Bridge')!;
    expect(meetsOf(bridge)).toContain('crosses-water');
    expect(meetsOf(bridge), 'a bridge is for getting to the far bank').toContain('walkable-to');
  });

  it('derives the rest from what each piece would be asked', () => {
    // Not a second list to keep in step. A habitat is asked whether it holds what lives in it, so
    // building one is how that gets answered.
    const pen = TOOLBOX.flatMap((g) => g.items).find((t) => t.name === 'Medium Enclosure')!;
    expect(meetsOf(pen)).toEqual(expect.arrayContaining(['held', 'roomy', 'a-home', 'walkable-to']));
    const lion = TOOLBOX.flatMap((g) => g.items).find((t) => t.name === 'Lion')!;
    expect(meetsOf(lion)).toEqual(expect.arrayContaining(['recognisable', 'a-group', 'room-to-spare', 'findable']));
    const kiosk = TOOLBOX.flatMap((g) => g.items).find((t) => t.name === 'Kiosk')!;
    expect(meetsOf(kiosk)).toEqual(expect.arrayContaining(['says-what-it-is', 'sells-food', 'walkable-to']));
  });
});
