import type { ColumnDef, ColumnId, Lane, WorkerDef, WorkItemDef, Specialism } from './types';

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

/** Where a PULLABLE item goes next (player-driven). null = not pullable. */
export function pullTarget(col: ColumnId): ColumnId | null {
  switch (col) {
    case 'backlog': return 'analysis-active';
    case 'analysis-done': return 'development-active';
    case 'development-done': return 'test-active';
    case 'test-done': return 'done';
    default: return null; // active lanes & done are not pullable
  }
}
/** Count of items in a stage (both lanes) — what the WIP limit caps. */
export function stageCount(items: { column: ColumnId }[], stage: Specialism): number {
  return items.filter((i) => stageOf(i.column) === stage).length;
}

/** The column an item must be pulled FROM to fill a given stage's Active lane. */
const UPSTREAM: Record<Specialism, ColumnId> = {
  analysis: 'backlog',
  development: 'analysis-done',
  test: 'development-done',
};

/** TWiG "Maximize WIP": a stage that's below its limit while upstream work is
 *  waiting — i.e. capacity left idle. Returns the first such stage, or null. */
export function underfilledStage(
  items: { column: ColumnId }[],
  wipLimits: Record<Specialism, number> | null,
): Specialism | null {
  if (!wipLimits) return null;
  for (const stage of ACTIVE_COLUMNS) {
    const below = stageCount(items, stage) < wipLimits[stage];
    const upstreamHasWork = items.some((i) => i.column === UPSTREAM[stage]);
    if (below && upstreamHasWork) return stage;
  }
  return null;
}

// ============= Workers =============

export const WORKERS: WorkerDef[] = [
  { id: 'w1', name: 'Alex', initials: 'AL', specialism: 'analysis' },
  { id: 'w2', name: 'Sam', initials: 'SA', specialism: 'analysis' },
  { id: 'w3', name: 'Jordan', initials: 'JO', specialism: 'development' },
  { id: 'w4', name: 'Casey', initials: 'CA', specialism: 'development' },
  { id: 'w5', name: 'Taylor', initials: 'TA', specialism: 'test' },
  { id: 'w6', name: 'Morgan', initials: 'MO', specialism: 'test' },
];

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

// ============= Work Items =============

function makeItem(index: number): WorkItemDef {
  // Vary effort to create realistic variability
  const patterns: [number, number, number][] = [
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
  const [a, d, t] = patterns[index % patterns.length];
  return {
    id: `item-${index + 1}`,
    title: `Work Item ${index + 1}`,
    effort: { analysis: a, development: d, test: t },
  };
}

export const WORK_ITEMS: WorkItemDef[] = Array.from({ length: ITEMS_PER_ROUND }, (_, i) => makeItem(i));

export const DEFAULT_WIP_LIMITS: Record<Specialism, number> = {
  analysis: 3,
  development: 3,
  test: 3,
};
