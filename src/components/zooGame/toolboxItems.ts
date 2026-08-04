import type { ItemCategory, PbiDraft } from './types';

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
}

const exhibit = (template: string, name: string, zone: string): ToolboxItem => ({ template, name, category: 'exhibit', zone });
const amenity = (name: string, zone: string, services: 'food' | 'toilet' | 'rest'): ToolboxItem => ({ name, category: 'amenity', zone, services });
const flora = (name: string): ToolboxItem => ({ name, category: 'flora', zone: 'General' });
const enclosure = (name: string, footprint: 'small' | 'medium' | 'large'): ToolboxItem => ({ name, category: 'enclosure', zone: 'General', footprint });

export const TOOLBOX: { group: string; items: ToolboxItem[] }[] = [
  {
    // Habitats are built FIRST, then animals go in them (animals and enclosures are
    // separate PBIs). Pick a footprint here, then point an animal at it.
    group: 'Habitats',
    items: [enclosure('Small Enclosure', 'small'), enclosure('Medium Enclosure', 'medium'), enclosure('Large Enclosure', 'large')],
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
    items: [amenity('Kiosk', 'General', 'food'), amenity('Cafe', 'General', 'food'), amenity('Gift Shop', 'General', 'food'), amenity('Toilets', 'General', 'toilet'), amenity('Picnic Area', 'General', 'rest'), amenity('Seating', 'General', 'rest')],
  },
  {
    group: 'Flora & decor',
    items: [flora('Trees'), flora('Bushes'), flora('Flowerbed')],
  },
];

/** Turn a picked toolbox item into a Product Backlog Item draft with coached defaults. */
export function toolboxDraft(t: ToolboxItem): PbiDraft {
  const acceptance = t.category === 'exhibit'
    ? [`Recognisable as ${/s$/.test(t.name) ? t.name.toLowerCase() : 'a ' + t.name.toLowerCase()}`, 'Uses at least two colours', 'No bare patches']
    : t.category === 'enclosure'
      ? ['Securely fenced and escape-proof', 'Big enough for its animals', 'Ground, shelter and water set up']
    : t.category === 'amenity'
      ? ['Clearly signed', t.services === 'food' ? 'Serves food and drink' : t.services === 'toilet' ? 'Has enough cubicles' : 'Enough seating']
      : ['Fits the planting', 'Coloured, no bare patches'];
  return { name: t.name, template: t.template, category: t.category, zone: t.zone, services: t.services, enclosureSize: t.footprint, acceptance };
}
