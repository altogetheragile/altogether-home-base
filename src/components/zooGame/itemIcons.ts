import {
  Cat, Dog, Bird, Fish, Squirrel, PawPrint, Fence, Layers, Trees, Shrub, Flower2, Droplet, Droplets,
  Waves, Mountain, Signpost, Spline, DoorOpen, Route, Coffee, IceCream, Store, Bath, Armchair,
  Utensils, Package, type LucideIcon,
} from 'lucide-react';

// The icon for a Backlog item, picked from what the item actually is rather than from its category.
// A tiger is a cat, a pathway is a route, the toilets are not a fish. The item carries the toolbox
// template it was made from ('tiger', 'kiosk', 'bridge'), so that is the first thing we look at; a
// hand-written PBI has no template, so we fall back to its name and then to its category.
//
// The mapping resolves to a KEY and the key is looked up in ICONS, rather than returning the
// component itself: a component chosen by a function call at render time is a thing React should
// not have to think about, and the compiler rightly complains.

export type IconKey =
  | 'cat' | 'dog' | 'bird' | 'fish' | 'squirrel' | 'paw' | 'fence' | 'epic'
  | 'tree' | 'shrub' | 'flower' | 'pond' | 'fountain' | 'river' | 'bridge' | 'rocks'
  | 'signpost' | 'entrance' | 'path' | 'cafe' | 'kiosk' | 'shop' | 'toilets' | 'seating'
  | 'food' | 'thing';

export const ICONS: Record<IconKey, LucideIcon> = {
  cat: Cat, dog: Dog, bird: Bird, fish: Fish, squirrel: Squirrel, paw: PawPrint, fence: Fence,
  epic: Layers, tree: Trees, shrub: Shrub, flower: Flower2, pond: Droplet, fountain: Droplets,
  river: Waves, bridge: Spline, rocks: Mountain, signpost: Signpost, entrance: DoorOpen, path: Route,
  cafe: Coffee, kiosk: IceCream, shop: Store, toilets: Bath, seating: Armchair, food: Utensils,
  thing: Package,
};

/** Toolbox template -> icon. Every template in TOOLBOX appears here. */
const BY_TEMPLATE: Record<string, IconKey> = {
  // Big cats
  lion: 'cat', tiger: 'cat', leopard: 'cat', cheetah: 'cat',
  // Canids
  wolf: 'dog', fox: 'dog',
  // Birds, including the ones that swim
  eagle: 'bird', parrot: 'bird', owl: 'bird', toucan: 'bird', peacock: 'bird', ostrich: 'bird',
  emu: 'bird', penguins: 'bird', flamingo: 'bird',
  // Water
  reef: 'fish', seal: 'fish', otter: 'fish',
  // Small mammals
  meerkat: 'squirrel',
  // Everything else on four legs
  elephant: 'paw', giraffe: 'paw', zebra: 'paw', rhino: 'paw', hippo: 'paw', buffalo: 'paw',
  antelope: 'paw', camel: 'paw', bear: 'paw', panda: 'paw', gorilla: 'paw', monkey: 'paw',
  kangaroo: 'paw',
  // Facilities
  cafe: 'cafe', kiosk: 'kiosk', shop: 'shop', toilets: 'toilets', stall: 'food',
  // Flora, water and wayfinding
  tree: 'tree', bush: 'shrub', hedge: 'shrub', flowers: 'flower', fountain: 'fountain',
  pond: 'pond', river: 'river', bridge: 'bridge', rocks: 'rocks', signpost: 'signpost',
  entrance: 'entrance',
};

/** Words in a PBI's name that give it away when it has no template (a hand-written item). */
const BY_WORD: [RegExp, IconKey][] = [
  [/lion|tiger|leopard|cheetah|panther|lynx|puma|jaguar/i, 'cat'],
  [/wolf|wolves|fox|dog|dingo|jackal/i, 'dog'],
  [/bird|aviary|eagle|owl|parrot|penguin|flamingo|toucan|peacock|ostrich|emu|hawk|falcon/i, 'bird'],
  [/fish|reef|aquarium|shark|seal|otter|dolphin|\bray\b|turtle/i, 'fish'],
  [/meerkat|squirrel|mongoose|prairie/i, 'squirrel'],
  [/toilet|washroom|restroom|baby chang/i, 'toilets'],
  [/cafe|café|restaurant|coffee/i, 'cafe'],
  [/kiosk|ice cream|snack/i, 'kiosk'],
  [/shop|store|gift|retail/i, 'shop'],
  // Word boundaries matter here: "Seating Area" contains "eat", and a bench is not a restaurant.
  [/seat|bench|rest area|shelter/i, 'seating'],
  [/picnic|\bfood\b|\beat\b|dining|canteen/i, 'food'],
  [/sign|wayfind|map/i, 'signpost'],
  [/bridge|crossing/i, 'bridge'],
  [/river|stream|lake|water/i, 'river'],
  [/pond|pool/i, 'pond'],
  [/fountain/i, 'fountain'],
  [/rock|boulder|cliff|hill/i, 'rocks'],
  [/tree|wood|copse/i, 'tree'],
  [/bush|hedge|shrub/i, 'shrub'],
  [/flower|border|planter/i, 'flower'],
  [/entrance|gate|arrival/i, 'entrance'],
];

/** Category -> icon, the last resort: an enclosure is a fence, an animal a paw print. */
const BY_CATEGORY: Record<string, IconKey> = {
  epic: 'epic', enclosure: 'fence', exhibit: 'paw', amenity: 'shop', flora: 'tree', path: 'path',
};

type IconItem = { name?: string; category?: string; template?: string; services?: 'food' | 'toilet' | 'rest' };

/** Which icon an item gets: from its template, then its name, then its category. */
export function iconKey(item: IconItem): IconKey {
  if (item.template && BY_TEMPLATE[item.template]) {
    // 'stall' covers both the Picnic Area and the Seating, so the name settles which.
    if (item.template === 'stall' && /seat|bench/i.test(item.name ?? '')) return 'seating';
    return BY_TEMPLATE[item.template];
  }
  // For these the category IS what the item is, and the name would mislead: a "Tiger Enclosure" is a
  // habitat, not a tiger, and telling the two apart in the Backlog is the whole point.
  if (item.category === 'epic' || item.category === 'enclosure' || item.category === 'path') return BY_CATEGORY[item.category];
  const name = item.name ?? '';
  for (const [re, key] of BY_WORD) if (re.test(name)) return key;
  if (item.category === 'amenity') {
    if (item.services === 'toilet') return 'toilets';
    if (item.services === 'rest') return 'seating';
    if (item.services === 'food') return 'food';
  }
  return BY_CATEGORY[item.category ?? ''] ?? 'thing';
}
