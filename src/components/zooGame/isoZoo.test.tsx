import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { project, depth, boxFaces, fenceRun, tint, screenBounds } from './art/iso';
import { ISO_ART } from './art/isoArt.generated';
import { hasAnimalArt } from './art/animalArt';
import { TOOLBOX } from './toolboxItems';
import { VEHICLE_ART } from './art/vehicleArt.generated';

/** A species the game offers and nobody has drawn yet. Found rather than named, so the test does
 *  not date the day somebody draws whichever one was hard-coded. */
function undrawnSpecies(): string {
  const all = TOOLBOX.flatMap((g) => g.items).filter((i) => i.category === 'exhibit').map((i) => i.template!);
  const undrawn = all.find((t) => !hasAnimalArt(t));
  if (!undrawn) throw new Error('every species is drawn - this test has nothing left to check');
  return undrawn;
}

const item = (over: Partial<BacklogItem>): BacklogItem => ({
  id: over.id ?? 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [],
  ...over,
} as BacklogItem);

/** A zoo with one of everything the showcase knows how to draw. */
function zooWithEverything(): ZooGameState {
  const base = initialZooState();
  return {
    ...base,
    zones: ['Big Cats'],
    attendance: { ...(base.attendance ?? {}), 'Big Cats': 400 },
    backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
      item({ id: 'undrawn', name: 'Gorilla', category: 'exhibit', template: undrawnSpecies(), enclosureId: 'enc' }),
      item({ id: 'kiosk', name: 'Kiosk', category: 'amenity', template: 'kiosk', pos: { x: 520, y: 400 },
             design: { parts: { type: 'kiosk', sign: 'on' }, colors: { walls: '#e6ddd0', roof: '#b8563f', door: '#7a5230', sign: '#e6a53a' } } }),
      item({ id: 'sign', name: 'Signpost', category: 'amenity', template: 'signpost', pos: { x: 200, y: 420 },
             design: { parts: { type: 'signpost' }, colors: {} } }),
      item({ id: 'trees', name: 'Big Cats Planting', category: 'flora', template: 'oak', pos: { x: 420, y: 180 },
             design: { parts: { type: 'oak' }, colors: {} } }),
    ],
  } as ZooGameState;
}

describe('the isometric showcase', () => {
  it('draws the zoo that is actually there', () => {
    const { container } = render(<IsoZoo state={zooWithEverything()} />);
    const svg = container.querySelector('svg[role="img"]')!;
    expect(svg).toBeTruthy();
    // The ground, the habitat floor, the car park and a building are all polygons; the licensed
    // props are nested <svg>. If either count fell to nothing the view would be an empty green
    // diamond, which is exactly the failure that looks fine until you look at it.
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThan(12);
    expect(svg.querySelectorAll('svg').length).toBeGreaterThan(4);
    expect(svg.getAttribute('aria-label')).toMatch(/1 habitat/);
    expect(svg.getAttribute('aria-label')).toMatch(/2 exhibits/);
  });

  it('says what is in it, for anyone who cannot see it', () => {
    const empty = { ...initialZooState(), backlog: [] } as ZooGameState;
    const label = render(<IsoZoo state={empty} />).container.querySelector('svg')!.getAttribute('aria-label');
    expect(label).toMatch(/0 habitats/);
  });

  it('draws an animal it has no drawing for rather than dropping it', () => {
    // A species with no artwork yet must still appear - one that silently vanishes from the
    // Increment is the Review telling the team something untrue.
    const one = { ...zooWithEverything(), backlog: zooWithEverything().backlog.filter((i) => i.id !== 'lion') } as ZooGameState;
    const { container } = render(<IsoZoo state={one} />);
    expect(container.querySelectorAll('ellipse').length).toBeGreaterThan(0);
  });

  it('survives a zoo with nothing in it', () => {
    const { container } = render(<IsoZoo state={{ ...initialZooState(), backlog: [] } as ZooGameState} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('the isometric projection', () => {
  it('turns a world square into a diamond a little under twice as wide as it is tall', () => {
    const b = screenBounds(100, 100, 1);
    expect(b.w / b.h).toBeCloseTo(1.732, 2);
  });

  it('puts what is nearer the front later', () => {
    expect(depth(10, 10)).toBeGreaterThan(depth(0, 0));
    // Moving along either axis comes forward, which is what makes a single sort enough.
    expect(depth(20, 0)).toBeGreaterThan(depth(10, 0));
    expect(depth(0, 20)).toBeGreaterThan(depth(0, 10));
  });

  it('sends the two axes in opposite directions across the screen', () => {
    expect(project(10, 0, 1).x).toBeGreaterThan(0);
    expect(project(0, 10, 1).x).toBeLessThan(0);
    expect(project(10, 0, 1).y).toBeGreaterThan(0);
    expect(project(0, 10, 1).y).toBeGreaterThan(0);
  });

  it('gives a box a top and the two faces you can see', () => {
    const f = boxFaces(0, 0, 40, 40, 20, 1);
    for (const face of [f.top, f.left, f.right]) expect(face.split(' ')).toHaveLength(4);
    expect(f.top).not.toEqual(f.left);
    expect(f.left).not.toEqual(f.right);
  });

  it('fences a side with whole panels and no gap at the end', () => {
    const run = fenceRun({ x: 0, y: 0 }, { x: 200, y: 0 }, 1, false);
    expect(run.length).toBeGreaterThan(0);
    const covered = run.reduce((a, p) => a + p.w, 0);
    const span = Math.abs(project(200, 0, 1).x - project(0, 0, 1).x);
    expect(covered).toBeCloseTo(span, 1);
    // Panels sit in the order they are walked, so a nearer one is drawn over a further one.
    expect(run.map((p) => p.z)).toEqual([...run.map((p) => p.z)].sort((a, b) => a - b));
  });

  it('leaves a side too short to fence unfenced rather than drawing a stray post', () => {
    expect(fenceRun({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.5, true)).toEqual([]);
  });

  it('hands a tinted prop its colours and leaves no placeholder behind', () => {
    const fence = ISO_ART.fenceUp;
    expect(fence.tint).toBeGreaterThan(0);
    const painted = tint(fence.body, '#3b7a2f', fence.tint!);
    expect(painted).not.toMatch(/__T\d+__/);
    expect(painted).toMatch(/#[0-9a-f]{6}/i);
  });

  it('parks a vehicle for every occupied bay', () => {
    // A lot with cars in it and no vehicles drawn is the failure that looks like an empty car park
    // rather than like a bug.
    const { container } = render(<IsoZoo state={zooWithEverything()} />);
    const vehicles = [...container.querySelectorAll('svg[viewBox]')].filter((el) =>
      Object.values(VEHICLE_ART).some((v) => el.getAttribute('viewBox') === v.viewBox));
    expect(vehicles.length).toBeGreaterThan(2);
  });

  it('gives every vehicle its own definitions, so two of one can be parked', () => {
    // These come from an EPS, where clip paths and gradients arrive with shared ids. Extraction
    // renames them per vehicle; if it stopped doing that, the second copy of a van on the page
    // would be clipped to the first one's shape.
    const ids = new Map();
    for (const [name, v] of Object.entries(VEHICLE_ART)) {
      for (const m of v.body.matchAll(/id="([^"]+)"/g)) {
        const owner = ids.get(m[1]);
        expect(owner ?? name, `id ${m[1]} is in both ${owner} and ${name}`).toBe(name);
        ids.set(m[1], name);
      }
      for (const m of v.body.matchAll(/url\(#([^)]+)\)/g)) {
        expect(m[1].startsWith(`${name}_`), `${name} points at ${m[1]}, which is not its own`).toBe(true);
      }
    }
  });

  it('leaves no vehicle pointing at a gradient that was thrown away', () => {
    for (const [name, v] of Object.entries(VEHICLE_ART)) {
      expect(v.body, name).not.toMatch(/<linearGradient|<radialGradient/);
      const refs = [...v.body.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
      for (const r of refs) expect(v.body, `${name} points at ${r}`).toMatch(new RegExp(`id="${r}"`));
    }
  });

  it('builds a bridge rather than painting one, and builds it inside the picture', () => {
    // Landscape was one flat diamond lying on the grass, which suits a pond and not a bridge - the
    // one piece of landscape that is above the ground. It is now a deck with sides and handrails.
    //
    // And it is drawn where it can be seen. The geometry helpers hand back raw projected points,
    // which have to be shifted by the scene's margin; the first version of this forgot, and the
    // deck was drawn off the edge of the picture. Nothing errored - a polygon at the wrong
    // coordinates is still a polygon - it was simply a bridge nobody could see.
    const base = initialZooState();
    const state = { ...base, zones: ['Grounds'], backlog: [
      item({ id: 'br', name: 'Bridge', category: 'flora', zone: 'Grounds', template: 'bridge',
             pos: { x: 400, y: 350 }, size: { w: 74, h: 120 }, design: { parts: { type: 'bridge' }, colors: {} } }),
    ] } as ZooGameState;
    const { container } = render(<IsoZoo state={state} />);
    const svg = container.querySelector('svg[role="img"]')!;
    // handrails: posts and a rail along each of the two sides you walk between
    expect(svg.querySelectorAll('line').length).toBeGreaterThan(8);

    const [, , vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    // The bridge is the one group holding both polygons and lines - deck faces and handrails.
    const group = [...svg.querySelectorAll('g')].find((g) => g.querySelector('polygon') && g.querySelector('line'))!;
    expect(group, 'no bridge group was drawn').toBeTruthy();

    // Its parts have to be in the same place. Deck and rails are worked out in different coordinate
    // spaces - the geometry helpers hand back raw projected points, the props are already inset by
    // the scene's margin - so forgetting to shift one of them does not fail, it just puts that piece
    // somewhere else. A bridge whose deck is half a park away from its handrails is not a bridge.
    const xs: number[] = [], ys: number[] = [];
    for (const p of group.querySelectorAll('polygon')) {
      for (const q of (p.getAttribute('points') ?? '').trim().split(/\s+/)) {
        const [x, y] = q.split(',').map(Number); xs.push(x); ys.push(y);
      }
    }
    for (const l of group.querySelectorAll('line')) {
      xs.push(Number(l.getAttribute('x1')), Number(l.getAttribute('x2')));
      ys.push(Number(l.getAttribute('y1')), Number(l.getAttribute('y2')));
    }
    expect(xs.every(Number.isFinite) && ys.every(Number.isFinite)).toBe(true);
    const wide = Math.max(...xs) - Math.min(...xs), tall = Math.max(...ys) - Math.min(...ys);
    expect(wide, `the bridge is ${Math.round(wide)} across a ${Math.round(vw)}-wide picture`).toBeLessThan(vw * 0.35);
    expect(tall, `the bridge is ${Math.round(tall)} down a ${Math.round(vh)}-tall picture`).toBeLessThan(vh * 0.5);
    // and all of it inside the picture
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(vw);
  });

  it('holds nothing but drawing', () => {
    // Injected with dangerouslySetInnerHTML, from our own extraction of a licensed file.
    for (const [name, p] of Object.entries({ ...ISO_ART, ...VEHICLE_ART })) {
      expect(p.body, name).not.toMatch(/<script|<foreignObject|<iframe|<image|<use\b/i);
      expect(p.body, name).not.toMatch(/\son\w+\s*=/i);
      expect(p.body, name).not.toMatch(/javascript:|data:text\/html/i);
      expect(p.viewBox, name).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    }
  });
});
