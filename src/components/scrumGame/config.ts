import type { Criterion, Story, ScrumState, Developer, Impediment } from './types';
import type { ThemeConfig } from './theme';
import { ACTIVE_THEME, getTheme } from './theme';

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

/** The item tag that dominates a selection, weighted by value - the agenda the
 *  Sprint would serve most. Null if the selection carries no tags. */
export function dominantTag(stories: { value: number; tags?: string[] }[]): string | null {
  const byTag = new Map<string, number>();
  for (const s of stories) {
    for (const tag of s.tags ?? []) byTag.set(tag, (byTag.get(tag) ?? 0) + s.value);
  }
  let best: string | null = null;
  let bestV = -1;
  for (const [tag, v] of byTag) {
    if (v > bestV) { best = tag; bestV = v; }
  }
  return best;
}

/** Draft a Sprint Goal from the selected items using the outcome-oriented shape
 *  "Our goal is to deliver [capability] so that [value]". The capability comes from
 *  the selected items; the value clause is pre-filled from the selection's dominant
 *  tag (a starting point the team then shapes into a single, clear objective - the
 *  Goal is an outcome, not just the list of PBIs). */
export function suggestSprintGoal(
  stories: { title: string; value: number; tags?: string[] }[],
  tagOutcomes: Record<string, string> = {},
): string {
  const titles = stories.slice(0, 4).map((s) => s.title.charAt(0).toLowerCase() + s.title.slice(1));
  if (titles.length === 0) return '';
  const capability = titles.length === 1
    ? titles[0]
    : `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;
  const tag = dominantTag(stories);
  const value = (tag && tagOutcomes[tag]) || 'we move closer to the Product Goal';
  return `Our goal is to deliver ${capability} so that ${value}`;
}

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
/** Build a starting Product Backlog from any theme's items (effort -> points),
 *  carrying the visualKey and tags. Un-sized items start with no estimate (0
 *  points) for the team to size; the real work (trueEffort) is the theme's effort. */
export function backlogFromTheme(theme: ThemeConfig): Omit<Story, 'status' | 'sprintNumber' | 'effortRemaining'>[] {
  return theme.items.map((i) => ({
    id: i.id,
    title: i.name,
    points: i.unsized ? 0 : i.effort,
    estimated: !i.unsized,
    trueEffort: i.effort,
    value: i.value,
    visualKey: i.visualKey,
    tags: i.tags,
  }));
}

/** The default (booking) Product Backlog. */
export const PRODUCT_BACKLOG = backlogFromTheme(ACTIVE_THEME);

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

/** The starting game state for a chosen theme: all stories in that theme's Product
 *  Backlog, no Sprints yet. Defaults to the booking theme (the state the reducer is
 *  seeded with before the player picks). Everything the engine needs is derived from
 *  the theme, so one engine renders every skin. */
export function initialScrumState(themeId: string = ACTIVE_THEME.id): ScrumState {
  const theme = getTheme(themeId);
  return {
    phase: 'intro',
    productGoal: theme.productGoal,
    definitionOfDone: theme.definitionOfDone.map((c) => ({ ...c })),
    productBacklog: backlogFromTheme(theme).map((s) => ({ ...s, status: 'backlog', sprintNumber: null, effortRemaining: s.trueEffort })),
    team: DEFAULT_TEAM.map((d) => ({ ...d })),
    scrumMaster: SCRUM_MASTER,
    productOwner: PRODUCT_OWNER,
    assignments: {},
    currentImpediment: null,
    changeRequest: null,
    currentEvent: null,
    eventLesson: null,
    lastDay: null,
    sprints: [],
    currentSprint: null,
    velocity: [],
    improvements: [],
    sprintLength: SPRINT_LENGTH,
    theme: { id: theme.id, name: theme.name, buildMetaphor: theme.buildMetaphor, valueLabel: theme.valueLabel },
    satisfaction: Object.fromEntries(theme.stakeholders.map((s) => [s.id, STAKEHOLDER_START])),
  };
}

/** Every stakeholder starts neutral. */
export const STAKEHOLDER_START = 50;

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

/** Effort a mid-Sprint split costs the team. Refinement is legitimate, ongoing
 *  work, but doing it DURING a Sprint takes a little of the team's time away from
 *  the Sprint Goal - so each split charges this against the next Run Day. Kept
 *  small: refinement should be a light, steady habit, not a Sprint-wrecking tax.
 *  (Refinement done in the dedicated Refinement step between Sprints is free - it
 *  happens outside the running Sprint's capacity.) */
export const REFINE_COST = 2;

/** Whether a story is small enough to be Ready to pull into a Sprint. */
export const isReady = (points: number): boolean => points <= REFINE_MAX;

/** Whether a story can still be split into smaller items. */
export const isSplittable = (points: number): boolean => points in SPLIT_MAP;

/** The Fibonacci-ish scale the team estimates on. Relative sizes, not hours - the
 *  Scrum way, because people are poor at absolute time but decent at "bigger than". */
export const FIBONACCI: readonly number[] = [1, 2, 3, 5, 8, 13, 21];

/** Snap any number to the nearest value on the estimation scale. */
export const nearestFib = (n: number): number =>
  FIBONACCI.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), FIBONACCI[0]);

/** A story is Ready only once the team has ESTIMATED it and it is small enough.
 *  An un-estimated item is never Ready - the doers size it first. */
export const storyReady = (s: { estimated: boolean; points: number }): boolean =>
  s.estimated && isReady(s.points);

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
