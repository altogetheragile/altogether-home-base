// ============= Build A Zoo: game state and actions =============
//
// The same Scrum loop as the /scrum-game (plan, build, review, retro), skinned as
// building a zoo, with a real customer at the Review (the visitor simulation). See
// docs/ZOO_GAME.md. This slice is the reducer core: later slices add the timed
// days and Daily Scrum, the design-and-build mechanic, the park view and the coach.

import type { SegmentId, SimulationResult, Signal } from './simulation/types';

export type ZooPhase = 'intro' | 'planning' | 'sprint' | 'review' | 'retro' | 'final';

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
}

export type ZooAction =
  | { type: 'START'; gameSeed?: number }
  | { type: 'SET_PRODUCT_GOAL'; goal: string }
  | { type: 'SET_DOD'; dod: string[] }
  | { type: 'ACCEPT_SIGNAL'; index: number }
  | { type: 'PLAN_SPRINT'; ids: string[] }
  | { type: 'BUILD_ITEM'; id: string }
  | { type: 'OPEN_ITEM'; id: string }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'END_GAME' }
  | { type: 'RESET' };
