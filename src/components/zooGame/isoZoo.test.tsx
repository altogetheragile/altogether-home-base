import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { project, unproject, depth, boxFaces, fenceRun, tint, screenBounds } from './art/iso';
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

  it('keeps the visitors out of the river', () => {
    // They were scattered at random across the whole park, so some of them stood in the water.
    // A guest walks up from the car park and heads for something worth seeing; the water is a wall
    // with one door in it, and the door is the bridge.
    const base = initialZooState();
    const state = { ...base, zones: ['Big Cats'],
      attendance: { ...(base.attendance ?? {}), families: 500, enthusiasts: 250, comfortSeekers: 150 }, backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 300, y: 200 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
      item({ id: 'riv', name: 'River', category: 'flora', template: 'river',
             pos: { x: 400, y: 470 }, design: { parts: { type: 'river' }, colors: {} } }),
    ] } as ZooGameState;
    const { container } = render(<IsoZoo state={state} height={460} />);
    const svg = container.querySelector('svg[role="img"]')!;

    // The river is the widest blue thing on the ground; the visitors are nested <svg> props. Both
    // are in screen coordinates, so a visitor drawn over the water is one standing in it.
    const people = [...svg.querySelectorAll('svg')];
    expect(people.length, 'nobody came to the zoo').toBeGreaterThan(2);
    const blue = (fill: string | null) => {
      const m = /^#([0-9a-f]{6})$/i.exec(fill ?? '');
      if (!m) return false;
      const v = parseInt(m[1], 16);
      return (v & 0xff) > ((v >> 16) & 0xff) + 24 && (v & 0xff) > ((v >> 8) & 0xff) + 8;
    };
    const river = [...svg.querySelectorAll('polygon')].find((p) => blue(p.getAttribute('fill')));
    expect(river, 'no river was drawn').toBeTruthy();
    const pts = (river!.getAttribute('points') ?? '').trim().split(/\s+/).map((q) => q.split(',').map(Number));
    // Against the shape, not its bounding box: seen from the corner the river is a long diagonal
    // band, and the box round it covers most of the dry park.
    const inside = (x: number, y: number) => {
      let hit = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    // A prop hangs above the point it stands on, so its feet are the bottom of its box.
    for (const p of people) {
      const fx = Number(p.getAttribute('x')) + Number(p.getAttribute('width')) / 2;
      const fy = Number(p.getAttribute('y')) + Number(p.getAttribute('height'));
      expect(inside(fx, fy), `somebody is standing at ${Math.round(fx)},${Math.round(fy)}, in the river`).toBe(false);
    }
  });

  it('turns a point on the screen back into a place in the park', () => {
    // Dragging in this view is only possible if the projection can be run backwards, so this is the
    // one bit of arithmetic the whole thing rests on. It is a plain linear map, so the round trip is
    // exact rather than close.
    for (const u of [0.4, 1, 2.5]) {
      for (const [x, y] of [[0, 0], [820, 700], [123.5, 456.5], [-40, 900]]) {
        const back = unproject(project(x, y, u).x, project(x, y, u).y, u);
        expect(back.x).toBeCloseTo(x, 6);
        expect(back.y).toBeCloseTo(y, 6);
      }
    }
  });

  it('lets a habitat be dragged in the isometric view', () => {
    // It used to be read-only, which read as the game being broken rather than as a deliberate line:
    // this is the view carrying the artwork, so it is the view people want to be in.
    const moved: { id: string; pos: { x: number; y: number } }[] = [];
    const { container } = render(
      <IsoZoo state={zooWithEverything()} height={460} selected="enc"
        onPlaceItem={(id, pos) => moved.push({ id, pos })} />,
    );
    const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
    // jsdom lays nothing out, so the drag maths needs a box to measure against. Given the viewBox's
    // own size, one screen pixel is one scene unit and the sums are readable.
    const [, , vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: vw, height: vh, right: vw, bottom: vh, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    // The ring drawn round the selected habitat IS its footprint on screen, so its middle is a
    // point that is certainly on the lion enclosure - no guessing at the scene's own scale.
    const ring = [...svg.querySelectorAll('polygon')].find((p) => p.getAttribute('stroke') === '#f97316')!;
    expect(ring, 'the selected habitat was not ringed').toBeTruthy();
    const pts = (ring.getAttribute('points') ?? '').trim().split(/\s+/).map((q) => q.split(',').map(Number));
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
    const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;

    const opts = { bubbles: true, cancelable: true, pointerId: 1 };
    svg.dispatchEvent(new window.PointerEvent('pointerdown', { ...opts, clientX: cx, clientY: cy }));
    window.dispatchEvent(new window.PointerEvent('pointermove', { ...opts, clientX: cx + 40, clientY: cy + 20 }));
    window.dispatchEvent(new window.PointerEvent('pointerup', { ...opts, clientX: cx + 40, clientY: cy + 20 }));

    expect(moved.length, 'nothing moved when the habitat was dragged').toBeGreaterThan(0);
    expect(moved[0].id).toBe('enc');
    // Dragging down the screen in this projection walks into the park, not off the edge of it.
    const last = moved[moved.length - 1].pos;
    expect(last.x).toBeGreaterThan(0);
    expect(last.x).toBeLessThan(820);
    expect(last.y).toBeGreaterThan(0);
    expect(last).not.toEqual({ x: 300, y: 240 });
  });

  it('stays a picture when nothing may be moved', () => {
    // The Sprint Review shows the Increment; it is not a place to rearrange the zoo.
    const { container } = render(<IsoZoo state={zooWithEverything()} height={460} />);
    const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
    expect(svg.style.cursor).toBe('');
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
