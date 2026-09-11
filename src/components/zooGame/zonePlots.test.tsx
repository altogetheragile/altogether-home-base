import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { IsoZoo } from './IsoZoo';
import { initialZooState } from './config';
import { zonePlots, plotOrder, plotFor, insidePlot, PLOT_GAP } from './parkZones';
import { standingOnPark, parkPositions, restingPlace } from './parkModel';
import { CANVAS_W, PAD, PROMENADE_Y } from './parkLayout';
import type { ZooGameState, BacklogItem } from './types';

// Each area of the zoo owns its ground.
//
// This is what makes the zoo growable a piece at a time, which is the whole reason for it: the
// Savanna can be opened in Sprint 4 without disturbing anything built in Sprint 1, because the
// ground it stands on was always going to be its. An empty plot beside a full one is the rest of the
// Product Backlog, drawn to scale, in the place it is going to be.
//
// The rules worth holding are about agreement, not about looks: one set of plots, read by the plan,
// by the Increment and by everything that asks where a thing stands. A layout that two views work
// out separately is two zoos, and we have paid for that three times.

/** A game with the zoo's habitats standing on the park - built, so there is a layout to look at. */
const game = (): ZooGameState => {
  const base = initialZooState(3);
  return {
    ...base, phase: 'sprint', sprintNumber: 1,
    backlog: base.backlog.map((it) => (it.category === 'epic' || it.unsized
      ? it : { ...it, status: 'open' as const, started: true, sprintNumber: 1 })),
  } as ZooGameState;
};

describe('the ground an area owns', () => {
  it('gives every area of the zoo a plot, and no two of them the same ground', () => {
    const plots = [...zonePlots(game()).values()];
    expect(plots.length, 'the park is not marked out in areas at all').toBeGreaterThan(1);
    for (const a of plots) {
      for (const b of plots) {
        if (a.zone === b.zone) continue;
        const apart = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
        expect(apart, `${a.zone} and ${b.zone} are laid out on the same ground`).toBe(true);
      }
    }
  });

  it('leaves the way in clear, and keeps every plot on the park', () => {
    for (const p of zonePlots(game()).values()) {
      expect(p.x0, `${p.zone} runs off the left of the park`).toBeGreaterThanOrEqual(PAD - 0.01);
      expect(p.x1, `${p.zone} runs off the right of the park`).toBeLessThanOrEqual(CANVAS_W - PAD + 0.01);
      expect(p.y0).toBeGreaterThanOrEqual(PAD - 0.01);
      expect(p.y1, `${p.zone} is laid out over the promenade`).toBeLessThanOrEqual(PROMENADE_Y - PLOT_GAP + 0.01);
    }
  });

  it('puts the area the zoo opens first nearest the way in', () => {
    const plots = zonePlots(game());
    const first = plots.get(plotOrder(game())[0])!;
    for (const p of plots.values()) {
      if (p.zone === first.zone) continue;
      expect(first.y1, `${p.zone} is closer to the entrance than the opening area`).toBeGreaterThanOrEqual(p.y1);
    }
  });

  it('does not move when another area is opened', () => {
    // The point of marking the ground out up front. Ground that reshuffled underneath a built zoo
    // every time the Product Backlog grew a zone would be the opposite of safe to grow into.
    const before = zonePlots({ brief: { zones: ['Big Cats', 'Waterside', 'Savanna', 'Forest'] } });
    const after = zonePlots({ brief: { zones: ['Big Cats', 'Waterside', 'Savanna', 'Forest'] }, zones: ['Big Cats', 'Waterside', 'Savanna', 'Forest', 'Grounds', 'Facilities'] });
    expect(after.get('Big Cats')).toEqual(before.get('Big Cats'));
  });

  it('owns no ground for the fabric between the areas', () => {
    // Paths, the river, signposts and the toilets are the zoo between its areas. Pinning them into
    // a quarter of the park would make a path that cannot reach the next one.
    expect(plotFor(game(), 'Grounds'), 'the paths were given a quarter of the park').toBeNull();
    expect(plotFor(game(), 'Facilities'), 'the toilets were pinned into one area').toBeNull();
  });
});

describe('laying the park out', () => {
  it('stands each thing on its own area’s ground', () => {
    const s = game();
    const plots = zonePlots(s);
    const standing = standingOnPark(s);
    const auto = parkPositions(standing, plots);
    const zoned = standing.filter((st) => plots.has(st.item.zone) && !st.item.pos);
    expect(zoned.length, 'nothing on the park belongs to an area').toBeGreaterThan(0);
    for (const st of zoned) {
      const at = restingPlace(st.item, st.size, auto);
      expect(insidePlot(plots.get(st.item.zone)!, st.size, at),
        `${st.item.name} was laid out somewhere other than the ${st.item.zone}`).toBe(true);
    }
  });

  it('draws something standing outside its area where it stands, rather than moving it', () => {
    // Nobody's zoo needs a migration to be visible. What the areas govern is where a thing may be
    // PUT; a thing already standing somewhere is drawn where it is, and can be picked up and
    // brought home.
    const s = game();
    const enc = s.backlog.find((it) => it.category === 'enclosure')!;
    const stray = { ...enc, pos: { x: CANVAS_W - PAD - 90, y: PAD + 70 } } as BacklogItem;
    const withStray = { ...s, backlog: s.backlog.map((it) => (it.id === enc.id ? stray : it)) } as ZooGameState;
    const standing = standingOnPark(withStray);
    const mine = standing.find((st) => st.item.id === enc.id)!;
    const at = restingPlace(mine.item, mine.size, parkPositions(standing, zonePlots(withStray)));
    expect(at.x, 'a delivered habitat was moved by itself').toBeCloseTo(stray.pos!.x, 0);
    expect(at.y).toBeCloseTo(stray.pos!.y, 0);
  });
});

describe('putting something down', () => {
  it('refuses ground that belongs to another area, and says whose it is', () => {
    const s = game();
    const enc = s.backlog.find((it) => it.category === 'enclosure')!;
    const plots = zonePlots(s);
    const elsewhere = [...plots.values()].find((p) => p.zone !== enc.zone)!;
    const { container } = render(
      <ParkPlan state={s} placing={{ id: enc.id, w: 132, h: 90 }} onPlace={() => {}} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    // A park coordinate is not a client coordinate: the picture is fitted to the room it is given
    // and carries a margin of countryside round the plot. Read off the viewBox the park drew, so
    // that this keeps pointing at the same piece of ground whatever size the plot becomes.
    const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    const W = 880, H = 790;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H,
      right: W, bottom: H, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const k = Math.min(W / vw, H / vh);
    fireEvent.pointerMove(svg, {
      clientX: ((elsewhere.x0 + elsewhere.x1) / 2 - vx) * k + (W - vw * k) / 2,
      clientY: ((elsewhere.y0 + elsewhere.y1) / 2 - vy) * k + (H - vh * k) / 2,
    });
    const why = container.querySelector('[data-part="ghost"] text')?.textContent ?? '';
    expect(why, `dropping a ${enc.zone} habitat on the ${elsewhere.zone} was allowed`)
      .toMatch(new RegExp(`outside the ${enc.zone} area`));
  });
});

describe('both drawings of the areas', () => {
  it('mark out the same ground', () => {
    const s = game();
    const plan = render(<ParkPlan state={s} />).container;
    const iso = render(<IsoZoo state={s} height={460} />).container;
    const named = (c: HTMLElement, sel: string, attr: string) =>
      [...c.querySelectorAll(sel)].map((el) => el.getAttribute(attr)).sort();
    const onPlan = named(plan, '[data-part="zone-plot"]', 'data-zone');
    expect(onPlan.length, 'the plan marks out no areas').toBe(zonePlots(s).size);
    expect(named(iso, '[data-plot]', 'data-plot'),
      'the Increment and the plan disagree about which areas the park has').toEqual(onPlan);
  });
});
