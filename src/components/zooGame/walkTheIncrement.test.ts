import { describe, it, expect } from 'vitest';
import { deliveredThisSprint, walkTo, parkNetwork, ENTRANCE } from './parkNetwork';
import { initialZooState } from './config';
import { presetFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// The tour follows a visitor, so it has to know where a visitor can go.
//
// One definition of the walkable park, read off the model: the runs the Developers laid, the
// walkway round every habitat, the promenade and the way in. Water stops people; a bridge is the
// door through it; habitats are walked around rather than through. Both the drawing and the tour
// ask this same function, so they cannot disagree about the zoo they are showing.

const sprint = (over: Partial<ZooGameState> = {}): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1, ...over,
} as ZooGameState);

/** Something delivered this Sprint, standing where it was put. */
const delivered = (s: ZooGameState, id: string, pos: { x: number; y: number }): ZooGameState => ({
  ...s,
  backlog: s.backlog.map((it) => (it.id === id
    ? { ...it, status: 'open' as const, sprintNumber: 1, openedIn: 1, design: presetFor(it), pos }
    : it)),
} as ZooGameState);

const habitat = (s: ZooGameState): BacklogItem => s.backlog.find((it) => it.category === 'enclosure')!;

describe('the walkable park', () => {
  it('lets a visitor reach a habitat standing in the open', () => {
    const s = sprint();
    const h = habitat(s);
    const built = delivered(s, h.id, { x: 400, y: 300 });
    expect(walkTo(built, built.backlog.find((it) => it.id === h.id)!),
      'nobody could walk to a habitat in the middle of an empty park').toBeTruthy();
  });

  it('walks round a habitat rather than through it', () => {
    const s = sprint();
    const h = habitat(s);
    const built = delivered(s, h.id, { x: 400, y: 300 });
    const net = parkNetwork(built);
    expect(net.solid?.length, 'a habitat is not something to walk around').toBeGreaterThan(0);
    expect(net.paths.some((p) => p.length > 1), 'there is nowhere to walk at all').toBe(true);
  });

  it('starts the tour at the way in', () => {
    expect(ENTRANCE.y).toBeGreaterThan(400);
  });
});

describe('what was delivered this Sprint', () => {
  it('is what the tour stops at, nearest to the gate first', () => {
    const s = sprint();
    const h = habitat(s);
    const near = delivered(s, h.id, { x: 400, y: 460 });
    const other = near.backlog.find((it) => it.category === 'amenity')!;
    const both = delivered(near, other.id, { x: 120, y: 120 });
    const stops = deliveredThisSprint(both);
    expect(stops.length, 'nothing delivered turned up on the tour').toBeGreaterThan(1);
    expect(stops[0].item.id, 'the tour started at the far end of the park').toBe(h.id);
    expect(stops.every((x) => x.item.status === 'open' || x.item.status === 'done'),
      'the tour is showing work that is not delivered').toBe(true);
  });

  it('says when something delivered cannot be reached at all', () => {
    // The part of the tour worth stopping on: a thing that was built, accepted, opened - and that
    // nobody can get to, because the river runs between it and the gate with no bridge over it.
    const s = sprint();
    const h = habitat(s);
    const river = s.backlog.find((it) => it.category === 'flora' && /river/i.test(it.template ?? ''))
      ?? s.backlog.find((it) => it.category === 'flora')!;
    let game = delivered(s, h.id, { x: 400, y: 140 });
    game = {
      ...game,
      backlog: game.backlog.map((it) => (it.id === river.id
        ? { ...it, status: 'open' as const, design: { ...presetFor(it), parts: { type: 'river' } },
            pos: { x: 410, y: 330 }, size: { w: 1400, h: 90 } }
        : it)),
    } as ZooGameState;
    const cut = deliveredThisSprint(game).find((x) => x.item.id === h.id)!;
    expect(cut.reachable, 'a habitat cut off by a river read as reachable').toBe(false);
  });
});
