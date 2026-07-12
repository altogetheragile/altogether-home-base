import type { ScrumState, Sprint, Story } from './types';
import { SPRINT_TEAM, SPRINT_SEED, totalPoints, improvementBonus } from './config';

// ============= Planning =============

/** Commit the planned stories into a new Sprint and open it for play. The chosen
 *  stories move from the Product Backlog onto the Sprint board (status 'todo',
 *  tagged with the Sprint number); the Sprint Goal is set. Pure and deterministic. */
export function planSprint(state: ScrumState, goal: string, storyIds: string[]): ScrumState {
  const number = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const committed = new Set(storyIds);
  const productBacklog: Story[] = state.productBacklog.map((s) =>
    committed.has(s.id) ? { ...s, status: 'todo', sprintNumber: number, effortRemaining: s.points } : s,
  );
  const startPoints = totalPoints(productBacklog.filter((s) => committed.has(s.id)));
  const sprint: Sprint = {
    number,
    goal: goal.trim(),
    length: state.sprintLength,
    day: 1,
    committedStoryIds: storyIds,
    status: 'active',
    burndown: [startPoints], // day 0: the full commitment
  };
  return { ...state, phase: 'sprint', currentSprint: sprint, productBacklog };
}

/** The stories committed to a given Sprint (the Sprint Backlog). */
export const sprintStories = (state: ScrumState, sprintNumber: number): Story[] =>
  state.productBacklog.filter((s) => s.sprintNumber === sprintNumber);

/** The stories still available to plan (not yet pulled into any Sprint). */
export const availableStories = (state: ScrumState): Story[] =>
  state.productBacklog.filter((s) => s.status === 'backlog');

// ============= Execution =============

/** Small seeded RNG (mulberry32) so a Sprint's dice are deterministic. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The team's total effort for a given Sprint day - each Developer rolls a small
 *  die. Deterministic per (sprint, day). Modest, so the 5-day timebox binds: a
 *  right-sized, focused Sprint finishes; an over-committed or over-spread one
 *  does not. */
export function teamCapacity(sprintNumber: number, day: number, bonus = 0): number {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 977) ^ (day * 131));
  let total = bonus; // accumulated retro improvements make the team a little faster
  for (let i = 0; i < SPRINT_TEAM.length; i++) total += Math.floor(rng() * 2) + 1; // 1..2 each
  return total;
}

/** Whether a Sprint has run out of days. */
export const isSprintOver = (sprint: Sprint): boolean => sprint.day > sprint.length;

/** Move a story from To Do into Doing (the team starts it). */
export function startStory(state: ScrumState, storyId: string): ScrumState {
  const productBacklog = state.productBacklog.map((s) =>
    s.id === storyId && s.status === 'todo' ? { ...s, status: 'doing' as const } : s,
  );
  return { ...state, productBacklog };
}

/** Run one Sprint day (the Daily Scrum happened; now the team works). The team's
 *  capacity is spread across everything in Doing - so too much work-in-progress
 *  means little finishes. Stories whose effort reaches zero move to Done. */
export function runSprintDay(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint || isSprintOver(sprint)) return state;

  const doingIds = state.productBacklog
    .filter((s) => s.sprintNumber === sprint.number && s.status === 'doing')
    .map((s) => s.id);

  // Split the day's capacity evenly across the stories in Doing.
  const cap = teamCapacity(sprint.number, sprint.day, improvementBonus(state.improvements));
  const per = new Map<string, number>();
  if (doingIds.length > 0) {
    const base = Math.floor(cap / doingIds.length);
    const extra = cap % doingIds.length;
    doingIds.forEach((id, i) => per.set(id, base + (i < extra ? 1 : 0)));
  }

  const productBacklog = state.productBacklog.map((s) => {
    const work = per.get(s.id);
    if (!work) return s;
    const effortRemaining = Math.max(0, s.effortRemaining - work);
    return { ...s, effortRemaining, status: effortRemaining === 0 ? ('done' as const) : s.status };
  });

  const remaining = totalPoints(
    productBacklog.filter((s) => s.sprintNumber === sprint.number && s.status !== 'done'),
  );
  const next: Sprint = { ...sprint, day: sprint.day + 1, burndown: [...sprint.burndown, remaining] };
  return { ...state, currentSprint: next, productBacklog };
}

/** Points delivered (stories that reached Done) in a Sprint. */
export const deliveredPoints = (state: ScrumState, sprintNumber: number): number =>
  totalPoints(state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done'));

/** Whether a Sprint's committed stories all reached Done (its Goal is met). */
export const sprintGoalMet = (state: ScrumState, sprintNumber: number): boolean => {
  const stories = state.productBacklog.filter((s) => s.sprintNumber === sprintNumber);
  return stories.length > 0 && stories.every((s) => s.status === 'done');
};

/** End the Sprint and open the Review: record velocity, and return unfinished
 *  stories to the Product Backlog (Scrum: undone work goes back, not into the
 *  Increment). The Sprint stays as currentSprint so Review and Retro can show it. */
export function reviewSprint(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const velocityPts = deliveredPoints(state, sprint.number);
  const productBacklog = state.productBacklog.map((s) =>
    s.sprintNumber === sprint.number && s.status !== 'done'
      ? { ...s, status: 'backlog' as const, sprintNumber: null, effortRemaining: s.points }
      : s,
  );
  return {
    ...state,
    phase: 'review',
    velocity: [...state.velocity, velocityPts],
    currentSprint: { ...sprint, status: 'review' },
    productBacklog,
  };
}

/** After the Retrospective: carry the chosen improvement forward, file the Sprint
 *  in history, and open planning for the next one. */
export function startNextSprint(state: ScrumState, improvement: string): ScrumState {
  const sprint = state.currentSprint;
  return {
    ...state,
    phase: 'planning',
    improvements: [...state.improvements, improvement],
    sprints: sprint ? [...state.sprints, { ...sprint, status: 'done' as const }] : state.sprints,
    currentSprint: null,
  };
}
