import { describe, it, expect } from 'vitest';
import { whatIsYours } from './seatCopy';
import { ownedBy } from './seatRules';

// The line that tells you what your accountability is holding on the screen you are looking
// at. It is the only positive signal there is - the gate in seatRules stays silent unless
// you reach outside your seat - so it has to be there on every phase and it has to agree
// with what the gate actually enforces.

const PHASES = ['refine', 'planning', 'sprint', 'review', 'retro'] as const;

describe('what your accountability holds, screen by screen', () => {
  it('says something on every phase, for every seat', () => {
    for (const seat of ['product_owner', 'scrum_master', 'developer'] as const) {
      for (const phase of PHASES) {
        const line = whatIsYours(seat, phase);
        expect(line, `${seat} has nothing to say on ${phase}`).toBeTruthy();
        expect(line!.length, `${seat} on ${phase} is too terse to teach`).toBeGreaterThan(25);
      }
    }
  });

  it('says nothing when you hold no seat, rather than guessing', () => {
    // Solo play, and observers. Inventing a hat for somebody who is not wearing one would
    // be worse than silence.
    for (const phase of PHASES) expect(whatIsYours(null, phase)).toBeNull();
  });

  it('agrees with what the gate enforces', () => {
    // The two would drift silently otherwise: the copy would promise something the gate
    // does not protect, or protect something the copy never mentions.
    expect(ownedBy('product_owner')).toContain('REORDER_IN_ZONE');
    expect(whatIsYours('product_owner', 'refine'), 'the copy does not mention ordering the Backlog')
      .toMatch(/order/i);

    expect(ownedBy('developer')).toContain('ESTIMATE_ITEM');
    expect(whatIsYours('developer', 'refine'), 'the copy does not mention sizing')
      .toMatch(/siz/i);

    expect(ownedBy('developer')).toContain('PULL_ITEM');
    expect(whatIsYours('developer', 'sprint'), 'the copy does not mention pulling your own work')
      .toMatch(/pull/i);
  });
});
