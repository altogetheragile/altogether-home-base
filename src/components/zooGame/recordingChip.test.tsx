import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { RecordingChip } from './RecordingChip';
import { recordEverything, remember, forgetTrail } from './trail';

// The recorder says it is on, and says how much it has.
//
// It is about to be trusted with somebody's careful twenty-minute build of a zoo to show people.
// "Is this thing on?" is a question that should be answered on the screen before those twenty
// minutes are spent, not after them.

afterEach(() => { forgetTrail(); recordEverything(false); vi.useRealTimers(); });

const press = (n: number) => ({ type: 'SET_PHASE', phase: `p${n}` } as never);

describe('the recording chip', () => {
  it('stays out of the way of an ordinary game', () => {
    recordEverything(false);
    const { container } = render(<RecordingChip />);
    expect(container.textContent, 'it tells an ordinary player they are being recorded').toBe('');
  });

  it('says it is recording, and how many presses it has', () => {
    vi.useFakeTimers();
    forgetTrail();
    recordEverything(true);
    for (let i = 0; i < 7; i++) remember(press(i));
    const { container } = render(<RecordingChip />);
    // It reads the trail on a timer rather than during render: recording is switched on by an
    // effect in the game's own hook, and asking too early is told no on the first paint.
    act(() => { vi.advanceTimersByTime(500); });
    expect(container.textContent).toContain('Recording');
    expect(container.querySelector('[data-part="trail-steps"]')?.textContent,
      'it does not say how much it has').toBe('7');
    expect(container.querySelector('[data-part="copy-trail"]'), 'there is no way to get it out').toBeTruthy();
  });
});
