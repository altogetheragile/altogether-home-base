import type { ScrumState, Sprint, Story, Developer, Impediment, ChangeRequest } from './types';
import {
  SPRINT_SEED, totalPoints, totalValue, improvementBonus,
  IMPEDIMENT_CHANCE, IMPEDIMENTS, IMPEDIMENT_EFFECT,
  CHANGE_REQUEST_CHANCE, CHANGE_REQUESTS, PRODUCT_GOAL_THRESHOLD,
} from './config';

// ============= Planning =============

/** Commit the planned stories into a new Sprint and open it for play. The chosen
 *  stories move from the Product Backlog onto the Sprint board (status 'todo',
 *  tagged with the Sprint number); the Sprint Goal is set. Pure and deterministic. */
export function planSprint(state: ScrumState, goal: string, storyIds: string[], devDays = state.sprintLength): ScrumState {
  const number = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const committed = new Set(storyIds);
  const productBacklog: Story[] = state.productBacklog.map((s) =>
    committed.has(s.id) ? { ...s, status: 'todo', sprintNumber: number, effortRemaining: s.points } : s,
  );
  const startPoints = totalPoints(productBacklog.filter((s) => committed.has(s.id)));
  const sprint: Sprint = {
    number,
    goal: goal.trim(),
    length: Math.ceil(devDays), // the last slot is a half day when devDays is fractional
    devDays,
    day: 1,
    committedStoryIds: storyIds,
    status: 'active',
    burndown: [startPoints], // day 0: the full commitment
    impedimentsHit: 0,
  };
  // A new Sprint starts with everyone on the bench and day 1's impediment (if any)
  // waiting at the Daily Scrum. Remember the chosen length for the next Sprint.
  return {
    ...state,
    phase: 'sprint',
    currentSprint: sprint,
    productBacklog,
    assignments: {},
    sprintLength: devDays, // remember the chosen length for the next Sprint
    currentImpediment: generateImpediment(number, 1),
    changeRequest: generateChangeRequest(number, sprint.length),
  };
}

/** The stories committed to a given Sprint (the Sprint Backlog). */
export const sprintStories = (state: ScrumState, sprintNumber: number): Story[] =>
  state.productBacklog.filter((s) => s.sprintNumber === sprintNumber);

/** The stories still available to plan (not yet pulled into any Sprint). */
export const availableStories = (state: ScrumState): Story[] =>
  state.productBacklog.filter((s) => s.status === 'backlog');

/** Reorder the Product Backlog - the Product Owner's job. Moves a still-unplanned
 *  story one place up or down among the other unplanned items (stories already in
 *  a Sprint keep their place), so ordering by value/priority is a real choice that
 *  drives what planning pulls first. */
export function moveBacklogStory(state: ScrumState, storyId: string, dir: 'up' | 'down'): ScrumState {
  const arr = [...state.productBacklog];
  const i = arr.findIndex((s) => s.id === storyId);
  if (i < 0 || arr[i].status !== 'backlog') return state;
  const step = dir === 'up' ? -1 : 1;
  let j = i + step;
  while (j >= 0 && j < arr.length && arr[j].status !== 'backlog') j += step; // skip non-backlog neighbours
  if (j < 0 || j >= arr.length) return state;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return { ...state, productBacklog: arr };
}

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

/** One Developer's effort for a given Sprint day - a small die (1..2), keyed so
 *  it's deterministic per (sprint, day, Developer). Modest, so the timebox binds:
 *  a big story needs more than one person to finish inside a Sprint. */
export function devRoll(sprintNumber: number, day: number, devIndex: number): number {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 977) ^ (day * 131) ^ ((devIndex + 1) * 6151));
  return Math.floor(rng() * 2) + 1; // 1..2
}

/** Whether a Sprint has run out of days. */
export const isSprintOver = (sprint: Sprint): boolean => sprint.day > sprint.length;

// ============= Impediments (the Scrum Master's work) =============

/** Deterministically decide the impediment (if any) for a given Sprint day. */
export function generateImpediment(sprintNumber: number, day: number): Impediment | null {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 4099) ^ (day * 263) ^ 0x9e3779b9);
  if (rng() >= IMPEDIMENT_CHANCE) return null;
  const def = IMPEDIMENTS[Math.floor(rng() * IMPEDIMENTS.length)];
  return { id: `imp-${sprintNumber}-${day}`, kind: def.kind, title: def.title, detail: def.detail, cleared: false };
}

/** The Scrum Master removes today's impediment, so it no longer costs the team. */
export function clearImpediment(state: ScrumState): ScrumState {
  const imp = state.currentImpediment;
  if (!imp || imp.cleared) return state;
  return { ...state, currentImpediment: { ...imp, cleared: true } };
}

// ============= Change requests (the Product Owner adapting) =============

/** Deterministically decide the Product Owner's change request (if any) for a
 *  Sprint, and which day it surfaces on. */
export function generateChangeRequest(sprintNumber: number, length: number): ChangeRequest | null {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 7919) ^ 0x51ed2701);
  if (rng() >= CHANGE_REQUEST_CHANCE) return null;
  const def = CHANGE_REQUESTS[Math.floor(rng() * CHANGE_REQUESTS.length)];
  const day = 2 + Math.floor(rng() * Math.max(1, length - 2)); // surfaces between day 2 and length-1
  return { id: `cr-${sprintNumber}`, title: def.title, detail: def.detail, points: def.points, value: def.value, day };
}

/** Whether a change request is live and has reached its day (so the team must decide). */
export const changeRequestDue = (state: ScrumState): boolean =>
  !!state.changeRequest && !!state.currentSprint && state.currentSprint.day >= state.changeRequest.day;

/** The team adapts: pull the Product Owner's change into the Sprint. Like other
 *  mid-Sprint work it joins the board (To Do) but NOT the original commitment, so
 *  the Sprint Goal and the forecast stay honest. */
export function acceptChange(state: ScrumState): ScrumState {
  const cr = state.changeRequest;
  const sprint = state.currentSprint;
  if (!cr || !sprint) return state;
  const story: Story = {
    id: cr.id, title: cr.title, points: cr.points, value: cr.value,
    status: 'todo', sprintNumber: sprint.number, effortRemaining: cr.points, accepted: false,
  };
  return { ...state, productBacklog: [...state.productBacklog, story], changeRequest: null };
}

/** The team protects the Sprint Goal: the change waits for a future Sprint. */
export function declineChange(state: ScrumState): ScrumState {
  return { ...state, changeRequest: null };
}

/** Move a story from To Do into Doing (the team starts it). */
export function startStory(state: ScrumState, storyId: string): ScrumState {
  const productBacklog = state.productBacklog.map((s) =>
    s.id === storyId && s.status === 'todo' ? { ...s, status: 'doing' as const } : s,
  );
  return { ...state, productBacklog };
}

// ============= The team: who works on what =============

/** Developers currently on the bench (assigned to nothing) - idle, doing no work. */
export const benchedDevs = (state: ScrumState): Developer[] =>
  state.team.filter((d) => !state.assignments[d.id]);

/** The Developers swarming a given story right now. */
export const devsOnStory = (state: ScrumState, storyId: string): Developer[] =>
  state.team.filter((d) => state.assignments[d.id] === storyId);

/** Assign a Developer to a story for the Sprint. Assigning to a To Do story pulls
 *  it into Doing (the team starts it). Many Developers on one story = a swarm,
 *  which finishes it fast; spread thin, everything crawls. */
export function assignDev(state: ScrumState, devId: string, storyId: string): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint || !state.team.some((d) => d.id === devId)) return state;
  const story = state.productBacklog.find(
    (s) => s.id === storyId && s.sprintNumber === sprint.number && (s.status === 'todo' || s.status === 'doing'),
  );
  if (!story) return state;
  const productBacklog = story.status === 'todo'
    ? state.productBacklog.map((s) => (s.id === storyId ? { ...s, status: 'doing' as const } : s))
    : state.productBacklog;
  return { ...state, productBacklog, assignments: { ...state.assignments, [devId]: storyId } };
}

/** Send a Developer back to the bench (frees them to be placed elsewhere). */
export function unassignDev(state: ScrumState, devId: string): ScrumState {
  if (!state.assignments[devId]) return state;
  const assignments = { ...state.assignments };
  delete assignments[devId];
  return { ...state, assignments };
}

/** Replace the Definition of Done (the team refining their quality bar). Empty
 *  lines are dropped and each criterion keeps a stable id. */
export function setDefinitionOfDone(state: ScrumState, dod: { id: string; label: string }[]): ScrumState {
  const cleaned = dod
    .map((c) => ({ id: c.id, label: c.label.trim() }))
    .filter((c) => c.label.length > 0);
  return { ...state, definitionOfDone: cleaned };
}

/** Replace the roster (team editor). Any assignments for removed Developers are
 *  dropped so nobody works a story who is no longer on the team. */
export function setTeam(state: ScrumState, team: Developer[]): ScrumState {
  const ids = new Set(team.map((d) => d.id));
  const assignments: Record<string, string> = {};
  for (const [devId, storyId] of Object.entries(state.assignments)) {
    if (ids.has(devId)) assignments[devId] = storyId;
  }
  return { ...state, team, assignments };
}

/** Pull an extra Product Backlog item into the running Sprint - the Developers
 *  renegotiating scope with the PO when they're ahead of the forecast. The story
 *  joins the Sprint board (To Do); it is NOT added to the original commitment, so
 *  the forecast stays honest and actual delivery can exceed it. */
export function addToSprint(state: ScrumState, storyId: string): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint || isSprintOver(sprint)) return state;
  const productBacklog = state.productBacklog.map((s) =>
    s.id === storyId && s.status === 'backlog'
      ? { ...s, status: 'todo' as const, sprintNumber: sprint.number, effortRemaining: s.points }
      : s,
  );
  return { ...state, productBacklog };
}

/** Run one Sprint day (the Daily Scrum happened; now the team works). Effort comes
 *  only from Developers who are ASSIGNED to a story - each rolls their own die and
 *  applies it to the story they're on, so a swarm finishes work fast and the idle
 *  bench contributes nothing. Stories whose effort reaches zero move to Done, and
 *  the Developers on them are freed back to the bench. */
export function runSprintDay(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint || isSprintOver(sprint)) return state;

  // Sum each assigned Developer's roll onto their story. Kaizen (accumulated retro
  // improvements) rewards focus: the extra effort goes to the most-swarmed story.
  const effortByStory = new Map<string, number>();
  state.team.forEach((dev, i) => {
    const storyId = state.assignments[dev.id];
    if (!storyId) return; // benched today
    effortByStory.set(storyId, (effortByStory.get(storyId) ?? 0) + devRoll(sprint.number, sprint.day, i));
  });
  const bonus = improvementBonus(state.improvements);
  if (bonus > 0 && effortByStory.size > 0) {
    const swarmLead = [...effortByStory.entries()].sort((a, b) => b[1] - a[1])[0][0];
    effortByStory.set(swarmLead, (effortByStory.get(swarmLead) ?? 0) + bonus);
  }

  // Two things scale today's effort: the final day of a Sprint can be a half day
  // (when devDays is fractional, e.g. a one-week Sprint's 4.5 days), and a live
  // impediment the Scrum Master hasn't cleared costs the team - a distraction
  // loses half the day, a blocker loses all of it. The impediment only "bites"
  // if the team was actually trying to work.
  const imp = state.currentImpediment;
  const impFactor = imp && !imp.cleared ? IMPEDIMENT_EFFECT[imp.kind] : 1;
  const dayWeight = sprint.day < sprint.length ? 1 : sprint.devDays - (sprint.length - 1);
  const hit = imp && !imp.cleared && effortByStory.size > 0 ? 1 : 0;
  if (impFactor !== 1 || dayWeight !== 1) {
    for (const [id, e] of effortByStory) effortByStory.set(id, Math.floor(e * impFactor * dayWeight));
  }

  const finished: string[] = [];
  const productBacklog = state.productBacklog.map((s) => {
    const work = effortByStory.get(s.id);
    if (!work || s.status !== 'doing') return s;
    const effortRemaining = Math.max(0, s.effortRemaining - work);
    if (effortRemaining === 0) finished.push(s.id);
    return { ...s, effortRemaining, status: effortRemaining === 0 ? ('done' as const) : s.status };
  });

  // Developers on a story that just reached Done return to the bench.
  const assignments = { ...state.assignments };
  if (finished.length > 0) {
    const done = new Set(finished);
    for (const devId of Object.keys(assignments)) {
      if (done.has(assignments[devId])) delete assignments[devId];
    }
  }

  const remaining = totalPoints(
    productBacklog.filter((s) => s.sprintNumber === sprint.number && s.status !== 'done'),
  );
  const nextDay = sprint.day + 1;
  const next: Sprint = {
    ...sprint,
    day: nextDay,
    burndown: [...sprint.burndown, remaining],
    impedimentsHit: sprint.impedimentsHit + hit,
  };
  // Surface tomorrow's impediment (only while the timebox is still open).
  const currentImpediment = nextDay <= sprint.length ? generateImpediment(sprint.number, nextDay) : null;
  return { ...state, currentSprint: next, productBacklog, assignments, currentImpediment };
}

/** Fast-forward the rest of the Sprint. The Scrum Master keeps the way clear as
 *  they go (each day's impediment is removed), so this is a safe way to skip the
 *  clicking once the plan is set - not a shortcut that ignores the team's blockers. */
export function runRemainingDays(state: ScrumState): ScrumState {
  let s = state;
  let guard = 0;
  while (s.currentSprint && !isSprintOver(s.currentSprint) && guard++ < 200) {
    if (s.currentImpediment && !s.currentImpediment.cleared) s = clearImpediment(s);
    s = runSprintDay(s);
  }
  return s;
}

/** Points delivered (stories that reached Done) in a Sprint - regardless of
 *  whether the Product Owner has accepted them yet. */
export const deliveredPoints = (state: ScrumState, sprintNumber: number): number =>
  totalPoints(state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done'));

/** Stories the Product Owner has accepted - the actual Increment. */
export const acceptedStories = (state: ScrumState, sprintNumber: number): Story[] =>
  state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done' && s.accepted);

/** Points accepted into the Increment - what velocity is measured in. */
export const acceptedPoints = (state: ScrumState, sprintNumber: number): number =>
  totalPoints(acceptedStories(state, sprintNumber));

const sprintByNumber = (state: ScrumState, n: number): Sprint | undefined =>
  state.currentSprint?.number === n ? state.currentSprint : state.sprints.find((s) => s.number === n);

/** Points the team originally FORECAST for a Sprint (its commitment) - distinct
 *  from what it actually delivered, which can be more (scope pulled in) or less. */
export const forecastPoints = (state: ScrumState, sprintNumber: number): number => {
  const sprint = sprintByNumber(state, sprintNumber);
  if (!sprint) return 0;
  const committed = new Set(sprint.committedStoryIds);
  return totalPoints(state.productBacklog.filter((s) => committed.has(s.id)));
};

/** Whether the Sprint Goal is met: every story the team COMMITTED to at planning
 *  reached Done AND was accepted by the Product Owner. Extra work pulled in
 *  mid-Sprint is a bonus and doesn't fail the Goal if it's unfinished. */
export const sprintGoalMet = (state: ScrumState, sprintNumber: number): boolean => {
  const sprint = sprintByNumber(state, sprintNumber);
  if (!sprint || sprint.committedStoryIds.length === 0) return false;
  const committed = new Set(sprint.committedStoryIds);
  return state.productBacklog.filter((s) => committed.has(s.id)).every((s) => s.status === 'done' && s.accepted);
};

/** End the Sprint and open the Review: return unfinished stories to the Product
 *  Backlog (Scrum: undone work goes back). Velocity is NOT recorded yet - the
 *  Product Owner still has to accept the finished work against the Definition of
 *  Done. The Sprint stays as currentSprint so Review and Retro can show it. */
export function reviewSprint(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const productBacklog = state.productBacklog.map((s) =>
    s.sprintNumber === sprint.number && s.status !== 'done'
      ? { ...s, status: 'backlog' as const, sprintNumber: null, effortRemaining: s.points, accepted: false }
      : s,
  );
  return {
    ...state,
    phase: 'review',
    currentSprint: { ...sprint, status: 'review' },
    productBacklog,
    assignments: {},
    currentImpediment: null,
    changeRequest: null,
  };
}

/** The Product Owner accepts a finished story against the Definition of Done -
 *  only accepted work is in the Increment and counts toward velocity. */
export function acceptStory(state: ScrumState, storyId: string): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const productBacklog = state.productBacklog.map((s) =>
    s.id === storyId && s.sprintNumber === sprint.number && s.status === 'done' ? { ...s, accepted: true } : s,
  );
  return { ...state, productBacklog };
}

/** The Product Owner sends finished-but-not-good-enough work back for rework - it
 *  returns to the Product Backlog and does not count toward velocity or the Goal. */
export function rejectStory(state: ScrumState, storyId: string): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const productBacklog = state.productBacklog.map((s) =>
    s.id === storyId && s.sprintNumber === sprint.number && s.status === 'done'
      ? { ...s, status: 'backlog' as const, sprintNumber: null, effortRemaining: s.points, accepted: false }
      : s,
  );
  return { ...state, productBacklog };
}

/** Close the Review and move to the Retrospective: record velocity as the ACCEPTED
 *  points, and send any finished-but-unaccepted work back to the Backlog for rework. */
export function finishReview(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const velocityPts = acceptedPoints(state, sprint.number);
  const productBacklog = state.productBacklog.map((s) =>
    s.sprintNumber === sprint.number && s.status === 'done' && !s.accepted
      ? { ...s, status: 'backlog' as const, sprintNumber: null, effortRemaining: s.points, accepted: false }
      : s,
  );
  return { ...state, phase: 'retro', velocity: [...state.velocity, velocityPts], productBacklog };
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

// ============= The Product Goal (across Sprints) =============

/** Total value identified for the product - every story in the Backlog, delivered
 *  or not (grows if the Product Owner's change requests are pulled in). */
export const productGoalTotalValue = (state: ScrumState): number => totalValue(state.productBacklog);

/** Value accepted into the Increment so far - progress toward the Product Goal. */
export const productGoalDeliveredValue = (state: ScrumState): number =>
  totalValue(state.productBacklog.filter((s) => s.accepted));

/** Fraction of the product's value delivered and accepted (0..1). */
export const productGoalProgress = (state: ScrumState): number => {
  const total = productGoalTotalValue(state);
  return total > 0 ? productGoalDeliveredValue(state) / total : 0;
};

/** Whether enough value has been delivered to call the Product Goal achieved -
 *  either the Backlog is fully delivered, or a high share of value is in. It's the
 *  Product Owner's call, so this only ENABLES the wrap-up; it doesn't force it. */
export const productGoalReachable = (state: ScrumState): boolean => {
  const noneLeft = state.productBacklog.every((s) => s.accepted);
  return noneLeft || productGoalProgress(state) >= PRODUCT_GOAL_THRESHOLD;
};

/** End the game: the Product Owner declares the Product Goal achieved. Files the
 *  reviewed Sprint and moves to the wrap-up. */
export function endGame(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  return {
    ...state,
    phase: 'final',
    sprints: sprint ? [...state.sprints, { ...sprint, status: 'done' as const }] : state.sprints,
    currentSprint: null,
  };
}
