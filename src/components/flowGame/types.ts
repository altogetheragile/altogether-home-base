// ============= Column & Board =============

// Each active stage is split into an Active lane (being worked) and a Done lane
// (finished this stage, waiting to be PULLED to the next stage by the player).
// Columns are dynamic: 'backlog', 'done', and per-stage `${stageId}-active` /
// `${stageId}-done`, so the board can have any number of stages.
export type ColumnId = 'backlog' | 'done' | `${string}-active` | `${string}-done`;

export type Lane = 'active' | 'done';

export interface ColumnDef {
  id: ColumnId;
  label: string;
  type: 'queue' | 'active' | 'output';
}

// ============= Workers =============

/** A stage id. Stages are configurable, so this is an open string rather than a
 *  fixed union. The default board uses 'analysis' | 'development' | 'test'. */
export type Specialism = string;

export interface WorkerDef {
  id: string;
  name: string;
  initials: string;
  specialism: Specialism;
}

export interface WorkerAssignment {
  workerId: string;
  cardId: string;
}

// ============= Workflow (configurable board) =============

export interface StageDef {
  id: Specialism;
  name: string;
}

/** The configurable board: which stages exist and who is on the team. Phase 1a
 *  makes the workers config-driven; stages become editable in a later phase.
 *  Carried in game state so it is saved and shared across both rounds. */
export interface Workflow {
  stages: StageDef[];
  workers: WorkerDef[];
}

// ============= Work Items =============

export interface WorkItemDef {
  id: string;
  title: string;
  /** Effort required per active column */
  effort: Record<Specialism, number>;
}

export interface WorkItem {
  id: string;
  title: string;
  column: ColumnId;
  effortRemaining: Record<Specialism, number>;
  effortTotal: Record<Specialism, number>;
  blocked: boolean;
  blockerEffort: number;
  /** Day the item first left backlog */
  startDay: number | null;
  /** Day the item entered done */
  endDay: number | null;
}

// ============= Day Results =============

export interface DayRollResult {
  workerId: string;
  cardId: string;
  roll: number;
  effectiveWork: number;
  isSpecialist: boolean;
}

/** Item counts keyed by 'backlog', each stage id, and 'done'. Dynamic so the CFD
 *  can show a band per configured stage. */
export type ColumnSnapshot = Record<string, number>;

export interface DaySummaryData {
  day: number;
  rolls: DayRollResult[];
  itemsCompleted: string[];
  /** Items that finished their current stage this day (moved to a Done lane). */
  advanced: string[];
  blockersApplied: string[];
  blockersCleared: string[];
  columnSnapshot: ColumnSnapshot;
}

// ============= Metrics =============

export interface RoundMetrics {
  throughputPerDay: number[];
  cycleTimePerItem: { itemId: string; completionDay: number; cycleTime: number }[];
  wipPerDay: number[];
  cfdPerDay: Array<{ day: number } & ColumnSnapshot>;
  averageCycleTime: number;
  averageWip: number;
  throughputRate: number;
  totalCompleted: number;
}

// ============= Game State =============

export type GamePhase =
  | 'intro'
  | 'playing-round-1'
  | 'metrics-round-1'
  | 'wip-setup'
  | 'playing-round-2'
  | 'metrics-final';

export interface RoundState {
  roundNumber: 1 | 2;
  day: number;
  items: WorkItem[];
  assignments: WorkerAssignment[];
  dayHistory: DaySummaryData[];
  wipLimits: Record<Specialism, number> | null;
  /** When false, WIP limits are shown but not enforced on pulls (TWiG "Enforce WIP"). */
  enforceWip: boolean;
  /** TWiG "Maximize WIP": the day can't run while a stage is below its limit and
   *  upstream work is available to pull in — don't leave capacity idle. */
  maximizeWip: boolean;
  /** Seed for the round's deterministic RNG. Both rounds share a seed so the
   *  variability (dice, blockers) is held fixed and only WIP decisions differ. */
  seed: number;
  dayPhase: 'assign' | 'results';
  /** Items that had a blocker land on them entering the current day (surfaced as
   *  a start-of-day alert; cleared once the day is run). */
  newBlockers: string[];
  /** The team for this round (config-driven). The engine reads this rather than
   *  a global const, so the roster can be edited or swept. */
  workers: WorkerDef[];
  /** The ordered stages for this round (config-driven). Drives pull order,
   *  which stage is last (completes to Done), and the board columns. */
  stages: StageDef[];
}

/** Player's pre-reveal guess for how Round 2's avg cycle time compares to Round 1. */
export type Prediction = 'lower' | 'same' | 'higher';

/** How the board is seeded at the start. 'empty' pulls from an empty backlog;
 *  the others drop you into an established team's flow - 'healthy' delivering
 *  steadily, 'struggling' jammed with too much WIP and little shipping. */
export type StartScenario = 'empty' | 'healthy' | 'struggling';

export interface GameState {
  phase: GamePhase;
  round: RoundState | null;
  round1Metrics: RoundMetrics | null;
  round2Metrics: RoundMetrics | null;
  /** Captured on the WIP-setup screen before Round 2; revealed against the result. */
  prediction: Prediction | null;
  /** Chosen at the intro: how the board starts (empty, or mid-flow as a healthy
   *  or struggling team). Reused for Round 2 so both rounds start from the same
   *  board and stay comparable. */
  startScenario: StartScenario;
  /** The configurable board (stages + team). Defaults to the standard setup. */
  workflow: Workflow;
}

// ============= Actions =============

export type GameAction =
  | { type: 'START_ROUND'; roundNumber: 1 | 2; wipLimits?: Record<Specialism, number>; scenario?: StartScenario }
  | { type: 'PULL_ITEM'; cardId: string }
  | { type: 'REORDER_ITEM'; activeId: string; overId: string }
  | { type: 'SET_WIP'; stage: Specialism; value: number }
  | { type: 'SET_ENFORCE_WIP'; enforce: boolean }
  | { type: 'SET_MAXIMIZE_WIP'; maximize: boolean }
  | { type: 'ASSIGN_WORKER'; workerId: string; cardId: string }
  | { type: 'UNASSIGN_WORKER'; workerId: string }
  | { type: 'RUN_DAY' }
  | { type: 'NEXT_DAY' }
  | { type: 'END_ROUND'; metrics: RoundMetrics }
  | { type: 'SET_PREDICTION'; prediction: Prediction }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'SET_WORKFLOW'; workflow: Workflow }
  | { type: 'SET_ROSTER'; workers: WorkerDef[] }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'RESET' };
