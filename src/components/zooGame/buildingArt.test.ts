import { describe, it, expect } from 'vitest';
import { BUILDING_ART } from './art/buildingArt.generated';
import { BUILDING_TYPES, FOOTPRINT } from './design';
import { TILE_SPREAD, footprintWidth } from './art/iso';

describe('the facility tiles', () => {
  it('names its kinds the way the rest of the game does', () => {
    // A tile keyed to a type nothing produces is a tile nobody sees.
    for (const type of Object.keys(BUILDING_ART)) {
      expect(BUILDING_TYPES, `${type} is not a building type`).toContain(type);
    }
  });

  it('leaves the kinds it has no tile for to be drawn instead', () => {
    // Not every facility has artwork, and the drawn fallback must stay reachable - a zoo can offer
    // a kind nobody has drawn yet and it still has to appear.
    const undrawn = BUILDING_TYPES.filter((t) => !(t in BUILDING_ART));
    expect(undrawn.length, 'every type has a tile - the drawn fallback is dead code').toBeGreaterThan(0);
  });

  it('carries its own picture, so a scene can be saved without fetching anything', () => {
    for (const [type, art] of Object.entries(BUILDING_ART)) {
      expect(art.src, type).toMatch(/^data:image\/png;base64,/);
      expect(art.src.length, `${type} is suspiciously small`).toBeGreaterThan(2000);
      expect(art.w, type).toBeGreaterThan(0);
      expect(art.h, type).toBeGreaterThan(0);
    }
  });

  it('is only ever asked to shrink', () => {
    // These are pixels, not curves, so a tile drawn larger than it was made goes soft. The widest a
    // facility is ever drawn is its own footprint at one screen pixel per world pixel, which the
    // park never reaches - so comparing against that is the safe side of the real question.
    for (const [type, art] of Object.entries(BUILDING_ART)) {
      const fp = FOOTPRINT[type];
      expect(fp, `${type} has no footprint`).toBeTruthy();
      const widest = footprintWidth(fp.w * 0.66, fp.h * 0.66, 1) * TILE_SPREAD;
      expect(art.w, `${type} would be stretched at full zoom`).toBeGreaterThanOrEqual(widest);
    }
  });
});
