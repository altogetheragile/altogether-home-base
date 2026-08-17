import type { BacklogItem, ZooGameState, EpicMember } from './types';
import type { ZooItem } from './simulation/types';
import { DEFAULT_CONFIG } from './simulation/config';
import { jitterItems, driftAttendance } from './simulation/simulate';
import { amenityAcceptance, enclosureAcceptance, exhibitAcceptance, floraAcceptance, pathAcceptance } from './design';

/** First-Sprint capacity guess, before there is velocity. A deliberate over-guess: you
 *  cannot know velocity yet, so this is a starting point you learn away from by doing. */
export const STARTER_CAPACITY = 22;
/** How many recent Sprints the velocity average looks back over (a rolling window, so an
 *  unusual early Sprint stops skewing the forecast forever). */
export const VELOCITY_WINDOW = 3;

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
/** Planning refinement INTO a Sprint (topic three) costs this much of every day of it. The Guide
 *  does not budget refinement; the game does, because a team that never feels the trade-off learns
 *  that refinement is free. */
export const PLANNED_REFINE_SECONDS = 10;
/** Chance an impediment surfaces on any given day (deterministic per game/Sprint/day). */
export const IMPEDIMENT_CHANCE = 0.55;
/** A held Daily Scrum takes a little of the next day (the event is timeboxed). */
export const DAILY_SCRUM_MULT = 0.9;
/** The Daily Scrum's timebox, in seconds - a playable stand-in for the real 15-minute box.
 *  Long enough to inspect the burndown and decide, short enough to feel timeboxed. On expiry
 *  the event auto-resolves to the disciplined default (re-plan / adapt). Paused in learn mode. */
export const DAILY_SCRUM_SECONDS = 20;
/** A skipped Daily Scrum with a waiting impediment costs much more of the next day:
 *  the problem grew overnight. */
export const SKIP_PENALTY_MULT = 0.55;
/** The coaching tip shown when a skipped Daily Scrum lets an impediment through. */
export const MISSED_SCRUM_TIP =
  'A Daily Scrum yesterday would have surfaced this a day earlier, while it was still small - the sync is where blockers become visible, so they can be removed before they grow. The Scrum Master makes sure it happens.';

/** The product-wide Definition of Done: the bar every item clears to be shippable. */
// The Definition of Done reads top-to-bottom as the workflow every item follows to be Done:
// build it to its acceptance criteria, review it, get the PO's sign-off (all in Doing), then
// place & open it (Deploy). It is the team's standing bar, editable and refined at the Retro.
/** The team's own agreement about when a Backlog item is ready to be forecast into a Sprint. Scrum
 *  does not require one - it is a working agreement, not a gate handed down - so it is theirs to
 *  edit. The game only holds them to the parts it can see: sized, small enough (not still an epic),
 *  and with acceptance criteria. See `notReady`. */
export const DEFAULT_DOR: string[] = [
  'Small enough to build in one Sprint',
  'Sized by the Developers',
  'Acceptance criteria agreed',
  'Understood well enough to start',
];

export const DEFAULT_DOD: string[] = [
  'Meets its acceptance criteria',
  'Peer-reviewed by another Developer',
  'Approved by the PO',
  'Placed and opened',
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
  // Big Cats is where you start, so it arrives as one ready enclosure and its animal - enough to
  // build something in Sprint 1 - with the rest of the zone still an epic to be refined. Every
  // other area is an epic too: refining them into buildable pieces is the work.
  enc('lion-enc', 'Lion Enclosure', 'Big Cats', 5, 'large'),
  ex('lion', 'Lion', 'Big Cats', 8, [8, 7, 6], 'lion-enc'),
  epic('bigcats', 'Big Cats', 'Big Cats', [
    m('tiger', 'Tiger', 'tiger-enc', [8, 7, 6], 'large', 8, 'Tiger Enclosure'),
    m('leopard', 'Leopard', 'leopard-enc', [7, 8, 5], 'medium', 8, 'Leopard Enclosure'),
    ma('kiosk', 'Kiosk', 'food', 5),
  ]),
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
  // Park grounds: the scenery and wayfinding that make the place a park - paths to walk, water to
  // cross, and greenery. Small pieces, ready to build alongside the exhibits.
  pth('paths', 'Pathways', 'Grounds', 3),
  flr('trees', 'Trees', 'Grounds', 'tree', 2),
  flr('flowerbed', 'Flowerbed', 'Grounds', 'flowers', 2),
  flr('rocks', 'Rockery', 'Grounds', 'rocks', 2),
  flr('river', 'River', 'Grounds', 'river', 3),
  flr('bridge', 'Bridge', 'Grounds', 'bridge', 3),
  flr('signposts', 'Signposts', 'Grounds', 'signpost', 2),
  flr('fountain', 'Fountain', 'Grounds', 'fountain', 3),
  // Facilities: a day out needs somewhere to eat, somewhere to go and somewhere to sit. These are
  // their own PBIs rather than something buried inside an animal epic.
  am('main-wc', 'Toilets', 'Facilities', 3, 'toilet'),
  am('gift-shop', 'Gift Shop', 'Facilities', 5, 'food'),
  am('benches', 'Seating Area', 'Facilities', 3, 'rest'),
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
    acceptance: exhibitAcceptance(name),
    status: 'backlog', sprintNumber: null, accessible: true,
    appeal: { families: appeal[0], enthusiasts: appeal[1], comfortSeekers: appeal[2] }, capacity: 320,
  };
}

/** An enclosure (habitat) - infrastructure built first, then populated with animals. Its
 *  `enclosureSize` footprint (chosen in the studio) sizes the habitat in the park. */
function enc(id: string, name: string, zone: string, size: number, footprint: 'small' | 'medium' | 'large', unsized = false): BacklogItem {
  return {
    id, name, category: 'enclosure', zone, enclosureSize: footprint, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: enclosureAcceptance(),
    status: 'backlog', sprintNumber: null, accessible: true,
  };
}

/** A piece of scenery (flora/landscape). `type` is its template (tree, river, rocks, bridge...),
 *  which the studio starts the design from and which fixes its fitting acceptance criteria. */
function flr(id: string, name: string, zone: string, type: string, size: number, unsized = false): BacklogItem {
  return {
    id, name, category: 'flora', zone, template: type, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: floraAcceptance(type),
    status: 'backlog', sprintNumber: null, accessible: true,
  };
}

/** A pathway PBI - designed as a width + colour, then routed on the park at deployment. */
function pth(id: string, name: string, zone: string, size: number, unsized = false): BacklogItem {
  return {
    id, name, category: 'path', zone, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: pathAcceptance(),
    status: 'backlog', sprintNumber: null, accessible: true,
  };
}

function am(id: string, name: string, zone: string, size: number, services: 'food' | 'toilet' | 'rest', unsized = false): BacklogItem {
  return {
    id, name, category: 'amenity', zone, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: amenityAcceptance(name, services),
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
    team: {
      productOwner: { id: 'po', name: 'Priya (PO)' },
      scrumMaster: { id: 'sm', name: 'Sam (SM)' },
      developers: [
        { id: 'dev1', name: 'Ada' },
        { id: 'dev2', name: 'Ben' },
        { id: 'dev3', name: 'Cara' },
      ],
    },
    productGoal: PRODUCT_GOAL,
    sprintGoal: '',
    sprintGoalMet: null,
    definitionOfDone: [...DEFAULT_DOD],
    definitionOfReady: [...DEFAULT_DOR],
    happiness: [],
    sprintsCancelled: 0,
    teaching: true,
    taught: [],
    useUserStories: false,
    backlog,
    zones: ['Big Cats', 'Waterside', 'Savanna', 'Forest', 'Grounds'],
    sprintNumber: 1,
    committedIds: [],
    velocity: [],
    sprintForecast: STARTER_CAPACITY,
    burndown: [],
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
    pathRoute: 'none',
    paths: [],
    connectors: [],
  };
}

/** How many points the team can realistically take on: the average of the last few Sprints'
 *  actual delivered velocity (a rolling window), or the first-Sprint guess before any exists. */
export function zooCapacity(velocity: number[]): number {
  if (!velocity.length) return STARTER_CAPACITY;
  const recent = velocity.slice(-VELOCITY_WINDOW);
  return Math.round(recent.reduce((s, v) => s + v, 0) / recent.length);
}
