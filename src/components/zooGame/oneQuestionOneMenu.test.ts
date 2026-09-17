import { describe, it, expect } from 'vitest';
import { GROUPS, groupsFor, labelOf, isAbout, wouldSettle, openCriteria } from './buildGroups';
import { structuresFor } from './toolboxItems';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem, ItemCategory } from './types';

// The toolbar asks each question once, and calls the same act by the same name.
//
// Asked after a play-through: "check all the toolbar actions for adding, sizing, etc are
// consistent." They were not, and in a way the game keeps repeating: a control gets added and the
// older one that asked the same thing stays. "Holds: land or a tank" sat beside Structure, which is
// where a paddock and a tank are chosen. "Type: kiosk, cafe" sat beside Structure too. "Kind: tree,
// bush" sat beside Planting - and that one I had already claimed to remove, which is exactly why
// this is a test rather than a promise.
//
// Each group says what its controls WRITE. Two groups that write the same thing are two ways to
// answer one question, and the one that looks like a choice is not always the one that counts.

const KINDS: ItemCategory[] = ['enclosure', 'exhibit', 'amenity', 'flora', 'path'];
const of = (category: ItemCategory, over: Partial<BacklogItem> = {}): BacklogItem =>
  ({ id: 'x', name: 'x', zone: 'General', category, acceptance: [], status: 'backlog',
    sprintNumber: null, accessible: true, ...over } as BacklogItem);

describe('one question, one menu', () => {
  for (const category of KINDS) {
    it(`asks nothing twice of a ${category}`, () => {
      const groups = groupsFor(of(category));
      const seen = new Map<string, string>();
      const clashes: string[] = [];
      for (const g of groups) {
        for (const w of g.writes) {
          const already = seen.get(w);
          // `colors.plant` is a family rather than one key - a tree writes leaves and trunk, a pond
          // writes water - so the two menus that touch a plant's colours are told apart by hand.
          if (already && w !== 'colors.plant') clashes.push(`${w}: ${already} and ${g.id}`);
          seen.set(w, g.id);
        }
      }
      expect(clashes, `two menus write the same thing on a ${category}`).toEqual([]);
    });
  }

  it('says what every menu writes, so the check above has something to check', () => {
    const silent = GROUPS.filter((g) => !g.writes.length).map((g) => g.id);
    expect(silent, 'a menu that writes nothing is a menu that does nothing').toEqual([]);
  });
});

describe('the same act is called the same thing', () => {
  const seeded = initialZooState(1) as ZooGameState;
  // A PLANT rather than whatever flora comes first: the first is the Bridge, which is landscape -
  // it is not sized and there is never more than one of it.
  const real = (category: ItemCategory) => (category === 'flora'
    ? seeded.backlog.find((it) => it.category === 'flora' && it.template === 'tree')!
    : seeded.backlog.find((it) => it.category === category) ?? of(category));

  it('calls sizing Size, whatever is being sized', () => {
    // A habitat was Footprint and a plant was Size, and a plant's was a row inside its Look menu -
    // the same act, in two names and two places.
    for (const category of ['enclosure', 'flora'] as ItemCategory[]) {
      const item = real(category);
      const sizing = groupsFor(item).filter((g) => g.writes.some((w) => /enclosureSize|parts\.size/.test(w)));
      expect(sizing.length, `nothing sizes a ${category}`).toBe(1);
      expect(labelOf(sizing[0], item), `a ${category} does not call sizing Size`).toBe('Size');
    }
  });

  it('calls having several of something How many, whatever it is', () => {
    for (const category of ['exhibit', 'flora'] as ItemCategory[]) {
      const item = real(category);
      const many = groupsFor(item).filter((g) => ['stock', 'clump'].includes(g.id));
      expect(many.length, `a ${category} cannot be given more than one`).toBe(1);
      expect(labelOf(many[0], item)).toBe('How many');
    }
  });

  it('calls what a thing looks like Look, whatever kind of thing it is', () => {
    // It was Fence on a habitat, Colours on a building and Look on an animal and a plant: one act
    // in three words. Some of those looks are load-bearing - a building with no name board cannot
    // be told apart from a shed - which is a reason to name it well, not to name it three ways.
    for (const [category, id] of [['enclosure', 'fence'], ['amenity', 'colours'],
      ['exhibit', 'look'], ['flora', 'planting']] as const) {
      const item = real(category);
      const look = groupsFor(item).find((g) => g.id === id)!;
      expect(look, `a ${category} cannot be given a look at all`).toBeTruthy();
      expect(labelOf(look, item), `a ${category} calls it something else`).toBe('Look');
    }
  });

  it('names the floor of a habitat in the one word that is true either way', () => {
    // It was a menu called Surface with a row inside it called GROUND - the menu's own name said
    // again, in a word that is wrong the moment the habitat is a tank: "having ground in the
    // surface menu does not make sense. What if it is water?" Naming the menu Ground or Water was
    // the same wrongness moved up a level. Surface is true of both, and what changes with the
    // structure is the swatches.
    const pen = real('enclosure');
    const floor = (it: BacklogItem) => labelOf(groupsFor(it).find((g) => g.id === 'ground')!, it);
    expect(floor({ ...pen, draftDesign: { parts: { structure: 'paddock', ground: 'land' }, colors: {} } }))
      .toBe('Surface');
    expect(floor({ ...pen, draftDesign: { parts: { structure: 'tank', ground: 'water' }, colors: {} } }),
      'a tank and a paddock are asked in different words').toBe('Surface');
  });

  it('keeps the control that answers a judgement, though it can never be lit', () => {
    // "There is no way to set the coat colour of the lions." A lion is asked four things: three the
    // park measures, and whether you can tell it is a lion without reading the sign, which is
    // nobody's measurement. The coat is the answer to that one - and because it settles nothing,
    // "Needs only" filtered it off the strip with the rest of the cosmetics.
    const lion = real('exhibit');
    const look = groupsFor(lion).find((g) => g.id === 'look')!;
    expect(isAbout(look, lion), 'the coat is not on the strip at all').toBe(true);
    // ...and it still lights nothing: a dot means "press this and it goes green", and nothing here
    // can turn somebody's judgement green.
    expect(wouldSettle(look, openCriteria(seeded, lion), lion), 'the coat lit as if it settled something').toBe(false);
  });

  it('puts what it IS first, for everything that is placed', () => {
    for (const category of ['enclosure', 'exhibit', 'amenity', 'flora'] as ItemCategory[]) {
      const groups = groupsFor(real(category));
      expect(groups[0]?.id, `the first thing asked of a ${category} is not what it is`).toBe('structure');
      expect(structuresFor(category).length, `nothing to choose for a ${category}`).toBeGreaterThan(0);
    }
  });
});
