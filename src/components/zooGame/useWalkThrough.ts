import { useEffect, useState } from 'react';
import type { ZooGameState } from './types';
import { walkStops, canWalk, HOLD_MS, TRAVEL_MS, type WalkStop } from './walkThrough';

// The tour, running: which stop the camera is on, and when it moves to the next.
//
// Nothing here is memoised by hand. This codebase compiles with the React Compiler, which does the
// memoising, and a `useCallback` it cannot verify is a warning; worse, a plain function in an
// effect's dependencies re-runs that effect on every render - and this effect owns a timer, so the
// tour would restart every time the day's clock ticked and never reach the second stop. The state
// machine is `at` and nothing else, and only `at` and the stops are depended on.

export interface Walk {
  walking: boolean;
  /** Where the camera is looking, for the picture to act on. */
  camera: { x: number; y: number; zoom: number } | null;
  showing: WalkStop | null;
  at: number;
  total: number;
  /** Whether this Sprint delivered anything worth walking. */
  ready: boolean;
  start: () => void;
  end: () => void;
}

export function useWalkThrough(state: ZooGameState): Walk {
  const [stops, setStops] = useState<WalkStop[]>([]);
  const [at, setAt] = useState(-1);
  const walking = at >= 0 && at < stops.length;

  // Rest on this stop, then move on. The tour ends after the last one rather than snapping back to
  // the gate, so it finishes on something built.
  useEffect(() => {
    if (at < 0 || at >= stops.length) return;
    const t = setTimeout(() => setAt((n) => (n + 1 < stops.length ? n + 1 : -1)), HOLD_MS + TRAVEL_MS);
    return () => clearTimeout(t);
  }, [at, stops]);

  const showing = walking ? stops[at] : null;
  return {
    walking,
    camera: showing ? { ...showing.at, zoom: showing.zoom } : null,
    showing,
    at,
    total: stops.length,
    ready: canWalk(state),
    start: () => {
      const list = walkStops(state);
      if (!list.length) return;
      setStops(list);
      setAt(0);
    },
    end: () => setAt(-1),
  };
}
