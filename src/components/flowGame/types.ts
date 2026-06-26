// ============= Column & Board =============

// Each active stage is split into an Active lane (being worked) and a Done lane
// (finished this stage, waiting to be PULLED to the next stage by the player).
export type ColumnId =
  | 'backlog'
  | 'analysis-active'
  | 'analysis-done'
  | 'development-active'
  | 'development-done'
  | 'test-active'
  | 'test-done'
  | 'done';

export type Lane = 'active' | 'done';

export interface ColumnDef {
  id: ColumnId;
  label: string;
  type: 'queue' | 'active' | 'output';
}

// ============= Workers =============

export type Specialism = 'analysis' | 'development' | 'test';

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

export interface ColumnSnapshot {
  backlog: number;
  analysis: number;
  development: number;
  test: number;
  done: number;
}

export interface DaySummaryData {
  day: number;
  rolls: DayRollResult[];
  itemsCompleted: string[];
  blockersApplied: string[];
  blockersCleared: string[];
  columnSnapshot: ColumnSnapshot;
}

// ============= Metrics =============

export interface RoundMetrics {
  throughputPerDay: number[];
  cycleTimePerItem: { itemId: string; completionDay: number; cycleTime: number }[];
  wipPerDay: number[];
  cfdPerDay: { day: number; backlog: number; analysis: number; development: number; test: number; done: number }[];
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
  dayPhase: 'assign' | 'results';
}

/** Player's pre-reveal guess for how Round 2's avg cycle time compares to Round 1. */
export type Prediction = 'lower' | 'same' | 'higher';

export interface GameState {
  phase: GamePhase;
  round: RoundState | null;
  round1Metrics: RoundMetrics | null;
  round2Metrics: RoundMetrics | null;
  /** Captured on the WIP-setup screen before Round 2; revealed against the result. */
  prediction: Prediction | null;
}

// ============= Actions =============

export type GameAction =
  | { type: 'START_ROUND'; roundNumber: 1 | 2; wipLimits?: Record<Specialism, number> }
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
  | { type: 'RESET' };
