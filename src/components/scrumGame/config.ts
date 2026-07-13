import type { Criterion, Story, ScrumState, Developer } from './types';

/** Working days in a sim Sprint. Short so several Sprints stay playable without
 *  click fatigue; the first Sprint is felt day by day, later ones zoom out. */
export const SPRINT_LENGTH = 5;

/** Rough points one Developer is worth over a Sprint - used only for the FIRST
 *  Sprint's capacity guess (before there's velocity). Deliberately a little
 *  optimistic: a focused team can beat it, a scattered one won't, and velocity
 *  soon replaces the guess. */
export const CAPACITY_PER_DEV = 4;

/** Average of past Sprint velocities (0 if none yet). */
export const averageVelocity = (velocity: number[]): number =>
  velocity.length ? Math.round(velocity.reduce((n, v) => n + v, 0) / velocity.length) : 0;

/** How many points the team can realistically take on: past velocity once it
 *  exists, otherwise a first-Sprint guess scaled to how many Developers there
 *  are (a bigger team can forecast more). */
export const sprintCapacity = (velocity: number[], teamSize: number): number =>
  velocity.length ? averageVelocity(velocity) : teamSize * CAPACITY_PER_DEV;

/** The Product Goal - the north star the Product Backlog is ordered toward. */
export const PRODUCT_GOAL = 'Launch a booking experience customers love and trust.';

/** A domain-neutral default Definition of Done (the Increment's commitment).
 *  Editable later, like the Flow game's exit criteria. */
export function defaultDefinitionOfDone(): Criterion[] {
  return [
    { id: 'dod-reviewed', label: 'Reviewed by someone else' },
    { id: 'dod-accepted', label: 'Meets its acceptance criteria' },
    { id: 'dod-releasable', label: 'Releasable - nothing left to finish' },
  ];
}

/** A starting Product Backlog, ordered by value. Story points vary so planning
 *  is a real forecasting decision. Deterministic (fixed list, not RNG). */
export const PRODUCT_BACKLOG: Omit<Story, 'status' | 'sprintNumber' | 'effortRemaining'>[] = [
  { id: 's1', title: 'Browse available slots', points: 5, value: 8 },
  { id: 's2', title: 'Book a slot', points: 8, value: 10 },
  { id: 's3', title: 'Confirmation email', points: 3, value: 6 },
  { id: 's4', title: 'Reschedule a booking', points: 5, value: 7 },
  { id: 's5', title: 'Cancel a booking', points: 3, value: 5 },
  { id: 's6', title: 'Reminders before the slot', points: 5, value: 6 },
  { id: 's7', title: 'Pay for a booking', points: 8, value: 9 },
  { id: 's8', title: 'Manage my bookings', points: 5, value: 6 },
  { id: 's9', title: 'Waitlist for a full slot', points: 8, value: 4 },
  { id: 's10', title: 'Accessibility pass', points: 5, value: 7 },
  { id: 's11', title: 'Admin: view all bookings', points: 5, value: 5 },
  { id: 's12', title: 'Analytics dashboard', points: 8, value: 3 },
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
    assignments: {},
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

/** A stable badge colour per roster position, so each Developer reads distinctly
 *  on the bench and on the cards (mirrors the Flow game's coloured pawns). */
const DEV_COLORS = [
  'bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500',
];
export const devColor = (index: number): string => DEV_COLORS[index % DEV_COLORS.length];
