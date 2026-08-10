// ============= Zoo visitor simulation: domain model =============
//
// The Sprint Review needs a real customer. Visitor feedback is COMPUTED from this
// simulation, never scripted, so empiricism is genuine and replays cannot be
// memorised. The simulation is a pure function of (zoo state, config, attendance,
// seed): same inputs, same outputs. See docs/ZOO_GAME.md and the Visitor Simulation
// Spec for the design.

// 'enclosure' is infrastructure (a habitat animals live in); the simulation does not
// score it directly - it is excluded before the sim runs - but the type includes it so
// backlog items flow through toZooItem cleanly.
export type ItemCategory = 'epic' | 'enclosure' | 'exhibit' | 'amenity' | 'flora' | 'path';

export type NeedType = 'food' | 'toilet' | 'rest';

export type SegmentId = 'families' | 'enthusiasts' | 'comfortSeekers';

/** Everything buildable in the zoo. Exhibits generate joy; amenities service needs. */
export interface ZooItem {
  id: string;
  name: string;
  category: ItemCategory;
  /** Exhibits only: appeal per segment, 0..10. */
  appeal?: Record<SegmentId, number>;
  /** Exhibits only: visitors served per Sprint before crowding bites. */
  capacity?: number;
  /** Amenities only: which need this services. */
  services?: NeedType;
  /** Amenities only: visitors served per Sprint before it overflows. */
  serviceCapacity?: number;
  /** Comfort Seekers lose joy at non-accessible exhibits (config.accessibilityPenalty). */
  accessible: boolean;
}

/** The built-and-Done items visitors actually experience. Carry-over is invisible. */
export interface ZooState {
  items: ZooItem[];
  sprintNumber: number;
}

export interface VisitorSegment {
  id: SegmentId;
  label: string;
  /** Visitors per Sprint before word of mouth. */
  baseAttendance: number;
  /** Abstract time units per visit. */
  timeBudget: number;
  /** Probability per time unit that each need fires. */
  needRates: Record<NeedType, number>;
}

export interface SegmentResult {
  segmentId: SegmentId;
  attendance: number;
  /** 0..100, mean across the cohort. */
  happiness: number;
  /** Exhibit with the highest total joy contribution (name), or null. */
  topExhibit: string | null;
  /** Share of this segment's joy the top exhibit produced, 0..1. */
  topExhibitShare: number;
  /** Share of visits ended early by an unmet need, 0..1. */
  truncationRate: number;
  /** Count of unmet-need events, scaled to attendance. */
  unmetNeeds: Record<NeedType, number>;
  /** Unmet events as a share of visits, 0..1 (used by the feedback thresholds). */
  unmetNeedRate: Record<NeedType, number>;
  /** Joy lost to crowding, 0..1 proportion. */
  crowdingLoss: number;
  /** Joy lost to inaccessibility (Comfort Seekers), 0..1 proportion. */
  accessibilityLoss: number;
  /** Number of exhibits this segment visited across the cohort sample. */
  visits: number;
}

export interface FeedbackQuote {
  segmentId: SegmentId;
  /** Templated from the stats. */
  text: string;
  /** Machine-readable driver, e.g. "unmet:food", "loved:penguins", "crowding". */
  cause: string;
  severity: 'praise' | 'gripe' | 'warning';
}

export interface Signal {
  /** A candidate backlog item the game may surface (the PO decides). */
  suggestion: string;
  /** Which stat produced it. */
  drivenBy: string;
  estimatedValue: 'low' | 'medium' | 'high';
}

export interface SimulationResult {
  sprintNumber: number;
  totalAttendance: number;
  /** Attendance-weighted mean, 0..100. */
  overallHappiness: number;
  segments: SegmentResult[];
  /** At most 3 per Sprint. */
  quotes: FeedbackQuote[];
  /** At most 2 per Sprint. */
  signals: Signal[];
  /** Attendance after word of mouth, for the next Sprint. */
  nextAttendance: Record<SegmentId, number>;
}

export interface SimulationConfig {
  segments: VisitorSegment[];
  /** Representative visitors simulated per segment, then scaled to attendance. */
  cohortSampleSize: number;
  /** Time spent using an amenity. */
  needServiceTimeCost: number;
  /** Happiness lost when a need cannot be met. */
  unmetNeedHappinessPenalty: number;
  /** Chance an unmet need ends the visit now. */
  unmetNeedLeaveChance: number;
  /** Joy multiplier for Comfort Seekers at non-accessible exhibits. */
  accessibilityPenalty: number;
  /** Joy multiplier given demand / capacity. */
  crowdingCurve: (load: number) => number;
  /** How strongly happiness moves next Sprint's attendance. */
  wordOfMouthWeight: number;
  /** Floor on word of mouth, as a fraction of base attendance. */
  wordOfMouthFloor: number;
  /** Per-game appeal noise (taste jitter), e.g. 0.15 for +/-15%. */
  tasteJitter: number;
  /** Per-game attendance mix drift, e.g. 0.2 for +/-20%. */
  attendanceDrift: number;
  /** Reference joy-per-visit used to normalise happiness to 0..100. */
  referenceAppeal: number;
}
