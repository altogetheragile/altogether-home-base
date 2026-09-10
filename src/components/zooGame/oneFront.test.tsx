import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { ENTRANCE, parkNetwork } from './parkNetwork';
import { CANVAS_W, PLAY_H, PROMENADE_Y, FRONT_Y } from './parkLayout';
import type { ZooGameState } from './types';

// Where the park ends, said once.
//
// Reported from playing it: "the drawn path on the build park view extends to the car park; the path
// on the isometric view falls short of the car park." There were three answers to where the front of
// the park is. The plan painted the car park INSIDE the play area, over the bottom 90 of it. The
// isometric view put a promenade in the last 40 and the tarmac beyond PLAY_H entirely. The routing
// walked a line at PLAY_H - 50. So a run drawn onto what looked like tarmac was, in the model, still
// out on the grass - and the two drawings of one park disagreed by ninety pixels.
//
// Two views, one model: if they ever disagree, trust in both goes.

const parked = (): ZooGameState => {
  const s = initialZooState(1);
  const habitat = s.backlog.find((it) => it.category === 'enclosure' && !it.unsized)!;
  return {
    ...s,
    backlog: s.backlog.map((it) => (it.id === habitat.id
      ? { ...it, status: 'open' as const, started: true, pos: { x: 400, y: 200 }, design: { parts: {}, colors: { ground: '#c8a06a' } } }
      : it)),
    // A run from the habitat down to the front of the park.
    connectors: [{
      id: 'run-front', itemId: undefined, a: { x: 400, y: 260 }, b: { x: 400, y: FRONT_Y },
      bends: [], thickness: 14, color: '#c9a86a',
    }],
  } as ZooGameState;
};

describe('the front of the park', () => {
  it('is one measurement, not one per drawing', () => {
    expect(PROMENADE_Y, 'the promenade does not start where the park stops being buildable')
      .toBe(PLAY_H - 40);
    expect(FRONT_Y, 'the way in is not on the promenade').toBeGreaterThan(PROMENADE_Y);
    expect(FRONT_Y, 'the way in is out on the tarmac').toBeLessThanOrEqual(PLAY_H);
  });

  it('is where a visitor comes in, and where the promenade is walked', () => {
    const nav = parkNetwork(parked());
    expect(ENTRANCE.y, 'visitors arrive somewhere other than the front').toBe(FRONT_Y);
    const promenade = nav.paths.find((p) => p[0].x < 40 && p[1].x > CANVAS_W - 40);
    expect(promenade, 'there is no walk along the front at all').toBeTruthy();
    expect(promenade![0].y, 'the promenade is walked somewhere other than the promenade').toBe(FRONT_Y);
  });

  it('is drawn at the same place in the plan as in the isometric view', () => {
    // Both paint a band of promenade and then tarmac beyond the park's own edge. What matters is
    // that neither puts the car park inside the ground you build on.
    const plan = render(<ParkPlan state={parked()} />).container.querySelector('[data-part="park-plan"]')!;
    const [, , , h] = (plan.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect(h, 'the plan stops at the park edge, so the way in is not in the picture')
      .toBeGreaterThan(PLAY_H);
    // The grey the plan paints the car park in starts at the park's edge, not ninety inside it.
    const tarmac = [...plan.querySelectorAll('rect')]
      .find((r) => (r.getAttribute('fill') ?? '').toLowerCase() === '#9aa0a6');
    expect(tarmac, 'the plan draws no car park').toBeTruthy();
    expect(Number(tarmac!.getAttribute('y')), 'the plan paints the car park inside the park')
      .toBe(PLAY_H);
  });

  it('lets a run reach it, in both drawings', () => {
    const s = parked();
    const iso = render(<IsoZoo state={s} onPlaceItem={() => {}} />).container;
    const run = iso.querySelector('[data-conn="run-front"]');
    expect(run, 'the isometric view did not draw the run at all').toBeTruthy();
    // Both drawings take the same end point, so neither can stop short of the other.
    expect(s.connectors![0].b.y, 'the run ends somewhere the isometric view calls grass').toBe(FRONT_Y);
  });
});
