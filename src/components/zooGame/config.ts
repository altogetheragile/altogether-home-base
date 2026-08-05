import type { BacklogItem, ZooGameState, EpicMember } from './types';
import type { ZooItem } from './simulation/types';
import { DEFAULT_CONFIG } from './simulation/config';
import { jitterItems, driftAttendance } from './simulation/simulate';

/** First-Sprint capacity guess, before there is velocity. */
export const STARTER_CAPACITY = 16;

/** How many items may be in Doing at once (a WIP limit). Limiting work-in-progress
 *  helps the team finish things rather than start many; the "finish fewer" improvement
 *  tightens it. */
export const DEFAULT_WIP_LIMIT = 3;

// ---- Timed days and the Daily Scrum ----
/** How many timed days each Sprint runs (the default cadence). */
export const SPRINT_DAYS = 3;
/** Sprint-length choices: fewer days = faster feedback but more event overhead per unit
 *  of build time; more days = more build time but slower feedback. */
export const SPRINT_LENGTH_OPTIONS = [2, 3, 5];
/** Seconds of build time in a full day (before any Daily Scrum / impediment cost). */
export const DAY_SECONDS = 90;

/** Refining the Backlog DURING a Sprint takes time from building (ongoing refinement is
 *  real work with a cost). Each action spends this many seconds of the current day. In the
 *  Refinement/Planning phases it is free - that is the dedicated time to refine. */
export const REFINE_COSTS = { estimate: 8, split: 12, addPbi: 6, refinePbi: 5 } as const;
/** Chance an impediment surfaces on any given day (deterministic per game/Sprint/day). */
export const IMPEDIMENT_CHANCE = 0.55;
/** A held Daily Scrum takes a little of the next day (the event is timeboxed). */
export const DAILY_SCRUM_MULT = 0.9;
/** A skipped Daily Scrum with a waiting impediment costs much more of the next day:
 *  the problem grew overnight. */
export const SKIP_PENALTY_MULT = 0.55;
/** The coaching tip shown when a skipped Daily Scrum lets an impediment through. */
export const MISSED_SCRUM_TIP =
  'A Daily Scrum yesterday would have surfaced this a day earlier, while it was still small - the sync is where blockers become visible, so they can be removed before they grow. The Scrum Master makes sure it happens.';

/** The product-wide Definition of Done: the bar every item clears to be shippable. */
export const DEFAULT_DOD: string[] = [
  'Meets its acceptance criteria',
  'Fully finished - every part built, no gaps',
  'Safe and accessible to all visitors',
  'Signposted so visitors can find it',
  'Peer-reviewed by another Developer',
  'Nothing already open is broken by it',
];

/** Coached suggestions for the Definition of Done: general, product-wide criteria the
 *  team can add, grouped by the kind of quality bar each one sets. The DoD is the same
 *  bar for every item (unlike per-item acceptance criteria), so these read generally. */
export const DOD_LIBRARY: { group: string; items: string[] }[] = [
  { group: 'Complete', items: ['Meets its acceptance criteria', 'Fully finished - every part built, no gaps', 'Cleaned up - no leftover materials or hazards'] },
  { group: 'Quality', items: ['Peer-reviewed by another Developer', 'No known defects', 'On-brand and fits the park look'] },
  { group: 'Safe & usable', items: ['Safe and accessible to all visitors', 'Signposted so visitors can find it', 'Enclosures secure and escape-proof'] },
  { group: 'No regressions', items: ['Nothing already open is broken by it', 'Amenities still cope with the extra visitors'] },
];

export const PRODUCT_GOAL = 'Open a zoo that visitors love and come back to.';

/** The starting Product Backlog: rough and partial on purpose. It grows and changes
 *  from play (signals add to it). Appeal is the base value before per-game taste
 *  jitter. */
// The Backlog mixes granularity on purpose. Big Cats is already REFINED - split into a
// per-species enclosure + animal (lions and tigers don't share a pen) plus a kiosk. The
// other areas arrive as EPICS: a single themed PBI that is too big to build and must be
// refined by splitting it into its animals (each an enclosure + animal, with the animal
// depending on its enclosure) and facilities. Every species has its own enclosure.
const STARTING_BACKLOG: BacklogItem[] = [
  enc('lion-enc', 'Lion Enclosure', 'Big Cats', 5, 'large'),
  ex('lion', 'Lion', 'Big Cats', 8, [8, 7, 6], 'lion-enc'),
  enc('tiger-enc', 'Tiger Enclosure', 'Big Cats', 5, 'large'),
  ex('tiger', 'Tiger', 'Big Cats', 8, [8, 7, 6], 'tiger-enc'),
  enc('leopard-enc', 'Leopard Enclosure', 'Big Cats', 5, 'medium'),
  ex('leopard', 'Leopard', 'Big Cats', 8, [7, 8, 5], 'leopard-enc'),
  am('kiosk', 'Kiosk', 'Big Cats', 5, 'food'),
  epic('waterside', 'Waterside', 'Waterside', [
    m('penguins', 'Penguins', 'penguin-enc', [8, 6, 6], 'medium', 8, 'Penguin Habitat'),
    m('reef', 'Reef', 'reef-enc', [6, 8, 5], 'medium', 5, 'Reef Tank'),
    ma('wc', 'Toilets', 'toilet', 3),
  ]),
  epic('savanna', 'Savanna', 'Savanna', [
    m('elephant', 'Elephant', 'elephant-enc', [9, 8, 7], 'large', 10, 'Elephant Reserve'),
    m('giraffe', 'Giraffe', 'giraffe-enc', [8, 8, 6], 'large', 8, 'Giraffe Paddock'),
    m('zebra', 'Zebra', 'zebra-enc', [7, 6, 6], 'medium', 5, 'Zebra Paddock'),
    m('rhino', 'Rhino', 'rhino-enc', [6, 8, 5], 'large', 8, 'Rhino Reserve'),
    ma('cafe', 'Cafe', 'food', 5),
  ]),
  epic('forest', 'Forest', 'Forest', [
    m('bear', 'Bear', 'bear-enc', [8, 7, 6], 'large', 8, 'Bear Habitat'),
    m('monkey', 'Monkey', 'monkey-enc', [8, 6, 6], 'medium', 5, 'Monkey Habitat'),
    ma('picnic', 'Picnic area', 'rest', 3),
  ]),
];

/** An epic member that is an animal (exhibit): splits into its enclosure + the animal.
 *  `habitat` is the bespoke name for the enclosure the split creates. */
function m(id: string, name: string, encId: string, appeal: [number, number, number], footprint: 'small' | 'medium' | 'large', size: number, habitat: string): EpicMember {
  return { id, name, kind: 'exhibit', template: id, appeal, enclosureId: encId, footprint, size, habitat };
}
/** An epic member that is a facility (amenity): splits into one amenity PBI. */
function ma(id: string, name: string, services: 'food' | 'toilet' | 'rest', size: number): EpicMember {
  return { id, name, kind: 'amenity', services, size };
}
/** A themed EPIC to be refined (split) into its members. Arrives unsized - an epic is not
 *  estimated or built directly; it is broken down first. */
function epic(id: string, name: string, zone: string, members: EpicMember[]): BacklogItem {
  return {
    id, name, category: 'epic', zone, estimate: 0, unsized: true, trueSize: 0,
    acceptance: ['Every animal is recognisable and well built', 'Each species has its own secure enclosure', 'Facilities serve the visitors in this area'],
    status: 'backlog', sprintNumber: null, accessible: true, epicMembers: members,
  };
}

/** An exhibit (animal). It lives in the enclosure `enclosureId` and can only be built
 *  once that enclosure is Done. `unsized` items carry their intended size as `trueSize`
 *  and start with estimate 0 until the team estimates them. */
function ex(id: string, name: string, zone: string, size: number, appeal: [number, number, number], enclosureId?: string, unsized = false): BacklogItem {
  return {
    id, name, category: 'exhibit', zone, enclosureId, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: ['Recognisable as a ' + name.toLowerCase(), 'Uses at least two colours', 'No bare patches'],
    status: 'backlog', sprintNumber: null, accessible: true,
    appeal: { families: appeal[0], enthusiasts: appeal[1], comfortSeekers: appeal[2] }, capacity: 320,
  };
}

/** An enclosure (habitat) - infrastructure built first, then populated with animals. Its
 *  `enclosureSize` footprint (chosen in the studio) sizes the habitat in the park. */
function enc(id: string, name: string, zone: string, size: number, footprint: 'small' | 'medium' | 'large', unsized = false): BacklogItem {
  return {
    id, name, category: 'enclosure', zone, enclosureSize: footprint, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: ['Securely fenced and escape-proof', 'Big enough for its animals', 'Ground, shelter and water set up'],
    status: 'backlog', sprintNumber: null, accessible: true,
  };
}

function am(id: string, name: string, zone: string, size: number, services: 'food' | 'toilet' | 'rest', unsized = false): BacklogItem {
  return {
    id, name, category: 'amenity', zone, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: ['Clearly signed', services === 'food' ? 'Serves food and drink' : services === 'toilet' ? 'Has enough cubicles' : 'Enough seating'],
    status: 'backlog', sprintNumber: null, accessible: true, services, serviceCapacity: 500,
  };
}

/** Copy just the fields the simulation reads from a backlog item. */
export function toZooItem(it: BacklogItem): ZooItem {
  return {
    id: it.id, name: it.name, category: it.category, accessible: it.accessible,
    appeal: it.appeal, capacity: it.capacity, services: it.services, serviceCapacity: it.serviceCapacity,
  };
}

/** The starting game state. `gameSeed` fixes the taste jitter and attendance drift
 *  for this game (so within a game learning pays off, but a winning build in one
 *  game is not guaranteed in the next). */
export function initialZooState(gameSeed = 1): ZooGameState {
  // Apply per-game taste jitter to the starting exhibits' appeal.
  const jittered = jitterItems(STARTING_BACKLOG.map(toZooItem), DEFAULT_CONFIG, gameSeed);
  const appealById = new Map(jittered.map((z) => [z.id, z.appeal]));
  const backlog = STARTING_BACKLOG.map((it) => (it.appeal ? { ...it, appeal: appealById.get(it.id) ?? it.appeal } : { ...it }));

  return {
    phase: 'intro',
    productGoal: PRODUCT_GOAL,
    sprintGoal: '',
    sprintGoalMet: null,
    definitionOfDone: [...DEFAULT_DOD],
    useUserStories: false,
    backlog,
    zones: ['Big Cats', 'Waterside', 'Savanna', 'Forest'],
    sprintNumber: 1,
    committedIds: [],
    velocity: [],
    attendance: driftAttendance(DEFAULT_CONFIG, gameSeed),
    lastReview: null,
    signals: [],
    signalAge: {},
    improvements: [],
    gameSeed,
    sprintDays: SPRINT_DAYS,
    dayNumber: 1,
    dayStage: 'building',
    dayTimeMult: 1,
    pendingImpediment: null,
    carriedImpediment: null,
    missedScrums: 0,
    wipLimit: DEFAULT_WIP_LIMIT,
    scrumDiscipline: false,
    learnMode: false,
    dailyScrumAt: 'start',
    refinePenalty: 0,
    pathStyle: 'gravel',
    pathRoute: 'straight',
  };
}

/** How many points the team can realistically take on: average velocity once it
 *  exists, otherwise the first-Sprint guess. */
export function zooCapacity(velocity: number[]): number {
  if (!velocity.length) return STARTER_CAPACITY;
  return Math.round(velocity.reduce((s, v) => s + v, 0) / velocity.length);
}
