import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { ParkView } from './ParkView';
import { IsoZoo } from './IsoZoo';
import { standingOnPark } from './parkModel';

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
      <ParkView state={zooWithALion()} large onSetSpot={onSetSpot} />,
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
  const { container } = render(<ParkView state={state} large />);
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
    const plan = render(<ParkView state={state} large />).container;
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
    const { container } = render(<ParkView state={zooWithALion()} large />);

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
