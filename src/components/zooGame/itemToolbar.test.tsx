import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { BacklogItem } from './types';
import { ItemToolbar } from './ItemToolbar';
import { BUILDING_TYPES, designCriteria, isDesignDone, floraColors, presetFor, type ItemDesign } from './design';

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

  it('offers the colours for every kind, because every kind is drawn from them', () => {
    // This test used to say the opposite. Four kinds arrived as photographs out of a city set,
    // could not be repainted, and had their colour controls hidden with an explanation in place of
    // them. They are drawn now - walls, roof, door, a board over the front - so the paint lands on
    // all of them and there is nothing left to hide or explain.
    for (const type of BUILDING_TYPES) {
      const bar = toolbarFor(type);
      for (const control of ['Walls', 'Roof', 'Door', 'Sign']) {
        expect(bar, `a ${type} cannot be given ${control.toLowerCase()}`).toContain(control);
      }
      expect(bar.toLowerCase(), `a ${type} still claims to come with its own artwork`)
        .not.toContain('comes with its own artwork');
    }
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

  /** ...and everything the player can do to the item OUTSIDE the studio. Not every decision is a
   *  control on the toolbar: a landscape feature is sized by dragging its edge on the park, and the
   *  gate reads that off the item rather than the design. The question this whole block asks is
   *  "can a player finish this", so the fixture has to cover the park as well as the bench. */
  const built = (item: BacklogItem): BacklogItem => ({ ...item, size: { w: 200, h: 60 } });

  for (const item of kinds.map(built)) {
    it(`can finish a ${item.template ?? item.category}`, () => {
      const criteria = designCriteria(item, satisfy(item));
      const unmeetable = criteria.filter((c) => !c.pass).map((c) => c.label);
      expect(unmeetable, `nothing can satisfy: ${unmeetable.join(', ')}`).toEqual([]);
      expect(isDesignDone(item, satisfy(item))).toBe(true);
    });
  }
});

describe('planting a tree', () => {
  const planting = (copies?: { x: number; y: number; piece?: string }[]): BacklogItem => ({
    id: 'f', name: 'Planting', zone: 'Grounds', category: 'flora', template: 'oak',
    status: 'committed', started: true, points: 1, acceptance: [], acConfirmed: [], tasks: [],
    ...(copies ? { copies } : {}),
  } as unknown as BacklogItem);

  /** The catalogue of kinds, as buttons with the kind's name on the tooltip. */
  const kindButtons = (c: HTMLElement) =>
    [...c.querySelectorAll('button')].filter((b) => /^(Oak|Pine|Palm|Blossom|Bare|Bush|Hedge|Rock|Log)/i.test(b.getAttribute('title') ?? ''));

  it('plants the kind that was clicked, rather than changing the one already there', () => {
    // "I want to click oak and get an oak. I want to click pine and get a pine." The catalogue used
    // to CHANGE the selected plant, so the only way to get a second tree was a "+" that copied
    // whatever was selected and then had to be re-chosen.
    const planted: (string | undefined)[] = [];
    const changed: ItemDesign[] = [];
    const { container } = render(
      <ItemToolbar docked item={planting()} design={{ parts: { type: 'oak' }, colors: {} }}
        onDesign={(d) => changed.push(d)} onAddPlant={(piece) => planted.push(piece)}
        onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    const kinds = kindButtons(container);
    expect(kinds.length, 'the studio offers no kinds to plant').toBeGreaterThan(1);

    const pine = kinds.find((b) => /^pine/i.test(b.getAttribute('title') ?? ''))!;
    expect(pine, 'no pine in the catalogue').toBeTruthy();
    fireEvent.click(pine);

    // one pine planted, and the oak that was already there is untouched
    expect(planted, 'clicking a kind planted nothing').toHaveLength(1);
    expect(planted[0]).toMatch(/pine/i);
    expect(changed, 'clicking a kind changed the item instead of planting one').toHaveLength(0);
  });

  it('changes one instead, once you pick out the one you mean', () => {
    // The item itself cannot be taken out, so there has to be some way to say what it is.
    const planted: (string | undefined)[] = [];
    const changed: ItemDesign[] = [];
    const { container } = render(
      <ItemToolbar docked item={planting([{ x: 260, y: 200, piece: 'pine' }])} design={{ parts: { type: 'oak' }, colors: {} }}
        onDesign={(d) => changed.push(d)} onAddPlant={(piece) => planted.push(piece)}
        onSetPlantPiece={() => {}} onToggleTask={() => {}} onConfirmAc={() => {}} onClose={() => {}} />,
    );
    // the row of what is planted: the item, then the one extra
    const row = [...container.querySelectorAll('button')].filter((b) => /the item itself|pick it to change/i.test(b.getAttribute('title') ?? ''));
    expect(row.length, 'the planted things are not shown').toBe(2);

    fireEvent.click(row[0]);
    fireEvent.click(kindButtons(container).find((b) => /^palm/i.test(b.getAttribute('title') ?? ''))!);
    expect(planted, 'picking one out and choosing a kind planted another instead of changing it').toHaveLength(0);
    expect(changed, 'the item did not change kind').toHaveLength(1);
  });
});

describe('a control has to be a decision', () => {
  const flora = (template: string, over: Partial<BacklogItem> = {}): BacklogItem => ({
    id: template, name: template, zone: 'Grounds', category: 'flora', template,
    status: 'committed', started: true, points: 1, acceptance: [], acConfirmed: [], tasks: [],
    ...over,
  } as unknown as BacklogItem);

  it('does not ask what colour the water is', () => {
    // Honoured, unlike the trunk - a river IS drawn in the colour it is given. It still went,
    // because it is not a decision anybody makes. Water is water, and every control that is not a
    // decision is one more thing to click before the PBI can be finished. The bank of a pond and
    // the stone of a fountain stay, because those are choices.
    expect(floraColors('river')).toEqual([]);
    expect(floraColors('pond').map((c) => c.label)).toEqual(['Bank']);
    expect(floraColors('fountain').map((c) => c.label)).toEqual(['Stone']);
  });

  it('does not hand out a river that is already finished', () => {
    // What is left when the colour goes. A piece of scenery starts out knowing what it is, so
    // "choose a plant type" was ticked from the moment the item existed - take the colour away and
    // a River PBI would be Done before anybody touched it, which is the complaint that was already
    // made once about this exact item.
    const untouched = flora('river');
    expect(isDesignDone(untouched, presetFor(untouched)),
      'a river is Done before anybody has done anything to it').toBe(false);

    // What finishes it is the thing a river is actually for: reaching across the park.
    const stretched = flora('river', { size: { w: 400, h: 46 } });
    expect(isDesignDone(stretched, presetFor(stretched))).toBe(true);
  });

  it('asks each piece of scenery about the parts it has got', () => {
    // The gate was hardcoded to "colour the foliage" for every kind of scenery, so a car park was
    // asked about its foliage. It passed only because 'foliage' happened to be the key behind
    // whatever the first control was called - one rename away from another stuck Gift Shop.
    const carpark = flora('carpark', { size: { w: 200, h: 90 } });
    const labels = designCriteria(carpark, presetFor(carpark)).map((c) => c.label);
    expect(labels).not.toContain('Colour the foliage');
    expect(labels).toContain('Colour the tarmac');
    expect(labels).toContain('Colour the markings');
  });
});
