import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SprintReview } from './SprintReview';
import { initialZooState } from './config';
import { reviewSprint, zoneSlices } from './engine';
import { whatVisitorsCanReach } from './parkNetwork';
import { zonePlots, plotOrder } from './parkZones';
import { riverCourse, RIVER_Y } from './parkWater';
import { FRONT_Y } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// A zoo is not paid for what it built. It is paid for what a visitor could walk up to.
//
// This is what the river is FOR, and it only teaches anything if the Sprint Review makes it bite.
// Ground on the far bank cannot be reached until somebody builds a bridge - so "open the Penguins"
// quietly depends on a piece of work with no visitors of its own, which is the hardest thing for a
// Product Owner to order above the thing everyone actually wants. Deliver the habitat, deliver the
// animal, open the gates, and watch six hundred people stand on the wrong side of the water.
//
// The rule underneath all three of the game's consequences is the same one: what is finished and
// what is reachable are different things, and the Review is where the difference is paid for.

const far = () => {
  const s = initialZooState(3);
  return [...zonePlots(s).values()].find((p) => p.y1 < RIVER_Y)!;
};
const near = () => zonePlots(initialZooState(3)).get(plotOrder(initialZooState(3))[0])!;

/** A zoo with a habitat and its animal delivered in the given area, plus whatever else is passed. */
const zoo = (plot: { zone: string; x0: number; y0: number; x1: number; y1: number },
  extra: BacklogItem[] = []): ZooGameState => {
  const base = initialZooState(3);
  const at = { x: (plot.x0 + plot.x1) / 2, y: (plot.y0 + plot.y1) / 2 };
  const open = (it: Partial<BacklogItem>): BacklogItem => ({
    zone: plot.zone, status: 'open', started: true, sprintNumber: 1, estimate: 5,
    acceptance: [], acConfirmed: [], tasks: [], ...it,
  } as BacklogItem);
  return {
    ...base, phase: 'sprint', sprintNumber: 1,
    backlog: [
      open({ id: 'enc', name: `${plot.zone} Enclosure`, category: 'enclosure', enclosureSize: 'medium', pos: at }),
      open({ id: 'beast', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
        appeal: { families: 8, enthusiasts: 7, comfortSeekers: 6 } }),
      ...extra,
    ],
    // The run that joins it to the way in. It used to be a Product Backlog item of its own; it is
    // the habitat's own acceptance criterion now, and these zoos are ones where it was laid.
    connectors: [{ id: 'r-in', itemId: 'enc', a: { x: at.x, y: FRONT_Y }, b: { x: at.x, y: at.y + 60 },
      bends: [], thickness: 14, color: '#c9a86a' }],
  } as unknown as ZooGameState;
};

const bridge = (): BacklogItem => {
  const mid = riverCourse()[Math.floor(riverCourse().length / 2)];
  return {
    id: 'bridge', name: 'Bridge', zone: 'Grounds', category: 'flora', template: 'bridge',
    status: 'open', started: true, sprintNumber: 1, estimate: 3, acceptance: [], acConfirmed: [], tasks: [],
    design: { parts: { type: 'bridge' }, colors: {} }, pos: { x: mid.x, y: mid.y },
  } as unknown as BacklogItem;
};

/** Runs of path from the way in, over the water, to the habitat. */
const pathsTo = (plot: { x0: number; y0: number; x1: number; y1: number }) => {
  const mid = riverCourse()[Math.floor(riverCourse().length / 2)];
  const at = { x: (plot.x0 + plot.x1) / 2, y: (plot.y0 + plot.y1) / 2 };
  return [
    { id: 'r1', itemId: 'zone-paths', a: { x: mid.x, y: FRONT_Y }, b: { x: mid.x, y: mid.y }, bends: [], thickness: 14, color: '#c9a86a' },
    { id: 'r2', itemId: 'zone-paths', a: { x: mid.x, y: mid.y }, b: { x: at.x, y: at.y + 71 }, bends: [], thickness: 14, color: '#c9a86a' },
  ];
};

describe('work nobody can walk to', () => {
  it('is not an open zone, however finished it is', () => {
    const s = zoo(far());
    const slice = zoneSlices(s).find((z) => z.zone === far().zone)!;
    expect(slice.open, 'a zone across the water counted as open to visitors').toBe(false);
    expect(slice.missing.join(' '), 'the Review does not say what would fix it').toMatch(/bridge/i);
  });

  it('is open once there is a bridge and a path over it', () => {
    const plot = far();
    const s = { ...zoo(plot, [bridge()]), connectors: pathsTo(plot) } as unknown as ZooGameState;
    const slice = zoneSlices(s).find((z) => z.zone === plot.zone)!;
    expect(slice.open, 'the bridge and the path are both built and nobody can visit').toBe(true);
  });

  it('is the near bank’s business too: this side needs no bridge', () => {
    const plot = near();
    const s = zoo(plot);
    expect(zoneSlices(s).find((z) => z.zone === plot.zone)!.open,
      'the area the zoo opens first needs a bridge, and it must not').toBe(true);
  });
});

describe('what the Sprint Review pays for', () => {
  it('pays nothing for an exhibit on the far bank', () => {
    // The consequence with teeth. Scored anyway, the bridge is a nicety; scored honestly, leaving it
    // at the bottom of the Product Backlog is a Sprint's work nobody saw.
    const plot = far();
    const stranded = reviewSprint(zoo(plot));
    const reached = reviewSprint({ ...zoo(plot, [bridge()]), connectors: pathsTo(plot) } as unknown as ZooGameState);
    expect(stranded.lastReview!.overallHappiness,
      'visitors were delighted by an exhibit they could not reach')
      .toBeLessThan(reached.lastReview!.overallHappiness);
  });

  it('still counts the work as delivered - it is reach that is missing, not effort', () => {
    // Velocity is what the Developers finished. The zoo not being paid for it is a different fact,
    // and rolling the two together would teach that unreachable work was never done.
    const after = reviewSprint(zoo(far()));
    expect(after.velocity[after.velocity.length - 1], 'the Sprint delivered nothing, apparently').toBeGreaterThan(0);
  });
});

describe('the Review says so out loud', () => {
  it('names what could not be reached, and why', () => {
    const s = { ...reviewSprint(zoo(far())), phase: 'review' } as ZooGameState;
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={s} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    const said = container.querySelector('[data-part="stranded"]');
    expect(said, 'the Review said nothing about work nobody could get to').toBeTruthy();
    expect(said!.textContent, 'it does not name the thing that was out of reach').toMatch(/Lion/);
    expect(said!.textContent, 'a visitor does not say what stopped them').toMatch(/river|cross/i);
  });

  it('says nothing when everything can be reached', () => {
    const plot = near();
    const s = { ...reviewSprint(zoo(plot)), phase: 'review' } as ZooGameState;
    expect(whatVisitorsCanReach(s).stranded, 'something on the near bank was cut off').toHaveLength(0);
    const { container } = render(
      <MemoryRouter>
        <SprintReview state={s} onContinue={() => {}} onOpen={() => {}}
          onToggleTask={() => {}} onTakeSignal={() => {}} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-part="stranded"]'),
      'a Review that went well is complaining about access').toBeNull();
  });
});
