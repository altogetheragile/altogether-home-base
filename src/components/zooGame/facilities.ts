// ============= How big a building is =============
//
// Heights are in the same units the visitors are drawn in, so "is this building taller than the
// people using it?" is arithmetic rather than a matter of taste. Reported from playing it, over a
// picture of a kiosk with a family beside it: "the buildings are too small compared to the people -
// they need to be taller." A guest is about 40 units tall; a kiosk's walls were 21, which put the
// counter at chest height on everybody queueing at it.

export const FACILITY: Record<string, { walls: string; roof: string; sign: string; height: number;
  shape: 'awning' | 'hatch' | 'glazed' | 'stall' | 'plain' }> = {
  // Heights are in the same units the visitors are drawn in: a guest stands about 40 of them tall,
  // so a kiosk at 21 was chest-high on the people queueing at it. Reported from playing it - "the
  // buildings are too small compared to the people, they need to be taller". A door is about a
  // person and a half; a shop wall is two of them, and the roof sits on top of that.
  cafe:    { walls: '#f4eee3', roof: '#b8563f', sign: '#e8b84b', height: 66, shape: 'awning' },
  kiosk:   { walls: '#efe6d8', roof: '#3f8f6f', sign: '#e6a53a', height: 50, shape: 'hatch' },
  shop:    { walls: '#f5f0e7', roof: '#4a6fa5', sign: '#e0653f', height: 70, shape: 'glazed' },
  stall:   { walls: '#efe6d8', roof: '#c85a3c', sign: '#f2c14e', height: 40, shape: 'stall' },
  toilets: { walls: '#e9e7e1', roof: '#8f9aa3', sign: '#4a6fa5', height: 56, shape: 'plain' },
};

/** How tall a guest is drawn, in the same units. Buildings are measured against it. */
export const VISITOR_HEIGHT = 43.3 * 0.92;
