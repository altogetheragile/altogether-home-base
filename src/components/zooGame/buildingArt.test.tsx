import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { BUILDING_TYPES } from './design';

/** A park with one building of the given kind standing on it. */
const parkWith = (type: string, over: Record<string, unknown> = {}): ZooGameState => ({
  ...initialZooState(),
  zones: ['Grounds'],
  backlog: [{
    id: 'b', name: type, zone: 'Grounds', category: 'amenity', template: type,
    status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [],
    pos: { x: 300, y: 240 },
    design: { parts: { type, sign: 'on', ...(over.parts ?? {}) }, colors: { ...(over.colors ?? {}) } },
  } as unknown as BacklogItem],
} as unknown as ZooGameState);

/** Everything drawn for the building, colours and all. */
function drawingOf(state: ZooGameState): string {
  const { container } = render(<IsoZoo state={state} height={460} />);
  const g = container.querySelector('g[data-facility]');
  expect(g, 'nothing on the park is a building').toBeTruthy();
  return [...g!.querySelectorAll('polygon, line, ellipse')]
    .map((e) => `${e.tagName}:${e.getAttribute('points') ?? ''}:${e.getAttribute('fill') ?? e.getAttribute('stroke')}`)
    .join('|');
}

describe('a building looks like the kind of building it is', () => {
  it('draws every kind the game can offer', () => {
    // The drawn fallback used to be for kinds nobody had artwork for. There is no artwork now -
    // every building is drawn - so "no picture for this kind" has to be impossible rather than rare.
    for (const type of BUILDING_TYPES) {
      expect(drawingOf(parkWith(type)).length, `a ${type} is not drawn at all`).toBeGreaterThan(80);
    }
  });

  it('gives every kind its own shape, rather than letting one fall through to another', () => {
    // The complaint this came from: "a gift shop or cafe ... do not look like a cafe or a gift
    // shop". They were tiles out of a city set - flat-roofed boxes, near enough identical at the
    // size a park is drawn. What tells them apart now is the SHAPE, because that survives being
    // small, being turned, and being recoloured by whoever is playing.
    //
    // Comparing the two drawings does NOT catch this, and it took two goes to see why: a cafe and a
    // gift shop drawn by exactly the same code still come back different, because their footprints
    // differ so every coordinate does. The fault walks straight past a test that compares pictures.
    // What has to be checked is the recipe, because the way this breaks is a new kind of building
    // being added to the game and quietly taking the default one.
    const shapes = new Map<string, string>();
    for (const type of BUILDING_TYPES) {
      const { container } = render(<IsoZoo state={parkWith(type)} height={460} />);
      const shape = container.querySelector('g[data-facility]')?.getAttribute('data-facility');
      expect(shape, `a ${type} is not drawn as anything`).toBeTruthy();
      const twin = shapes.get(shape!);
      expect(twin, `a ${type} is drawn exactly like a ${twin} - it has no shape of its own`).toBeUndefined();
      shapes.set(shape!, type);
    }
  });

  it('puts up a sign, and takes it down again', () => {
    // The Sign control was read by neither view: you ticked it and nothing appeared anywhere. A
    // control that does nothing is worse than a missing one, and this one was in the Done gate.
    for (const type of BUILDING_TYPES) {
      const up = drawingOf(parkWith(type, { parts: { sign: 'on' } }));
      const down = drawingOf(parkWith(type, { parts: { sign: 'off' } }));
      expect(up, `taking the sign off a ${type} changes nothing on the park`).not.toEqual(down);
      expect(up.length, `a ${type} loses more than its sign`).toBeGreaterThan(down.length);
    }
  });

  it('wears the colours it was given, whichever kind it is', () => {
    // Four kinds arrived as photographs and could not be repainted, so their colour controls were
    // hidden - and that is what left the Gift Shop unfinishable. They are drawn now, so the paint
    // has to land on all of them.
    //
    // Asked by changing one colour at a time rather than by looking for the hex: a wall is painted
    // in three tones struck from the colour you chose, so the colour you chose is not in the
    // drawing anywhere. What matters is that turning the knob moves something.
    for (const type of BUILDING_TYPES) {
      const base = { colors: { walls: '#c8c8c8', roof: '#808080', door: '#606060', sign: '#a0a0a0' } };
      const paint = (k: string) => drawingOf(parkWith(type, { colors: { ...base.colors, [k]: '#123456' } }));
      const plain = drawingOf(parkWith(type, base));
      for (const key of ['walls', 'roof', 'sign']) {
        expect(paint(key), `a ${type} ignores the ${key} it was given`).not.toEqual(plain);
      }
    }
  });
});

describe('turning a building', () => {
  const at = (rot: number) => ({
    ...initialZooState(), zones: ['Grounds'],
    backlog: [{
      id: 'b', name: 'Cafe', zone: 'Grounds', category: 'amenity', template: 'cafe',
      status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [], rot,
      pos: { x: 300, y: 240 }, design: { parts: { type: 'cafe', sign: 'on' }, colors: {} },
    } as unknown as BacklogItem],
  } as unknown as ZooGameState);

  it('walks the front round, so the door can be made to face the path', () => {
    // The point of turning a building is that its front does not have to face the way the
    // illustrator happened to draw it. The turn is applied by walking the four walls round rather
    // than by rotating the drawing - an isometric box put through an arbitrary transform stops
    // agreeing with its own roof.
    const seen = new Map<string, number>();
    for (const rot of [0, 90, 180, 270]) {
      const d = drawingOf(at(rot));
      const twin = seen.get(d);
      expect(twin, `a cafe turned ${rot} is drawn exactly like one turned ${twin}`).toBeUndefined();
      seen.set(d, rot);
    }
  });

  it('rounds an in-between angle to the nearest quarter rather than skewing the box', () => {
    // Free rotation is the thing NOT to build here: everything in an isometric park shares two
    // axes, and that shared grid is the look.
    expect(drawingOf(at(37))).toEqual(drawingOf(at(0)));
    expect(drawingOf(at(80))).toEqual(drawingOf(at(90)));
  });
});
