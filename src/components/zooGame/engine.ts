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
    template: draft.template,
    acceptance: acceptance.length ? acceptance : ['Meets its purpose'],
    status: 'backlog' as const, sprintNumber: null, accessible: true,
    unsized: true, estimate: 0, trueSize: DEFAULT_SIZE[draft.category] ?? 5,
  };
  let item: BacklogItem;
  if (draft.category === 'exhibit') {
    // Animals and enclosures are SEPARATE PBIs. The PO links the animal to an enclosure
    // (draft.enclosureId) - it can only be built once that enclosure is Done. Left unlinked,
    // it is not gated (nothing to wait for); assign it later by refining it.
    item = { ...base, enclosureId: draft.enclosureId || undefined, appeal: { families: 6, enthusiasts: 6, comfortSeekers: 6 }, capacity: 320 };
  } else if (draft.category === 'amenity') item = { ...base, services: draft.services, serviceCapacity: draft.services ? 500 : undefined };
  else if (draft.category === 'enclosure') item = { ...base, enclosureSize: draft.enclosureSize ?? 'medium' };
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
      ? {
          ...it,
          name: draft.name.trim() || it.name,
          story: draft.story?.trim() || undefined,
          zone: zone || it.zone,
          acceptance: acceptance.length ? acceptance : it.acceptance,
          // An animal can be (re)assigned to an enclosure while refining it.
          ...(it.category === 'exhibit' ? { enclosureId: draft.enclosureId || undefined } : {}),
          ...(it.category === 'enclosure' && draft.enclosureSize ? { enclosureSize: draft.enclosureSize } : {}),
        }
      : it,
  );
  const zones = zone && !state.zones.includes(zone) ? [...state.zones, zone] : state.zones;
  return { ...state, backlog, zones };
}

/** Refine an EPIC by splitting the chosen members out into their own PBIs. Each animal
 *  member becomes an enclosure PBI plus the animal PBI that lives in it (the animal
 *  depends on its enclosure); each facility member becomes an amenity PBI. The new PBIs
 *  arrive unsized (ready to estimate). The epic is removed once every member is split out;
 *  split some and it stays with the rest, so refinement can be incremental. */
export function splitEpic(state: ZooGameState, id: string, memberIds: string[]): ZooGameState {
  const idx = state.backlog.findIndex((it) => it.id === id && it.category === 'epic');
  if (idx < 0) return state;
  const epicItem = state.backlog[idx];
  const members = epicItem.epicMembers ?? [];
  const chosen = members.filter((mem) => memberIds.includes(mem.id));
  if (!chosen.length) return state;
  const zone = epicItem.zone;

  const created: BacklogItem[] = [];
  for (const mem of chosen) {
    if (mem.kind === 'exhibit') {
      created.push({
        id: mem.enclosureId ?? `${mem.id}-enc`, name: `${mem.name} Enclosure`, category: 'enclosure', zone,
        enclosureSize: mem.footprint ?? 'medium',
        acceptance: ['Securely fenced and escape-proof', 'Big enough for its animals', 'Ground, shelter and water set up'],
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: Math.max(3, Math.round(mem.size / 2)),
      });
      created.push({
        id: mem.id, name: mem.name, category: 'exhibit', zone, template: mem.template, enclosureId: mem.enclosureId,
        acceptance: ['Recognisable as a ' + mem.name.toLowerCase(), 'Uses at least two colours', 'No bare patches'],
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: mem.size,
        appeal: mem.appeal ? { families: mem.appeal[0], enthusiasts: mem.appeal[1], comfortSeekers: mem.appeal[2] } : undefined, capacity: 320,
      });
    } else {
      created.push({
        id: mem.id, name: mem.name, category: 'amenity', zone, services: mem.services, serviceCapacity: 500,
        acceptance: ['Clearly signed', mem.services === 'food' ? 'Serves food and drink' : mem.services === 'toilet' ? 'Has enough cubicles' : 'Enough seating'],
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: mem.size,
      });
    }
  }

  const remaining = members.filter((mem) => !memberIds.includes(mem.id));
  const replacement = remaining.length ? [{ ...epicItem, epicMembers: remaining }, ...created] : created;
  const backlog = [...state.backlog.slice(0, idx), ...replacement, ...state.backlog.slice(idx + 1)];
  return { ...state, backlog };
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
  // The plan is the BUILD work (the design steps). Placing and opening to visitors is a
  // separate step - the Open button on a Done item - not a task, so the plan does not
  // include "place it" or "open it" (that would duplicate the Open action).
  const labels = item.category === 'enclosure'
    ? ['Set the footprint size', 'Fence it securely', 'Lay the ground, shelter and water']
    : item.category === 'exhibit'
    ? [`Sketch the ${item.name.toLowerCase()}'s look`, 'Colour its body and head', 'Add its markings and features']
    : item.category === 'amenity'
      ? [`Design the ${item.name.toLowerCase()}`, 'Colour it', 'Put up a sign']
      : ['Choose the plant type', 'Colour the foliage'];
  return labels.map((label, i) => ({ id: `${item.id}-t${i}`, label, done: false }));
}

/** Whether a PBI's whole plan is complete (an empty plan counts as complete). */
export const allTasksDone = (item: BacklogItem): boolean => (item.tasks ?? []).filter((t) => t.label.trim()).every((t) => t.done);

/** Replace a PBI's task plan (used for add / edit / remove / suggest during Planning). */
export function setItemTasks(state: ZooGameState, id: string, tasks: SprintTask[]): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, tasks } : it)) };
}

/** Tick a plan task done / not-done as the Developers work through it. Ticking the last
 *  task on a built item finishes it (Doing -> Done); un-ticking a task on a Done-but-
 *  not-yet-open item sends it back to Doing. */
export function toggleItemTask(state: ZooGameState, id: string, taskId: string): ZooGameState {
  const backlog = state.backlog.map((it) => {
    if (it.id !== id) return it;
    const next = { ...it, tasks: (it.tasks ?? []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) };
    if (next.status === 'committed' && next.design && allTasksDone(next)) return { ...next, status: 'done' as const };
    if (next.status === 'done' && !allTasksDone(next)) return { ...next, status: 'committed' as const };
    return next;
  });
  return { ...state, backlog };
}

/** How many committed items are in Doing (started, not yet Done) this Sprint. */
export const doingCount = (state: ZooGameState): number =>
  state.backlog.filter((it) => it.status === 'committed' && it.started && it.sprintNumber === state.sprintNumber).length;

/** The enclosure an exhibit lives in, if any (looked up by `enclosureId`). */
export const enclosureOf = (state: ZooGameState, item: BacklogItem): BacklogItem | undefined =>
  item.enclosureId ? state.backlog.find((it) => it.id === item.enclosureId) : undefined;

/** Whether an animal's habitat is built yet: you build the enclosure BEFORE the animals.
 *  True when the item is not an exhibit, has no enclosure, or its enclosure is built
 *  (Done or Open). A referenced-but-unbuilt enclosure blocks the animal. */
export function enclosureReady(state: ZooGameState, item: BacklogItem): boolean {
  if (item.category !== 'exhibit' || !item.enclosureId) return true;
  const home = enclosureOf(state, item);
  return !!home && (home.status === 'done' || home.status === 'open');
}

/** Start work on a committed item: it moves from To Do into Doing (the studio opens).
 *  Blocked once the WIP limit is reached - finish something before starting more - and,
 *  for an animal, until its enclosure is built (you build the habitat first). */
export function startItem(state: ZooGameState, id: string): ZooGameState {
  const item = state.backlog.find((it) => it.id === id);
  if (!item || item.status !== 'committed' || item.started) return state;
  if (doingCount(state) >= state.wipLimit) return state; // WIP limit reached
  if (!enclosureReady(state, item)) return state; // build the enclosure before the animals
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, started: true } : it)) };
}

/** Mark / unmark an item as essential to the Sprint Goal (done at Planning). */
export function toggleGoalCritical(state: ZooGameState, id: string): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, goalCritical: !it.goalCritical } : it)) };
}

/** Choose the Sprint length (number of build days) at Planning. */
export function setSprintDays(state: ZooGameState, days: number): ZooGameState {
  if (state.phase !== 'planning' && state.phase !== 'refine') return state;
  return { ...state, sprintDays: Math.max(1, Math.round(days)) };
}

/** Toggle learn mode: pause the day clock so there is no real-time pressure. */
export function setLearnMode(state: ZooGameState, on: boolean): ZooGameState {
  return { ...state, learnMode: on };
}

/** Set an enclosure's footprint size (chosen while building the habitat in the studio). */
export function setEnclosureSize(state: ZooGameState, id: string, size: 'small' | 'medium' | 'large'): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, enclosureSize: size } : it)) };
}

/** Set a feature's free-placement position in the park (from dragging on the Park tab). */
export function setItemPos(state: ZooGameState, id: string, pos: { x: number; y: number }): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, pos } : it)) };
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
/** Give a committed item a task plan if it has none, so every item goes through the
 *  Doing checklist and nothing can skip straight to Done. A plan written during
 *  Planning (the "how") is kept as-is. */
const withPlan = (item: BacklogItem): BacklogItem =>
  (item.tasks ?? []).filter((t) => t.label.trim()).length ? item : { ...item, tasks: suggestTasks(item) };

export function planSprint(state: ZooGameState, ids: string[]): ZooGameState {
  // Only estimated (sized) Backlog items can be committed.
  const committed = new Set(state.backlog.filter((it) => ids.includes(it.id) && it.status === 'backlog' && !it.unsized).map((it) => it.id));
  const backlog = state.backlog.map((it) =>
    committed.has(it.id) ? withPlan({ ...it, status: 'committed' as const, sprintNumber: state.sprintNumber }) : it,
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
  const backlog = state.backlog.map((it) => (it.id === id ? withPlan({ ...it, status: 'committed' as const, sprintNumber: state.sprintNumber }) : it));
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
    // The design is built in the studio. The item is only Done when its plan is also
    // complete - otherwise it waits in Doing while the Developers tick the tasks off.
    const built = design
      ? { ...it, started: true, design, appeal: it.category === 'exhibit' ? appealFromDesign(it, design) : it.appeal }
      : { ...it, started: true };
    return allTasksDone(built) ? { ...built, status: 'done' as const } : { ...built, status: 'committed' as const };
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
  // A disciplined team (the "hold the Daily Scrum every day" improvement) runs an
  // efficient, timeboxed Daily Scrum that costs no build time.
  return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: null }, state.scrumDiscipline ? 1 : DAILY_SCRUM_MULT);
}

/** Skip the Daily Scrum. If an impediment was waiting, it goes unspotted and
 *  resurfaces tomorrow, bigger: it carries into the next day with a coaching tip and
 *  a heavier time cost. With nothing waiting, skipping costs nothing this time. */
/** Carry on with the original plan instead of adapting. With a blocker surfaced, ignoring
 *  it lets it grow overnight (a big cost tomorrow). With nothing surfaced, this is just the
 *  Daily Scrum concluding - it still costs its small timebox (the event is not skippable). */
export function skipDailyScrum(state: ZooGameState): ZooGameState {
  if (state.dayStage !== 'dailyScrum') return state;
  const imp = state.pendingImpediment;
  if (imp) {
    const carried: Impediment = { ...imp, missed: true, tip: MISSED_SCRUM_TIP };
    return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: carried, missedScrums: state.missedScrums + 1 }, SKIP_PENALTY_MULT);
  }
  return advanceDay({ ...state, pendingImpediment: null, carriedImpediment: null }, state.scrumDiscipline ? 1 : DAILY_SCRUM_MULT);
}

// ============= The Sprint Review =============

/** Deterministic simulation seed per (game, Sprint). */
const seedFor = (state: ZooGameState): number => ((state.gameSeed * 100003) ^ (state.sprintNumber * 977)) >>> 0;

/** End the Sprint and open the Review. Runs the visitor simulation on the OPEN
 *  (released) items, records velocity (points Done this Sprint), evolves attendance
 *  by word of mouth, ages the signals, and returns unfinished committed work to the
 *  Backlog. The Review inspects and adapts; it is not a release gate. */
/** Product-wide quality bars that, if the team's Definition of Done does NOT require
 *  them, hurt the visitor outcome - so the DoD's content bites the outcome, not just the
 *  per-item Done gate. Weakening the DoD (dropping these at the Retro) has consequences. */
const DOD_CONCERNS = [
  { test: /safe|accessib/i, penalty: 0.9, label: 'safe & accessible', effect: 'some visitors can’t safely reach parts of the zoo' },
  { test: /signpost|find|wayfind/i, penalty: 0.9, label: 'signposted', effect: 'visitors struggle to find the exhibits' },
] as const;

/** Which quality concerns the current Definition of Done leaves uncovered. */
export function dodGaps(dod: string[]): { label: string; effect: string }[] {
  return DOD_CONCERNS.filter((c) => !dod.some((d) => c.test.test(d))).map((c) => ({ label: c.label, effect: c.effect }));
}
/** The happiness multiplier from a weak DoD (1 when every concern is covered). */
export function dodHappinessFactor(dod: string[]): number {
  return DOD_CONCERNS.reduce((f, c) => (dod.some((d) => c.test.test(d)) ? f : f * c.penalty), 1);
}

export function reviewSprint(state: ZooGameState): ZooGameState {
  // Enclosures are infrastructure, not something visitors score directly - exclude them
  // from the simulation (the animals inside them carry the appeal).
  const openItems = state.backlog.filter((it) => it.status === 'open' && it.category !== 'enclosure').map(toZooItem);
  const sim = simulateSprint({ items: openItems, sprintNumber: state.sprintNumber }, DEFAULT_CONFIG, state.attendance, seedFor(state));
  // A weak Definition of Done costs happiness (safety/wayfinding gaps visitors feel).
  const dodFactor = dodHappinessFactor(state.definitionOfDone);
  const result = dodFactor < 1
    ? { ...sim, overallHappiness: Math.round(sim.overallHappiness * dodFactor), segments: sim.segments.map((s) => ({ ...s, happiness: Math.round(s.happiness * dodFactor) })) }
    : sim;

  const committedThisSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber);
  const deliveredThisSprint = committedThisSprint.filter((it) => it.status === 'done' || it.status === 'open');
  const velocityPts = deliveredThisSprint.reduce((s, it) => s + it.estimate, 0);

  // The Sprint Goal is an OUTCOME, not "finish everything". It is met when the items the
  // team marked as essential to the Goal were delivered - the rest is scope that can flex.
  // If nothing was marked essential, fall back to all committed items.
  const essentials = committedThisSprint.filter((it) => it.goalCritical);
  const goalItems = essentials.length ? essentials : committedThisSprint;
  const sprintGoalMet = state.sprintGoal.trim()
    ? goalItems.length > 0 && goalItems.every((it) => it.status === 'done' || it.status === 'open')
    : null;

  const { signals, signalAge } = escalateSignals(state.signalAge, result.signals);

  // Unfinished committed items (never built) return to the Backlog; clear the per-Sprint
  // goal-critical mark so it is re-decided next time they are planned.
  const backlog = state.backlog.map((it) =>
    it.sprintNumber === state.sprintNumber && it.status === 'committed' ? { ...it, status: 'backlog' as const, sprintNumber: null, goalCritical: false } : it,
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
  // The chosen improvement has a mechanical effect next Sprint, so inspect-and-adapt
  // actually changes how the team works (not just a note): "finish fewer" tightens the
  // WIP limit; committing to the Daily Scrum makes it efficient (no time cost).
  const imp = improvement.trim();
  const wipLimit = /finish fewer/i.test(imp) ? Math.max(1, state.wipLimit - 1) : state.wipLimit;
  const scrumDiscipline = state.scrumDiscipline || /daily scrum every day/i.test(imp);
  return {
    ...state,
    phase: 'planning',
    sprintNumber: state.sprintNumber + 1,
    sprintGoal: '',
    sprintGoalMet: null,
    wipLimit,
    scrumDiscipline,
    improvements: imp ? [...state.improvements, imp] : state.improvements,
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

/** Progress toward the Product Goal - "a zoo visitors love and come back to" - measured
 *  by the OUTCOME, not by how much of the Backlog is built. Visitor happiness (0..100)
 *  is the "love", and because happy visitors return it also drives "come back", so it is
 *  the signal we track. Building more Backlog does not move this on its own; delivering
 *  things visitors love does. Zero until the first Review produces an outcome. */
const GOAL_HAPPINESS_FLOOR = 25; // below this, visitors are not enjoying the zoo
const GOAL_HAPPINESS_TARGET = 80; // "visitors love it": the Product Goal outcome
export function productGoalProgress(state: ZooGameState): number {
  const h = state.lastReview?.overallHappiness;
  if (h == null) return 0;
  return Math.max(0, Math.min(1, (h - GOAL_HAPPINESS_FLOOR) / (GOAL_HAPPINESS_TARGET - GOAL_HAPPINESS_FLOOR)));
}
