import type { ZooGameState, BacklogItem, Impediment, PbiDraft, ItemCategory, SprintTask } from './types';
import type { Signal } from './simulation/types';
import type { ItemDesign } from './design';
import { appealFromDesign } from './design';
import { DEFAULT_CONFIG } from './simulation/config';
import { simulateSprint } from './simulation/simulate';
import { makeRng, hashStr } from './simulation/rng';
import { toZooItem, IMPEDIMENT_CHANCE, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT, MISSED_SCRUM_TIP } from './config';

// ============= Refinement: estimation and ordering =============

const FIB = [1, 2, 3, 5, 8, 13, 21];
const snapFib = (n: number): number => FIB.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

/** Deterministic planning-poker hand for an item: several estimators reveal a
 *  Fibonacci card clustered around the item's true size, so the spread is real but
 *  reproducible. */
export function pokerHand(item: BacklogItem, seed: number): number[] {
  const rng = makeRng(hashStr('poker:' + item.id, seed));
  const base = item.trueSize ?? item.estimate ?? 5;
  return Array.from({ length: 4 }, () => snapFib(base * (1 + (rng.next() - 0.5) * 0.7)));
}

/** The team's suggested estimate from a hand: the most common card, ties rounding up
 *  (the honest forecast, not an average). */
export function estimateSuggestion(hand: number[]): number {
  const counts = new Map<number, number>();
  for (const c of hand) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best = hand[0], bestN = 0;
  for (const [v, n] of counts) if (n > bestN || (n === bestN && v > best)) { best = v; bestN = n; }
  return best;
}

/** Turn the user-story preference on or off (a default, never forced per item). */
export function setUseUserStories(state: ZooGameState, on: boolean): ZooGameState {
  return { ...state, useUserStories: on };
}

/** Coach a user story from a PBI draft: "As a ... I want ... so that ...", shaped by
 *  the item's kind - the same outcome-first idea as the Sprint Goal suggestion. */
export function suggestStory(p: { name: string; category: ItemCategory; zone: string }): { role: string; want: string; soThat: string } {
  const name = p.name.trim() || (p.category === 'exhibit' ? 'a new animal' : p.category === 'flora' ? 'some planting' : 'a facility');
  const zone = p.zone.trim() || 'the park';
  if (p.category === 'exhibit') return { role: 'a visiting family', want: `to see ${name} in ${zone}`, soThat: 'there is more to enjoy and a reason to come back' };
  if (p.category === 'flora') return { role: 'a visitor', want: `${name} planted around ${zone}`, soThat: 'the area feels green, shady and pleasant to spend time in' };
  return { role: 'a visitor', want: `${name} in ${zone}`, soThat: 'I can stay longer without cutting my visit short' };
}

const DEFAULT_SIZE: Record<string, number> = { exhibit: 8, amenity: 5, flora: 3 };

/** Add a Product Backlog Item the Product Owner has written (name + acceptance
 *  criteria + kind + zone). It arrives UNSIZED - it must be estimated before it can
 *  be planned - so the PO can grow the Backlog before Sprint 1 or during a Sprint. */
export function addPbi(state: ZooGameState, draft: PbiDraft): ZooGameState {
  const name = draft.name.trim();
  if (!name) return state;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
  const id = `pbi-${slug}-${state.backlog.length}`;
  const zone = draft.zone.trim() || 'General';
  const acceptance = draft.acceptance.map((a) => a.trim()).filter(Boolean);
  const base = {
    id, name, story: draft.story?.trim() || undefined, category: draft.category, zone,
    acceptance: acceptance.length ? acceptance : ['Meets its purpose'],
    status: 'backlog' as const, sprintNumber: null, accessible: true,
    unsized: true, estimate: 0, trueSize: DEFAULT_SIZE[draft.category] ?? 5,
  };
  let item: BacklogItem;
  if (draft.category === 'exhibit') item = { ...base, appeal: { families: 6, enthusiasts: 6, comfortSeekers: 6 }, capacity: 320 };
  else if (draft.category === 'amenity') item = { ...base, services: draft.services, serviceCapacity: draft.services ? 500 : undefined };
  else item = base; // flora is scenery: designable and placeable, no simulation input yet
  const zones = state.zones.includes(zone) ? state.zones : [...state.zones, zone];
  return { ...state, backlog: [...state.backlog, item], zones };
}

/** Refine an existing Backlog PBI (edit its name, zone and acceptance criteria).
 *  Only items still in the Backlog can be refined. */
export function refinePbi(state: ZooGameState, id: string, draft: PbiDraft): ZooGameState {
  const acceptance = draft.acceptance.map((a) => a.trim()).filter(Boolean);
  const zone = draft.zone.trim();
  const backlog = state.backlog.map((it) =>
    it.id === id && it.status === 'backlog'
      ? { ...it, name: draft.name.trim() || it.name, story: draft.story?.trim() || undefined, zone: zone || it.zone, acceptance: acceptance.length ? acceptance : it.acceptance }
      : it,
  );
  const zones = zone && !state.zones.includes(zone) ? [...state.zones, zone] : state.zones;
  return { ...state, backlog, zones };
}

/** Commit an estimate to a Backlog item (refinement): it becomes sized and can now
 *  be planned. */
export function estimateItem(state: ZooGameState, id: string, points: number): ZooGameState {
  const backlog = state.backlog.map((it) => (it.id === id && it.status === 'backlog' ? { ...it, estimate: points, unsized: false } : it));
  return { ...state, backlog };
}

// ============= The plan: decomposing a PBI into tasks (Planning's "how") =============

/** A coached default breakdown of how a PBI gets built, by kind - the design work and
 *  then opening it. It is a starting point the Developers edit, not a fixed template. */
export function suggestTasks(item: BacklogItem): SprintTask[] {
  const zone = item.zone;
  const labels = item.category === 'exhibit'
    ? [`Sketch the ${item.name.toLowerCase()}'s look`, 'Colour its body and head', 'Add its markings and features', `Place it in ${zone} and open to visitors`]
    : item.category === 'amenity'
      ? [`Design the ${item.name.toLowerCase()}`, 'Colour it and put up a sign', `Place it in ${zone} and open`]
      : ['Choose the plant type', 'Colour the foliage', `Place it in ${zone}`];
  return labels.map((label, i) => ({ id: `${item.id}-t${i}`, label, done: false }));
}

/** Replace a PBI's task plan (used for add / edit / remove / suggest during Planning). */
export function setItemTasks(state: ZooGameState, id: string, tasks: SprintTask[]): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, tasks } : it)) };
}

/** Tick a plan task done / not-done as the Developers work through it on the board. */
export function toggleItemTask(state: ZooGameState, id: string, taskId: string): ZooGameState {
  return {
    ...state,
    backlog: state.backlog.map((it) =>
      it.id === id ? { ...it, tasks: (it.tasks ?? []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) } : it,
    ),
  };
}

/** Re-order the Product Backlog (the Product Owner's job): move an item up or down
 *  among the other still-in-Backlog items. */
export function moveItem(state: ZooGameState, id: string, dir: 'up' | 'down'): ZooGameState {
  const backlog = [...state.backlog];
  const idx = backlog.findIndex((it) => it.id === id);
  if (idx < 0 || backlog[idx].status !== 'backlog') return state;
  // Find the previous/next item that is also still in the Backlog.
  const step = dir === 'up' ? -1 : 1;
  let j = idx + step;
  while (j >= 0 && j < backlog.length && backlog[j].status !== 'backlog') j += step;
  if (j < 0 || j >= backlog.length) return state;
  [backlog[idx], backlog[j]] = [backlog[j], backlog[idx]];
  return { ...state, backlog };
}

// ============= Park layout (arrange within the Scrum flow) =============

/** Move an item into a different zone. Building still happens via Sprints; this just
 *  arranges what you have built. A new zone name is added to the known zones. */
export function moveToZone(state: ZooGameState, id: string, zone: string): ZooGameState {
  const z = zone.trim();
  if (!z) return state;
  const backlog = state.backlog.map((it) => (it.id === id ? { ...it, zone: z } : it));
  const zones = state.zones.includes(z) ? state.zones : [...state.zones, z];
  return { ...state, backlog, zones };
}

/** Create a new (empty) themed zone. */
export function addZone(state: ZooGameState, name: string): ZooGameState {
  const z = name.trim();
  if (!z || state.zones.includes(z)) return state;
  return { ...state, zones: [...state.zones, z] };
}

/** Rename a zone everywhere (the zone list and every item in it). */
export function renameZone(state: ZooGameState, oldName: string, newName: string): ZooGameState {
  const z = newName.trim();
  if (!z || z === oldName || state.zones.includes(z)) return state;
  const zones = state.zones.map((x) => (x === oldName ? z : x));
  const backlog = state.backlog.map((it) => (it.zone === oldName ? { ...it, zone: z } : it));
  return { ...state, zones, backlog };
}

/** Move an item to just before another (drag-and-drop reorder of the Backlog). */
export function moveItemBefore(state: ZooGameState, id: string, beforeId: string): ZooGameState {
  if (id === beforeId) return state;
  const backlog = [...state.backlog];
  const from = backlog.findIndex((it) => it.id === id);
  if (from < 0) return state;
  const [item] = backlog.splice(from, 1);
  const to = backlog.findIndex((it) => it.id === beforeId);
  if (to < 0) return state;
  backlog.splice(to, 0, item);
  return { ...state, backlog };
}

/** Reorder an item within its zone (swap with the nearest same-zone item), so you
 *  can arrange the plots in an enclosure. */
export function reorderInZone(state: ZooGameState, id: string, dir: 'up' | 'down'): ZooGameState {
  const backlog = [...state.backlog];
  const idx = backlog.findIndex((it) => it.id === id);
  if (idx < 0) return state;
  const zone = backlog[idx].zone;
  const step = dir === 'up' ? -1 : 1;
  let j = idx + step;
  while (j >= 0 && j < backlog.length && backlog[j].zone !== zone) j += step;
  if (j < 0 || j >= backlog.length) return state;
  [backlog[idx], backlog[j]] = [backlog[j], backlog[idx]];
  return { ...state, backlog };
}

// ============= Planning =============

/** Commit the chosen Backlog items into the current Sprint and open it for play.
 *  The Sprint starts on day 1, ready to build. */
export function planSprint(state: ZooGameState, ids: string[]): ZooGameState {
  // Only estimated (sized) Backlog items can be committed.
  const committed = new Set(state.backlog.filter((it) => ids.includes(it.id) && it.status === 'backlog' && !it.unsized).map((it) => it.id));
  const backlog = state.backlog.map((it) =>
    committed.has(it.id) ? { ...it, status: 'committed' as const, sprintNumber: state.sprintNumber } : it,
  );
  return {
    ...state, phase: 'sprint', committedIds: [...committed], backlog,
    dayNumber: 1, dayStage: 'building', dayTimeMult: 1, pendingImpediment: null, carriedImpediment: null,
  };
}

/** Pull a Backlog item into the current Sprint mid-Sprint. Scope can grow by
 *  agreement during the Sprint, as long as the Sprint's goal is not put at risk -
 *  so the Backlog stays visible and pullable while building. Must be estimated first. */
export function pullIntoSprint(state: ZooGameState, id: string): ZooGameState {
  if (state.phase !== 'sprint') return state;
  const item = state.backlog.find((it) => it.id === id && it.status === 'backlog' && !it.unsized);
  if (!item) return state;
  const backlog = state.backlog.map((it) => (it.id === id ? { ...it, status: 'committed' as const, sprintNumber: state.sprintNumber } : it));
  return { ...state, committedIds: [...state.committedIds, id], backlog };
}

// ============= Building and releasing =============

/** A committed item is built to the Definition of Done. One PBI builds one thing:
 *  an exhibit's animal or an amenity's building. For an exhibit the appeal is
 *  computed from the design (the choices are the product). Without a design the item
 *  is just marked Done. */
export function buildItem(state: ZooGameState, id: string, design?: ItemDesign): ZooGameState {
  const backlog = state.backlog.map((it) => {
    if (it.id !== id || it.status !== 'committed') return it;
    if (!design) return { ...it, status: 'done' as const };
    return { ...it, status: 'done' as const, design, appeal: it.category === 'exhibit' ? appealFromDesign(it, design) : it.appeal };
  });
  return { ...state, backlog };
}

/** Go back and edit an already-built item (Done or Open) without changing its
 *  status - so you can refine a design after the fact. */
export function editItem(state: ZooGameState, id: string, design: ItemDesign): ZooGameState {
  const backlog = state.backlog.map((it) =>
    it.id === id && (it.status === 'done' || it.status === 'open')
      ? { ...it, design, appeal: it.category === 'exhibit' ? appealFromDesign(it, design) : it.appeal }
      : it,
  );
  return { ...state, backlog };
}

/** Add another PBI for the same thing (e.g. a second lion). Every animal is its own
 *  Product Backlog Item, so a pride is several lion PBIs - this creates a fresh
 *  backlog item cloned from an existing one, ready to be planned and built. */
export function addAnother(state: ZooGameState, id: string): ZooGameState {
  const src = state.backlog.find((it) => it.id === id);
  if (!src) return state;
  const n = state.backlog.filter((it) => it.name.replace(/ \d+$/, '') === src.name.replace(/ \d+$/, '') && it.category === src.category).length;
  const base = src.name.replace(/ \d+$/, '');
  const clone: BacklogItem = {
    ...src, id: `${src.id.replace(/-\d+$/, '')}-${n + 1}`, name: `${base} ${n + 1}`,
    status: 'backlog', sprintNumber: null, design: undefined, appeal: src.appeal,
  };
  return { ...state, backlog: [...state.backlog, clone] };
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

/** Turn a signal into a candidate Backlog item (the Product Owner's call). Emergent
 *  work arrives UNSIZED - it must be refined (estimated) before it can be planned.
 *  `trueSize` is the hidden intended size the planning poker clusters around. */
function itemFromSignal(sig: Signal, state: ZooGameState): BacklogItem | null {
  const id = 'sig-' + sig.drivenBy.replace(/[^a-z]/g, '') + '-' + state.backlog.length;
  const base = { id, status: 'backlog' as const, sprintNumber: null, accessible: true, zone: 'General', unsized: true, estimate: 0 };
  if (sig.drivenBy === 'unmet:food') return { ...base, name: 'Food outlet', category: 'amenity', trueSize: 5, acceptance: ['Clearly signed', 'Serves food and drink'], services: 'food', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:toilet') return { ...base, name: 'More toilets', category: 'amenity', trueSize: 3, acceptance: ['Clearly signed', 'Has enough cubicles'], services: 'toilet', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:rest') return { ...base, name: 'Seating and shade', category: 'amenity', trueSize: 3, acceptance: ['Enough seating', 'Some shade'], services: 'rest', serviceCapacity: 500 };
  if (sig.drivenBy === 'crowding') return { ...base, name: 'Extra viewing area', category: 'amenity', trueSize: 5, acceptance: ['Eases the queues', 'Good sightlines'] };
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

// ============= Product Goal, Sprint Goal and Definition of Done =============

export function setProductGoal(state: ZooGameState, goal: string): ZooGameState {
  return { ...state, productGoal: goal.trim() || state.productGoal };
}

/** The Sprint Goal: a single, editable objective for the Sprint (may be blank). */
export function setSprintGoal(state: ZooGameState, goal: string): ZooGameState {
  return { ...state, sprintGoal: goal };
}

/** Coach an outcome-shaped Sprint Goal from the items the PO is selecting: what the
 *  Sprint delivers, so that visitors get something. */
export function suggestSprintGoal(items: BacklogItem[]): string {
  if (!items.length) return 'Give visitors a reason to come back this Sprint.';
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.zone] = (counts[it.zone] ?? 0) + 1;
  const zone = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const exhibits = items.filter((i) => i.category === 'exhibit').length;
  const amenities = items.filter((i) => i.category === 'amenity').length;
  if (exhibits && amenities) return `Open the ${zone} zone with things to see and somewhere to stop, so visitors stay longer.`;
  if (amenities) return `Serve the ${zone} zone so visitors can eat, rest and stay longer.`;
  return `Bring the ${zone} zone to life so visitors have more to enjoy.`;
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
  // The day's clock runs through the start-of-day breather and the build, so a day
  // can end from either stage (the pause uses real time).
  if (state.phase !== 'sprint' || (state.dayStage !== 'building' && state.dayStage !== 'dayStart')) return state;
  // The last day ends straight to the Review: there is no next day to re-plan, so
  // there is no end-of-day Daily Scrum.
  if (state.dayNumber >= state.sprintDays) return reviewSprint(state);
  const pendingImpediment = generateImpediment(state.gameSeed, state.sprintNumber, state.dayNumber);
  return { ...state, dayStage: 'dailyScrum', pendingImpediment };
}

/** Move to the next day, or end the Sprint (open the Review) after the last day.
 *  A new day opens paused (`dayStart`) - a breather before the build resumes; the
 *  team starts it when ready. `nextMult` sets how much build time the new day has. */
function advanceDay(state: ZooGameState, nextMult: number): ZooGameState {
  const next = state.dayNumber + 1;
  if (next > state.sprintDays) return reviewSprint({ ...state, dayStage: 'building' });
  return { ...state, dayNumber: next, dayStage: 'dayStart', dayTimeMult: nextMult };
}

/** Begin the new day's build (leaves the between-days pause). */
export function startDay(state: ZooGameState): ZooGameState {
  if (state.dayStage !== 'dayStart') return state;
  return { ...state, dayStage: 'building' };
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

  const committedThisSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber);
  const deliveredThisSprint = committedThisSprint.filter((it) => it.status === 'done' || it.status === 'open');
  const velocityPts = deliveredThisSprint.reduce((s, it) => s + it.estimate, 0);

  // The Sprint Goal is met when everything committed to it was delivered (Done).
  const sprintGoalMet = state.sprintGoal.trim() ? committedThisSprint.length > 0 && deliveredThisSprint.length === committedThisSprint.length : null;

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
    sprintGoalMet,
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
    sprintGoal: '',
    sprintGoalMet: null,
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
