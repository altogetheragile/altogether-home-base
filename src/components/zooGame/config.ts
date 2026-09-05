import type { BacklogItem, ZooGameState, EpicMember, ZooBrief } from './types';
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
/** Holding the refinement you planned into the Sprint costs this much of the day it is held on.
 *  The Guide does not budget refinement; the game does, because a team that never feels the
 *  trade-off learns that refinement is free. It used to be docked from every day whether or not
 *  anyone did it, which taught that the cost is a tax rather than work you actually do.
 *  Multiplied by the points the Scrum Team set aside for it. */
export const PLANNED_REFINE_SECONDS = 10;
/** A team that holds its Daily Scrum every day catches a blocker the morning it appears, so one
 *  that does get carried costs them less than it costs a team that was not looking. The event
 *  itself still costs its timebox - it always does, and rewarding a team by making their own event
 *  free taught the opposite of what the event is for. */
export const CAUGHT_EARLY_MULT = 0.8;
/** What a point of planned refinement is worth in the forecast, so it competes with building. */
export const REFINE_POINT_OPTIONS = [0, 1, 2, 3] as const;
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

// Note where this stops. "Done" is the state an item has to reach before it COULD go live: built,
// accepted, standing where it will stand. Whether it does go live, and when, is the Product Owner's
// decision and a separate act - which is the whole of the Guide's "the Sprint Review should never be
// considered a gate to releasing value".
//
// The last line used to read "Placed and opened", which made the DoD contradict every other rule in
// the game: velocity and the Sprint Goal count work that is Done, visitors only ever see work that
// is open, and the coach says "anything Done can go live now" - all of which need Done and released
// to be different states. A DoD that claims an item is open before anybody opened it also quietly
// removes the decision this game exists to teach.
export const DEFAULT_DOD: string[] = [
  'Meets its acceptance criteria',
  'Peer-reviewed by another Developer',
  'Approved by the PO',
  'Placed on the park, ready to open',
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
/** Every area the zoo could have, with the animals and the facility that belong to it. Scenery is
 *  NOT listed here - every zone gets the same two scenery items, because every zone needs paths to
 *  walk and something growing, and saying so once is better than saying it four times. */
export const ZOO_AREAS: { zone: string; members: EpicMember[] }[] = [
  { zone: 'Big Cats', members: [
    m('tiger', 'Tiger', 'tiger-enc', [8, 7, 6], 'large', 8, 'Tiger Enclosure'),
    m('leopard', 'Leopard', 'leopard-enc', [7, 8, 5], 'medium', 8, 'Leopard Enclosure'),
    ma('kiosk', 'Kiosk', 'food', 5),
  ] },
  { zone: 'Waterside', members: [
    m('penguins', 'Penguins', 'penguin-enc', [8, 6, 6], 'medium', 8, 'Penguin Habitat'),
    m('reef', 'Reef', 'reef-enc', [6, 8, 5], 'medium', 5, 'Reef Tank'),
    ma('wc', 'Toilets', 'toilet', 3),
  ] },
  { zone: 'Savanna', members: [
    m('elephant', 'Elephant', 'elephant-enc', [9, 8, 7], 'large', 10, 'Elephant Reserve'),
    m('giraffe', 'Giraffe', 'giraffe-enc', [8, 8, 6], 'large', 8, 'Giraffe Paddock'),
    m('zebra', 'Zebra', 'zebra-enc', [7, 6, 6], 'medium', 5, 'Zebra Paddock'),
    m('rhino', 'Rhino', 'rhino-enc', [6, 8, 5], 'large', 8, 'Rhino Reserve'),
    ma('cafe', 'Cafe', 'food', 5),
  ] },
  { zone: 'Forest', members: [
    m('bear', 'Bear', 'bear-enc', [8, 7, 6], 'large', 8, 'Bear Habitat'),
    m('monkey', 'Monkey', 'monkey-enc', [8, 6, 6], 'medium', 5, 'Monkey Habitat'),
    ma('picnic', 'Picnic area', 'rest', 3),
  ] },
];

/** The animal that opens a zone: its habitat and the animal itself, ready to build. Whichever zone
 *  the Scrum Team opens first arrives like this rather than as an epic. */
const FLAGSHIP: Record<string, { id: string; name: string; appeal: [number, number, number]; size: number; footprint: 'small' | 'medium' | 'large' }> = {
  'Big Cats': { id: 'lion', name: 'Lion', appeal: [8, 7, 6], size: 8, footprint: 'large' },
  Waterside: { id: 'penguins', name: 'Penguins', appeal: [8, 6, 6], size: 8, footprint: 'medium' },
  Savanna: { id: 'giraffe', name: 'Giraffe', appeal: [8, 8, 6], size: 8, footprint: 'large' },
  Forest: { id: 'monkey', name: 'Monkey', appeal: [8, 6, 6], size: 5, footprint: 'medium' },
};

/** Stable ids per area, so a saved game and the ids the rest of the game knows survive. */
const ZONE_ID: Record<string, string> = { 'Big Cats': 'bigcats', Waterside: 'waterside', Savanna: 'savanna', Forest: 'forest' };
const slug = (zone: string) => ZONE_ID[zone] ?? zone.toLowerCase().replace(/[^a-z]+/g, '-');

/** A zone's own paths and planting, as epic members. Every area needs them, and they belong to the
 *  area: you lay the Big Cats paths when you open Big Cats, not in some park-wide tidy-up later.
 *  That is what makes an area a slice you can actually deliver. */
function sceneryFor(zone: string): EpicMember[] {
  return [
    { id: `${slug(zone)}-paths`, name: `${zone} Paths`, kind: 'path', size: 3 },
    { id: `${slug(zone)}-planting`, name: `${zone} Planting`, kind: 'flora', flora: 'tree', size: 2 },
  ];
}

/** Write a Product Backlog for the brief. Rough and partial on purpose: it grows and changes from
 *  play, because signals from the Sprint Review add to it.
 *
 *  Granularity is mixed deliberately. The area the Scrum Team opens first arrives REFINED - its
 *  habitat, its animal, its paths and its planting, all ready - which is enough to deliver a whole
 *  slice of zoo in Sprint 1. Every other area arrives as an EPIC: one themed item too big to build,
 *  which has to be split into the pieces that open it. */
export function starterBacklog(brief: ZooBrief = DEFAULT_BRIEF): BacklogItem[] {
  const zones = ZOO_AREAS.filter((a) => brief.zones.includes(a.zone));
  const first = zones.find((a) => a.zone === brief.firstZone) ?? zones[0];
  const items: BacklogItem[] = [];

  if (first) {
    // The opening area, already refined: a habitat, its animal, and the ground around them.
    const flag = FLAGSHIP[first.zone] ?? FLAGSHIP['Big Cats'];
    items.push(enc(`${flag.id}-enc`, `${flag.name} Enclosure`, first.zone, 5, flag.footprint));
    items.push(ex(flag.id, flag.name, first.zone, flag.size, flag.appeal, `${flag.id}-enc`));
    items.push(pth(`${slug(first.zone)}-paths`, `${first.zone} Paths`, first.zone, 3));
    items.push(flr(`${slug(first.zone)}-planting`, `${first.zone} Planting`, first.zone, 'tree', 2));
    // What is left of the opening area is still an epic - opening it is not finishing it.
    const rest = first.members.filter((mem) => mem.id !== flag.id);
    if (rest.length) items.push(epic(slug(first.zone), first.zone, first.zone, rest));
  }

  for (const area of zones) {
    if (area === first) continue;
    items.push(epic(slug(area.zone), area.zone, area.zone, [...area.members, ...sceneryFor(area.zone)]));
  }

  // The park's own fabric: the spine everyone walks, the water that crosses it, and the greenery
  // that is nobody's zone in particular. Small pieces, ready alongside the exhibits.
  items.push(
    pth('paths', 'Main Pathways', 'Grounds', 3),
    flr('river', 'River', 'Grounds', 'river', 3),
    flr('bridge', 'Bridge', 'Grounds', 'bridge', 3),
    flr('signposts', 'Signposts', 'Grounds', 'signpost', 2),
    flr('fountain', 'Fountain', 'Grounds', 'fountain', 3),
    flr('rocks', 'Rockery', 'Grounds', 'rocks', 2),
    flr('trees', 'Trees', 'Grounds', 'tree', 2),
    flr('flowerbed', 'Flowerbed', 'Grounds', 'flowers', 2),
  );

  // Facilities: a day out needs somewhere to eat, somewhere to go and somewhere to sit. Their own
  // PBIs rather than something buried inside an animal epic. The audience decides which comes first.
  const facilities = [
    am('main-wc', 'Toilets', 'Facilities', 3, 'toilet'),
    am('gift-shop', 'Gift Shop', 'Facilities', 5, 'food'),
    am('benches', 'Seating Area', 'Facilities', 3, 'rest'),
  ];
  const wanted = brief.audience === 'families' ? 'food' : brief.audience === 'comfortSeekers' ? 'rest' : 'toilet';
  items.push(...facilities.sort((a, b) => Number(b.services === wanted) - Number(a.services === wanted)));
  return items;
}

/** The brief the game assumes when nobody has answered the wizard - the zoo as it has always been. */
export const DEFAULT_BRIEF: ZooBrief = { zones: ZOO_AREAS.map((a) => a.zone), audience: 'families', firstZone: 'Big Cats' };

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
    // Questions, like every other criterion - see ACCEPTANCE_FORM in design.ts. An epic's are about
    // the zone as a whole, which is the only thing an epic ever delivers.
    acceptance: ['Can I tell what every animal here is?', 'Can I see each species in a habitat of its own?', 'Can I eat, rest and find my way in this part of the park?'],
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
  const seed = starterBacklog();
  const jittered = jitterItems(seed.map(toZooItem), DEFAULT_CONFIG, gameSeed);
  const appealById = new Map(jittered.map((z) => [z.id, z.appeal]));
  const backlog = seed.map((it) => (it.appeal ? { ...it, appeal: appealById.get(it.id) ?? it.appeal } : { ...it }));

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
    sprintGoalAgreed: [],
    forecast: [],
    refinePenalty: 0,
    daySecondsLeft: DAY_SECONDS,
    scrumSecondsLeft: DAILY_SCRUM_SECONDS,
    pathStyle: 'gravel',
    pathRoute: 'none',
    paths: [],
    connectors: [],
  };
}

/** How many points the team can realistically take on: the average of the last few Sprints'
 *  actual delivered velocity (a rolling window), or the first-Sprint guess before any exists. */
export function zooCapacity(velocity: number[], sprintDays: number = SPRINT_DAYS): number {
  // Nothing measured yet: an estimate, scaled to the length of Sprint the team chose. A 2-day and
  // a 5-day Sprint forecasting the same number would be a poor first lesson.
  if (!velocity.length) return estimatedVelocity(sprintDays);
  const recent = velocity.slice(-VELOCITY_WINDOW);
  return Math.round(recent.reduce((s, v) => s + v, 0) / recent.length);
}

/** The starting guess, before a single Sprint has been measured. Deliberately a rate per day
 *  rather than a fixed number, because the only thing we know is how long the Sprint is. It is
 *  never called velocity in the UI - velocity is measured, and this has measured nothing. */
export const estimatedVelocity = (sprintDays: number): number =>
  Math.max(1, Math.round(sprintDays * (STARTER_CAPACITY / SPRINT_DAYS)));
