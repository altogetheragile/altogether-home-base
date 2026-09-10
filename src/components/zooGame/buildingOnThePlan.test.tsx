import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ParkPlan } from './ParkPlan';
import { ParkOptions } from './ParkOptions';
import { initialZooState } from './config';
import { PLAY_H } from './parkLayout';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';

// A building, in the colours somebody is choosing for it.
//
// The plan drew every amenity as the same flat blue-grey box - a cafe and a lavatory block
// indistinguishable - so every colour picked landed somewhere invisible until the Increment tab.
// Reported from playing it: "when creating a building we do not see the colours being applied."
//
// From straight above, a building IS its roof, with the walls showing at the edge. So that is what
// the plan draws, with the door and the name board on the front - and the front is worked out the
// same way the isometric view works it out, by walking the four corners round from `quarterOf`. If
// the two ever disagreed about which wall the door is in, the answer to "which way should I turn
// this so it faces the path?" would depend on which drawing you were looking at.

const shop = (over: Partial<BacklogItem> = {}): BacklogItem => ({
  id: 'cafe', name: 'Cafe', zone: 'Big Cats', category: 'amenity',
  status: 'committed', started: true, sprintNumber: 1, estimate: 5,
  acceptance: [], acConfirmed: [], tasks: [],
  pos: { x: 400, y: 300 },
  design: { parts: { type: 'cafe' }, colors: { walls: '#a4623a', roof: '#3f6f4f', door: '#c8761f', sign: '#f4c430' } },
  ...over,
} as BacklogItem);

const park = (item: BacklogItem): ZooGameState => ({
  ...initialZooState(3), phase: 'sprint', sprintNumber: 1,
  backlog: [item],
} as ZooGameState);

const draw = (item: BacklogItem) => render(<ParkPlan state={park(item)} />).container;

/** Where the door is drawn, as a point. */
const doorAt = (c: HTMLElement) => {
  const line = c.querySelector('[data-part="front-door"]')!;
  return {
    x: (Number(line.getAttribute('x1')) + Number(line.getAttribute('x2'))) / 2,
    y: (Number(line.getAttribute('y1')) + Number(line.getAttribute('y2'))) / 2,
  };
};

describe('a building on the plan', () => {
  it('is drawn in the colours it was given', () => {
    const c = draw(shop());
    const fills = [...c.querySelectorAll('rect')].map((r) => r.getAttribute('fill'));
    expect(fills, 'the roof colour is nowhere on the park').toContain('#3f6f4f');
    const walls = [...c.querySelectorAll('rect')].map((r) => r.getAttribute('stroke'));
    expect(walls, 'the walls colour is nowhere on the park').toContain('#a4623a');
    const door = c.querySelector('[data-part="front-door"]');
    expect(door?.getAttribute('stroke'), 'the door colour went nowhere').toBe('#c8761f');
  });

  it('shows where the front door is, so it can be pointed at a path', () => {
    // "When turning it would be useful to know where the front door is so we can point at a path."
    const at = shop().pos!;
    const front = doorAt(draw(shop()));
    expect(front.y, 'the door is not on the front wall at all').toBeGreaterThan(at.y);
  });

  it('moves the door when the building is turned', () => {
    const at = shop().pos!;
    const north = doorAt(draw(shop({ rot: 180 })));
    const east = doorAt(draw(shop({ rot: 90 })));
    expect(north.y, 'turning it twice left the door where it was').toBeLessThan(at.y);
    expect(east.x, 'a quarter turn did not put the door on the side').toBeGreaterThan(at.x);
  });

  it('says nothing about a door on things that have none', () => {
    const habitat = { ...shop(), id: 'pen', category: 'enclosure', name: 'Lion Enclosure',
      enclosureSize: 'medium' } as BacklogItem;
    expect(draw(habitat).querySelector('[data-part="front-door"]'),
      'a fence grew a front door').toBeNull();
  });

  it('leaves the promenade alone - a building stands on the park, not on the way in', () => {
    // A guard on the fixture rather than the drawing: if the layout ever puts a building on the
    // front band, the door test above would be measuring the wrong thing.
    expect(shop().pos!.y).toBeLessThan(PLAY_H - 60);
  });
});

describe('laying a path', () => {
  it('keeps the pen down, so several runs can be drawn one after another', () => {
    // "Drawing paths is clunky. Can the draw tool stay active so multiple paths can be drawn at
    // once?" It put itself away after every run, so laying a path round a habitat meant pressing
    // "Draw a run" between each line.
    const laid: ZooConnector[] = [];
    const s = park(shop());
    const { container } = render(
      <ParkPlan state={s} tool="path" runFor="paths"
        onAddConnector={(c) => laid.push(c)} />,
    );
    const svg = container.querySelector('[data-part="park-plan"]')!;
    // jsdom lays nothing out, and the park maps a pointer through its own box.
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 820, height: 760,
      right: 820, bottom: 760, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const draw = (x1: number, y1: number, x2: number, y2: number) => {
      fireEvent.pointerDown(svg, { clientX: x1, clientY: y1 });
      fireEvent.pointerDown(svg, { clientX: x2, clientY: y2 });
    };
    draw(10, 10, 60, 60);
    draw(70, 70, 90, 90);
    expect(laid.length, 'the second run needed the tool taking out again').toBe(2);
  });
});

describe('a run of path', () => {
  it('can be taken back up', () => {
    // The bench that listed an item's runs went with the takeover and nothing replaced it, so a run
    // laid in the wrong place could not be picked up at all.
    const removed: string[] = [];
    const path = { ...shop(), id: 'paths', name: 'Big Cats Paths', category: 'path' } as BacklogItem;
    const s = {
      ...park(path),
      connectors: [{ id: 'run-1', itemId: 'paths', a: { x: 10, y: 10 }, b: { x: 90, y: 90 }, bends: [], thickness: 14, color: '#c9a86a' }],
    } as ZooGameState;
    const { container } = render(
      <ParkOptions state={s} item={path} inside={null}
        api={{ onDesign: () => {}, onSetEnclosure: () => {}, onRemoveRun: (id) => removed.push(id) }} />,
    );
    const lift = container.querySelector('[data-part="remove-run"]') as HTMLButtonElement | null;
    expect(lift, 'a run laid in the wrong place cannot be picked up').toBeTruthy();
    fireEvent.click(lift!);
    expect(removed, 'pressing it took nothing up').toEqual(['run-1']);
  });
});
