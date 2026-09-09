import { describe, it, expect } from 'vitest';
import { initialZooState, DAY_SECONDS } from './config';
import {
  suggestTasks, startItem, buildItem, placeOnPark, addConnector, planItemShape,
  askToCheck, answerQuestion, toggleItemTask, isSignOffTask, openItem, setDraftDesign,
} from './engine';
import { presetFor, addWaterTo, addFloraTo, designSatisfiesTask, currentDesign, HABITAT_FEATURE_TYPES } from './design';
import type { ZooGameState, BacklogItem } from './types';
import type { ItemDesign } from './design';

// Every kind of thing takes the same route from Product Backlog item to live.
//
// Asked while playing it: "are the steps to build all objects from a PBI the same? Can you check
// all objects are buildable from PBI to live?" They are meant to be - start it, build the object,
// put it on the park, finish the plan, have it accepted, open it - and three separate dead ends
// have been found where one kind of thing could not complete a step that the others could: an
// animal that never committed its build, a path with nothing in its zone to reach, a coat that
// could be chosen and never ticked.
//
// So the route is written ONCE here and every category is driven through it. A kind of thing that
// needs a special case fails this test, which is the point of it.

/** What the build takeover would put on this object. */
const built = (item: BacklogItem): ItemDesign => {
  const p = presetFor(item);
  switch (item.category) {
    case 'enclosure':
      return { ...p, colors: { ...p.colors, ground: '#c8a06a' },
        flora: addFloraTo({ ...p, flora: [] }, HABITAT_FEATURE_TYPES[0]), water: addWaterTo({ ...p, water: [] }) };
    case 'exhibit':
      return { ...p, group: { males: 1, females: 1, juveniles: 0, cubs: 0 }, colors: { ...p.colors, coat: '#c8761f' } };
    case 'path':
      return { ...p, parts: { ...p.parts, thickness: 'medium' }, colors: { ...p.colors, path: '#c9a86a' } };
    default:
      return p;
  }
};

const sprint = (): ZooGameState => {
  const base = initialZooState(3);
  return {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, dodAgreed: true,
    backlog: base.backlog.map((it) => ({ ...it, tasks: it.tasks?.length ? it.tasks : suggestTasks(it) })),
  } as ZooGameState;
};

/** Commit one item to the Sprint, so it is on the board to be built. */
const commit = (s: ZooGameState, id: string): ZooGameState => ({
  ...s,
  committedIds: [...(s.committedIds ?? []), id],
  backlog: s.backlog.map((it) => (it.id === id ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
});

/** The one route, walked the same way for every kind of thing. */
const takeItLive = (start: ZooGameState, id: string): ZooGameState => {
  let s = commit(start, id);
  const item = () => s.backlog.find((it) => it.id === id)!;

  // 1. A Developer takes it into Doing.
  s = startItem(s, id, 'developer');
  expect(item().started, `${item().name}: nobody could start it`).toBe(true);

  // 2. The object is built in the takeover.
  const design = built(item());
  s = setDraftDesign(s, id, design);

  // 3. ...and put where it belongs: an animal into its habitat, a path as a run, everything else
  //    onto the park. This is the only fork in the route, and it is about WHERE, not how.
  if (item().category === 'exhibit') {
    const home = s.backlog.find((it) => it.category === 'enclosure' && (it.status === 'open' || it.status === 'done'))!;
    s = planItemShape(s, id, { enclosureId: home.id });
  }
  if (item().category === 'path') {
    // A path is not put down, it is drawn - and drawing the run is what commits it, the way placing
    // commits a habitat. Nothing else is done to it here, deliberately: if a path needed a private
    // extra step, this test would be the place that hid it.
    s = addConnector(s, { id: `run-${id}`, itemId: id, a: { x: 400, y: 600 }, b: { x: 400, y: 300 }, bends: [], thickness: 9, color: '#c9a86a' });
  } else {
    s = buildItem(s, id, design);
    s = placeOnPark(s, id);
  }

  // 4. The plan ticks itself off as the work is done - every step the design satisfies.
  for (const t of item().tasks ?? []) {
    if (!t.label.trim() || isSignOffTask(t.label)) continue;
    if (!t.done && designSatisfiesTask(item(), currentDesign(item()), t.label)) s = toggleItemTask(s, id, t.id);
  }
  expect((item().tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label)).every((t) => t.done),
    `${item().name}: a step of the plan could not be ticked by building the thing`).toBe(true);

  // 5. The Developers ask, the Product Owner accepts. That is the sign-off.
  s = askToCheck(s, id, 'developer');
  s = answerQuestion(s, `check-${id}`, 'accept', 'product_owner');
  expect(item().status, `${item().name}: accepted work did not reach Done`).toBe('done');

  // 6. ...and it opens to visitors.
  s = openItem(s, id, 'product_owner');
  expect(item().status, `${item().name}: Done work could not be opened`).toBe('open');
  return s;
};

describe('every kind of thing gets from Product Backlog item to live', () => {
  it('walks the same route for a habitat, an animal, a path, planting and a facility', () => {
    let s = sprint();
    const pick = (category: string) => s.backlog.find((it) => it.category === category && it.status === 'backlog' && !it.unsized)!;

    // The habitat first, because an animal moves into one.
    const order = ['enclosure', 'exhibit', 'path', 'flora', 'amenity'];
    const seen: string[] = [];
    for (const category of order) {
      const item = pick(category);
      expect(item, `there is no ${category} in the starting Backlog to try`).toBeTruthy();
      s = takeItLive(s, item.id);
      seen.push(`${category}:${s.backlog.find((it) => it.id === item.id)!.status}`);
    }
    expect(seen).toEqual(order.map((c) => `${c}:open`));
  });
});
