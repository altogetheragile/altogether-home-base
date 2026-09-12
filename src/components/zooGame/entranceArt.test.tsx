import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IsoZoo } from './IsoZoo';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { CANVAS_W, FRONT_Y } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// The way in is a structure, not a patch of ground.
//
// Reported from playing it: "the entrance structure is not right." It was not a structure at all -
// an entrance fell through to the flat coloured diamond that every piece of landscape gets, which
// is right for a pond and says nothing here. The first thing a visitor meets, and the thing the car
// park points at, was a green square on green grass with a label floating over it.
//
// The same fault the river and the bridge each had in their turn, which is why this is a test and
// not a tidy-up: every new piece of landscape arrives drawn as "some planting" until somebody
// notices, and the ones that are not planting are the ones people look for.

const gate = (): BacklogItem => ({
  id: 'gate', name: 'Entrance', category: 'flora', template: 'entrance', zone: 'Grounds',
  status: 'open', sprintNumber: 1, estimate: 2, acceptance: [], acConfirmed: [], tasks: [],
  design: { parts: { type: 'entrance' }, colors: {} }, pos: { x: CANVAS_W / 2, y: FRONT_Y - 60 },
} as unknown as BacklogItem);

const parkWith = (item: BacklogItem): ZooGameState => {
  const base = initialZooState(3) as ZooGameState;
  return { ...base, backlog: [...base.backlog, item] } as ZooGameState;
};

describe('the entrance in the Increment', () => {
  it('is built: piers, a banner across them, and a forecourt', () => {
    const { container } = render(<IsoZoo state={parkWith(gate())} height={420} width={800} />);
    const built = container.querySelector('[data-part="gateway"]');
    expect(built, 'the entrance was drawn as a patch of ground, like planting').toBeTruthy();
    // Two piers and a banner is six faces, plus the forecourt: enough that it reads as a thing you
    // walk through rather than a coloured square.
    expect(built!.querySelectorAll('polygon').length,
      'it has no structure to it - one flat shape is what it used to be').toBeGreaterThanOrEqual(7);
    expect(built!.querySelectorAll('line').length,
      'nothing on the banner says it is a sign').toBeGreaterThan(0);
  });
});

describe('the entrance on the plan', () => {
  it('is not drawn as planting', () => {
    const { container } = render(<ParkPlan state={parkWith(gate())} />);
    const drawn = container.querySelector('[data-plan-item="gate"]');
    expect(drawn, 'the entrance is not on the plan at all').toBeTruthy();
    // The colour is the whole of what the plan says about a thing: it tells a river from a bridge
    // from a rock by its fill, and everything it does not recognise falls back to the flora green.
    const fills = [...drawn!.querySelectorAll('[fill]')].map((el) => el.getAttribute('fill'));
    expect(fills, 'the way in is drawn as a shrub').not.toContain('#cfe0c2');
    expect(fills.some((f) => f === '#d9d3c7'), 'the way in is not drawn as paving').toBe(true);
  });
});
