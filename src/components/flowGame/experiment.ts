// WIP sweep experiment (the "find the sweet spot" lab). Because both rounds
// share a fixed seed, luck is held constant and only the WIP limit changes - so
// the difference in outcome is attributable to the limit, not variance. We
// auto-play the same scenario at each WIP limit with a sensible greedy policy
// and read off the curve: cycle time falls as WIP drops, until the limit starves
// the team and throughput collapses. The sweet spot is the lowest WIP that still
// keeps throughput near its max.

import type { RoundMetrics, RoundState, WorkItem, Specialism, ColumnId, WorkerAssignment } from './types';
import { createItems, simulateDay, applyDayBlockers, calculateMetrics } from './engine';
import { WORKERS, DAYS_PER_ROUND, FLOW_SEED, stageOf, laneOf, pullTarget, stageCount, DEFAULT_WORKFLOW } from './config';

const STAGES = DEFAULT_WORKFLOW.stages;

export interface SweepPoint {
  wipLimit: number;
  averageCycleTime: number;
  throughputRate: number;
  averageWip: number;
  totalCompleted: number;
}

const move = (item: WorkItem, dest: ColumnId, day: number): WorkItem => ({
  ...item,
  column: dest,
  startDay: item.column === 'backlog' ? day : item.startDay,
  endDay: dest === 'done' ? day : item.endDay,
});

/** Auto-play one full round at a uniform per-stage WIP limit and return its
 *  metrics. Greedy policy: pull downstream-first (so capacity frees before it's
 *  refilled), then assign each worker to work in their own specialism first,
 *  otherwise to any active card with work. Deterministic for a given seed. */
export function autoPlayRound(wipLimit: number, enforce = true, seed = FLOW_SEED): RoundMetrics {
  const limits: Record<Specialism, number> = { analysis: wipLimit, development: wipLimit, test: wipLimit };
  let items = createItems(false, STAGES);
  const dayHistory = [];

  const roundShape = (day: number, assignments: WorkerAssignment[]): RoundState => ({
    roundNumber: 1,
    day,
    items,
    assignments,
    dayHistory: [],
    wipLimits: limits,
    enforceWip: enforce,
    maximizeWip: false,
    seed,
    dayPhase: 'assign',
    newBlockers: [],
    workers: WORKERS,
    stages: STAGES,
  });

  for (let day = 1; day <= DAYS_PER_ROUND; day++) {
    // Pull downstream-first, mirroring the reducer's pull rules.
    const pull = (fromCol: (i: WorkItem) => boolean) => {
      for (const it of items.filter(fromCol)) {
        const dest = pullTarget(it.column, STAGES);
        if (!dest) continue;
        const ds = stageOf(dest);
        if (enforce && ds && stageCount(items, ds) >= limits[ds]) continue;
        items = items.map((i) => (i.id === it.id ? move(i, dest, day) : i));
      }
    };
    // Test finishes straight to Done in simulateDay, so there is no test-done to pull.
    pull((i) => i.column === 'development-done');
    pull((i) => i.column === 'analysis-done');
    pull((i) => i.column === 'backlog');

    // Assign: specialists to their own stage's work first, then anyone to any work.
    const assignments: WorkerAssignment[] = [];
    const taken = new Set<string>();
    const workable = (i: WorkItem, s: Specialism) => i.blocked || i.effortRemaining[s] > 0;
    for (const w of WORKERS) {
      const own = items.find((i) => laneOf(i.column) === 'active' && stageOf(i.column) === w.specialism && !taken.has(i.id) && workable(i, w.specialism));
      const any = own ?? items.find((i) => laneOf(i.column) === 'active' && !taken.has(i.id) && workable(i, stageOf(i.column)!));
      if (any) { assignments.push({ workerId: w.id, cardId: any.id }); taken.add(any.id); }
    }

    const { items: after, summary } = simulateDay(roundShape(day, assignments));
    items = after;
    dayHistory.push(summary);

    if (day < DAYS_PER_ROUND) {
      const { items: blocked } = applyDayBlockers({ ...roundShape(day + 1, []), items: items.map((i) => ({ ...i })) });
      items = blocked;
    }
  }

  return calculateMetrics(dayHistory, items, DAYS_PER_ROUND, STAGES);
}

/** Sweep the WIP limit across [min, max] (inclusive), auto-playing each. */
export function sweepWipLimit(min = 1, max = 8): SweepPoint[] {
  const points: SweepPoint[] = [];
  for (let wip = min; wip <= max; wip++) {
    const m = autoPlayRound(wip, true);
    points.push({
      wipLimit: wip,
      averageCycleTime: m.averageCycleTime,
      throughputRate: m.throughputRate,
      averageWip: m.averageWip,
      totalCompleted: m.totalCompleted,
    });
  }
  return points;
}

/** The sweet spot: the LOWEST WIP limit that still delivers throughput within
 *  `tolerance` of the sweep's best. Below it you starve the team (throughput
 *  drops); above it cycle time grows for no throughput gain. */
export function findSweetSpot(sweep: SweepPoint[], tolerance = 0.05): SweepPoint | null {
  if (sweep.length === 0) return null;
  const maxThroughput = Math.max(...sweep.map((p) => p.throughputRate));
  if (maxThroughput <= 0) return null;
  const threshold = maxThroughput * (1 - tolerance);
  const byWip = [...sweep].sort((a, b) => a.wipLimit - b.wipLimit);
  return byWip.find((p) => p.throughputRate >= threshold) ?? null;
}
