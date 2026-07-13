import type { ScrumState, Sprint, Story, Developer, Impediment } from './types';
import {
  SPRINT_SEED, totalPoints, improvementBonus,
  IMPEDIMENT_CHANCE, IMPEDIMENTS, IMPEDIMENT_EFFECT,
} from './config';

// ============= Planning =============

/** Commit the planned stories into a new Sprint and open it for play. The chosen
 *  stories move from the Product Backlog onto the Sprint board (status 'todo',
 *  tagged with the Sprint number); the Sprint Goal is set. Pure and deterministic. */
export function planSprint(state: ScrumState, goal: string, storyIds: string[], length = state.sprintLength): ScrumState {
  const number = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const committed = new Set(storyIds);
  const productBacklog: Story[] = state.productBacklog.map((s) =>
    committed.has(s.id) ? { ...s, status: 'todo', sprintNumber: number, effortRemaining: s.points } : s,
  );
  const startPoints = totalPoints(productBacklog.filter((s) => committed.has(s.id)));
  const sprint: Sprint = {
    number,
    goal: goal.trim(),
    length,
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
    sprintLength: length,
    currentImpediment: generateImpediment(number, 1),
  };
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

  // A live impediment the Scrum Master hasn't cleared scales down today's effort -
  // a distraction loses half the day, a blocker loses all of it. It only "bites"
  // if the team was actually trying to work.
  const imp = state.currentImpediment;
  let hit = 0;
  if (imp && !imp.cleared && effortByStory.size > 0) {
    const factor = IMPEDIMENT_EFFECT[imp.kind];
    for (const [id, e] of effortByStory) effortByStory.set(id, Math.floor(e * factor));
    hit = 1;
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

/** Points delivered (stories that reached Done) in a Sprint. */
export const deliveredPoints = (state: ScrumState, sprintNumber: number): number =>
  totalPoints(state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done'));

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
 *  reached Done. Extra work pulled in mid-Sprint is a bonus and doesn't fail the
 *  Goal if it's unfinished. */
export const sprintGoalMet = (state: ScrumState, sprintNumber: number): boolean => {
  const sprint = sprintByNumber(state, sprintNumber);
  if (!sprint || sprint.committedStoryIds.length === 0) return false;
  const committed = new Set(sprint.committedStoryIds);
  return state.productBacklog.filter((s) => committed.has(s.id)).every((s) => s.status === 'done');
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
    assignments: {},
    currentImpediment: null,
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
