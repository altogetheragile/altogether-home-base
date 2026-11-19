import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePen } from './usePen';

// The fourteenth scrum-master playtest drew a path for the Lion Enclosure, moved on to the Lion
// from the board, and the pen stayed out over an animal for the rest of the run.
describe('the pen', () => {
  it('is put away when the work in hand changes', () => {
    const { result, rerender } = renderHook(({ id }) => usePen(id), { initialProps: { id: 'lion-enclosure' as string | null } });
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    rerender({ id: 'lion' });
    expect(result.current[0], 'the pen is still out for the last thing').toBe(false);
  });

  it('stays out while the same work is in hand', () => {
    const { result, rerender } = renderHook(({ id }) => usePen(id), { initialProps: { id: 'lion-enclosure' as string | null } });
    act(() => result.current[1](true));
    rerender({ id: 'lion-enclosure' });
    expect(result.current[0]).toBe(true);
  });
});
