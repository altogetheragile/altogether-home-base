import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkPlan } from './ParkPlan';
import { initialZooState, DAY_SECONDS } from './config';
import {
  outlines, allSlots, reserved, entranceApron, onReservedGround, freeSlots,
  SPINE_W, SLOT_MIN,
} from './parkOutline';
import { zonePlots, plotOrder } from './parkZones';
import { PROMENADE_Y } from './parkLayout';
import { setItemPos, answerPlacement, askPlacement, openGround, whereEverythingStands } from './engine';
import { whereItStands, groundSize, parkPositions } from './parkModel';
import type { ZooGameState, BacklogItem } from './types';

// The skeleton a zone is built on.
//
// Reported twice: "the enclosure was placed by the AI across a path and blocking the main
// entrance. I pointed this out before - AI places things in weird places."
//
// The cause was not a bad score. Placement is "aim at a rough point, then find the nearest spot
// that does not collide", and what it collided with was OTHER ITEMS. It knew about the water and
// about buildings; it knew nothing about paths, the promenade or the way in. "Across a path" was
// not an unlikely position - it was a position nothing had been told about.
//
// So the fix is not a better score. It is an outline: a gate, a reserved spine from it, and slots
// either side. Bad placements stop being unlikely and become unrepresentable, which is the
// stronger property and the one worth the geometry.

const park = (zones?: string[]): ZooGameState => {
  const base = initialZooState(3);
  return zones ? ({ ...base, zones } as ZooGameState) : base;
};

/** A Sprint's worth of work, DONE and standing on the park wherever the game put it.
 *
 *  Done, not committed. `standsOnPark` asks for `done` or `open`, so a park full of committed work
 *  is a park with nothing on it - and a fifty-seed check over an empty park passes every time
 *  while proving nothing. Found by a mutation that survived: taking the reserved ground out of the
 *  packer changed nothing, because nothing was being packed. */
const aBuiltPark = (seed: number): ZooGameState => {
  let s = initialZooState(seed) as ZooGameState;
  // The zoo owns every area it can, so every plot has an outline in force.
  for (const zone of plotOrder(s)) s = openGround({ ...s, value: 99_999 } as ZooGameState, zone);
  const take = s.backlog.filter((it) => !it.unsized && it.category !== 'epic').slice(0, 8);
  return {
    ...s, phase: 'sprint', dayStage: 'building', sprintNumber: 1, dayNumber: 1, wipLimit: 0,
    daySecondsLeft: DAY_SECONDS,
    backlog: s.backlog.map((it) => (take.some((t) => t.id === it.id)
      ? { ...it, status: 'done' as const, sprintNumber: 1, started: true,
        design: { parts: {}, colors: {} } as never } : it)),
  } as ZooGameState;
};

/** Everything actually drawn on the park, with where it stands. */
const standing = (s: ZooGameState): { item: BacklogItem; at: { x: number; y: number } }[] =>
  s.backlog.filter((it) => it.status === 'done' || it.status === 'open')
    .map((item) => ({ item, at: whereItStands(s, item)! }))
    .filter((x) => !!x.at);

describe('a zone has a shape', () => {
  it('is entered from the front, where the visitors are', () => {
    for (const o of outlines(park())) {
      const plot = [...zonePlots(park()).values()].find((p) => p.zone === o.zone)!;
      expect(o.gate.y, `${o.zone} is entered from somewhere other than its front edge`).toBe(Math.round(plot.y1));
      expect(o.gate.x, `${o.zone}'s gate is not on its own ground`).toBeGreaterThanOrEqual(plot.x0);
      expect(o.gate.x).toBeLessThanOrEqual(plot.x1);
    }
  });

  it('reserves a corridor from the gate to the back of it', () => {
    for (const o of outlines(park())) {
      expect(o.spine.w, 'the corridor is too narrow to walk down').toBe(SPINE_W);
      expect(o.spine.x, `${o.zone}'s corridor does not meet its own gate`).toBe(o.gate.x);
      const plot = [...zonePlots(park()).values()].find((p) => p.zone === o.zone)!;
      expect(o.spine.h, 'the corridor stops short of the back of the area')
        .toBe(plot.y1 - plot.y0);
    }
  });

  it('keeps the slots off the corridor and inside the area', () => {
    for (const o of outlines(park())) {
      const plot = [...zonePlots(park()).values()].find((p) => p.zone === o.zone)!;
      expect(o.slots.length, `${o.zone} has nowhere to build`).toBeGreaterThan(0);
      for (const sl of o.slots) {
        const onSpine = Math.abs(sl.at.x - o.spine.x) < (sl.size.w + o.spine.w) / 2
          && Math.abs(sl.at.y - o.spine.y) < (sl.size.h + o.spine.h) / 2;
        expect(onSpine, `${sl.id} overlaps the corridor it is supposed to face`).toBe(false);
        expect(sl.at.x - sl.size.w / 2, `${sl.id} hangs off the left of its area`).toBeGreaterThanOrEqual(plot.x0 - 1);
        expect(sl.at.x + sl.size.w / 2, `${sl.id} hangs off the right of its area`).toBeLessThanOrEqual(plot.x1 + 1);
      }
    }
  });

  it('makes every slot big enough for the biggest thing that could stand in it', () => {
    for (const sl of allSlots(park())) {
      expect(sl.size.w, `${sl.id} is narrower than a large enclosure`).toBeGreaterThanOrEqual(SLOT_MIN.w - 1);
      expect(sl.size.h, `${sl.id} is shallower than a large enclosure`).toBeGreaterThanOrEqual(SLOT_MIN.h - 1);
    }
  });

  it('offers the ones nearest the way in first', () => {
    // A zoo fills up from the entrance, and "the next free slot" should mean the obvious one.
    for (const o of outlines(park())) {
      const ys = o.slots.map((s) => s.at.y);
      expect([...ys].sort((a, z) => z - a), `${o.zone} offers its back row before its front`).toEqual(ys);
    }
  });

  it('fills the left of the corridor before the right, so a seed replays', () => {
    // Either side would do; what matters is that it is the SAME side every time. A trainer
    // replaying a seed has to get the same zoo, and "whichever" is not a layout.
    for (const o of outlines(park())) {
      const firstRow = o.slots.slice(0, 2);
      expect(firstRow.length, `${o.zone} has only one place in its front row`).toBe(2);
      expect(firstRow[0].at.x, `${o.zone} fills the right of its path first`)
        .toBeLessThan(firstRow[1].at.x);
      expect(firstRow[0].faces, 'the first slot does not face the path from the left').toBe('right');
    }
  });

  it('says which way each slot faces the path', () => {
    for (const o of outlines(park())) {
      for (const sl of o.slots) {
        const spineIsRight = sl.at.x < o.spine.x;
        expect(sl.faces, `${sl.id} says the path is on the wrong side of it`)
          .toBe(spineIsRight ? 'right' : 'left');
      }
    }
  });
});

describe('the ground that is kept clear', () => {
  it('is every corridor, and the way in', () => {
    const r = reserved(park());
    expect(r.length, 'nothing is reserved at all').toBe(outlines(park()).length + 1);
    const apron = entranceApron();
    expect(r).toContainEqual(apron);
    expect(apron.y, 'the apron is not in front of the way in').toBeLessThan(PROMENADE_Y);
  });

  it('refuses a drop on it, whoever is dropping', () => {
    // Strict for everyone. A game that stops the Developers walling off the entrance and then lets
    // you do it has not taught that a zoo needs somewhere to walk - it has taught that the
    // computer is fussy.
    const s = aBuiltPark(3);
    const item = s.backlog.find((it) => it.status === 'done')!;
    const spine = outlines(s)[0].spine;
    const refused = setItemPos(s, item.id, { x: spine.x, y: spine.y });
    expect(refused, 'a habitat was dropped across the area’s path').toBe(s);

    const apron = entranceApron();
    expect(setItemPos(s, item.id, { x: apron.x, y: apron.y }),
      'a habitat was dropped in front of the way in').toBe(s);
  });

  it('and takes one anywhere else', () => {
    const s = aBuiltPark(3);
    const item = s.backlog.find((it) => it.status === 'done')!;
    const slot = allSlots(s)[0];
    const moved = setItemPos(s, item.id, slot.at);
    expect(moved.backlog.find((it) => it.id === item.id)!.pos, 'a perfectly good drop was refused')
      .toEqual(slot.at);
  });
});

describe('dropping something into a place', () => {
  // The other half of "strict for everyone": the spine refuses a drop, and a drop into a slot
  // takes it. Landing a few pixels off a place is the difference between a zoo that was laid out
  // and one that was assembled, and nobody is going to line things up by hand.
  const smallest = (s: ZooGameState) => [...s.backlog]
    .filter((it) => it.status === 'done').sort((a, z) => groundSize(a).w - groundSize(z).w)[0];

  it('settles into the slot it was dropped in', () => {
    const s = aBuiltPark(4);
    const item = smallest(s);
    // Free by the engine's own reckoning, which is where things actually STAND rather than where
    // the few hand-placed ones were put.
    const slot = freeSlots(s, item.id, whereEverythingStands(s, item.id))[0];
    expect(slot, 'the park is full, so there is nowhere to drop it').toBeTruthy();
    const near = { x: slot.at.x + Math.round(slot.size.w / 4), y: slot.at.y - 8 };
    const moved = setItemPos(s, item.id, near);
    expect(moved.backlog.find((it) => it.id === item.id)!.pos,
      'a drop inside a place was left a few pixels off it').toEqual(slot.at);
  });

  it('and is left exactly where it was dropped between them', () => {
    const s = aBuiltPark(4);
    const item = smallest(s);
    const slots = allSlots(s);
    const rows = [...new Set(slots.map((sl) => sl.at.y))].sort((a, b) => a - b);
    if (rows.length < 2) return;
    const between = { x: slots[0].at.x, y: Math.round((rows[0] + rows[1]) / 2) };
    if (slots.some((sl) => Math.abs(sl.at.x - between.x) <= sl.size.w / 2
      && Math.abs(sl.at.y - between.y) <= sl.size.h / 2)) return;
    expect(setItemPos(s, item.id, between).backlog.find((it) => it.id === item.id)!.pos,
      'a deliberate spot between two places was tidied into one').toEqual(between);
  });

  it('never into a place something is already standing in', () => {
    const s = aBuiltPark(4);
    const item = smallest(s);
    const free = freeSlots(s, item.id, whereEverythingStands(s, item.id));
    const taken = allSlots(s).find((sl) => !free.some((f) => f.id === sl.id));
    if (!taken) return;                     // this park has an empty area
    const moved = setItemPos(s, item.id, { x: taken.at.x + 6, y: taken.at.y + 6 });
    expect(moved.backlog.find((it) => it.id === item.id)!.pos,
      'it snapped on top of something that was already there').not.toEqual(taken.at);
  });

});

describe('the plan draws the shape', () => {
  // "A light architectural framework that guides development." A framework nobody can see guides
  // nothing: the snap has to be something you aimed at rather than something that happened to you.
  const plan = (s: ZooGameState) => render(
    <MemoryRouter><ParkPlan state={s} /></MemoryRouter>,
  ).container;

  it('marks out the places that are still empty, and not the ones in use', () => {
    const s = aBuiltPark(4);
    const c = plan(s);
    const drawn = [...c.querySelectorAll('[data-part="free-slot"]')].map((n) => n.getAttribute('data-slot'));
    expect(drawn.length, 'the plan marks out nowhere to build').toBeGreaterThan(0);
    const free = new Set(freeSlots(s, undefined, whereEverythingStands(s)).map((sl) => sl.id));
    for (const id of drawn) {
      expect(free.has(id!), `${id} is drawn as empty with something standing in it`).toBe(true);
    }
    expect(drawn.length, 'every place is drawn as empty, including the ones in use')
      .toBe(free.size);
  });

  it('and the corridor each area keeps clear', () => {
    const c = plan(aBuiltPark(4));
    expect(c.querySelectorAll('[data-part="zone-spine"]').length,
      'nothing on the plan shows where the path has to go').toBeGreaterThan(0);
  });
});

describe('where the game puts things', () => {
  it('lands the Product Owner’s answer in a slot', () => {
    let s = aBuiltPark(5);
    const item = s.backlog.find((it) => it.category === 'enclosure' && it.status === 'done' && !it.pos)!;
    s = askPlacement(s, item.id);
    s = answerPlacement(s, item.id, 'entrance');
    const at = s.backlog.find((it) => it.id === item.id)!.pos!;
    expect(at, 'the answer put it nowhere').toBeTruthy();
    expect(onReservedGround(s, { ...at, ...groundSize(item) }),
      'the Product Owner’s answer put it across a path').toBe(false);
    // "By the entrance" is a direction, not a coordinate. What it means is the free slot nearest
    // the entrance - a place in the area - rather than the nearest clear pixel to a made-up point.
    expect(allSlots(s).some((sl) => sl.at.x === at.x && sl.at.y === at.y),
      'her answer landed on open ground rather than in a place').toBe(true);
  });

  it('fills the slots before it packs a shelf', () => {
    const s = aBuiltPark(7);
    const inZones = s.backlog.filter((it) => it.status === 'done' && it.zone && !it.pos);
    expect(inZones.length, 'nothing is standing in an area, so nothing is being tested').toBeGreaterThan(0);
    const slots = allSlots(s);
    const inSlot = inZones.filter((it) => {
      const at = whereItStands(s, it);
      return at && slots.some((sl) => sl.at.x === at.x && sl.at.y === at.y);
    });
    expect(inSlot.length, 'everything was shelf-packed into a corner rather than put in a place')
      .toBeGreaterThan(0);
  });
});

describe('laying out an area', () => {
  // Asked of `parkPositions` directly. The two things that can go wrong here - handing out a slot
  // something does not fit in, and losing whatever had no slot - are reachable from the game only
  // by contriving a Sprint, and a contrived Sprint tests the contrivance.
  const plots = zonePlots(park());
  const zone = [...plots.keys()][0];
  const plot = plots.get(zone)!;
  const o = outlines(park()).find((x) => x.zone === zone)!;

  const item = (id: string, size: { w: number; h: number }) => ({
    item: { id, name: id, zone, category: 'enclosure', status: 'done' } as unknown as BacklogItem,
    size, underWay: false, animals: [], plants: [],
  }) as unknown as Parameters<typeof parkPositions>[0][number];

  it('gives nothing a slot it does not fit in', () => {
    // A thing wider than any slot has to go somewhere, and somewhere is not "the first slot, half
    // of it hanging over the path".
    const huge = { w: o.slots[0].size.w + 120, h: o.slots[0].size.h };
    const out = parkPositions([item('huge', huge)], plots);
    const at = out.get('huge')!;
    expect(at, 'it was not placed at all').toBeTruthy();
    expect(allSlots(park()).some((sl) => sl.at.x === at.x && sl.at.y === at.y),
      'something too big for a slot was put in one anyway').toBe(false);
  });

  it('and still finds a place for everything when the slots run out', () => {
    const small = { w: 80, h: 60 };
    const many = Array.from({ length: o.slots.length + 5 }, (_, i) => item(`it${i}`, small));
    const out = parkPositions(many, plots);
    for (const m of many) {
      expect(out.get(m.item.id), `${m.item.id} overflowed the area and was lost`).toBeTruthy();
    }
    // ...and all of them on their OWN area's ground. There is a catch-all after the per-area loop
    // that puts anything still homeless somewhere in the park, so an overflow that is quietly
    // dropped here does not vanish - it turns up in somebody else's area, which is worse than
    // vanishing because it looks deliberate.
    for (const m of many) {
      const at = out.get(m.item.id)!;
      expect(at.x, `${m.item.id} was laid out in another area`).toBeGreaterThanOrEqual(plot.x0);
      expect(at.x, `${m.item.id} was laid out in another area`).toBeLessThanOrEqual(plot.x1);
      expect(at.y, `${m.item.id} was laid out in another area`).toBeGreaterThanOrEqual(plot.y0);
      expect(at.y, `${m.item.id} was laid out in another area`).toBeLessThanOrEqual(plot.y1);
    }
  });
});

describe('across fifty seeds', () => {
  // Spec §5's acceptance test, as a guard rather than as the mechanism. Nothing here searches for
  // a good position: the shape is what makes these true, and this says so for fifty parks.
  const parks = Array.from({ length: 50 }, (_, i) => aBuiltPark(i + 1));

  it('nothing the game placed stands on ground that is kept clear', () => {
    const bad: string[] = [];
    for (const s of parks) {
      const on = standing(s);
      expect(on.length, `seed ${s.gameSeed} has an empty park, so it proves nothing`).toBeGreaterThan(3);
      for (const { item, at } of on) {
        if (onReservedGround(s, { ...at, ...groundSize(item) })) {
          bad.push(`seed ${s.gameSeed}: ${item.name}`);
        }
      }
    }
    expect(bad, `on a path or in the entrance: ${bad.slice(0, 6).join(', ')}`).toEqual([]);
  });

  it('and an area with more work than places still keeps its path clear', () => {
    // The belt as well as the braces. Slots run out - an area is a few places, and a Sprint can
    // put more than that into one - and what catches the overflow is the shelf-packer, which is
    // the thing that put a habitat across a path in the first place.
    for (const s of parks.slice(0, 12)) {
      const zone = plotOrder(s)[0];
      // Every slot taken by hand, so the packer is the only thing left - which is the thing that
      // put a habitat across a path in the first place, and the only thing standing between it and
      // the corridor is the reserved ground.
      const taken = outlines(s).find((o) => o.zone === zone)!.slots;
      const byHand = s.backlog.filter((it) => !it.unsized && it.category !== 'epic')
        .slice(0, taken.length)
        .map((it, i) => ({ ...it, zone, status: 'done' as const, sprintNumber: 1, started: true,
          design: { parts: {}, colors: {} } as never, pos: taken[i].at }));
      const overflow = s.backlog.filter((it) => !it.unsized && it.category !== 'epic'
        && !byHand.some((b) => b.id === it.id))
        .slice(0, 4)
        .map((it) => ({ ...it, zone, status: 'done' as const, sprintNumber: 1, started: true,
          design: { parts: {}, colors: {} } as never, pos: undefined as { x: number; y: number } | undefined }));
      const extra = [...overflow, ...byHand];
      const crowded = { ...s,
        backlog: s.backlog.map((it) => extra.find((e) => e.id === it.id) ?? it) } as ZooGameState;
      const packed = crowded.backlog.filter((it) => extra.some((e) => e.id === it.id));
      expect(packed.filter((it) => !it.pos).length,
        'nothing overflowed the area\u2019s places, so the packer never ran').toBeGreaterThan(0);
      // Only the things that take up ground: an animal lives inside its habitat and a pathway is
      // a run between two points, so neither has a box of its own.
      const where = packed
        .filter((it) => !it.enclosureId && !['path', 'epic'].includes(it.category))
        .map((it) => ({ item: it, at: whereItStands(crowded, it) }));
      for (const { item, at } of where) {
        // Everything that overflowed still has to land somewhere. Dropped on the floor it has no
        // position at all, which is a thing that is built, Done, and invisible.
        expect(at, `seed ${s.gameSeed}: ${item.name} overflowed the area and went nowhere`).toBeTruthy();
        expect(onReservedGround(crowded, { ...at!, ...groundSize(item) }),
          `seed ${s.gameSeed}: ${item.name} was packed onto the path`).toBe(false);
      }
      // ...and no two of them in the same place. A slot handed out twice, or something put in a
      // slot it does not fit, both come out as one habitat drawn over another.
      for (let i = 0; i < where.length; i += 1) {
        for (let j = i + 1; j < where.length; j += 1) {
          if (where[i].item.enclosureId === where[j].item.id
            || where[j].item.enclosureId === where[i].item.id) continue;
          const a = { ...where[i].at!, ...groundSize(where[i].item) };
          const b = { ...where[j].at!, ...groundSize(where[j].item) };
          expect(Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2,
            `seed ${s.gameSeed}: ${where[i].item.name} is on top of ${where[j].item.name}`).toBe(false);
        }
      }
    }
  });

  it('nothing is standing on top of anything else', () => {
    // Two things in one slot, or one thing too big for the slot it was given, both come out as a
    // park where a habitat is drawn over a habitat. It is the oldest fault on this screen and the
    // outline must not bring it back.
    const bad: string[] = [];
    for (const s of parks) {
      const on = standing(s);
      for (let i = 0; i < on.length; i += 1) {
        for (let j = i + 1; j < on.length; j += 1) {
          // An animal stands INSIDE its habitat, which is the one overlap that is meant.
          if (on[i].item.enclosureId === on[j].item.id || on[j].item.enclosureId === on[i].item.id) continue;
          const a = { ...on[i].at, ...groundSize(on[i].item) };
          const b = { ...on[j].at, ...groundSize(on[j].item) };
          if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2) {
            bad.push(`seed ${s.gameSeed}: ${on[i].item.name} over ${on[j].item.name}`);
          }
        }
      }
    }
    expect(bad, `drawn on top of each other: ${bad.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('and everything that is built is somewhere', () => {
    // The overflow has to land. Dropped on the floor it has no position at all, and a thing with
    // no position is a thing the park does not draw - built, Done, and invisible.
    for (const s of parks) {
      // Only the things that take up ground. A lion lives INSIDE its habitat and has a spot in it
      // rather than a position on the park; a pathway is drawn as a run between two points and
      // occupies no box at all. Both are meant to have nowhere of their own.
      const onGround = (x: BacklogItem) => (x.status === 'done' || x.status === 'open')
        && !x.enclosureId && !['path', 'epic'].includes(x.category);
      for (const it of s.backlog.filter(onGround)) {
        expect(whereItStands(s, it), `seed ${s.gameSeed}: ${it.name} is Done and nowhere`).toBeTruthy();
      }
    }
  });

  it('and every area still has somewhere to build', () => {
    for (const s of parks) {
      expect(freeSlots(s).length + s.backlog.filter((it) => it.pos).length,
        `seed ${s.gameSeed} has a park with no places in it`).toBeGreaterThan(0);
    }
  });
});
