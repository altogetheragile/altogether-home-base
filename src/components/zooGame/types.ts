// ============= Build A Zoo: game state and actions =============
//
// The same Scrum loop as the /scrum-game (plan, build, review, retro), skinned as
// building a zoo, with a real customer at the Review (the visitor simulation). See
// docs/ZOO_GAME.md. This slice is the reducer core: later slices add the timed
// days and Daily Scrum, the design-and-build mechanic, the park view and the coach.

import type { SegmentId, SimulationResult, Signal } from './simulation/types';
import type { ItemDesign } from './design';

export type ZooPhase = 'intro' | 'planning' | 'sprint' | 'review' | 'retro' | 'final';

/** Within a Sprint, a day is either being worked (building) or paused at its close
 *  for the Daily Scrum. */
export type DayStage = 'building' | 'dailyScrum';

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

/** A Product Backlog Item: an exhibit (animal) or an amenity (cafe, toilets,
 *  seating). Carries the attributes the visitor simulation reads, plus game fields
 *  (estimate, per-item acceptance criteria, status). */
export interface BacklogItem {
  id: string;
  name: string;
  category: 'exhibit' | 'amenity';
  /** Which themed zone this belongs to (Big Cats, Waterside, ...). */
  zone: string;
  /** Estimate in points, from size and complexity. */
  estimate: number;
  /** Per-item acceptance criteria (what makes this item correct). Distinct from the
   *  product-wide Definition of Done. */
  acceptance: string[];
  status: ItemStatus;
  /** The Sprint this item was committed to (null while in the Backlog). */
  sprintNumber: number | null;
  accessible: boolean;
  /** The finish the team chose when building it (palette, pattern, features). */
  design?: ItemDesign;
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
  /** Product-wide, team-owned quality bar every item clears to be shippable. */
  definitionOfDone: string[];
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
  | { type: 'SET_DOD'; dod: string[] }
  | { type: 'ACCEPT_SIGNAL'; index: number }
  | { type: 'PLAN_SPRINT'; ids: string[] }
  | { type: 'BUILD_ITEM'; id: string; design?: ItemDesign }
  | { type: 'OPEN_ITEM'; id: string }
  | { type: 'END_DAY' }
  | { type: 'RUN_DAILY_SCRUM' }
  | { type: 'SKIP_DAILY_SCRUM' }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'END_GAME' }
  | { type: 'RESET' };
