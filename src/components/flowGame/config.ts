import type { ColumnDef, ColumnId, Lane, WorkerDef, WorkItemDef, Specialism, Workflow, StageDef, StartScenario, Criterion, WorkItem } from './types';

// ============= Columns =============

export const COLUMNS: ColumnDef[] = [
  { id: 'backlog', label: 'Backlog', type: 'queue' },
  { id: 'analysis-active', label: 'Analysis', type: 'active' },
  { id: 'analysis-done', label: 'Analysis Done', type: 'active' },
  { id: 'development-active', label: 'Development', type: 'active' },
  { id: 'development-done', label: 'Development Done', type: 'active' },
  { id: 'test-active', label: 'Test', type: 'active' },
  { id: 'test-done', label: 'Test Done', type: 'active' },
  { id: 'done', label: 'Done', type: 'output' },
];

export const ACTIVE_COLUMNS: Specialism[] = ['analysis', 'development', 'test'];

// Board layout: Backlog, three two-lane stages, then Done.
export const STAGES: { stage: Specialism; label: string }[] = [
  { stage: 'analysis', label: 'Analysis' },
  { stage: 'development', label: 'Development' },
  { stage: 'test', label: 'Test' },
];

// ── Exit criteria (column quality gates; reused as the Scrum DoD) ──

/** Domain-neutral default exit criteria for a stage - the quality bar to leave
 *  it. Deliberately generic so any team (not just software) sees language that
 *  fits; the player edits them (the "write your own" exercise). Ids are prefixed
 *  by stage so they stay unique across the board. */
export function defaultExitCriteria(stageId: Specialism): Criterion[] {
  return [
    { id: `${stageId}-reviewed`, label: 'A second person has reviewed it' },
    { id: `${stageId}-accepted`, label: 'Meets the agreed acceptance criteria' },
  ];
}

/** A fresh unique criterion id for a stage (editor "add criterion"). */
export function nextCriterionId(stageId: Specialism, existing: Criterion[]): string {
  const ids = new Set(existing.map((c) => c.id));
  let n = existing.length + 1;
  while (ids.has(`${stageId}-c${n}`)) n++;
  return `${stageId}-c${n}`;
}

/** Whether an item has met every exit criterion of the given stage. A stage with
 *  no criteria is always "met" (no gate). */
export function exitCriteriaMet(item: WorkItem, stage: StageDef | undefined): boolean {
  if (!stage || stage.exitCriteria.length === 0) return true;
  const met = new Set(item.metCriteria);
  return stage.exitCriteria.every((c) => met.has(c.id));
}

// ── Column helpers (pure) ──
export function stageOf(col: ColumnId): Specialism | null {
  if (col === 'backlog' || col === 'done') return null;
  return col.split('-')[0] as Specialism;
}
export function laneOf(col: ColumnId): Lane | null {
  if (col === 'backlog' || col === 'done') return null;
  return col.endsWith('-active') ? 'active' : 'done';
}
export const colId = (stage: Specialism, lane: Lane): ColumnId => `${stage}-${lane}` as ColumnId;

/** Index of a stage in the ordered pipeline (-1 if unknown). */
export const stageIndex = (stageId: Specialism, stages: StageDef[]): number =>
  stages.findIndex((s) => s.id === stageId);

/** The last stage completes straight to Done (no Done lane). */
export const isLastStage = (stageId: Specialism, stages: StageDef[]): boolean =>
  stages.length > 0 && stages[stages.length - 1].id === stageId;

/** The column an item is pulled FROM to fill a stage's Active lane: the backlog
 *  for the first stage, otherwise the previous stage's Done lane. */
export function upstreamOf(stageId: Specialism, stages: StageDef[]): ColumnId {
  const idx = stageIndex(stageId, stages);
  if (idx <= 0) return 'backlog';
  return colId(stages[idx - 1].id, 'done');
}

/** Where a PULLABLE item goes next (player-driven). null = not pullable.
 *  backlog -> first stage's Active; a stage's Done -> next stage's Active, or
 *  Done for the last stage. Active lanes and Done are not pullable. */
export function pullTarget(col: ColumnId, stages: StageDef[]): ColumnId | null {
  if (col === 'backlog') return stages.length ? colId(stages[0].id, 'active') : null;
  if (col === 'done' || laneOf(col) !== 'done') return null;
  const idx = stageIndex(stageOf(col)!, stages);
  if (idx < 0) return null;
  return idx === stages.length - 1 ? 'done' : colId(stages[idx + 1].id, 'active');
}
/** Count of items in a stage (both lanes) — what the WIP limit caps. */
export function stageCount(items: { column: ColumnId }[], stage: Specialism): number {
  return items.filter((i) => stageOf(i.column) === stage).length;
}

/** TWiG "Maximize WIP": a stage that's below its limit while upstream work is
 *  waiting — i.e. capacity left idle. Returns the first such stage, or null. */
export function underfilledStage(
  items: { column: ColumnId }[],
  wipLimits: Record<Specialism, number> | null,
  stages: StageDef[],
): Specialism | null {
  if (!wipLimits) return null;
  for (const s of stages) {
    const below = stageCount(items, s.id) < wipLimits[s.id];
    const upstreamHasWork = items.some((i) => i.column === upstreamOf(s.id, stages));
    if (below && upstreamHasWork) return s.id;
  }
  return null;
}

/** The bottleneck stage: one that's at/over its WIP limit while FINISHED upstream
 *  work is piling up in the Done lane in front of it (it can't pull more, so flow
 *  stalls there). Returns the stage with the largest such queue, or null. The
 *  first stage is fed by the backlog (raw demand), so it is never a bottleneck. */
export function bottleneckStage(
  items: { column: ColumnId }[],
  wipLimits: Record<Specialism, number> | null,
  stages: StageDef[],
): Specialism | null {
  if (!wipLimits) return null;
  let best: Specialism | null = null;
  let bestQueue = 0;
  for (let idx = 1; idx < stages.length; idx++) {
    const s = stages[idx];
    const feed = colId(stages[idx - 1].id, 'done');
    const full = stageCount(items, s.id) >= wipLimits[s.id];
    const queue = items.filter((i) => i.column === feed).length;
    if (full && queue > bestQueue) {
      best = s.id;
      bestQueue = queue;
    }
  }
  return best;
}

// ── Stage visuals (dynamic palette) ──
const STAGE_PALETTE = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-lime-500', 'bg-orange-500',
];
/** A stable colour class for a stage, by its position in the pipeline. The
 *  default three stages keep blue / emerald / amber. */
export function stageColor(stageId: Specialism, stages: StageDef[]): string {
  const idx = stageIndex(stageId, stages);
  return STAGE_PALETTE[(idx >= 0 ? idx : 0) % STAGE_PALETTE.length];
}
/** Short label for effort pips - first letter of the stage name (A/D/T default). */
export const stageShort = (stage: StageDef): string => (stage.name[0] ?? '?').toUpperCase();

// ============= Workers =============

export const WORKERS: WorkerDef[] = [
  { id: 'w1', name: 'Alex', initials: 'AL', specialism: 'analysis' },
  { id: 'w2', name: 'Sam', initials: 'SA', specialism: 'analysis' },
  { id: 'w3', name: 'Jordan', initials: 'JO', specialism: 'development' },
  { id: 'w4', name: 'Casey', initials: 'CA', specialism: 'development' },
  { id: 'w5', name: 'Taylor', initials: 'TA', specialism: 'test' },
  { id: 'w6', name: 'Morgan', initials: 'MO', specialism: 'test' },
];

/** First names offered, in order, when adding a teammate in the editor - real
 *  names (starting with the default six) so a new person reads as "Robin", not
 *  "Teammate 7", and gets a distinct badge. Gender-neutral and distinct-initial
 *  where possible. */
export const WORKER_NAME_POOL = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Taylor', 'Morgan',
  'Robin', 'Riley', 'Jamie', 'Quinn', 'Avery', 'Drew',
  'Reese', 'Emerson', 'Finley', 'Harper', 'Rowan', 'Parker',
  'Charlie', 'Frankie', 'Kai', 'Sage', 'Blake', 'Devon',
];

/** The next unused first name from the pool for a fresh teammate, or a plain
 *  "Teammate N" once the pool is exhausted. Compared case-insensitively so a
 *  renamed clash is still skipped. */
export function nextWorkerName(existing: WorkerDef[]): string {
  const taken = new Set(existing.map((w) => w.name.trim().toLowerCase()));
  const free = WORKER_NAME_POOL.find((n) => !taken.has(n.toLowerCase()));
  return free ?? `Teammate ${existing.length + 1}`;
}

/** A hyphen-free unique worker id (`w1`, `w2`, ...). */
export function nextWorkerId(existing: WorkerDef[]): string {
  const ids = new Set(existing.map((w) => w.id));
  let n = existing.length + 1;
  while (ids.has(`w${n}`)) n++;
  return `w${n}`;
}

/** Two-character badge for a worker: first letters of the first and last words
 *  for a multi-word name ("Mary Jane" -> MJ, "Teammate 7" -> T7), or the first
 *  two letters of a single word ("Alex" -> AL). Keeps badges distinct. */
export function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A fresh teammate with a real name, matching badge, and a valid specialism. */
export function makeWorker(existing: WorkerDef[], stages: StageDef[]): WorkerDef {
  const name = nextWorkerName(existing);
  return { id: nextWorkerId(existing), name, initials: toInitials(name), specialism: stages[0]?.id ?? 'stage1' };
}

/** Normalise an edited roster: non-empty names, fresh initials, and every worker
 *  pinned to a stage that still exists (its stage may have been deleted). */
export function normalizeWorkers(workers: WorkerDef[], stages: StageDef[]): WorkerDef[] {
  const stageIds = new Set(stages.map((s) => s.id));
  const fallback = stages[0]?.id ?? 'stage1';
  return workers.map((w, i) => {
    const name = w.name.trim() || `Teammate ${i + 1}`;
    return { id: w.id, name, initials: toInitials(name), specialism: stageIds.has(w.specialism) ? w.specialism : fallback };
  });
}

/** The default board: the standard three stages and six-person team. A game
 *  starts from this and (later) the player can edit it. */
export const DEFAULT_WORKFLOW: Workflow = {
  // No exit criteria by default: a basic game is uncluttered. A player adds them
  // (per stage, or via "Use suggested") in the editor to bring in that realism.
  stages: STAGES.map((s) => ({ id: s.stage, name: s.label, exitCriteria: [] })),
  workers: WORKERS,
};

/** Effectiveness multiplier when working outside specialism */
export const OFF_SPEC_MULTIPLIER = 0.6;

/** Blocker chance per in-progress item each day */
export const BLOCKER_CHANCE = 0.12;

/** Effort to clear a blocker, by column */
export const BLOCKER_EFFORT: Record<Specialism, number> = {
  analysis: 3,
  development: 4,
  test: 3,
};

export const DAYS_PER_ROUND = 20;
export const ITEMS_PER_ROUND = 20;

/** Shared RNG seed for both rounds — fixes the variability so the WIP-limit
 *  effect, not luck, drives the difference between Round 1 and Round 2. */
export const FLOW_SEED = 0x9e3779b1;

// ============= Work Items =============

// Effort profiles that give items realistic variability. Each triple is read
// against the pipeline position (stage 0, 1, 2); boards with more than three
// stages cycle back through the triple, fewer stages take the leading entries.
const EFFORT_PATTERNS: [number, number, number][] = [
  [4, 8, 4],   // dev-heavy
  [6, 6, 6],   // balanced
  [8, 4, 6],   // analysis-heavy
  [4, 6, 8],   // test-heavy
  [5, 10, 5],  // big dev
  [3, 5, 3],   // small
  [6, 8, 4],   // analysis+dev
  [4, 4, 8],   // test-heavy
  [7, 7, 7],   // large balanced
  [3, 3, 3],   // quick
];

/** Deterministic per-stage effort for a work item, keyed by the configured
 *  stage ids. With the default three stages this reproduces the original
 *  analysis/development/test effort exactly; extra stages get real work so a
 *  custom pipeline is not a free pass-through. */
export function itemEffort(index: number, stages: StageDef[]): Record<Specialism, number> {
  const pattern = EFFORT_PATTERNS[index % EFFORT_PATTERNS.length];
  return Object.fromEntries(stages.map((s, si) => [s.id, pattern[si % pattern.length]]));
}

function makeItem(index: number): WorkItemDef {
  return {
    id: `item-${index + 1}`,
    title: `Work Item ${index + 1}`,
    effort: itemEffort(index, STAGES.map((s) => ({ id: s.stage, name: s.label, exitCriteria: [] }))),
  };
}

export const WORK_ITEMS: WorkItemDef[] = Array.from({ length: ITEMS_PER_ROUND }, (_, i) => makeItem(i));

export const DEFAULT_WIP_LIMITS: Record<Specialism, number> = {
  analysis: 3,
  development: 3,
  test: 3,
};

/** Starting WIP limit for every configured stage: the known default for the
 *  built-in stages, and a sensible 3 for any custom stage the player adds. Keyed
 *  by stage id so a renamed or added stage still gets a limit (and its inline
 *  −/+ editor) rather than being left uncapped. */
export function defaultWipLimits(stages: StageDef[]): Record<Specialism, number> {
  return Object.fromEntries(stages.map((s) => [s.id, DEFAULT_WIP_LIMITS[s.id] ?? 3]));
}

/** The WIP limits a round starts with. A player-chosen set (Round 2) always wins.
 *  Round 1 begins "without constraints" - no WIP limits (null) - for a blank board
 *  (start fresh, no discipline yet) or a struggling team (in trouble precisely
 *  because it never limited WIP). Only a healthy team, which is doing OK because it
 *  IS disciplined, starts with its per-stage limits. */
export function initialWipLimits(
  roundNumber: 1 | 2,
  scenario: StartScenario,
  stages: StageDef[],
  provided?: Record<Specialism, number>,
): Record<Specialism, number> | null {
  if (provided) return provided;
  if (roundNumber === 1 && scenario !== 'healthy') return null;
  return defaultWipLimits(stages);
}
