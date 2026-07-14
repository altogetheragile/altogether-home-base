import type { Criterion, Story, ScrumState, Developer, Impediment } from './types';

/** The Sprint is the container event: Sprint Planning, the Daily Scrums, the
 *  Sprint Review and the Retrospective all happen INSIDE the timebox, so a
 *  two-week Sprint's 10 working days are not all development. Using the Scrum
 *  Guide timeboxes (Planning 4h, Review 2h, Retro 1.5h for two weeks, plus the
 *  Daily Scrums) the events take about a tenth of the Sprint - so development
 *  days come out at roughly 0.9 of the working days. */
export const DEV_DAY_RATIO = 0.9;

/** Selectable Sprint lengths. `workingDays` is the calendar container; `devDays`
 *  is what's left for development once the events take their share (0.9x). */
export const SPRINT_LENGTH_OPTIONS: { label: string; workingDays: number; devDays: number }[] = [
  { label: '1 week', workingDays: 5, devDays: 4.5 },
  { label: '2 weeks', workingDays: 10, devDays: 9 },
  { label: '4 weeks', workingDays: 20, devDays: 18 },
];

/** Default development days: a two-week Sprint (10 working days, 9 for dev). */
export const SPRINT_LENGTH = 9;

/** Rough points one Developer delivers per development day - used only for the
 *  FIRST Sprint's capacity guess (before there's velocity), scaled by team size
 *  and the Sprint's development days. Tuned (see scrum.balance.test.ts) so a
 *  right-sized, well-swarmed Sprint meets its Goal and an over-commitment misses. */
export const CAPACITY_PER_DEV_DAY = 1.2;

/** Average of past Sprint velocities (0 if none yet). */
export const averageVelocity = (velocity: number[]): number =>
  velocity.length ? Math.round(velocity.reduce((n, v) => n + v, 0) / velocity.length) : 0;

/** How many points the team can realistically take on: past velocity once it
 *  exists, otherwise a first-Sprint guess scaled to the team size and the Sprint's
 *  development days (a bigger team or a longer timebox can forecast more). */
export const sprintCapacity = (velocity: number[], teamSize: number, devDays: number): number =>
  velocity.length ? averageVelocity(velocity) : Math.round(teamSize * devDays * CAPACITY_PER_DEV_DAY);

/** The Product Goal - the north star the Product Backlog is ordered toward. */
export const PRODUCT_GOAL = 'Launch a booking experience customers love and trust.';

/** Share of the product's value that, once delivered, lets the Product Owner call
 *  the Product Goal achieved and wrap up - the Goal is an outcome, not "empty the
 *  Backlog", so the last low-value items needn't ship to be done. */
export const PRODUCT_GOAL_THRESHOLD = 0.8;

/** A domain-neutral default Definition of Done (the Increment's commitment).
 *  Editable by the team, like the Flow game's exit criteria. */
export function defaultDefinitionOfDone(): Criterion[] {
  return [
    { id: 'dod-reviewed', label: 'Reviewed by someone else' },
    { id: 'dod-accepted', label: 'Meets its acceptance criteria' },
    { id: 'dod-releasable', label: 'Releasable - nothing left to finish' },
  ];
}

/** Build a Definition of Done criterion with a stable id. */
export function makeCriterion(id: string, label: string): Criterion {
  return { id, label: label.trim() };
}

/** A Definition of Done should be a short, meaningful list, not a checklist sprawl. */
export const MIN_DOD = 1;
export const MAX_DOD = 6;

/** Domain-neutral criteria the team can quick-add when refining the Definition of
 *  Done, kept free of software jargon so the sim stays general. */
export const SUGGESTED_DOD: string[] = [
  'Tested against its acceptance criteria',
  'No known defects left open',
  'Documented enough for others to use',
  'Signed off by the Product Owner',
  'Nothing left to hand off or finish later',
];

/** A starting Product Backlog, ordered by value. Story points vary so planning
 *  is a real forecasting decision. Deterministic (fixed list, not RNG). */
export const PRODUCT_BACKLOG: Omit<Story, 'status' | 'sprintNumber' | 'effortRemaining'>[] = [
  { id: 's1', title: 'Browse available slots', points: 13, value: 8 },
  { id: 's2', title: 'Book a slot', points: 21, value: 10 },
  { id: 's3', title: 'Confirmation email', points: 8, value: 6 },
  { id: 's4', title: 'Reschedule a booking', points: 21, value: 7 },
  { id: 's5', title: 'Cancel a booking', points: 8, value: 5 },
  { id: 's6', title: 'Reminders before the slot', points: 13, value: 6 },
  { id: 's7', title: 'Pay for a booking', points: 21, value: 9 },
  { id: 's8', title: 'Manage my bookings', points: 21, value: 6 },
  { id: 's9', title: 'Waitlist for a full slot', points: 13, value: 4 },
  { id: 's10', title: 'Accessibility pass', points: 13, value: 7 },
  { id: 's11', title: 'Admin: view all bookings', points: 21, value: 5 },
  { id: 's12', title: 'Analytics dashboard', points: 21, value: 3 },
];

/** Build a Developer, deriving a short, readable badge from the name. Two-letter
 *  initials keep a bigger roster distinct (Robin vs Riley), unlike single letters. */
export function makeDeveloper(id: string, name: string): Developer {
  const clean = name.trim() || 'Dev';
  const initials = clean.slice(0, 2).toUpperCase();
  return { id, name: clean, initials };
}

/** The default Scrum Team - five cross-functional Developers. Big enough that
 *  swarming vs spreading is a real choice, small enough to stay legible. */
export const DEFAULT_TEAM: Developer[] = ['Robin', 'Riley', 'Jamie', 'Sam', 'Alex'].map((n, i) =>
  makeDeveloper(`d${i + 1}`, n),
);

/** Roster bounds - a Scrum Team of Developers is typically small. */
export const MIN_TEAM = 3;
export const MAX_TEAM = 7;

/** The starting game state: all stories in the Product Backlog, no Sprints yet. */
export function initialScrumState(): ScrumState {
  return {
    phase: 'intro',
    productGoal: PRODUCT_GOAL,
    definitionOfDone: defaultDefinitionOfDone(),
    productBacklog: PRODUCT_BACKLOG.map((s) => ({ ...s, status: 'backlog', sprintNumber: null, effortRemaining: s.points })),
    team: DEFAULT_TEAM.map((d) => ({ ...d })),
    scrumMaster: SCRUM_MASTER,
    productOwner: PRODUCT_OWNER,
    assignments: {},
    currentImpediment: null,
    changeRequest: null,
    lastDay: null,
    sprints: [],
    currentSprint: null,
    velocity: [],
    improvements: [],
    sprintLength: SPRINT_LENGTH,
  };
}

/** The improvement actions offered at a Retrospective. Picking one carries into
 *  the next Sprint and nudges the team's effectiveness up (kaizen compounds). */
export const RETRO_IMPROVEMENTS = [
  'Limit work in progress - swarm on fewer stories at once',
  'Forecast against velocity, not hope - commit to less',
  'Tighten the Definition of Done - fewer surprises late',
  'Pair up on the hardest work to move it faster',
];

/** Extra daily capacity from accumulated improvements, capped so it stays modest. */
export const improvementBonus = (improvements: string[]): number => Math.min(2, improvements.length);

/** Total points and value remaining in the backlog - a quick read on scope. */
export const totalPoints = (stories: Story[]): number => stories.reduce((n, s) => n + s.points, 0);
export const totalValue = (stories: Story[]): number => stories.reduce((n, s) => n + s.value, 0);

/** Seed for the Sprint's deterministic dice, so a Sprint plays out reproducibly. */
export const SPRINT_SEED = 0x5bd1e995;

/** The Scrum Master - a single, named accountability. Not a Developer: they do no
 *  story work, but each day they can clear the team's impediment so the
 *  Developers stay focused. */
export const SCRUM_MASTER = 'Morgan';

/** The Product Owner - orders the Product Backlog, accepts work against the
 *  Definition of Done at the Review, and raises change requests mid-Sprint. */
export const PRODUCT_OWNER = 'Priya';

/** Chance the Product Owner raises a change request during a Sprint. */
export const CHANGE_REQUEST_CHANCE = 0.5;

/** Emergent needs the Product Owner might raise mid-Sprint. Higher value than
 *  most backlog items (that's why they feel urgent), so declining to protect the
 *  Sprint Goal is a real tradeoff. */
export const CHANGE_REQUESTS: { title: string; detail: string; points: number; value: number }[] = [
  { title: 'A partner wants a co-branded booking link', detail: 'A time-boxed opportunity the PO would love this Sprint.', points: 8, value: 12 },
  { title: 'Regulator asks for a consent notice', detail: 'A compliance need that has just landed.', points: 5, value: 11 },
  { title: 'A VIP client needs group bookings', detail: 'A high-value account is asking for it now.', points: 13, value: 13 },
];

/** Chance, per Sprint day, that an impediment shows up at the Daily Scrum. */
export const IMPEDIMENT_CHANCE = 0.4;

/** How a live impediment scales the day's effort if the Scrum Master doesn't
 *  clear it: a distraction loses half the day, a blocker loses all of it. */
export const IMPEDIMENT_EFFECT: Record<Impediment['kind'], number> = {
  distraction: 0.5,
  blocker: 0,
};

/** The pool of impediments the Daily Scrum can surface. Deliberately team-level
 *  (no single story to blame) so the lesson is about the Scrum Master clearing
 *  the way, not micromanaging a card. */
export const IMPEDIMENTS: Omit<Impediment, 'id' | 'cleared'>[] = [
  { kind: 'distraction', title: 'A production incident pulls people away', detail: 'Half the day goes to firefighting instead of the Sprint.' },
  { kind: 'distraction', title: 'An unplanned stakeholder demo', detail: 'A last-minute request eats a good chunk of the day.' },
  { kind: 'distraction', title: 'A Developer is off sick', detail: 'The team is short-handed and slower today.' },
  { kind: 'distraction', title: 'Flaky tests need babysitting', detail: 'Noise in the build drags everyone down today.' },
  { kind: 'blocker', title: "Waiting on another team's work", detail: 'Progress stops until someone chases down the dependency.' },
  { kind: 'blocker', title: 'The shared environment is down', detail: 'Nothing can be finished until it is back up.' },
];

/** A stable badge colour per roster position, so each Developer reads distinctly
 *  on the bench and on the cards (mirrors the Flow game's coloured pawns). */
const DEV_COLORS = [
  'bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500',
];
export const devColor = (index: number): string => DEV_COLORS[index % DEV_COLORS.length];
