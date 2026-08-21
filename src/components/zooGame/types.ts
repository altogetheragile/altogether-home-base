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
  /** The toolbox template this came from (e.g. 'lion'), so the studio starts from the
   *  right species shape. */
  template?: string;
  /** For an ENCLOSURE draft: its footprint (habitat size). */
  enclosureSize?: 'small' | 'medium' | 'large';
  /** For an EXHIBIT draft: the id of the enclosure it lives in (chosen by the PO).
   *  Animals and enclosures are separate PBIs; this links an animal to a habitat. */
  enclosureId?: string;
}

export type ZooPhase = 'intro' | 'refine' | 'planning' | 'sprint' | 'review' | 'retro' | 'final';

/** The single-player AI Product Owner's refinement decisions (from the zoo-po-refine edge
 *  function). The PO orders by value, splits epics, adds items and clarifies acceptance -
 *  it never estimates effort (that is the Developers' job). */
export interface PoDecisions {
  rationale?: string;
  splitEpics?: { epicId: string; memberIds: string[] }[];
  order?: string[];
  newItems?: { name: string; category: 'exhibit' | 'amenity' | 'flora'; zone: string; services?: 'food' | 'toilet' | 'rest'; acceptance?: string[] }[];
  refine?: { id: string; acceptance: string[] }[];
}

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
/** epic = a themed area (e.g. Savanna) too big to build - it is REFINED by splitting it
 *  into smaller PBIs; enclosure = a habitat you build FIRST (its footprint and fences),
 *  then populate with animals; exhibit = an animal that lives inside an enclosure; amenity
 *  = a facility (cafe/toilets/seating); flora = scenery/planting. */
export type ItemCategory = 'epic' | 'enclosure' | 'exhibit' | 'amenity' | 'flora' | 'path';

/** One thing an epic contains, ready to be split out into its own PBI(s). An exhibit
 *  member becomes an enclosure PBI plus the animal PBI that lives in it (the dependency);
 *  an amenity member becomes a facility PBI. */
export interface EpicMember {
  id: string;
  name: string;
  kind: 'exhibit' | 'amenity';
  /** Exhibits: the species shape and its enclosure. */
  template?: string;
  appeal?: [number, number, number];
  enclosureId?: string;
  footprint?: 'small' | 'medium' | 'large';
  /** Exhibits: a bespoke name for the enclosure the split creates (else "<name> Enclosure"). */
  habitat?: string;
  /** Amenities: which need it serves. */
  services?: 'food' | 'toilet' | 'rest';
  /** Intended size in points (the hidden trueSize the estimate clusters around). */
  size: number;
}

export interface BacklogItem {
  id: string;
  name: string;
  /** Optional user story ("As a ... I want ... so that ...") - a richer way to
   *  express the item's value. The name stays as the short label. */
  story?: string;
  category: ItemCategory;
  /** Which themed zone this belongs to (Big Cats, Waterside, ...). */
  zone: string;
  /** The toolbox template this item was created from (e.g. 'lion'), used to pick its
   *  species shape in the studio. */
  template?: string;
  /** For an ENCLOSURE item: its footprint. The habitat is drawn at this size in the park
   *  and the animals inside it are rendered to scale, so you see animals in a space, not
   *  one giant one. Chosen when building the enclosure in the studio. */
  enclosureSize?: 'small' | 'medium' | 'large';
  /** For an EXHIBIT (animal): the id of the enclosure it lives in. The animal can only be
   *  built once that enclosure is built (Done), and it is drawn inside it in the park. */
  enclosureId?: string;
  /** For an EPIC: the things it contains, still to be split out into their own PBIs. An
   *  epic is refined (split), never built directly. */
  epicMembers?: EpicMember[];
  /** Free-placement position in the park, in fixed design-canvas px (the centre of the
   *  feature). Set by dragging on the Park tab. Unset = auto-laid-out in a default flow.
   *  Only top-level features carry a position (enclosures, amenities, flora); an animal
   *  moves with its enclosure. */
  pos?: { x: number; y: number };
  /** Estimate in points, the team's forecast from size and complexity. Meaningful
   *  once the item has been estimated (see `unsized`). */
  estimate: number;
  /** True until the team estimates it: an unsized item can't be planned yet - it
   *  must be refined (estimated) first. */
  unsized?: boolean;
  /** Set when an item carried over unfinished from a previous Sprint: it is re-opened for
   *  estimation so the team re-points the work that is LEFT before re-planning it. Cleared once
   *  re-estimated. Its build progress (design, plan) is kept. */
  carriedOver?: boolean;
  /** Hidden intended size; what planning poker clusters the cards around. */
  trueSize?: number;
  /** The Sprint this item was RELEASED in (opened to visitors). Usually the Sprint it was built
   *  in, but Done work can be released later - releasing is not gated by the Sprint Review - so
   *  the two can differ, and the board needs this to know what went live during this Sprint. */
  openedIn?: number;
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
  /** In-progress design saved while an item is still being built in the studio (before "Finish the
   *  build"), so partial work isn't lost when the studio closes or the Sprint rolls over. Cleared
   *  once the item is finished (its work becomes `design`). */
  draftDesign?: ItemDesign;
  /** The Developers' plan for how this item gets built: a decomposition into tasks,
   *  written during Sprint Planning (the "how") and ticked off as the work is done.
   *  The item reaches Done only when its design is built AND every task is ticked. */
  tasks?: SprintTask[];
  /** True once work has started (it moved from To Do into Doing and opened the studio).
   *  Keeps it in the Doing column while it is being built and its tasks ticked. */
  started?: boolean;
  /** True once a built item has been put on the park to place & size it, but before it is marked
   *  "Deploy complete". It shows on the park (so you can position it and confirm its placement
   *  acceptance criteria) while its card stays in Deploy - it isn't live to visitors until Done. */
  placed?: boolean;
  /** Marked at Planning as essential to the Sprint Goal. The Goal is met when the
   *  goal-critical items are delivered - you can drop the rest and still meet it. */
  goalCritical?: boolean;
  /** Ids of the Developers who have picked this item up to work on (self-managed - the
   *  Developers decide, no one assigns them). Drives the swarm/WIP teaching on the board. */
  assignedDevs?: string[];
  /** Set on a feedback-driven "Improve X" PBI: the id of the delivered item it improves.
   *  It carries a clone of that item's design; on delivery the design is applied back to the
   *  target (keeping its place) and this PBI is not rendered as a second feature. */
  enhancesId?: string;
  /** Position WITHIN a parent enclosure, as 0..1 fractions of the habitat box. Set when an
   *  animal (or nested plant) is dragged to a spot inside its enclosure; unset = auto-arranged. */
  spot?: { x: number; y: number };
  /** Extra placements of the same delivered scenery: one "Signposts" PBI is a set of signs, not a
   *  single sign, so it can be put down as many times as the acceptance criteria need. Each entry is
   *  a position on the park; the first one is the item's own `pos`. */
  copies?: { x: number; y: number }[];
  /** How far a landscape feature is turned on the park, in degrees clockwise (0 = running across).
   *  Lets a river or a bridge run up and down, or on the diagonal, instead of only side to side. */
  rot?: number;
  /** Footprint size on the park, in design px - set by resizing a landscape feature (a river you
   *  stretch across the park). Like `pos`, it's spatial arrangement, not a design change. */
  size?: { w: number; h: number };
  /** Which acceptance criteria the player has confirmed, index-aligned with `acceptance`. Build-time
   *  ACs are ticked in the studio; deploy-time ACs (sizing/placement) are ticked on the park when the
   *  item is placed & sized. undefined = none confirmed yet. */
  acConfirmed?: boolean[];
  // Exhibits:
  appeal?: Record<SegmentId, number>;
  capacity?: number;
  // Amenities:
  services?: 'food' | 'toilet' | 'rest';
  serviceCapacity?: number;
}

/** A hand-drawn park path: a polyline of points in the park's design-pixel space. Its
 *  surface follows the global pathStyle; it renders alongside the auto-drawn routes.
 *  Legacy - superseded by connectors; kept so old saved games still deserialise. */
export interface ZooPath {
  id: string;
  points: { x: number; y: number }[];
}

/** One end of a connector. If `featureId` is set the end is ATTACHED to that feature and follows
 *  it (x,y is a fallback); otherwise it is a free point at (x,y) in the park's design pixels. */
export interface ConnectorEnd { featureId?: string; x: number; y: number }

/** A manual path connector the user draws on the Park: two ends (each attached to a feature or
 *  free), optional bend points between them, and its own thickness and colour. Attached ends
 *  reflow when the feature moves. */
export interface ZooConnector {
  id: string;
  a: ConnectorEnd;
  b: ConnectorEnd;
  bends: { x: number; y: number }[];
  thickness: number;
  color: string;
}

/** One member of the Scrum Team. A `seat` a real person could take in a future multiplayer
 *  mode - kept as a first-class entity with a stable id, not just a label. */
export interface ScrumTeamMember { id: string; name: string }
/** The one Scrum Team: a single Product Owner (accountable for value), a single Scrum Master
 *  (a true leader who serves the team, causes impediments to be removed, coaches
 *  self-management) and the Developers (who build the Increment). Ten or fewer, no sub-teams. */
export interface ScrumTeam { productOwner: ScrumTeamMember; scrumMaster: ScrumTeamMember; developers: ScrumTeamMember[] }

export interface ZooGameState {
  phase: ZooPhase;
  /** The one Scrum Team - the accountabilities made visible (PO, Scrum Master, Developers). */
  team: ScrumTeam;
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
  /** The team's agreement about what makes an item ready to forecast. Editable, like the DoD. */
  definitionOfReady: string[];
  /** How many Sprints the Product Owner has cancelled. Rare, and worth remembering at the Retro. */
  sprintsCancelled: number;
  /** Visitor happiness at each Sprint Review, so the Product Goal's progress has a trend. */
  happiness: number[];
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
  /** The capacity forecast the team used when it committed the current Sprint (the empirical
   *  guide, not a cap). Shown against actual delivery at the Review, so the feedback is explicit. */
  sprintForecast: number;
  /** The Sprint burndown: committed points still remaining, sampled per day (index 0 = the full
   *  commitment at Planning, then one entry as each day ends). Drives the burndown chart. */
  burndown: number[];
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
  /** Max items allowed in Doing at once - a WIP limit. Tightened by the "finish fewer"
   *  Retrospective improvement, so a chosen improvement has a real, mechanical effect. */
  wipLimit: number;
  /** Set by the "hold the Daily Scrum every day" improvement: disciplined Daily Scrums
   *  become efficient, so holding one costs no build time. */
  scrumDiscipline: boolean;
  /** Learn mode: pause the day clock so there is no real-time pressure - days end only
   *  when you choose. The timed mode teaches Sprint pressure; this is the reflective one. */
  learnMode: boolean;
  /** Teaching on: the one-page intro and the in-context cards. A learner who has just had the taught
   *  session can turn it off, and back on from the Scrum reference. */
  teaching: boolean;
  /** Cards already read, so each is shown once and survives save and resume. */
  taught: string[];
  /** When the Daily Scrum is held: at the START of each day (Scrum's usual cadence) or at
   *  the END. Chosen by the team; the same event either way, just timed differently. */
  dailyScrumAt: 'start' | 'end';
  /** Seconds of the CURRENT day already spent on Backlog refinement (estimating, splitting,
   *  adding/refining PBIs) while a Sprint is running - it eats into the build clock. Resets
   *  each day. Refinement in the Refinement/Planning phases is free (0 here). */
  refinePenalty: number;
  /** The Sprint length each recorded velocity was measured at, alongside `velocity`. Changing the
   *  Sprint length makes earlier figures incomparable, and this is how the game knows. */
  velocityDays?: number[];
  /** Decided at Sprint Planning topic three: the Scrum Team has set time aside in THIS Sprint to
   *  refine the Product Backlog, so every day of it starts with some of the clock already spent. */
  plannedRefinement?: boolean;
  /** Refinement planned INTO this Sprint at topic three: an estimated piece of work in the plan,
   *  not a flag. It takes capacity like anything else, it sits on the board, and it is not Done
   *  until the Scrum Team has actually held it. */
  sprintRefinement?: { points: number; done: boolean };
  /** Whether the Scrum Team has looked at the Definition of Done and agreed it. Nothing can be Done
   *  against a bar nobody has read, so the first Sprint does not start until they have. */
  dodAgreed?: boolean;
  /** The look of the park paths/roads: a key into PATH_STYLES (surface + colour). The
   *  entrance promenade and the spurs to each enclosure both use it, so they stay consistent.
   *  Defaults to 'gravel'. Older saves without it fall back to the default at render time. */
  pathStyle: string;
  /** How the auto-drawn paths route from each enclosure to the entrance promenade:
   *  'straight' (a spur straight down), 'elbow' (drop to a shared boulevard, then in),
   *  'spine' (a central avenue with a branch to each), or 'none' (no auto-paths - draw your
   *  own). Defaults to 'straight'. */
  pathRoute: 'straight' | 'elbow' | 'spine' | 'none';
  /** Legacy hand-drawn paths (superseded by connectors). Kept for old-save compatibility. */
  paths: ZooPath[];
  /** Manual connectors drawn on the Park: attach an enclosure/building to another (or to a free
   *  point), route them by hand, and style each. Persist with the game. */
  connectors: ZooConnector[];
}

export type ZooAction =
  | { type: 'START'; gameSeed?: number }
  | { type: 'SET_PHASE'; phase: ZooPhase }
  | { type: 'SET_PRODUCT_GOAL'; goal: string }
  | { type: 'SET_SPRINT_GOAL'; goal: string }
  | { type: 'SET_DOD'; dod: string[] }
  | { type: 'ACCEPT_SIGNAL'; index: number }
  | { type: 'PLAN_SPRINT'; ids: string[]; refinementPoints?: number }
  | { type: 'HOLD_REFINEMENT' }
  | { type: 'AGREE_DOD' }
  | { type: 'PLAN_ITEM_SHAPE'; id: string; patch: { enclosureSize?: 'small' | 'medium' | 'large'; enclosureId?: string; template?: string } }
  | { type: 'START_ITEM_AT'; id: string; pos: { x: number; y: number } }
  | { type: 'ESTIMATE_ITEM'; id: string; points: number }
  | { type: 'SET_TASKS'; id: string; tasks: SprintTask[] }
  | { type: 'TOGGLE_TASK'; id: string; taskId: string }
  | { type: 'CONFIRM_AC'; id: string; index: number; value: boolean }
  | { type: 'SET_DRAFT_DESIGN'; id: string; design: ItemDesign }
  | { type: 'PLACE_ON_PARK'; id: string }
  | { type: 'START_ITEM'; id: string }
  | { type: 'TOGGLE_GOAL_CRITICAL'; id: string }
  | { type: 'SET_SPRINT_DAYS'; days: number }
  | { type: 'SET_LEARN_MODE'; on: boolean }
  | { type: 'SET_SCRUM_AT'; at: 'start' | 'end' }
  | { type: 'SET_ENCLOSURE'; id: string; size: 'small' | 'medium' | 'large' }
  | { type: 'SET_POS'; id: string; pos: { x: number; y: number } }
  | { type: 'SPLIT_EPIC'; id: string; memberIds: string[] }
  | { type: 'ADD_PBI'; draft: PbiDraft }
  | { type: 'REFINE_PBI'; id: string; draft: PbiDraft }
  | { type: 'MOVE_ITEM'; id: string; dir: 'up' | 'down' }
  | { type: 'MOVE_ITEM_BEFORE'; id: string; beforeId: string }
  | { type: 'MOVE_SPRINT_ITEM'; id: string; dir: 'up' | 'down' }
  | { type: 'MOVE_FORECAST_ITEM'; id: string; dir: 'up' | 'down'; picked: string[] }
  | { type: 'SET_ROT'; id: string; rot: number }
  | { type: 'CANCEL_SPRINT' }
  | { type: 'SET_WIP_LIMIT'; limit: number }
  | { type: 'SET_TEACHING'; on: boolean }
  | { type: 'MARK_TAUGHT'; id: string }
  | { type: 'SET_DOR'; dor: string[] }
  | { type: 'ADD_COPY'; id: string; pos: { x: number; y: number } }
  | { type: 'MOVE_COPY'; id: string; index: number; pos: { x: number; y: number } }
  | { type: 'REMOVE_COPY'; id: string; index: number }
  | { type: 'SET_USE_USER_STORIES'; on: boolean }
  | { type: 'MOVE_TO_ZONE'; id: string; zone: string }
  | { type: 'ADD_ZONE'; name: string }
  | { type: 'RENAME_ZONE'; oldName: string; newName: string }
  | { type: 'REORDER_IN_ZONE'; id: string; dir: 'up' | 'down' }
  | { type: 'MOVE_ZONE'; zone: string; dir: 'up' | 'down' }
  | { type: 'DELETE_PBI'; id: string }
  | { type: 'DUPLICATE_PBI'; id: string }
  | { type: 'ASSIGN_DEV'; itemId: string; devId: string }
  | { type: 'RENAME_MEMBER'; memberId: string; name: string }
  | { type: 'SET_PATH_STYLE'; style: string }
  | { type: 'SET_PATH_ROUTE'; route: 'straight' | 'elbow' | 'spine' | 'none' }
  | { type: 'ADD_PATH'; points: { x: number; y: number }[] }
  | { type: 'DELETE_PATH'; id: string }
  | { type: 'CLEAR_PATHS' }
  | { type: 'ADD_CONNECTOR'; connector: ZooConnector }
  | { type: 'UPDATE_CONNECTOR'; id: string; patch: Partial<ZooConnector> }
  | { type: 'DELETE_CONNECTOR'; id: string }
  | { type: 'PULL_ITEM'; id: string }
  | { type: 'BUILD_ITEM'; id: string; design?: ItemDesign }
  | { type: 'EDIT_ITEM'; id: string; design: ItemDesign }
  | { type: 'ADD_ANOTHER'; id: string }
  | { type: 'IMPROVE_ITEM'; id: string }
  | { type: 'SET_ITEM_SPOT'; id: string; spot: { x: number; y: number } }
  | { type: 'SET_ITEM_SIZE'; id: string; size: { w: number; h: number } }
  | { type: 'NEST_ITEM'; id: string; enclosureId: string; spot: { x: number; y: number } }
  | { type: 'UNNEST_ITEM'; id: string }
  | { type: 'RENAME_ITEM'; id: string; name: string }
  | { type: 'OPEN_ITEM'; id: string }
  | { type: 'END_DAY' }
  | { type: 'RUN_DAILY_SCRUM' }
  | { type: 'SKIP_DAILY_SCRUM' }
  | { type: 'START_DAY' }
  | { type: 'REVIEW_SPRINT' }
  | { type: 'NEXT_SPRINT'; improvement: string }
  | { type: 'END_GAME' }
  | { type: 'LOAD_GAME'; state: ZooGameState }
  | { type: 'PO_REFINE'; decisions: PoDecisions }
  | { type: 'RESET' };
