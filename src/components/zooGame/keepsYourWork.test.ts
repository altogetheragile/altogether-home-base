import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { aiDesign, aiTurn } from './aiSeats';
import { reducer } from './useZooGame';
import { addInside, buildItem, setDraftDesign, moveInside } from './engine';
import { presetFor, currentDesign, enclosureWater, enclosureFlora } from './design';
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

describe('what a Developer builds', () => {
  it('keeps the ground somebody chose', () => {
    const { state, pen } = inHand();
    const mine = { ...presetFor(pen), colors: { ...presetFor(pen).colors, ground: '#2f6f3f' } };
    const chosen = setDraftDesign(state, pen.id, mine);
    const built = aiDesign(chosen.backlog.find((it) => it.id === pen.id)!);
    expect(built.colors?.ground, 'a Developer repainted the ground somebody had chosen').toBe('#2f6f3f');
  });

  it('keeps what is in the habitat, and does not add a second one beside it', () => {
    const { state, pen } = inHand();
    // Added the way a player adds them: Look Inside, then + Water and + Tree.
    let s = addInside(state, pen.id, 'water');
    s = addInside(s, pen.id, 'oak');
    // ...and dragged where they wanted it, which is what makes a replacement visible rather than
    // merely equal by luck.
    s = moveInside(s, pen.id, 'water', 0, { x: 0.18, y: 0.77 });
    const mine = currentDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(enclosureWater(mine)).toHaveLength(1);
    expect(enclosureFlora(mine)).toHaveLength(1);

    const built = aiDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(enclosureWater(built), 'the pool somebody dug was replaced or doubled').toHaveLength(1);
    expect(enclosureFlora(built), 'the tree somebody planted was replaced or doubled').toHaveLength(1);
    expect(enclosureWater(built)[0], 'the pool was moved from where it was put').toEqual(enclosureWater(mine)[0]);
    // Where the player dragged it, whatever the clamping made of that - not where a fresh pool
    // would have been dug.
    expect(enclosureWater(built)[0].x, 'the pool went back to where the game would have put it')
      .toBe(enclosureWater(mine)[0].x);
  });

  it('still finishes a habitat nobody has touched', () => {
    // The other half of it. A Developer building an untouched card still lays ground, shelter and
    // water, because that is what their own plan says they did.
    const { state, pen } = inHand();
    const built = aiDesign(pen);
    expect(built.colors?.ground, 'an untouched habitat was left with no ground').toBeTruthy();
    expect(enclosureWater(built), 'an untouched habitat was left with no water').toHaveLength(1);
    expect(enclosureFlora(built), 'an untouched habitat was left with nothing growing').toHaveLength(1);
    expect(state.backlog.length).toBeGreaterThan(0);
  });

  it('survives the whole move: choose, then let the Developers build it', () => {
    // End to end through the reducer, because `buildItem` clears the draft - which is what made the
    // choice disappear rather than merely be ignored.
    const { state, pen } = inHand();
    const mine = { ...presetFor(pen), colors: { ...presetFor(pen).colors, ground: '#2f6f3f' } };
    let s = reducer(state, { type: 'SET_DRAFT_DESIGN', id: pen.id, design: mine });
    s = addInside(s, pen.id, 'rocks');
    const held = s.backlog.find((it) => it.id === pen.id)!;
    s = buildItem(s, pen.id, aiDesign(held));
    const after = currentDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(after.colors?.ground, 'the ground colour disappeared when a Developer built it').toBe('#2f6f3f');
    expect(enclosureFlora(after).some((f) => f.type === 'rocks'),
      'the rocks somebody put in disappeared when a Developer built it').toBe(true);
  });
});

describe('a move the game decided a moment ago', () => {
  it('builds what is on the card now, not what was on it then', () => {
    // The fault behind two reports five minutes apart: "I still lose the ground colour after going
    // into Look Inside", and "the hedge setting I picked defaults to high fence".
    //
    // A seat played by the game chooses its move on one tick and the reducer applies it on the next.
    // The design travelled inside the action, so it was a photograph of the card taken BEFORE the
    // player chose anything - and the Developers, meaning to help, pasted the old card back over the
    // new one. Everything the player had done in between went with it.
    const { state, pen } = inHand();
    // What the Developers decided a tick ago, with nothing chosen yet.
    const move = aiTurn({ ...state, dayStage: 'building' } as ZooGameState, 'developer');

    // ...and what the player chose in the meantime.
    const mine = { ...presetFor(pen), parts: { barrier: 'hedge' },
      colors: { ...presetFor(pen).colors, ground: '#2f6f3f' } };
    let s = reducer(state, { type: 'SET_DRAFT_DESIGN', id: pen.id, design: mine });
    s = addInside(s, pen.id, 'water');

    // Now the Developers' move lands - carrying the photograph the old code attached to it, which
    // is the whole point: an action that reaches the reducer with a design in it must not be able to
    // paste a teammate's older idea of the card over the player's newer one.
    s = reducer(s, { ...(move!.action as { type: 'BUILD_ITEM'; id: string; byTheGame?: boolean }),
      design: aiDesign(pen) } as never);
    const after = currentDesign(s.backlog.find((it) => it.id === pen.id)!);
    expect(after.parts.barrier, 'the low hedge went back to whatever the game would have chosen').toBe('hedge');
    expect(after.colors?.ground, 'the ground colour was painted over by a teammate').toBe('#2f6f3f');
    expect(enclosureWater(after).length, 'the pool dug in between was lost').toBeGreaterThan(0);
    expect(move?.action?.type, 'the Developers had nothing to build in the first place').toBe('BUILD_ITEM');
  });

  it('carries no design of its own, so there is nothing stale to paste', () => {
    const { state } = inHand();
    const move = aiTurn({ ...state, dayStage: 'building' } as ZooGameState, 'developer');
    expect((move?.action as { design?: unknown }).design,
      'the move still carries a photograph of the card').toBeUndefined();
  });
});
