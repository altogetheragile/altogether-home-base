import type { ItemCategory, PbiDraft } from './types';
import { amenityAcceptance, floraAcceptance, enclosureAcceptance, exhibitAcceptance, pathAcceptance } from './design';
import { criterionFor } from './parkChecks';

// ============= The Toolbox =============
//
// A curated palette of predefined pieces the user picks from to build their zoo:
// animal templates, facilities and flora/decor. Picking one creates a Product Backlog
// Item pre-filled with sensible defaults and a species template, which is then tailored
// in the studio (colours, features) and delivered through a Sprint.

export interface ToolboxItem {
  /** Species/template key for exhibits (matches design.ts PART_PRESETS). */
  template?: string;
  name: string;
  category: ItemCategory;
  /** The zone this piece naturally belongs in (the user can change it). */
  zone: string;
  services?: 'food' | 'toilet' | 'rest';
  /** Enclosures: the habitat footprint. */
  footprint?: 'small' | 'medium' | 'large';
  /** Criteria this piece can settle for something OTHER than itself.
   *
   *  Most of what a piece can meet is what it would be asked: a habitat is asked whether it holds
   *  what lives in it, so building one is how that gets answered. Those are derived rather than
   *  written down twice - see `meetsOf`.
   *
   *  This is the rest. A pathway is judged on whether it joins the areas up, but drawing one is
   *  also how a habitat becomes walkable to, and that capability belongs to the pathway. It is the
   *  whole reason the catalogue is worth having: the Product Owner asks for a way to reach the
   *  lions, and the Developers know that a path is the answer. */
  also?: string[];
}

const exhibit = (template: string, name: string, zone: string): ToolboxItem => ({ template, name, category: 'exhibit', zone });
// The template carries the building shape (shop / kiosk / cafe / stall / toilets).
const amenity = (name: string, zone: string, services: 'food' | 'toilet' | 'rest', type: string): ToolboxItem => ({ template: type, name, category: 'amenity', zone, services });
// The template carries the starting flora shape (tree / bush / flowers / signpost).
const flora = (name: string, type: string): ToolboxItem => ({ template: type, name, category: 'flora', zone: 'General' });
const enclosure = (name: string, footprint: 'small' | 'medium' | 'large'): ToolboxItem => ({ name, category: 'enclosure', zone: 'General', footprint });
/** A habitat that holds water rather than ground: glass on every side, and the visitors look
 *  through it. It is a tank from the moment it is written, before any fish has moved in - a Product
 *  Owner ordering a Product Backlog puts "Reef Tank" on it, not "Medium Enclosure, and make it wet later". */
const tank = (name: string, footprint: 'small' | 'medium' | 'large'): ToolboxItem => ({ name, category: 'enclosure', zone: 'General', footprint, template: 'tank' });
// A pathway has no studio design; its delivery is drawing the route on the Park at deployment.
// Drawing one is also how everything else becomes reachable, which is not its own criterion.
const pathway = (name: string): ToolboxItem => ({ name, category: 'path', zone: 'General', also: ['walkable-to'] });

export const TOOLBOX: { group: string; items: ToolboxItem[] }[] = [
  {
    // Habitats are built FIRST, then animals go in them (animals and enclosures are
    // separate PBIs). Pick a footprint here, then point an animal at it.
    group: 'Habitats',
    items: [enclosure('Small Enclosure', 'small'), enclosure('Medium Enclosure', 'medium'), enclosure('Large Enclosure', 'large'),
      tank('Small Tank', 'small'), tank('Medium Tank', 'medium'), tank('Large Tank', 'large')],
  },
  {
    group: 'Big Cats',
    items: [exhibit('lion', 'Lion', 'Big Cats'), exhibit('tiger', 'Tiger', 'Big Cats'), exhibit('leopard', 'Leopard', 'Big Cats'), exhibit('cheetah', 'Cheetah', 'Big Cats')],
  },
  {
    group: 'Savanna',
    items: [exhibit('elephant', 'Elephant', 'Savanna'), exhibit('giraffe', 'Giraffe', 'Savanna'), exhibit('zebra', 'Zebra', 'Savanna'), exhibit('rhino', 'Rhino', 'Savanna'), exhibit('hippo', 'Hippo', 'Savanna'), exhibit('buffalo', 'Buffalo', 'Savanna'), exhibit('antelope', 'Antelope', 'Savanna'), exhibit('meerkat', 'Meerkats', 'Savanna'), exhibit('camel', 'Camel', 'Savanna')],
  },
  {
    group: 'Waterside',
    items: [exhibit('penguins', 'Penguins', 'Waterside'), exhibit('seal', 'Seals', 'Waterside'), exhibit('otter', 'Otters', 'Waterside'), exhibit('flamingo', 'Flamingos', 'Waterside'), exhibit('reef', 'Reef', 'Waterside')],
  },
  {
    group: 'Birds',
    items: [exhibit('eagle', 'Eagle', 'Aviary'), exhibit('parrot', 'Parrots', 'Aviary'), exhibit('owl', 'Owl', 'Aviary'), exhibit('toucan', 'Toucan', 'Aviary'), exhibit('peacock', 'Peacock', 'Aviary'), exhibit('ostrich', 'Ostrich', 'Aviary'), exhibit('emu', 'Emu', 'Aviary')],
  },
  {
    group: 'Forest',
    items: [exhibit('bear', 'Bear', 'Forest'), exhibit('panda', 'Panda', 'Forest'), exhibit('wolf', 'Wolves', 'Forest'), exhibit('fox', 'Fox', 'Forest'), exhibit('gorilla', 'Gorilla', 'Forest'), exhibit('monkey', 'Monkeys', 'Forest'), exhibit('kangaroo', 'Kangaroo', 'Forest')],
  },
  {
    group: 'Facilities',
    items: [amenity('Kiosk', 'General', 'food', 'kiosk'), amenity('Cafe', 'General', 'food', 'cafe'), amenity('Gift Shop', 'General', 'food', 'shop'), amenity('Toilets', 'General', 'toilet', 'toilets'), amenity('Picnic Area', 'General', 'rest', 'stall'), amenity('Seating', 'General', 'rest', 'stall')],
  },
  {
    // Things that grow. Plantable inside a habitat, and put down as many times as the planting needs.
    group: 'Flora',
    items: [flora('Trees', 'tree'), flora('Bushes', 'bush'), flora('Flowerbed', 'flowers'), flora('Hedge', 'hedge')],
  },
  {
    // Landscape: a footprint you resize and turn, and it changes where visitors can walk.
    group: 'Landscape',
    items: [flora('River', 'river'), flora('Pond', 'pond'), flora('Rocks', 'rocks'), flora('Fountain', 'fountain')],
  },
  {
    // Infrastructure: how visitors get about and find their way. A bridge and a signpost were filed
    // under planting, which is where this whole re-sort came from - a bridge is not a plant, it is
    // the thing that lets a path cross water, and the visitors' pathfinding has always known that.
    group: 'Infrastructure',
    items: [pathway('Pathway'),
      // A bridge is judged on whether it crosses the water. What it is FOR is everything on the far
      // bank becoming reachable, and that is somebody else's criterion.
      { ...flora('Bridge', 'bridge'), also: ['walkable-to'] },
      flora('Signpost', 'signpost'), flora('Entrance', 'entrance')],
  },
];

/** Which criteria building this piece could settle.
 *
 *  Derived from what the piece would be ASKED, plus whatever it can settle for other things. Two
 *  lists would be two lists to keep in step, and this game has already learned what happens when a
 *  criterion lives in two places: see the registry in parkChecks.
 *
 *  This is what makes a need checkable before anybody builds anything. A need is a set of criteria;
 *  if nothing in the catalogue meets one of them, it is not an ambition, it is a dead end. */
export function meetsOf(t: ToolboxItem): string[] {
  const asked = toolboxDraft(t).acceptance
    .map((a) => criterionFor(a)?.id)
    .filter((id): id is string => !!id);
  return [...new Set([...asked, ...(t.also ?? [])])];
}

/** The criteria on an item that no single piece could meet between them.
 *
 *  Refinement breaks a composite item into fine-grained ones that are ready for a Sprint, and this
 *  is how the game can tell which is which rather than taking the Product Owner's word for it. If
 *  one thing in the catalogue can settle everything an item asks, it is one piece of work. If
 *  nothing can, the item is asking for more than one thing and splitting is the answer.
 *
 *  "Somewhere to see lions in a suitable enclosure" asks about a habitat AND about the animals in
 *  it, and no single piece is both - so it is two items, and the Developers cannot choose their way
 *  out of it.
 *
 *  Judgement criteria are left out of the sum. Nothing in a catalogue "meets" can I walk right
 *  round it, because a person answers that, and counting it would make every item composite. */
export function noOnePieceMeets(criteria: string[]): string[] {
  const wanted = criteria
    .map((a) => criterionFor(a))
    .filter((d): d is NonNullable<typeof d> => !!d && !!d.answer)
    .map((d) => d.id);
  if (wanted.length < 2) return [];          // one thing to settle, or none: nothing to split over
  const pieces = TOOLBOX.flatMap((g) => g.items);
  const covered = pieces.some((t) => {
    const can = new Set(meetsOf(t));
    return wanted.every((id) => can.has(id));
  });
  return covered ? [] : wanted;
}

/** Everything the catalogue can settle between it. */
export const CATALOGUE_MEETS = (): Set<string> =>
  new Set(TOOLBOX.flatMap((g) => g.items).flatMap(meetsOf));

/** Turn a picked toolbox item into a Product Backlog Item draft with coached defaults. */
export function toolboxDraft(t: ToolboxItem): PbiDraft {
  const acceptance = t.category === 'exhibit'
    ? exhibitAcceptance(t.name)
    : t.category === 'enclosure'
      ? enclosureAcceptance()
    : t.category === 'amenity'
      ? amenityAcceptance(t.name, t.services)
    : t.category === 'path'
      ? pathAcceptance()
      : floraAcceptance(t.template);
  return { name: t.name, template: t.template, category: t.category, zone: t.zone, services: t.services, enclosureSize: t.footprint, acceptance };
}

/** What the catalogue offers for a set of criteria, best answer first.
 *
 *  "Best" is simply how many of the things asked for it can settle. Unsorted, a Large Tank sits
 *  above the Kiosk because a tank is also something you can walk to: true, and no help at all to
 *  somebody deciding where lunch comes from.
 *
 *  Shared, because the panel that offers the choice and the choice the Developers make off-screen
 *  have to agree about what a sensible answer is. Before a team takes refinement on, the Developers
 *  still refine - the learner just does not see it happen - and a different opinion there would
 *  mean the game quietly chose something the panel would have ranked last. */
export function ranked(criteria: string[]): { item: ToolboxItem; meets: number }[] {
  const wanted = new Set(criteria.map((a) => criterionFor(a)?.id).filter(Boolean) as string[]);
  return TOOLBOX.flatMap((g) => g.items)
    .map((t) => ({ item: t, meets: meetsOf(t).filter((m) => wanted.has(m)).length }))
    .sort((a, b) => b.meets - a.meets);
}

/** What the Developers would pick for a need if nobody watched them do it. Null where nothing in
 *  the catalogue answers any of it, which is a need that should never have been written. */
export function bestFor(criteria: string[]): string | null {
  const top = ranked(criteria)[0];
  return top && top.meets > 0 ? top.item.name : null;
}

// ============= What the Developers place =============
//
// The catalogue lists habitats by kind AND size in one row - "Large Enclosure", "Small Tank" -
// because that is how a Product Owner writes one down. A Developer standing at the park is asking a
// different question in a different order: what KIND of thing is this, and then how big.
//
// Reported from playing it: "as soon as I pick the card the studio has me placing an enclosure. I
// want to start the action myself from the toolbar. Structures, pick a structure, place it on the
// park, set size, set surface colour, set barrier type, add interior features, add paths."

export interface Structure {
  key: string;
  name: string;
  what: string;
  /** What it is on the park, once placed. */
  template?: string;
  category: ItemCategory;
  /** Which shelf of the list it sits on. A zoo has thirty-odd animals in it and a flat list of
   *  thirty is not a list anybody reads. */
  group?: string;
}

/** The kinds of thing that can be built for an item, in the order a Developer meets them.
 *
 *  One row per kind rather than one per catalogue entry: how big it is comes next, on its own
 *  control, which is the order the work actually happens in. */
export function structuresFor(category: ItemCategory): Structure[] {
  if (category === 'enclosure') {
    return [
      { key: 'paddock', name: 'Paddock', what: 'ground, and something round it', category: 'enclosure' },
      { key: 'tank', name: 'Tank', what: 'water, glass on every side', template: 'tank', category: 'enclosure' },
    ];
  }
  if (category === 'amenity') {
    return TOOLBOX.flatMap((g) => g.items).filter((t) => t.category === 'amenity')
      .map((t) => ({ key: t.template ?? t.name, name: t.name, what: t.services === 'food' ? 'food and drink'
        : t.services === 'toilet' ? 'toilets' : 'somewhere to sit', template: t.template, category: 'amenity' as const }));
  }
  // The animals, by the part of the zoo they belong to. Which one goes in a habitat is the
  // Developers' to choose, the same as everything else they build - the card says a lion is wanted,
  // and a zoo that cannot be given the wrong animal cannot teach anybody to notice.
  if (category === 'exhibit') {
    return TOOLBOX.filter((g) => g.items.some((t) => t.category === 'exhibit'))
      .flatMap((g) => g.items.filter((t) => t.category === 'exhibit').map((t) => ({
        key: t.template ?? t.name, name: t.name, what: '', template: t.template,
        category: 'exhibit' as const, group: g.group,
      })));
  }
  // Things that grow, and the landscape they grow among.
  if (category === 'flora') {
    return TOOLBOX.filter((g) => ['Flora', 'Landscape', 'Infrastructure'].includes(g.group))
      .flatMap((g) => g.items.filter((t) => t.category === 'flora').map((t) => ({
        key: t.template ?? t.name, name: t.name, what: '', template: t.template,
        category: 'flora' as const, group: g.group,
      })));
  }
  return [];
}

/** What this kind of item's first decision is called, in the words of the thing being built. */
export const structureWord = (category: ItemCategory): string =>
  (category === 'exhibit' ? 'Species' : category === 'flora' ? 'Planting' : 'Structure');

/** Whether this kind of item is one the Developers choose a structure for before building it. */
export const picksAStructure = (category: ItemCategory): boolean => structuresFor(category).length > 0;
