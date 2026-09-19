import { initialZooState, DAY_SECONDS } from './config';
import { wantedServices } from './parkChecks';
import {
  suggestTasks, startItem, buildItem, placeOnPark, addConnector, planItemShape, chooseStructure,
  setEnclosureSize, setServices, askToCheck, answerQuestion, toggleItemTask, isSignOffTask,
  openItem, setDraftDesign, finishItem,
} from './engine';
import { presetFor, addWaterTo, addFloraTo, designSatisfiesTask, currentDesign, isLandscapeType, HABITAT_FEATURE_TYPES } from './design';
import { standingOnPark, parkPositions, positionOf } from './parkModel';
import { CANVAS_W, PLAY_H } from './parkLayout';
import { replay } from './replay';
import { RECORDED } from './exampleZooTrail';
import type { ZooGameState, BacklogItem } from './types';
import type { ItemDesign } from './design';

// A small zoo that somebody built, for the orientation screen to point at.
//
// Asked for after reading the orientation: "can we show an example of a built zoo using a labelled
// isometric view?" The screen described the park in words, and the park is the thing the whole game
// is about.
//
// It is built by DRIVING THE GAME, not by hand-writing a state that looks like one. Every step here
// is the step a learner takes: a Developer starts the item, chooses what kind of thing it is and
// how big, builds it, puts it where it belongs, ticks off the plan, asks the Product Owner, moves
// it to Done and opens it. The same route `everyKindReachesLive` walks for every category.
//
// That matters more than it looks. A hand-built fixture can show a habitat with no perimeter, or an
// animal standing next to its enclosure rather than in it - a picture of a zoo the game would
// refuse to build, used to teach people what the game does. Driving the engine makes that
// impossible: if the rules change, this example changes with them or stops compiling.

/** What the Developers chose, per kind of thing. The same choices the build takeover makes. */
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
    case 'amenity':
      return { ...p, parts: { ...p.parts, type: 'toilets', structure: 'toilets', sign: 'on' },
        colors: { ...p.colors, sign: '#3f6f4f' } };
    default:
      return p;
  }
};

const commit = (s: ZooGameState, id: string): ZooGameState => ({
  ...s,
  committedIds: [...(s.committedIds ?? []), id],
  backlog: s.backlog.map((it) => (it.id === id ? { ...it, status: 'committed' as const, sprintNumber: 1 } : it)),
});

/** One item, from Product Backlog item to open to visitors. */
function takeItLive(start: ZooGameState, id: string): ZooGameState {
  let s = commit(start, id);
  const item = () => s.backlog.find((it) => it.id === id)!;

  s = startItem(s, id, 'developer');
  if (item().category === 'enclosure') {
    s = chooseStructure(s, id, 'paddock');
    s = setEnclosureSize(s, id, 'large');
  }
  if (item().category === 'amenity') {
    s = setServices(s, id, wantedServices(item()) ?? 'food');
  }
  const design = built(item());
  s = setDraftDesign(s, id, design);

  if (item().category === 'exhibit') {
    const home = s.backlog.find((it) => it.category === 'enclosure' && (it.status === 'open' || it.status === 'done'));
    if (home) s = planItemShape(s, id, { enclosureId: home.id });
  }
  if (item().category === 'path') {
    // A path is drawn rather than put down, and drawing the run is what commits it. This one runs
    // from the way in up to the habitat, which is the thing it has to do for a visitor to reach it.
    s = addConnector(s, { id: `run-${id}`, itemId: id, a: { x: 400, y: 980 }, b: { x: 400, y: 430 },
      bends: [], thickness: 9, color: '#c9a86a' });
  } else {
    s = buildItem(s, id, design);
    s = placeOnPark(s, id);
  }

  for (const t of item().tasks ?? []) {
    if (!t.label.trim() || isSignOffTask(t.label)) continue;
    if (!t.done && designSatisfiesTask(item(), currentDesign(item()), t.label)) s = toggleItemTask(s, id, t.id);
  }

  s = askToCheck(s, id, 'developer');
  s = answerQuestion(s, `check-${id}`, 'accept', 'product_owner');
  s = finishItem(s, id, 'developer');
  s = openItem(s, id, 'product_owner');
  return s;
}

/** What the example points at, in the order somebody reads it.
 *
 *  Each one is a word the toolbar uses, so the label is doing double duty: it names the thing in
 *  the picture AND the control that made it. The park is where "perimeter" stops being a menu. */
export interface ExampleLabel {
  /** The backlog item the pin sits on. */
  id: string;
  title: string;
  text: string;
  /** How to find the thing in the drawing. The park tags what it draws in more than one way - a
   *  habitat and a building by their item id, an animal by its spot, a path by the run it was drawn
   *  as - so the label carries the question rather than making the component guess it. */
  find: string;
}

export interface ExampleZoo {
  state: ZooGameState;
  labels: ExampleLabel[];
  /** The built work's own bounds, in park coordinates. The isometric view is pointed at it with a
   *  camera and the plan view with a frame - two ways of saying "look here" that have to agree, or
   *  the two drawings are of different zoos. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Where to stand to see it. The park is four areas wide and this zoo is one corner of one of
   *  them, so the whole canvas draws the built work as a speck with four labels piled on it. The
   *  camera is the renderer's own window on the drawing, which means walking up to the zoo makes it
   *  sharper rather than bigger and blurrier. */
  camera: { x: number; y: number; zoom: number };
}

let cached: ExampleZoo | null = null;

/** A zoo this file builds for itself, for when there is no recording to replay. Every step is the
 *  step a learner takes, so it can never produce a zoo the game would refuse to build. */
function builtHere(): ZooGameState {
  const base = initialZooState(3);
  let s: ZooGameState = {
    ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1,
    daySecondsLeft: DAY_SECONDS, dodAgreed: true,
    backlog: base.backlog.map((it) => ({ ...it, tasks: it.tasks?.length ? it.tasks : suggestTasks(it) })),
  } as ZooGameState;

  const pick = (category: string, template?: string) => s.backlog.find((it) => it.category === category
    && it.status === 'backlog' && !it.unsized && (!template || it.template === template));

  // The habitat first, because an animal moves into one, and the path last, because it runs to
  // something that is there.
  const order: { category: string; template?: string }[] = [
    { category: 'enclosure' },
    { category: 'exhibit' },
    { category: 'amenity' },
    { category: 'path' },
  ];
  for (const { category, template } of order) {
    const item = pick(category, template);
    if (!item) continue;
    s = takeItLive(s, item.id);
  }
  return s;
}

/** What to point at in a zoo, whoever built it.
 *
 *  Read off the state rather than remembered from the build, because the zoo on this screen may not
 *  have been built by this file at all: a recorded game replays to a state nobody here chose, with
 *  its own items, its own names and its own layout. Asking the zoo what is in it works for both.
 *
 *  Open, not merely built. A building site is a promise, and the screen is showing what a finished
 *  one looks like. */
function labelsFor(s: ZooGameState): { labels: ExampleLabel[]; ids: Set<string> } {
  // BUILT, which in this game means built and accepted by the Product Owner. Opening it to visitors
  // is a separate decision on the same card, and a zoo somebody built and has not opened yet is
  // still a zoo somebody built - which is what this screen is showing. The first recording somebody
  // sent had three items Done and none of them opened, and the screen showed a park with no labels
  // on it at all.
  const built = s.backlog.filter((it) => it.status === 'done' || it.status === 'open');
  const first = (category: string, pick?: (it: BacklogItem) => boolean) =>
    built.find((it) => it.category === category && (!pick || pick(it)));

  // Every category the game can put on a park. Epics and needs are not among them: an epic is too
  // big to be one thing and a need has not been decided yet, so neither is ever standing anywhere.
  const landscape = (it: BacklogItem) => isLandscapeType(it.template ?? '');
  const chosen: Record<string, BacklogItem | undefined> = {
    enclosure: first('enclosure'),
    exhibit: first('exhibit'),
    amenity: first('amenity'),
    path: first('path'),
    // Flora is two different things wearing one category: the landscape somebody LAYS - a bridge,
    // a pond, a rockery - and the planting somebody grows. They teach different things, so they
    // get their own lines rather than one line that fits neither.
    landscape: first('flora', landscape),
    planting: first('flora', (it) => !landscape(it)),
  };

  const runOf = (it?: BacklogItem) => (s.connectors ?? []).find((c) => c.itemId === it?.id)?.id;
  const say = (it: ExampleLabel | null): it is ExampleLabel => !!it && !!it.id;

  const lines: (ExampleLabel | null)[] = [
    chosen.enclosure && { id: chosen.enclosure.id, title: chosen.enclosure.name,
      find: `[data-item="${chosen.enclosure.id}"]`,
      text: 'A habitat. The Developers chose the structure, the size, the surface it is laid with and the perimeter that holds it.' },
    chosen.exhibit && { id: chosen.exhibit.id, title: chosen.exhibit.name,
      // By its item id, which both drawings now put on it. It used to be the isometric view's own
      // `data-spot`, and the animal simply had no pin in the plan - two renderers answering "which
      // item is this?" in two different words.
      find: `[data-item="${chosen.exhibit.id}"]`,
      text: 'The animal lives IN the habitat, not beside it. It could not be placed until there was one that could hold it.' },
    chosen.path && runOf(chosen.path) && { id: chosen.path.id, title: chosen.path.name,
      find: `[data-conn="${runOf(chosen.path)}"]`,
      text: 'Drawn, not placed. Every habitat is asked whether a visitor can walk to it from the way in, and this is the answer.' },
    chosen.amenity && { id: chosen.amenity.id, title: chosen.amenity.name,
      find: `[data-item="${chosen.amenity.id}"]`,
      text: 'A facility, decided the same way as anything else. What it offers visitors is part of building it.' },
    chosen.landscape && { id: chosen.landscape.id, title: chosen.landscape.name,
      find: `[data-item="${chosen.landscape.id}"]`,
      text: 'Landscape, laid rather than grown. Water is a wall to a visitor, and a bridge is the one door through it - so where this sits decides where anybody can walk.' },
    chosen.planting && { id: chosen.planting.id, title: chosen.planting.name,
      find: `[data-item="${chosen.planting.id}"]`,
      text: 'Planting. It settles nothing the park measures, and a zoo without it is a car park with animals in it.' },
  ].map((l) => (l || null) as ExampleLabel | null);

  const labels = lines.filter(say);
  return { labels, ids: new Set(labels.map((l) => l.id)) };
}

/** Where to stand to see it. Framed on what was built, read off the model the renderer lays out
 *  from - so the shot follows the zoo rather than being a number somebody tuned once and left
 *  behind, and a recorded zoo built in a different corner is still in shot. */
function frame(s: ZooGameState, ids: Set<string>) {
  const standing = standingOnPark(s);
  const auto = parkPositions(standing, new Map());
  // The corners of each labelled thing, not its middle: a large habitat framed by its centre is a
  // habitat with its fences out of shot.
  const built = standing.filter((st) => ids.has(st.item.id)).flatMap((st) => {
    const at = positionOf(st, auto);
    return [{ x: at.x - st.size.w / 2, y: at.y - st.size.h / 2 },
      { x: at.x + st.size.w / 2, y: at.y + st.size.h / 2 }];
  });
  // The paths are deliberately NOT framed. A path runs from the way in to the thing it serves, so
  // any point on it that is not the served end pulls the shot halfway across the park - which is
  // what the first real recording did: the habitat, the animal in it and the toilets beside it all
  // went off the top of the picture to make room for a car park nobody was pointing at.
  //
  // The path is still in shot. It arrives into the frame, which is the thing being said about it.
  const points = built.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  if (!points.length) {
    return { camera: { x: CANVAS_W / 2, y: PLAY_H / 2, zoom: 1 },
      box: { x0: 0, y0: 0, x1: CANVAS_W, y1: PLAY_H } };
  }

  const span = (get: (p: { x: number; y: number }) => number) => {
    const all = points.map(get);
    return { lo: Math.min(...all), hi: Math.max(...all) };
  };
  const x = span((p) => p.x);
  const y = span((p) => p.y);
  // Zoomed to FIT what is labelled rather than to a number somebody tuned once. A recording is
  // somebody else's zoo: it can be tucked in a corner or spread across an area, and a fixed zoom
  // that flatters one cuts the other in half.
  const room = 1.45;
  // The park is SEEN from the corner, and an isometric view squashes the far axis: a region that is
  // tall in park coordinates comes out short and wide on the screen. Fitting it by its park height
  // therefore leaves most of the picture empty - measured at 19% of the box, with the zoo a speck in
  // the middle of it, while the plan beside it filled 91% of the same height.
  //
  // So the height counts for about half of itself, which is what the projection does to it.
  const SEEN_FROM_THE_CORNER = 0.5;
  const fit = Math.min(
    CANVAS_W / Math.max(1, (x.hi - x.lo) * room),
    PLAY_H / Math.max(1, (y.hi - y.lo) * room * SEEN_FROM_THE_CORNER),
  );
  return {
    camera: { x: (x.lo + x.hi) / 2, y: (y.lo + y.hi) / 2, zoom: Math.max(1, Math.min(3, fit)) },
    box: { x0: x.lo, y0: y.lo, x1: x.hi, y1: y.hi },
  };
}

/** The zoo on the orientation screen, and what to point at in it.
 *
 *  A RECORDING if there is one: the seed somebody started from and every action they pressed,
 *  replayed. That is the strongest version of what this file was already trying to be - the zoo in
 *  the picture is not one described here, it is the one somebody built, with their placements,
 *  their sizes, their colours and the route they walked the path along.
 *
 *  Otherwise it builds its own, which is what it did before there was a way to record one. Either
 *  way the picture is a state the engine produced, so it can never show a zoo the game would
 *  refuse to build.
 *
 *  Built once: the same zoo every time, which is what makes it something a trainer can talk over. */
export function exampleZoo(): ExampleZoo {
  if (cached) return cached;
  const walked = RECORDED ? replay(RECORDED) : null;
  const state = walked ? walked[walked.length - 1] : builtHere();
  const { labels, ids } = labelsFor(state);
  const shot = frame(state, ids);
  cached = { state, labels, camera: shot.camera, box: shot.box };
  return cached;
}
