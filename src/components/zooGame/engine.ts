import type { ZooGameState, BacklogItem } from './types';
import type { Signal } from './simulation/types';
import { DEFAULT_CONFIG } from './simulation/config';
import { simulateSprint } from './simulation/simulate';
import { toZooItem } from './config';

// ============= Planning =============

/** Commit the chosen Backlog items into the current Sprint and open it for play. */
export function planSprint(state: ZooGameState, ids: string[]): ZooGameState {
  const committed = new Set(ids);
  const backlog = state.backlog.map((it) =>
    committed.has(it.id) && it.status === 'backlog' ? { ...it, status: 'committed' as const, sprintNumber: state.sprintNumber } : it,
  );
  return { ...state, phase: 'sprint', committedIds: [...ids], backlog };
}

// ============= Building and releasing =============

/** A committed item is built to the Definition of Done (in this reducer slice, an
 *  explicit action; the design-and-build mechanic replaces it later). */
export function buildItem(state: ZooGameState, id: string): ZooGameState {
  const backlog = state.backlog.map((it) => (it.id === id && it.status === 'committed' ? { ...it, status: 'done' as const } : it));
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
