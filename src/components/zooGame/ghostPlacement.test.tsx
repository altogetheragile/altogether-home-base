import { describe, it, expect } from 'vitest';
import { initialZooState } from './config';
import { footprintFor } from './design';
import type { ZooGameState, BacklogItem } from './types';

// Ghost placement with a verdict.
//
// From the games where this is settled: the thing you are placing follows the cursor as a
// translucent copy, green where it can go and red where it cannot, with the reason on it. No dialog,
// no error after the fact - you can see the answer before you commit to the question.

const state = (): ZooGameState => initialZooState(3);
const enclosure = (): BacklogItem => state().backlog.find((it) => it.category === 'enclosure')!;

describe('placing a habitat', () => {
  it('offers the footprint the park will draw', () => {
    // The ghost is the size the thing will actually be. A preview at the wrong size is a lie about
    // whether it fits, which is the only question the ghost exists to answer.
    const item = enclosure();
    const box = footprintFor(item);
    expect(box.w, 'a habitat has no footprint to preview').toBeGreaterThan(0);
    expect(box.h).toBeGreaterThan(0);
  });
});
