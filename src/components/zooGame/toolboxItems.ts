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
