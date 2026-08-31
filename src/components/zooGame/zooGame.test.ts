import { describe, it, expect } from 'vitest';
import { initialZooState, zooCapacity, STARTER_CAPACITY, SPRINT_DAYS, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT, REFINE_COSTS, DEFAULT_WIP_LIMIT, PLANNED_REFINE_SECONDS, DAY_SECONDS, DAILY_SCRUM_SECONDS, estimatedVelocity } from './config';
import {
  planSprint, planItemShape, startItemAt, enclosureReady, pullIntoSprint, estimateItem, moveItem, pokerHand, estimateSuggestion, buildItem, editItem, addAnother, improveItem, openItem, reviewSprint, startNextSprint, acceptSignal,
  setProductGoal, setSprintGoal, suggestSprintGoal, addPbi, refinePbi, suggestStory, moveItemBefore, moveSprintItem, moveForecastItem, moveToZone, addZone, renameZone, reorderInZone, moveZone, deletePbi, duplicatePbi, assignDev, renameMember, setPathStyle, addConnector, updateConnector, deleteConnector, openZoo, availableItems, productGoalProgress,
  endDay, tickDay, tickScrum, cancelSprint, isSignOffTask, signOffReady, goalCandidates, revealed, activeWipLimit, sprintCapacity, setTeaching, markTaught, runDailyScrum, skipDailyScrum, startDay, generateImpediment, suggestTasks, setItemTasks, toggleItemTask, confirmAcceptance, setDraftDesign, placeOnPark, startItem, allTasksDone, toggleGoalCritical, setSprintDays, setLearnMode, setWipLimit, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setItemSize, addItemCopy, copyOffset, COPY_GAP, setItemCopyPiece, moveItemCopy, removeItemCopy, nestItem, unnestItem, renameItem, splitEpic, applyPoRefinements, setDefinitionOfDone, setDefinitionOfReady, readyHorizon, notReady, isReady, nextNudge, holdPlannedRefinement, writeBacklog, setGoalForm, goalMeasures, GOAL_METRICS, isDraftedGoal, refinementTalk, artifactState, sprintProgress, retroQuestions, nothingFitsToday } from './engine';
import type { ZooGameState, BacklogItem, PoDecisions } from './types';
import type { ItemDesign } from './design';
import { itemKind, KIND_LABEL } from './itemKinds';
import { zoneSlices, zonesOpenedSince, zooIsOpen, standsOnPark } from './engine';
import { applyParkChecks, checkCriterion } from './parkChecks';
import { lookAhead } from './lookAhead';
import { autoLayout, insidePark, parkBounds, shapeEdge, insideShape, CANVAS_W, PLAY_H } from './parkLayout';
import { type AnimalGroup, KIND_SCALE, groupMembers, groupSize, hasRoomToRoam, roomNeeded, appealFromDesign, isDesignDone, exhibitAcceptance, FLORA_PIECES, piecesFor, applyPiece, floraFamily, presetFor, renderDesign, designCriteria, EXHIBIT_PARTS, GRID_W, GRID_H, defaultFlora, enclosureFlora, enclosureWater, addFloraTo, addWaterTo, FLORA_TYPES, BUILDING_TYPES, amenityAcceptance, pathWidthPx, isLandscapeType, landscapeDefaultSize, floraColors, isDeployAcceptance } from './design';
import { TOOLBOX, toolboxDraft } from './toolboxItems';
import { SCRUM_CARDS, CARDS_BY_PHASE, cardFor, EVENT_CONTRACT, roleFor } from './scrumContent';
import { copyEntries, applyCopyOverrides } from './copy';
import { iconKey } from './itemIcons';

/** Big Cats arrives as an epic now, so tests that use its animals split it up front - which is
 *  what a player does in Refinement before they can forecast any of it. */
const bigCatsSplit = (seed = 1) => {
  // ...and sizes them, because a split leaves its pieces unsized and only Ready work can be forecast
  let s = splitEpic(initialZooState(seed), 'bigcats', ['tiger', 'leopard', 'kiosk']);
  for (const it of s.backlog.filter((x) => x.unsized)) s = estimateItem(s, it.id, it.trueSize ?? 5);
  return s;
};

/** A design that colours every part, so any category's build meets the Definition of Done. */
const FULL_DESIGN: ItemDesign = { parts: {}, colors: { body: '#c8873b', head: '#8a5a2b', ears: '#e3c66b', tail: '#2a2622', markings: '#f0efe9', foliage: '#43a047', trunk: '#7a5230', walls: '#cfd4d8', roof: '#9aa3ab', door: '#8a5a2b', sign: '#e6842a' } };

/** Fully finish a committed item: build its design, tick every plan task, then place it on the park
 *  and confirm its placement criteria - which is what earns the Product Owner's sign-off and lets
 *  it be released. */
function finish(state: ZooGameState, id: string, design: ItemDesign = FULL_DESIGN): ZooGameState {
  let s = buildItem(state, id, design);
  const it = s.backlog.find((x) => x.id === id);
  for (const t of it?.tasks ?? []) if (!t.done) s = toggleItemTask(s, id, t.id);
  return accept(s, id);
}

/** Place it on the park and accept it - every criterion, which is what a player has to do before the
 *  Product Owner's sign-off ticks and the card may be moved to Done. */
function accept(state: ZooGameState, id: string): ZooGameState {
  let s = placeOnPark(state, id);
  const it = s.backlog.find((x) => x.id === id);
  (it?.acceptance ?? []).forEach((_, i) => { s = confirmAcceptance(s, id, i, true); });
  return s;
}

/** Commit ids, build them all to Done, and open (release) them - along with the paths into any zone
 *  they land in, because that is what it takes for anybody to visit.
 *
 *  A zoo is not open until an animal is there to be walked TO. A test that wants visitors is asking
 *  for a zoo that has opened, so it has to deliver the whole slice; opening a lion in a habitat
 *  nobody can reach is the layer, and the game is now honest about what that earns. Paths already
 *  in the list, or missing from this Backlog, are skipped. */
function buildAndOpen(state: ZooGameState, ids: string[]): ZooGameState {
  const zoneSlug = (zone: string) => (zone === 'Big Cats' ? 'bigcats' : zone.toLowerCase().replace(/[^a-z]+/g, '-'));
  const wanted = new Set(ids);
  for (const id of ids) {
    const it = state.backlog.find((x) => x.id === id);
    if (!it || it.category !== 'exhibit') continue;
    const paths = `${zoneSlug(it.zone)}-paths`;
    if (state.backlog.some((x) => x.id === paths)) wanted.add(paths);
  }
  const all = [...wanted];
  let s = planSprint(state, all);
  for (const id of all) s = openItem(finish(s, id), id);
  return s;
}

/** Mark enclosure items as built (Done), so their animals can be started - the game
 *  builds the habitat before the animals. */
function withEnclosuresBuilt(state: ZooGameState, ...ids: string[]): ZooGameState {
  return { ...state, backlog: state.backlog.map((it) => (ids.includes(it.id) ? { ...it, status: 'done' as const } : it)) };
}

/** Split every epic fully into its member PBIs (leaving them unsized, as refinement does). */
function splitAll(state: ZooGameState): ZooGameState {
  let s = state;
  for (const e of state.backlog.filter((i) => i.category === 'epic')) s = splitEpic(s, e.id, (e.epicMembers ?? []).map((m) => m.id));
  return s;
}

/** A fully-refined Backlog: every epic split AND every item estimated to its intended
 *  size, so the whole zoo (penguins, elephant, ...) is Ready to plan - the flat starting
 *  point the older tests assume. */
function flat(state: ZooGameState): ZooGameState {
  let s = splitAll(state);
  for (const it of s.backlog) if (it.unsized && it.category !== 'epic') s = estimateItem(s, it.id, it.trueSize ?? 5);
  return s;
}

describe('zoo game: setup', () => {
  it('starts with a rough backlog, a Product Goal, a DoD, and drifted attendance', () => {
    const s = initialZooState(1);
    expect(s.phase).toBe('intro');
    expect(s.productGoal.length).toBeGreaterThan(0);
    expect(s.definitionOfDone.length).toBeGreaterThan(0);
    expect(s.backlog.length).toBeGreaterThan(0);
    expect(s.backlog.every((i) => i.status === 'backlog')).toBe(true);
    expect(s.zones).toContain('Big Cats');
    expect(s.attendance.families).toBeGreaterThan(0);
    expect(s.velocity).toEqual([]);
  });

  it('seeds the backlog with park grounds: pathways and scenery to build', () => {
    const s = initialZooState(1);
    expect(s.zones).toContain('Grounds');
    const grounds = s.backlog.filter((i) => i.zone === 'Grounds');
    // pathways plus a spread of scenery (trees, rocks, river, bridge...)
    expect(grounds.some((i) => i.category === 'path')).toBe(true);
    expect(grounds.some((i) => i.template === 'bridge')).toBe(true);
    expect(grounds.some((i) => i.template === 'river')).toBe(true);
    expect(grounds.some((i) => i.template === 'tree')).toBe(true);
    // each is a ready, estimated PBI (not an unsized epic) so it can be pulled straight in
    expect(grounds.every((i) => i.category === 'flora' || i.category === 'path')).toBe(true);
    expect(grounds.every((i) => !i.unsized && i.estimate > 0)).toBe(true);
  });

  it('is deterministic per game seed (taste jitter and drift)', () => {
    expect(initialZooState(7)).toEqual(initialZooState(7));
    // A different seed jitters the appeal differently (the lion is an exhibit with appeal).
    const lionAppeal = (seed: number) => initialZooState(seed).backlog.find((i) => i.id === 'lion')!.appeal;
    expect(lionAppeal(7)).not.toEqual(lionAppeal(8));
  });

  it('editing the Product Goal keeps a non-empty value', () => {
    const s = setProductGoal(initialZooState(1), 'A calm, accessible park older visitors love.');
    expect(s.productGoal).toContain('accessible');
    expect(setProductGoal(s, '   ').productGoal).toBe(s.productGoal); // blank ignored
  });

  it('capacity is the starter guess, then a rolling average of recent velocity', () => {
    expect(zooCapacity([])).toBe(STARTER_CAPACITY);
    expect(zooCapacity([10, 20])).toBe(15);
    // Only the last 3 Sprints count, so an unusual early Sprint stops skewing the forecast.
    expect(zooCapacity([40, 10, 20, 30])).toBe(20); // avg of [10,20,30], the 40 dropped out
  });

  it('records the capacity forecast when the Sprint is committed', () => {
    const s = planSprint(flat(initialZooState(1)), ['lion']);
    expect(s.sprintForecast).toBe(STARTER_CAPACITY); // Sprint 1: the first-guess capacity
  });

  it('seeds the burndown at the full commitment and appends the remaining each day', () => {
    let s = planSprint(flat(bigCatsSplit(1)), ['lion', 'kiosk']); // 8 + 5 = 13 pts
    expect(s.burndown).toEqual([13]); // day 0: everything remains
    // Finish the lion (8 pts done), then end day 1: 5 pts remain.
    s = openItem(finish(s, 'lion'), 'lion');
    expect(sprintProgress(s)).toMatchObject({ pointsCommitted: 13, pointsDone: 8, remaining: 5 });
    s = { ...s, dayStage: 'building' };
    s = endDay(s);
    expect(s.burndown).toEqual([13, 5]);
  });
});

describe('zoo game: the Sprint loop', () => {
  it('plans, builds, opens, and reviews with a real visitor simulation', () => {
    let s = bigCatsSplit(1);
    s = buildAndOpen(s, ['lion', 'tiger', 'kiosk']);
    // The paths come with them: an animal nobody can walk to is not an open zoo.
    expect(openZoo(s).map((i) => i.id).sort()).toEqual(['bigcats-paths', 'kiosk', 'lion', 'tiger']);
    expect(zooIsOpen(s)).toBe(true);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.lastReview).not.toBeNull();
    expect(s.lastReview!.overallHappiness).toBeGreaterThan(0); // visitors enjoyed the exhibits
    expect(s.velocity).toEqual([8 + 8 + 5 + 3]); // lion, tiger, kiosk and the paths in to them
    // Word of mouth moved attendance for next Sprint.
    expect(s.attendance).toEqual(s.lastReview!.nextAttendance);
  });

  it('velocity counts Done work; releasing (open) is what the visitors see', () => {
    // Build but do NOT open: Done delivers velocity, but nothing is released to visitors.
    let s = planSprint(flat(initialZooState(1)), ['lion', 'penguins']);
    s = finish(finish(s, 'lion'), 'penguins');
    expect(openZoo(s)).toHaveLength(0);
    s = reviewSprint(s);
    expect(s.velocity[0]).toBe(16); // points Done
    expect(s.lastReview!.segments.every((seg) => seg.happiness === 0)).toBe(true); // no open exhibits
  });

  it('unfinished committed items return to the Backlog', () => {
    let s = planSprint(flat(bigCatsSplit(1)), ['lion', 'tiger', 'penguins']);
    s = openItem(finish(s, 'lion'), 'lion'); // only lion finished
    s = reviewSprint(s);
    const tiger = s.backlog.find((i) => i.id === 'tiger')!;
    expect(tiger.status).toBe('backlog');
    expect(tiger.sprintNumber).toBeNull();
    expect(s.velocity[0]).toBe(8); // only the lion's points
  });

  it('Done-but-not-opened work is NOT lost when the Sprint ends (stays Done, still openable)', () => {
    let s = planSprint(flat(initialZooState(1)), ['lion']);
    s = finish(s, 'lion'); // built to Done, but never Opened
    expect(s.backlog.find((i) => i.id === 'lion')!.status).toBe('done');
    s = reviewSprint(s);
    const lion = () => s.backlog.find((i) => i.id === 'lion')!;
    expect(lion().status).toBe('done'); // still there after the Review - not vanished, not reverted to backlog
    s = startNextSprint(s, 'x');
    expect(lion().status).toBe('done'); // carries into the next Sprint
    s = openItem(s, 'lion'); // and can still be released
    expect(lion().status).toBe('open');
  });

  it('runs across Sprints, carrying velocity and the growing zoo', () => {
    let s = flat(bigCatsSplit(1));
    s = reviewSprint(buildAndOpen(s, ['lion', 'kiosk']));
    s = startNextSprint(s, 'Swarm on fewer exhibits at once');
    expect(s.phase).toBe('planning');
    expect(s.sprintNumber).toBe(2);
    expect(s.improvements).toHaveLength(1);
    s = reviewSprint(buildAndOpen(s, ['tiger', 'penguins']));
    expect(s.velocity).toHaveLength(2);
    // Two zones open, each with its own way in - two slices, not four animals in a field.
    expect(openZoo(s).map((i) => i.id).sort())
      .toEqual(['bigcats-paths', 'kiosk', 'lion', 'penguins', 'tiger', 'waterside-paths']);
    expect(zoneSlices(s).filter((z) => z.open).map((z) => z.zone).sort()).toEqual(['Big Cats', 'Waterside']);
  });
});

describe('zoo game: arranging the park layout', () => {
  it('moves an item to another zone (adding the zone if new)', () => {
    let s = moveToZone(bigCatsSplit(1), 'lion', 'Waterside');
    expect(s.backlog.find((i) => i.id === 'lion')!.zone).toBe('Waterside');
    s = moveToZone(s, 'tiger', 'Reptile House'); // new zone
    expect(s.backlog.find((i) => i.id === 'tiger')!.zone).toBe('Reptile House');
    expect(s.zones).toContain('Reptile House');
  });

  it('creates and renames zones (renaming updates every item in it)', () => {
    let s = addZone(initialZooState(1), 'Nocturnal House');
    expect(s.zones).toContain('Nocturnal House');
    s = renameZone(s, 'Big Cats', 'Predators');
    expect(s.zones).toContain('Predators');
    expect(s.zones).not.toContain('Big Cats');
    expect(s.backlog.filter((i) => i.zone === 'Predators').length).toBeGreaterThan(0);
    expect(s.backlog.some((i) => i.zone === 'Big Cats')).toBe(false);
  });

  it('reorders items within a zone', () => {
    const s = initialZooState(1);
    const bigCats = () => s.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id);
    const before = bigCats();
    const moved = reorderInZone(s, before[1], 'up');
    const after = moved.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id);
    expect(after[0]).toBe(before[1]);
  });

  it('has a visible Scrum Team, and Developers self-assign to items (swarm)', () => {
    let s = initialZooState(1);
    expect(s.team.productOwner.id).toBe('po');
    expect(s.team.scrumMaster.id).toBe('sm');
    expect(s.team.developers).toHaveLength(3);
    // Toggle two Developers onto an item, then one off (swarm, then unassign).
    s = assignDev(s, 'lion', 'dev1');
    s = assignDev(s, 'lion', 'dev2');
    expect(s.backlog.find((i) => i.id === 'lion')!.assignedDevs).toEqual(['dev1', 'dev2']);
    s = assignDev(s, 'lion', 'dev1');
    expect(s.backlog.find((i) => i.id === 'lion')!.assignedDevs).toEqual(['dev2']);
    // Rename a seat (for multiplayer).
    s = renameMember(s, 'dev2', 'Zoe');
    expect(s.team.developers.find((d) => d.id === 'dev2')!.name).toBe('Zoe');
  });

  it('deletes and duplicates Backlog PBIs', () => {
    let s = splitAll(initialZooState(1));
    const before = s.backlog.length;
    const lion = s.backlog.find((i) => i.id === 'lion')!;
    // Duplicate: a new item "... (copy)" right after the original, back in the Backlog.
    s = duplicatePbi(s, 'lion');
    expect(s.backlog.length).toBe(before + 1);
    const copy = s.backlog.find((i) => i.name === `${lion.name} (copy)`)!;
    expect(copy.id).not.toBe('lion');
    expect(copy.status).toBe('backlog');
    // Delete removes it outright.
    s = deletePbi(s, copy.id);
    expect(s.backlog.some((i) => i.id === copy.id)).toBe(false);
    expect(s.backlog.length).toBe(before);
  });

  it('sets the park path style, defaulting to gravel', () => {
    const s = initialZooState(1);
    expect(s.pathStyle).toBe('gravel');
    expect(setPathStyle(s, 'boardwalk').pathStyle).toBe('boardwalk');
  });

  it('adds, edits (ends, bends, style) and deletes manual connectors', () => {
    let s = bigCatsSplit(1);
    expect(s.connectors).toEqual([]);
    s = addConnector(s, { id: 'k1', a: { featureId: 'lion-enc', x: 10, y: 10 }, b: { x: 200, y: 120 }, bends: [], thickness: 8, color: '#c9a86a' });
    expect(s.connectors).toHaveLength(1);
    expect(s.connectors[0].a.featureId).toBe('lion-enc'); // one end attached to a feature
    expect(s.connectors[0].b.featureId).toBeUndefined();   // the other a free point
    s = updateConnector(s, 'k1', { thickness: 14, color: '#4a90d9', bends: [{ x: 100, y: 100 }] });
    expect(s.connectors[0].thickness).toBe(14);
    expect(s.connectors[0].color).toBe('#4a90d9');
    expect(s.connectors[0].bends).toHaveLength(1); // a hand-placed bend
    s = updateConnector(s, 'k1', { b: { featureId: 'tiger-enc', x: 0, y: 0 } }); // re-attach the free end
    expect(s.connectors[0].b.featureId).toBe('tiger-enc');
    s = deleteConnector(s, 'k1');
    expect(s.connectors).toEqual([]);
  });

  it('moves a whole zone (epic) up as a block, keeping item order within it', () => {
    const s = initialZooState(1);
    const zoneOrder = (st: typeof s) => { const o: string[] = []; for (const it of st.backlog) if (!o.includes(it.zone)) o.push(it.zone); return o; };
    const before = zoneOrder(s); // Big Cats, Waterside, Savanna, Forest
    const bigCatsBefore = s.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id);
    const moved = moveZone(s, before[1], 'up'); // Waterside up above Big Cats
    const after = zoneOrder(moved);
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    // Item order within Big Cats is preserved.
    expect(moved.backlog.filter((i) => i.zone === 'Big Cats').map((i) => i.id)).toEqual(bigCatsBefore);
    // First/last zone clamps.
    expect(moveZone(s, before[0], 'up')).toBe(s);
    expect(moveZone(s, before[before.length - 1], 'down')).toBe(s);
  });
});

describe('zoo game: the Sprint Goal', () => {
  it('is set at Planning and coached from the selection, and is judged at the Review', () => {
    let s = setSprintGoal(bigCatsSplit(1), 'Open Big Cats so families have more to see.');
    expect(s.sprintGoal).toContain('Big Cats');
    expect(s.sprintGoalMet).toBeNull();
    // Deliver everything committed -> goal met.
    s = reviewSprint(buildAndOpen(s, ['lion', 'kiosk']));
    expect(s.sprintGoalMet).toBe(true);
    // A new Sprint clears the goal.
    s = startNextSprint(s, 'x');
    expect(s.sprintGoal).toBe('');
    expect(s.sprintGoalMet).toBeNull();
  });

  it('is not met when committed work is left unfinished (with nothing marked essential)', () => {
    let s = setSprintGoal(bigCatsSplit(1), 'Fill Big Cats.');
    s = planSprint(s, ['lion', 'tiger']);
    s = openItem(finish(s, 'lion'), 'lion'); // tiger left unbuilt
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(false);
  });

  it('is MET when the goal-critical items are delivered, even if other scope is dropped', () => {
    let s = setSprintGoal(bigCatsSplit(1), 'Open the lion for families.');
    s = planSprint(s, ['lion', 'tiger']);
    s = toggleGoalCritical(s, 'lion'); // lion is essential to the Goal; tiger is not
    s = openItem(finish(s, 'lion'), 'lion'); // deliver lion, drop tiger
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(true); // the essential landed -> outcome met
    expect(s.backlog.find((i) => i.id === 'tiger')!.status).toBe('backlog'); // tiger returns, fine
  });

  it('is NOT met when a goal-critical item is unfinished, even if others are done', () => {
    let s = setSprintGoal(bigCatsSplit(1), 'Open the tiger.');
    s = planSprint(s, ['lion', 'tiger']);
    s = toggleGoalCritical(s, 'tiger'); // tiger essential
    s = openItem(finish(s, 'lion'), 'lion'); // lion done, tiger not
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(false);
  });

  it('drafts the Goal in the house shape: deliver [capability] so that [value]', () => {
    const s = bigCatsSplit(1);
    // A couple of items: name them - that is the capability this Sprint would put in front of visitors.
    const pair = s.backlog.filter((i) => ['lion', 'tiger'].includes(i.id));
    expect(suggestSprintGoal(pair)).toBe('Our goal is to deliver lion and tiger so that visitors have more to enjoy');
    // Most of a zone: name the zone rather than listing it out.
    const zone = s.backlog.filter((i) => i.zone === 'Big Cats' && i.status === 'backlog');
    expect(zone.length).toBeGreaterThan(3);
    expect(suggestSprintGoal(zone)).toMatch(/^Our goal is to deliver the Big Cats zone so that /);
    // Exhibits and somewhere to stop: the value says both.
    const mixed = s.backlog.filter((i) => ['lion', 'kiosk'].includes(i.id));
    expect(suggestSprintGoal(mixed)).toMatch(/something to see and somewhere to stop/);
    // Every draft is a real Goal, so Planning will accept it.
    for (const sel of [pair, zone, mixed, []]) expect(isDraftedGoal(suggestSprintGoal(sel))).toBe(true);
  });
});

describe('zoo game: the PO adds and refines PBIs', () => {
  it('adds a custom PBI (unsized, with acceptance criteria), including flora', () => {
    let s = addPbi(initialZooState(1), { name: 'Meerkats', category: 'exhibit', zone: 'Savanna', acceptance: ['Recognisable meerkats', 'A lookout mound'] });
    const meerkats = s.backlog.find((i) => i.name === 'Meerkats')!;
    expect(meerkats.category).toBe('exhibit');
    expect(meerkats.unsized).toBe(true);
    expect(meerkats.acceptance).toEqual(['Recognisable meerkats', 'A lookout mound']);
    // A new zone on the PBI is registered.
    s = addPbi(s, { name: 'Oak tree', category: 'flora', zone: 'Woodland', acceptance: [] });
    expect(s.zones).toContain('Woodland');
    expect(s.backlog.find((i) => i.name === 'Oak tree')!.category).toBe('flora');
  });

  it('a custom, estimated PBI can be planned and built like any other', () => {
    let s = addPbi(initialZooState(1), { name: 'Otters', category: 'exhibit', zone: 'Waterside', acceptance: ['Playful otters'] });
    const id = s.backlog.find((i) => i.name === 'Otters')!.id;
    s = estimateItem(s, id, 5);
    s = planSprint(s, [id]);
    expect(s.committedIds).toContain(id);
  });

  it('carries an optional user story, and the coach can suggest one', () => {
    const s = suggestStory({ name: 'Meerkats', category: 'exhibit', zone: 'Savanna' });
    expect(s.role.length).toBeGreaterThan(0);
    expect(s.want).toContain('Meerkats');
    expect(s.soThat.length).toBeGreaterThan(0);
    const st = addPbi(initialZooState(1), { name: 'Meerkats', story: 'As a family, I want meerkats so that the kids are engaged.', category: 'exhibit', zone: 'Savanna', acceptance: [] });
    expect(st.backlog.find((i) => i.name === 'Meerkats')!.story).toContain('so that');
  });

  it('drag-and-drop reorders the Backlog (move one item before another)', () => {
    const s = initialZooState(1);
    const ids = s.backlog.map((i) => i.id);
    const moved = moveItemBefore(s, ids[3], ids[0]); // move the 4th item before the 1st
    expect(moved.backlog[0].id).toBe(ids[3]);
    expect(moved.backlog.length).toBe(s.backlog.length); // nothing lost
  });

  it('refines an existing Backlog PBI (name, zone, acceptance)', () => {
    let s = addPbi(initialZooState(1), { name: 'Birds', category: 'exhibit', zone: 'General', acceptance: ['x'] });
    const id = s.backlog.find((i) => i.name === 'Birds')!.id;
    s = refinePbi(s, id, { name: 'Flamingos', category: 'exhibit', zone: 'Waterside', acceptance: ['Pink and tall', 'Standing on one leg'] });
    const it = s.backlog.find((i) => i.id === id)!;
    expect(it.name).toBe('Flamingos');
    expect(it.zone).toBe('Waterside');
    expect(it.acceptance).toEqual(['Pink and tall', 'Standing on one leg']);
  });
});

describe('zoo game: backlog refinement (estimation and ordering)', () => {
  it('new-zone items start unsized and cannot be committed until estimated', () => {
    let s = splitAll(initialZooState(1));
    const elephant = s.backlog.find((i) => i.id === 'elephant')!;
    expect(elephant.unsized).toBe(true);
    expect(elephant.estimate).toBe(0);
    // Planning skips unsized items.
    s = planSprint(s, ['elephant']);
    expect(s.committedIds).not.toContain('elephant');
    expect(s.backlog.find((i) => i.id === 'elephant')!.status).toBe('backlog');
  });

  it('planning poker is deterministic and yields a Fibonacci suggestion near the true size', () => {
    const elephant = splitAll(initialZooState(1)).backlog.find((i) => i.id === 'elephant')!;
    const hand = pokerHand(elephant, 1);
    expect(pokerHand(elephant, 1)).toEqual(hand); // deterministic
    const FIB = [1, 2, 3, 5, 8, 13, 21];
    expect(hand.every((c) => FIB.includes(c))).toBe(true);
    const s = estimateSuggestion(hand);
    expect(FIB.includes(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(5); // clusters around trueSize 10
  });

  it('estimating an item makes it sized and committable', () => {
    let s = estimateItem(splitAll(initialZooState(1)), 'elephant', 13);
    const e = s.backlog.find((i) => i.id === 'elephant')!;
    expect(e.unsized).toBe(false);
    expect(e.estimate).toBe(13);
    s = planSprint(s, ['elephant']);
    expect(s.committedIds).toContain('elephant');
  });

  it('the Product Owner can re-order the Backlog', () => {
    const s = initialZooState(1);
    const order = () => availableItems(s).map((i) => i.id);
    const before = order();
    const moved = moveItem(s, before[1], 'up');
    const after = availableItems(moved).map((i) => i.id);
    expect(after[0]).toBe(before[1]); // the second item moved to the front
    expect(after[1]).toBe(before[0]);
  });

  it('the Developers can re-order what they pick up next in the Sprint', () => {
    let s = planSprint(bigCatsSplit(1), ['lion', 'tiger', 'leopard']);
    const todo = (x: ZooGameState) => x.backlog.filter((it) => it.status === 'committed' && !it.started).map((it) => it.id);
    const before = todo(s);
    expect(before.length).toBe(3);

    s = moveSprintItem(s, before[2], 'up');
    expect(todo(s)).toEqual([before[0], before[2], before[1]]);
    s = moveSprintItem(s, before[2], 'up');
    expect(todo(s)).toEqual([before[2], before[0], before[1]]);
    // and it stops at the ends rather than falling off
    expect(todo(moveSprintItem(s, before[2], 'up'))).toEqual(todo(s));
  });

  it('the forecast can be re-ordered while it is still being put together', () => {
    const s = bigCatsSplit(1);
    const picked = ['lion', 'leopard']; // two picks with another Backlog item sitting between them
    const forecast = (x: ZooGameState) => availableItems(x).filter((it) => picked.includes(it.id)).map((it) => it.id);
    expect(forecast(s)).toEqual(['lion', 'leopard']);

    const moved = moveForecastItem(s, 'leopard', 'up', picked);
    expect(forecast(moved)).toEqual(['leopard', 'lion']); // swaps with its neighbour in the forecast
    // ...and the item that was not picked keeps its place in the Product Backlog
    const between = availableItems(s).map((it) => it.id).filter((id) => !picked.includes(id));
    expect(availableItems(moved).map((it) => it.id).filter((id) => !picked.includes(id))).toEqual(between);
    // the ends hold
    expect(moveForecastItem(moved, 'leopard', 'up', picked)).toBe(moved);
  });

  it('leaves started work and the Product Backlog where they are', () => {
    const s = planSprint(bigCatsSplit(1), ['lion-enc', 'tiger-enc']);
    const started = startItem(s, 'lion-enc');
    expect(started.backlog.find((it) => it.id === 'lion-enc')!.started).toBe(true);
    // work already under way has no queue position left to argue about
    expect(moveSprintItem(started, 'lion-enc', 'down')).toBe(started);
    // an item still in the Product Backlog is the PO's to order, not the Developers'
    expect(moveSprintItem(s, 'elephant', 'up')).toBe(s);
    // and the one still waiting does not jump over the started one - there is nowhere above it
    expect(moveSprintItem(started, 'tiger-enc', 'up')).toBe(started);
  });
});

describe('zoo game: work that outlives the Sprint it was built in', () => {
  // The board's columns, derived the way SprintBoard derives them.
  const board = (s: ZooGameState) => {
    const on = s.backlog.filter((it) =>
      (it.sprintNumber === s.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'))
      || (it.status === 'done' && it.sprintNumber !== s.sprintNumber)
      || (it.status === 'open' && it.openedIn === s.sprintNumber));
    return {
      todo: on.filter((it) => it.status === 'committed' && !it.started).map((i) => i.id),
      doing: on.filter((it) => it.status === 'committed' && it.started).map((i) => i.id),
      deploy: on.filter((it) => it.status === 'done').map((i) => i.id),
      done: on.filter((it) => it.status === 'open').map((i) => i.id),
    };
  };

  it('sends work that was started but never built back to the Product Backlog, sized to what is left', () => {
    let s = planSprint(bigCatsSplit(1), ['tiger-enc']);
    const asked = s.backlog.find((x) => x.id === 'tiger-enc')!.estimate;
    s = startItem(s, 'tiger-enc');
    s = startNextSprint(reviewSprint(s), '');
    const t = s.backlog.find((x) => x.id === 'tiger-enc')!;
    expect(t.status).toBe('backlog');   // back to the PO's list, not carried into the next Sprint
    expect(t.sprintNumber).toBeNull();
    expect(t.carriedOver).toBe(true);   // ...flagged as work already begun
    // It comes back SIZED. The Developers re-size what is left every day - that is what the burndown
    // is drawn from - so the number already exists and asking for it again is asking twice.
    expect(t.unsized).toBe(false);
    expect(t.estimate).toBeLessThanOrEqual(asked);
    expect(t.estimate).toBeGreaterThan(0);
    expect(board(s).todo).not.toContain('tiger-enc');
  });

  it('sends work that was picked but never started back exactly as it was', () => {
    // Nobody touched it, so nobody learned anything about it: an estimate good enough to plan with
    // last week is good enough this week. Sending it round the poker again made estimating look
    // like a toll you pay for not finishing.
    let s = planSprint(bigCatsSplit(1), ['tiger-enc']);
    const before = s.backlog.find((x) => x.id === 'tiger-enc')!;
    s = startNextSprint(reviewSprint(s), '');
    const t = s.backlog.find((x) => x.id === 'tiger-enc')!;
    expect(t.status).toBe('backlog');
    expect(t.sprintNumber).toBeNull();
    expect(t.estimate).toBe(before.estimate);
    expect(t.unsized).toBeFalsy();
    expect(t.carriedOver).toBeFalsy();   // it was never started, so it did not carry over
  });

  it('keeps Done-but-unreleased work on the board, and in Done once it is released', () => {
    let s = planSprint(bigCatsSplit(1), ['tiger-enc']);
    s = finish(startItem(s, 'tiger-enc'), 'tiger-enc');
    expect(board(s).deploy).toContain('tiger-enc'); // built, awaiting release
    s = startNextSprint(reviewSprint(s), '');
    // it is a finished Increment waiting to be released, so it is still there to deploy...
    expect(board(s).deploy).toContain('tiger-enc');
    expect(s.backlog.find((x) => x.id === 'tiger-enc')!.sprintNumber).toBe(1); // ...marked as Sprint 1's work
    // ...and releasing it now puts it in THIS Sprint's Done column rather than dropping it off the board
    s = openItem(s, 'tiger-enc');
    expect(s.backlog.find((x) => x.id === 'tiger-enc')!.openedIn).toBe(s.sprintNumber);
    expect(board(s).done).toContain('tiger-enc');
    expect(board(s).deploy).not.toContain('tiger-enc');
  });

  it('counts the work in the Sprint it was built in, not the one it was released in', () => {
    let s = planSprint(bigCatsSplit(1), ['tiger-enc']);
    s = finish(startItem(s, 'tiger-enc'), 'tiger-enc');
    const built = s.backlog.find((x) => x.id === 'tiger-enc')!.estimate;
    s = reviewSprint(s);
    expect(s.velocity[s.velocity.length - 1]).toBe(built); // counted in Sprint 1
    s = reviewSprint(openItem(startNextSprint(s, ''), 'tiger-enc'));
    expect(s.velocity[s.velocity.length - 1]).toBe(0);     // and not counted again in Sprint 2
  });
});

describe('zoo game: pulling Backlog items mid-Sprint', () => {
  it('commits a Backlog item into the running Sprint', () => {
    let s = planSprint(bigCatsSplit(1), ['lion']);
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(true);
    s = pullIntoSprint(s, 'tiger');
    const tiger = s.backlog.find((i) => i.id === 'tiger')!;
    expect(tiger.status).toBe('committed');
    expect(tiger.sprintNumber).toBe(s.sprintNumber);
    expect(s.committedIds).toContain('tiger');
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(false);
  });

  it('only pulls from the Backlog, and only during a Sprint', () => {
    const planning = bigCatsSplit(1); // phase 'intro', not a Sprint
    expect(pullIntoSprint(planning, 'tiger')).toBe(planning);
    const s = planSprint(bigCatsSplit(1), ['lion']);
    expect(pullIntoSprint(s, 'lion')).toBe(s); // lion is committed, not in the Backlog
  });
});

describe('zoo game: timed days and the Daily Scrum', () => {
  it('runs its timed days, with a Daily Scrum between days but not after the last, then the Review opens', () => {
    let s = planSprint(initialZooState(1), ['lion']);
    s = openItem(finish(s, 'lion'), 'lion');
    expect(s.dayNumber).toBe(1);
    let scrums = 0;
    while (s.phase === 'sprint') {
      expect(s.dayStage).toBe('building');
      s = endDay(s);
      if (s.phase !== 'sprint') break; // the last day ends straight to the Review
      expect(s.dayStage).toBe('dailyScrum');
      scrums++;
      s = runDailyScrum(s);
      if (s.dayStage === 'dayStart') s = startDay(s); // a new day pauses, then begins
    }
    expect(s.phase).toBe('review');
    expect(scrums).toBe(SPRINT_DAYS - 1); // no Daily Scrum after the last day
    expect(s.velocity[0]).toBe(8);
  });

  it('with END-of-day scrums, a new day pauses (dayStart) until it is started', () => {
    let s = openItem(finish(planSprint({ ...initialZooState(1), dailyScrumAt: 'end' }, ['lion']), 'lion'), 'lion');
    s = runDailyScrum(endDay(s));
    expect(s.dayStage).toBe('dayStart'); // a breather before the build resumes
    expect(s.dayNumber).toBe(2);
    s = startDay(s);
    expect(s.dayStage).toBe('building');
  });

  it('the clock runs through the breather: the day can end from dayStart (end-of-day scrums)', () => {
    let s = openItem(finish(planSprint({ ...initialZooState(1), dailyScrumAt: 'end' }, ['lion']), 'lion'), 'lion');
    s = runDailyScrum(endDay(s)); // -> dayStart on day 2
    expect(s.dayStage).toBe('dayStart');
    s = endDay(s); // the day's time ran out during the breather
    expect(s.dayStage).toBe('dailyScrum'); // day 2 is not the last, so its close opens a Daily Scrum
  });

  it('the Daily Scrum timing is settable; by default it is held at the START of each day', () => {
    let s = planSprint(initialZooState(1), ['lion']);
    expect(s.dailyScrumAt).toBe('start'); // Scrum's usual cadence
    expect(s.dayNumber).toBe(1);
    s = endDay(s); // day 1 ends -> advance to day 2 and hold ITS Daily Scrum before building
    expect(s.dayNumber).toBe(2);
    expect(s.dayStage).toBe('dailyScrum');
    s = runDailyScrum(s); // scrum done -> straight into building day 2 (no separate breather)
    expect(s.dayStage).toBe('building');
    // The team can switch to end-of-day scrums.
    expect(setDailyScrumAt(initialZooState(1), 'end').dailyScrumAt).toBe('end');
  });

  it('impediments are deterministic per game, Sprint and day; some days have none', () => {
    expect(generateImpediment(1, 1, 1)).toEqual(generateImpediment(1, 1, 1));
    const days = Array.from({ length: 20 }, (_, i) => generateImpediment(1, 1, i + 1));
    expect(days.some((x) => x !== null)).toBe(true);
    expect(days.some((x) => x === null)).toBe(true);
  });

  it('holding the Daily Scrum clears the impediment and costs a little time', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: { id: 'x', title: 'A keeper called in sick', detail: '...' } };
    s = runDailyScrum(s);
    expect(s.pendingImpediment).toBeNull();
    expect(s.carriedImpediment).toBeNull();
    expect(s.dayNumber).toBe(2);
    expect(s.dayTimeMult).toBe(DAILY_SCRUM_MULT);
    expect(s.missedScrums).toBe(0);
  });

  it('skipping the Daily Scrum lets a waiting impediment through, later and costlier', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: { id: 'x', title: 'The pond pump failed', detail: '...' } };
    s = skipDailyScrum(s);
    expect(s.dayNumber).toBe(2);
    expect(s.carriedImpediment).toMatchObject({ missed: true, title: 'The pond pump failed' });
    expect(s.carriedImpediment!.tip!.length).toBeGreaterThan(0);
    expect(SKIP_PENALTY_MULT).toBeLessThan(DAILY_SCRUM_MULT); // a heavier cost than holding it
    expect(s.dayTimeMult).toBe(SKIP_PENALTY_MULT);
    expect(s.missedScrums).toBe(1);
  });

  it('the Daily Scrum is not skippable: with nothing waiting it still costs its timebox', () => {
    let s = endDay(planSprint(initialZooState(1), ['lion']));
    s = { ...s, pendingImpediment: null };
    s = skipDailyScrum(s);
    expect(s.dayNumber).toBe(2);
    expect(s.carriedImpediment).toBeNull();
    expect(s.dayTimeMult).toBe(DAILY_SCRUM_MULT); // the event happened - no free skip
    expect(s.missedScrums).toBe(0);
  });
});

describe('zoo game: emergent backlog from visitor signals', () => {
  it('a zoo with exhibits but no food produces a food signal, which the PO can accept', () => {
    let s = bigCatsSplit(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'tiger', 'penguins'])); // no food amenity
    const food = s.signals.find((sig) => sig.drivenBy === 'unmet:food');
    expect(food).toBeTruthy();
    const before = availableItems(s).length;
    s = acceptSignal(s, s.signals.indexOf(food!));
    expect(availableItems(s).length).toBe(before + 1);
    expect(availableItems(s).some((i) => i.services === 'food')).toBe(true);
  });

  it('ignored signals persist and worsen across Reviews', () => {
    let s = bigCatsSplit(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'tiger', 'penguins']));
    const first = s.signals.find((sig) => sig.drivenBy === 'unmet:food');
    expect(first).toBeTruthy();
    expect(s.signalAge['unmet:food']).toBe(1);
    // Next Sprint: do not address it (build another exhibit), review again.
    s = startNextSprint(s, 'x');
    s = reviewSprint(buildAndOpen(s, ['leopard']));
    expect(s.signalAge['unmet:food']).toBe(2);
    const second = s.signals.find((sig) => sig.drivenBy === 'unmet:food')!;
    const order = { low: 0, medium: 1, high: 2 } as const;
    expect(order[second.estimatedValue]).toBeGreaterThanOrEqual(order[first!.estimatedValue]); // louder, not quieter
  });
});

describe('zoo game: design choices are the product', () => {
  const brightDesign = { parts: { body: 'round', head: 'maned', ears: 'round', tail: 'tufted', markings: 'spots' }, colors: { body: '#ffd54a', head: '#ffd54a', ears: '#ffcc00', tail: '#ffcc00', markings: '#ff8a00' } };
  const calmDesign = { parts: { body: 'round', head: 'round', ears: 'none', tail: 'none', markings: 'none' }, colors: { body: '#5a4a38', head: '#5a4a38', ears: '#5a4a38' } };

  it('a bright, busy build favours Families; a calm, muted one favours Comfort Seekers', () => {
    const bright = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign);
    const calm = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', calmDesign);
    const b = bright.backlog.find((i) => i.id === 'lion')!.appeal!;
    const c = calm.backlog.find((i) => i.id === 'lion')!.appeal!;
    expect(b.families).toBeGreaterThan(c.families);
    expect(c.comfortSeekers).toBeGreaterThan(b.comfortSeekers);
    expect(bright.backlog.find((i) => i.id === 'lion')!.design).toEqual(brightDesign); // one animal per PBI
  });

  it('a built animal can be re-edited without changing its status, and appeal follows', () => {
    let s = openItem(finish(planSprint(initialZooState(1), ['lion']), 'lion', calmDesign), 'lion');
    expect(s.backlog.find((i) => i.id === 'lion')!.status).toBe('open');
    const before = s.backlog.find((i) => i.id === 'lion')!.appeal!.families;
    s = editItem(s, 'lion', brightDesign); // repaint it bright
    const after = s.backlog.find((i) => i.id === 'lion')!;
    expect(after.status).toBe('open'); // still open, just refined
    expect(after.appeal!.families).toBeGreaterThan(before);
  });

  it('add another creates a fresh PBI for the same species (a pride is several PBIs)', () => {
    let s = buildItem(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign);
    s = addAnother(s, 'lion');
    const lions = s.backlog.filter((i) => i.name.replace(/ \d+$/, '') === 'Lion');
    expect(lions.length).toBe(2);
    const clone = lions.find((i) => i.id !== 'lion')!;
    expect(clone.status).toBe('backlog'); // a new item to plan and build
    expect(clone.design).toBeUndefined(); // not built yet
    expect(clone.name).toBe('Lion 2');
  });
});

describe('zoo game: improving a delivered item (feedback-driven PBI)', () => {
  const brightDesign = { parts: { body: 'round', head: 'maned' }, colors: { body: '#ffd54a', head: '#ffd54a' } };

  it('raises an unsized Improve PBI carrying a clone of the target design', () => {
    let s = openItem(finish(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign), 'lion');
    s = improveItem(s, 'lion');
    const imp = s.backlog.find((i) => i.enhancesId === 'lion')!;
    expect(imp).toBeTruthy();
    expect(imp.status).toBe('backlog'); // a real PBL item that must be refined and pulled
    expect(imp.unsized).toBe(true); // needs re-estimating
    expect(imp.name).toBe('Improve Lion');
    expect(imp.design).toEqual(brightDesign); // pre-loaded with the current design
    expect(imp.design).not.toBe(s.backlog.find((i) => i.id === 'lion')!.design); // a clone, not a shared ref
  });

  it('will not stack a second Improve PBI while one is in flight', () => {
    let s = openItem(finish(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign), 'lion');
    s = improveItem(s, 'lion');
    s = improveItem(s, 'lion');
    expect(s.backlog.filter((i) => i.enhancesId === 'lion').length).toBe(1);
  });

  it('delivering the improvement applies its design to the target and does not add a second feature', () => {
    let s = openItem(finish(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign), 'lion');
    s = improveItem(s, 'lion');
    const impId = s.backlog.find((i) => i.enhancesId === 'lion')!.id;
    // Estimate, pull and build the improvement with a repaint, then deliver it.
    s = estimateItem(s, impId, 3);
    s = pullIntoSprint(s, impId);
    const repaint = { parts: { body: 'round', head: 'maned' }, colors: { body: '#33aaff', head: '#33aaff' } };
    s = openItem(finish(s, impId, repaint), impId);
    const target = s.backlog.find((i) => i.id === 'lion')!;
    expect(target.design).toEqual(repaint); // the target now shows the improved design
    expect(target.status).toBe('open'); // still live, still one feature
    const imp = s.backlog.find((i) => i.id === impId)!;
    expect(imp.status).toBe('open'); // counts as delivered work (velocity)...
    expect(imp.enhancesId).toBe('lion'); // ...but is flagged as an improvement, so the park hides it
  });

  it('once an improvement is delivered, the item can be improved again', () => {
    let s = openItem(finish(planSprint(bigCatsSplit(1), ['lion']), 'lion', brightDesign), 'lion');
    s = improveItem(s, 'lion');
    const impId = s.backlog.find((i) => i.enhancesId === 'lion')!.id;
    s = estimateItem(s, impId, 3);
    s = pullIntoSprint(s, impId);
    s = openItem(finish(s, impId, brightDesign), impId);
    s = improveItem(s, 'lion'); // now allowed again
    expect(s.backlog.filter((i) => i.enhancesId === 'lion').length).toBe(2);
  });
});

describe('zoo game: product goal progress is an OUTCOME, not backlog burn', () => {
  const NICE_ZOO = ['lion', 'tiger', 'kiosk', 'penguins', 'reef', 'wc'];

  it('is zero until a Review measures an outcome, then reflects visitor happiness', () => {
    let s = flat(initialZooState(1));
    expect(productGoalProgress(s)).toBe(0); // no Review yet
    s = reviewSprint(buildAndOpen(s, NICE_ZOO));
    expect(productGoalProgress(s)).toBeGreaterThan(0); // happy visitors -> progress
    expect(s.lastReview!.overallHappiness).toBeGreaterThan(0);
  });

  it('adding unbuilt Backlog items does NOT lower progress (it is outcome, not % built)', () => {
    let s = reviewSprint(buildAndOpen(flat(initialZooState(1)), NICE_ZOO));
    const before = productGoalProgress(s);
    expect(before).toBeGreaterThan(0);
    s = addPbi(s, { name: 'Meerkats', category: 'exhibit', zone: 'Savanna', acceptance: ['Recognisable'] });
    expect(productGoalProgress(s)).toBe(before); // unchanged - depends on the last Review, not backlog size
  });
});

describe('zoo game: the plan (task decomposition) gates Done', () => {
  const lion = (s: ZooGameState) => s.backlog.find((i) => i.id === 'lion')!;

  it('the plan is the build steps and the PO sign-off - not peer review, and not placing/opening', () => {
    const tasks = suggestTasks(initialZooState(1).backlog.find((i) => i.id === 'lion')!);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => !t.done)).toBe(true);
    // Peer review lives in the Definition of Done, which the team agreed to. As a task it was a box
    // you ticked about your own work on every item, and nothing in the game could tell whether it
    // had happened.
    expect(tasks.some((t) => /peer-review/i.test(t.label))).toBe(false);
    expect(tasks.some((t) => /sign-off/i.test(t.label))).toBe(true);
    // Placing & opening is the Deploy action (the Open button), not a plan task.
    expect(tasks.some((t) => /open|place/i.test(t.label))).toBe(false);
  });

  it('starting moves To Do -> Doing; building with tasks left stays Doing; the last tick finishes it', () => {
    let s = withEnclosuresBuilt(initialZooState(1), 'lion-enc');
    const tasks = suggestTasks(lion(s));
    s = setItemTasks(s, 'lion', tasks);
    s = planSprint(s, ['lion']);
    expect(lion(s).started).toBeFalsy(); // To Do

    // Start -> Doing (its enclosure is already built).
    s = startItem(s, 'lion');
    expect(lion(s).started).toBe(true);
    expect(lion(s).status).toBe('committed');

    // Finish the design in the studio, but tasks remain -> still Doing, not Done.
    s = buildItem(s, 'lion', { parts: {}, colors: { body: '#c8873b', head: '#c8873b', ears: '#e3c66b' } });
    expect(lion(s).design).toBeDefined();
    expect(lion(s).status).toBe('committed'); // built, but the plan is not complete
    expect(allTasksDone(lion(s))).toBe(false);

    // Tick every task; the last one promotes it Doing -> Done.
    for (const t of tasks) s = toggleItemTask(s, 'lion', t.id);
    expect(lion(s).status).toBe('done');

    // Un-ticking a task on a Done (not yet open) item sends it back to Doing.
    s = toggleItemTask(s, 'lion', tasks[0].id);
    expect(lion(s).status).toBe('committed');
  });

  it('committing an item gives it a default plan, so nothing can skip the checklist', () => {
    // No plan set during Planning -> planSprint seeds one, so building it does NOT jump
    // straight to Done: it waits in Doing until the plan is ticked.
    let s = planSprint(flat(initialZooState(1)), ['penguins']);
    const p = () => s.backlog.find((i) => i.id === 'penguins')!;
    expect((p().tasks ?? []).length).toBeGreaterThan(0);
    s = buildItem(s, 'penguins', { parts: {}, colors: { body: '#6db6d8', tail: '#4f9cbf' } });
    expect(p().status).toBe('committed'); // built, but plan not ticked -> still Doing
    for (const t of p().tasks ?? []) s = toggleItemTask(s, 'penguins', t.id);
    expect(p().status).toBe('done');
  });

  it('a plan written during Planning is kept (not overwritten by the default)', () => {
    let s = setItemTasks(initialZooState(1), 'lion', [{ id: 'x', label: 'Only this step', done: false }]);
    s = planSprint(s, ['lion']);
    const t = lion(s).tasks!;
    expect(t).toHaveLength(1);
    expect(t[0].label).toBe('Only this step');
  });

  it('a mid-Sprint pull also gets a default plan', () => {
    let s = planSprint(bigCatsSplit(1), ['lion']);
    s = pullIntoSprint(s, 'tiger');
    expect((s.backlog.find((i) => i.id === 'tiger')!.tasks ?? []).length).toBeGreaterThan(0);
  });
});

describe('zoo game: WIP limit and improvements with teeth', () => {
  it('the WIP limit blocks starting more items than the limit allows', () => {
    // Their enclosures are built first, so the WIP limit is what gates starting (not the habitat).
    // Sprint 2, because a limit the player has not met yet is not enforced - see "one idea at a time".
    let s = { ...withEnclosuresBuilt(flat(bigCatsSplit(1)), 'lion-enc', 'tiger-enc', 'leopard-enc', 'penguin-enc'), sprintNumber: 2 };
    s = planSprint(s, ['lion', 'tiger', 'leopard', 'penguins']);
    expect(s.wipLimit).toBe(3);
    const doing = () => s.backlog.filter((i) => i.status === 'committed' && i.started).length;
    s = startItem(s, 'lion'); s = startItem(s, 'tiger'); s = startItem(s, 'leopard');
    expect(doing()).toBe(3);
    s = startItem(s, 'penguins'); // over the limit -> no-op
    expect(doing()).toBe(3);
    expect(s.backlog.find((i) => i.id === 'penguins')!.started).toBeFalsy();
  });

  it('the "finish fewer" improvement tightens the WIP limit next Sprint', () => {
    let s = initialZooState(1);
    expect(s.wipLimit).toBe(3);
    s = startNextSprint(s, 'Finish fewer things properly, rather than starting more');
    expect(s.wipLimit).toBe(2);
    s = startNextSprint(s, 'Finish fewer things properly, rather than starting more');
    expect(s.wipLimit).toBe(1); // floored at 1
    s = startNextSprint(s, 'Finish fewer things properly, rather than starting more');
    expect(s.wipLimit).toBe(1);
  });

  it('committing to the Daily Scrum every day makes it efficient (no time cost)', () => {
    let s = startNextSprint(initialZooState(1), 'Hold the Daily Scrum every day and catch issues early');
    expect(s.scrumDiscipline).toBe(true);
    s = { ...s, phase: 'sprint', dayStage: 'dailyScrum', dayNumber: 1, sprintDays: 3 };
    expect(runDailyScrum(s).dayTimeMult).toBe(1); // efficient: no cut
    // Without the discipline, holding the Daily Scrum costs a little time.
    expect(runDailyScrum({ ...s, scrumDiscipline: false }).dayTimeMult).toBe(DAILY_SCRUM_MULT);
  });
});

describe('zoo game: sprint length and learn mode', () => {
  it('agrees the Sprint length once, up front, before the first Sprint', () => {
    let s: ZooGameState = { ...initialZooState(1), phase: 'refine' };
    expect(s.sprintDays).toBe(SPRINT_DAYS);
    s = setSprintDays(s, 5);
    expect(s.sprintDays).toBe(5);
    s = planSprint(s, ['lion-enc']); // and the Sprint runs at that length
    expect(s.sprintDays).toBe(5);
  });

  it('will not let Sprint Planning change it - the box is not sized to the work', () => {
    const planning: ZooGameState = { ...initialZooState(1), phase: 'planning' };
    expect(setSprintDays(planning, 5).sprintDays).toBe(SPRINT_DAYS);
    // nor mid-Sprint, when the days are already running
    const running = planSprint({ ...initialZooState(1), phase: 'refine' }, ['lion-enc']);
    expect(setSprintDays(running, 5).sprintDays).toBe(running.sprintDays);
  });

  it('changes it only at a Retrospective, applying from the next Sprint', () => {
    let s = planSprint({ ...initialZooState(1), phase: 'refine' }, ['lion-enc']);
    s = reviewSprint(s);
    s = { ...s, phase: 'retro' };
    s = setSprintDays(s, 5);
    expect(s.sprintDays).toBe(5);
    expect(startNextSprint(s, '').sprintDays).toBe(5); // the Sprint they are about to start
  });

  it('is not on offer again once the first Sprint has been run', () => {
    // a second "refine" pass is not a set-up moment: the cadence is already agreed
    const later: ZooGameState = { ...initialZooState(1), phase: 'refine', sprintNumber: 3, velocity: [12, 14] };
    expect(setSprintDays(later, 5).sprintDays).toBe(SPRINT_DAYS);
  });

  it('learn mode is a toggle on state (pauses the clock in the UI)', () => {
    let s = initialZooState(1);
    expect(s.learnMode).toBe(false);
    s = setLearnMode(s, true);
    expect(s.learnMode).toBe(true);
  });
});

describe('zoo game: enclosures are built before their animals', () => {
  const find = (s: ZooGameState, id: string) => s.backlog.find((i) => i.id === id)!;

  it('each species has its OWN enclosure; lions and tigers do not share', () => {
    const s = bigCatsSplit(1);
    expect(find(s, 'lion-enc').category).toBe('enclosure');
    expect(find(s, 'lion').enclosureId).toBe('lion-enc');
    expect(find(s, 'tiger').enclosureId).toBe('tiger-enc');
    expect(find(s, 'lion').enclosureId).not.toBe(find(s, 'tiger').enclosureId);
    // Waterside is an epic; splitting it gives each of its species its own enclosure too.
    const split = splitAll(s);
    expect(split.backlog.find((i) => i.id === 'penguins')!.enclosureId).toBe('penguin-enc');
    expect(split.backlog.find((i) => i.id === 'reef')!.enclosureId).toBe('reef-enc');
  });

  it('an animal cannot be started until its enclosure is built', () => {
    // Plan the enclosure and the lion together; the lion is blocked until the habitat is Done.
    let s = planSprint(initialZooState(1), ['lion-enc', 'lion']);
    s = startItem(s, 'lion');
    expect(find(s, 'lion').started).toBeFalsy(); // habitat not built yet -> blocked

    // Build the enclosure (Done), then the lion can start.
    s = finish(s, 'lion-enc');
    expect(find(s, 'lion-enc').status).toBe('done');
    s = startItem(s, 'lion');
    expect(find(s, 'lion').started).toBe(true);
  });

  it('animals and enclosures are SEPARATE PBIs; an animal is linked to an enclosure', () => {
    const encCount = (s: ZooGameState) => s.backlog.filter((i) => i.category === 'enclosure').length;
    const base = initialZooState(1);
    // Add an enclosure directly (with a footprint).
    let s = addPbi(base, { name: 'Toucan Enclosure', category: 'enclosure', zone: 'Rainforest', acceptance: ['Secure'], enclosureSize: 'small' });
    const home = s.backlog.find((i) => i.name === 'Toucan Enclosure')!;
    expect(home.category).toBe('enclosure');
    expect(home.enclosureSize).toBe('small');
    // Add an animal linked to it - no enclosure is auto-created.
    s = addPbi(s, { name: 'Toucan', category: 'exhibit', zone: 'Rainforest', acceptance: ['Recognisable'], enclosureId: home.id });
    expect(s.backlog.find((i) => i.name === 'Toucan')!.enclosureId).toBe(home.id);
    expect(encCount(s)).toBe(encCount(base) + 1); // only the one we added
    // An animal added with no enclosure is left unlinked (assign one later by refining it).
    s = addPbi(s, { name: 'Sloth', category: 'exhibit', zone: 'Rainforest', acceptance: ['Recognisable'] });
    expect(s.backlog.find((i) => i.name === 'Sloth')!.enclosureId).toBeUndefined();
  });

  it('splitting an epic creates an enclosure + animal per species (and facilities), removing the epic', () => {
    let s = initialZooState(1);
    expect(find(s, 'waterside').category).toBe('epic');
    // An area carries its own paths and planting, so opening it is a whole slice of zoo - splitting
    // out only the animals and the facility leaves the ground they stand on behind.
    s = splitEpic(s, 'waterside', ['penguins', 'reef', 'wc']);
    expect(find(s, 'waterside').category).toBe('epic');
    expect(find(s, 'waterside').epicMembers?.map((m) => m.id)).toEqual(['waterside-paths', 'waterside-planting']);
    s = splitEpic(s, 'waterside', ['waterside-paths', 'waterside-planting']);
    expect(find(s, 'waterside-paths').category).toBe('path');
    expect(find(s, 'waterside-paths').zone).toBe('Waterside');
    expect(find(s, 'waterside-planting').category).toBe('flora');
    expect(s.backlog.some((i) => i.id === 'waterside')).toBe(false); // fully split -> epic gone
    expect(find(s, 'penguin-enc').category).toBe('enclosure');
    expect(find(s, 'penguin-enc').name).toBe('Penguin Habitat'); // bespoke habitat name, not "Penguins Enclosure"
    expect(find(s, 'penguins').enclosureId).toBe('penguin-enc');
    expect(find(s, 'wc').category).toBe('amenity');
    // Children arrive unsized (ready to estimate); the enclosure reads above its animal.
    expect(find(s, 'penguins').unsized).toBe(true);
    expect(s.backlog.indexOf(find(s, 'penguin-enc'))).toBeLessThan(s.backlog.indexOf(find(s, 'penguins')));
  });

  it('splitting only some members leaves the epic with the rest', () => {
    const s = splitEpic(initialZooState(1), 'savanna', ['zebra']);
    expect(find(s, 'zebra').category).toBe('exhibit');
    const savanna = s.backlog.find((i) => i.id === 'savanna')!;
    expect(savanna.category).toBe('epic');
    expect((savanna.epicMembers ?? []).some((m) => m.id === 'zebra')).toBe(false);
    expect((savanna.epicMembers ?? []).some((m) => m.id === 'elephant')).toBe(true);
  });

  it('setting an enclosure footprint is targeted (other enclosures untouched)', () => {
    let s = bigCatsSplit(1);
    expect(find(s, 'lion-enc').enclosureSize).toBe('large'); // its starter footprint
    s = setEnclosureSize(s, 'lion-enc', 'small');
    expect(find(s, 'lion-enc').enclosureSize).toBe('small');
    expect(find(s, 'tiger-enc').enclosureSize).toBe('large'); // unaffected
  });

  it('a dragged feature keeps its saved park position', () => {
    let s = setItemPos(initialZooState(1), 'lion-enc', { x: 300, y: 120 });
    expect(find(s, 'lion-enc').pos).toEqual({ x: 300, y: 120 });
    // targeted - no other item is positioned
    expect(s.backlog.filter((i) => i.pos).map((i) => i.id)).toEqual(['lion-enc']);
    s = setItemPos(s, 'lion-enc', { x: 50, y: 60 });
    expect(find(s, 'lion-enc').pos).toEqual({ x: 50, y: 60 });
  });

  it('an animal keeps its dragged spot inside the enclosure (0..1 fractions), independent of the park position', () => {
    let s = setItemSpot(initialZooState(1), 'lion', { x: 0.3, y: 0.7 });
    expect(find(s, 'lion').spot).toEqual({ x: 0.3, y: 0.7 });
    expect(s.backlog.filter((i) => i.spot).map((i) => i.id)).toEqual(['lion']); // targeted
    s = setItemSpot(s, 'lion', { x: 0.6, y: 0.5 });
    expect(find(s, 'lion').spot).toEqual({ x: 0.6, y: 0.5 });
    expect(find(s, 'lion').pos).toBeUndefined(); // spot is separate from the park position
  });

  it('planting can be nested inside an enclosure (drag in) and taken back out (drag out)', () => {
    let s = addPbi(initialZooState(1), { name: 'Fern', category: 'flora', zone: 'Big Cats', acceptance: [] });
    const fernId = s.backlog.find((i) => i.name === 'Fern')!.id;
    s = setItemPos(s, fernId, { x: 200, y: 100 }); // loose on the grounds
    s = nestItem(s, fernId, 'lion-enc', { x: 0.4, y: 0.6 });
    const nested = find(s, fernId);
    expect(nested.enclosureId).toBe('lion-enc'); // now part of that habitat
    expect(nested.spot).toEqual({ x: 0.4, y: 0.6 });
    expect(nested.pos).toBeUndefined(); // no longer a loose grounds position
    s = unnestItem(s, fernId);
    const out = find(s, fernId);
    expect(out.enclosureId).toBeUndefined(); // back on the open grounds
    expect(out.spot).toBeUndefined();
  });

  it('an enclosure can be renamed via its sign, and a blank name is ignored', () => {
    let s = renameItem(initialZooState(1), 'lion-enc', '  Savanna Kingdom  ');
    expect(find(s, 'lion-enc').name).toBe('Savanna Kingdom'); // trimmed
    s = renameItem(s, 'lion-enc', '   ');
    expect(find(s, 'lion-enc').name).toBe('Savanna Kingdom'); // blank ignored, keeps the last name
  });

  it('enclosures are excluded from the visitor simulation (they carry no appeal)', () => {
    // Open only the enclosure: no exhibits open, so visitors have nothing to enjoy.
    let s = planSprint(bigCatsSplit(1), ['lion-enc']);
    s = openItem(finish(s, 'lion-enc'), 'lion-enc');
    s = reviewSprint(s);
    expect(s.lastReview!.segments.every((seg) => seg.happiness === 0)).toBe(true);
  });
});

describe('zoo game: a day that has run out of room', () => {
  it('knows when nothing left fits, so the board can say why it has gone quiet', () => {
    // The Developers stop when the day cannot pay for the next piece of work, and the board used
    // to go silent for twenty seconds with no way to tell that from the game having stopped.
    let s = initialZooState(7);
    s = { ...s, phase: 'sprint', dayStage: 'building', daySecondsLeft: 90,
      backlog: s.backlog.map((it) => (it.id === 'lion-enc'
        ? { ...it, status: 'committed' as const, estimate: 5, unsized: false } : it)) };
    expect(nothingFitsToday(s), 'a fresh day with work waiting is not a spent one').toBe(false);

    // ...and with four seconds left, nothing does.
    expect(nothingFitsToday({ ...s, daySecondsLeft: 4 }),
      'the day had four seconds left and the board would still have said nothing').toBe(true);
  });
});

describe('zoo game: the Definition of Done is the completion gate, not a happiness dial', () => {
  const NICE = ['lion', 'tiger', 'kiosk', 'penguins', 'reef', 'wc'];

  it('the default DoD is the four-step workflow (build, review, PO sign-off, place it ready)', () => {
    expect(initialZooState(1).definitionOfDone).toEqual([
      'Meets its acceptance criteria',
      'Peer-reviewed by another Developer',
      'Approved by the PO',
      'Placed on the park, ready to open',
    ]);
  });

  it('does not claim an item is open to visitors', () => {
    // If the DoD says released, then meeting it means released, and "Done but not open" is a
    // contradiction rather than a lesson. Everything else here needs the two to be different
    // states: velocity counts Done, visitors see only what is open, and the release is the
    // Product Owner's decision to make at a moment of their choosing.
    for (const line of initialZooState(1).definitionOfDone) {
      expect(line, `the DoD line "${line}" makes being open part of being Done`)
        .not.toMatch(/\bopened\b|\breleased\b|\blive\b/i);
    }
  });

  it('editing the DoD text does not change visitor happiness - that comes from the design', () => {
    const full = reviewSprint(buildAndOpen(flat(bigCatsSplit(1)), NICE));
    const trimmed = reviewSprint(buildAndOpen(setDefinitionOfDone(flat(bigCatsSplit(1)), ['Meets its acceptance criteria']), NICE));
    expect(trimmed.lastReview!.overallHappiness).toBe(full.lastReview!.overallHappiness);
  });
});

describe('zoo game: Retrospective coaching questions', () => {
  const NICE = ['lion', 'tiger', 'kiosk', 'penguins', 'reef', 'wc'];

  it('are open (what/how/when), never "why", and there is always at least one', () => {
    // A Sprint where the Goal is missed (only the lion of two goal items delivered).
    let s = planSprint(flat(bigCatsSplit(1)), ['lion', 'tiger']);
    s = reviewSprint(openItem(finish(s, 'lion'), 'lion'));
    const qs = retroQuestions(s);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.length).toBeLessThanOrEqual(3);
    expect(qs.every((q) => /^(what|how|when|who|where)\b/i.test(q))).toBe(true);
    expect(qs.some((q) => /\bwhy\b/i.test(q))).toBe(false);
  });

  it('falls back to general prompts on a clean Sprint', () => {
    const s = reviewSprint(buildAndOpen(flat(initialZooState(1)), NICE));
    const qs = retroQuestions(s);
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every((q) => /^(what|how|when|who|where)\b/i.test(q))).toBe(true);
  });
});

describe('zoo game: the toolbox', () => {
  it('adds a templated PBI that keeps its species shape into the studio', () => {
    const lion = TOOLBOX.flatMap((g) => g.items).find((i) => i.template === 'lion')!;
    const s = addPbi(initialZooState(1), toolboxDraft(lion));
    const item = s.backlog.find((i) => i.template === 'lion' && i.status === 'backlog')!;
    expect(item.category).toBe('exhibit');
    expect(item.unsized).toBe(true);
    // The criteria are outcomes a visitor would notice, not a restatement of the build steps.
    expect(item.acceptance.some((a) => /tell they are a lion/i.test(a))).toBe(true);
    // presetFor uses the template, not the id, so a maned lion shape is the starting point
    expect(presetFor(item).parts.head).toBe('maned');
  });

  it('offers a broad selection of animal templates, all with known shapes', () => {
    const exhibits = TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'exhibit');
    expect(exhibits.length).toBeGreaterThanOrEqual(20);
    for (const e of exhibits) expect(presetFor({ category: 'exhibit', template: e.template } as never).parts.body).toBeDefined();
  });

  it('includes a Birds group with recognisable bird shapes', () => {
    const birds = TOOLBOX.find((g) => g.group === 'Birds')!;
    expect(birds).toBeDefined();
    const names = birds.items.map((i) => i.template);
    expect(names).toEqual(expect.arrayContaining(['eagle', 'parrot', 'ostrich', 'emu', 'owl']));
    for (const b of birds.items) expect(presetFor({ category: 'exhibit', template: b.template } as never).parts.head).toBe('beaked');
  });

  it('offers enclosures (habitats) too, which add a sized enclosure PBI', () => {
    const encs = TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'enclosure');
    expect(encs.length).toBeGreaterThanOrEqual(3);
    const large = encs.find((e) => e.footprint === 'large')!;
    const s = addPbi(initialZooState(1), toolboxDraft(large));
    const item = s.backlog.find((i) => i.name === large.name && i.status === 'backlog')!;
    expect(item.category).toBe('enclosure');
    expect(item.enclosureSize).toBe('large');
    expect(item.unsized).toBe(true);
  });

  it('offers a Pathway PBI designed as a width + colour, built through its plan', () => {
    const pathway = TOOLBOX.flatMap((g) => g.items).find((i) => i.name === 'Pathway')!;
    expect(pathway.category).toBe('path');
    const draft = toolboxDraft(pathway);
    // Build AC (studio: width + colour) plus a deploy AC (routed on the park) - split correctly.
    expect(draft.acceptance).toContain('Can two people walk it side by side?');
    expect(draft.acceptance.some((a) => isDeployAcceptance(a))).toBe(true);
    expect(draft.acceptance.filter((a) => !isDeployAcceptance(a))).toEqual(['Can two people walk it side by side?']);
    let s = addPbi(initialZooState(1), draft);
    const item = s.backlog.find((i) => i.category === 'path')!;
    // A path is designed as a width and a colour (both preset, so the design is ready to build).
    const preset = presetFor(item);
    expect(designCriteria(item, preset).map((c) => c.label)).toEqual(['Set the path width', 'Choose the path colour']);
    expect(designCriteria(item, preset).every((c) => c.pass)).toBe(true);
    expect(preset.parts.thickness).toBe('medium');
    expect(pathWidthPx(preset.parts.thickness)).toBe(9);
    // Its plan is the width/colour design + the standing workflow (no route step - the route is drawn at deploy).
    const tasks = suggestTasks(item).map((t) => t.label);
    expect(tasks).toEqual(['Set its width and colour', "Get the PO's sign-off"]);
    // Building it (no design) with its plan complete takes it to Done.
    s = estimateItem(s, item.id, 3);
    s = planSprint(s, [item.id]);
    s = setItemTasks(s, item.id, suggestTasks(item));
    let built = buildItem(s, item.id, presetFor(item)); // the studio passes the (empty) path design
    for (const t of built.backlog.find((x) => x.id === item.id)!.tasks ?? []) built = toggleItemTask(built, item.id, t.id);
    expect(built.backlog.find((x) => x.id === item.id)!.status).toBe('done');
    // Delivering it does not add a park feature (it is the connectors it drew). It cannot be
    // released until it is drawn on the park and that criterion is confirmed - the sign-off.
    expect(openItem(built, item.id).backlog.find((x) => x.id === item.id)!.status).toBe('done');
    const open = openItem(accept(built, item.id), item.id);
    expect(open.backlog.find((x) => x.id === item.id)!.status).toBe('open');
  });

  it('gives every toolbox item ACs split across build (studio) and deploy (park)', () => {
    // Consistency across ALL items: each has at least one build-time (appearance) criterion and
    // exactly one deploy-time (placement/sizing) criterion - so every item is verified on the park
    // when placed, not just landscape scenery.
    for (const t of TOOLBOX.flatMap((g) => g.items)) {
      const acs = toolboxDraft(t).acceptance;
      const build = acs.filter((a) => !isDeployAcceptance(a));
      const deploy = acs.filter((a) => isDeployAcceptance(a));
      expect(build.length, `${t.name} should have a build AC`).toBeGreaterThanOrEqual(1);
      expect(deploy.length, `${t.name} should have exactly one deploy AC`).toBe(1);
    }
  });

  it('offers landscape & wayfinding items as normal (PBI-creating) toolbox pieces with fitting shapes and ACs', () => {
    const items = TOOLBOX.flatMap((g) => g.items);
    for (const name of ['River', 'Bridge', 'Pond', 'Rocks', 'Entrance', 'Hedge', 'Fountain']) {
      const t = items.find((i) => i.name === name)!;
      expect(t, name).toBeTruthy();
      expect(t.category).toBe('flora'); // scenery flows through the flora/PBI pipeline
      const draft = toolboxDraft(t);
      expect(draft.template).toBe(t.template);
      // Each renders a distinct, non-empty sprite from its type.
      const grid = renderDesign({ category: 'flora' } as never, { parts: { type: t.template! }, colors: { foliage: '#5aa9c8', trunk: '#b7965f' } });
      expect(grid.some((row) => row.some((c) => c)), `${name} renders`).toBe(true);
    }
    // Water features read as water, not "planting", and are sized to fit rather than "no bare patches".
    expect(toolboxDraft(items.find((i) => i.name === 'River')!).acceptance)
      .toEqual(['Can I tell that is water at a glance?', 'Can I see it from across the park?', 'Can visitors still get round it?']);
    expect(toolboxDraft(items.find((i) => i.name === 'Entrance')!).acceptance).toContain('Can I tell this is the way in?');
    // Landscape features are resizable: they carry a default footprint and take a saved size.
    expect(isLandscapeType('river')).toBe(true);
    expect(isLandscapeType('bridge')).toBe(true);
    expect(isLandscapeType('tree')).toBe(false);
    // A bridge is scenery you cross: it reads as a bridge (build) and is placed across the water (deploy).
    expect(toolboxDraft(items.find((i) => i.name === 'Bridge')!).acceptance).toEqual(['Can I see it is something you cross?', 'Can I cross the water on it?']);
    expect(landscapeDefaultSize('river').w).toBeGreaterThan(landscapeDefaultSize('river').h); // a river starts wide
    const sized = setItemSize(initialZooState(1), 'lion', { w: 400, h: 40 });
    expect(sized.backlog.find((i) => i.id === 'lion')!.size).toEqual({ w: 400, h: 40 });
    // The studio names a feature's colours for what they are - a river has water, not "foliage" or
    // a trunk - and shows only the colours it uses.
    // A river has no colour control at all: water is water, and a control that is not a decision is
    // just another thing to click before the PBI can be finished. What a river IS is how far it
    // reaches, so its one build step is sizing it on the park.
    expect(floraColors('river')).toEqual([]);
    expect(floraColors('carpark').map((c) => c.label)).toEqual(['Tarmac', 'Markings']);
    expect(floraColors('tree').map((c) => c.label)).toEqual(['Foliage']);

    // ...and it shows only the colours the Increment can KEEP, which is the harder half. Landscape
    // is drawn as geometry out of the colours it is given, so both of them land - a bridge really
    // does get red railings on a light brown deck. Everything else is a drawing off the artwork
    // sheet, tinted by turning the whole picture at once, and one turn cannot move a trunk away
    // from its leaves. The trunk control was there and it did nothing: choose a black trunk and the
    // tree stayed brown. A control that cannot be honoured is worse than a missing one - it teaches
    // the player that the studio lies.
    for (const type of FLORA_TYPES) {
      if (isLandscapeType(type)) continue;
      expect(floraColors(type).map((c) => c.key), `${type} offers a colour the Increment cannot keep`)
        .toEqual(['foliage']);
    }
    // A landscape PBI's plan has no "choose the plant type" step - it is scenery you colour and
    // then size on the park.
    // suggestTasks only reads category + template, both of which a toolbox draft carries.
    const riverPlan = suggestTasks(toolboxDraft(items.find((i) => i.name === 'River')!) as never).map((t) => t.label);
    // Named for the work a river actually needs, not for a plant's. Colouring it is not on the list
    // because water is water; what makes it a river rather than a puddle is how far it reaches.
    expect(riverPlan).toEqual(['Size it on the park', "Get the PO's sign-off"]);
    expect(riverPlan.some((l) => /plant|foliage/i.test(l))).toBe(false);
    // And a signpost is asked about its sign and its post, not about foliage - it fell through to
    // the planting branch for months because it is filed as flora.
    const signPlan = suggestTasks(toolboxDraft(items.find((i) => i.name === 'Signpost')!) as never).map((t) => t.label);
    // No "colour the post": a signpost is drawn off the artwork sheet and tinted whole, so the post
    // cannot be coloured away from the board. The plan comes from the same list the controls do, so
    // dropping a control drops the step that asked for it - nothing is left demanding something the
    // studio cannot do, which is how the Gift Shop got stuck.
    expect(signPlan).toEqual(['Colour the sign', "Get the PO's sign-off"]);
    // All the landscape sprites differ from each other.
    const shapes = ['river', 'pond', 'rocks', 'entrance', 'carpark', 'hedge', 'fountain'];
    const rendered = shapes.map((t) => JSON.stringify(renderDesign({ category: 'flora' } as never, { parts: { type: t }, colors: { foliage: '#5aa9c8', trunk: '#8a5a2b' } })));
    expect(new Set(rendered).size).toBe(shapes.length);
  });

  it('separates build-time acceptance (studio) from deploy-time acceptance (placed & sized on the park)', () => {
    // "Sized to fit the space" can only be judged once it is on the park, so it is a deploy-time AC;
    // appearance ACs are build-time (confirmed in the studio).
    expect(isDeployAcceptance('Sized to fit the space')).toBe(true);
    expect(isDeployAcceptance('Can I tell that is water at a glance?')).toBe(false);
    expect(isDeployAcceptance('Clearly marked out')).toBe(false);
    // Confirming an AC persists on the item, index-aligned with acceptance.
    let s = initialZooState(1);
    const lion = () => s.backlog.find((i) => i.id === 'lion')!;
    s = confirmAcceptance(s, 'lion', 1, true);
    expect(lion().acConfirmed?.[1]).toBe(true);
    s = confirmAcceptance(s, 'lion', 1, false);
    expect(lion().acConfirmed?.[1]).toBe(false);
  });

  it('keeps in-progress design work across a Sprint boundary (draftDesign survives review + replan)', () => {
    let s = initialZooState(1);
    // An item being built in this Sprint, with partial studio work saved.
    s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber, started: true } : it)) };
    const partial = { parts: { body: 'round' }, colors: { body: '#123456' } };
    s = setDraftDesign(s, 'lion', partial);
    expect(s.backlog.find((i) => i.id === 'lion')!.draftDesign).toEqual(partial);
    // The Sprint ends with it unfinished: it returns to the Backlog but the work must not be lost.
    s = reviewSprint(s);
    const lion = s.backlog.find((i) => i.id === 'lion')!;
    expect(lion.status).toBe('backlog');
    expect(lion.draftDesign).toEqual(partial);
    // Carried over unfinished, it comes back already sized to what is left, so it is Ready to be
    // planned again rather than queued behind another round of estimating.
    expect(lion.unsized).toBe(false);
    expect(lion.carriedOver).toBe(true);
    // Re-estimating clears the carry-over flag and makes it Ready again.
    s = estimateItem(s, 'lion', 3);
    const relion = s.backlog.find((i) => i.id === 'lion')!;
    expect(relion.unsized).toBe(false);
    expect(relion.carriedOver).toBe(false);
    expect(relion.estimate).toBe(3);
    // Finishing the build clears the draft (the work becomes the real design).
    s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, status: 'committed' as const } : it)) };
    s = buildItem(s, 'lion', { parts: { body: 'round' }, colors: { body: '#123456' } });
    expect(s.backlog.find((i) => i.id === 'lion')!.draftDesign).toBeUndefined();
  });

  it('scales a carried-over item\'s poker toward the work that is left (by plan progress)', () => {
    let s = initialZooState(1);
    // An item mostly done: 3 of 4 plan tasks ticked, committed this Sprint.
    const tasks = [
      { id: 't0', label: 'a', done: true }, { id: 't1', label: 'b', done: true },
      { id: 't2', label: 'c', done: true }, { id: 't3', label: 'd', done: false },
    ];
    s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber, started: true, tasks, trueSize: 8 } : it)) };
    s = reviewSprint(s);
    const lion = s.backlog.find((i) => i.id === 'lion')!;
    // 3/4 done -> ~1/4 of the work left, so the size comes back well below the original 8 - and it
    // is the item's estimate now, not just a hidden nudge, because nobody is asked to size it again.
    expect(lion.trueSize).toBeLessThan(8);
    expect(lion.trueSize).toBeGreaterThanOrEqual(1);
    expect(lion.estimate).toBe(lion.trueSize);
  });

  it('placeOnPark marks a built item as placed (on the park) without releasing it to visitors', () => {
    let s = initialZooState(1);
    const lion = () => s.backlog.find((i) => i.id === 'lion')!;
    // Only a built (Done-column) item can be placed; a backlog item is untouched.
    s = placeOnPark(s, 'lion');
    expect(lion().placed).toBeFalsy();
    s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, status: 'done' as const } : it)) };
    s = placeOnPark(s, 'lion');
    expect(lion().placed).toBe(true);
    expect(lion().status).toBe('done'); // still in Deploy - not live until Deploy complete
  });

  it('gives each building acceptance criteria that fit what it is (a gift shop does not serve food)', () => {
    const draft = (name: string) => toolboxDraft(TOOLBOX.flatMap((g) => g.items).find((i) => i.name === name)!);
    expect(draft('Gift Shop').acceptance).toContain('Can I buy something to take home?');
    expect(draft('Gift Shop').acceptance).not.toContain('Can I buy food and a drink here?');
    expect(draft('Kiosk').acceptance).toContain('Can I buy food and a drink here?');
    expect(draft('Cafe').acceptance).toContain('Can I buy food and a drink here?');
    expect(draft('Toilets').acceptance).toContain('Can I find a free cubicle at a busy time?');
    expect(draft('Seating').acceptance.some((a) => /sit down/i.test(a))).toBe(true);
    // A food outlet raised from a visitor signal still reads as food, not retail.
    expect(amenityAcceptance('Food outlet', 'food')).toContain('Can I buy food and a drink here?');
  });

  it('buildings come in distinct shapes, each carried from the toolbox and rendering differently', () => {
    const amenities = TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'amenity');
    // The toolbox spread across several building shapes, not all the same.
    const shapes = new Set(amenities.map((a) => a.template));
    expect(shapes.size).toBeGreaterThanOrEqual(4);
    for (const a of amenities) expect(BUILDING_TYPES).toContain(a.template);
    // Kiosk starts as a kiosk; each building type renders a non-empty, distinct grid.
    const kiosk = amenities.find((a) => a.name === 'Kiosk')!;
    const item = { id: 'k', name: 'Kiosk', category: 'amenity' as const, zone: 'General', acceptance: [], status: 'backlog' as const, sprintNumber: null, accessible: true, estimate: 0, template: kiosk.template };
    expect(presetFor(item).parts.type).toBe('kiosk');
    const rendered = BUILDING_TYPES.map((t) => JSON.stringify(renderDesign(item, { parts: { type: t, sign: 'on' }, colors: { walls: '#cfd4d8', roof: '#9aa3ab', door: '#8a5a2b', sign: '#e6842a' } })));
    expect(new Set(rendered).size).toBe(BUILDING_TYPES.length); // every building type looks different
  });

  it('offers a Signpost in Flora & decor that starts as a signpost shape and reads as a sign', () => {
    const sign = TOOLBOX.flatMap((g) => g.items).find((i) => i.name === 'Signpost')!;
    expect(sign).toBeDefined();
    expect(sign.category).toBe('flora');
    expect(sign.template).toBe('signpost');
    const s = addPbi(initialZooState(1), toolboxDraft(sign));
    const item = s.backlog.find((i) => i.name === 'Signpost' && i.status === 'backlog')!;
    expect(item.acceptance).toContain('Can I read it from a few steps away?'); // sign ACs, not planting ones
    expect(presetFor(item).parts.type).toBe('signpost'); // the flora template drives the shape
    // The signpost renders something (a non-empty grid), like the other flora shapes.
    const grid = renderDesign(item, { parts: { type: 'signpost' }, colors: { foliage: '#c8873b', trunk: '#7a5230' } });
    expect(grid.some((row) => row.some((c) => c))).toBe(true);
  });

  it('flora templates keep their distinct starting shapes (trees, bushes, flowerbeds)', () => {
    const flora = TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'flora');
    const byName = (n: string) => flora.find((i) => i.name === n)!;
    expect(presetFor({ category: 'flora', template: byName('Bushes').template } as never).parts.type).toBe('bush');
    expect(presetFor({ category: 'flora', template: byName('Flowerbed').template } as never).parts.type).toBe('flowers');
    expect(presetFor({ category: 'flora', template: byName('Trees').template } as never).parts.type).toBe('tree');
  });
});

describe('zoo game: richer studio kit', () => {
  const exhibit = (): BacklogItem => ({ id: 'x', name: 'X', category: 'exhibit', zone: 'Z', acceptance: [], status: 'backlog', sprintNumber: null, accessible: true, estimate: 0 });

  it('offers the expanded part options', () => {
    const opt = (k: string) => EXHIBIT_PARTS.find((p) => p.key === k)!.options;
    expect(opt('head')).toEqual(expect.arrayContaining(['crested', 'tusked']));
    expect(opt('ears')).toContain('floppy');
    expect(opt('tail')).toContain('bushy');
    expect(opt('markings')).toEqual(expect.arrayContaining(['dapples', 'saddle']));
  });

  it('every part option renders to a grid without error', () => {
    for (const part of EXHIBIT_PARTS) {
      for (const o of part.options) {
        const design: ItemDesign = { parts: { body: 'round', head: 'round', [part.key]: o }, colors: { body: '#c8873b', head: '#8a5a2b' } };
        const grid = renderDesign(exhibit(), design);
        expect(grid.length).toBe(GRID_H);
        expect(grid[0].length).toBe(GRID_W);
      }
    }
  });

  it('gates an exhibit on stocking it and housing it, not on painting it', () => {
    // It used to be five colours and a "distinctive feature" on a creature the template had already
    // made a lion. What is actually open is how many lions, and whether they fit.
    const unstocked = designCriteria(exhibit(), { parts: {}, colors: {} });
    expect(unstocked.every((c) => !c.pass)).toBe(true);
    expect(unstocked.map((c) => c.label)).toEqual(['Decide how many, and of what ages', 'They fit the habitat with room to roam']);
    const pair = designCriteria(exhibit(), { parts: {}, colors: {}, group: { males: 2, females: 0, juveniles: 0, cubs: 0 } });
    expect(pair.every((c) => c.pass)).toBe(true);
  });
});

describe('zoo game: the coach nudges a new player through the loop', () => {
  it('sends a brand-new player to plan, rather than to finish the Backlog first', () => {
    // This used to tell them to split the epics before starting, which is Sprint 0 taught as
    // a screen. The Guide has no phase before the first Sprint, and the first area arrives
    // ready, so there is already a Sprint's worth to plan from.
    const s: ZooGameState = { ...initialZooState(1), phase: 'refine' }; // where Start lands you
    const n = nextNudge(s)!;
    expect(n.id).toBe('refine-first');
    expect(n.text, 'the opening nudge no longer sends them to plan').toMatch(/go and plan/i);
    expect(n.text, 'it still told them to split the epics up front').not.toMatch(/split one into pieces/i);
  });

  it('sends them to plan once a Sprint or two is ready, and warns when they overdo it', () => {
    const ready: ZooGameState = { ...bigCatsSplit(1), phase: 'refine', velocity: [40] }; // ~1-3 Sprints ready
    expect(readyHorizon(ready)).toBeGreaterThanOrEqual(1);
    expect(nextNudge(ready)?.id).toBe('refine-enough');
    // the same Backlog against a small velocity is far more than anyone should refine up front
    const over: ZooGameState = { ...ready, velocity: [8] };
    expect(readyHorizon(over)).toBeGreaterThan(3);
    expect(nextNudge(over)!.text).toMatch(/waste/i);
  });

  it('asks the whole Scrum Team to refine together partway through a Sprint', () => {
    // a team whose Backlog is not far ahead: a couple of Sprints of ready work at most
    const s = { ...planSprint(bigCatsSplit(1), ['lion-enc']), velocity: [40] };
    expect(readyHorizon(s)).toBeLessThanOrEqual(2);
    const day2 = { ...s, dayNumber: 2 };
    const n = nextNudge(day2, new Set(['start-one', 'deploy-it']))!;
    expect(n.id).toBe('refine-midsprint');
    expect(n.text).toMatch(/whole Scrum Team, not the PO alone/i);
    // on day one the team is getting started, so it holds its tongue
    expect(nextNudge({ ...s, dayNumber: 1 }, new Set(['start-one', 'deploy-it']))?.id).not.toBe('refine-midsprint');
  });

  it('asks them to refine ahead while a Sprint runs, and calls it late at Planning', () => {
    const bare = (phase: 'sprint' | 'planning'): ZooGameState => ({
      ...planSprint(bigCatsSplit(1), ['lion-enc']),
      phase,
      backlog: planSprint(bigCatsSplit(1), ['lion-enc']).backlog.map((it) => (it.status === 'backlog' ? { ...it, unsized: true } : it)),
    });
    expect(nextNudge(bare('sprint'))?.id).toBe('refine-ahead');
    expect(nextNudge(bare('planning'))?.id).toBe('refine-late');
  });

  it('says only what the screens do not, then falls quiet', () => {
    let s: ZooGameState = { ...bigCatsSplit(1), phase: 'planning' };
    // Sprint Planning's own heading asks for the Goal and then the forecast, and every To Do card
    // carries a Start button - so the coach says none of it.
    expect(nextNudge(s)).toBeNull();
    s = setSprintGoal(s, 'Open the Big Cats zone so families have a headline exhibit.');
    expect(nextNudge(s)).toBeNull();
    s = planSprint(s, ['lion-enc']);
    expect(nextNudge(s)).toBeNull();
    // Releasing before the Review is the one thing the board does not say for itself.
    s = finish(startItem(s, 'lion-enc'), 'lion-enc');
    expect(nextNudge(s)?.id).toBe('deploy-it');
    s = openItem(s, 'lion-enc');
    expect(nextNudge(s)).toBeNull(); // nothing to say - they are getting on with it
  });

  it('says nothing a player has waved away', () => {
    const s: ZooGameState = { ...initialZooState(1), phase: 'refine' };
    expect(nextNudge(s, new Set(['refine-first']))?.id).not.toBe('refine-first');
  });
});

describe('zoo game: refinement prepares later Sprints, and only Ready work is forecast', () => {
  it('does not put a refinement step between Sprints - there is no gap between them', () => {
    let s = planSprint(bigCatsSplit(1), ['lion-enc']);
    s = startNextSprint(reviewSprint(s), '');
    expect(s.phase).toBe('planning');
  });

  it('knows why an item is not ready, and will not forecast it', () => {
    const s = initialZooState(1);
    const epic = s.backlog.find((it) => it.category === 'epic')!;
    expect(notReady(epic)).toMatch(/split/i);
    expect(isReady(epic)).toBe(false);
    expect(notReady({ ...s.backlog[0], unsized: true })).toMatch(/sized/i);
    expect(notReady({ ...s.backlog[0], acceptance: [] })).toMatch(/acceptance/i);
    expect(isReady(s.backlog.find((it) => it.id === 'lion-enc')!)).toBe(true);

    // asking to forecast an epic simply does not commit it
    expect(planSprint(s, [epic.id, 'lion-enc']).committedIds).toEqual(['lion-enc']);
  });

  it('charges refinement to the day clock of the Sprint it is done in, and nothing else', () => {
    // Before any Sprint, the initial discovery is free - there is no Sprint to take it from.
    let s: ZooGameState = { ...initialZooState(1), phase: 'refine' };
    const before = zooCapacity(s.velocity);
    s = estimateItem(splitEpic(s, 'forest', ['bear', 'monkey', 'picnic']), 'bear-enc', 5);
    expect(s.refinePenalty).toBe(0);
    expect(zooCapacity(s.velocity)).toBe(before); // the coming Sprint is not docked for it

    // Refining DURING a Sprint is the Developers' time, so it comes off the day's build clock.
    let running = planSprint(bigCatsSplit(1), ['lion-enc']);
    expect(running.phase).toBe('sprint');
    running = estimateItem(running, 'penguins', 5);
    expect(running.refinePenalty).toBeGreaterThan(0);
  });

  it('measures how far ahead the Backlog is prepared, in Sprints of ready work', () => {
    const s: ZooGameState = { ...bigCatsSplit(1), velocity: [20] };
    const pts = availableItems(s).filter(isReady).reduce((n, it) => n + it.estimate, 0);
    expect(readyHorizon(s)).toBeCloseTo(Math.round((pts / 20) * 10) / 10, 5);
    // nothing ready -> nothing prepared
    expect(readyHorizon({ ...s, backlog: s.backlog.map((it) => ({ ...it, unsized: true })) })).toBe(0);
  });

  it('lets the team edit their Definition of Ready', () => {
    const s = setDefinitionOfReady(initialZooState(1), ['  Sized  ', '', 'Agreed with the PO']);
    expect(s.definitionOfReady).toEqual(['Sized', 'Agreed with the PO']);
  });
});

describe('zoo game: every event inspects and adapts an artifact', () => {
  it('matches the Build a Scrum table', () => {
    // Sprint Planning inspects the Product Backlog and CREATES the Sprint Backlog.
    expect(EVENT_CONTRACT.planning.inspects).toContain('product-backlog');
    expect(EVENT_CONTRACT.planning.creates).toContain('sprint-backlog');
    // The Sprint (and the Daily Scrum in it) inspects and adapts the Sprint Backlog, and the work
    // of the Sprint creates the Increment.
    expect(EVENT_CONTRACT.sprint.inspects).toContain('sprint-backlog');
    expect(EVENT_CONTRACT.sprint.adapts).toContain('sprint-backlog');
    expect(EVENT_CONTRACT.sprint.creates).toContain('increment');
    // The Review inspects the Increment and adapts the Product Backlog.
    expect(EVENT_CONTRACT.review.inspects).toEqual(['increment']);
    expect(EVENT_CONTRACT.review.adapts).toEqual(['product-backlog']);
    // The Retrospective inspects how the team works, which is not one of the three artifacts.
    expect(EVENT_CONTRACT.retro.inspects).toEqual([]);
    expect(EVENT_CONTRACT.retro.also).toMatch(/Definition of Done/);
    // and every event names who is there
    for (const [phase, c] of Object.entries(EVENT_CONTRACT)) expect(c.who.length, phase).toBeGreaterThan(3);
  });

  it('drives the markers from that one table', () => {
    expect(roleFor('planning', 'product-backlog')).toBe('inspects');
    expect(roleFor('planning', 'sprint-backlog')).toBe('creates');
    expect(roleFor('sprint', 'sprint-backlog')).toBe('adapts'); // adapting wins over inspecting
    expect(roleFor('review', 'increment')).toBe('inspects');
    expect(roleFor('review', 'sprint-backlog')).toBeNull();
  });

  it('shows all three artifacts, and says which do not exist yet', () => {
    const fresh = artifactState(initialZooState(1));
    expect(fresh.map((a) => a.id)).toEqual(['product-backlog', 'sprint-backlog', 'increment']);
    // The Product Backlog exists from the start; the other two are brought into being.
    expect(fresh.find((a) => a.id === 'product-backlog')!.exists).toBe(true);
    expect(fresh.find((a) => a.id === 'sprint-backlog')!.exists).toBe(false);
    expect(fresh.find((a) => a.id === 'increment')!.exists).toBe(false);
    expect(fresh.find((a) => a.id === 'sprint-backlog')!.summary).toMatch(/Created at Sprint Planning/i);

    // Forecasting brings the Sprint Backlog into being...
    const planned = planSprint(bigCatsSplit(1), ['lion-enc']);
    expect(artifactState(planned).find((a) => a.id === 'sprint-backlog')!.exists).toBe(true);
    // ...and an item meeting the Definition of Done brings the Increment into being.
    const built = finish(startItem(planned, 'lion-enc'), 'lion-enc');
    expect(artifactState(built).find((a) => a.id === 'increment')!.exists).toBe(true);
  });
});

describe('zoo game: every word of teaching comes from a Teaching Card', () => {
  it('has a card behind every "?" panel in the game, by id', () => {
    // The screens used to carry their own prose about Scrum, which drifted from the cards and was
    // not editable. Each "?" now names cards instead. If one of these ids ever stops existing, a
    // screen silently explains nothing - so they are checked here rather than discovered by a player.
    const referenced = [
      'product-backlog', 'product-goal', 'definition-of-done', 'increment', 'refinement', 'pbi',
      'sprint', 'sprint-backlog', 'daily-scrum', 'sprint-goal', 'sprint-planning', 'velocity',
      'developers', 'sprint-retrospective', 'sprint-review', 'empiricism',
    ];
    for (const id of referenced) {
      expect(SCRUM_CARDS.find((c) => c.id === id), id).toBeTruthy();
    }
  });

  it('makes every card field editable, so nothing taught is locked in code', () => {
    const keys = new Set(copyEntries().map((e) => e.key));
    for (const c of SCRUM_CARDS) {
      for (const field of ['title', 'summary', 'why', 'who', 'when', 'how']) {
        expect(keys.has(`card.${c.id}.${field}`), `${c.id}.${field}`).toBe(true);
      }
    }
  });

  it('makes the front page editable too - it is the first thing anyone reads', () => {
    const keys = new Set(copyEntries().map((e) => e.key));
    expect(keys.has('intro.title')).toBe(true);
    expect(keys.has('intro.strapline')).toBe(true);
  });
});

describe('zoo game: teaching Scrum while you play it', () => {
  it('has a card for every element, answering why, who, when and how', () => {
    expect(SCRUM_CARDS.length).toBeGreaterThan(12);
    for (const c of SCRUM_CARDS) {
      // A title can be one word ("Velocity"); the answers cannot be.
      expect(c.title.trim().length, c.id).toBeGreaterThan(4);
      for (const field of [c.summary, c.why, c.who, c.when, c.how]) {
        expect(field.trim().length, c.id).toBeGreaterThan(9);
      }
    }
    // the three artifacts, the five events and the three accountabilities are all covered
    for (const id of ['product-backlog', 'sprint-backlog', 'increment',
      'sprint', 'sprint-planning', 'daily-scrum', 'sprint-review', 'sprint-retrospective',
      'product-owner', 'developers', 'scrum-master']) {
      expect(cardFor(id), id).toBeDefined();
    }
  });

  it('does not call a commitment an artifact', () => {
    // Three artifacts, each WITH a commitment. The Product Goal is the Product Backlog's commitment,
    // not a fourth artifact - and the same for the Sprint Goal and the Definition of Done.
    for (const [id, artifact] of [['product-goal', 'Product Backlog'], ['sprint-goal', 'Sprint Backlog'], ['definition-of-done', 'Increment']] as const) {
      const c = cardFor(id)!;
      expect(c.kind, id).toBe('commitment');
      expect(c.of, id).toBe(artifact);
    }
    for (const id of ['product-backlog', 'sprint-backlog', 'increment']) {
      expect(cardFor(id)!.kind, id).toBe('artifact');
    }
    expect(SCRUM_CARDS.filter((c) => c.kind === 'artifact').length).toBe(3); // exactly three
  });

  it('teaches the Product Goal where it is first met, not later', () => {
    expect(CARDS_BY_PHASE.intro).toEqual(['product-goal']);
    for (const [phase, ids] of Object.entries(CARDS_BY_PHASE)) {
      if (phase !== 'intro') expect(ids, phase).not.toContain('product-goal');
    }
  });

  it('names the timeboxes the Guide gives, and flags what is not Scrum', () => {
    expect(cardFor('daily-scrum')!.timebox).toMatch(/15 minutes/);
    expect(cardFor('sprint-planning')!.timebox).toMatch(/8 hours/);
    expect(cardFor('sprint')!.timebox).toMatch(/one month or less/i);
    // refinement is ongoing work, not an event, so it has no timebox
    expect(cardFor('refinement')!.timebox).toBeUndefined();
    expect(cardFor('pbi')!.notScrum).toMatch(/not part of Scrum/i);
  });

  it('shows each card once, and only while the teaching is on', () => {
    let s = initialZooState(1);
    expect(s.teaching).toBe(true);
    expect(s.taught).toEqual([]);
    const forRefine = CARDS_BY_PHASE.refine;
    const next = (x: ZooGameState) => (x.teaching ? forRefine.find((id) => !x.taught.includes(id)) : undefined);
    expect(next(s)).toBe(forRefine[0]);
    s = markTaught(s, forRefine[0]);
    expect(next(s)).toBe(forRefine[1]);
    expect(markTaught(s, forRefine[0]).taught).toEqual([forRefine[0]]); // reading it twice changes nothing
    expect(next(setTeaching(s, false))).toBeUndefined();
  });
});

describe('zoo game: cancelling a Sprint', () => {
  it('sends unfinished work back to the Product Backlog and keeps what is Done', () => {
    let s = planSprint(bigCatsSplit(1), ['lion-enc', 'tiger-enc']);
    s = finish(startItem(s, 'lion-enc'), 'lion-enc'); // Done, not yet released
    s = startItem(s, 'tiger-enc');                     // under way, not finished
    const before = s.sprintNumber;

    s = cancelSprint(s);

    const done = s.backlog.find((it) => it.id === 'lion-enc')!;
    expect(done.status).toBe('done');            // Done work is kept and can still be released
    const unfinished = s.backlog.find((it) => it.id === 'tiger-enc')!;
    expect(unfinished.status).toBe('backlog');   // ...everything else goes back to the PO's list
    expect(unfinished.unsized).toBe(false);      // sized to what is left, not queued for the poker
    expect(unfinished.carriedOver).toBe(true);
    expect(unfinished.sprintNumber).toBeNull();

    // a new Sprint starts straight after, with nothing measured from the cancelled one
    expect(s.phase).toBe('planning');
    expect(s.sprintNumber).toBe(before + 1);
    expect(s.sprintGoal).toBe('');
    expect(s.velocity).toEqual([]);
    expect(s.sprintsCancelled).toBe(1);
  });

  it('is only possible while a Sprint is running', () => {
    const planning: ZooGameState = { ...bigCatsSplit(1), phase: 'planning' };
    expect(cancelSprint(planning)).toBe(planning);
    const retro: ZooGameState = { ...bigCatsSplit(1), phase: 'retro' };
    expect(cancelSprint(retro)).toBe(retro);
  });
});

describe('zoo game: refinement is a conversation, and the Developers do the sizing', () => {
  it('opens with the Product Owner on value and a trade-off, and answers with the Developers', () => {
    const s = initialZooState(1);
    const talk = refinementTalk(s, s.backlog.find((it) => it.id === 'lion')!);
    expect(talk.po.name).toBe(s.team.productOwner.name);
    expect(talk.po.line).toMatch(/visitors come for/i);
    expect(talk.po.line).toMatch(/tell me what you would drop/i); // the trade-off is the PO's to weigh
    expect(talk.devs.map((d) => d.name)).toContain(s.team.developers[0].name);
    // the Guide's line: the Developers who will do the work are responsible for the sizing
    expect(talk.devs.some((d) => /we will size it/i.test(d.line))).toBe(true);
  });

  it('says what actually stands in the way of this item', () => {
    const s = initialZooState(1);
    // an animal cannot start before its habitat
    expect(refinementTalk(s, s.backlog.find((it) => it.id === 'lion')!).devs
      .some((d) => /Lion Enclosure is built/i.test(d.line))).toBe(true);
    // an epic cannot be sized at all
    const epic = refinementTalk(s, s.backlog.find((it) => it.category === 'epic')!);
    expect(epic.devs[0].line).toMatch(/too big to finish in one Sprint/i);
    expect(epic.po.line).toMatch(/split it/i);
    // no acceptance criteria, nothing to judge Done against
    const bare = refinementTalk(s, { ...s.backlog[0], acceptance: [] });
    expect(bare.devs.some((d) => /acceptance criteria/i.test(d.line))).toBe(true);
  });
});

describe('zoo game: some scenery is a set, not a single thing', () => {
  // Where a plant goes is worked out by the caller, which knows where on the park the item stands.
  // Here that is stated plainly, which is the point of the engine taking a place rather than
  // guessing one: it cannot put a plant somewhere silly, because it does not choose.
  const at = (x: number, y: number) => ({ x, y });

  it('puts down as many as the acceptance criteria need, without new PBIs', () => {
    let s = initialZooState(1);
    const before = s.backlog.length;
    s = addItemCopy(s, 'signposts', at(200, 300));
    s = addItemCopy(s, 'signposts', at(240, 300));
    s = addItemCopy(s, 'signposts', at(280, 300));
    const signs = s.backlog.find((it) => it.id === 'signposts')!;
    expect(signs.copies).toHaveLength(3);
    expect(s.backlog.length).toBe(before); // arranging, not new work - no PBI, no points
    expect(signs.estimate).toBe(initialZooState(1).backlog.find((it) => it.id === 'signposts')!.estimate);
  });

  it('gives every plant its own place, so moving one moves only that one', () => {
    // They were held as offsets from the item, which meant dragging the item dragged the whole
    // planting with it - you could not put an oak by the gate and a pine by the water, because they
    // were one thing. Click Oak and you get an oak; click Pine and you get a pine.
    let s = addItemCopy(initialZooState(1), 'trees', at(100, 100), 'oak');
    s = addItemCopy(s, 'trees', at(400, 500), 'pine');
    const before = s.backlog.find((it) => it.id === 'trees')!.copies!;
    expect(before.map((c) => c.piece)).toEqual(['oak', 'pine']);

    // Move the item itself right across the park: the trees stay where they were put.
    s = setItemPos(s, 'trees', { x: 700, y: 60 });
    expect(s.backlog.find((it) => it.id === 'trees')!.copies).toEqual(before);

    // ...and moving one of them leaves the other alone.
    s = moveItemCopy(s, 'trees', 0, at(120, 130));
    const after = s.backlog.find((it) => it.id === 'trees')!.copies!;
    expect(after[0]).toEqual({ x: 120, y: 130, piece: 'oak' });
    expect(after[1]).toEqual(before[1]);
  });

  it('stands a new plant beside the last, ringing outwards rather than marching off', () => {
    // The offsets a caller uses to place them. A line walks off the park - which is clipped, so the
    // plants are drawn and then cut away: four signposts made, two seen.
    const spots = Array.from({ length: 8 }, (_, i) => copyOffset(i));
    expect(spots.filter((c) => c.dx > 0)).toHaveLength(spots.filter((c) => c.dx < 0).length);
    expect(spots.filter((c) => c.dy > 0)).toHaveLength(spots.filter((c) => c.dy < 0).length);
    // the first eight all stand in the first ring, a plant's width out - near enough to read as one
    // planting, far enough apart to read as several plants
    expect(Math.max(...spots.map((c) => Math.max(Math.abs(c.dx), Math.abs(c.dy))))).toBe(COPY_GAP);
    expect(new Set(spots.map((c) => `${c.dx},${c.dy}`)).size).toBe(spots.length);
  });

  it('lets one planting hold more than one kind of thing', () => {
    let s = addItemCopy(initialZooState(1), 'trees', at(100, 100), 'pine');
    s = addItemCopy(s, 'trees', at(140, 100), 'bush');
    let trees = s.backlog.find((it) => it.id === 'trees')!;
    expect(trees.copies!.map((c) => c.piece)).toEqual(['pine', 'bush']);

    s = setItemCopyPiece(s, 'trees', 1, 'blossom');
    trees = s.backlog.find((it) => it.id === 'trees')!;
    expect(trees.copies!.map((c) => c.piece)).toEqual(['pine', 'blossom']);
    // and changing one leaves the others alone, including where they stand
    expect(trees.copies![0]).toEqual({ x: 100, y: 100, piece: 'pine' });
  });

  it('leaves a plant with no kind wearing the item\'s own design', () => {
    const s = addItemCopy(initialZooState(1), 'trees', at(200, 200));
    expect(s.backlog.find((it) => it.id === 'trees')!.copies![0].piece).toBeUndefined();
  });

  it('removes them one at a time, leaving the item itself alone', () => {
    let s = addItemCopy(addItemCopy(initialZooState(1), 'trees', at(100, 100)), 'trees', at(300, 100));
    s = removeItemCopy(s, 'trees', 0);
    expect(s.backlog.find((it) => it.id === 'trees')!.copies).toEqual([{ x: 300, y: 100 }]);
    // the item's own placement is not one of the copies, so it survives them all going
    s = removeItemCopy(s, 'trees', 0);
    expect(s.backlog.find((it) => it.id === 'trees')!.copies).toEqual([]);
    expect(s.backlog.some((it) => it.id === 'trees')).toBe(true);
  });
});

describe('zoo game: nothing is placed on top of anything else in a habitat', () => {
  const R = 0.11; // the room one plant takes up, as a radius in box fractions
  const overlaps = (a: { x: number; y: number; s?: number }, b: { x: number; y: number; s?: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y) < R * (a.s ?? 1) + R * (b.s ?? 1);
  // a plant may stand at the water's edge, but its centre must not be in the pool
  const inWater = (p: { x: number; y: number }, w: { x: number; y: number; w: number; h: number }) => {
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
    return Math.hypot((p.x - cx) / (w.w / 2), (p.y - cy) / (w.h / 2)) <= 1;
  };

  it('a new enclosure has no water until you add one', () => {
    const enc = { id: 'e1', name: 'Lion Enclosure', category: 'enclosure' } as BacklogItem;
    expect(enclosureWater(presetFor(enc))).toEqual([]);
    // ...but a design saved before that still shows the pool it was given
    expect(enclosureWater({ parts: { water: 'on' }, colors: {} }).length).toBe(1);
  });

  it('adds planting clear of the planting already there', () => {
    let design: ItemDesign = { parts: {}, colors: {} };
    for (const t of ['tree', 'bush', 'rocks', 'flowers', 'tree', 'bush']) design = { ...design, flora: addFloraTo(design, t) };
    const flora = enclosureFlora(design);
    expect(flora.length).toBe(6);
    for (let i = 0; i < flora.length; i++) {
      for (let j = i + 1; j < flora.length; j++) expect(overlaps(flora[i], flora[j])).toBe(false);
    }
  });

  it('does not drop a plant in the pond', () => {
    let design: ItemDesign = { parts: {}, colors: {} };
    design = { ...design, water: addWaterTo(design) };
    design = { ...design, water: addWaterTo(design) };
    for (const t of ['tree', 'rocks', 'bush']) design = { ...design, flora: addFloraTo(design, t) };
    for (const f of enclosureFlora(design)) {
      for (const w of enclosureWater(design)) expect(inWater(f, w)).toBe(false);
    }
  });

  it('puts a new pool where the planting is not, and keeps it inside the habitat', () => {
    let design: ItemDesign = { parts: {}, colors: {} };
    for (const t of ['tree', 'bush', 'rocks']) design = { ...design, flora: addFloraTo(design, t) };
    design = { ...design, water: addWaterTo(design) };
    const pool = enclosureWater(design)[0];
    expect(pool.x).toBeGreaterThanOrEqual(0);
    expect(pool.y).toBeGreaterThanOrEqual(0);
    expect(pool.x + pool.w).toBeLessThanOrEqual(1);
    expect(pool.y + pool.h).toBeLessThanOrEqual(1);
    for (const f of enclosureFlora(design)) expect(inWater(f, pool)).toBe(false);
  });
});

describe('zoo game: enclosure planting (flora added in the studio, like water)', () => {
  it('flora is added to the design and is independent of water features', () => {
    const design: ItemDesign = { parts: {}, colors: {} };
    expect(enclosureFlora(design)).toEqual([]); // none by default
    const withFlora: ItemDesign = { ...design, flora: [defaultFlora('tree', 0), defaultFlora('bush', 1)] };
    const fl = enclosureFlora(withFlora);
    expect(fl.length).toBe(2);
    expect(fl.map((f) => f.type)).toEqual(['tree', 'bush']);
    expect(fl.every((f) => f.x >= 0 && f.x <= 1 && f.y >= 0 && f.y <= 1 && f.s > 0)).toBe(true);
    expect(withFlora.water).toBeUndefined(); // planting does not touch water
  });

  it('supports every flora shape, including the signpost, as enclosure planting', () => {
    for (const t of FLORA_TYPES) {
      const f = defaultFlora(t, 0);
      expect(f.type).toBe(t);
      expect(FLORA_TYPES).toContain(f.type);
    }
    expect(FLORA_TYPES).toContain('signpost');
  });

  it('offers a scenery item the other sorts of ITS OWN KIND, never the whole catalogue', () => {
    // "Trees" is planting. Which sort is still open - a hedge, a bush - but a car park is not a
    // design decision about trees, it is a different Product Backlog item.
    expect(floraFamily('tree')).toEqual(['tree', 'bush', 'flowers', 'hedge']);
    expect(floraFamily('tree')).not.toContain('carpark');
    expect(floraFamily('river')).toEqual(['pond', 'river', 'fountain']);
    expect(floraFamily('signpost')).toContain('entrance');
    // Every sort belongs to exactly one family, so nothing can fall out of the menu entirely.
    for (const t of FLORA_TYPES) expect(floraFamily(t)).toContain(t);
  });
});

describe('zoo game: bespoke animals (base shape)', () => {
  it('a New PBI animal can start from a base species shape the studio uses', () => {
    let s = addPbi(bigCatsSplit(1), { name: 'Sabretooth', category: 'exhibit', zone: 'Big Cats', acceptance: ['Fierce'], template: 'tiger' });
    const sabre = s.backlog.find((i) => i.name === 'Sabretooth')!;
    expect(sabre.template).toBe('tiger');
    expect(presetFor(sabre).parts.markings).toBe('stripes'); // starts from the tiger silhouette
    // With no base shape it falls back to a generic creature that still builds.
    s = addPbi(s, { name: 'Blob', category: 'exhibit', zone: 'Big Cats', acceptance: ['Odd'] });
    const blob = s.backlog.find((i) => i.name === 'Blob')!;
    expect(blob.template).toBeUndefined();
    expect(presetFor(blob).parts.body).toBeDefined();
  });

  it('refining an unbuilt animal can change its base shape', () => {
    let s = addPbi(initialZooState(1), { name: 'Mystery', category: 'exhibit', zone: 'Big Cats', acceptance: ['?'] });
    const id = s.backlog.find((i) => i.name === 'Mystery')!.id;
    s = refinePbi(s, id, { name: 'Mystery', category: 'exhibit', zone: 'Big Cats', acceptance: ['?'], template: 'penguins' });
    const it = s.backlog.find((i) => i.id === id)!;
    expect(it.template).toBe('penguins');
    expect(presetFor(it).parts.head).toBe('beaked');
  });
});

describe('zoo game: save / resume (serialisation)', () => {
  it('a mid-game state survives a JSON round-trip (the jsonb save/load path)', () => {
    let s = flat(initialZooState(3));
    s = planSprint(s, ['lion', 'penguins']);
    s = setItemPos(finish(s, 'lion'), 'lion', { x: 100, y: 50 });
    const roundTripped = JSON.parse(JSON.stringify(s)) as ZooGameState;
    expect(roundTripped).toEqual(s); // nothing lost through jsonb
    // the engine keeps working on the restored state
    expect(openItem(roundTripped, 'lion').backlog.find((i) => i.id === 'lion')!.status).toBe('open');
  });

  it('resuming merges the save over a fresh state, so fields added later get defaults', () => {
    const fresh = initialZooState(1);
    // An older save that predates a field (dailyScrumAt) - omit it.
    const partial: Partial<ZooGameState> = { phase: 'sprint', sprintNumber: 4, backlog: fresh.backlog };
    const loaded: ZooGameState = { ...initialZooState(fresh.gameSeed), ...partial };
    expect(loaded.phase).toBe('sprint');
    expect(loaded.sprintNumber).toBe(4);
    expect(loaded.dailyScrumAt).toBe('start'); // absent in the save -> sensible default
  });
});

describe('zoo game: ongoing refinement consumes Sprint time', () => {
  it('refining during a Sprint spends build time; refining before it is free', () => {
    // Before the Sprint (in a fresh, non-sprint state) refinement is free.
    const planning = splitAll(initialZooState(1));
    expect(planning.refinePenalty).toBe(0);
    expect(estimateItem(planning, 'penguins', 5).refinePenalty).toBe(0);

    // During a Sprint, each refinement action eats into the day's clock.
    let s = planSprint(flat(initialZooState(1)), ['lion']);
    expect(s.phase).toBe('sprint');
    expect(s.refinePenalty).toBe(0);
    s = addPbi(s, { name: 'Meerkats', category: 'exhibit', zone: 'Savanna', acceptance: ['Recognisable'] });
    expect(s.refinePenalty).toBe(REFINE_COSTS.addPbi);
    const meer = s.backlog.find((i) => i.name === 'Meerkats')!.id;
    s = estimateItem(s, meer, 5);
    expect(s.refinePenalty).toBe(REFINE_COSTS.addPbi + REFINE_COSTS.estimate);
    // The estimate persists on the item (the UI must wire onEstimate on the board).
    const est = s.backlog.find((i) => i.id === meer)!;
    expect(est.unsized).toBe(false);
    expect(est.estimate).toBe(5);
  });

  it('refining a PBI mid-Sprint costs time, and the spend resets when the day advances', () => {
    let s = planSprint(flat(initialZooState(1)), ['lion']);
    s = addPbi(s, { name: 'Reptiles', category: 'exhibit', zone: 'Reptiles', acceptance: ['x'] });
    const before = s.refinePenalty;
    s = refinePbi(s, s.backlog.find((i) => i.name === 'Reptiles')!.id, { name: 'Reptiles', category: 'exhibit', zone: 'Reptiles', acceptance: ['scaly'] });
    expect(s.refinePenalty).toBe(before + REFINE_COSTS.refinePbi);
    // Ending the day (which advances it) clears the day's refinement spend.
    s = { ...s, dayStage: 'building' };
    s = endDay(s);
    if (s.phase === 'sprint') expect(s.refinePenalty).toBe(0);
  });
});

describe('zoo game: AI Product Owner refinement', () => {
  it('splits, adds, clarifies and re-orders by value - and never estimates (Developers do)', () => {
    let s = bigCatsSplit(1);
    const decisions: PoDecisions = {
      rationale: 'Open Waterside; add food near the cats.',
      splitEpics: [{ epicId: 'waterside', memberIds: ['penguins'] }],
      newItems: [{ name: 'Ice Cream Stand', category: 'amenity', zone: 'Big Cats', services: 'food', acceptance: ['Serves food and drink'] }],
      refine: [{ id: 'lion', acceptance: ['Unmistakably a lion', 'Two or more colours'] }],
      order: ['lion', 'kiosk'],
    };
    s = applyPoRefinements(s, decisions);

    // Split out penguins (+ its enclosure); the Waterside epic keeps the rest.
    expect(s.backlog.some((i) => i.id === 'penguins')).toBe(true);
    expect(s.backlog.some((i) => i.id === 'penguin-enc')).toBe(true);
    expect(s.backlog.find((i) => i.id === 'waterside')!.epicMembers!.some((m) => m.id === 'penguins')).toBe(false);
    // Added a facility.
    const ice = s.backlog.find((i) => i.name === 'Ice Cream Stand')!;
    expect(ice.category).toBe('amenity');
    expect(ice.services).toBe('food');
    expect(ice.unsized).toBe(true); // the PO does NOT estimate - it arrives unsized
    // Clarified acceptance.
    expect(s.backlog.find((i) => i.id === 'lion')!.acceptance).toContain('Unmistakably a lion');
    // Re-ordered by value: lion then kiosk at the front of the Backlog.
    const backlogIds = s.backlog.filter((i) => i.status === 'backlog').map((i) => i.id);
    expect(backlogIds[0]).toBe('lion');
    expect(backlogIds[1]).toBe('kiosk');
  });

  it('the PO doing refinement does NOT charge the Developers build clock', () => {
    let s = planSprint(flat(initialZooState(1)), ['lion']); // in a Sprint, penalty starts at 0
    expect(s.refinePenalty).toBe(0);
    s = applyPoRefinements(s, { newItems: [{ name: 'Meerkats', category: 'exhibit', zone: 'Savanna', acceptance: ['Recognisable'] }] });
    expect(s.backlog.some((i) => i.name === 'Meerkats')).toBe(true);
    expect(s.refinePenalty).toBe(0); // restored - the PO's work is not the Developers' time
  });
});

describe('zoo game: the Sprint Goal is the Scrum Team\'s, not the PO\'s', () => {
  it('is never set by refining the Backlog, whatever the PO says', () => {
    // Nothing set yet: asking the PO to refine leaves the field empty for Sprint Planning, where the
    // whole Scrum Team crafts the Goal from the work they select.
    let s = applyPoRefinements(initialZooState(1), { order: ['lion', 'lion-enc'] });
    expect(s.sprintGoal).toBe('');
    // ...and a Goal the team has written is theirs, untouched.
    const ours = 'Our goal is to deliver the Big Cats zone so that families have a headline exhibit';
    s = applyPoRefinements(setSprintGoal(initialZooState(1), ours), { order: ['lion'] });
    expect(s.sprintGoal).toBe(ours);
  });

  it('cannot be skipped at Planning, so the team has to draft it', () => {
    expect(isDraftedGoal('')).toBe(false);
    expect(isDraftedGoal('b')).toBe(false);          // a stub is not an objective
    expect(isDraftedGoal(suggestSprintGoal([]))).toBe(true);
  });
});

describe('zoo game: an item looks like what it is', () => {
  it('gives a tiger a cat and a pathway a route, not a fish', () => {
    expect(iconKey({ name: 'Tiger', category: 'exhibit', template: 'tiger' })).toBe('cat');
    expect(iconKey({ name: 'Pathways', category: 'path' })).toBe('path');
    expect(iconKey({ name: 'Toilets', category: 'amenity', template: 'toilets', services: 'toilet' })).toBe('toilets');
    expect(iconKey({ name: 'Tiger Enclosure', category: 'enclosure' })).toBe('fence');
    expect(iconKey({ name: 'Penguins', category: 'exhibit', template: 'penguins' })).toBe('bird');
    expect(iconKey({ name: 'Reef', category: 'exhibit', template: 'reef' })).toBe('fish'); // the fish is for the fish
  });

  it('has an icon for every piece in the toolbox, and never falls through to the generic one', () => {
    for (const group of TOOLBOX) {
      for (const t of group.items) {
        expect(iconKey({ name: t.name, category: t.category, template: t.template, services: t.services }), t.name).not.toBe('thing');
      }
    }
  });

  it('reads a hand-written PBI by its name when it has no template', () => {
    expect(iconKey({ name: 'Wolf Wood', category: 'exhibit' })).toBe('dog');
    expect(iconKey({ name: 'Second-hand book shop', category: 'amenity' })).toBe('shop');
  });
});

describe('zoo game: the seeded Backlog reads correctly', () => {
  it('gives every starting item an icon that matches what it is', () => {
    const want: Record<string, string> = {
      'Lion Enclosure': 'fence', Lion: 'cat', 'Main Pathways': 'path', 'Big Cats Paths': 'path', Trees: 'tree', Flowerbed: 'flower',
      Rockery: 'rocks', River: 'river', Bridge: 'bridge', Signposts: 'signpost', Fountain: 'fountain',
      Toilets: 'toilets', 'Gift Shop': 'shop', 'Seating Area': 'seating',
    };
    const s = initialZooState(1);
    for (const [name, key] of Object.entries(want)) {
      const it = s.backlog.find((b) => b.name === name);
      expect(it, name).toBeTruthy();
      expect(iconKey(it as BacklogItem), name).toBe(key);
    }
  });
});

describe("zoo game: the Product Owner's sign-off follows the acceptance criteria", () => {
  const path = () => {
    let s = addPbi(initialZooState(1), toolboxDraft(TOOLBOX.flatMap((g) => g.items).find((t) => t.category === 'path')!));
    const item = s.backlog.find((i) => i.category === 'path')!;
    s = estimateItem(s, item.id, 3);
    s = planSprint(s, [item.id]);
    s = setItemTasks(s, item.id, suggestTasks(item));
    return { s, id: item.id };
  };
  const signOff = (s: ZooGameState, id: string) => (s.backlog.find((x) => x.id === id)!.tasks ?? []).find((t) => isSignOffTask(t.label))!;

  it('is not ticked when the build is finished - the criteria are still open', () => {
    const { s: start, id } = path();
    let s = start;
    s = buildItem(s, id, presetFor(s.backlog.find((x) => x.id === id)!));
    for (const t of s.backlog.find((x) => x.id === id)!.tasks ?? []) s = toggleItemTask(s, id, t.id);
    // The Developers' own steps are what take it out of Doing; the sign-off is not one of them.
    expect(s.backlog.find((x) => x.id === id)!.status).toBe('done');
    expect(signOff(s, id).done).toBe(false);
    expect(signOffReady(s.backlog.find((x) => x.id === id)!)).toBe(false);
  });

  it('cannot be ticked by hand, however hard the Developers click it', () => {
    const { s: start, id } = path();
    let s = start;
    s = buildItem(s, id, presetFor(s.backlog.find((x) => x.id === id)!));
    for (const t of s.backlog.find((x) => x.id === id)!.tasks ?? []) s = toggleItemTask(s, id, t.id);
    s = toggleItemTask(s, id, signOff(s, id).id);
    expect(signOff(s, id).done).toBe(false);
  });

  it('ticks itself once the item is on the park and every criterion is confirmed', () => {
    const { s: start, id } = path();
    let s = start;
    s = buildItem(s, id, presetFor(s.backlog.find((x) => x.id === id)!));
    for (const t of s.backlog.find((x) => x.id === id)!.tasks ?? []) s = toggleItemTask(s, id, t.id);
    s = placeOnPark(s, id);
    expect(signOff(s, id).done).toBe(false); // placed, but nothing is accepted yet
    // Every criterion, not merely the one about placement: a thing that is in the right spot and
    // wrong in every other way has not been accepted by anybody.
    const acs = s.backlog.find((x) => x.id === id)!.acceptance;
    expect(acs.length).toBeGreaterThan(1);
    acs.forEach((_, i) => { if (i < acs.length - 1) s = confirmAcceptance(s, id, i, true); });
    expect(signOff(s, id).done).toBe(false); // all but one
    s = confirmAcceptance(s, id, acs.length - 1, true);
    expect(signOff(s, id).done).toBe(true);
    // ...and comes back off if a criterion is withdrawn, taking the release with it.
    const back = confirmAcceptance(s, id, 0, false);
    expect(signOff(back, id).done).toBe(false);
    expect(openItem(back, id).backlog.find((x) => x.id === id)!.status).toBe('done');
  });

  it('is what lets an item go live', () => {
    const { s: start, id } = path();
    let s = start;
    s = buildItem(s, id, presetFor(s.backlog.find((x) => x.id === id)!));
    for (const t of s.backlog.find((x) => x.id === id)!.tasks ?? []) s = toggleItemTask(s, id, t.id);
    expect(openItem(s, id).backlog.find((x) => x.id === id)!.status).toBe('done'); // no sign-off, no release
    s = accept(s, id);
    expect(openItem(s, id).backlog.find((x) => x.id === id)!.status).toBe('open');
  });
});

describe('zoo game: a suggested Sprint Goal comes off the top of the Product Backlog', () => {
  it('names what is at the top, not whatever there is most of', () => {
    // The seeded Backlog is headed by the Big Cats, with a longer tail of Grounds scenery. Reading
    // the whole list would name the Grounds; reading the top names the Big Cats.
    const s = bigCatsSplit(1);
    expect(s.backlog[0].zone).toBe('Big Cats');
    const top = goalCandidates(s);
    expect(top.length).toBeGreaterThan(0);
    expect(top[0].id).toBe(availableItems(s).find(isReady)!.id);   // starts at the top
    expect(top.every(isReady)).toBe(true);                          // and only what could be forecast
    expect(suggestSprintGoal(top)).toMatch(/Big Cats/i);
  });

  it('stops at about a Sprint of work, so the Goal is reachable', () => {
    const s = bigCatsSplit(1);
    const top = goalCandidates(s);
    const pts = top.reduce((n, i) => n + i.estimate, 0);
    const cap = zooCapacity(s.velocity);
    expect(pts).toBeGreaterThan(0);
    expect(pts).toBeLessThanOrEqual(cap + Math.max(...top.map((i) => i.estimate)));
  });

  it('still shapes the Goal around the selection once there is one', () => {
    const s = bigCatsSplit(1);
    const kiosk = s.backlog.find((i) => i.name === 'Kiosk')!;
    expect(suggestSprintGoal([kiosk])).toMatch(/kiosk/i);
  });
});

describe('zoo game: the coach says only what the screens do not', () => {
  it('has nothing to add at the Review or the Retrospective - they walk their own agenda', () => {
    const played = buildAndOpen(bigCatsSplit(1), ['lion-enc']);
    const reviewed = reviewSprint(played);
    expect(nextNudge({ ...reviewed, phase: 'review' })).toBeNull();
    expect(nextNudge({ ...reviewed, phase: 'retro' })).toBeNull();
  });

  it('still speaks about refinement, which no screen asks for by itself', () => {
    const thin = { ...bigCatsSplit(1), phase: 'planning' as const,
      backlog: bigCatsSplit(1).backlog.map((it) => (it.status === 'backlog' ? { ...it, unsized: true } : it)) };
    expect(nextNudge(thin)?.id).toBe('refine-late');
  });
});

describe('zoo game: one idea at a time', () => {
  it('leaves Sprint 1 as the plain loop', () => {
    const s = initialZooState(1);
    expect(revealed(s, 'wip')).toBe(false);
    expect(revealed(s, 'burndown')).toBe(false);
    expect(revealed(s, 'essentials')).toBe(false);
    expect(activeWipLimit(s)).toBe(0); // and an unmet rule is not enforced either
  });

  it('does not block a first-Sprint player on a limit they have never been told about', () => {
    // Three items started in Sprint 1 - the default limit would have stopped the third.
    let s = planSprint(bigCatsSplit(1), ['lion-enc', 'paths', 'trees']);
    for (const id of ['lion-enc', 'paths', 'trees']) s = startItem(s, id);
    expect(s.backlog.filter((i) => i.started).length).toBe(3);
    expect(DEFAULT_WIP_LIMIT).toBeLessThan(3 + 1); // the limit exists; it just has not been met yet
  });

  it('turns them on from Sprint 2, once there is a Sprint to compare against', () => {
    const s = { ...initialZooState(1), sprintNumber: 2 };
    expect(revealed(s, 'wip')).toBe(true);
    expect(revealed(s, 'burndown')).toBe(true);
    expect(revealed(s, 'essentials')).toBe(true);
    expect(activeWipLimit(s)).toBe(s.wipLimit);
  });

  it('turns the WIP limit on early for a player who goes looking for it', () => {
    const s = setWipLimit(initialZooState(1), 1);
    expect(revealed(s, 'wip')).toBe(true);
    expect(activeWipLimit(s)).toBe(1);
  });
});

describe('zoo game: a Product Goal can be written in other shapes - none of them Scrum', () => {
  it('keeps the plain sentence as the one text everything else reads', () => {
    const s = setGoalForm(initialZooState(1), 'okr', 'People come back for the big cats', [{ metric: 'happiness', target: 70 }]);
    expect(s.productGoal).toBe('People come back for the big cats');
    expect(s.productGoalShape).toBe('okr');
  });

  it('measures only things the park actually counts, so the Review can check them', () => {
    // A key result nobody can observe is an opinion with a number next to it, so the shape of a
    // measure is a metric the game computes plus a target - never free text.
    for (const g of GOAL_METRICS) expect(typeof g.of(initialZooState(1))).toBe('number');
    const s = setGoalForm(initialZooState(1), 'okr', 'Loved', [
      { metric: 'exhibits', target: 2 }, { metric: 'happiness', target: 70 },
    ]);
    const checks = goalMeasures(s);
    expect(checks.map((c) => c.metric)).toEqual(['exhibits', 'happiness']);
    expect(checks.every((c) => c.met)).toBe(false); // nothing built yet
  });

  it('is optional: a plain outcome carries no measures at all', () => {
    const s = setGoalForm(initialZooState(1), 'outcome', 'Open a zoo people love', []);
    expect(goalMeasures(s)).toEqual([]);
  });
});

describe('zoo game: the Product Backlog is written, not handed over', () => {
  const blank = { ...initialZooState(1), backlog: [] };

  it('writes only the areas the Scrum Team asked for', () => {
    const s = writeBacklog(blank, { zones: ['Big Cats', 'Forest'], audience: 'families', firstZone: 'Big Cats' });
    expect(s.backlog.some((i) => i.id === 'forest')).toBe(true);
    expect(s.backlog.some((i) => i.id === 'savanna')).toBe(false);
    expect(s.backlog.some((i) => i.id === 'waterside')).toBe(false);
    expect(s.phase).toBe('refine');
  });

  it('gives every area its OWN paths and planting, so opening one is a whole slice of zoo', () => {
    const s = writeBacklog(blank, { zones: ['Big Cats', 'Forest'], audience: 'families', firstZone: 'Big Cats' });
    // The area you open first arrives refined: habitat, animal, and the ground around them.
    expect(s.backlog.find((i) => i.id === 'bigcats-paths')?.category).toBe('path');
    expect(s.backlog.find((i) => i.id === 'bigcats-planting')?.zone).toBe('Big Cats');
    // The others carry theirs inside the epic, so refining an area yields them.
    const forest = s.backlog.find((i) => i.id === 'forest');
    expect(forest?.epicMembers?.map((m) => m.id)).toContain('forest-paths');
    expect(forest?.epicMembers?.map((m) => m.id)).toContain('forest-planting');
  });

  it('opens whichever area the Scrum Team chose, not always the same one', () => {
    const s = writeBacklog(blank, { zones: ['Big Cats', 'Savanna'], audience: 'enthusiasts', firstZone: 'Savanna' });
    expect(s.backlog.find((i) => i.id === 'giraffe')?.unsized).toBeFalsy();
    expect(s.backlog.find((i) => i.id === 'savanna-paths')?.category).toBe('path');
    // Big Cats is now the epic, and it carries its own scenery.
    expect(s.backlog.find((i) => i.id === 'bigcats')?.category).toBe('epic');
    expect(s.backlog.find((i) => i.id === 'bigcats')?.epicMembers?.map((m) => m.id)).toContain('bigcats-paths');
  });

  it('orders it by what the chosen visitors value, which is the Product Owner\'s job', () => {
    const forFamilies = writeBacklog(blank, { zones: ['Savanna'], audience: 'families', firstZone: 'Savanna' });
    const withAppeal = forFamilies.backlog.filter((i) => i.appeal);
    const scores = withAppeal.map((i) => i.appeal!.families);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe('zoo game: refinement can be planned into the Sprint (topic three)', () => {
  it('goes into the Sprint as sized work, not as a flag', () => {
    const plain = planSprint(bigCatsSplit(1), ['lion-enc']);
    const withRefine = planSprint(bigCatsSplit(1), ['lion-enc'], 2);
    expect(plain.sprintRefinement).toBeUndefined();
    expect(withRefine.sprintRefinement).toEqual({ points: 2, done: false });
    // Planning it costs nothing on its own - it is work you still have to do.
    expect(withRefine.refinePenalty).toBe(0);
  });

  it('costs the day it is actually held on, in proportion to what was set aside', () => {
    const withRefine = planSprint(bigCatsSplit(1), ['lion-enc'], 2);
    const held = holdPlannedRefinement(withRefine);
    expect(held.sprintRefinement).toEqual({ points: 2, done: true });
    expect(held.refinePenalty).toBe(PLANNED_REFINE_SECONDS * 2);
    // Holding it twice does not charge twice.
    expect(holdPlannedRefinement(held).refinePenalty).toBe(PLANNED_REFINE_SECONDS * 2);
  });

  it('does not follow you into the next day, or the next Sprint', () => {
    const held = holdPlannedRefinement(planSprint(bigCatsSplit(1), ['lion-enc'], 2));
    expect(startDay(endDay(held)).refinePenalty).toBe(0);
    const s = startNextSprint(reviewSprint(held), 'Finish fewer things properly, rather than starting more');
    expect(planSprint({ ...s, phase: 'planning' }, []).sprintRefinement).toBeUndefined();
  });
});

describe('zoo game: the Retrospective asks about people', () => {
  it('always offers a question about how the team worked together', () => {
    const reviewed = reviewSprint(buildAndOpen(bigCatsSplit(1), ['lion-enc']));
    expect(retroQuestions(reviewed).some((q) => /together|help/i.test(q))).toBe(true);
  });
});

describe('zoo game: the teaching copy is editable without a deploy', () => {
  it('offers every card, the one-pager, the coach and the Retro questions', () => {
    const entries = copyEntries();
    const groups = new Set(entries.map((e) => e.group));
    expect(groups).toContain('Teaching cards');
    expect(groups).toContain('Scrum on one page');
    expect(groups).toContain('The coach');
    expect(groups).toContain('Retrospective questions');
    expect(entries.length).toBeGreaterThan(120);
    expect(entries.every((e) => e.value.trim().length > 0)).toBe(true);
  });

  it('keys are unique and stable, so overrides cannot collide or orphan', () => {
    const keys = copyEntries().map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('card.sprint-planning.why');
    expect(keys).toContain('nudge.deploy-it');
  });

  it('an override replaces the shipped wording, and an unknown key is ignored', () => {
    const before = cardFor('sprint-review')!.why;
    applyCopyOverrides({ 'card.sprint-review.why': 'Because the visitors will tell you the truth.', 'card.nonsense.why': 'x' });
    expect(cardFor('sprint-review')!.why).toBe('Because the visitors will tell you the truth.');
    applyCopyOverrides({ 'card.sprint-review.why': before }); // put it back for the other tests
    expect(cardFor('sprint-review')!.why).toBe(before);
  });

  it('scopes copy to the screen it appears on, so the in-game editor can be contextual', () => {
    const entries = copyEntries();
    expect(entries.filter((e) => e.phases.includes('retro')).length).toBeGreaterThan(0);
    expect(entries.filter((e) => e.phases.includes('planning')).length).toBeGreaterThan(0);
    // Artifacts sit in the header on every screen, so they belong to no single phase.
    expect(entries.some((e) => e.key.startsWith('artifact.') && e.phases.length === 0)).toBe(true);
  });
});

describe('zoo game: topic three decides what shape a thing takes', () => {
  it('sets the habitat footprint, and it is the Developers’ to change later', () => {
    let s = planSprint(bigCatsSplit(1), ['lion-enc']);
    s = planItemShape(s, 'lion-enc', { enclosureSize: 'large' });
    expect(s.backlog.find((i) => i.id === 'lion-enc')!.enclosureSize).toBe('large');
    // Changed again mid-Sprint: nothing decided at Planning is settled.
    s = setEnclosureSize(s, 'lion-enc', 'small');
    expect(s.backlog.find((i) => i.id === 'lion-enc')!.enclosureSize).toBe('small');
  });

  it('assigning an animal to a habitat is what creates the build order', () => {
    let s = planSprint(bigCatsSplit(1), ['lion', 'lion-enc']);
    s = planItemShape(s, 'lion', { enclosureId: 'lion-enc' });
    const lion = s.backlog.find((i) => i.id === 'lion')!;
    expect(lion.enclosureId).toBe('lion-enc');
    expect(enclosureReady(s, lion)).toBe(false);      // the habitat is not built, so the animal waits
    expect(startItem(s, 'lion').backlog.find((i) => i.id === 'lion')!.started).toBeFalsy();
  });

  it('chooses the kind of building or planting, and can unset an assignment', () => {
    let s = planSprint(bigCatsSplit(1), ['kiosk']);
    s = planItemShape(s, 'kiosk', { template: 'cafe' });
    expect(s.backlog.find((i) => i.id === 'kiosk')!.template).toBe('cafe');
    s = planItemShape(s, 'kiosk', { enclosureId: '' });
    expect(s.backlog.find((i) => i.id === 'kiosk')!.enclosureId).toBeUndefined();
  });
});

describe('zoo game: the first forecast is an estimate, and it scales with the Sprint length', () => {
  it('scales the starting guess by how long the Sprint is', () => {
    expect(estimatedVelocity(SPRINT_DAYS)).toBe(STARTER_CAPACITY);
    expect(estimatedVelocity(2)).toBeLessThan(STARTER_CAPACITY);
    expect(estimatedVelocity(5)).toBeGreaterThan(STARTER_CAPACITY);
    // A 2-day and a 5-day Sprint must not open with the same number.
    expect(estimatedVelocity(2)).not.toBe(estimatedVelocity(5));
  });

  it('says it is an estimate until a Sprint of this length has been measured', () => {
    const fresh = sprintCapacity(initialZooState(1));
    expect(fresh.estimated).toBe(true);
    expect(fresh.measuredSprints).toBe(0);
    const measured = sprintCapacity({ ...initialZooState(1), velocity: [18], velocityDays: [SPRINT_DAYS] });
    expect(measured.estimated).toBe(false);
    expect(measured.points).toBe(18);
  });

  it('stops counting Sprints run at a different length', () => {
    // Three Sprints measured at 3 days, then the team moves to 5.
    const s: ZooGameState = { ...initialZooState(1), velocity: [20, 22, 24], velocityDays: [3, 3, 3], sprintDays: 5 };
    const cap = sprintCapacity(s);
    expect(cap.estimated).toBe(true);          // nothing measured at 5 days yet
    expect(cap.discarded).toBe(3);
    expect(cap.points).toBe(estimatedVelocity(5)); // back to an estimate, scaled to the new length
    // ...and one Sprint at the new length is enough to be measuring again.
    const after = sprintCapacity({ ...s, velocity: [20, 22, 24, 33], velocityDays: [3, 3, 3, 5] });
    expect(after.estimated).toBe(false);
    expect(after.points).toBe(33);
    expect(after.discarded).toBe(3);
  });

  it('records the Sprint length alongside each measured velocity', () => {
    const reviewed = reviewSprint(buildAndOpen(bigCatsSplit(1), ['lion-enc']));
    expect(reviewed.velocityDays).toEqual([reviewed.sprintDays]);
  });
});

describe('zoo game: starting an item by dropping it on the park', () => {
  it('starts it and gives it the plot it landed on', () => {
    const s = startItemAt(planSprint(bigCatsSplit(1), ['lion-enc']), 'lion-enc', { x: 300, y: 200 });
    const it = s.backlog.find((i) => i.id === 'lion-enc')!;
    expect(it.started).toBe(true);
    expect(it.status).toBe('committed');   // started, not Done - it is a construction site
    expect(it.pos).toEqual({ x: 300, y: 200 });
  });

  it('refuses when the item may not start, and places nothing', () => {
    // An animal whose habitat is not built cannot start, so dropping it changes nothing at all.
    let s = planSprint(bigCatsSplit(1), ['lion', 'lion-enc']);
    s = planItemShape(s, 'lion', { enclosureId: 'lion-enc' });
    const after = startItemAt(s, 'lion', { x: 100, y: 100 });
    expect(after).toBe(s);
    expect(after.backlog.find((i) => i.id === 'lion')!.pos).toBeUndefined();
  });

  it('holds the WIP limit, once the limit has been met', () => {
    let s = { ...withEnclosuresBuilt(flat(bigCatsSplit(1)), 'lion-enc', 'tiger-enc', 'leopard-enc', 'penguin-enc'), sprintNumber: 2 };
    s = planSprint(s, ['lion', 'tiger', 'leopard', 'penguins']);
    for (const id of ['lion', 'tiger', 'leopard']) s = startItemAt(s, id, { x: 200, y: 200 });
    const blocked = startItemAt(s, 'penguins', { x: 400, y: 300 });
    expect(blocked).toBe(s);
  });
});

describe('zoo game: what kind of thing a Backlog item is', () => {
  it('files scenery by what it actually is, not all as planting', () => {
    // `flora` had become a bin for everything that was not an animal, a habitat, a building or a
    // path, so a bridge went about the park labelled "Planting".
    const of = (template: string) => itemKind({ category: 'flora', template } as never);
    expect(of('tree')).toBe('flora');
    expect(of('hedge')).toBe('flora');
    expect(of('river')).toBe('landscape');
    expect(of('rocks')).toBe('landscape');
    expect(of('bridge')).toBe('infrastructure');
    expect(of('signpost')).toBe('infrastructure');
    expect(of('carpark')).toBe('infrastructure');
  });

  it('takes the kind from the type the player CHOSE, not the one it started as', () => {
    // Turn a Trees item into a hedge and it is still planting; the label follows the thing.
    const asBuilt = { category: 'flora', template: 'tree', design: { parts: { type: 'hedge' }, colors: {} } };
    expect(itemKind(asBuilt as never)).toBe('flora');
  });

  it('maps the other categories straight through, and names all six for the player', () => {
    expect(itemKind({ category: 'enclosure' } as never)).toBe('habitat');
    expect(itemKind({ category: 'exhibit' } as never)).toBe('fauna');
    expect(itemKind({ category: 'amenity' } as never)).toBe('facility');
    expect(itemKind({ category: 'path' } as never)).toBe('infrastructure');
    for (const k of ['habitat', 'fauna', 'flora', 'landscape', 'facility', 'infrastructure'] as const) {
      expect(KIND_LABEL[k], `${k} needs a name`).toBeTruthy();
    }
  });

  it('groups the toolbox by kind, so what you pick from matches what you get', () => {
    const named = (g: string) => TOOLBOX.find((x) => x.group === g)!;
    for (const [group, kind] of [['Flora', 'flora'], ['Landscape', 'landscape'], ['Infrastructure', 'infrastructure']] as const) {
      expect(named(group), `${group} exists`).toBeTruthy();
      for (const t of named(group).items) {
        expect(itemKind(t as never), `${t.name} belongs in ${group}`).toBe(kind);
      }
    }
  });
});

describe('zoo game: every acceptance criterion is a question', () => {
  // A statement can be waved through; a question has to be answered. It is also what caught "Fits
  // the planting" - the planting fits the planting - which had passed for a year as a statement and
  // will not even write as a question.
  const everyCriterion = () => {
    const all: { where: string; label: string }[] = [];
    for (const t of TOOLBOX.flatMap((g) => g.items)) {
      for (const label of toolboxDraft(t).acceptance) all.push({ where: t.name, label });
    }
    for (const it of initialZooState(1).backlog) {
      for (const label of it.acceptance ?? []) all.push({ where: it.name, label });
      // An epic's members carry no criteria of their own until they are split out into real PBIs.
    }
    return all;
  };

  it('asks, rather than asserts', () => {
    const all = everyCriterion();
    expect(all.length).toBeGreaterThan(30);
    for (const { where, label } of all) {
      expect(label.startsWith('Can '), `${where}: "${label}" should ask something`).toBe(true);
      expect(label.endsWith('?'), `${where}: "${label}" should end in a question mark`).toBe(true);
    }
  });

  it('still knows which one can only be answered on the park', () => {
    // The old rule sniffed the wording for "placed" or "sized", which stopped matching the moment
    // the criteria became questions. Every item still has exactly one placement criterion.
    for (const t of TOOLBOX.flatMap((g) => g.items)) {
      const acs = toolboxDraft(t).acceptance;
      expect(acs.filter(isDeployAcceptance).length, `${t.name} has one placement criterion`).toBe(1);
    }
  });

  it('keeps reading a zoo saved before the rewrite', () => {
    expect(isDeployAcceptance('Placed in its zone with room around it')).toBe(true);
    expect(isDeployAcceptance('Sized to fit the space')).toBe(true);
  });
});

describe('zoo game: a zone is a slice of cake, not a layer', () => {
  const open = (st: ZooGameState, ...ids: string[]): ZooGameState =>
    ({ ...st, backlog: st.backlog.map((it) => (ids.includes(it.id) ? { ...it, status: 'open' as const } : it)) });

  it('counts only the zones with an animal in them - the Grounds are the plate, not the cake', () => {
    const zones = zoneSlices(initialZooState(1)).map((z) => z.zone);
    expect(zones).toContain('Big Cats');
    expect(zones).not.toContain('Grounds');
    expect(zones).not.toContain('Facilities');
  });

  it('does not open a zone for a habitat and an animal with no way to walk in', () => {
    const s = open(initialZooState(1), 'lion-enc', 'lion');
    const bigCats = zoneSlices(s).find((z) => z.zone === 'Big Cats')!;
    expect(bigCats.delivered).toBe(2);           // real work, delivered
    expect(bigCats.open).toBe(false);            // and nobody can get to it
    expect(bigCats.missing).toEqual(['a path to walk in on']);
  });

  it('does not open a zone for a path with nothing at the end of it', () => {
    const s = open(initialZooState(1), 'bigcats-paths');
    const bigCats = zoneSlices(s).find((z) => z.zone === 'Big Cats')!;
    expect(bigCats.open).toBe(false);
    expect(bigCats.missing).toEqual(['an animal to see']);
  });

  it('opens the zone once there is something to see and a way to reach it', () => {
    const s = open(initialZooState(1), 'lion-enc', 'lion', 'bigcats-paths');
    expect(zoneSlices(s).find((z) => z.zone === 'Big Cats')!.open).toBe(true);
  });

  it('the park-wide spine opens no zone at all, which is what makes it a layer', () => {
    // Deliver the Main Pathways, the river, the bridge and the signposts - the whole of the park's
    // fabric - and not one zone is any nearer being visited.
    const s = open(initialZooState(1), 'paths', 'river', 'bridge', 'signposts');
    expect(zoneSlices(s).every((z) => !z.open)).toBe(true);
  });

  it('reports which zones a Sprint opened, so the Review can say what was really delivered', () => {
    const before = open(initialZooState(1), 'lion-enc', 'lion');
    const after = open(before, 'bigcats-paths');
    expect(zonesOpenedSince(before, after)).toEqual(['Big Cats']);
    expect(zonesOpenedSince(after, after)).toEqual([]);
  });
});

describe('zoo game: paths and grass are a park, not a zoo', () => {
  const open = (st: ZooGameState, ...ids: string[]): ZooGameState =>
    ({ ...st, backlog: st.backlog.map((it) => (ids.includes(it.id) ? { ...it, status: 'open' as const } : it)) });

  it('keeps the gates shut until an animal is there to be walked to', () => {
    const bare = initialZooState(1);
    expect(zooIsOpen(bare)).toBe(false);
    // Every bit of the park's fabric, delivered. Still not a zoo.
    expect(zooIsOpen(open(bare, 'paths', 'river', 'bridge', 'signposts', 'trees', 'flowerbed'))).toBe(false);
    // An animal nobody can walk to is not one either.
    expect(zooIsOpen(open(bare, 'lion-enc', 'lion'))).toBe(false);
    expect(zooIsOpen(open(bare, 'lion-enc', 'lion', 'bigcats-paths'))).toBe(true);
  });

  it('lets people turn up and be disappointed, rather than turning them away', () => {
    // The more useful failure by a distance. A lockout tells you what you may not do; a coachload
    // walking round a park with no animal in it and going home unhappy is the feedback the Review
    // exists to inspect - and word of mouth carries it into next Sprint, which is the part that bites.
    const before = { ...initialZooState(1), phase: 'sprint' } as ZooGameState;
    const arrived = Object.values(before.attendance).reduce((a, b) => a + b, 0);
    expect(arrived).toBeGreaterThan(0);
    const after = reviewSprint(before);
    expect(after.lastReview!.totalAttendance).toBe(arrived);   // they came
    expect(after.happiness![after.happiness!.length - 1]).toBe(0); // and there was nothing to see
    // Word of mouth: fewer of them next time.
    expect(Object.values(after.attendance).reduce((a, b) => a + b, 0)).toBeLessThan(arrived);
  });

  it('opens to the public the moment one zone is a whole slice', () => {
    const s = open({ ...initialZooState(1), phase: 'sprint' } as ZooGameState, 'lion-enc', 'lion', 'bigcats-paths');
    const after = reviewSprint(s);
    expect(after.lastReview!.totalAttendance).toBeGreaterThan(0);
  });
});

describe('zoo game: scenery is picked as a finished piece', () => {
  const gridOf = (piece: { type: string; key: string; colors: Record<string, string> }) =>
    renderDesign({ category: 'flora', template: piece.type } as never, { parts: { type: piece.type, piece: piece.key }, colors: piece.colors })
      .map((row) => row.map((c) => c ?? '.').join('')).join('|');

  it('offers the pieces of its own kind, with their colours already right', () => {
    const planting = piecesFor('tree').map((p) => p.label);
    expect(planting).toContain('Oak');
    expect(planting).toContain('Pine');
    expect(planting).not.toContain('Pond');
    expect(piecesFor('river').map((p) => p.label)).toEqual(['Pond', 'Stream', 'Fountain']);
    // Every piece arrives dressed - that is what makes it a piece rather than a shape to paint.
    for (const p of FLORA_PIECES) expect(Object.keys(p.colors).length, `${p.label} has colours`).toBeGreaterThan(0);
  });

  it('picking one sets what it is and how it looks in a single go', () => {
    const pine = FLORA_PIECES.find((p) => p.key === 'pine')!;
    const next = applyPiece({ parts: { type: 'tree' }, colors: { foliage: '#ff0000' } }, pine);
    expect(next.parts.type).toBe('tree');       // still a tree, so the park still treats it as one
    expect(next.parts.piece).toBe('pine');
    expect(next.colors.foliage).toBe(pine.colors.foliage);  // and the red is gone
  });

  it('draws each tree as a different tree, which is the whole point', () => {
    const trees = FLORA_PIECES.filter((p) => p.type === 'tree');
    expect(trees.length).toBeGreaterThanOrEqual(4);
    const drawn = trees.map(gridOf);
    expect(new Set(drawn).size, 'every tree looks different').toBe(trees.length);
    for (const [i, g] of drawn.entries()) expect(g.includes('#'), `${trees[i].label} renders something`).toBe(true);
  });

  it('keeps tailoring available, one level down', () => {
    // Choosing a piece is the decision; the colour wells are still there for an autumn oak.
    const oak = FLORA_PIECES.find((p) => p.key === 'oak')!;
    const autumn = { ...applyPiece({ parts: {}, colors: {} }, oak), colors: { foliage: '#c2662d', trunk: '#7a5228' } };
    expect(gridOf({ type: 'tree', key: 'oak', colors: autumn.colors })).not.toBe(gridOf(oak));
  });
});

describe('zoo game: an exhibit is stocked, not built', () => {
  const lionIn = (size: 'small' | 'medium' | 'large'): BacklogItem =>
    ({ id: 'l', name: 'Lion', category: 'exhibit', zone: 'Big Cats', acceptance: [], status: 'backlog', sprintNumber: null, accessible: true, estimate: 5, enclosureSize: size });

  it('lets a zoo choose males and females, not just "adults"', () => {
    // A pride is one male and several females, and that is WHY it is a pride. The model only knew
    // "adults", so the choice could not be made at all - and the drawings cannot show it yet, which
    // is a missing lioness rather than a missing decision.
    const pride = groupMembers({ males: 1, females: 3, juveniles: 0, cubs: 2 });
    expect(pride).toHaveLength(6);
    expect(pride.filter((m) => m.kind === 'females')).toHaveLength(3);
    // A lioness is a little smaller than a lion, and a cub much smaller - the difference the
    // drawings can carry today.
    expect(KIND_SCALE.females).toBeLessThan(KIND_SCALE.males);
    expect(KIND_SCALE.cubs).toBeLessThan(KIND_SCALE.females);
    // ...and she takes a little less room, so the trade-off moves with the choice
    expect(roomNeeded({ males: 0, females: 2, juveniles: 0, cubs: 0 }))
      .toBeLessThan(roomNeeded({ males: 2, females: 0, juveniles: 0, cubs: 0 }));
  });

  it('reads a zoo saved before males and females existed', () => {
    // Somebody's game was saved with `adults`. Losing their pride over a field name would be a poor
    // trade, so an old group is read as that many males and no females.
    const old = { adults: 3, juveniles: 1, cubs: 2 } as unknown as AnimalGroup;
    expect(groupMembers(old)).toHaveLength(6);
    expect(groupMembers(old).filter((m) => m.kind === 'males')).toHaveLength(3);
    expect(groupSize(old)).toBe(6);
    expect(roomNeeded(old)).toBeGreaterThan(0);
  });

  it('draws every animal in the group, the young ones smaller', () => {
    const family = groupMembers({ males: 2, females: 0, juveniles: 1, cubs: 2 });
    expect(family).toHaveLength(5);
    expect(family.filter((m) => m.kind === 'cubs')).toHaveLength(2);
    // Ages are worth choosing because they are not the same animal at a different number.
    expect(KIND_SCALE.cubs).toBeLessThan(KIND_SCALE.juveniles);
    expect(KIND_SCALE.juveniles).toBeLessThan(KIND_SCALE.males);
    // Nothing chosen yet still shows one animal rather than an empty habitat.
    expect(groupMembers(undefined)).toHaveLength(1);
  });

  it('measures the group against the habitat somebody else built', () => {
    const family = { males: 2, females: 0, juveniles: 1, cubs: 2 };
    expect(hasRoomToRoam(family, 'large')).toBe(true);
    expect(hasRoomToRoam(family, 'small')).toBe(false);
    // A cub takes less room than an adult, which is the whole reason ages are a decision.
    expect(roomNeeded({ males: 3, females: 0, juveniles: 0, cubs: 0 })).toBeGreaterThan(roomNeeded({ males: 1, females: 0, juveniles: 0, cubs: 3 }));
  });

  it('will not call an exhibit built until it has been stocked AND housed', () => {
    const crowded = { parts: {}, colors: {}, group: { males: 4, females: 0, juveniles: 2, cubs: 2 } };
    expect(isDesignDone(lionIn('small'), crowded)).toBe(false);   // eight lions in a small habitat
    expect(isDesignDone(lionIn('medium'), crowded)).toBe(false);  // and too many for a medium one
    expect(isDesignDone(lionIn('large'), crowded)).toBe(true);    // the biggest habitat can take a pride
    expect(isDesignDone(lionIn('large'), { parts: {}, colors: {}, group: { males: 8, females: 0, juveniles: 0, cubs: 0 } })).toBe(false);
    expect(isDesignDone(lionIn('large'), { parts: {}, colors: {}, group: { males: 2, females: 0, juveniles: 1, cubs: 2 } })).toBe(true);
    // Undecided is not the same as fits - it would otherwise pass on the default of one animal.
    expect(isDesignDone(lionIn('large'), { parts: {}, colors: {} })).toBe(false);
  });

  it('every criterion an exhibit has can be failed', () => {
    const acs = exhibitAcceptance('Lion');
    expect(acs).toHaveLength(4);
    // The two that used to be free: the template made it recognisable, colouring it made it finished.
    expect(acs.some((a) => /group rather than one animal/.test(a))).toBe(true);
    expect(acs.some((a) => /room to spare/.test(a))).toBe(true);
    expect(acs.every((a) => a.startsWith('Can ') && a.endsWith('?'))).toBe(true);
  });

  it('makes a group worth more than a specimen, and a rare coat worth more again', () => {
    const lion = { ...lionIn('large'), appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 } } as BacklogItem;
    const at = (d: ItemDesign) => appealFromDesign(lion, d)!.families;
    const one = at({ parts: {}, colors: { body: '#c8873b' }, group: { males: 1, females: 0, juveniles: 0, cubs: 0 } });
    const family = at({ parts: {}, colors: { body: '#c8873b' }, group: { males: 2, females: 0, juveniles: 1, cubs: 2 } });
    expect(family).toBeGreaterThan(one);
    // A rare coat is what the enthusiasts come for; the families come for a lively group.
    const keen = (d: ItemDesign) => appealFromDesign(lion, d)!.enthusiasts;
    const plain = { parts: {}, colors: { body: '#c8873b' }, group: { males: 1, females: 0, juveniles: 0, cubs: 0 } };
    expect(keen({ ...plain, parts: { coat: 'pale' } })).toBeGreaterThan(keen(plain));
  });

  it('plans the work as stocking rather than as pixel art', () => {
    const tasks = suggestTasks(initialZooState(1).backlog.find((i) => i.id === 'lion')!).map((t) => t.label);
    expect(tasks).toContain('Decide how many, and of what ages');
    expect(tasks.some((t) => /sketch|markings/i.test(t))).toBe(false);
  });
});

describe('zoo game: the park answers the criteria it can answer', () => {
  const lion = (s: ZooGameState) => s.backlog.find((i) => i.id === 'lion')!;
  const stock = (s: ZooGameState, group: AnimalGroup): ZooGameState =>
    applyParkChecks({ ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, draftDesign: { parts: {}, colors: {}, group } } : it)) });

  it('leaves judgement alone and takes the measurements', () => {
    const s = initialZooState(1);
    // Yours: nobody can measure whether it looks like a lion.
    expect(checkCriterion(s, lion(s), 'Can I tell they are a lion without reading the sign?')).toBeNull();
    // The park's: it can count them.
    expect(checkCriterion(s, lion(s), 'Can I see a group rather than one animal on its own?')).not.toBeNull();
  });

  it('counts the animals and says what it counted', () => {
    const one = checkCriterion(stock(initialZooState(1), { males: 1, females: 0, juveniles: 0, cubs: 0 }), lion(initialZooState(1)), 'Can I see a group rather than one animal on its own?');
    expect(one).toEqual({ met: false, evidence: 'one on its own' });
    const s = stock(initialZooState(1), { males: 2, females: 0, juveniles: 1, cubs: 2 });
    expect(checkCriterion(s, lion(s), 'Can I see a group rather than one animal on its own?')).toEqual({ met: true, evidence: '5 of them' });
  });

  it('ticks them for you, and unticks them when the fact changes', () => {
    const family = stock(initialZooState(1), { males: 2, females: 0, juveniles: 1, cubs: 2 });
    const groupCriterion = lion(family).acceptance.indexOf('Can I see a group rather than one animal on its own?');
    expect(lion(family).acConfirmed?.[groupCriterion]).toBe(true);
    // Take four of them away again and the criterion goes with them - a fact you ticked yesterday
    // can stop being true today, which is the whole reason the park keeps its own answer.
    const alone = stock(family, { males: 1, females: 0, juveniles: 0, cubs: 0 });
    expect(lion(alone).acConfirmed?.[groupCriterion]).toBe(false);
  });

  it('will not let you tick a measurement by hand', () => {
    const family = stock(initialZooState(1), { males: 1, females: 0, juveniles: 0, cubs: 0 });
    const i = lion(family).acceptance.indexOf('Can I see a group rather than one animal on its own?');
    // confirmAcceptance goes through the reducer, which lays the park's answer back over the top.
    const lied = applyParkChecks(confirmAcceptance(family, 'lion', i, true));
    expect(lion(lied).acConfirmed?.[i]).toBe(false);
  });

  it('answers whether a path reaches the zone, and names the thing it reaches', () => {
    const s = initialZooState(1);
    const paths = s.backlog.find((i) => i.id === 'bigcats-paths')!;
    const none = checkCriterion(s, paths, 'Can I get to this zone without crossing the grass?');
    // A "no" the player cannot overrule has to say what would make it a yes.
    expect(none!.met).toBe(false);
    expect(none!.evidence).toMatch(/^draw a run up to the /);
    const linked: ZooGameState = { ...s, connectors: [{ id: 'c1', a: { featureId: 'lion-enc', x: 0, y: 0 }, b: { x: 40, y: 40 }, bends: [], thickness: 9, color: '#c9a86a' }] };
    expect(checkCriterion(linked, paths, 'Can I get to this zone without crossing the grass?'))
      .toEqual({ met: true, evidence: 'a path runs to the Lion Enclosure' });

    // And a run that finishes on the grass BESIDE the habitat counts too. It plainly reaches it,
    // and this criterion is one the park answers - so being wrong about it left the card stuck with
    // no way to say otherwise.
    const placed: ZooGameState = {
      ...s,
      backlog: s.backlog.map((it) => (it.id === 'lion-enc' ? { ...it, pos: { x: 300, y: 300 } } : it)),
      connectors: [{ id: 'c2', a: { x: 300, y: 380 }, b: { x: 300, y: 640 }, bends: [], thickness: 9, color: '#c9a86a' }],
    };
    expect(checkCriterion(placed, paths, 'Can I get to this zone without crossing the grass?'))
      .toEqual({ met: true, evidence: 'a path runs to the Lion Enclosure' });

    // Far away is still far away.
    const away: ZooGameState = { ...placed, connectors: [{ id: 'c3', a: { x: 700, y: 60 }, b: { x: 760, y: 90 }, bends: [], thickness: 9, color: '#c9a86a' }] };
    expect(checkCriterion(away, paths, 'Can I get to this zone without crossing the grass?')!.met).toBe(false);
  });
});

describe('zoo game: a thing you have built stays where you built it', () => {
  it('does not make a finished habitat disappear off the park', () => {
    // Ticking the last task of a plan promotes an item to Done on the spot. That route never goes
    // near placeOnPark, and the park used to refuse to draw a Done item without the `placed` flag -
    // so a habitat vanished the moment it was finished and came back only when a button unrelated
    // to it was pressed.
    let s = planSprint(bigCatsSplit(1), ['leopard-enc']);
    s = buildItem(s, 'leopard-enc', FULL_DESIGN);
    for (const t of s.backlog.find((x) => x.id === 'leopard-enc')!.tasks ?? []) {
      if (!t.done) s = toggleItemTask(s, 'leopard-enc', t.id);
    }
    const built = s.backlog.find((x) => x.id === 'leopard-enc')!;
    expect(built.status).toBe('done');
    expect(built.placed).toBeFalsy();      // nothing on this path ever set it
    expect(standsOnPark(built)).toBe(true); // and it is still standing there
  });

  it('shows everything that has been delivered, placed or not', () => {
    const at = (status: BacklogItem['status'], extra: Partial<BacklogItem> = {}) =>
      standsOnPark({ id: 'x', name: 'X', category: 'enclosure', zone: 'Z', acceptance: [], sprintNumber: null, accessible: true, estimate: 3, status, ...extra });
    expect(at('done')).toBe(true);
    expect(at('open')).toBe(true);
    expect(at('committed')).toBe(false);   // still a construction site, drawn as one
    expect(at('backlog')).toBe(false);
    // An improvement re-delivers the thing it improves; it is not a second thing in the park.
    expect(at('open', { enhancesId: 'other' })).toBe(false);
  });
});

describe('zoo game: laying out a full zoo', () => {
  // A real park's worth of boxes: habitats, animals' plots, buildings and scenery.
  const zooBoxes = (n: number) => Array.from({ length: n }, (_, i) => ({
    id: `f${i}`, w: i % 3 === 0 ? 172 : i % 3 === 1 ? 132 : 64, h: i % 3 === 0 ? 114 : i % 3 === 1 ? 90 : 60,
  }));
  const buried = (boxes: { id: string; w: number; h: number }[]) => {
    const pos = autoLayout(boxes);
    let count = 0;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j], pa = pos.get(a.id)!, pc = pos.get(c.id)!;
      const ox = Math.max(0, Math.min(pa.x + a.w / 2, pc.x + c.w / 2) - Math.max(pa.x - a.w / 2, pc.x - c.w / 2));
      const oy = Math.max(0, Math.min(pa.y + a.h / 2, pc.y + c.h / 2) - Math.max(pa.y - a.h / 2, pc.y - c.h / 2));
      if ((ox * oy) / Math.min(a.w * a.h, c.w * c.h) > 0.5) count++;
    }
    return count;
  };

  it('never buries one thing under another, however full the zoo gets', () => {
    // The bug this is here for: rows used to be clamped one at a time as they were laid, so every
    // row past the bottom of the park landed on the SAME line - a habitat you had just delivered
    // drawn underneath one you delivered earlier, and no way to tell it was there.
    for (const n of [4, 8, 12, 18, 24, 30]) {
      expect(buried(zooBoxes(n)), `${n} things in the park`).toBe(0);
    }
  });

  it('keeps everything inside the park', () => {
    const boxes = zooBoxes(24);
    const pos = autoLayout(boxes);
    for (const b of boxes) {
      const p = pos.get(b.id)!;
      expect(p.x - b.w / 2, `${b.id} off the left`).toBeGreaterThanOrEqual(0);
      expect(p.x + b.w / 2, `${b.id} off the right`).toBeLessThanOrEqual(CANVAS_W);
      expect(p.y - b.h / 2, `${b.id} off the top`).toBeGreaterThanOrEqual(0);
      expect(p.y + b.h / 2, `${b.id} off the bottom`).toBeLessThanOrEqual(PLAY_H);
    }
  });

  it('spreads a small zoo out, and tightens a big one', () => {
    const few = autoLayout(zooBoxes(6));
    const many = autoLayout(zooBoxes(30));
    const spread = (m: Map<string, { x: number; y: number }>) => new Set([...m.values()].map((p) => p.y)).size;
    expect(spread(many)).toBeGreaterThan(spread(few));   // more rows, not one pile
  });
});

describe('zoo game: a position saved when the park was a different size', () => {
  const habitat = { w: 132, h: 90 };

  it('brings a thing standing off the bottom back inside the park', () => {
    // The bug a saved game kept alive. The park used to GROW with its contents, so y=780 was a
    // perfectly legal place for a habitat - and when the park became a fixed 700 tall, that habitat
    // was drawn below the bottom of it. Still delivered, still Done, still on the Backlog, and
    // simply not anywhere you could look. Saving and reloading preserved it exactly.
    const rescued = insidePark(habitat, { x: 400, y: 780 });
    expect(rescued.y).toBeLessThanOrEqual(PLAY_H);
    expect(rescued.y + habitat.h / 2).toBeLessThanOrEqual(PLAY_H);
    expect(rescued.x).toBe(400); // and nothing else about it is moved
  });

  it('leaves a position that was already fine exactly where it was', () => {
    expect(insidePark(habitat, { x: 300, y: 300 })).toEqual({ x: 300, y: 300 });
  });

  it('holds a river by its centre, because it is meant to run off both edges', () => {
    const river = { w: 1180, h: 40 };
    const b = parkBounds(river);
    expect(b.minX).toBe(8);
    expect(b.maxX).toBe(CANVAS_W - 8);
    // A habitat, by contrast, is held by its sides.
    expect(parkBounds(habitat).minX).toBe(habitat.w / 2 + 4);
  });

  it('keeps every corner of the park reachable', () => {
    for (const [x, y] of [[-500, -500], [5000, 5000], [0, 5000], [5000, 0]]) {
      const p = insidePark(habitat, { x, y });
      expect(p.x - habitat.w / 2).toBeGreaterThanOrEqual(0);
      expect(p.x + habitat.w / 2).toBeLessThanOrEqual(CANVAS_W);
      expect(p.y - habitat.h / 2).toBeGreaterThanOrEqual(0);
      expect(p.y + habitat.h / 2).toBeLessThanOrEqual(PLAY_H);
    }
  });
});

describe('zoo game: the Product Owner looks ahead', () => {
  const commit = (s: ZooGameState, ...ids: string[]): ZooGameState =>
    ({ ...s, backlog: s.backlog.map((it) => (ids.includes(it.id) ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber } : it)) });

  it('says nothing when nothing is forecast', () => {
    expect(lookAhead(initialZooState(1))).toEqual([]);
  });

  it('notices that a zone about to open has no way in, and offers to write one', () => {
    const s = commit(bigCatsSplit(1), 'lion-enc', 'lion');
    // No paths item, and no epic hiding one either: there is nothing to split, so write it.
    const bare: ZooGameState = { ...s, backlog: s.backlog.filter((it) => it.id !== 'bigcats-paths' && it.category !== 'epic') };
    const p = lookAhead(bare).find((x) => x.id === 'path:Big Cats');
    expect(p).toBeTruthy();
    expect(p!.why).toMatch(/path to walk in on/i);
    expect(p!.kind).toBe('add');
    if (p!.kind === 'add') {
      expect(p!.draft.category).toBe('path');
      expect(p!.draft.zone).toBe('Big Cats');
    }
  });

  it('offers to SPLIT rather than duplicate when the thing is buried in an epic', () => {
    // Forecast a Waterside habitat. The Waterside's paths exist - as a member of the Waterside epic,
    // where nobody can size them or pull them into a Sprint. Adding a second one is not help.
    const base = initialZooState(1);
    const s: ZooGameState = { ...base, backlog: [...base.backlog, {
      id: 'penguin-enc', name: 'Penguin Habitat', category: 'enclosure', zone: 'Waterside', estimate: 5,
      acceptance: [], status: 'committed', sprintNumber: base.sprintNumber, accessible: true,
    }] };
    const p = lookAhead(s).find((x) => x.kind === 'split');
    expect(p).toBeTruthy();
    expect(p!.why).toMatch(/epic, where nobody can size it/);
    if (p!.kind === 'split') expect(p!.memberIds.length).toBeGreaterThan(0);
  });

  it('says nothing about a zone that already has its paths in the Backlog', () => {
    // bigcats-paths is right there, unbuilt but written - the Product Owner has nothing to add.
    const s = commit(bigCatsSplit(1), 'lion-enc', 'lion');
    expect(lookAhead(s).some((p) => p.id === 'paths:Big Cats')).toBe(false);
  });

  it('raises somewhere to eat before the visitors complain, not after', () => {
    // Three exhibits open or forecast and nowhere to buy anything. The visitor signals already
    // handle "after", and by then it has cost you a Sprint of unhappy visitors.
    let s = bigCatsSplit(1);
    s = { ...s, backlog: s.backlog.filter((it) => !(it.category === 'amenity')) };
    s = { ...s, backlog: s.backlog.map((it) => (['lion', 'tiger', 'leopard'].includes(it.id) ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber } : it)) };
    const food = lookAhead(s).find((p) => p.id === 'amenity:food');
    expect(food).toBeTruthy();
    expect(food!.kind).toBe('add');
    if (food!.kind === 'add') expect(food!.draft.services).toBe('food');
    expect(food!.why).toMatch(/3 exhibits/);
  });

  it('does not put the same suggestion twice once it has been turned down', () => {
    const s = commit(bigCatsSplit(1), 'lion-enc', 'lion');
    const noPaths: ZooGameState = { ...s, backlog: s.backlog.filter((it) => it.id !== 'bigcats-paths' && it.category !== 'epic') };
    expect(lookAhead(noPaths).some((p) => p.id === 'path:Big Cats')).toBe(true);
    const declined = { ...noPaths, declinedProposals: ['path:Big Cats'] };
    expect(lookAhead(declined).some((p) => p.id === 'path:Big Cats')).toBe(false);
  });

  it('proposes items the Scrum Team still has to refine and size', () => {
    const s = commit(bigCatsSplit(1), 'lion-enc', 'lion');
    const noPaths: ZooGameState = { ...s, backlog: s.backlog.filter((it) => it.id !== 'bigcats-paths' && it.category !== 'epic') };
    for (const p of lookAhead(noPaths)) {
      expect(p.why.length, `${p.label} says why`).toBeGreaterThan(20);
      if (p.kind !== 'add') continue;
      expect(p.draft.acceptance.length, `${p.label} arrives with criteria`).toBeGreaterThan(0);
      expect(p.draft.acceptance.every((a) => a.startsWith('Can ')), `${p.label} asks questions`).toBe(true);
    }
  });
});

describe("zoo game: the Product Owner's sign-off follows the park's answers too", () => {
  it('ticks when the last criterion is one the PARK answers, not one you tick', () => {
    // The sign-off is derived from the criteria. Ticking the last one by hand re-derived it; the
    // park answering the last one did not - so every criterion went green and the approval sat
    // there unticked with nothing the player could do to shift it.
    let s = planSprint(bigCatsSplit(1), ['bigcats-paths']);
    s = setItemTasks(s, 'bigcats-paths', suggestTasks(s.backlog.find((x) => x.id === 'bigcats-paths')!));
    s = buildItem(s, 'bigcats-paths', { parts: { thickness: 'medium' }, colors: { path: '#c9a86a' } });
    const item = () => s.backlog.find((x) => x.id === 'bigcats-paths')!;
    const signOff = () => (item().tasks ?? []).find((t) => isSignOffTask(t.label))!;

    // Accept everything a person can accept. The remaining one is the park's: no run is drawn yet.
    item().acceptance.forEach((label, i) => {
      if (!checkCriterion(s, item(), label)) s = confirmAcceptance(s, 'bigcats-paths', i, true);
    });
    s = applyParkChecks(s);
    expect(signOff().done, 'not yet - the park has not seen a path').toBe(false);

    // Lay a run to the habitat. The park answers the last criterion, and the sign-off must follow.
    s = applyParkChecks({
      ...s,
      backlog: s.backlog.map((it) => (it.id === 'lion-enc' ? { ...it, pos: { x: 300, y: 300 } } : it)),
      connectors: [{ id: 'r1', a: { featureId: 'lion-enc', x: 0, y: 0 }, b: { x: 300, y: 600 }, bends: [], thickness: 9, color: '#c9a86a' }],
    });
    expect(item().acceptance.every((_, i) => item().acConfirmed?.[i]), 'every criterion met').toBe(true);
    expect(signOff().done, 'and the sign-off follows').toBe(true);

    // Take the run back up and it all comes undone again, which is the point of deriving it.
    const undone = applyParkChecks({ ...s, connectors: [] });
    const paths = undone.backlog.find((x) => x.id === 'bigcats-paths')!;
    expect((paths.tasks ?? []).find((t) => isSignOffTask(t.label))!.done).toBe(false);
  });
});

describe('zoo game: a path meets the habitat it runs to', () => {
  // The perimeter loop round a habitat is drawn in its chosen SHAPE - an ellipse for a round one -
  // while the path was stopped at the bounding RECTANGLE, which sits outside that loop everywhere
  // except the four cardinal points. So every path arriving diagonally stopped short, and only at
  // the habitats that are not rectangles.
  const hw = 86, hh = 57;   // a large habitat, half-extents
  const rectEdge = (ux: number, uy: number) => {
    const t = 1 / Math.max(Math.abs(ux) / hw, Math.abs(uy) / hh);
    return { x: ux * t, y: uy * t };
  };
  const d = Math.SQRT1_2;   // 45 degrees

  it('stops on the ellipse of a round habitat, not on the box around it', () => {
    const got = shapeEdge('circle', 0, 0, hw, hh, d * 500, d * 500);
    // On the ellipse: (x/hw)^2 + (y/hh)^2 = 1.
    expect((got.x / hw) ** 2 + (got.y / hh) ** 2).toBeCloseTo(1, 1);
    // And that is a good way inside where the old rule stopped.
    const was = rectEdge(d, d);
    expect(Math.hypot(was.x - got.x, was.y - got.y), 'the gap the old rule left').toBeGreaterThan(10);
  });

  it('was never wrong straight out to the side, which is why some paths looked fine', () => {
    const got = shapeEdge('circle', 0, 0, hw, hh, 500, 0);
    expect(Math.abs(got.x - rectEdge(1, 0).x)).toBeLessThan(1.5);
  });

  it('follows the shape for every kind of habitat, and never overshoots it', () => {
    for (const shape of ['rounded', 'pill', 'circle', 'hexagon', 'octagon']) {
      for (const a of [0, 0.4, 0.8, 1.2, 2.0, 3.0, 4.5, 5.6]) {
        const p = shapeEdge(shape, 0, 0, hw, hh, Math.cos(a) * 900, Math.sin(a) * 900);
        expect(Math.abs(p.x), `${shape} at ${a}`).toBeLessThanOrEqual(hw + 1);
        expect(Math.abs(p.y), `${shape} at ${a}`).toBeLessThanOrEqual(hh + 1);
        expect(insideShape(shape, p.x, p.y, hw + 1.5, hh + 1.5), `${shape} at ${a} lands on the loop`).toBe(true);
      }
    }
  });

  it('puts the end further out for a rectangle than for the ellipse inside it', () => {
    const round = shapeEdge('circle', 0, 0, hw, hh, d * 500, d * 500);
    const boxy = shapeEdge('rounded', 0, 0, hw, hh, d * 500, d * 500);
    expect(Math.hypot(boxy.x, boxy.y)).toBeGreaterThan(Math.hypot(round.x, round.y));
  });
});

describe('the clock is part of the game, not part of a component', () => {
  // It used to live in DayTimer and DailyScrum as useState + setInterval. That could not be
  // saved (a resumed game came back with a full day however much had been spent), could not
  // be paused, and in a shared session every browser would run its own countdown and every
  // one of them would end the day.
  const running = (over: Partial<ZooGameState> = {}): ZooGameState =>
    ({ ...initialZooState(1), phase: 'sprint', dayStage: 'building', dayNumber: 1, sprintDays: 3, ...over });

  it('spends a second of the build day on each tick', () => {
    const s = tickDay(running());
    expect(s.daySecondsLeft).toBe(DAY_SECONDS - 1);
  });

  it('is paused in learn mode, and outside a running build day', () => {
    expect(tickDay(running({ learnMode: true })).daySecondsLeft).toBe(DAY_SECONDS);
    expect(tickDay(running({ phase: 'planning' })).daySecondsLeft).toBe(DAY_SECONDS);
    // A session left open overnight must not burn the day it is paused on.
    expect(tickDay(running({ dayStage: 'dailyScrum' })).daySecondsLeft).toBe(DAY_SECONDS);
  });

  it('ends the day itself when the clock runs out, so two browsers cannot both end it', () => {
    const s = tickDay(running({ daySecondsLeft: 1 }));
    expect(s.dayStage, 'the clock ran out and the day did not end').not.toBe('building');
    // ...and the day that has ended is not still counting down
    expect(tickDay(s).dayStage).toBe(s.dayStage);
  });

  it('takes refinement out of the clock, not just out of a tally', () => {
    const before = running();
    const item = before.backlog.find((it) => it.status === 'backlog');
    const after = estimateItem(before, item!.id, 5);
    expect(after.refinePenalty, 'the spend was not tallied').toBe(REFINE_COSTS.estimate);
    expect(after.daySecondsLeft, 'the tally moved but the clock did not')
      .toBe(DAY_SECONDS - REFINE_COSTS.estimate);
  });

  it('sizes the day to what the Daily Scrum left of it', () => {
    // The event is what SETS dayTimeMult, so the clock has to be cut when it is held. Sizing
    // the day when it turned over instead made holding the Daily Scrum free.
    const held = runDailyScrum(running({ dayStage: 'dailyScrum', daySecondsLeft: 3, dayNumber: 1 }));
    expect(held.daySecondsLeft, 'the day did not get a fresh clock').toBeGreaterThan(3);
    expect(held.daySecondsLeft, 'holding the Daily Scrum cost nothing').toBeLessThan(DAY_SECONDS);
    expect(held.daySecondsLeft).toBe(Math.round(DAY_SECONDS * held.dayTimeMult));
  });

  it('runs the Daily Scrum timebox too, and adapts when it expires', () => {
    const inScrum = running({ dayStage: 'dailyScrum', scrumSecondsLeft: DAILY_SCRUM_SECONDS });
    expect(tickScrum(inScrum).scrumSecondsLeft).toBe(DAILY_SCRUM_SECONDS - 1);
    const expired = tickScrum({ ...inScrum, scrumSecondsLeft: 1 });
    expect(expired.dayStage, 'the timebox ran out and nothing happened').not.toBe('dailyScrum');
  });

  it('carries a part-spent day through a save and a resume', () => {
    // The reason the clock had to move at all: a session can stop mid-Sprint on Tuesday and
    // pick up on Thursday, and it must not hand back a whole fresh day.
    const midDay = tickDay(tickDay(tickDay(running())));
    const resumed = JSON.parse(JSON.stringify(midDay)) as ZooGameState;
    expect(resumed.daySecondsLeft).toBe(DAY_SECONDS - 3);
    expect(tickDay(resumed).daySecondsLeft).toBe(DAY_SECONDS - 4);
  });
});
