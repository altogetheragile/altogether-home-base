import { describe, it, expect } from 'vitest';
import { carParkLayout, CAR_BAYS, COACH_BAYS } from './carPark';

describe('carParkLayout', () => {
  it('starts empty and fills front-to-back as the count grows', () => {
    const empty = carParkLayout(880, 400, 0, 0);
    expect(empty.spots.length).toBe(0);
    // every bay is drawn as a marked-out empty (16 cars + 3 coach bays)
    expect(empty.empties.length).toBe(CAR_BAYS + 3);

    const few = carParkLayout(880, 400, 3, 0);
    expect(few.spots.filter((s) => !s.bus).length).toBe(3);
    // the first cars are in the front row (smallest y among all bay rows)
    const rowY = Math.min(...few.empties.filter((e) => !e.bus).map((e) => e.y));
    expect(few.spots.every((s) => s.y <= rowY)).toBe(true);
  });

  it('caps at capacity and never fills the middle coach bay', () => {
    const full = carParkLayout(880, 400, 99, 99);
    expect(full.spots.filter((s) => !s.bus).length).toBe(CAR_BAYS);
    expect(full.spots.filter((s) => s.bus).length).toBe(COACH_BAYS);
    // an occupied bay carries a footprint; the middle coach bay is never occupied, so the centre
    // column (x ~ W/2) has no bus footprint blocking the corridor.
    const centreBlocked = full.obstacles.some((o) => o.x0 < 440 && o.x1 > 440 && (o.y1 - o.y0) > 80);
    expect(centreBlocked).toBe(false);
  });

  it('gives an obstacle footprint for each occupied bay only', () => {
    const lot = carParkLayout(880, 400, 5, 1);
    expect(lot.obstacles.length).toBe(lot.spots.length);
  });
});
