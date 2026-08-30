import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useAiSeats } from './useZooSession';
import type { SeatName } from './useZooSessions';
import type { ZooAction, ZooGameState } from './types';

// The beat a seat played by the game works to, while the shared clock is running.
//
// During a Sprint the clock rewrites the game state once a second. The AI seats used to be
// scheduled by an effect that took the state as a dependency, so every tick tore the pending
// move down and started its wait again - and any move whose beat was longer than a second
// could never land. Building is exactly that move. The Developers would forecast, plan and
// pull work, and then build none of it: an item sat in Doing for a whole day and nothing was
// said, because a move that never fires says nothing either.
//
// So this test is about arrival under churn rather than about the AI's judgement: state
// changing under the seats must not stop them working.

/** A session whose state object is replaced on every tick, the way the clock replaces it. */
function fakeSession(moves: { seat: SeatName; action: ZooAction; weight?: number }[]) {
  const sent: { seat: SeatName; action: ZooAction }[] = [];
  let state = { tick: 0 } as unknown as ZooGameState;
  return {
    sent,
    tick: () => { state = { ...state, tick: (state as unknown as { tick: number }).tick + 1 } as unknown as ZooGameState; },
    get session() {
      return {
        state,
        drivesClock: true,
        sendAs: (seat: SeatName, action: ZooAction) => { sent.push({ seat, action }); },
      } as unknown as Parameters<typeof useAiSeats>[0];
    },
    moves,
  };
}

vi.mock('./aiSeats', async (orig) => {
  const real = await orig<typeof import('./aiSeats')>();
  return {
    ...real,
    // One move, and it is a heavy one: a build, which is what has the long beat.
    aiTurn: (_s: ZooGameState, seat: SeatName) =>
      seat === 'developer'
        ? { action: { type: 'BUILD_ITEM', id: 'x', design: {} } as unknown as ZooAction,
            says: 'Built it.', weight: 5 }
        : null,
  };
});

vi.mock('./engine', async (orig) => {
  const real = await orig<typeof import('./engine')>();
  return { ...real, secondsPerPoint: () => 10 };
});

describe('a seat played by the game, while the clock is running', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('lands a slow move even though the clock rewrites the state every second', () => {
    const fake = fakeSession([]);
    const { rerender } = renderHook(() => useAiSeats(fake.session, ['developer']));

    // Six seconds of Sprint: the clock replaces the state once a second, and the build's own
    // beat is longer than that. Before the fix, nothing was ever sent.
    for (let s = 0; s < 6; s++) {
      act(() => { vi.advanceTimersByTime(1000); });
      fake.tick();
      rerender();
    }

    const built = fake.sent.filter((x) => x.action.type === 'BUILD_ITEM');
    expect(built.length,
      'the Developers never built anything: a move slower than the clock never lands').toBeGreaterThan(0);
    // ...and the work is charged to the day, the way a person's would be.
    expect(fake.sent.some((x) => x.action.type === 'SPEND_DAY'),
      'the build was free: nothing was charged to the day').toBe(true);
  });
});
