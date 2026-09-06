import { describe, it, expect } from 'vitest';
import { YOURS } from './seatCopy';
import { ownedBy } from './seatRules';

// The line that tells you what your accountability is holding on the screen you are looking at.
// It is the only positive signal there is - the gate in seatRules stays silent unless you reach
// outside your seat - so it has to be there on every phase and it has to agree with what the gate
// actually enforces. It is read off the seat badge; it used to be a band across every screen, all
// Sprint, saying the same thing.

const PHASES = ['refine', 'planning', 'sprint', 'review', 'retro'] as const;

describe('what your accountability holds, screen by screen', () => {
  it('says something on every phase, for every seat', () => {
    for (const seat of ['product_owner', 'scrum_master', 'developer'] as const) {
      for (const phase of PHASES) {
        const line = YOURS[seat][phase] ?? null;
        expect(line, `${seat} has nothing to say on ${phase}`).toBeTruthy();
        expect(line!.length, `${seat} on ${phase} is too terse to teach`).toBeGreaterThan(25);
      }
    }
  });

  it('says nothing when you hold no seat, rather than guessing', () => {
    // Solo play, and observers. Inventing a hat for somebody who is not wearing one would
    // be worse than silence.
    for (const phase of PHASES) expect(YOURS.product_owner[phase], 'a phase says nothing at all').toBeTruthy();
  });

  it('agrees with what the gate enforces', () => {
    // The two would drift silently otherwise: the copy would promise something the gate
    // does not protect, or protect something the copy never mentions.
    expect(ownedBy('product_owner')).toContain('REORDER_IN_ZONE');
    expect(YOURS.product_owner.refine, 'the copy does not mention ordering the Backlog')
      .toMatch(/order/i);

    expect(ownedBy('developer')).toContain('ESTIMATE_ITEM');
    expect(YOURS.developer.refine, 'the copy does not mention sizing')
      .toMatch(/siz/i);

    expect(ownedBy('developer')).toContain('PULL_ITEM');
    expect(YOURS.developer.sprint, 'the copy does not mention pulling your own work')
      .toMatch(/pull/i);
  });
});
