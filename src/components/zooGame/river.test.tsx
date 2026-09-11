import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState, starterBacklog } from './config';
import { riverCourse, riverBand, riverY, waterRects, onWater, inWater, RIVER_Y } from './parkWater';
import { zonePlots, plotOrder } from './parkZones';
import { walkTo } from './parkNetwork';
import { CANVAS_W, PLAY_H, FRONT_Y } from './parkLayout';
import { RIVER_LEN } from './design';
import type { ZooGameState, BacklogItem } from './types';

// The river was here before the zoo was.
//
// It is terrain, not work: nobody builds it, it is on nobody's Product Backlog, and it cannot be
// moved. That is the point of it. A constraint the Scrum Team is handed rather than one they chose
// is what most constraints on a real product are, and this one buys the game its clearest lesson
// about enabling work - ground on the far side cannot be reached until somebody builds a bridge, so
// "open the Penguins" quietly depends on a piece of work with no visitors of its own.
//
// The area the zoo opens first is on this side of the water, so Sprint 1 is dry.

const built = (over: Partial<BacklogItem> = {}): BacklogItem => ({
  id: 'bridge', name: 'Bridge', zone: 'Grounds', category: 'flora', template: 'bridge',
  status: 'open', acceptance: [], acConfirmed: [], tasks: [],
  design: { parts: { type: 'bridge' }, colors: {} },
  ...over,
} as BacklogItem);

/** A zoo with a habitat standing in the given area, and whatever else is passed in. */
const zooWith = (zone: string, extra: BacklogItem[] = []): ZooGameState => {
  const base = initialZooState(3);
  const plot = zonePlots(base).get(zone)!;
  return {
    ...base, phase: 'sprint',
    backlog: [
      { id: 'enc', name: `${zone} Enclosure`, zone, category: 'enclosure', enclosureSize: 'medium',
        status: 'open', acceptance: [], acConfirmed: [], tasks: [],
        pos: { x: (plot.x0 + plot.x1) / 2, y: (plot.y0 + plot.y1) / 2 } } as unknown as BacklogItem,
      ...extra,
    ],
  } as ZooGameState;
};

describe('the river', () => {
  it('is nobody’s work - it is not on the Product Backlog at all', () => {
    const items = starterBacklog();
    expect(items.some((it) => it.template === 'river'),
      'the river is something to build again').toBe(false);
    expect(items.some((it) => it.template === 'bridge'),
      'there is nothing to cross it with').toBe(true);
  });

  it('runs from one bank of the park to the other', () => {
    const course = riverCourse();
    expect(Math.min(...course.map((p) => p.x)), 'the river starts inside the park').toBeLessThanOrEqual(0);
    expect(Math.max(...course.map((p) => p.x)), 'the river stops short of the far bank').toBeGreaterThanOrEqual(CANVAS_W);
  });

  it('takes the same course every time it is drawn', () => {
    // Terrain, not weather.
    expect(riverCourse()).toEqual(riverCourse());
  });

  it('is one river, however finely anybody looks at it', () => {
    // It was not. The wander was worked out per sample, so asking for the course at a different step
    // gave a different course: the plan drew one river and the routing walked another, and guests
    // were stopped on ground the plan drew as grass. Whatever the step, it is the same water.
    const rects = waterRects();
    const inAny = (p: { x: number; y: number }) => rects.some((r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1);
    for (let x = 10; x < CANVAS_W - 10; x += 7) {
      expect(inAny({ x, y: riverY(x) }), `the routing has no water at ${x}, where the river is drawn`).toBe(true);
      expect(inAny({ x, y: riverY(x) - 70 }), `the routing has water at ${x}, well clear of the river`).toBe(false);
    }
  });

  it('winds, rather than running straight across', () => {
    const ys = riverCourse().map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys), 'the river is a canal').toBeGreaterThan(20);
  });
});

describe('a river somebody adds as scenery', () => {
  it('is still cut long enough to cross the park at any angle', () => {
    // Not the terrain river - the pond-and-stream kind, from the toolbox. It is cut to a fixed
    // length and clipped to the park, so it has to be longer than the park's diagonal or turning it
    // leaves a gap at one end. The park has grown once already; this is what notices the next time.
    // Turned to 45 degrees, crossing a park W wide takes W times root two - which is longer than
    // the park's diagonal, and is the number that caught this when the plot grew.
    expect(RIVER_LEN, 'a river no longer reaches across the park it is drawn on')
      .toBeGreaterThanOrEqual(Math.max(CANVAS_W, PLAY_H) * Math.SQRT2);
  });
});

describe('the zoo laid out around it', () => {
  it('builds no area on the water', () => {
    const band = riverBand();
    for (const p of zonePlots(initialZooState(3)).values()) {
      const clear = p.y1 <= band.y0 || p.y0 >= band.y1;
      expect(clear, `the ${p.zone} is laid out across the river`).toBe(true);
    }
  });

  it('keeps the area the zoo opens first on this side of it - Sprint 1 is dry', () => {
    const s = initialZooState(3);
    const first = zonePlots(s).get(plotOrder(s)[0])!;
    expect(first.y0, 'the opening area is across the water, so Sprint 1 needs a bridge')
      .toBeGreaterThan(RIVER_Y);
  });

  it('refuses to let anything but a bridge be put in it', () => {
    expect(onWater({ x: CANVAS_W / 2, y: riverCourse()[Math.floor(riverCourse().length / 2)].y }),
      'the middle of the river is dry land').toBe(true);
    expect(inWater({ w: 132, h: 90 }, { x: CANVAS_W / 2, y: RIVER_Y }),
      'a habitat dropped on the river is not in it').toBe(true);
    expect(inWater({ w: 132, h: 90 }, { x: CANVAS_W / 2, y: RIVER_Y - 200 }),
      'dry ground counts as river').toBe(false);
  });
});

describe('getting to the far side', () => {
  const farZone = () => {
    const s = initialZooState(3);
    const plots = zonePlots(s);
    return [...plots.values()].find((p) => p.y1 < RIVER_Y)!.zone;
  };

  it('cannot be walked to until somebody builds the bridge', () => {
    // The lesson the river exists for: enabling work. No visitors of its own, and nothing across
    // the water opens without it.
    const s = zooWith(farZone());
    expect(walkTo(s, s.backlog[0]), 'visitors walked across the water').toBeNull();
  });

  it('can be walked to once there is a bridge AND a path over it', () => {
    // Both, and the game should teach both: a bridge nobody can walk to is as much use as no
    // bridge, which is the third of the three consequences - no fence, no crossing, no path.
    const mid = riverCourse()[Math.floor(riverCourse().length / 2)];
    const zone = farZone();
    const dry = zooWith(zone);
    const target = dry.backlog[0].pos!;
    const s = {
      ...zooWith(zone, [built({ pos: { x: mid.x, y: mid.y } })]),
      connectors: [
        { id: 'r1', itemId: 'paths', a: { x: mid.x, y: FRONT_Y }, b: { x: mid.x, y: mid.y }, bends: [], thickness: 14, color: '#c9a86a' },
        { id: 'r2', itemId: 'paths', a: { x: mid.x, y: mid.y }, b: { x: target.x, y: target.y + 70 }, bends: [], thickness: 14, color: '#c9a86a' },
      ],
    } as unknown as ZooGameState;
    expect(walkTo(s, s.backlog[0]), 'the bridge and the path are both there and nobody can cross').not.toBeNull();
  });

  it('is still no use as a bridge with no path leading to it', () => {
    const mid = riverCourse()[Math.floor(riverCourse().length / 2)];
    const s = zooWith(farZone(), [built({ pos: { x: mid.x, y: mid.y } })]);
    expect(walkTo(s, s.backlog[0]), 'visitors found their own way to an unreachable bridge').toBeNull();
  });

  it('is not needed for the area on this side', () => {
    const s = zooWith(plotOrder(initialZooState(3))[0]);
    expect(walkTo(s, s.backlog[0]), 'Sprint 1 needs a bridge, and it must not').not.toBeNull();
  });
});

describe('both drawings of the river', () => {
  it('draw the same one course', () => {
    const s = { ...initialZooState(3), phase: 'sprint' } as ZooGameState;
    const plan = render(<ParkPlan state={s} />).container.querySelector('[data-part="river"]');
    const iso = render(<IsoZoo state={s} height={460} />).container.querySelector('[data-part="river"]');
    expect(plan, 'the plan has no river on it').toBeTruthy();
    expect(iso, 'the Increment has no river in it').toBeTruthy();
    const bends = (el: Element | null) => (el?.getAttribute('d') ?? '').split('C').length;
    expect(bends(iso), 'the two views draw different rivers').toBe(bends(plan));
  });
});
