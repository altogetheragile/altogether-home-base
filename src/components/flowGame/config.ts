import type { ColumnDef, WorkerDef, WorkItemDef, Specialism } from './types';

// ============= Columns =============

export const COLUMNS: ColumnDef[] = [
  { id: 'backlog', label: 'Backlog', type: 'queue' },
  { id: 'analysis', label: 'Analysis', type: 'active' },
  { id: 'development', label: 'Development', type: 'active' },
  { id: 'test', label: 'Test', type: 'active' },
  { id: 'done', label: 'Done', type: 'output' },
];

export const ACTIVE_COLUMNS: Specialism[] = ['analysis', 'development', 'test'];

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
