import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParkOptions } from './ParkOptions';
import { initialZooState } from './config';
import { writeBacklog, acceptSignal } from './engine';
import { answerable } from './parkChecks';
import type { ZooGameState, BacklogItem } from './types';

// A building has to be walked to, like everything else.
//
// "Can I walk to it from the way in?" is asked of a habitat and of a facility alike - it is the same
// question, and the park answers it by trying to walk there. But the pen that draws a path TO
// something was offered to a pathway and a habitat only, so a kiosk carried a criterion the park
// settles and had no control anywhere that could settle it: the only route to Done was the Product
// Owner waiving it, which is the thing this game exists to argue against.
//
// Reported from playing it: "all buildings need to be connected by paths. Only the enclosures has
// this as part of the PBI. Toilets, kiosks, etc all need paths."

const zoo = (): ZooGameState => writeBacklog(initialZooState(1) as ZooGameState,
  { zones: ['Big Cats', 'Waterside'], audience: 'families', firstZone: 'Big Cats' });

const strip = (state: ZooGameState, item: BacklogItem) => render(
  <ParkOptions state={state} item={item} inside={null} onDrawing={() => {}} drawing={false}
    api={{ onDesign: () => {}, onSetEnclosure: () => {} } as never} />,
);

describe('what every facility is asked', () => {
  it('asks a building to be walkable to, in the words the park knows', () => {
    const s = zoo();
    for (const it of s.backlog.filter((x) => x.category === 'amenity')) {
      const walk = (it.acceptance ?? []).filter(answerable)
        .filter((a) => /walk to it from the way in/i.test(a));
      expect(walk.length, `${it.name} is never asked whether anybody can reach it`).toBe(1);
    }
  });

  it('asks it of the one the visitors ask for, too', () => {
    // "Extra viewing area" carried "Placed where visitors can reach it" - the same question in words
    // nothing recognises, so the park could not answer any of that item's criteria.
    const before = zoo();
    const after = acceptSignal({ ...before, sprintNumber: 1,
      signals: [{ suggestion: 'Ease crowding', drivenBy: 'crowding', estimatedValue: 'high' }] } as ZooGameState, 0);
    const made = after.backlog.find((it) => !before.backlog.some((b) => b.id === it.id));
    expect(made, 'the crowding signal makes no item at all').toBeTruthy();
    expect((made!.acceptance ?? []).some(answerable),
      'not one of its criteria can be settled by anything but a waiver').toBe(true);
  });
});

describe('the pen that answers it', () => {
  const penFor = (category: BacklogItem['category']) => {
    const s = zoo();
    const it = s.backlog.find((x) => x.category === category)!;
    const { container } = strip(s, it);
    return container.textContent ?? '';
  };

  it('is offered to a building', () => {
    expect(penFor('amenity'), 'a kiosk has no way to draw the path it is judged on')
      .toMatch(/Draw a path to it/i);
  });

  it('is still offered to a habitat and a pathway', () => {
    expect(penFor('enclosure')).toMatch(/Draw a path to it/i);
    expect(penFor('path')).toMatch(/Draw a run/i);
  });

  it('is not offered to a tree', () => {
    // Planting is not walked to. Offering a pen for everything is the same mistake in the other
    // direction: a control that does nothing is a control that teaches nothing.
    expect(penFor('flora')).not.toMatch(/Draw a path to it/i);
  });
});
