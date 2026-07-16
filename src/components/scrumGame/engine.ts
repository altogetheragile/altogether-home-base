import type { ScrumState, Sprint, Story, Developer, Impediment, ChangeRequest } from './types';
import {
  SPRINT_SEED, totalPoints, totalValue, improvementBonus,
  IMPEDIMENT_CHANCE, IMPEDIMENTS, IMPEDIMENT_EFFECT, BLOCKER_RESOLVE_DAYS,
  CHANGE_REQUEST_CHANCE, CHANGE_REQUESTS, PRODUCT_GOAL_THRESHOLD,
  SPLIT_MAP, isSplittable,
} from './config';
import { ACTIVE_THEME } from './theme';

/** Clamp a meter to 0-100. */
const clampMeter = (n: number): number => Math.max(0, Math.min(100, n));

/** How each stakeholder's satisfaction shifts after a Sprint: it rises with the
 *  value of the Increment weighted by their agenda (tagWeights), and decays if
 *  nothing on their agenda shipped. Conflicting weights are the prioritisation
 *  tension the Product Owner navigates. */
export function nextSatisfaction(state: ScrumState, sprintNumber: number): Record<string, number> {
  const increment = incrementStories(state, sprintNumber);
  const next: Record<string, number> = { ...state.satisfaction };
  for (const sh of ACTIVE_THEME.stakeholders) {
    let gain = 0;
    for (const story of increment) {
      for (const tag of story.tags ?? []) gain += story.value * (sh.tagWeights[tag] ?? 0);
    }
    const delta = gain > 0 ? Math.round(gain) : -sh.neglectDecay;
    next[sh.id] = clampMeter((next[sh.id] ?? 50) + delta);
  }
  return next;
}

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
    impedimentsIgnored: 0,
  };
  const changeRequest = generateChangeRequest(number, sprint.length);
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
    changeRequest,
    // At most one mid-Sprint dilemma: an event card only if there's no change request.
    currentEvent: changeRequest ? null : generateEvent(number, sprint.length),
    eventLesson: null,
    lastDay: null,
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

/** Product Backlog Refinement: split a too-big, still-in-the-Backlog item into two
 *  smaller items in its place. Decomposition is the core refinement skill - small
 *  items are Ready and flow; big ones tend not to finish. Points split per the
 *  SPLIT_MAP; value splits proportionally so the total value is preserved. */
export function splitStory(state: ScrumState, storyId: string): ScrumState {
  const i = state.productBacklog.findIndex((s) => s.id === storyId);
  if (i < 0) return state;
  const s = state.productBacklog[i];
  if (s.status !== 'backlog' || !isSplittable(s.points)) return state;
  const [pa, pb] = SPLIT_MAP[s.points];
  const va = Math.round((s.value * pa) / s.points);
  const parts: Story[] = [
    { ...s, id: `${s.id}a`, title: `${s.title} (1)`, points: pa, value: va, effortRemaining: pa },
    { ...s, id: `${s.id}b`, title: `${s.title} (2)`, points: pb, value: s.value - va, effortRemaining: pb },
  ];
  const productBacklog = [...state.productBacklog];
  productBacklog.splice(i, 1, ...parts);
  return { ...state, productBacklog };
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

export interface SprintOutlook {
  /** Committed work still remaining (effort points). */
  remaining: number;
  /** Where an even burn-down would have it by now. */
  ideal: number;
  /** Days left in the timebox, including today. */
  daysLeft: number;
  status: 'ahead' | 'ontrack' | 'atrisk' | 'behind' | 'complete';
}

/** The Daily Scrum inspection: are the Developers on track for the Sprint Goal?
 *  Compares the COMMITTED work left against an even burn-down of the forecast (so
 *  extra work pulled in mid-Sprint doesn't distort the read). */
export function sprintOutlook(state: ScrumState): SprintOutlook | null {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const committed = new Set(sprint.committedStoryIds);
  const remaining = state.productBacklog
    .filter((s) => committed.has(s.id))
    .reduce((n, s) => n + s.effortRemaining, 0);
  const start = sprint.burndown[0] ?? remaining; // the forecast
  const daysDone = sprint.day - 1;
  const daysLeft = Math.max(0, sprint.length - daysDone);
  const ideal = Math.round((start * (sprint.length - daysDone)) / sprint.length);

  let status: SprintOutlook['status'];
  if (remaining === 0) status = 'complete';
  else if (daysLeft === 0) status = 'behind';
  else {
    const ratio = remaining / Math.max(1, ideal);
    status = ratio <= 0.9 ? 'ahead' : ratio <= 1.05 ? 'ontrack' : ratio <= 1.3 ? 'atrisk' : 'behind';
  }
  return { remaining, ideal, daysLeft, status };
}

// ============= Impediments (the Scrum Master's work) =============

/** Deterministically decide the impediment (if any) for a given Sprint day. */
export function generateImpediment(sprintNumber: number, day: number): Impediment | null {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 4099) ^ (day * 263) ^ 0x9e3779b9);
  if (rng() >= IMPEDIMENT_CHANCE) return null;
  const def = IMPEDIMENTS[Math.floor(rng() * IMPEDIMENTS.length)];
  return {
    id: `imp-${sprintNumber}-${day}`,
    kind: def.kind,
    title: def.title,
    detail: def.detail,
    addressed: false,
    ...(def.kind === 'blocker' ? { daysToResolve: BLOCKER_RESOLVE_DAYS } : {}),
  };
}

/** The Scrum Master acts on today's impediment - reducing the day's hit and, for a
 *  blocker, advancing it toward being resolved. It still costs the mitigated
 *  amount; clearing does not make it free. */
export function clearImpediment(state: ScrumState): ScrumState {
  const imp = state.currentImpediment;
  if (!imp || imp.addressed) return state;
  return { ...state, currentImpediment: { ...imp, addressed: true } };
}

// ============= Change requests (the Product Owner adapting) =============

/** Deterministically decide the Product Owner's change request (if any) for a
 *  Sprint, and which day it surfaces on. */
export function generateChangeRequest(sprintNumber: number, length: number): ChangeRequest | null {
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 7919) ^ 0x51ed2701);
  if (rng() >= CHANGE_REQUEST_CHANCE) return null;
  const def = CHANGE_REQUESTS[Math.floor(rng() * CHANGE_REQUESTS.length)];
  const day = 2 + Math.floor(rng() * Math.max(1, length - 2)); // surfaces between day 2 and length-1
  return { id: `cr-${sprintNumber}`, title: def.title, detail: def.detail, points: def.points, value: def.value, visualKey: def.visualKey, day };
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
    id: cr.id, title: cr.title, points: cr.points, value: cr.value, visualKey: cr.visualKey,
    status: 'todo', sprintNumber: sprint.number, effortRemaining: cr.points,
  };
  return { ...state, productBacklog: [...state.productBacklog, story], changeRequest: null };
}

/** The team protects the Sprint Goal: the change waits for a future Sprint. */
export function declineChange(state: ScrumState): ScrumState {
  return { ...state, changeRequest: null };
}

// ============= Event cards (mid-Sprint dilemmas) =============

/** Deterministically draw a mid-Sprint event card (or none) and its day. */
export function generateEvent(sprintNumber: number, length: number): { cardId: string; day: number } | null {
  const events = ACTIVE_THEME.events;
  if (events.length === 0) return null;
  const rng = mulberry32(SPRINT_SEED ^ (sprintNumber * 6971) ^ 0x2f9b2a3d);
  if (rng() >= 0.7) return null; // not every Sprint has one
  const card = events[Math.floor(rng() * events.length)];
  const day = 2 + Math.floor(rng() * Math.max(1, length - 2));
  return { cardId: card.id, day };
}

/** The event card in play right now (resolved from the theme), or null. */
export const currentEventCard = (state: ScrumState) =>
  state.currentEvent ? ACTIVE_THEME.events.find((e) => e.id === state.currentEvent!.cardId) ?? null : null;

/** Whether an event card is live and has reached its day. */
export const eventDue = (state: ScrumState): boolean =>
  !!state.currentEvent && !!state.currentSprint && state.currentSprint.day >= state.currentEvent.day;

/** Resolve the team's choice on the current event card: apply its effects (a
 *  satisfaction shift and/or a forced scope injection) and surface the lesson. */
export function chooseEvent(state: ScrumState, index: number): ScrumState {
  const card = currentEventCard(state);
  const choice = card?.choices[index];
  if (!choice) return state;
  let next: ScrumState = state;
  if (choice.effects.satisfaction) {
    const satisfaction = { ...next.satisfaction };
    for (const [id, d] of Object.entries(choice.effects.satisfaction)) {
      satisfaction[id] = clampMeter((satisfaction[id] ?? 50) + d);
    }
    next = { ...next, satisfaction };
  }
  if (choice.effects.scopeInjection) next = addToSprint(next, choice.effects.scopeInjection);
  return { ...next, currentEvent: null, eventLesson: choice.lesson };
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
  const rolls: { devId: string; storyId: string; roll: number }[] = [];
  state.team.forEach((dev, i) => {
    const storyId = state.assignments[dev.id];
    if (!storyId) return; // benched today
    const roll = devRoll(sprint.number, sprint.day, i);
    rolls.push({ devId: dev.id, storyId, roll });
    effortByStory.set(storyId, (effortByStory.get(storyId) ?? 0) + roll);
  });
  const bonus = improvementBonus(state.improvements);
  if (bonus > 0 && effortByStory.size > 0) {
    const swarmLead = [...effortByStory.entries()].sort((a, b) => b[1] - a[1])[0][0];
    effortByStory.set(swarmLead, (effortByStory.get(swarmLead) ?? 0) + bonus);
  }

  // Two things scale today's effort: the final day of a Sprint can be a half day
  // (when devDays is fractional), and a live impediment always costs the team some
  // capacity - less if the Scrum Master addressed it, more if it was ignored. The
  // impediment only "bites" if the team was actually trying to work.
  const imp = state.currentImpediment;
  const working = effortByStory.size > 0;
  const impFactor = imp && working ? IMPEDIMENT_EFFECT[imp.kind][imp.addressed ? 'addressed' : 'ignored'] : 1;
  const dayWeight = sprint.day < sprint.length ? 1 : sprint.devDays - (sprint.length - 1);
  const hit = imp && working && impFactor < 1 ? 1 : 0;
  const ignored = imp && working && !imp.addressed ? 1 : 0;
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

  // Burndown tracks remaining WORK (effort), not just points of unfinished stories,
  // so partial daily progress inside a story shows on the chart rather than the line
  // staying flat until a whole story reaches Done.
  const remaining = productBacklog
    .filter((s) => s.sprintNumber === sprint.number)
    .reduce((n, s) => n + s.effortRemaining, 0);
  const nextDay = sprint.day + 1;
  const next: Sprint = {
    ...sprint,
    day: nextDay,
    burndown: [...sprint.burndown, remaining],
    impedimentsHit: sprint.impedimentsHit + hit,
    impedimentsIgnored: sprint.impedimentsIgnored + ignored,
  };
  // A blocker persists across days: escalating it (addressed) counts it down and it
  // lifts once resolved; ignoring it keeps it (and its full cost) tomorrow. A
  // distraction is a one-day event. When nothing carries over, roll a fresh one.
  let carried: Impediment | null = null;
  if (imp && imp.kind === 'blocker') {
    if (imp.addressed) {
      const left = (imp.daysToResolve ?? 1) - 1;
      if (left > 0) carried = { ...imp, addressed: false, daysToResolve: left };
    } else {
      carried = { ...imp, addressed: false };
    }
  }
  const currentImpediment = nextDay <= sprint.length
    ? (carried ?? generateImpediment(sprint.number, nextDay))
    : null;
  const lastDay = {
    day: sprint.day,
    dayWeight,
    impedimentBit: hit === 1,
    impediment: imp && working ? { kind: imp.kind, addressed: imp.addressed } : null,
    rolls,
    completed: finished,
  };
  // The event lesson is a one-day debrief; clear it as the next day starts.
  return { ...state, currentSprint: next, productBacklog, assignments, currentImpediment, lastDay, eventLesson: null };
}

/** Fast-forward the rest of the Sprint. The Scrum Master keeps the way clear as
 *  they go (each day's impediment is removed), so this is a safe way to skip the
 *  clicking once the plan is set - not a shortcut that ignores the team's blockers. */
export function runRemainingDays(state: ScrumState): ScrumState {
  let s = state;
  let guard = 0;
  while (s.currentSprint && !isSprintOver(s.currentSprint) && guard++ < 200) {
    if (s.currentImpediment && !s.currentImpediment.addressed) s = clearImpediment(s);
    s = runSprintDay(s);
  }
  return s;
}

/** Points delivered - stories that reached Done (and so meet the Definition of
 *  Done) in a Sprint. This is the Increment, and what velocity is measured in. */
export const deliveredPoints = (state: ScrumState, sprintNumber: number): number =>
  totalPoints(state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done'));

/** The Increment for a Sprint: the Done stories, each of which already meets the
 *  Definition of Done (that is what makes them Done). */
export const incrementStories = (state: ScrumState, sprintNumber: number): Story[] =>
  state.productBacklog.filter((s) => s.sprintNumber === sprintNumber && s.status === 'done');

export interface SprintScoreItem { label: string; ok: boolean; detail: string; }
export interface SprintScore { stars: number; max: number; items: SprintScoreItem[]; }

/** Rate a Sprint on a few Scrum-healthy dimensions - one star each. A snapshot the
 *  team can read at a glance and try to beat next Sprint. */
export function sprintScore(state: ScrumState, sprintNumber: number): SprintScore {
  const sprint = sprintByNumber(state, sprintNumber);
  const met = sprintGoalMet(state, sprintNumber);
  const forecast = forecastPoints(state, sprintNumber);
  const delivered = deliveredPoints(state, sprintNumber);
  const valueDelivered = totalValue(incrementStories(state, sprintNumber));
  const ignored = sprint?.impedimentsIgnored ?? 0;

  const items: SprintScoreItem[] = [
    { label: 'Sprint Goal met', ok: met, detail: met ? 'Every committed story reached Done' : 'Some committed work missed' },
    { label: 'Hit the forecast', ok: forecast > 0 && delivered >= forecast, detail: `${delivered} of ${forecast} forecast points delivered` },
    { label: 'Way kept clear', ok: ignored === 0, detail: ignored === 0 ? 'The Scrum Master addressed every impediment' : `${ignored} impediment day(s) went unaddressed` },
    { label: 'Delivered value', ok: valueDelivered > 0, detail: `${valueDelivered} value delivered toward the Product Goal` },
  ];
  return { stars: items.filter((i) => i.ok).length, max: items.length, items };
}

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
 *  reached Done (met the Definition of Done). Extra work pulled in mid-Sprint is a
 *  bonus and doesn't fail the Goal if it's unfinished. */
export const sprintGoalMet = (state: ScrumState, sprintNumber: number): boolean => {
  const sprint = sprintByNumber(state, sprintNumber);
  if (!sprint || sprint.committedStoryIds.length === 0) return false;
  const committed = new Set(sprint.committedStoryIds);
  return state.productBacklog.filter((s) => committed.has(s.id)).every((s) => s.status === 'done');
};

/** End the Sprint and open the Review: record velocity (Done points - work is Done
 *  only when it meets the Definition of Done), and return unfinished stories to the
 *  Product Backlog. The Review then inspects the Increment and progress toward the
 *  Product Goal; it is NOT an acceptance gate - Done work already meets the DoD. */
export function reviewSprint(state: ScrumState): ScrumState {
  const sprint = state.currentSprint;
  if (!sprint) return state;
  const velocityPts = deliveredPoints(state, sprint.number);
  // Unfinished work returns to the Product Backlog re-estimated to the work that
  // is LEFT (the team's re-forecast), not the original whole. Partial progress
  // still earns no velocity - only Done work does - but it isn't thrown away, so a
  // nearly-finished story comes back small. A never-started story is unchanged.
  const productBacklog = state.productBacklog.map((s) =>
    s.sprintNumber === sprint.number && s.status !== 'done'
      ? { ...s, status: 'backlog' as const, sprintNumber: null, points: s.effortRemaining }
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
    changeRequest: null,
    currentEvent: null,
    eventLesson: null,
    lastDay: null,
    satisfaction: nextSatisfaction(state, sprint.number),
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

// ============= The Product Goal (across Sprints) =============

/** Total value identified for the product - every story in the Backlog, delivered
 *  or not (grows if the Product Owner's change requests are pulled in). */
export const productGoalTotalValue = (state: ScrumState): number => totalValue(state.productBacklog);

/** Value delivered into the Increment so far - progress toward the Product Goal. */
export const productGoalDeliveredValue = (state: ScrumState): number =>
  totalValue(state.productBacklog.filter((s) => s.status === 'done'));

/** Fraction of the product's value delivered and accepted (0..1). */
export const productGoalProgress = (state: ScrumState): number => {
  const total = productGoalTotalValue(state);
  return total > 0 ? productGoalDeliveredValue(state) / total : 0;
};

/** Whether enough value has been delivered to call the Product Goal achieved -
 *  either the Backlog is fully delivered, or a high share of value is in. It's the
 *  Product Owner's call, so this only ENABLES the wrap-up; it doesn't force it. */
export const productGoalReachable = (state: ScrumState): boolean => {
  const noneLeft = state.productBacklog.every((s) => s.status === 'done');
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
