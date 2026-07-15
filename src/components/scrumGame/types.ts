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
  /** Unique per (sprint, day) when generated. */
  id: string;
  /** distraction = a one-day interruption; blocker = a stickier stop that takes
   *  more than one day to escalate clear. Either still costs the team even when
   *  the Scrum Master is on it - clearing mitigates the hit, it doesn't erase it. */
  kind: 'distraction' | 'blocker';
  title: string;
  detail: string;
  /** Whether the Scrum Master has acted on it today (reduces the day's hit; for a
   *  blocker, also advances it toward being resolved). */
  addressed: boolean;
  /** Blockers only: escalated-days remaining before the blocker lifts. Ignoring it
   *  a day does not count down; it just keeps costing the full day. */
  daysToResolve?: number;
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
   *  Doing and the team applies capacity to it). A story is Done - and part of the
   *  Increment - when this reaches zero, which in the sim means it meets the DoD. */
  effortRemaining: number;
  /** Which component this story builds, so the build canvas can draw it as the
   *  product assembles (comes from the theme). */
  visualKey?: string;
  /** Theme tags (which stakeholder agendas this serves) - used by later slices. */
  tags?: string[];
}

/** One Sprint: a fixed timebox with a single Sprint Goal and a committed set of
 *  stories, played day by day (the Daily Scrum is each day's re-plan). */
export interface Sprint {
  number: number;
  /** The Sprint Goal - the commitment that gives the Sprint focus. */
  goal: string;
  /** Playable development-day slots (ceil of devDays) - the Run Day count. */
  length: number;
  /** Development days available once the Sprint's events take their share; may be
   *  fractional (e.g. 4.5 for a one-week Sprint), so the last day can be a half day. */
  devDays: number;
  /** Current day within the Sprint (1..length). */
  day: number;
  /** Ids of the stories forecast into this Sprint at planning. */
  committedStoryIds: string[];
  status: 'planning' | 'active' | 'review' | 'done';
  /** Points remaining at the end of each day played (for the burndown chart).
   *  burndown[0] is the start of the Sprint (full commitment). */
  burndown: number[];
  /** Days on which an impediment cost the team any capacity (whether or not the
   *  Scrum Master addressed it - clearing only reduces the hit). */
  impedimentsHit: number;
  /** Days on which an impediment went unaddressed and so cost the full amount - the
   *  avoidable share, and a measure of how well the Scrum Master kept the way clear. */
  impedimentsIgnored: number;
}

/** An emergent need the Product Owner raises mid-Sprint - the classic "something
 *  important just came up". The team decides with the PO whether to pull it in
 *  (adapt) or hold it for the next Sprint (protect the Sprint Goal). */
export interface ChangeRequest {
  id: string;
  title: string;
  detail: string;
  points: number;
  value: number;
  /** Which component it builds on the canvas. */
  visualKey: string;
  /** The Sprint day it surfaces on. */
  day: number;
}

/** A record of the last Sprint day that was run, so the board can reveal the dice
 *  and celebrate what got finished. */
export interface DaySummary {
  day: number;
  /** The day's effort weight (1, or 0.5 for a Sprint's fractional final day). */
  dayWeight: number;
  /** Whether an impediment cost the team on this day (addressed or not). */
  impedimentBit: boolean;
  /** The impediment in play this day (for showing what it cost), or null. */
  impediment: { kind: Impediment['kind']; addressed: boolean } | null;
  /** Each assigned Developer's raw die roll and the story they worked. */
  rolls: { devId: string; storyId: string; roll: number }[];
  /** Story ids that reached Done on this day. */
  completed: string[];
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
  /** The Product Owner - orders the Product Backlog, accepts work at the Review,
   *  and raises change requests during the Sprint. */
  productOwner: string;
  /** A live change request from the Product Owner, awaiting the team's decision. */
  changeRequest: ChangeRequest | null;
  /** The last day run, for the dice reveal and Done celebration (null until a day
   *  has been run this Sprint). */
  lastDay: DaySummary | null;
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
  /** The active theme's display bits - the build metaphor the sim is skinned as
   *  (so one engine can render Booking, Theme Park, Rocket, and so on). */
  theme: { name: string; buildMetaphor: string; valueLabel: string };
}

export type ScrumAction =
  | { type: 'START' }
  | { type: 'SET_PHASE'; phase: ScrumPhase }
  | { type: 'SET_TEAM'; team: Developer[] }
  | { type: 'SET_DOD'; dod: Criterion[] }
  | { type: 'MOVE_STORY'; storyId: string; dir: 'up' | 'down' }
  | { type: 'PLAN_SPRINT'; goal: string; storyIds: string[]; length: number }
  | { type: 'START_STORY'; storyId: string }
  | { type: 'ADD_TO_SPRINT'; storyId: string }
  | { type: 'ASSIGN_DEV'; devId: string; storyId: string }
  | { type: 'UNASSIGN_DEV'; devId: string }
  | { type: 'CLEAR_IMPEDIMENT' }
  | { type: 'ACCEPT_CHANGE' }
  | { type: 'DECLINE_CHANGE' }
  | { type: 'RUN_SPRINT_DAY' }
  | { type: 'RUN_TO_END' }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'END_GAME' }
  | { type: 'RESET' };
