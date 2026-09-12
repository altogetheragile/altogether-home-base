import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import type { ZooGameState, BacklogItem } from './types';

// One colour, both drawings, while the work is still in hand.
//
// The plan painted its animals from `item.design` and the Increment from `draftDesign ?? design`.
// So for the whole time an animal was being built - which is the whole time anybody is choosing its
// colour - the two views disagreed about what colour it was: you pick Black, the Increment goes
// black, the plan stays tawny. Whichever one you happen to be looking at is the one that seems
// broken, and that is how this was reported: "I'm not seeing a change in colour."
//
// It is the same fault the park keeps producing - one thing with two definitions - and the same fix:
// both views ask what the design IS now, which is the draft when there is one.

const part = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);

/** A habitat that is Done, with its lion still in hand and painted black - a draft, not delivered. */
const beingStocked = (): ZooGameState => ({
  ...initialZooState(), zones: ['Big Cats'],
  backlog: [
    part({ id: 'enc', name: 'Lion Enclosure', status: 'done', started: true, sprintNumber: 1,
      enclosureSize: 'large', pos: { x: 400, y: 800 },
      design: { parts: {}, colors: { ground: '#c9a86a', fence: '#8fa3b0' } } }),
    part({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
      status: 'committed', started: true, sprintNumber: 1,
      design: { parts: {}, colors: {}, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } },
      draftDesign: { parts: {}, colors: { coat: '#2a2622' }, group: { males: 1, females: 1, juveniles: 0, cubs: 0 } } }),
  ],
} as unknown as ZooGameState);

describe('an animal being painted while it is in hand', () => {
  it('is the chosen colour on the plan', () => {
    const { container } = render(<ParkPlan state={beingStocked()} />);
    const dots = [...container.querySelectorAll('[data-animal^="lion-"]')];
    expect(dots.length, 'the plan draws no animals in the habitat').toBeGreaterThan(0);
    for (const d of dots) {
      expect(d.getAttribute('fill'), 'the plan is drawing the colour it was last delivered in')
        .toBe('#2a2622');
    }
  });

  it('is the chosen colour in the Increment', () => {
    const svg = render(<IsoZoo state={beingStocked()} height={460} />).container.querySelector('svg[role="img"]')!;
    const lions = [...svg.querySelectorAll('[data-spot^="lion:"]')];
    expect(lions.length, 'the Increment draws no lion').toBeGreaterThan(0);
    for (const g of lions) {
      expect(g.getAttribute('filter'), 'the Increment left the lion as drawn').toBeTruthy();
    }
  });
});
