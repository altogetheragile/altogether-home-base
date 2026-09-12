import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { checkCriterion } from './parkChecks';
import { whereItStands, groundSize } from './parkModel';
import { acrossTheWater, spansTheWater, riverY, RIVER_W } from './parkWater';
import { parkNetwork } from './parkNetwork';
import { buildNav, routeAcross } from './parkNav';
import { CANVAS_W, PLAY_H } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// The bridge.
//
// It is the only item in the game with no visitors of its own, which is exactly what makes it hard
// to order above the penguins - and that argument is the reason it exists. What it must NOT be is
// fiddly: a bridge that misses the water by six pixels is a bridge nobody can cross for a reason
// nobody can see, and the lesson turns into a hand-eye test.
//
// So: which part of the river to cross is yours, and lying square across it is the park's. A bridge
// can be unbuilt. It cannot be in the wrong place.

const withBridge = (over: Partial<BacklogItem> = {}): { state: ZooGameState; bridge: BacklogItem } => {
  const base = initialZooState(3) as ZooGameState;
  const found = base.backlog.find((it) => (it.template ?? '') === 'bridge')!;
  const bridge = { ...found, status: 'open' as const, sprintNumber: 1, ...over } as BacklogItem;
  return {
    state: { ...base, phase: 'sprint', sprintNumber: 1,
      backlog: base.backlog.map((it) => (it.id === bridge.id ? bridge : it)) } as ZooGameState,
    bridge,
  };
};

describe('where a bridge stands', () => {
  it('is on the water, whatever the layout or a player aimed at', () => {
    const { state, bridge } = withBridge({ pos: { x: 700, y: 200 } });
    const at = whereItStands(state, bridge)!;
    expect(at.x, 'the park moved it along the river, which is the one choice that is yours').toBe(700);
    expect(Math.abs(at.y - riverY(700)), 'it was left where it was dropped, off the water')
      .toBeLessThan(RIVER_W);
    expect(spansTheWater(groundSize(bridge), at), 'it does not cross the water it is sitting on').toBe(true);
  });

  it('crosses the water wherever along the park it is put', () => {
    // The river wanders, so the middle under one end of a bridge is not the middle under the other.
    // Every x, because a bridge that only works in the shallow half of the park is a trap.
    const { bridge } = withBridge();
    const size = groundSize(bridge);
    for (let x = 120; x <= CANVAS_W - 120; x += 60) {
      const at = acrossTheWater(size, { x, y: PLAY_H / 2 });
      expect(spansTheWater(size, at), `a bridge dropped at x=${x} did not reach both banks`).toBe(true);
    }
  });
});

describe('whether the bridge is finished', () => {
  it('is the park’s answer, not a tick', () => {
    const { state, bridge } = withBridge();
    const v = checkCriterion(state, bridge, 'Can I cross the water on it?');
    expect(v, 'the one item whose job is a fact about the park was left to be ticked').toBeTruthy();
    expect(v!.met, 'a bridge standing across the river does not cross it').toBe(true);
    expect(v!.evidence).toMatch(/bank to bank/i);
  });

  it('says no while it is not on the park yet', () => {
    // The only "no" a bridge can give, and the true one: it has not been built. It cannot be off the
    // water once it is standing, because the park will not stand it anywhere else - which is the
    // whole point of snapping it.
    const { state, bridge } = withBridge({ status: 'committed' });
    const waiting = { ...state, backlog: state.backlog.map((it) => (it.id === bridge.id
      ? { ...it, status: 'committed' as const, started: false } : it)) } as ZooGameState;
    const v = checkCriterion(waiting, { ...bridge, status: 'committed', started: false }, 'Can I cross the water on it?')!;
    expect(v.met, 'a bridge nobody has built crosses the water').toBe(false);
    expect(v.evidence).toMatch(/not on the park yet/i);
  });

  it('is a fact about the ground, so it can say no about a box beside the river', () => {
    // The rule underneath, asked directly: this is what the criterion, the routing and the placing
    // nudge all read, and all three would be wrong together if it were wrong.
    const { bridge } = withBridge();
    const size = groundSize(bridge);
    const dry = { x: 700, y: PLAY_H - 200 };
    expect(spansTheWater(size, dry), 'a bridge on the lawn crosses the water').toBe(false);
    const half = { x: 700, y: riverY(700) - RIVER_W };   // reaches the water and stops: a jetty
    expect(spansTheWater(size, half), 'a bridge to the middle of the river counts as a crossing').toBe(false);
    expect(spansTheWater(size, acrossTheWater(size, dry)), 'snapped, it still does not cross').toBe(true);
  });
});

describe('what a bridge is for', () => {
  it('lets a route cross the water, and there is none without it', () => {
    const { state, bridge } = withBridge();
    const at = whereItStands(state, bridge)!;
    const from = { x: at.x, y: PLAY_H - 120 };      // the visitors' side
    const to = { x: at.x, y: riverY(at.x) - 200 };  // the far bank
    const over = routeAcross(buildNav(parkNetwork(state)), from, to);
    expect(over, 'a built bridge did not let anybody across').toBeTruthy();

    const without = { ...state, backlog: state.backlog.filter((it) => it.id !== bridge.id) } as ZooGameState;
    expect(routeAcross(buildNav(parkNetwork(without)), from, to),
      'the water was crossed with no bridge at all').toBeNull();
  });
});
