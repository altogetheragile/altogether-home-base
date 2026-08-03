import type { BacklogItem, ZooGameState } from './types';
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
const STARTING_BACKLOG: BacklogItem[] = [
  ex('lion', 'Lion', 'Big Cats', 8, [8, 7, 6]),
  ex('tiger', 'Tiger', 'Big Cats', 8, [8, 7, 6]),
  ex('leopard', 'Leopard', 'Big Cats', 8, [7, 8, 5]),
  am('kiosk', 'Kiosk', 'Big Cats', 5, 'food'),
  ex('penguins', 'Penguins', 'Waterside', 8, [8, 6, 6]),
  ex('reef', 'Reef', 'Waterside', 5, [6, 8, 5]),
  am('wc', 'Toilets', 'Waterside', 3, 'toilet'),
  // The newer zones arrive UNSIZED: the team must estimate (refine) them first.
  ex('elephant', 'Elephant', 'Savanna', 10, [9, 8, 7], true),
  ex('giraffe', 'Giraffe', 'Savanna', 8, [8, 8, 6], true),
  ex('zebra', 'Zebra', 'Savanna', 5, [7, 6, 6], true),
  ex('rhino', 'Rhino', 'Savanna', 8, [6, 8, 5], true),
  am('cafe', 'Cafe', 'Savanna', 5, 'food', true),
  ex('bear', 'Bear', 'Forest', 8, [8, 7, 6], true),
  ex('monkey', 'Monkey', 'Forest', 5, [8, 6, 6], true),
  am('picnic', 'Picnic area', 'Forest', 3, 'rest', true),
];

/** An exhibit. `unsized` items carry their intended size as `trueSize` and start
 *  with estimate 0 until the team estimates them. */
function ex(id: string, name: string, zone: string, size: number, appeal: [number, number, number], unsized = false): BacklogItem {
  return {
    id, name, category: 'exhibit', zone, estimate: unsized ? 0 : size, unsized, trueSize: size,
    acceptance: ['Recognisable as a ' + name.toLowerCase(), 'Uses at least two colours', 'No bare patches'],
    status: 'backlog', sprintNumber: null, accessible: true,
    appeal: { families: appeal[0], enthusiasts: appeal[1], comfortSeekers: appeal[2] }, capacity: 320,
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
  };
}

/** How many points the team can realistically take on: average velocity once it
 *  exists, otherwise the first-Sprint guess. */
export function zooCapacity(velocity: number[]): number {
  if (!velocity.length) return STARTER_CAPACITY;
  return Math.round(velocity.reduce((s, v) => s + v, 0) / velocity.length);
}
