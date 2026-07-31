// Small deterministic RNG (mulberry32) so the whole simulation is a pure function
// of its seed. Same seed, same sequence: this is what makes the sim testable and
// keeps replays reproducible.

export interface SeededRng {
  /** Next float in [0, 1). */
  next(): number;
}

export function makeRng(seed: number): SeededRng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Fold a string (e.g. an item or segment id) into a seed, so per-entity noise is
 *  stable within a game but varies across ids. */
export function hashStr(str: string, seed = 0): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
