import { describe, it, expect } from 'vitest';
import { FOOTPRINT, DEFAULT_FOOTPRINT, footprintFor, BUILDING_TYPES, FLORA_TYPES, isLandscapeType, landscapeDefaultSize } from './design';
import type { BacklogItem } from './types';
import { TOOLBOX } from './toolboxItems';

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'General', category: 'amenity',
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [], ...over,
} as BacklogItem);
const area = (t: string) => FOOTPRINT[t].w * FOOTPRINT[t].h;

describe('how much ground a feature takes up', () => {
  it('makes a cafe plainly bigger than a kiosk', () => {
    // A cafe is a building with a kitchen and a terrace; a kiosk is a hatch you queue at.
    expect(area('cafe')).toBeGreaterThan(area('kiosk') * 1.5);
    expect(area('shop')).toBeGreaterThan(area('kiosk'));
  });

  it('makes a signpost much smaller than a kiosk', () => {
    expect(area('signpost')).toBeLessThan(area('kiosk') * 0.5);
    // And smaller than anything else that stands on the grounds - it is a post.
    for (const t of Object.keys(FOOTPRINT)) {
      if (t !== 'signpost') expect(area('signpost'), `signpost vs ${t}`).toBeLessThan(area(t));
    }
  });

  it('gives every facility the toolbox offers a size of its own', () => {
    for (const t of BUILDING_TYPES) expect(FOOTPRINT[t], t).toBeTruthy();
    // Not all the same size, which was the whole complaint.
    const sizes = new Set(BUILDING_TYPES.map((t) => `${FOOTPRINT[t].w}x${FOOTPRINT[t].h}`));
    expect(sizes.size).toBe(BUILDING_TYPES.length);
  });

  it('sizes small scenery too, so a flowerbed is not the size of a shop', () => {
    for (const t of FLORA_TYPES) {
      if (isLandscapeType(t)) continue;
      expect(FOOTPRINT[t], `${t} has no footprint`).toBeTruthy();
      expect(area(t)).toBeLessThan(area('shop'));
    }
  });

  it('works out what a thing is from its design, its template, or failing both its name', () => {
    const byDesign = item({ design: { parts: { type: 'cafe' }, colors: {} }, template: 'kiosk' });
    expect(footprintFor(byDesign)).toEqual(FOOTPRINT.cafe);
    expect(footprintFor(item({ template: 'toilets' }))).toEqual(FOOTPRINT.toilets);
    // A Backlog item written by hand has no template at all, only a name.
    expect(footprintFor(item({ name: 'Gift Shop' }))).toEqual(FOOTPRINT.shop);
    expect(footprintFor(item({ name: 'Ice Cream Stand', services: 'food' }))).toEqual(FOOTPRINT.kiosk);
  });

  it('leaves landscape scenery its own resizable footprint', () => {
    const pond = item({ category: 'flora', template: 'pond' });
    expect(footprintFor(pond)).toEqual(landscapeDefaultSize('pond'));
    // Once dragged to a size, that size wins - the player resized it on purpose.
    expect(footprintFor({ ...pond, size: { w: 200, h: 140 } })).toEqual({ w: 200, h: 140 });
  });

  it('falls back rather than vanishing, for a kind nobody has sized', () => {
    expect(footprintFor(item({ category: 'flora', template: 'mystery' }))).toEqual(DEFAULT_FOOTPRINT);
  });

  it('gives every amenity in the toolbox a real size', () => {
    for (const t of TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'amenity')) {
      const fp = footprintFor(item({ name: t.name, template: t.template, services: t.services }));
      expect(fp.w, t.name).toBeGreaterThan(20);
      expect(fp.h, t.name).toBeGreaterThan(20);
    }
  });
});
