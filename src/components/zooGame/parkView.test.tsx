import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { ParkView } from './ParkView';
import { IsoZoo } from './IsoZoo';
import { standingOnPark } from './parkModel';
import { HABITAT_FEATURE_TYPES } from './design';

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: over.id ?? 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [],
  ...over,
} as BacklogItem);

/** A delivered habitat with a lion standing in it. */
function zooWithALion(): ZooGameState {
  const base = initialZooState();
  return {
    ...base,
    zones: ['Big Cats'],
    attendance: { ...(base.attendance ?? {}), 'Big Cats': 400 },
    backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
    ],
  } as ZooGameState;
}

/** Press, move and release, the way a pointer does. jsdom has no layout, so the numbers the drag
 *  reads back are zeroes - what is under test is that the press is heard at all and that letting go
 *  puts the animal somewhere, not where it lands. */
function drag(el: Element, from: { x: number; y: number }, to: { x: number; y: number }) {
  const opts = { bubbles: true, cancelable: true, pointerId: 1 };
  el.dispatchEvent(new window.PointerEvent('pointerdown', { ...opts, clientX: from.x, clientY: from.y }));
  window.dispatchEvent(new window.PointerEvent('pointermove', { ...opts, clientX: to.x, clientY: to.y }));
  window.dispatchEvent(new window.PointerEvent('pointerup', { ...opts, clientX: to.x, clientY: to.y }));
}

describe('the park', () => {
  it('lets an animal be moved within its habitat after it is placed', () => {
    // Dragging a lion round its enclosure is the one bit of arranging that is not the Backlog: it
    // is how the park stops being a grid of boxes. It went quiet once, and quiet is the whole
    // problem with it - nothing errors, the animal simply does not follow the pointer.
    const onSetSpot = vi.fn();
    const { container } = render(
      <ParkView state={zooWithALion()} large view="plan" onSetSpot={onSetSpot} />,
    );
    const lion = container.querySelector('[style*="cursor"], .cursor-grab')
      ?? [...container.querySelectorAll('div')].find((d) => d.className.includes('cursor-grab'));
    expect(lion, 'nothing on the park offered itself as draggable').toBeTruthy();

    drag(lion!, { x: 100, y: 100 }, { x: 140, y: 130 });
    expect(onSetSpot, 'letting go of the lion did not move it').toHaveBeenCalled();
    expect(onSetSpot.mock.calls[0][0]).toBe('lion');
  });
});

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

/** Where the park puts everything, read off the rendered park. */
function layout(state: ZooGameState): string[] {
  const { container } = render(<ParkView state={state} large view="plan" />);
  return [...container.querySelectorAll<HTMLElement>('[style*="left:"]')]
    .filter((e) => e.style.top && e.style.left)
    .map((e) => `${e.style.left},${e.style.top}`)
    .sort();
}

describe('where the park puts things', () => {
  it('lays the same zoo out the same way', () => {
    // A golden master, written to hold the plan view still while the two views' shared rules were
    // pulled into one place. What matters is not the numbers themselves but that they do not move:
    // a refactor that quietly re-arranges somebody's zoo is not a refactor.
    //
    // It moved once, on purpose. Every building site used to be hoarded off at a flat 64x60,
    // whatever was being built, so a shop (94x72) was fenced into a kiosk-sized square and jumped
    // to its real size the moment it was delivered. A site is now the size of the thing that will
    // stand there, which is the same rule the finished building already followed.
    expect(layout(busyPark())).toMatchSnapshot();
  });
});

describe('the two views draw the same zoo', () => {
  it('stands the same things on the park, in both drawings', () => {
    // The guard this whole consolidation is for. The plan and the isometric view are two drawings of
    // one zoo, and they drifted five times in a week - each time because a rule lived in one of them
    // and the other had never heard of it. Both now read `standingOnPark`, so what is on the park is
    // one answer; this checks that neither has quietly gone back to having its own.
    const state = busyPark();
    const expected = standingOnPark(state).map((s) => s.item.id).sort();
    expect(expected.length).toBeGreaterThan(4);

    // The plan draws one positioned feature for each, plus whatever it positions that is not a
    // feature (a path label, a copy). Every standing item must be there.
    const plan = render(<ParkView state={state} large view="plan" />).container;
    const planCount = [...plan.querySelectorAll<HTMLElement>('[style*="left:"]')]
      .filter((e) => e.style.top && e.style.left).length;
    expect(planCount).toBeGreaterThanOrEqual(expected.length);

    // The isometric view offers exactly the standing items to be picked up and dragged.
    const iso = render(<IsoZoo state={state} height={460} onPlaceItem={() => {}} />).container;
    const isoSvg = iso.querySelector('svg[role="img"]')!;
    expect(isoSvg).toBeTruthy();
    // Each standing item can be selected there, and selecting it rings it.
    for (const id of expected) {
      const ringed = render(<IsoZoo state={state} height={460} selected={id} onPlaceItem={() => {}} />).container;
      const ring = [...ringed.querySelectorAll('polygon')].find((p) => p.getAttribute('stroke') === '#f97316');
      expect(ring, `${id} is on the park but cannot be picked up in the isometric view`).toBeTruthy();
    }
  });
});

describe('the plan is a plan', () => {
  it('marks what is there instead of drawing a second park', () => {
    // The plan view used to be a picture of the park too - grass with a texture, drawn animals,
    // pixel-art buildings, visitors on the promenade - competing with the isometric view, losing,
    // and costing every feature twice. It is a blueprint now: the drawing you build FROM, next to
    // the isometric view, which is the thing you built.
    const { container } = render(<ParkView state={zooWithALion()} large view="plan" />);

    // Drawn on a sheet, not on grass.
    const sheet = [...container.querySelectorAll<HTMLElement>('div')]
      .find((d) => (d.style.backgroundColor || '').length > 0 && d.style.backgroundImage.includes('linear-gradient'));
    expect(sheet, 'the park is not drawn on a ruled sheet').toBeTruthy();

    // The lion is MARKED - a ring with its initial - not illustrated.
    const marks = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(marks, 'the lion is not marked on the plan').toContain('L');

    // And nobody is walking about on it. A plan is not somewhere people are; it is the drawing they
    // will walk about in. The crowds are in the other view, where they are worth looking at.
    expect(container.querySelectorAll('.zoo-visitor'), 'somebody is walking about on the plan').toHaveLength(0);
    // nor is anything bobbing: a drawing holds still
    expect(container.querySelectorAll('.zoo-idle')).toHaveLength(0);
  });
});

describe('arranging a family', () => {
  const pride = (): ZooGameState => {
    const base = initialZooState();
    return { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
             design: { parts: {}, colors: {}, group: { males: 2, females: 0, juveniles: 1, cubs: 2 } } }),
    ] } as ZooGameState;
  };

  it('lets every animal of a family be picked up, not just the first', () => {
    // "If I add a family I need to be able to place them individually." Only the first of a pride
    // could be taken hold of; the rest were scenery arranged around it.
    const { container } = render(<ParkView state={pride()} large view="plan" onSetSpot={() => {}} onSetMemberSpot={() => {}} />);
    const grabbable = [...container.querySelectorAll('div')].filter((d) => d.className.includes('cursor-grab'));
    // five lions in the pride, and every one of them can be moved
    expect(grabbable.length, 'not every animal of the family can be picked up').toBeGreaterThanOrEqual(5);
  });

  it('puts the one that was dragged where it was dropped, and leaves the others alone', () => {
    const placed: { id: string; member: number }[] = [];
    const { container } = render(
      <ParkView state={pride()} large view="plan" onSetSpot={() => {}} onSetMemberSpot={(id, member) => placed.push({ id, member })} />,
    );
    const lions = [...container.querySelectorAll('div')].filter((d) => d.className.includes('cursor-grab'));
    drag(lions[2], { x: 100, y: 100 }, { x: 150, y: 120 });
    expect(placed, 'dragging one of the pride moved nothing').toHaveLength(1);
    expect(placed[0].id).toBe('lion');
    // it is the one that was taken hold of, not always the first
    expect(placed[0].member).toBeGreaterThan(0);
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

  const planView = (s: ZooGameState) => render(<ParkView state={s} large view="plan" />).container.innerHTML;
  const isoView = (s: ZooGameState) => render(<IsoZoo state={s} height={460} />).container.innerHTML;

  it('tells a rock from a tree in BOTH drawings', () => {
    // There is no rock on the artwork sheet, so the isometric view handed back what it had for a
    // name it did not know - a tree - and a boulder in a lion enclosure came out as a white tree.
    // The plan had the same fault in its own idiom: FloraSprite ignored the type it was given and
    // marked everything as planting, so rocks were drawn as a shrub.
    //
    // Both views, because that is the failure this game keeps having: a rule lands in one drawing
    // and the other has never heard of it.
    expect(isoView(habitat('rocks')), 'the Increment draws rocks exactly like a tree')
      .not.toEqual(isoView(habitat('tree')));
    expect(planView(habitat('rocks')), 'the plan marks rocks exactly like planting')
      .not.toEqual(planView(habitat('tree')));
  });

  it('offers no pond inside a habitat, because the Water button already is one', () => {
    // Two ways to put water in a pen: a Water button that drew a proper pool, and a "pond" feature
    // that drew a tree tinted blue. One control that works beats two where one lies.
    expect(HABITAT_FEATURE_TYPES).not.toContain('pond');
    // ...and the one that works is still there and still draws water.
    const pool = { ...habitat('rocks') };
    const withWater = { ...pool, backlog: [{ ...pool.backlog[0],
      design: { ...pool.backlog[0].design!, water: [{ x: 0.4, y: 0.4, w: 0.3, h: 0.3 }] } }] } as ZooGameState;
    expect(isoView(withWater), 'the habitat Water button draws nothing').not.toEqual(isoView(pool));
  });
});

describe('the grips for arranging a landscape feature', () => {
  const riverPark = (): ZooGameState => {
    const base = initialZooState();
    return { ...base, zones: ['Grounds'], backlog: [
      item({ id: 'riv', name: 'River', zone: 'Grounds', category: 'flora', template: 'river',
             status: 'committed', started: true, pos: { x: 410, y: 330 },
             design: { parts: { type: 'river', piece: 'stream' }, colors: {} } }),
    ] } as ZooGameState;
  };

  const grips = (opts: { building?: string } = {}) => {
    const { container } = render(
      <ParkView state={riverPark()} large view="plan" building={opts.building} onSetSize={() => {}} onSetRot={() => {}} onOpenBuild={() => {}} />,
    );
    return [...container.querySelectorAll<HTMLElement>('[title]')]
      .filter((e) => /longer|wider|turn it/i.test(e.getAttribute('title') ?? ''));
  };

  it('offers the turn grip on habitats and buildings, not only on landscape', () => {
    // "Can we rotate all enclosures and buildings too?" The grip was landscape-only, so the answer
    // was no - and a habitat or a building is exactly the thing you want to swing round, because
    // its front should face the path rather than whichever way it was drawn.
    const park = { ...riverPark(), backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium', pos: { x: 250, y: 200 } }),
      item({ id: 'shop', name: 'Gift Shop', category: 'amenity', template: 'shop', zone: 'Grounds', pos: { x: 520, y: 300 } }),
    ] } as ZooGameState;
    const { container } = render(
      <ParkView state={park} large view="plan" onSetSize={() => {}} onSetRot={() => {}} onOpenBuild={() => {}} />,
    );
    const turns = [...container.querySelectorAll('[title]')]
      .filter((e) => /turn it/i.test(e.getAttribute('title') ?? ''));
    expect(turns.length, 'neither the habitat nor the building can be turned').toBe(2);
  });

  it('offers a river a length grip, not only a width one', () => {
    // "I cannot shorten the length - only the width." Half of that was the model pinning a river to
    // a fixed length; the other half was here, hiding the length grip for a river on purpose,
    // because back then it always spanned the park. It does not any more.
    const titles = grips().map((g) => g.getAttribute('title') ?? '');
    expect(titles.some((t) => /longer/i.test(t)), 'a river has no grip for its length').toBe(true);
    expect(titles.some((t) => /wider/i.test(t)), 'a river has no grip for its width').toBe(true);
    expect(titles.some((t) => /turn it/i.test(t)), 'a river has no grip to turn it').toBe(true);
  });

  it('shows them while you are working on it, rather than only under a hovering mouse', () => {
    // "How do I turn the river? Where is the control?" It was there, and invisible until hovered -
    // which on a tablet is never, and this game is largely played on a tablet. A control nobody can
    // find is a control nobody has.
    // Class TOKENS, not substrings. `toContain('opacity-100')` passes on the hover-only class
    // `group-hover:opacity-100`, so the first version of this was satisfied by the very thing it
    // was written to catch.
    const shown = (g: Element) => g.className.split(/\s+/).includes('opacity-100');
    const hidden = (g: Element) => g.className.split(/\s+/).includes('opacity-0');
    for (const g of grips({ building: 'riv' })) {
      expect(shown(g), `${g.getAttribute('title')} stays hidden while you are working on it`).toBe(true);
    }
    // ...and out of the way the rest of the time.
    for (const g of grips()) expect(hidden(g), 'a grip is in the way when nobody wants it').toBe(true);
  });
});
