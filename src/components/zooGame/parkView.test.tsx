import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { standingOnPark, parkPositions, positionOf } from './parkModel';
import { HABITAT_FEATURE_TYPES } from './design';

// What stands on the park, and where.
//
// There used to be two drawings of one zoo - a blueprint drawn from overhead, and the Increment
// drawn as a visitor sees it - and they drifted five times in a week, each time because a rule
// lived in one of them and the other had never heard of it. There is one drawing now, so the rules
// they used to share are held here against the model instead: what is on the park is one answer,
// and the drawing has to stand all of it.

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: over.id ?? 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [],
  ...over,
} as BacklogItem);

/** A zoo with one of everything the park lays out: habitats built and being built, an animal in a
 *  habitat and one whose habitat is not up yet, amenities, planting, landscape. */
function busyPark(): ZooGameState {
  const base = initialZooState();
  return {
    ...base,
    zones: ['Big Cats', 'Grounds'],
    backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium' }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
      item({ id: 'enc2', name: 'Tiger Enclosure', enclosureSize: 'large' }),
      item({ id: 'tiger', name: 'Tiger', category: 'exhibit', template: 'tiger', enclosureId: 'enc2',
             status: 'committed', started: true }),
      item({ id: 'stray', name: 'Toucan', category: 'exhibit', template: 'toucan', enclosureId: 'nope' }),
      item({ id: 'kiosk', name: 'Kiosk', category: 'amenity', template: 'kiosk', zone: 'Grounds' }),
      item({ id: 'cafe', name: 'Cafe', category: 'amenity', template: 'cafe', zone: 'Grounds',
             status: 'committed', started: true }),
      item({ id: 'trees', name: 'Planting', category: 'flora', template: 'oak' }),
      item({ id: 'riv', name: 'River', category: 'flora', template: 'river', zone: 'Grounds' }),
      item({ id: 'bridge', name: 'Bridge', category: 'flora', template: 'bridge', zone: 'Grounds',
             status: 'committed', started: true }),
      item({ id: 'route', name: 'Paths', category: 'path', zone: 'Grounds', status: 'committed', started: true }),
    ],
  } as ZooGameState;
}

/** Where the park puts everything, and how much room it gives it. Read off the model rather than
 *  off a drawing: the layout is a rule about the zoo, not about how it is painted. */
function layout(state: ZooGameState): string[] {
  const standing = standingOnPark(state);
  const auto = parkPositions(standing);
  return standing
    .map((s) => { const p = positionOf(s, auto); return `${s.item.id} at ${Math.round(p.x)},${Math.round(p.y)} in ${s.size.w}x${s.size.h}`; })
    .sort();
}

describe('where the park puts things', () => {
  it('lays the same zoo out the same way', () => {
    // A golden master. What matters is not the numbers themselves but that they do not move: a
    // refactor that quietly re-arranges somebody's zoo is not a refactor.
    //
    // It has moved twice, on purpose. Every building site used to be hoarded off at a flat 64x60,
    // whatever was being built, so a shop was fenced into a kiosk-sized square and jumped to its
    // real size the moment it was delivered; a site is now the size of the thing that will stand
    // there. And it was read off the blueprint's own boxes until the blueprint was retired, so it
    // is now read from the model both drawings always agreed on.
    expect(layout(busyPark())).toMatchSnapshot();
  });
});

describe('the drawing stands everything that is on the park', () => {
  it('offers every standing thing to be picked up', () => {
    // The guard the two views needed, which one view still needs: what is on the park is decided by
    // `standingOnPark`, and the drawing must not quietly go back to having an answer of its own.
    const state = busyPark();
    const expected = standingOnPark(state).map((s) => s.item.id).sort();
    expect(expected.length).toBeGreaterThan(4);

    for (const id of expected) {
      const ringed = render(<IsoZoo state={state} height={460} selected={id} onPlaceItem={() => {}} />).container;
      const ring = [...ringed.querySelectorAll('polygon')].find((p) => p.getAttribute('stroke') === '#f97316');
      expect(ring, `${id} is on the park but cannot be picked up in the drawing`).toBeTruthy();
    }
  });
});

describe('rock is drawn as rock, not as a shrub', () => {
  const habitat = (feature: string): ZooGameState => {
    const base = initialZooState();
    return { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 },
             design: { parts: {}, colors: { ground: '#c9a86a', fence: '#7a5230' },
                       // The SAME colour for both, or this proves nothing: rocks start grey and a
                       // tree starts green, so two drawings of a tree - one tinted grey, one green -
                       // come back different and the test passes with the fault still in place.
                       // Held to one colour, only the shape is left to tell them apart.
                       flora: [{ x: 0.4, y: 0.5, s: 1.2, type: feature, foliage: '#8a8f96' }] } }),
    ] } as ZooGameState;
  };

  const drawn = (s: ZooGameState) => render(<IsoZoo state={s} height={460} />).container.innerHTML;

  it('tells a rock from a tree', () => {
    // There is no rock on the artwork sheet, so the drawing handed back what it had for a name it
    // did not know - a tree - and a boulder in a lion enclosure came out as a white tree.
    expect(drawn(habitat('rocks')), 'rocks are drawn exactly like a tree')
      .not.toEqual(drawn(habitat('tree')));
  });

  it('offers no pond inside a habitat, because the Water button already is one', () => {
    // Two ways to put water in a pen: a Water button that drew a proper pool, and a "pond" feature
    // that drew a tree tinted blue. One control that works beats two where one lies.
    expect(HABITAT_FEATURE_TYPES).not.toContain('pond');
    // ...and the one that works is still there and still draws water.
    const pool = { ...habitat('rocks') };
    const withWater = { ...pool, backlog: [{ ...pool.backlog[0],
      design: { ...pool.backlog[0].design!, water: [{ x: 0.4, y: 0.4, w: 0.3, h: 0.3 }] } }] } as ZooGameState;
    expect(drawn(withWater), 'the habitat Water button draws nothing').not.toEqual(drawn(pool));
  });
});

describe('turning what is standing there', () => {
  const turnGrip = (state: ZooGameState, id: string) => {
    const { container } = render(
      <IsoZoo state={state} height={460} selected={id} onPlaceItem={() => {}} onSetSize={() => {}} onSetRot={() => {}} />,
    );
    return [...container.querySelectorAll('circle')]
      .some((c) => /turn it/i.test(c.querySelector('title')?.textContent ?? ''));
  };

  it('turns habitats and buildings, not only landscape', () => {
    // "Can we rotate all enclosures and buildings too?" The grip was landscape-only, so the answer
    // was no - and a habitat or a building is exactly the thing you want to swing round, because
    // its front should face the path rather than whichever way it was drawn.
    const park = { ...busyPark(), backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium', pos: { x: 250, y: 200 } }),
      item({ id: 'shop', name: 'Gift Shop', category: 'amenity', template: 'shop', zone: 'Grounds', pos: { x: 520, y: 300 } }),
    ] } as ZooGameState;
    expect(turnGrip(park, 'enc'), 'a habitat cannot be turned').toBe(true);
    expect(turnGrip(park, 'shop'), 'a building cannot be turned').toBe(true);
  });
});
