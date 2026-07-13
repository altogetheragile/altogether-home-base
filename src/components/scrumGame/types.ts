// ============= Scrum Simulation - domain model =============
//
// A separate game from the Flow (Kanban) sim, but built on the same proven
// patterns (a pure reducer + deterministic engine, a board, metrics). Where the
// Flow game teaches continuous flow and WIP limits, this teaches the Scrum loop:
// timeboxed Sprints, the Daily Scrum, and the three artifact commitments -
// Product Goal, Sprint Goal, Definition of Done.

/** A quality gate line - reused here as a Definition of Done item. Mirrors the
 *  Flow game's Criterion; kept local for now so the Scrum game stands alone
 *  (a shared "quality kit" extraction comes later). */
export interface Criterion {
  id: string;
  label: string;
}

/** A Developer on the Scrum Team. Cross-functional (any of them can work any
 *  story), so the only decision is who works on WHAT - the swarm-vs-spread call
 *  the player makes each day. */
export interface Developer {
  id: string;
  name: string;
  /** Short badge label (1-2 chars), derived from the name; kept distinct so a
   *  bigger roster still reads clearly. */
  initials: string;
}

/** Something getting in the team's way on a given day. The Scrum Master's job is
 *  to remove it; left in place, it costs the team capacity (a distraction) or
 *  stops progress entirely (a blocker) for that day. */
export interface Impediment {
  /** Unique per (sprint, day). */
  id: string;
  /** distraction = half the day lost; blocker = the whole day lost until cleared. */
  kind: 'distraction' | 'blocker';
  title: string;
  detail: string;
  /** Set once the Scrum Master has removed it, so it no longer bites. */
  cleared: boolean;
}

/** A Product Backlog Item (user story). Ordered in the Product Backlog toward the
 *  Product Goal; estimated in story points; carries business value. */
export interface Story {
  id: string;
  title: string;
  /** Relative size estimate (story points). */
  points: number;
  /** Business value delivered when this reaches Done (drives Product Goal progress). */
  value: number;
  /** Where the story is: the ordered backlog, or, once pulled into a Sprint, its
   *  board column (todo -> doing -> done). */
  status: 'backlog' | 'todo' | 'doing' | 'done';
  /** The sprint this story was committed to (null while in the Product Backlog). */
  sprintNumber: number | null;
  /** Work left to reach Done (starts equal to points; reduced each day it's in
   *  Doing and the team applies capacity to it). */
  effortRemaining: number;
}

/** One Sprint: a fixed timebox with a single Sprint Goal and a committed set of
 *  stories, played day by day (the Daily Scrum is each day's re-plan). */
export interface Sprint {
  number: number;
  /** The Sprint Goal - the commitment that gives the Sprint focus. */
  goal: string;
  /** Working days in the timebox. */
  length: number;
  /** Current day within the Sprint (1..length). */
  day: number;
  /** Ids of the stories forecast into this Sprint at planning. */
  committedStoryIds: string[];
  status: 'planning' | 'active' | 'review' | 'done';
  /** Points remaining at the end of each day played (for the burndown chart).
   *  burndown[0] is the start of the Sprint (full commitment). */
  burndown: number[];
  /** Days on which an impediment was left unaddressed and cost the team - a
   *  measure of how well the Scrum Master kept the way clear. */
  impedimentsHit: number;
}

export type ScrumPhase =
  | 'intro'
  | 'planning'   // Sprint Planning: forecast stories against velocity
  | 'sprint'     // daily execution (Daily Scrum + Run Day)
  | 'review'     // Sprint Review: forecast vs actual, Increment
  | 'retro'      // Retrospective: pick an improvement
  | 'final';     // wrap-up across Sprints

export interface ScrumState {
  phase: ScrumPhase;
  /** The Product Backlog's commitment: the longer-term objective every Sprint
   *  advances toward. */
  productGoal: string;
  /** The Increment's commitment: the quality bar a story must meet to be Done. */
  definitionOfDone: Criterion[];
  /** The ordered Product Backlog (highest value / priority first). */
  productBacklog: Story[];
  /** The Developers on the Scrum Team (configurable roster). */
  team: Developer[];
  /** The Scrum Master - not a Developer (does no story work), but clears the
   *  team's impediments so the Developers can focus. */
  scrumMaster: string;
  /** Who is working on what right now: Developer id -> story id. A Developer not
   *  present here is on the bench (idle, doing no work today). Reset each Sprint. */
  assignments: Record<string, string>;
  /** Today's impediment, if any - shown at the Daily Scrum for the Scrum Master
   *  to clear before the day is run. */
  currentImpediment: Impediment | null;
  /** Completed and in-flight Sprints. */
  sprints: Sprint[];
  /** The Sprint currently being planned or played. */
  currentSprint: Sprint | null;
  /** Story points completed per finished Sprint - the velocity trend. */
  velocity: number[];
  /** Improvement actions chosen at each Retrospective (kaizen). They accumulate,
   *  making the team a little more effective over time. */
  improvements: string[];
  /** Working days per Sprint (the timebox length). */
  sprintLength: number;
}

export type ScrumAction =
  | { type: 'START' }
  | { type: 'SET_PHASE'; phase: ScrumPhase }
  | { type: 'SET_TEAM'; team: Developer[] }
  | { type: 'PLAN_SPRINT'; goal: string; storyIds: string[]; length: number }
  | { type: 'START_STORY'; storyId: string }
  | { type: 'ADD_TO_SPRINT'; storyId: string }
  | { type: 'ASSIGN_DEV'; devId: string; storyId: string }
  | { type: 'UNASSIGN_DEV'; devId: string }
  | { type: 'CLEAR_IMPEDIMENT' }
  | { type: 'RUN_SPRINT_DAY' }
  | { type: 'RUN_TO_END' }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'RESET' };
