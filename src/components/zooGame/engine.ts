import type { ZooGameState, BacklogItem, Impediment } from './types';
import type { Signal } from './simulation/types';
import type { ItemDesign } from './design';
import { appealFromAnimals } from './design';
import { DEFAULT_CONFIG } from './simulation/config';
import { simulateSprint } from './simulation/simulate';
import { makeRng, hashStr } from './simulation/rng';
import { toZooItem, IMPEDIMENT_CHANCE, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT, MISSED_SCRUM_TIP } from './config';

// ============= Planning =============

/** Commit the chosen Backlog items into the current Sprint and open it for play.
 *  The Sprint starts on day 1, ready to build. */
export function planSprint(state: ZooGameState, ids: string[]): ZooGameState {
  const committed = new Set(ids);
  const backlog = state.backlog.map((it) =>
    committed.has(it.id) && it.status === 'backlog' ? { ...it, status: 'committed' as const, sprintNumber: state.sprintNumber } : it,
  );
  return {
    ...state, phase: 'sprint', committedIds: [...ids], backlog,
    dayNumber: 1, dayStage: 'building', dayTimeMult: 1, pendingImpediment: null, carriedImpediment: null,
  };
}

/** Pull a Backlog item into the current Sprint mid-Sprint. Scope can grow by
 *  agreement during the Sprint, as long as the Sprint's goal is not put at risk -
 *  so the Backlog stays visible and pullable while building. */
export function pullIntoSprint(state: ZooGameState, id: string): ZooGameState {
  if (state.phase !== 'sprint') return state;
  const item = state.backlog.find((it) => it.id === id && it.status === 'backlog');
  if (!item) return state;
  const backlog = state.backlog.map((it) => (it.id === id ? { ...it, status: 'committed' as const, sprintNumber: state.sprintNumber } : it));
  return { ...state, committedIds: [...state.committedIds, id], backlog };
}

// ============= Building and releasing =============

/** A committed item is built to the Definition of Done. For an exhibit, the built
 *  animals are stored and the enclosure's appeal is aggregated from them (more
 *  animals, more of a draw). For an amenity, the building design is stored. The
 *  choices are the product. Without either, the item is just marked Done. */
export function buildItem(state: ZooGameState, id: string, design?: ItemDesign, animals?: ItemDesign[]): ZooGameState {
  const backlog = state.backlog.map((it) => {
    if (it.id !== id || it.status !== 'committed') return it;
    if (animals && animals.length) return { ...it, status: 'done' as const, animals, appeal: appealFromAnimals(it, animals) };
    if (design) return { ...it, status: 'done' as const, design };
    return { ...it, status: 'done' as const };
  });
  return { ...state, backlog };
}

/** Release a Done item to visitors. Decoupled from the Review: you can open a Done
 *  item at any time during the Sprint. Once open it is part of the zoo the visitors
 *  experience. */
export function openItem(state: ZooGameState, id: string): ZooGameState {
  const backlog = state.backlog.map((it) => (it.id === id && it.status === 'done' ? { ...it, status: 'open' as const } : it));
  return { ...state, backlog };
}

// ============= Signals (persist and worsen) =============

const bump = (v: Signal['estimatedValue']): Signal['estimatedValue'] => (v === 'low' ? 'medium' : 'high');

/** Age signals across Reviews: a signal that recurs (the problem was not addressed)
 *  gets louder. Signals that no longer appear have been resolved, so their age is
 *  dropped. */
function escalateSignals(prevAge: Record<string, number>, fresh: Signal[]): { signals: Signal[]; signalAge: Record<string, number> } {
  const signalAge: Record<string, number> = {};
  const signals = fresh.map((sig) => {
    const age = (prevAge[sig.drivenBy] ?? 0) + 1;
    signalAge[sig.drivenBy] = age;
    const estimatedValue = age >= 3 ? 'high' : age >= 2 ? bump(sig.estimatedValue) : sig.estimatedValue;
    return { ...sig, estimatedValue };
  });
  return { signals, signalAge };
}

/** Turn a signal into a candidate Backlog item (the Product Owner's call). */
function itemFromSignal(sig: Signal, state: ZooGameState): BacklogItem | null {
  const id = 'sig-' + sig.drivenBy.replace(/[^a-z]/g, '') + '-' + state.backlog.length;
  const base = { id, status: 'backlog' as const, sprintNumber: null, accessible: true, zone: 'General' };
  if (sig.drivenBy === 'unmet:food') return { ...base, name: 'Food outlet', category: 'amenity', estimate: 5, acceptance: ['Clearly signed', 'Serves food and drink'], services: 'food', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:toilet') return { ...base, name: 'More toilets', category: 'amenity', estimate: 3, acceptance: ['Clearly signed', 'Has enough cubicles'], services: 'toilet', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:rest') return { ...base, name: 'Seating and shade', category: 'amenity', estimate: 3, acceptance: ['Enough seating', 'Some shade'], services: 'rest', serviceCapacity: 500 };
  if (sig.drivenBy === 'crowding') return { ...base, name: 'Extra viewing area', category: 'amenity', estimate: 5, acceptance: ['Eases the queues', 'Good sightlines'] };
  return null;
}

/** Accept a signal: add the candidate item to the Backlog and clear the signal. */
export function acceptSignal(state: ZooGameState, index: number): ZooGameState {
  const sig = state.signals[index];
  if (!sig) return state;
  const item = itemFromSignal(sig, state);
  if (!item) return state;
  return { ...state, backlog: [...state.backlog, item], signals: state.signals.filter((_, i) => i !== index) };
}

// ============= Product Goal and Definition of Done =============

export function setProductGoal(state: ZooGameState, goal: string): ZooGameState {
  return { ...state, productGoal: goal.trim() || state.productGoal };
}

export function setDefinitionOfDone(state: ZooGameState, dod: string[]): ZooGameState {
  return { ...state, definitionOfDone: dod.map((d) => d.trim()).filter((d) => d.length > 0) };
}

// ============= Timed days and the Daily Scrum =============

/** The pool of things that get in the team's way. Framed as zoo-build problems. */
const IMPEDIMENTS: { title: string; detail: string }[] = [
  { title: 'A keeper called in sick', detail: 'Nobody is free to prep the new enclosure, so the build is stalling.' },
  { title: 'The paint delivery is late', detail: 'The colours for this zone have not arrived and work is piling up.' },
  { title: 'A safety check is overdue', detail: 'The big enclosure cannot open until an inspection is signed off.' },
  { title: 'The sign supplier changed the design', detail: 'The new signs do not match the zone and need reworking.' },
  { title: 'The pond pump failed', detail: 'The Waterside filter needs an urgent fix before anything else there progresses.' },
  { title: 'A volunteer no-showed', detail: 'You are short-handed today and the build is slower than planned.' },
];

/** Deterministically decide the impediment (if any) waiting on a given day. Same
 *  game, Sprint and day always give the same result, so it is fair and repeatable. */
export function generateImpediment(gameSeed: number, sprintNumber: number, dayNumber: number): Impediment | null {
  const rng = makeRng(hashStr('impediment:' + sprintNumber + ':' + dayNumber, gameSeed));
  if (rng.next() >= IMPEDIMENT_CHANCE) return null;
  const def = IMPEDIMENTS[Math.floor(rng.next() * IMPEDIMENTS.length)];
  return { id: `imp-${sprintNumber}-${dayNumber}`, title: def.title, detail: def.detail };
}

/** Close the current day and pause for its Daily Scrum, surfacing whatever
 *  impediment (if any) is waiting. The Daily Scrum is the Developers' event; the
 *  team chooses whether to hold it. */
export function endDay(state: ZooGameState): ZooGameState {
  if (state.phase !== 'sprint' || state.dayStage !== 'building') return state;
  const pendingImpediment = generateImpediment(state.gameSeed, state.sprintNumber, state.dayNumber);
  return { ...state, dayStage: 'dailyScrum', pendingImpediment };
}

/** Move to the next day, or end the Sprint (open the Review) after the last day.
 *  `nextMult` sets how much build time the new day has. */
function advanceDay(state: ZooGameState, nextMult: number): ZooGameState {
  const next = state.dayNumber + 1;
  if (next > state.sprintDays) return reviewSprint({ ...state, dayStage: 'building' });
  return { ...state, dayNumber: next, dayStage: 'building', dayTimeMult: nextMult };
}

/** Hold the Daily Scrum: the team inspects progress toward the Sprint's goal and, in
 *  re-planning the day, surfaces any blocker early - so it can be removed before it
 *  grows (outside the event). It costs a little of the next day (the sync is
 *  timeboxed). */
export function runDailyScrum(state: ZooGameState): ZooGameState {
  if (state.dayStage !== 'dailyScrum') return state;
  return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: null }, DAILY_SCRUM_MULT);
}

/** Skip the Daily Scrum. If an impediment was waiting, it goes unspotted and
 *  resurfaces tomorrow, bigger: it carries into the next day with a coaching tip and
 *  a heavier time cost. With nothing waiting, skipping costs nothing this time. */
export function skipDailyScrum(state: ZooGameState): ZooGameState {
  if (state.dayStage !== 'dailyScrum') return state;
  const imp = state.pendingImpediment;
  if (imp) {
    const carried: Impediment = { ...imp, missed: true, tip: MISSED_SCRUM_TIP };
    return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: carried, missedScrums: state.missedScrums + 1 }, SKIP_PENALTY_MULT);
  }
  return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: null }, 1);
}

// ============= The Sprint Review =============

/** Deterministic simulation seed per (game, Sprint). */
const seedFor = (state: ZooGameState): number => ((state.gameSeed * 100003) ^ (state.sprintNumber * 977)) >>> 0;

/** End the Sprint and open the Review. Runs the visitor simulation on the OPEN
 *  (released) items, records velocity (points Done this Sprint), evolves attendance
 *  by word of mouth, ages the signals, and returns unfinished committed work to the
 *  Backlog. The Review inspects and adapts; it is not a release gate. */
export function reviewSprint(state: ZooGameState): ZooGameState {
  const openItems = state.backlog.filter((it) => it.status === 'open').map(toZooItem);
  const result = simulateSprint({ items: openItems, sprintNumber: state.sprintNumber }, DEFAULT_CONFIG, state.attendance, seedFor(state));

  const deliveredThisSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && (it.status === 'done' || it.status === 'open'));
  const velocityPts = deliveredThisSprint.reduce((s, it) => s + it.estimate, 0);

  const { signals, signalAge } = escalateSignals(state.signalAge, result.signals);

  // Unfinished committed items (never built) return to the Backlog.
  const backlog = state.backlog.map((it) =>
    it.sprintNumber === state.sprintNumber && it.status === 'committed' ? { ...it, status: 'backlog' as const, sprintNumber: null } : it,
  );

  return {
    ...state,
    phase: 'review',
    velocity: [...state.velocity, velocityPts],
    attendance: result.nextAttendance,
    lastReview: result,
    signals,
    signalAge,
    committedIds: [],
    backlog,
  };
}

// ============= Retrospective and next Sprint =============

export function startNextSprint(state: ZooGameState, improvement: string): ZooGameState {
  return {
    ...state,
    phase: 'planning',
    sprintNumber: state.sprintNumber + 1,
    improvements: improvement.trim() ? [...state.improvements, improvement.trim()] : state.improvements,
  };
}

export function endGame(state: ZooGameState): ZooGameState {
  return { ...state, phase: 'final' };
}

// ============= Derived reads =============

/** Exhibits and amenities currently open to visitors (the zoo as it stands). */
export const openZoo = (state: ZooGameState): BacklogItem[] => state.backlog.filter((it) => it.status === 'open');

/** Items still available to plan (in the Backlog, not yet committed or built). */
export const availableItems = (state: ZooGameState): BacklogItem[] => state.backlog.filter((it) => it.status === 'backlog');

/** Progress toward the Product Goal: share of the known Backlog that is open. */
export function productGoalProgress(state: ZooGameState): number {
  if (!state.backlog.length) return 0;
  return state.backlog.filter((it) => it.status === 'open').length / state.backlog.length;
}
