import type { Criterion, Story, ScrumState, Developer, Impediment } from './types';
import { ACTIVE_THEME } from './theme';

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
export const CAPACITY_PER_DEV_DAY = 0.8;

/** Average of past Sprint velocities (0 if none yet). */
export const averageVelocity = (velocity: number[]): number =>
  velocity.length ? Math.round(velocity.reduce((n, v) => n + v, 0) / velocity.length) : 0;

/** How many points the team can realistically take on: past velocity once it
 *  exists, otherwise a first-Sprint guess scaled to the team size and the Sprint's
 *  development days (a bigger team or a longer timebox can forecast more). */
export const sprintCapacity = (velocity: number[], teamSize: number, devDays: number): number =>
  velocity.length ? averageVelocity(velocity) : Math.round(teamSize * devDays * CAPACITY_PER_DEV_DAY);

/** The Product Goal - the north star the Product Backlog is ordered toward.
 *  Sourced from the active theme. */
export const PRODUCT_GOAL = ACTIVE_THEME.productGoal;

/** Share of the product's value that, once delivered, lets the Product Owner call
 *  the Product Goal achieved and wrap up - the Goal is an outcome, not "empty the
 *  Backlog", so the last low-value items needn't ship to be done. */
export const PRODUCT_GOAL_THRESHOLD = 0.8;

/** The active theme's default Definition of Done (the Increment's commitment).
 *  Editable by the team, like the Flow game's exit criteria. */
export function defaultDefinitionOfDone(): Criterion[] {
  return ACTIVE_THEME.definitionOfDone.map((c) => ({ ...c }));
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

/** The starting Product Backlog, ordered by value - derived from the active
 *  theme's items (effort -> story points), carrying the visualKey so the build
 *  canvas can draw each component as it is completed. */
export const PRODUCT_BACKLOG: Omit<Story, 'status' | 'sprintNumber' | 'effortRemaining'>[] =
  ACTIVE_THEME.items.map((i) => ({
    id: i.id,
    title: i.name,
    points: i.effort,
    value: i.value,
    visualKey: i.visualKey,
    tags: i.tags,
  }));

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
    theme: { name: ACTIVE_THEME.name, buildMetaphor: ACTIVE_THEME.buildMetaphor, valueLabel: ACTIVE_THEME.valueLabel },
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

/** Product Backlog Refinement: an item is "Ready" to be committed only once it is
 *  this size or smaller. Bigger items must be split first - small items flow, big
 *  ones tend not to finish. */
export const REFINE_MAX = 13;

/** How a too-big item breaks into two smaller (Fibonacci) items when split.
 *  Anything not listed is already small enough and cannot be split further. */
export const SPLIT_MAP: Record<number, [number, number]> = {
  21: [13, 8],
  13: [8, 5],
  8: [5, 3],
};

/** Whether a story is small enough to be Ready to pull into a Sprint. */
export const isReady = (points: number): boolean => points <= REFINE_MAX;

/** Whether a story can still be split into smaller items. */
export const isSplittable = (points: number): boolean => points in SPLIT_MAP;

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
export const CHANGE_REQUESTS: { title: string; detail: string; points: number; value: number; visualKey: string }[] = [
  { title: 'A partner wants a co-branded booking link', detail: 'A time-boxed opportunity the PO would love this Sprint.', points: 8, value: 12, visualKey: 'partner' },
  { title: 'Regulator asks for a consent notice', detail: 'A compliance need that has just landed.', points: 5, value: 11, visualKey: 'consent' },
  { title: 'A VIP client needs group bookings', detail: 'A high-value account is asking for it now.', points: 13, value: 13, visualKey: 'group' },
];

/** Chance, per Sprint day, that an impediment shows up at the Daily Scrum. */
export const IMPEDIMENT_CHANCE = 0.4;

/** Fraction of the day's effort the team RETAINS under a live impediment. Even
 *  when the Scrum Master addresses it, some capacity is lost (there is always
 *  disruption before it is resolved) - clearing mitigates the hit, it does not
 *  erase it. Ignoring it costs far more. */
export const IMPEDIMENT_EFFECT: Record<Impediment['kind'], { addressed: number; ignored: number }> = {
  distraction: { addressed: 0.85, ignored: 0.5 }, // lose 15% handled, 50% ignored
  blocker: { addressed: 0.6, ignored: 0.25 }, // lose 40% handled, 75% ignored (a heavy drag, not a total freeze)
};

/** How many escalated days it takes the Scrum Master to clear a blocker. It keeps
 *  costing (the mitigated amount) each of those days; ignoring it does not count
 *  down. */
export const BLOCKER_RESOLVE_DAYS = 2;

/** The pool of impediments the Daily Scrum can surface. Deliberately team-level
 *  (no single story to blame) so the lesson is about the Scrum Master clearing
 *  the way, not micromanaging a card. */
export const IMPEDIMENTS: Pick<Impediment, 'kind' | 'title' | 'detail'>[] = [
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
