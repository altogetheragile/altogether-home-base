import type { ZooGameState, BacklogItem, Impediment, PbiDraft, ItemCategory, SprintTask, PoDecisions, ZooConnector } from './types';
import type { Signal } from './simulation/types';
import type { ItemDesign } from './design';
import { appealFromDesign, amenityAcceptance, enclosureAcceptance, exhibitAcceptance, isLandscapeType } from './design';
import { DEFAULT_CONFIG } from './simulation/config';
import { simulateSprint } from './simulation/simulate';
import { makeRng, hashStr } from './simulation/rng';
import { toZooItem, IMPEDIMENT_CHANCE, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT, MISSED_SCRUM_TIP, REFINE_COSTS, REFINE_PTS, zooCapacity } from './config';

/** Refining the Backlog DURING a running Sprint spends build time (see REFINE_COSTS): add
 *  the cost to the current day's refinement penalty. Free outside the Sprint (the
 *  Refinement and Planning phases are the dedicated time to refine), so this is a no-op
 *  unless a Sprint is in progress. */
const chargeRefine = (before: ZooGameState, after: ZooGameState, seconds: number): ZooGameState =>
  before.phase === 'sprint' ? { ...after, refinePenalty: after.refinePenalty + seconds } : after;

/** Refining BETWEEN Sprints is not free either: it costs the Sprint about to be forecast some of
 *  its capacity. Refinement is ongoing work the team does every Sprint, so the trade-off has to be
 *  felt - time spent getting the Backlog ready is time not spent building. */
const chargeRefinePts = (before: ZooGameState, after: ZooGameState, pts: number): ZooGameState =>
  before.phase === 'refine' || before.phase === 'planning' ? { ...after, refineSpend: after.refineSpend + pts } : after;

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
  return chargeRefinePts(state, chargeRefine(state, { ...state, backlog: [...state.backlog, item], zones }, REFINE_COSTS.addPbi), REFINE_PTS.addPbi);
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
          // An animal can be (re)assigned to an enclosure and given a base shape while refining it.
          ...(it.category === 'exhibit' ? { enclosureId: draft.enclosureId || undefined, template: draft.template || undefined } : {}),
          ...(it.category === 'enclosure' && draft.enclosureSize ? { enclosureSize: draft.enclosureSize } : {}),
        }
      : it,
  );
  const zones = zone && !state.zones.includes(zone) ? [...state.zones, zone] : state.zones;
  return chargeRefinePts(state, chargeRefine(state, { ...state, backlog, zones }, REFINE_COSTS.refinePbi), REFINE_PTS.refinePbi);
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
        id: mem.enclosureId ?? `${mem.id}-enc`, name: mem.habitat ?? `${mem.name} Enclosure`, category: 'enclosure', zone,
        enclosureSize: mem.footprint ?? 'medium',
        acceptance: enclosureAcceptance(),
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: Math.max(3, Math.round(mem.size / 2)),
      });
      created.push({
        id: mem.id, name: mem.name, category: 'exhibit', zone, template: mem.template, enclosureId: mem.enclosureId,
        acceptance: exhibitAcceptance(mem.name),
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: mem.size,
        appeal: mem.appeal ? { families: mem.appeal[0], enthusiasts: mem.appeal[1], comfortSeekers: mem.appeal[2] } : undefined, capacity: 320,
      });
    } else {
      created.push({
        id: mem.id, name: mem.name, category: 'amenity', zone, services: mem.services, serviceCapacity: 500,
        acceptance: amenityAcceptance(mem.name, mem.services),
        status: 'backlog', sprintNumber: null, accessible: true, unsized: true, estimate: 0, trueSize: mem.size,
      });
    }
  }

  const remaining = members.filter((mem) => !memberIds.includes(mem.id));
  const replacement = remaining.length ? [{ ...epicItem, epicMembers: remaining }, ...created] : created;
  const backlog = [...state.backlog.slice(0, idx), ...replacement, ...state.backlog.slice(idx + 1)];
  return chargeRefinePts(state, chargeRefine(state, { ...state, backlog }, REFINE_COSTS.split), REFINE_PTS.split);
}

/** Move the given Backlog-status items to the front of the Backlog in the given order (the
 *  Product Owner re-prioritising by value). Items not listed keep their relative order. */
function reorderByPriority(state: ZooGameState, ids: string[]): ZooGameState {
  const seen = new Set<string>();
  const front: BacklogItem[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const it = state.backlog.find((x) => x.id === id && x.status === 'backlog');
    if (it) { front.push(it); seen.add(id); }
  }
  if (!front.length) return state;
  const rest = state.backlog.filter((x) => !seen.has(x.id));
  return { ...state, backlog: [...front, ...rest] };
}

/** Apply the AI Product Owner's refinement decisions: split epics, add PBIs, clarify
 *  acceptance criteria, and re-order by value. The PO does this work, so it does NOT charge
 *  the Developers' build clock (the refinement penalty is restored afterwards). Never sets
 *  estimates - the Developers estimate. */
export function applyPoRefinements(state: ZooGameState, d: PoDecisions): ZooGameState {
  const penaltyBefore = state.refinePenalty;
  let s = state;
  for (const sp of d.splitEpics ?? []) s = splitEpic(s, sp.epicId, sp.memberIds ?? []);
  for (const ni of d.newItems ?? []) {
    if (!ni?.name?.trim()) continue;
    const category: ItemCategory = ni.category === 'amenity' || ni.category === 'flora' ? ni.category : 'exhibit';
    s = addPbi(s, { name: ni.name, category, zone: ni.zone || 'General', acceptance: ni.acceptance ?? [], services: category === 'amenity' ? ni.services : undefined });
  }
  for (const rf of d.refine ?? []) {
    const acc = (rf.acceptance ?? []).map((a) => a.trim()).filter(Boolean);
    if (!acc.length) continue;
    s = { ...s, backlog: s.backlog.map((it) => (it.id === rf.id && it.status === 'backlog' ? { ...it, acceptance: acc } : it)) };
  }
  if (d.order?.length) s = reorderByPriority(s, d.order);
  // "Ask the PO" is an explicit request for the PO's proposal, so its Sprint Goal populates the
  // field (you can still edit it). This only runs on that explicit action, never automatically.
  const goal = d.sprintGoal?.trim();
  if (goal) s = { ...s, sprintGoal: goal };
  return { ...s, refinePenalty: penaltyBefore };
}

/** Commit an estimate to a Backlog item (refinement): it becomes sized and can now
 *  be planned. */
export function estimateItem(state: ZooGameState, id: string, points: number): ZooGameState {
  const backlog = state.backlog.map((it) => (it.id === id && it.status === 'backlog' ? { ...it, estimate: points, unsized: false, carriedOver: false } : it));
  return chargeRefinePts(state, chargeRefine(state, { ...state, backlog }, REFINE_COSTS.estimate), REFINE_PTS.estimate);
}

// ============= The plan: decomposing a PBI into tasks (Planning's "how") =============

/** A coached default breakdown of how a PBI gets built, by kind - the design work and
 *  then opening it. It is a starting point the Developers edit, not a fixed template. */
export function suggestTasks(item: BacklogItem): SprintTask[] {
  // The plan reflects the Definition of Done - the work to take this item to Done. First the
  // BUILD steps (meeting the acceptance criteria), then the standing workflow steps the DoD
  // requires of every item: peer review and the PO's sign-off. Placing & opening is the Deploy
  // action (the Open button on a Done item), not a task, so it is not in the plan.
  const build = item.category === 'path'
    ? ['Set its width and colour']             // the route itself is drawn on the park at deployment
    : item.category === 'enclosure'
    ? ['Set the footprint size', 'Fence it securely', 'Lay the ground, shelter and water']
    : item.category === 'exhibit'
    ? [`Sketch the ${item.name.toLowerCase()}'s look`, 'Colour its body and head', 'Add its markings and features']
    : item.category === 'amenity'
      ? [`Design the ${item.name.toLowerCase()}`, 'Colour it', 'Put up a sign']
      : isLandscapeType(item.template)
      ? ['Colour it']                            // its footprint is sized on the park at deployment
      : ['Choose the plant type', 'Colour the foliage'];
  const workflow = ['Peer-review it', "Get the PO's sign-off"];
  return [...build, ...workflow].map((label, i) => ({ id: `${item.id}-t${i}`, label, done: false }));
}

/** Whether a PBI's whole plan is complete (an empty plan counts as complete). */
export const allTasksDone = (item: BacklogItem): boolean => (item.tasks ?? []).filter((t) => t.label.trim()).every((t) => t.done);

/** Save an item's in-progress design while it is still being built in the studio, so partial work
 *  survives the studio closing or the Sprint ending. Does not change status - it stays in Doing. */
export function setDraftDesign(state: ZooGameState, id: string, design: ItemDesign): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id && it.status === 'committed' ? { ...it, draftDesign: design } : it)) };
}

/** Put a built (Done-column) item onto the park to place & size it. It shows on the park but is not
 *  yet live to visitors - its card stays in Deploy until you mark it "Deploy complete" (openItem). */
export function placeOnPark(state: ZooGameState, id: string): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id && it.status === 'done' ? { ...it, placed: true } : it)) };
}

/** Confirm (or un-confirm) one of an item's acceptance criteria. Build ACs are ticked in the studio;
 *  deploy ACs (sizing/placement) are ticked on the park while placing & sizing the item. */
export function confirmAcceptance(state: ZooGameState, id: string, index: number, value: boolean): ZooGameState {
  return {
    ...state,
    backlog: state.backlog.map((it) => {
      if (it.id !== id) return it;
      const ac = [...(it.acConfirmed ?? Array(it.acceptance.length).fill(false))];
      ac[index] = value;
      return { ...it, acConfirmed: ac };
    }),
  };
}

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

/** Toggle a Developer onto/off a Sprint item (self-managed - the Developers pick up work;
 *  more than one on an item is swarming). */
export function assignDev(state: ZooGameState, itemId: string, devId: string): ZooGameState {
  return {
    ...state,
    backlog: state.backlog.map((it) => {
      if (it.id !== itemId) return it;
      const on = it.assignedDevs ?? [];
      return { ...it, assignedDevs: on.includes(devId) ? on.filter((d) => d !== devId) : [...on, devId] };
    }),
  };
}

/** Rename a Scrum Team member by id (a future multiplayer seat can be named for its player). */
export function renameMember(state: ZooGameState, memberId: string, name: string): ZooGameState {
  const n = name.trim();
  if (!n) return state;
  const t = state.team;
  const rn = (m: { id: string; name: string }) => (m.id === memberId ? { ...m, name: n } : m);
  return { ...state, team: { productOwner: rn(t.productOwner), scrumMaster: rn(t.scrumMaster), developers: t.developers.map(rn) } };
}

/** Delete a Backlog PBI outright (only ones not committed to a Sprint reach this from the UI). */
export function deletePbi(state: ZooGameState, id: string): ZooGameState {
  return { ...state, backlog: state.backlog.filter((it) => it.id !== id) };
}

/** Duplicate a PBI as a fresh Backlog item ("... (copy)"), placed right after the original.
 *  The copy is its own item (new id, no saved park position, back in the Backlog). */
export function duplicatePbi(state: ZooGameState, id: string): ZooGameState {
  const idx = state.backlog.findIndex((it) => it.id === id);
  if (idx < 0) return state;
  const src = state.backlog[idx];
  const copy: BacklogItem = { ...src, id: `${src.id}-copy-${state.backlog.length}`, name: `${src.name} (copy)`, status: 'backlog', sprintNumber: null, pos: undefined, design: undefined, goalCritical: false };
  return { ...state, backlog: [...state.backlog.slice(0, idx + 1), copy, ...state.backlog.slice(idx + 1)] };
}

/** Choose the surface/colour of the park paths and roads (a key into PATH_STYLES). */
export function setPathStyle(state: ZooGameState, style: string): ZooGameState {
  return { ...state, pathStyle: style };
}

/** Choose how the auto-drawn paths route to the promenade (straight / elbow / spine / none). */
export function setPathRoute(state: ZooGameState, route: ZooGameState['pathRoute']): ZooGameState {
  return { ...state, pathRoute: route };
}

/** Commit a hand-drawn path (a polyline of >=2 points). The id is deterministic (no RNG),
 *  from the path count and its first point, so it is stable across renders/saves. */
export function addZooPath(state: ZooGameState, points: { x: number; y: number }[]): ZooGameState {
  if (points.length < 2) return state;
  const p0 = points[0];
  const id = `path-${state.paths.length}-${Math.round(p0.x)}-${Math.round(p0.y)}`;
  return { ...state, paths: [...state.paths, { id, points }] };
}

/** Remove one hand-drawn path by id. */
export function deleteZooPath(state: ZooGameState, id: string): ZooGameState {
  return { ...state, paths: state.paths.filter((p) => p.id !== id) };
}

/** Remove every hand-drawn path. */
export function clearZooPaths(state: ZooGameState): ZooGameState {
  return { ...state, paths: [] };
}

/** Add a manual connector (drawn on the Park). */
export function addConnector(state: ZooGameState, connector: ZooConnector): ZooGameState {
  return { ...state, connectors: [...(state.connectors ?? []), connector] };
}

/** Update a connector's ends, bends, thickness or colour. */
export function updateConnector(state: ZooGameState, id: string, patch: Partial<ZooConnector>): ZooGameState {
  return { ...state, connectors: (state.connectors ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

/** Remove a connector by id. */
export function deleteConnector(state: ZooGameState, id: string): ZooGameState {
  return { ...state, connectors: (state.connectors ?? []).filter((c) => c.id !== id) };
}

/** Choose when the Daily Scrum is held - at the start of each day or the end. */
export function setDailyScrumAt(state: ZooGameState, at: 'start' | 'end'): ZooGameState {
  return { ...state, dailyScrumAt: at };
}

/** Set an enclosure's footprint size (chosen while building the habitat in the studio). */
export function setEnclosureSize(state: ZooGameState, id: string, size: 'small' | 'medium' | 'large'): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, enclosureSize: size } : it)) };
}

/** Set a feature's free-placement position in the park (from dragging on the Park tab). */
export function setItemPos(state: ZooGameState, id: string, pos: { x: number; y: number }): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, pos } : it)) };
}

/** Position an item WITHIN its parent enclosure (0..1 fractions of the habitat box) - drag an
 *  animal to a spot inside its enclosure rather than letting it auto-arrange. */
export function setItemSpot(state: ZooGameState, id: string, spot: { x: number; y: number }): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, spot } : it)) };
}

/** Resize a landscape feature's footprint on the park (e.g. stretch a river across it). */
/** Turn a landscape feature on the park. Degrees clockwise from running across; kept in 0-359 so
 *  the value never drifts off after repeated turns. Arranging, not a design change. */
export function setItemRot(state: ZooGameState, id: string, rot: number): ZooGameState {
  const deg = ((Math.round(rot) % 360) + 360) % 360;
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, rot: deg } : it)) };
}

export function setItemSize(state: ZooGameState, id: string, size: { w: number; h: number }): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, size } : it)) };
}

/** Rename an item (e.g. edit an enclosure's sign in the park). Ignores an empty name. */
export function renameItem(state: ZooGameState, id: string, name: string): ZooGameState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, name: trimmed } : it)) };
}

/** Nest a plant inside an enclosure (drag it in) - it becomes part of that habitat, positioned at
 *  the drop spot, and no longer sits loose on the grounds. */
export function nestItem(state: ZooGameState, id: string, enclosureId: string, spot: { x: number; y: number }): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, enclosureId, spot, pos: undefined } : it)) };
}

/** Take a nested plant back out onto the open grounds (drag it out) - it returns to a loose
 *  feature and is auto-arranged until placed. */
export function unnestItem(state: ZooGameState, id: string): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (it.id === id ? { ...it, enclosureId: undefined, spot: undefined } : it)) };
}

/** Move an item up or down among its peers - the other items in whichever list is on screen -
 *  leaving everything else where it is. One Backlog holds every list in the game, so "up" always
 *  means "swap with the nearest item that belongs to the same list", skipping the rest. */
function swapAmong(state: ZooGameState, id: string, dir: 'up' | 'down', peer: (it: BacklogItem) => boolean): ZooGameState {
  const backlog = [...state.backlog];
  const idx = backlog.findIndex((it) => it.id === id);
  if (idx < 0 || !peer(backlog[idx])) return state;
  const step = dir === 'up' ? -1 : 1;
  let j = idx + step;
  while (j >= 0 && j < backlog.length && !peer(backlog[j])) j += step;
  if (j < 0 || j >= backlog.length) return state;
  [backlog[idx], backlog[j]] = [backlog[j], backlog[idx]];
  return { ...state, backlog };
}

/** Re-order the Product Backlog (the Product Owner's job): move an item up or down
 *  among the other still-in-Backlog items. */
export function moveItem(state: ZooGameState, id: string, dir: 'up' | 'down'): ZooGameState {
  return swapAmong(state, id, dir, (it) => it.status === 'backlog');
}

/** Re-order the Sprint forecast while it is still being put together in Sprint Planning. The items
 *  are still in the Backlog at this point - nothing is committed until the Sprint is started - so
 *  the peers are whatever has been picked so far. */
export function moveForecastItem(state: ZooGameState, id: string, dir: 'up' | 'down', picked: string[]): ZooGameState {
  return swapAmong(state, id, dir, (it) => picked.includes(it.id));
}

/** Re-order the Sprint Backlog: move an item up or down among the other items waiting to be
 *  started in this Sprint. The Product Backlog is the Product Owner's order, but once work is
 *  forecast into a Sprint the plan for it belongs to the Developers - so what to pick up next is
 *  theirs to arrange. Only items not yet started move: once something is under way its place in
 *  the queue no longer means anything. */
export function moveSprintItem(state: ZooGameState, id: string, dir: 'up' | 'down'): ZooGameState {
  return swapAmong(state, id, dir, (it) =>
    it.status === 'committed' && !it.started && it.sprintNumber === state.sprintNumber);
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

/** Move a whole zone (a themed epic and all its PBIs) up or down relative to the other
 *  zones - the PO ordering the Backlog by theme. Regroups the Backlog by the new zone
 *  order, keeping each item's order within its zone. */
export function moveZone(state: ZooGameState, zone: string, dir: 'up' | 'down'): ZooGameState {
  const order: string[] = [];
  for (const it of state.backlog) if (!order.includes(it.zone)) order.push(it.zone);
  const i = order.indexOf(zone);
  if (i < 0) return state;
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= order.length) return state;
  [order[i], order[j]] = [order[j], order[i]];
  const backlog = order.flatMap((z) => state.backlog.filter((it) => it.zone === z));
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

/** The capacity this Sprint actually has: the team's velocity, less what refining the Backlog for
 *  it has already cost them. Never below a quarter of it - a team that refines all day still builds
 *  something, and the game should teach the trade-off, not deadlock on it. */
export function sprintCapacity(state: ZooGameState): number {
  const base = zooCapacity(state.velocity);
  return Math.max(Math.ceil(base / 4), base - state.refineSpend);
}

export function planSprint(state: ZooGameState, ids: string[]): ZooGameState {
  // Only Backlog items that meet the Definition of Ready can be forecast - sized, small enough,
  // and with acceptance criteria. Anything else has to go back through Refinement first.
  const committed = new Set(state.backlog.filter((it) => ids.includes(it.id) && it.status === 'backlog' && isReady(it)).map((it) => it.id));
  const backlog = state.backlog.map((it) =>
    committed.has(it.id) ? withPlan({ ...it, status: 'committed' as const, sprintNumber: state.sprintNumber }) : it,
  );
  const committedPts = [...committed].reduce((s, id) => s + (backlog.find((it) => it.id === id)?.estimate ?? 0), 0);
  return {
    ...state, phase: 'sprint', committedIds: [...committed], backlog,
    // Record the capacity forecast we committed against, to compare with actual delivery at Review.
    sprintForecast: sprintCapacity(state),
    // Seed the burndown at the full commitment (day 0); each day's end appends the remaining.
    burndown: [committedPts],
    dayNumber: 1, dayStage: 'building', dayTimeMult: 1, pendingImpediment: null, carriedImpediment: null, refinePenalty: 0,
  };
}

/** Progress toward the Sprint Goal: points and essentials (the goal-critical items) done vs
 *  committed, and the work still remaining. Used by the Daily Scrum, the board and the burndown. */
export function sprintProgress(state: ZooGameState): { pointsCommitted: number; pointsDone: number; remaining: number; essentialsTotal: number; essentialsDone: number } {
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'));
  const isDone = (it: BacklogItem) => it.status === 'done' || it.status === 'open';
  const pointsCommitted = committed.reduce((s, it) => s + it.estimate, 0);
  const pointsDone = committed.filter(isDone).reduce((s, it) => s + it.estimate, 0);
  const essentials = committed.filter((it) => it.goalCritical);
  return {
    pointsCommitted, pointsDone, remaining: pointsCommitted - pointsDone,
    essentialsTotal: essentials.length, essentialsDone: essentials.filter(isDone).length,
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
      ? { ...it, started: true, design, draftDesign: undefined, appeal: it.category === 'exhibit' ? appealFromDesign(it, design) : it.appeal }
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

/** Feedback-driven improvement: the player, acting as PO on a visitor signal, decides a live
 *  item needs work. This creates a new "Improve X" PBI in the Product Backlog carrying a clone of
 *  the target's current design, so it flows through the normal loop (refine -> estimate -> pull ->
 *  build). Building it re-opens the studio on that design; delivering it applies the design back to
 *  the target (see openItem) rather than adding a second feature. */
export function improveItem(state: ZooGameState, id: string): ZooGameState {
  const target = state.backlog.find((it) => it.id === id);
  if (!target || target.status !== 'open') return state;
  // One improvement in flight per item: don't stack duplicate PBIs while one is being worked.
  if (state.backlog.some((it) => it.enhancesId === id && it.status !== 'open')) return state;
  const n = state.backlog.filter((it) => it.enhancesId === id).length;
  const base = target.name.replace(/^Improve /, '');
  const d = target.design;
  const clone: BacklogItem = {
    ...target,
    id: `${id}-imp${n + 1}`,
    name: `Improve ${base}`,
    enhancesId: id,
    status: 'backlog',
    sprintNumber: null,
    unsized: true,
    estimate: 0,
    tasks: undefined,
    started: false,
    assignedDevs: undefined,
    goalCritical: false,
    pos: undefined,
    design: d ? { ...d, parts: { ...d.parts }, colors: { ...d.colors }, water: d.water?.map((w) => ({ ...w })), flora: d.flora?.map((f) => ({ ...f })) } : undefined,
  };
  return { ...state, backlog: [...state.backlog, clone] };
}

/** Release a Done item to visitors. Decoupled from the Review: you can open a Done
 *  item at any time during the Sprint. Once open it is part of the zoo the visitors
 *  experience. */
export function openItem(state: ZooGameState, id: string): ZooGameState {
  const item = state.backlog.find((it) => it.id === id);
  if (item?.enhancesId) {
    // Delivering an improvement: apply its design (and enclosure size) back to the target it
    // improves, keeping the target's place. The improvement itself is marked delivered - it counts
    // for velocity - but is excluded from the park so there is no duplicate feature.
    const backlog = state.backlog.map((it) => {
      if (it.id === id) return { ...it, status: 'open' as const, openedIn: state.sprintNumber };
      if (it.id === item.enhancesId) return { ...it, design: item.design, enclosureSize: item.enclosureSize ?? it.enclosureSize };
      return it;
    });
    return { ...state, backlog };
  }
  const backlog = state.backlog.map((it) => (it.id === id && it.status === 'done' ? { ...it, status: 'open' as const, openedIn: state.sprintNumber } : it));
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
  if (sig.drivenBy === 'unmet:food') return { ...base, name: 'Food outlet', category: 'amenity', trueSize: 5, acceptance: amenityAcceptance('Food outlet', 'food'), services: 'food', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:toilet') return { ...base, name: 'More toilets', category: 'amenity', trueSize: 3, acceptance: amenityAcceptance('More toilets', 'toilet'), services: 'toilet', serviceCapacity: 500 };
  if (sig.drivenBy === 'unmet:rest') return { ...base, name: 'Seating and shade', category: 'amenity', trueSize: 3, acceptance: amenityAcceptance('Seating and shade', 'rest'), services: 'rest', serviceCapacity: 500 };
  if (sig.drivenBy === 'crowding') return { ...base, name: 'Extra viewing area', category: 'amenity', trueSize: 5, acceptance: ['Eases the queues', 'Good sightlines', 'Placed where visitors can reach it'] };
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

/** Why an item is not ready to be forecast, or null if it is. The team's Definition of Ready is
 *  their own agreement; these are the parts of it the game can see for itself. */
export function notReady(item: BacklogItem): string | null {
  if (item.category === 'epic') return 'Too big - split it into the pieces you could build';
  if (item.unsized) return 'Not sized yet - the Developers size it in Refinement';
  if (!item.acceptance.length) return 'No acceptance criteria agreed';
  return null;
}
export const isReady = (item: BacklogItem): boolean => notReady(item) === null;

/** Edit the Definition of Ready (a working agreement, so the team owns it). */
export function setDefinitionOfReady(state: ZooGameState, dor: string[]): ZooGameState {
  return { ...state, definitionOfReady: dor.map((d) => d.trim()).filter((d) => d.length > 0) };
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
  // Sample the burndown as the day closes: committed points still remaining.
  const s = { ...state, burndown: [...state.burndown, sprintProgress(state).remaining] };
  // The last day ends straight to the Review: there is no next day to re-plan.
  if (s.dayNumber >= s.sprintDays) return reviewSprint(s);
  if (s.dailyScrumAt === 'start') {
    // The Daily Scrum starts the NEXT day: advance the day, then hold it before building.
    const next = s.dayNumber + 1;
    return { ...s, dayNumber: next, dayStage: 'dailyScrum', pendingImpediment: generateImpediment(s.gameSeed, s.sprintNumber, next), refinePenalty: 0 };
  }
  // End-of-day: hold the Daily Scrum now, before advancing.
  return { ...s, dayStage: 'dailyScrum', pendingImpediment: generateImpediment(s.gameSeed, s.sprintNumber, s.dayNumber) };
}

/** Move to the next day, or end the Sprint (open the Review) after the last day.
 *  A new day opens paused (`dayStart`) - a breather before the build resumes; the
 *  team starts it when ready. `nextMult` sets how much build time the new day has. */
function advanceDay(state: ZooGameState, nextMult: number): ZooGameState {
  const next = state.dayNumber + 1;
  if (next > state.sprintDays) return reviewSprint({ ...state, dayStage: 'building' });
  // A new day gets a fresh build clock, so the refinement spend resets too.
  return { ...state, dayNumber: next, dayStage: 'dayStart', dayTimeMult: nextMult, refinePenalty: 0 };
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
  const mult = state.scrumDiscipline ? 1 : DAILY_SCRUM_MULT;
  const cleared = { ...state, pendingImpediment: null, carriedImpediment: null };
  // Start-of-day scrums are held ON the day (endDay already advanced it): begin building.
  if (state.dailyScrumAt === 'start') return { ...cleared, dayStage: 'building', dayTimeMult: mult };
  return advanceDay(cleared, mult);
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
  const mult = imp ? SKIP_PENALTY_MULT : state.scrumDiscipline ? 1 : DAILY_SCRUM_MULT;
  const base = {
    ...state,
    pendingImpediment: null,
    carriedImpediment: imp ? { ...imp, missed: true, tip: MISSED_SCRUM_TIP } : null,
    missedScrums: state.missedScrums + (imp ? 1 : 0),
  };
  if (state.dailyScrumAt === 'start') return { ...base, dayStage: 'building', dayTimeMult: mult };
  return advanceDay(base, mult);
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

export function reviewSprint(state: ZooGameState): ZooGameState {
  // Enclosures are infrastructure, not something visitors score directly - exclude them
  // from the simulation (the animals inside them carry the appeal).
  const openItems = state.backlog.filter((it) => it.status === 'open' && it.category !== 'enclosure').map(toZooItem);
  // Visitor happiness comes from what the game actually models - the design quality of what
  // you delivered - not from the wording of the Definition of Done. The DoD's job is to be the
  // team's completion gate (the workflow every item follows to be Done), not a happiness dial.
  const result = simulateSprint({ items: openItems, sprintNumber: state.sprintNumber }, DEFAULT_CONFIG, state.attendance, seedFor(state));

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

  // Unfinished committed items return to the Backlog to be RE-ESTIMATED against the work that is
  // LEFT, then re-planned (a fresh Ready check). Their build progress - design and ticked plan
  // tasks - is kept; only their sizing is reopened, with the poker nudged toward the remaining
  // work (trueSize scaled by how much of the plan is still to do). The per-Sprint goal-critical
  // mark is cleared so it is re-decided next time they are planned.
  const backlog = state.backlog.map((it) => {
    if (!(it.sprintNumber === state.sprintNumber && it.status === 'committed')) return it;
    const tasks = (it.tasks ?? []).filter((t) => t.label.trim());
    const doneFrac = tasks.length ? tasks.filter((t) => t.done).length / tasks.length : 0;
    const remaining = Math.max(1, Math.round((it.trueSize ?? it.estimate ?? 5) * (1 - doneFrac)));
    return { ...it, status: 'backlog' as const, sprintNumber: null, goalCritical: false, unsized: true, carriedOver: true, trueSize: remaining };
  });

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
    // Each Sprint opens with Refinement, not Planning: getting the Backlog ready is ongoing work the
    // team does every Sprint, and it costs the Sprint they are about to forecast.
    phase: 'refine',
    refineSpend: 0,
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

/** Open coaching questions for the Retrospective, chosen from what actually happened this
 *  Sprint. Deliberately open (What / How / When) and non-judgemental - a facilitator evoking
 *  reflection, not a scorecard - so "why" (which invites justification) is avoided. Returns up
 *  to three: the specific ones that fit, topped up with general ones so there is always a prompt. */
export function retroQuestions(state: ZooGameState): string[] {
  const qs: string[] = [];
  const delivered = state.velocity[state.velocity.length - 1] ?? 0;
  const previous = state.velocity[state.velocity.length - 2];
  const happiness = state.lastReview?.overallHappiness ?? null;

  if (state.sprintGoalMet === false) qs.push('What got in the way of the Sprint Goal, and what is within your control to change next Sprint?');
  if (state.sprintForecast > delivered) qs.push('How will you decide what to pull into the next Sprint, having forecast more than you finished?');
  if (previous != null && delivered < previous) qs.push('What is the story behind your delivery falling this Sprint?');
  if (happiness != null && happiness < 50) qs.push('What did the visitors tell you, and what is the smallest change that would lift how they felt?');
  if (state.signals.length > 0) qs.push('How will you choose which of your visitors’ signals to act on?');

  // Always leave the team with something to build on.
  const general = [
    'What went well this Sprint that you want to keep doing?',
    'What would make the biggest difference to how the team works next Sprint?',
    'When did you first sense how this Sprint would go?',
  ];
  for (const g of general) { if (qs.length >= 3) break; qs.push(g); }
  return qs.slice(0, 3);
}
