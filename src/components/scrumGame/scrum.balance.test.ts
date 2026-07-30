import { describe, it, expect } from 'vitest';
import { initialScrumState, sprintCapacity } from './config';
import {
  planSprint, sprintStories, assignDev, clearImpediment, runSprintDay, isSprintOver,
  deliveredPoints, reviewSprint, sprintGoalMet, estimateStory,
} from './engine';
import type { ScrumState } from './types';

/** Balance is about capacity, not estimation, so start from a fully-sized Backlog:
 *  size every un-estimated item accurately (estimate = its real effort), leaving the
 *  points-equal-effort world these scenarios were tuned against. */
const estimateAllAccurately = (s: ScrumState): ScrumState =>
  s.productBacklog.filter((x) => !x.estimated).reduce((acc, x) => estimateStory(acc, x.id, x.trueEffort), s);

/** A "good play" autopilot: each Daily Scrum optionally clears the impediment,
 *  then the whole team swarms the single nearest-to-done committed story (minimum
 *  WIP), finishing it before moving on. Done work meets the DoD and is the
 *  Increment. Returns delivered points and Goal status. */
function playSprintSwarm(state: ScrumState, clearImp: boolean): { delivered: number; met: boolean } {
  let s = state;
  const n = s.currentSprint!.number;
  while (s.currentSprint && !isSprintOver(s.currentSprint)) {
    if (clearImp) s = clearImpediment(s);
    const target = sprintStories(s, n)
      .filter((x) => x.status !== 'done')
      .sort((a, b) => a.effortRemaining - b.effortRemaining)[0];
    if (target) for (const d of s.team) s = assignDev(s, d.id, target.id);
    s = runSprintDay(s);
  }
  const delivered = deliveredPoints(s, n);
  s = reviewSprint(s);
  return { delivered, met: sprintGoalMet(s, n) };
}

/** Commit stories greedily (in backlog order) up to a points budget. */
function commitUpTo(state: ScrumState, budget: number): string[] {
  const ids: string[] = [];
  let sum = 0;
  for (const s of state.productBacklog.filter((x) => x.status === 'backlog')) {
    if (sum + s.points <= budget) { ids.push(s.id); sum += s.points; }
  }
  return ids;
}

describe('balance: the 2-week Sprint has teeth', () => {
  const base = estimateAllAccurately(initialScrumState());
  const cap = sprintCapacity([], base.team.length, base.sprintLength);

  it('a right-sized, well-swarmed Sprint meets its Goal', () => {
    const right = playSprintSwarm(planSprint(base, 'right', commitUpTo(base, cap)), true);
    expect(right.met).toBe(true);
    expect(right.delivered).toBeGreaterThanOrEqual(cap * 0.7);
  });

  it('an over-commitment (~1.6x capacity) misses, even with good play', () => {
    const over = playSprintSwarm(planSprint(base, 'over', commitUpTo(base, Math.round(cap * 1.6))), true);
    expect(over.met).toBe(false);
  });

  it('clearing impediments (the Scrum Master) delivers more than ignoring them', () => {
    // Commit the whole backlog so capacity - not the plan - is the binding limit.
    const commit = base.productBacklog.map((x) => x.id);
    const cleared = playSprintSwarm(planSprint(base, 'cleared', commit), true);
    const ignored = playSprintSwarm(planSprint(base, 'ignored', commit), false);
    expect(cleared.delivered).toBeGreaterThan(ignored.delivered);
  });
});
