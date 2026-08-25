import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { ParkView } from './ParkView';

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
