import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { initialZooState } from './config';
import { footprintFor } from './design';
import { setItemPos } from './engine';
import { standingOnPark, parkPositions, groundSize } from './parkModel';
import { zonePlots } from './parkZones';
import { outlines, entranceApron, freeSlots, allSlots } from './parkOutline';
import { riverBand } from './parkWater';
import type { ZooGameState, BacklogItem } from './types';

// What the ghost promises is what the drop does.
//
// Reported from playing it: "I cannot move the structures." You drag a building, the box under the
// cursor goes green, you let go, and nothing happens. Nothing anywhere says why.
//
// `setItemPos` refuses a drop on the ground the park keeps clear - the path through an area, the
// apron in front of the way in - and has done since the outline was drawn. The ghost asks its own
// question, and its question had never heard of reserved ground. So the two disagreed, the drop
// won silently, and a player learned only that the park does not take drops.
//
// `whyNotHere` was written for exactly this and had no readers at all. It has one now, and the
// reason travels with the refusal: "the way in has to stay clear" is a rule about zoos. "Kept
// clear" on its own is a computer being fussy.

const park = (): ZooGameState => {
  const s0 = initialZooState(3);
  const open = ['lion-enc', 'lion', 'main-wc', 'benches'];
  return { ...s0, phase: 'sprint', sprintNumber: 1, backlog: s0.backlog.map((x) =>
    (open.includes(x.id) ? { ...x, status: 'open' as const, started: true, sprintNumber: 1 } : x)),
  } as ZooGameState;
};
const itemOf = (s: ZooGameState, id: string) => s.backlog.find((x) => x.id === id)!;

/** The park, with something in hand, and a way to aim at a spot in the park's own units. */
const carrying = (s: ZooGameState, held: BacklogItem) => {
  const r = render(<ParkPlan state={s} placing={{ id: held.id, ...footprintFor(held) }} onPlace={() => {}} />);
  const svg = r.container.querySelector('[data-part="park-plan"]')!;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1100, height: 760,
    right: 1100, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  const [vx, vy, vw, vh] = (svg.getAttribute('viewBox') ?? '0 0 1 1').split(/\s+/).map(Number);
  // The park letterboxes its viewBox: one scale for both axes, the remainder split as a margin.
  const scale = Math.min(1100 / vw, 760 / vh);
  const carryTo = (at: { x: number; y: number }) => {
    fireEvent.pointerMove(svg, {
      clientX: (at.x - vx) * scale + (1100 - vw * scale) / 2,
      clientY: (at.y - vy) * scale + (760 - vh * scale) / 2,
    });
    const g = r.container.querySelector('[data-part="ghost"]');
    return { green: g?.querySelector('rect')?.getAttribute('stroke') === '#059669',
      says: g?.textContent ?? '' };
  };
  return { ...r, carryTo };
};

describe('carrying a building over ground the park keeps clear', () => {
  it('says the way in has to stay clear', () => {
    const s = park();
    const { carryTo } = carrying(s, itemOf(s, 'main-wc'));
    const g = carryTo(entranceApron());
    expect(g.green, 'the ghost offered to block the way in').toBe(false);
    expect(g.says).toMatch(/the way in has to stay clear/);
  });

  it('names the area whose path runs there', () => {
    const s = park();
    const spine = outlines(s).find((o) => o.zone === 'Big Cats')!.spine;
    const { carryTo } = carrying(s, itemOf(s, 'main-wc'));
    const g = carryTo({ x: spine.x, y: spine.y });
    expect(g.green, 'the ghost offered to build across the path').toBe(false);
    // Which path, not just "no". A refusal that does not say what the ground is for teaches nothing.
    expect(g.says).toMatch(/the path through Big Cats runs here/);
  });

  it('still takes a free slot in the same area', () => {
    // The control. Without it this file passes on a park that refuses everything.
    const s = park();
    const standing = standingOnPark(s);
    const at = parkPositions(standing, zonePlots(s));
    const where = standing.map((x) => x.item.pos ?? at.get(x.item.id)!).filter(Boolean);
    const free = freeSlots(s, 'main-wc', where).find((sl) => sl.zone === 'Big Cats')!;
    const { carryTo } = carrying(s, itemOf(s, 'main-wc'));
    expect(carryTo(free.at).green, 'nothing may be put down anywhere at all').toBe(true);
  });
});

describe('the ghost and the drop, asked the same question', () => {
  it('agree everywhere on the park', () => {
    // The whole class of fault, not the one spot it was reported from. A green ghost over a drop
    // the engine will refuse is the bug; a red one over a drop it would take is the other half.
    const s = park();
    const wc = itemOf(s, 'main-wc');
    const { carryTo } = carrying(s, wc);
    const disagreed: string[] = [];
    for (let x = 120; x <= 1640; x += 95) {
      for (let y = 120; y <= 980; y += 86) {
        const g = carryTo({ x, y });
        // What the drop actually does with it. A refusal is the state coming back unchanged.
        const took = setItemPos(s, wc.id, { x, y }) !== s;
        // Only the reserved-ground half: the ghost refuses more than the engine does on purpose
        // (you may not stand on another building), and that half is the ghost's to judge.
        if (g.green && !took) disagreed.push(`green at ${x},${y} and the drop refused it`);
      }
    }
    expect(disagreed, 'the ghost promised a drop the engine will not take').toEqual([]);
  });
});

describe('a building that belongs to no area', () => {
  const laid = (s: ZooGameState) => {
    const standing = standingOnPark(s);
    const at = parkPositions(standing, zonePlots(s));
    return (id: string) => at.get(id);
  };

  it('stands in a slot rather than covering one', () => {
    // It used to land in a corner of the Big Cats, overlapping a slot without filling it - so the
    // slot was neither free nor occupied, and the next habitat had nowhere to go.
    const s = park();
    const at = laid(s);
    for (const id of ['main-wc', 'benches']) {
      const p = at(id)!;
      expect(p, `${id} was not laid out at all`).toBeTruthy();
      expect(allSlots(s).some((sl) => sl.at.x === p.x && sl.at.y === p.y),
        `${id} stands between slots, covering one`).toBe(true);
    }
  });

  it('leaves the area nearest the way in to its own work', () => {
    const s = park();
    const at = laid(s);
    const bigCats = outlines(s).find((o) => o.zone === 'Big Cats')!;
    const inBigCats = (p: { x: number; y: number }) => bigCats.slots.some((sl) => sl.at.x === p.x && sl.at.y === p.y);
    expect(inBigCats(at('main-wc')!), 'the toilets took a slot the first Sprint needs').toBe(false);
    expect(inBigCats(at('benches')!), 'the benches took a slot the first Sprint needs').toBe(false);
  });

  it('stays on the side of the water the visitors are on', () => {
    // The first version of this filled the slots from the far end of the park, which is across the
    // river: the toilets stood in the Forest, and their own criterion - "can I walk to it from the
    // way in?" - failed for a reason nobody had chosen. Being crowded out is an argument worth
    // having; being stranded by a layout is not.
    const s = park();
    const at = laid(s);
    const river = riverBand();
    for (const id of ['main-wc', 'benches']) {
      expect(at(id)!.y, `${id} was put across the water, where nobody can walk to it`)
        .toBeGreaterThan(river.y1);
    }
  });

  it('does not stand on top of anything, wherever it ends up', () => {
    const s = park();
    const standing = standingOnPark(s);
    const at = parkPositions(standing, zonePlots(s));
    const boxes = standing.map((x) => ({ id: x.item.id, ...groundSize(x.item), ...(x.item.pos ?? at.get(x.item.id)!) }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.id >= b.id) continue;
        const clash = Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
        expect(clash, `${a.id} stands on ${b.id}`).toBe(false);
      }
    }
  });
});
