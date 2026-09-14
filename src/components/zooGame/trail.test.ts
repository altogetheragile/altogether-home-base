import { describe, it, expect, beforeEach } from 'vitest';
import { remember, trail, forgetTrail, trailStartedAt } from './trail';
import { replay, whenItBroke } from './replay';
import { initialZooState } from './config';
import { startOnTheBoard, addInside } from './engine';
import { currentDesign, enclosureFlora, presetFor } from './design';
import type { ZooGameState, ZooAction } from './types';

// A fault that arrives as a script instead of a description.
//
// The person who finds a fault is not the person who fixes it, and the gap between them is always
// the same sentence: "I think I chose the ground colour, then went inside, and then it was gone."
// That is an honest account and a poor one - memory keeps what it MEANT to do, drops the press that
// did nothing, and never includes the tick where a seat played by the game did something behind it.
// Two of tonight's reports could not be reproduced from a description; both would have been a
// two-minute test from a trail.

beforeEach(() => { forgetTrail(); trailStartedAt(1); });

describe('what the game remembers', () => {
  it('keeps what was pressed, in the order it was pressed', () => {
    remember({ type: 'START' });
    remember({ type: 'START_ITEM', id: 'lion-enc' });
    expect(trail().actions.map((a) => a.type)).toEqual(['START', 'START_ITEM']);
  });

  it('does not keep the clock, which says nothing about what anybody did', () => {
    remember({ type: 'TICK_DAY' });
    remember({ type: 'TICK_SCRUM' });
    remember({ type: 'START_ITEM', id: 'lion-enc' });
    expect(trail().actions.map((a) => a.type), 'a minute of play buried the presses in ticks')
      .toEqual(['START_ITEM']);
  });

  it('keeps the last of a long game, not the first', () => {
    for (let i = 0; i < 200; i += 1) remember({ type: 'START_ITEM', id: `item-${i}` } as ZooAction);
    const kept = trail().actions;
    expect(kept.length, 'it kept a whole session, which nobody can paste').toBeLessThanOrEqual(80);
    expect((kept[kept.length - 1] as { id: string }).id, 'it kept the beginning instead of the end')
      .toBe('item-199');
  });

  it('keeps one entry per gesture, not one per pointer move', () => {
    // The first real trail anybody sent back was sixty entries of which fifty were two drags: the
    // window reached back about a minute, and the fault being reported had happened before it.
    for (let i = 0; i < 40; i += 1) {
      remember({ type: 'MOVE_INSIDE', id: 'lion-enc', kind: 'flora', index: 0, spot: { x: i / 40, y: 0.5 } } as ZooAction);
    }
    remember({ type: 'ADD_INSIDE', id: 'lion-enc', kind: 'tree' } as ZooAction);
    const kept = trail().actions;
    expect(kept.map((a) => a.type), 'a drag filled the window with its own pointer moves')
      .toEqual(['MOVE_INSIDE', 'ADD_INSIDE']);
    // ...and the one it kept is where the piece ended up, which is the only part that is state.
    expect((kept[0] as { spot: { x: number } }).spot.x).toBeCloseTo(39 / 40, 5);
  });

  it('tells two gestures apart, even of the same kind', () => {
    remember({ type: 'MOVE_INSIDE', id: 'lion-enc', kind: 'flora', index: 0, spot: { x: 0.1, y: 0.1 } } as ZooAction);
    remember({ type: 'MOVE_INSIDE', id: 'lion-enc', kind: 'flora', index: 3, spot: { x: 0.2, y: 0.2 } } as ZooAction);
    expect(trail().actions, 'moving a second rock overwrote the first').toHaveLength(2);
  });

  it('carries the seed, so a replay starts where the game did', () => {
    trailStartedAt(7);
    expect(trail().seed).toBe(7);
  });
});

describe('replaying one', () => {
  it('gives the same game back', () => {
    const t = { seed: 1, actions: [{ type: 'START' } as ZooAction] };
    const states = replay(t);
    expect(states).toHaveLength(2);
    expect(states[1].phase, 'the replay did not do what the game did').toBe('sprint');
    expect(replay(t)[1], 'two replays of one trail gave two different games').toEqual(states[1]);
  });

  it('says which press broke it, which is the whole question', () => {
    // Built as the fault we could not reproduce from a description: a habitat with things set up
    // inside it, and then something that empties it. The trail says which action did it.
    const start = startOnTheBoard(initialZooState(1) as ZooGameState);
    const pen = start.backlog.find((it) => it.category === 'enclosure' && it.status === 'committed')!;
    const withStuff = addInside(addInside(start, pen.id, 'water'), pen.id, 'oak');
    expect(enclosureFlora(currentDesign(withStuff.backlog.find((it) => it.id === pen.id)!)).length)
      .toBeGreaterThan(0);

    // A trail that sets it up and then wipes it with a design that has nothing in it.
    const t = {
      seed: 1,
      actions: [
        { type: 'START' },
        { type: 'ADD_INSIDE', id: pen.id, kind: 'water' },
        { type: 'ADD_INSIDE', id: pen.id, kind: 'oak' },
        { type: 'SET_DRAFT_DESIGN', id: pen.id, design: { ...presetFor(pen), flora: [], water: [] } },
      ] as ZooAction[],
    };
    const broke = whenItBroke(t, (s) => {
      const it = s.backlog.find((x) => x.id === pen.id);
      return !!it && enclosureFlora(currentDesign(it)).length > 0;
    });
    expect(broke, 'the trail could not say when it went').toBeTruthy();
    expect(broke!.action, 'it blamed the wrong press').toBe('SET_DRAFT_DESIGN');
  });

  it('says nothing when nothing broke', () => {
    const t = { seed: 1, actions: [{ type: 'START' } as ZooAction] };
    expect(whenItBroke(t, () => true), 'it found a fault in a game that had none').toBeNull();
  });
});
