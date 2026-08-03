// ============= Build A Zoo: game state and actions =============
//
// The same Scrum loop as the /scrum-game (plan, build, review, retro), skinned as
// building a zoo, with a real customer at the Review (the visitor simulation). See
// docs/ZOO_GAME.md. This slice is the reducer core: later slices add the timed
// days and Daily Scrum, the design-and-build mechanic, the park view and the coach.

import type { SegmentId, SimulationResult, Signal } from './simulation/types';
import type { ItemDesign } from './design';

/** A Product Owner's draft for a new or refined Backlog item. */
export interface PbiDraft {
  name: string;
  story?: string;
  category: ItemCategory;
  zone: string;
  acceptance: string[];
  services?: 'food' | 'toilet' | 'rest';
}

export type ZooPhase = 'intro' | 'refine' | 'planning' | 'sprint' | 'review' | 'retro' | 'final';

/** Within a Sprint, a day is being worked (building), paused at its close for the
 *  Daily Scrum, or pausing at the start of a new day before the build resumes. */
export type DayStage = 'building' | 'dailyScrum' | 'dayStart';

/** Something that gets in the team's way. Surfaced at the Daily Scrum: hold it and
 *  the Scrum Master clears the way; skip it and the impediment resurfaces the next
 *  day (`missed`), later and costlier, with a coaching `tip`. */
export interface Impediment {
  id: string;
  title: string;
  detail: string;
  missed?: boolean;
  tip?: string;
}

/** backlog -> committed (into a Sprint) -> done (meets AC + DoD) -> open (released
 *  to visitors). Release is decoupled from the Review: a Done item can be opened at
 *  any time during the Sprint. */
export type ItemStatus = 'backlog' | 'committed' | 'done' | 'open';

/** One task in a PBI's build plan: a small step the Developers tick off as they work. */
export interface SprintTask { id: string; label: string; done: boolean }

/** A Product Backlog Item: an exhibit (animal) or an amenity (cafe, toilets,
 *  seating). Carries the attributes the visitor simulation reads, plus game fields
 *  (estimate, per-item acceptance criteria, status). */
/** exhibit = an animal, amenity = a facility (cafe/toilets/seating), flora =
 *  scenery/planting (trees, bushes, flowerbeds). */
export type ItemCategory = 'exhibit' | 'amenity' | 'flora';

export interface BacklogItem {
  id: string;
  name: string;
  /** Optional user story ("As a ... I want ... so that ...") - a richer way to
   *  express the item's value. The name stays as the short label. */
  story?: string;
  category: ItemCategory;
  /** Which themed zone this belongs to (Big Cats, Waterside, ...). */
  zone: string;
  /** Estimate in points, the team's forecast from size and complexity. Meaningful
   *  once the item has been estimated (see `unsized`). */
  estimate: number;
  /** True until the team estimates it: an unsized item can't be planned yet - it
   *  must be refined (estimated) first. */
  unsized?: boolean;
  /** Hidden intended size; what planning poker clusters the cards around. */
  trueSize?: number;
  /** Per-item acceptance criteria (what makes this item correct). Distinct from the
   *  product-wide Definition of Done. */
  acceptance: string[];
  status: ItemStatus;
  /** The Sprint this item was committed to (null while in the Backlog). */
  sprintNumber: number | null;
  accessible: boolean;
  /** The finish the team built: for an exhibit the one animal, for an amenity the
   *  building. Every animal is its own Product Backlog Item - to add more of a
   *  species you add more PBIs, not more animals in one build. */
  design?: ItemDesign;
  /** The Developers' plan for how this item gets built: a decomposition into tasks,
   *  written during Sprint Planning (the "how") and ticked off as the work is done.
   *  The item reaches Done only when its design is built AND every task is ticked. */
  tasks?: SprintTask[];
  /** True once work has started (it moved from To Do into Doing and opened the studio).
   *  Keeps it in the Doing column while it is being built and its tasks ticked. */
  started?: boolean;
  // Exhibits:
  appeal?: Record<SegmentId, number>;
  capacity?: number;
  // Amenities:
  services?: 'food' | 'toilet' | 'rest';
  serviceCapacity?: number;
}

export interface ZooGameState {
  phase: ZooPhase;
  /** The long-term objective the Backlog is ordered toward (coached, editable). */
  productGoal: string;
  /** The single objective for the current Sprint (coached, outcome-shaped). Empty
   *  until set at Planning. The Daily Scrum inspects progress toward it. */
  sprintGoal: string;
  /** Whether the current Sprint's goal was met, set at the Review (null until then,
   *  or when there is no goal). */
  sprintGoalMet: boolean | null;
  /** Product-wide, team-owned quality bar every item clears to be shippable. */
  definitionOfDone: string[];
  /** Whether new PBIs default to the user-story format (a preference, off by default
   *  so it is never forced). */
  useUserStories: boolean;
  /** The Product Backlog: dynamic and emergent (signals add to it). */
  backlog: BacklogItem[];
  /** The themes / zones known so far. */
  zones: string[];
  sprintNumber: number;
  /** Ids committed to the current Sprint. */
  committedIds: string[];
  /** Points delivered (Done) per finished Sprint. */
  velocity: number[];
  /** Current visitor attendance per segment; evolves via word of mouth. */
  attendance: Record<SegmentId, number>;
  /** The most recent Sprint Review's simulation output. */
  lastReview: SimulationResult | null;
  /** Outstanding signals from the visitors (persist and worsen until addressed).
   *  The Product Owner decides whether to turn one into a Backlog item. */
  signals: Signal[];
  /** How many consecutive Reviews each signal has recurred, for persist-and-worsen. */
  signalAge: Record<string, number>;
  /** Improvements carried from Retrospectives. */
  improvements: string[];
  /** Per-game seed: drives taste jitter and attendance drift (anti-scripting). */
  gameSeed: number;
  // ---- Timed days and the Daily Scrum (within a Sprint) ----
  /** How many days this Sprint runs. */
  sprintDays: number;
  /** The current day, 1..sprintDays. */
  dayNumber: number;
  /** Whether the current day is being worked or paused for its Daily Scrum. */
  dayStage: DayStage;
  /** Multiplier on the current day's build time: the Daily Scrum costs a little
   *  time, a missed impediment costs more. 1 = a full day. */
  dayTimeMult: number;
  /** The impediment surfaced at the current Daily Scrum, awaiting the team's call. */
  pendingImpediment: Impediment | null;
  /** A missed impediment carried into the current building day (skipped Daily
   *  Scrum), shown as a banner with its coaching tip. */
  carriedImpediment: Impediment | null;
  /** How many Daily Scrums were skipped while an impediment was waiting. */
  missedScrums: number;
}

export type ZooAction =
  | { type: 'START'; gameSeed?: number }
  | { type: 'SET_PHASE'; phase: ZooPhase }
  | { type: 'SET_PRODUCT_GOAL'; goal: string }
  | { type: 'SET_SPRINT_GOAL'; goal: string }
  | { type: 'SET_DOD'; dod: string[] }
  | { type: 'ACCEPT_SIGNAL'; index: number }
  | { type: 'PLAN_SPRINT'; ids: string[] }
  | { type: 'ESTIMATE_ITEM'; id: string; points: number }
  | { type: 'SET_TASKS'; id: string; tasks: SprintTask[] }
  | { type: 'TOGGLE_TASK'; id: string; taskId: string }
  | { type: 'START_ITEM'; id: string }
  | { type: 'ADD_PBI'; draft: PbiDraft }
  | { type: 'REFINE_PBI'; id: string; draft: PbiDraft }
  | { type: 'MOVE_ITEM'; id: string; dir: 'up' | 'down' }
  | { type: 'MOVE_ITEM_BEFORE'; id: string; beforeId: string }
  | { type: 'SET_USE_USER_STORIES'; on: boolean }
  | { type: 'MOVE_TO_ZONE'; id: string; zone: string }
  | { type: 'ADD_ZONE'; name: string }
  | { type: 'RENAME_ZONE'; oldName: string; newName: string }
  | { type: 'REORDER_IN_ZONE'; id: string; dir: 'up' | 'down' }
  | { type: 'PULL_ITEM'; id: string }
  | { type: 'BUILD_ITEM'; id: string; design?: ItemDesign }
  | { type: 'EDIT_ITEM'; id: string; design: ItemDesign }
  | { type: 'ADD_ANOTHER'; id: string }
  | { type: 'OPEN_ITEM'; id: string }
  | { type: 'END_DAY' }
  | { type: 'RUN_DAILY_SCRUM' }
  | { type: 'SKIP_DAILY_SCRUM' }
  | { type: 'START_DAY' }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'END_GAME' }
  | { type: 'RESET' };
