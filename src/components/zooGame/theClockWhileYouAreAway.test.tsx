import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import { DayClock } from './DayClock';
import { useTabAway, awayText } from './useTabAway';
import { useZooGame } from './useZooGame';
import { initialZooState, DAY_SECONDS } from './config';
import type { ZooGameState } from './types';

// The day, while nobody is looking at it.
//
// The day is counted in TICKS - setInterval dispatches TICK_DAY and the reducer takes a second off.
// Nothing reads a wall clock. A browser throttles a hidden tab's interval to about once a minute
// rather than stopping it, so the day did not pause while somebody was in another tab, it CRAWLED:
//
//   "It has been Sprint 3 for a few hours now with minimal changes to the clock."
//
// Sixty seconds of real time buying one second of the day, and how long a day lasts coming down to
// a power setting. A day being a fixed timebox is the thing this clock exists to teach.

/** Hide or show the tab the way a browser does. */
const look = (where: 'away' | 'back') => {
  Object.defineProperty(document, 'visibilityState', {
    value: where === 'away' ? 'hidden' : 'visible', configurable: true,
  });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
};

afterEach(() => { look('back'); vi.useRealTimers(); });

describe('stepping away', () => {
  it('is noticed, and so is coming back', () => {
    const { result } = renderHook(() => useTabAway());
    expect(result.current.hidden, 'the tab starts out hidden, which it is not').toBe(false);
    look('away');
    expect(result.current.hidden, 'nothing noticed the tab going into the background').toBe(true);
    look('back');
    expect(result.current.hidden).toBe(false);
  });

  it('is not reported for a glance at another window', () => {
    // Every alt-tab carrying a note about it is noise, and noise is what gets ignored.
    const { result } = renderHook(() => useTabAway());
    look('away');
    look('back');
    expect(result.current.awayFor, 'a two-second glance was announced as being away').toBeNull();
  });

  it('is reported, with how long, once it is long enough to matter', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTabAway());
    look('away');
    act(() => { vi.advanceTimersByTime(4 * 60 * 1000); });
    look('back');
    expect(result.current.awayFor, 'four minutes away went unmentioned').toBeGreaterThanOrEqual(230);
  });
});

describe('the day while the tab is in the background', () => {
  it('does not run', () => {
    // The whole of it. `ticking` is what puts a heartbeat on the day, and a hidden tab must not
    // have one - a throttled heartbeat is worse than none, because it looks like the game is
    // working and silently charges a minute of real time for a second of the Sprint.
    vi.useFakeTimers();
    const playing = { ...initialZooState(1), phase: 'sprint', dayStage: 'building' } as ZooGameState;
    const { result } = renderHook(() => useZooGame(1));
    act(() => { result.current.loadGame(playing); });
    const before = result.current.state.daySecondsLeft;

    look('away');
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(result.current.state.daySecondsLeft, 'the day ran on with nobody watching it')
      .toBe(before);

    look('back');
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.state.daySecondsLeft, 'the day did not start again when it was looked at')
      .toBeLessThan(before);
  });
});

describe('what the clock says when you come back', () => {
  const clock = () => render(
    <DayClock state={{ ...initialZooState(1), phase: 'sprint', dayStage: 'building',
      daySecondsLeft: DAY_SECONDS } as ZooGameState} />,
  ).container;

  it('says nothing while you are simply there', () => {
    expect(clock().querySelector('[data-part="clock-was-held"]'),
      'it claims you were away when you were not').toBeNull();
  });

  it('says what it did, and for how long', () => {
    // It could not be read while it applied, so it is said afterwards. A clock that silently stops
    // is a clock somebody stops trusting - and this one stopping IS correct, which is the point.
    vi.useFakeTimers();
    const c = clock();
    look('away');
    act(() => { vi.advanceTimersByTime(4 * 60 * 1000); });
    look('back');
    const said = c.querySelector('[data-part="clock-was-held"]')?.textContent ?? '';
    expect(said, 'coming back after four minutes, the clock said nothing about the gap')
      .toMatch(/held for/i);
    expect(said, 'it does not say how long').toMatch(/4 minutes/);
    expect(said, 'it reads as though somebody pressed hold').not.toMatch(/nothing is running/);
  });
});

describe('how long it says', () => {
  it('is said the way a person would say it', () => {
    expect(awayText(1)).toBe('1 second');
    expect(awayText(40)).toBe('40 seconds');
    expect(awayText(240)).toBe('4 minutes');
    // One of each, because a singular nothing can reach is dead code wearing a kindness.
    expect(awayText(60)).toBe('1 minute');
    expect(awayText(89)).toBe('1 minute');
    expect(awayText(7200)).toBe('2 hours');
  });
});
