import type { BacklogItem, ZooGameState } from './types';
import type { ZooItem } from './simulation/types';
import { DEFAULT_CONFIG } from './simulation/config';
import { jitterItems, driftAttendance } from './simulation/simulate';

/** First-Sprint capacity guess, before there is velocity. */
export const STARTER_CAPACITY = 16;

/** The product-wide Definition of Done: the bar every item clears to be shippable. */
export const DEFAULT_DOD: string[] = [
  'Meets its acceptance criteria',
  'Fits its zone theme',
  'No unfinished patches',
  'Safe and accessible',
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
];

function ex(id: string, name: string, zone: string, estimate: number, appeal: [number, number, number]): BacklogItem {
  return {
    id, name, category: 'exhibit', zone, estimate,
    acceptance: ['Recognisable as a ' + name.toLowerCase(), 'Uses at least two colours', 'No bare patches'],
    status: 'backlog', sprintNumber: null, accessible: true,
    appeal: { families: appeal[0], enthusiasts: appeal[1], comfortSeekers: appeal[2] }, capacity: 320,
  };
}

function am(id: string, name: string, zone: string, estimate: number, services: 'food' | 'toilet' | 'rest'): BacklogItem {
  return {
    id, name, category: 'amenity', zone, estimate,
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
    definitionOfDone: [...DEFAULT_DOD],
    backlog,
    zones: ['Big Cats', 'Waterside'],
    sprintNumber: 1,
    committedIds: [],
    velocity: [],
    attendance: driftAttendance(DEFAULT_CONFIG, gameSeed),
    lastReview: null,
    signals: [],
    signalAge: {},
    improvements: [],
    gameSeed,
  };
}

/** How many points the team can realistically take on: average velocity once it
 *  exists, otherwise the first-Sprint guess. */
export function zooCapacity(velocity: number[]): number {
  if (!velocity.length) return STARTER_CAPACITY;
  return Math.round(velocity.reduce((s, v) => s + v, 0) / velocity.length);
}
