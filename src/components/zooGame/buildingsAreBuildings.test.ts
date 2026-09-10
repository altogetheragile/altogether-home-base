import { describe, it, expect } from 'vitest';
import { FACILITY, VISITOR_HEIGHT } from './facilities';

// A building has to look like one standing next to a person.
//
// Reported from playing it, over a picture of a kiosk with a family beside it: "the buildings are
// too small compared to the people - they need to be taller." They were: a guest is drawn about 40
// units tall and a kiosk's walls were 21, so the counter was chest-high on the people queueing at
// it. Heights are in the same units as the visitors, so the comparison is arithmetic rather than a
// matter of taste - and this is the rule, not the numbers.

describe('how tall a building is', () => {
  it('is taller than the people using it', () => {
    for (const [kind, look] of Object.entries(FACILITY)) {
      expect(look.height, `${kind} is not as tall as a visitor`).toBeGreaterThan(VISITOR_HEIGHT);
    }
  });

  it('is taller still where people go inside', () => {
    // A stall is a counter with a canopy; a shop is a room you walk into. The difference has to be
    // visible from across the park, or every building is the same shed in different colours.
    expect(FACILITY.shop.height).toBeGreaterThan(FACILITY.stall.height);
    expect(FACILITY.cafe.height).toBeGreaterThan(FACILITY.kiosk.height);
  });
});
