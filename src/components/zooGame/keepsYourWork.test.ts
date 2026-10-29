import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { reducer } from './useZooGame';
import { addInside, buildItem } from './engine';
import { presetFor, currentDesign, enclosureWater, enclosureFlora } from './design';
import { initialZooState as freshZoo } from './config';
import type { ZooGameState, BacklogItem } from './types';

// The Developers finish your work. They do not start it again.
//
// Reported from playing it, twice in a row and five minutes apart: "I'm sure I added them before",
// and "the ground colour disappeared after I did Look Inside". Both were the same thing - a seat
// nobody is sitting in took the card the player was working on and built it from a PRESET, so the
// ground, the barrier, the pool and the tree they had chosen were thrown away by a teammate.
//
// It is worth being firm about, because it is the game's own lesson pointed the wrong way: the
// Developers swarming on an item is the thing the game is teaching, and a swarm that deletes what
// you did teaches something else entirely.

const inHand = (): { state: ZooGameState; pen: BacklogItem } => {
  const base = initialZooState(1) as ZooGameState;
  const pen = base.backlog.find((it) => it.category === 'enclosure')!;
  const state = { ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
    backlog: base.backlog.map((it) => (it.id === pen.id
      ? { ...it, status: 'committed' as const, started: true, sprintNumber: 1 } : it)),
  } as ZooGameState;
  return { state, pen: state.backlog.find((it) => it.id === pen.id)! };
};

describe('drawing the way in', () => {
  it('does not empty the habitat it leads to', () => {
    // Reported from playing it, with the trail that proved it: "it seems to be when I draw a path -
    // the things I added on Look Inside disappear."
    //
    // Laying a run commits the drawn thing's design, because a path is never put down - it is drawn,
    // and without this its design stayed a draft nobody could accept. It read `design ?? draftDesign`
    // - the opposite of everywhere else in the game, where the DRAFT wins because a draft that still
    // exists is somebody's newer work. That was harmless while only a pathway could own a run: a
    // path's design is only ever a draft, so there was nothing older to prefer. A habitat owns its
    // runs since the way in became its own criterion, and a habitat in hand has a built design under
    // a draft - so drawing the way in committed the older one over the top.
    const { state, pen } = inHand();
    // Built by the Developers, which is what puts a design on it - and what makes everything the
    // player adds afterwards a draft.
    let s = buildItem(state, pen.id, presetFor(pen));
    for (const kind of ['water', 'rocks', 'rocks', 'tree']) s = addInside(s, pen.id, kind);
    const before = currentDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(enclosureFlora(before).length, 'nothing was set up to lose').toBe(3);

    s = reducer(s, { type: 'ADD_CONNECTOR', connector: { id: 'r1', itemId: pen.id,
      a: { x: 300, y: 1060 }, b: { x: 300, y: 900 }, bends: [], thickness: 9, color: '#c9a86a' } });

    const after = currentDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(enclosureFlora(after).length, 'drawing the path emptied the pen').toBe(3);
    expect(enclosureWater(after).length, 'drawing the path drained the pool').toBe(1);
  });

  it('still commits the drawn thing, which is what it is for', () => {
    // The reason the line exists: a path is never put down, so laying its run is the moment its
    // design is built. That must go on working - for a pathway, whose design is only ever a draft.
    const base = freshZoo(1) as ZooGameState;
    const path = base.backlog.find((it) => it.category === 'path')!;
    const s = reducer({ ...base, phase: 'sprint', dayStage: 'building', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === path.id
        ? { ...it, status: 'committed' as const, started: true, sprintNumber: 1, draftDesign: presetFor(it) } : it)),
    } as ZooGameState, { type: 'ADD_CONNECTOR', connector: { id: 'r2', itemId: path.id,
      a: { x: 300, y: 1060 }, b: { x: 900, y: 1060 }, bends: [], thickness: 9, color: '#c9a86a' } });
    const after = s.backlog.find((it) => it.id === path.id)!;
    expect(after.design, 'laying a run no longer builds the path it belongs to').toBeTruthy();
    expect(after.draftDesign, 'the draft was left behind beside the design').toBeUndefined();
  });
});
