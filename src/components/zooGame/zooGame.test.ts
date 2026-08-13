import { describe, it, expect } from 'vitest';
import { initialZooState, zooCapacity, STARTER_CAPACITY, SPRINT_DAYS, DAILY_SCRUM_MULT, SKIP_PENALTY_MULT, REFINE_COSTS } from './config';
import {
  planSprint, pullIntoSprint, estimateItem, moveItem, pokerHand, estimateSuggestion, buildItem, editItem, addAnother, improveItem, openItem, reviewSprint, startNextSprint, acceptSignal,
  setProductGoal, setSprintGoal, suggestSprintGoal, addPbi, refinePbi, suggestStory, moveItemBefore, moveSprintItem, moveForecastItem, moveToZone, addZone, renameZone, reorderInZone, moveZone, deletePbi, duplicatePbi, assignDev, renameMember, setPathStyle, addConnector, updateConnector, deleteConnector, openZoo, availableItems, productGoalProgress,
  endDay, runDailyScrum, skipDailyScrum, startDay, generateImpediment, suggestTasks, setItemTasks, toggleItemTask, confirmAcceptance, setDraftDesign, placeOnPark, startItem, allTasksDone, toggleGoalCritical, setSprintDays, setLearnMode, setDailyScrumAt, setEnclosureSize, setItemPos, setItemSpot, setItemSize, nestItem, unnestItem, renameItem, splitEpic, applyPoRefinements, setDefinitionOfDone, sprintProgress, retroQuestions,
} from './engine';
import type { ZooGameState, BacklogItem, PoDecisions } from './types';
import type { ItemDesign } from './design';
import { presetFor, renderDesign, designCriteria, EXHIBIT_PARTS, GRID_W, GRID_H, defaultFlora, enclosureFlora, enclosureWater, addFloraTo, addWaterTo, FLORA_TYPES, BUILDING_TYPES, amenityAcceptance, pathWidthPx, isLandscapeType, landscapeDefaultSize, floraColors, isDeployAcceptance } from './design';
import { TOOLBOX, toolboxDraft } from './toolboxItems';

/** A design that colours every part, so any category's build meets the Definition of Done. */
const FULL_DESIGN: ItemDesign = { parts: {}, colors: { body: '#c8873b', head: '#8a5a2b', ears: '#e3c66b', tail: '#2a2622', markings: '#f0efe9', foliage: '#43a047', trunk: '#7a5230', walls: '#cfd4d8', roof: '#9aa3ab', door: '#8a5a2b', sign: '#e6842a' } };

/** Fully finish a committed item: build its design and tick every plan task, so it
 *  reaches Done (every committed item now carries a default plan). */
function finish(state: ZooGameState, id: string, design: ItemDesign = FULL_DESIGN): ZooGameState {
  let s = buildItem(state, id, design);
  const it = s.backlog.find((x) => x.id === id);
  for (const t of it?.tasks ?? []) if (!t.done) s = toggleItemTask(s, id, t.id);
  return s;
}

/** Commit ids, build them all to Done, and open (release) them. */
function buildAndOpen(state: ZooGameState, ids: string[]): ZooGameState {
  let s = planSprint(state, ids);
  for (const id of ids) s = openItem(finish(s, id), id);
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
    let s = planSprint(flat(initialZooState(1)), ['lion', 'kiosk']); // 8 + 5 = 13 pts
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
    let s = initialZooState(1);
    s = buildAndOpen(s, ['lion', 'tiger', 'kiosk']);
    expect(openZoo(s).map((i) => i.id).sort()).toEqual(['kiosk', 'lion', 'tiger']);
    s = reviewSprint(s);
    expect(s.phase).toBe('review');
    expect(s.lastReview).not.toBeNull();
    expect(s.lastReview!.overallHappiness).toBeGreaterThan(0); // visitors enjoyed the exhibits
    expect(s.velocity).toEqual([8 + 8 + 5]); // points delivered this Sprint
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
    let s = planSprint(flat(initialZooState(1)), ['lion', 'tiger', 'penguins']);
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
    let s = flat(initialZooState(1));
    s = reviewSprint(buildAndOpen(s, ['lion', 'kiosk']));
    s = startNextSprint(s, 'Swarm on fewer exhibits at once');
    expect(s.phase).toBe('planning');
    expect(s.sprintNumber).toBe(2);
    expect(s.improvements).toHaveLength(1);
    s = reviewSprint(buildAndOpen(s, ['tiger', 'penguins']));
    expect(s.velocity).toHaveLength(2);
    expect(openZoo(s).map((i) => i.id).sort()).toEqual(['kiosk', 'lion', 'penguins', 'tiger']);
  });
});

describe('zoo game: arranging the park layout', () => {
  it('moves an item to another zone (adding the zone if new)', () => {
    let s = moveToZone(initialZooState(1), 'lion', 'Waterside');
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
    let s = initialZooState(1);
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
    let s = setSprintGoal(initialZooState(1), 'Open Big Cats so families have more to see.');
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
    let s = setSprintGoal(initialZooState(1), 'Fill Big Cats.');
    s = planSprint(s, ['lion', 'tiger']);
    s = openItem(finish(s, 'lion'), 'lion'); // tiger left unbuilt
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(false);
  });

  it('is MET when the goal-critical items are delivered, even if other scope is dropped', () => {
    let s = setSprintGoal(initialZooState(1), 'Open the lion for families.');
    s = planSprint(s, ['lion', 'tiger']);
    s = toggleGoalCritical(s, 'lion'); // lion is essential to the Goal; tiger is not
    s = openItem(finish(s, 'lion'), 'lion'); // deliver lion, drop tiger
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(true); // the essential landed -> outcome met
    expect(s.backlog.find((i) => i.id === 'tiger')!.status).toBe('backlog'); // tiger returns, fine
  });

  it('is NOT met when a goal-critical item is unfinished, even if others are done', () => {
    let s = setSprintGoal(initialZooState(1), 'Open the tiger.');
    s = planSprint(s, ['lion', 'tiger']);
    s = toggleGoalCritical(s, 'tiger'); // tiger essential
    s = openItem(finish(s, 'lion'), 'lion'); // lion done, tiger not
    s = reviewSprint(s);
    expect(s.sprintGoalMet).toBe(false);
  });

  it('the coach shapes an outcome from the selection', () => {
    const items = initialZooState(1).backlog.filter((i) => ['lion', 'tiger'].includes(i.id));
    expect(suggestSprintGoal(items)).toMatch(/Big Cats/);
    expect(suggestSprintGoal(items)).toMatch(/so /); // outcome-shaped
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
    let s = planSprint(initialZooState(1), ['lion', 'tiger', 'leopard']);
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
    const s = initialZooState(1);
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
    const s = planSprint(initialZooState(1), ['lion-enc', 'tiger-enc']);
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

  it('sends work that was started but never built back to the Product Backlog to be re-estimated', () => {
    let s = planSprint(initialZooState(1), ['tiger-enc']);
    s = startItem(s, 'tiger-enc');
    s = startNextSprint(reviewSprint(s), '');
    const t = s.backlog.find((x) => x.id === 'tiger-enc')!;
    expect(t.status).toBe('backlog');   // back to the PO's list, not carried into the next Sprint
    expect(t.sprintNumber).toBeNull();
    expect(t.carriedOver).toBe(true);   // ...flagged, and re-opened for estimation
    expect(t.unsized).toBe(true);
    expect(board(s).todo).not.toContain('tiger-enc');
  });

  it('keeps Done-but-unreleased work on the board, and in Done once it is released', () => {
    let s = planSprint(initialZooState(1), ['tiger-enc']);
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
    let s = planSprint(initialZooState(1), ['tiger-enc']);
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
    let s = planSprint(initialZooState(1), ['lion']);
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(true);
    s = pullIntoSprint(s, 'tiger');
    const tiger = s.backlog.find((i) => i.id === 'tiger')!;
    expect(tiger.status).toBe('committed');
    expect(tiger.sprintNumber).toBe(s.sprintNumber);
    expect(s.committedIds).toContain('tiger');
    expect(availableItems(s).some((i) => i.id === 'tiger')).toBe(false);
  });

  it('only pulls from the Backlog, and only during a Sprint', () => {
    const planning = initialZooState(1); // phase 'intro', not a Sprint
    expect(pullIntoSprint(planning, 'tiger')).toBe(planning);
    const s = planSprint(initialZooState(1), ['lion']);
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
    let s = initialZooState(1);
    s = reviewSprint(buildAndOpen(s, ['lion', 'tiger', 'penguins'])); // no food amenity
    const food = s.signals.find((sig) => sig.drivenBy === 'unmet:food');
    expect(food).toBeTruthy();
    const before = availableItems(s).length;
    s = acceptSignal(s, s.signals.indexOf(food!));
    expect(availableItems(s).length).toBe(before + 1);
    expect(availableItems(s).some((i) => i.services === 'food')).toBe(true);
  });

  it('ignored signals persist and worsen across Reviews', () => {
    let s = initialZooState(1);
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
    let s = openItem(finish(planSprint(initialZooState(1), ['lion']), 'lion', brightDesign), 'lion');
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

  it('the plan reflects the DoD: build steps + review + PO sign-off, but not placing/opening', () => {
    const tasks = suggestTasks(initialZooState(1).backlog.find((i) => i.id === 'lion')!);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => !t.done)).toBe(true);
    expect(tasks.some((t) => /peer-review/i.test(t.label))).toBe(true);
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
    let s = planSprint(initialZooState(1), ['lion']);
    s = pullIntoSprint(s, 'tiger');
    expect((s.backlog.find((i) => i.id === 'tiger')!.tasks ?? []).length).toBeGreaterThan(0);
  });
});

describe('zoo game: WIP limit and improvements with teeth', () => {
  it('the WIP limit blocks starting more items than the limit allows', () => {
    // Their enclosures are built first, so the WIP limit is what gates starting (not the habitat).
    let s = withEnclosuresBuilt(flat(initialZooState(1)), 'lion-enc', 'tiger-enc', 'leopard-enc', 'penguin-enc');
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
  it('choosing the Sprint length sets the number of build days (at Planning)', () => {
    let s: ZooGameState = { ...initialZooState(1), phase: 'planning' };
    expect(s.sprintDays).toBe(SPRINT_DAYS);
    s = setSprintDays(s, 5);
    expect(s.sprintDays).toBe(5);
    // planning it in commits with that length preserved
    s = planSprint(s, ['lion']);
    expect(s.sprintDays).toBe(5);
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
    const s = initialZooState(1);
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
    s = splitEpic(s, 'waterside', ['penguins', 'reef', 'wc']);
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
    let s = initialZooState(1);
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
    let s = planSprint(initialZooState(1), ['lion-enc']);
    s = openItem(finish(s, 'lion-enc'), 'lion-enc');
    s = reviewSprint(s);
    expect(s.lastReview!.segments.every((seg) => seg.happiness === 0)).toBe(true);
  });
});

describe('zoo game: the Definition of Done is the completion gate, not a happiness dial', () => {
  const NICE = ['lion', 'tiger', 'kiosk', 'penguins', 'reef', 'wc'];

  it('the default DoD is the four-step workflow (build, review, PO sign-off, place & open)', () => {
    expect(initialZooState(1).definitionOfDone).toEqual([
      'Meets its acceptance criteria',
      'Peer-reviewed by another Developer',
      'Approved by the PO',
      'Placed and opened',
    ]);
  });

  it('editing the DoD text does not change visitor happiness - that comes from the design', () => {
    const full = reviewSprint(buildAndOpen(flat(initialZooState(1)), NICE));
    const trimmed = reviewSprint(buildAndOpen(setDefinitionOfDone(flat(initialZooState(1)), ['Meets its acceptance criteria']), NICE));
    expect(trimmed.lastReview!.overallHappiness).toBe(full.lastReview!.overallHappiness);
  });
});

describe('zoo game: Retrospective coaching questions', () => {
  const NICE = ['lion', 'tiger', 'kiosk', 'penguins', 'reef', 'wc'];

  it('are open (what/how/when), never "why", and there is always at least one', () => {
    // A Sprint where the Goal is missed (only the lion of two goal items delivered).
    let s = planSprint(flat(initialZooState(1)), ['lion', 'tiger']);
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
    expect(item.acceptance.some((a) => /recognisable/i.test(a))).toBe(true);
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
    expect(draft.acceptance).toContain('The right width and colour');
    expect(draft.acceptance.some((a) => isDeployAcceptance(a))).toBe(true);
    expect(draft.acceptance.filter((a) => !isDeployAcceptance(a))).toEqual(['The right width and colour']);
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
    expect(tasks).toEqual(['Set its width and colour', 'Peer-review it', "Get the PO's sign-off"]);
    // Building it (no design) with its plan complete takes it to Done.
    s = estimateItem(s, item.id, 3);
    s = planSprint(s, [item.id]);
    s = setItemTasks(s, item.id, suggestTasks(item));
    let built = buildItem(s, item.id, presetFor(item)); // the studio passes the (empty) path design
    for (const t of built.backlog.find((x) => x.id === item.id)!.tasks ?? []) built = toggleItemTask(built, item.id, t.id);
    expect(built.backlog.find((x) => x.id === item.id)!.status).toBe('done');
    // Delivering it does not add a park feature (it is the connectors it drew).
    const open = openItem(built, item.id);
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
    expect(toolboxDraft(items.find((i) => i.name === 'River')!).acceptance).toEqual(['Reads as water', 'Sized to fit the space']);
    expect(toolboxDraft(items.find((i) => i.name === 'Entrance')!).acceptance).toContain('Clearly marks the way in');
    // Landscape features are resizable: they carry a default footprint and take a saved size.
    expect(isLandscapeType('river')).toBe(true);
    expect(isLandscapeType('bridge')).toBe(true);
    expect(isLandscapeType('tree')).toBe(false);
    // A bridge is scenery you cross: it reads as a bridge (build) and is placed across the water (deploy).
    expect(toolboxDraft(items.find((i) => i.name === 'Bridge')!).acceptance).toEqual(['Reads as a bridge you can cross', 'Placed across the water']);
    expect(landscapeDefaultSize('river').w).toBeGreaterThan(landscapeDefaultSize('river').h); // a river starts wide
    const sized = setItemSize(initialZooState(1), 'lion', { w: 400, h: 40 });
    expect(sized.backlog.find((i) => i.id === 'lion')!.size).toEqual({ w: 400, h: 40 });
    // The studio names a feature's colours for what they are - a river has water, not "foliage" or
    // a trunk - and shows only the colours it uses.
    expect(floraColors('river')).toEqual([{ key: 'foliage', label: 'Water' }]);
    expect(floraColors('carpark').map((c) => c.label)).toEqual(['Tarmac', 'Markings']);
    expect(floraColors('tree').map((c) => c.label)).toEqual(['Foliage', 'Trunk / bed']);
    // A landscape PBI's plan has no "choose the plant type" step - it is scenery you colour and
    // then size on the park.
    // suggestTasks only reads category + template, both of which a toolbox draft carries.
    const riverPlan = suggestTasks(toolboxDraft(items.find((i) => i.name === 'River')!) as never).map((t) => t.label);
    expect(riverPlan).toContain('Colour it');
    expect(riverPlan.some((l) => /plant type/i.test(l))).toBe(false);
    // All the landscape sprites differ from each other.
    const shapes = ['river', 'pond', 'rocks', 'entrance', 'carpark', 'hedge', 'fountain'];
    const rendered = shapes.map((t) => JSON.stringify(renderDesign({ category: 'flora' } as never, { parts: { type: t }, colors: { foliage: '#5aa9c8', trunk: '#8a5a2b' } })));
    expect(new Set(rendered).size).toBe(shapes.length);
  });

  it('separates build-time acceptance (studio) from deploy-time acceptance (placed & sized on the park)', () => {
    // "Sized to fit the space" can only be judged once it is on the park, so it is a deploy-time AC;
    // appearance ACs are build-time (confirmed in the studio).
    expect(isDeployAcceptance('Sized to fit the space')).toBe(true);
    expect(isDeployAcceptance('Reads as water')).toBe(false);
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
    // Carried over unfinished, it is re-opened for estimation (a fresh Ready check) - the team
    // re-points the work that is left before it can be re-planned.
    expect(lion.unsized).toBe(true);
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
    s = { ...s, backlog: s.backlog.map((it) => (it.id === 'lion' ? { ...it, status: 'committed' as const, sprintNumber: s.sprintNumber, tasks, trueSize: 8 } : it)) };
    s = reviewSprint(s);
    const lion = s.backlog.find((i) => i.id === 'lion')!;
    // 3/4 done -> ~1/4 of the work left, so the hidden size is nudged well below the original 8.
    expect(lion.trueSize).toBeLessThan(8);
    expect(lion.trueSize).toBeGreaterThanOrEqual(1);
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
    expect(draft('Gift Shop').acceptance).toContain('Sells a range of souvenirs');
    expect(draft('Gift Shop').acceptance).not.toContain('Serves food and drink');
    expect(draft('Kiosk').acceptance).toContain('Serves food and drink');
    expect(draft('Cafe').acceptance).toContain('Serves food and drink');
    expect(draft('Toilets').acceptance).toContain('Has enough cubicles');
    expect(draft('Seating').acceptance.some((a) => /seating/i.test(a))).toBe(true);
    // A food outlet raised from a visitor signal still reads as food, not retail.
    expect(amenityAcceptance('Food outlet', 'food')).toContain('Serves food and drink');
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
    expect(item.acceptance).toContain('Clearly readable'); // sign-appropriate ACs, not "planting"
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

  it('a crested / tusked head is the signature feature, coloured via the ears slot', () => {
    for (const head of ['crested', 'tusked']) {
      const design: ItemDesign = { parts: { body: 'round', head }, colors: { body: '#c8873b', head: '#8a5a2b' } };
      const crit = designCriteria(exhibit(), design);
      const feature = crit.find((c) => /crest|tusks/.test(c.label))!;
      expect(feature).toBeDefined();
      expect(feature.pass).toBe(false); // needs the ears-slot colour
      design.colors.ears = '#efe6d0';
      expect(designCriteria(exhibit(), design).find((c) => /crest|tusks/.test(c.label))!.pass).toBe(true);
    }
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
});

describe('zoo game: bespoke animals (base shape)', () => {
  it('a New PBI animal can start from a base species shape the studio uses', () => {
    let s = addPbi(initialZooState(1), { name: 'Sabretooth', category: 'exhibit', zone: 'Big Cats', acceptance: ['Fierce'], template: 'tiger' });
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
    let s = initialZooState(1);
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

describe('zoo game: the PO can suggest the initial Sprint Goal', () => {
  it('populates the Sprint Goal from the PO proposal (explicit "Ask the PO"), replacing a placeholder', () => {
    // No goal yet -> the PO's proposal seeds it.
    let s = applyPoRefinements(initialZooState(1), { sprintGoal: 'Open the Big Cats zone so families have a headline exhibit.' });
    expect(s.sprintGoal).toContain('Big Cats');
    // A placeholder is in the field -> asking the PO replaces it with the proposed goal.
    s = setSprintGoal(initialZooState(1), 'b');
    s = applyPoRefinements(s, { sprintGoal: 'A clear PO goal' });
    expect(s.sprintGoal).toBe('A clear PO goal');
    // No proposal -> the existing goal is left alone.
    s = applyPoRefinements(setSprintGoal(initialZooState(1), 'Keep me'), {});
    expect(s.sprintGoal).toBe('Keep me');
  });
});
