import { useSyncExternalStore } from 'react';

// The widths the split panes come apart at, and whether the window is that wide now. Kept apart
// from `SplitPanes` so a screen can ask without importing the component.

export const WIDTH = { md: 768, lg: 1024, xl: 1280 } as const;

export function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    (on) => {
      const mq = typeof window !== 'undefined' ? window.matchMedia?.(`(min-width: ${px}px)`) : undefined;
      mq?.addEventListener?.('change', on);
      return () => mq?.removeEventListener?.('change', on);
    },
    () => (typeof window !== 'undefined' && !!window.matchMedia?.(`(min-width: ${px}px)`).matches),
    () => false,
  );
}

/** Whether the panes are side by side at this width, for a screen that puts something in a
 *  different place when they are. */
export const useSplit = (from: keyof typeof WIDTH = 'lg'): boolean => useMinWidth(WIDTH[from]);

