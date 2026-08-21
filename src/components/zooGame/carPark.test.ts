import { describe, it, expect } from 'vitest';
import { carParkLayout, walkToGate, CAR_BAYS, COACH_BAYS, CAR_PARK_H } from './carPark';

describe('carParkLayout', () => {
  it('starts empty and fills front-to-back as the count grows', () => {
    // An empty lot lays out ONE row and no coach lay-by: a zoo with nothing open does not need a
    // second row of bays, and drawing them anyway is a screenful of empty tarmac.
    const empty = carParkLayout(880, 400, 0, 0);
    expect(empty.spots.length).toBe(0);
    expect(empty.empties.length).toBe(CAR_BAYS / 2);
    expect(empty.empties.every((e) => !e.bus)).toBe(true);

    const few = carParkLayout(880, 400, 3, 0);
    expect(few.spots.filter((s) => !s.bus).length).toBe(3);
    // the first cars are in the front row (smallest y among all bay rows)
    const rowY = Math.min(...few.empties.filter((e) => !e.bus).map((e) => e.y));
    expect(few.spots.every((s) => s.y <= rowY)).toBe(true);
  });

  it('grows as the zoo does: a second row when the first fills, a lay-by when a coach comes', () => {
    const quiet = carParkLayout(880, 400, 2, 0);
    const busy = carParkLayout(880, 400, 99, 0);
    const coaches = carParkLayout(880, 400, 99, 2);
    expect(quiet.height).toBeLessThan(busy.height);
    expect(busy.height).toBeLessThan(coaches.height);
    // ...and the lot never grows past the biggest it has ever needed to be
    expect(coaches.height).toBe(CAR_PARK_H);
  });

  it('caps at capacity', () => {
    const full = carParkLayout(880, 400, 99, 99);
    expect(full.spots.filter((s) => !s.bus).length).toBe(CAR_BAYS);
    expect(full.spots.filter((s) => s.bus).length).toBe(COACH_BAYS);
  });

  it('gives an obstacle footprint for each occupied bay only', () => {
    const lot = carParkLayout(880, 400, 5, 1);
    expect(lot.obstacles.length).toBe(lot.spots.length);
  });

  it('keeps the walkway clear of parked vehicles all the way to the gate', () => {
    const lot = carParkLayout(880, 400, 99, 99);
    const w = lot.walkway;
    expect(lot.obstacles.some((o) => o.x1 > w.x && o.x0 < w.x + w.w)).toBe(false);
    expect(w.y).toBe(lot.top); // it reaches the fence, so guests step off it straight at the gate
  });

  it('gives every space a lane wide enough to drive, and no bay overlaps one', () => {
    const lot = carParkLayout(880, 400, 99, 99);
    // a car is ~48 long, a coach ~100: each lane has to be wider than the vehicle that uses it
    const aisle = lot.roads.find((r) => r.dir === 'h' && r.y < lot.lanes.layby - 40)!;
    const layby = lot.roads.find((r) => r.dir === 'h' && r.y > aisle.y)!;
    expect(aisle.h).toBeGreaterThan(52);
    expect(layby.h).toBeGreaterThan(52);
    // the link roads down each side join the aisle to the lay-by, so there is a way in and out
    expect(lot.roads.filter((r) => r.dir === 'v').length).toBe(2);
    // parked cars sit in their bays, never in a lane
    const inLane = (y: number) => (y > aisle.y && y < aisle.y + aisle.h) || (y > layby.y && y < layby.y + layby.h);
    expect(lot.spots.filter((s) => !s.bus).some((s) => inLane(s.y))).toBe(false);
    // coaches do stand in the lay-by lane - that is what a lay-by is
    expect(lot.spots.filter((s) => s.bus).every((s) => s.y > layby.y && s.y < layby.y + layby.h)).toBe(true);
  });

  it('walks guests out to a lane, along it, then up the walkway - never over a parked car', () => {
    const lot = carParkLayout(880, 400, 99, 99);
    const cx = lot.walkway.x + lot.walkway.w / 2;
    for (const spot of lot.spots) {
      const route = walkToGate(lot, spot, lot.top - 10);
      expect(route.length).toBe(3);
      expect(route[0].y).toBe(spot.bus ? lot.lanes.layby : lot.lanes.aisle);
      expect(route[1]).toEqual({ x: cx, y: route[0].y });   // along the lane to the walkway
      expect(route[2]).toEqual({ x: cx, y: lot.top - 10 }); // then straight up it to the gate
      // the leg up the walkway never clips a parked vehicle
      expect(lot.obstacles.some((o) => o.x0 < cx && o.x1 > cx)).toBe(false);
    }
  });
});
