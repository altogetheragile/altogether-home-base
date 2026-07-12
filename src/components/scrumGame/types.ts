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
   *  board column. */
  status: 'backlog' | 'todo' | 'doing' | 'done';
  /** The sprint this story was committed to (null while in the Product Backlog). */
  sprintNumber: number | null;
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
  /** Completed and in-flight Sprints. */
  sprints: Sprint[];
  /** The Sprint currently being planned or played. */
  currentSprint: Sprint | null;
  /** Story points completed per finished Sprint - the velocity trend. */
  velocity: number[];
  /** Working days per Sprint (the timebox length). */
  sprintLength: number;
}

export type ScrumAction =
  | { type: 'START' }
  | { type: 'SET_PHASE'; phase: ScrumPhase }
  | { type: 'PLAN_SPRINT'; goal: string; storyIds: string[] }
  | { type: 'RESET' };
