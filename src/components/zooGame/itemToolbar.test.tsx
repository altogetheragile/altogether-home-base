import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { BacklogItem } from './types';
import { ItemToolbar } from './ItemToolbar';
import { TILED_BUILDINGS } from './art/buildingTiles.generated';
import { BUILDING_ART } from './art/buildingArt.generated';
import { BUILDING_TYPES, designCriteria, isDesignDone, type ItemDesign } from './design';

const lion = (): BacklogItem => ({
  id: 'lion', name: 'Lion', zone: 'Big Cats', category: 'exhibit', template: 'lion',
  status: 'committed', started: true, enclosureId: 'enc', enclosureSize: 'large',
  points: 3, acceptance: [], acConfirmed: [], tasks: [],
} as unknown as BacklogItem);

describe('choosing who is in a group', () => {
  it('offers males and females, not just adults', () => {
    // A pride is one male and several females, and that is why it is a pride. The model only knew
    // "adults", so the choice could not be made at all.
    const { container } = render(
      <ItemToolbar docked item={lion()} design={{ parts: {}, colors: {} }}
        onDesign={() => {}} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    const text = (container.textContent ?? '').toLowerCase();
    for (const kind of ['males', 'females', 'juveniles', 'cubs']) {
      expect(text, `the studio does not offer ${kind}`).toContain(kind);
    }
    expect(text).not.toContain('adults');
  });

  it('makes a pair a male and a female', () => {
    // "A pair" of anything in a zoo is a breeding pair. Two adults said nothing.
    const chosen: unknown[] = [];
    const { container } = render(
      <ItemToolbar docked item={lion()} design={{ parts: {}, colors: {} }}
        onDesign={(d) => chosen.push(d.group)} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    const pair = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'A pair')!;
    expect(pair, 'there is no way to choose a pair').toBeTruthy();
    pair.click();
    expect(chosen[0]).toEqual({ males: 1, females: 1, juveniles: 0, cubs: 0 });
  });
});

describe('colours a building can actually wear', () => {
  const building = (type: string): BacklogItem => ({
    id: 'b', name: 'Shop', zone: 'Grounds', category: 'amenity', template: type,
    status: 'committed', started: true, points: 3, acceptance: [], acConfirmed: [], tasks: [],
  } as unknown as BacklogItem);

  const toolbarFor = (type: string) => render(
    <ItemToolbar docked item={building(type)} design={{ parts: { type }, colors: {} }}
      onDesign={() => {}} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
  ).container.textContent ?? '';

  it('does not offer to repaint a building that came with its own artwork', () => {
    // A tile is a picture and cannot be repainted. Four colour controls that quietly do nothing are
    // worse than none - and the reason is said, because a control that vanishes without explanation
    // is its own small mystery.
    const drawn = toolbarFor(TILED_BUILDINGS[0]);
    expect(drawn.toLowerCase()).toContain('comes with its own artwork');
    expect(drawn).not.toContain('Walls');
  });

  it('still offers them for a kind that is built out of boxes', () => {
    const undrawn = BUILDING_TYPES.find((t) => !TILED_BUILDINGS.includes(t));
    expect(undrawn, 'every building kind is drawn - this test has nothing left to check').toBeTruthy();
    expect(toolbarFor(undrawn!)).toContain('Walls');
  });

  it('knows exactly which kinds are drawn', () => {
    // Two generated lists, one source. If the tiles change and the names do not, the studio starts
    // offering colours that do nothing again - which is the whole thing this was fixing.
    expect([...TILED_BUILDINGS].sort()).toEqual(Object.keys(BUILDING_ART).sort());
  });
});

describe('everything the studio offers can be finished', () => {
  // The guard that was missing. Hiding the colour controls on a drawn building left a gift shop
  // that could be built, placed, accepted and never finished: its design criteria still asked it to
  // be coloured, and there was no longer any control that could colour it. A criterion nobody can
  // satisfy is worse than no criterion.
  //
  // So: for every kind of thing, there is a design that passes. Found by asking the studio's own
  // rules rather than by listing what to do, which is what makes this catch the next one.
  const satisfy = (item: BacklogItem): ItemDesign => {
    const d: ItemDesign = { parts: { type: item.template ?? "" }, colors: {} };
    // Everything a criterion could ask for. Over-generous on purpose: the question is whether ANY
    // design can pass, not whether this exact one is what a player would build.
    d.parts = { ...d.parts, sign: 'on', thickness: 'medium', coat: 'common', shape: 'rounded' };
    d.colors = { walls: '#fff', roof: '#fff', sign: '#fff', ground: '#fff', fence: '#fff',
                 foliage: '#fff', trunk: '#fff', path: '#fff', water: '#fff' };
    d.group = { males: 1, females: 0, juveniles: 0, cubs: 0 };
    return d;
  };

  const kinds: BacklogItem[] = [
    ...BUILDING_TYPES.map((t) => ({ id: t, name: t, category: 'amenity', template: t } as BacklogItem)),
    { id: 'e', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium' } as BacklogItem,
    { id: 'a', name: 'Lion', category: 'exhibit', template: 'lion', enclosureSize: 'medium' } as BacklogItem,
    { id: 'p', name: 'Paths', category: 'path' } as BacklogItem,
    { id: 'f', name: 'Planting', category: 'flora', template: 'tree' } as BacklogItem,
    { id: 'l', name: 'River', category: 'flora', template: 'river' } as BacklogItem,
  ];

  it('can finish a building that cannot be coloured', () => {
    // The one that matters, and the one the test above does NOT catch: a design built from ONLY
    // what the studio still offers for a drawn building - its kind and its sign, no colours at all -
    // has to be enough. Handing the criteria every colour proves nothing when the point is that the
    // player can no longer choose any.
    for (const type of TILED_BUILDINGS) {
      const item = { id: type, name: type, category: 'amenity', template: type } as BacklogItem;
      const whatTheStudioCanSet: ItemDesign = { parts: { type, sign: 'on' }, colors: {} };
      expect(isDesignDone(item, whatTheStudioCanSet),
        `a ${type} cannot be finished with the controls the studio shows`).toBe(true);
    }
  });

  for (const item of kinds) {
    it(`can finish a ${item.template ?? item.category}`, () => {
      const criteria = designCriteria(item, satisfy(item));
      const unmeetable = criteria.filter((c) => !c.pass).map((c) => c.label);
      expect(unmeetable, `nothing can satisfy: ${unmeetable.join(', ')}`).toEqual([]);
      expect(isDesignDone(item, satisfy(item))).toBe(true);
    });
  }
});
