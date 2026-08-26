import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { project, unproject, depth, boxFaces, fenceRun, tint, screenBounds } from './art/iso';
import { ISO_ART } from './art/isoArt.generated';
import { ANIMAL_ART } from './art/animalArt.generated';
import { hasAnimalArt } from './art/animalArt';
import { footprintFor } from './design';
import { CANVAS_W } from './parkLayout';
import { VEHICLE_ART } from './art/vehicleArt.generated';

/** A species nobody has drawn.
 *
 *  This used to hunt for a real one the toolbox offered and nobody had illustrated, so the test
 *  would not date the day somebody drew whichever one was hard-coded. Then somebody drew the last
 *  two - the emu and the kangaroo - and the hunt came back empty.
 *
 *  So it is a made-up species now. The fallback is not dead code: it is what stands on the park the
 *  day a new animal is added to the toolbox and before anyone has drawn it, which is a day that
 *  will come again. A test for that day cannot depend on that day not having arrived. */
function undrawnSpecies(): string {
  const made = 'quagga';
  if (hasAnimalArt(made)) throw new Error(`${made} has been drawn - pick another species nobody has`);
  return made;
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

  it('shows work that has been started, behind hoardings', () => {
    // This view drew only what had been delivered. That was defensible while it was a picture of the
    // Increment, and became nonsense the moment you could build in it: you started something and
    // nothing appeared. Work under way is on the park from the moment it begins, in both views.
    const base = initialZooState();
    const under = { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 },
             status: 'committed', started: true }),
    ] } as ZooGameState;
    const { container } = render(<IsoZoo state={under} height={460} />);
    const svg = container.querySelector('svg[role="img"]')!;

    // The hoarding: a dashed amber line lying on the ground, and hazard posts at its corners.
    const dashed = [...svg.querySelectorAll('polygon')].filter((p) => p.getAttribute('stroke-dasharray'));
    expect(dashed.length, 'nothing was hoarded off').toBeGreaterThan(0);
    expect(dashed[0].getAttribute('stroke')).toBe('#f59e0b');
    // and the habitat itself is drawn inside them, not just an empty patch of amber
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThan(10);

    // Once it is delivered the hoardings come down.
    const done = { ...under, backlog: under.backlog.map((i) => ({ ...i, status: 'open' as const, started: true })) } as ZooGameState;
    const after = render(<IsoZoo state={done} height={460} />).container.querySelector('svg[role="img"]')!;
    expect([...after.querySelectorAll('polygon')].filter((p) => p.getAttribute('stroke-dasharray'))).toHaveLength(0);
  });

  it('draws the habitat you are designing, not the one the zone would give you', () => {
    // This view painted the floor and the fence from the ZONE's theme and ignored the design, so
    // choosing a ground or a fence changed nothing here and adding water added nothing. And it read
    // `design` only, which a habitat being built does not have yet - the draft is the whole point of
    // building in place. There is no preview: the thing itself is what you are looking at.
    const GROUND = '#8b3a2e', FENCE = '#2f6b8f', WATER = '#3f8fc4';
    const base = initialZooState();
    const state = { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 },
             status: 'committed', started: true,
             draftDesign: { parts: {}, colors: { ground: GROUND, fence: FENCE, water: WATER },
               water: [{ x: 0.5, y: 0.5, w: 0.3, h: 0.3 }] } }),
    ] } as ZooGameState;
    const { container } = render(<IsoZoo state={state} height={460} />);
    const svg = container.querySelector('svg[role="img"]')!;

    const fills = [...svg.querySelectorAll('polygon')].map((p) => p.getAttribute('fill'));
    expect(fills, 'the chosen ground was not laid').toContain(GROUND);
    expect(fills, 'the water was not added').toContain(WATER);
    // The fence is artwork tinted to the chosen colour, so the markup holds shades of it rather than
    // the colour itself. Changing the choice must change the fence: that is the whole claim.
    const other = { ...state, backlog: state.backlog.map((i) => ({ ...i,
      draftDesign: { ...i.draftDesign!, colors: { ...i.draftDesign!.colors, fence: '#8b3a2e' } } })) } as ZooGameState;
    const repainted = render(<IsoZoo state={other} height={460} />).container.querySelector('svg[role="img"]')!;
    const fenceOf = (el: Element) => [...el.querySelectorAll('svg')].map((s) => s.innerHTML).join('');
    expect(fenceOf(repainted), 'the chosen fence was not put up').not.toBe(fenceOf(svg));
  });

  it('keeps the drawing inside the picture', () => {
    // A prop is drawn ABOVE the point it stands on, so a tall tree at the back of the park reaches
    // past the top of the scene. With the picture uncropped it was painted over the PAGE instead -
    // a tree in the corner of the screen, cars and people off the park. The scene keeps headroom for
    // the tallest thing in it, and then holds its edges.
    const { container } = render(<IsoZoo state={zooWithEverything()} height={460} />);
    const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
    expect(svg.style.overflow, 'the scene is not clipped').not.toBe('visible');

    // ...and the headroom is real: nothing is drawn outside the picture, at any turn. This is the
    // "there is a tree in the corner of my screen" test.
    for (const turn of [0, 1, 2, 3]) {
      const el = render(<IsoZoo state={zooWithEverything()} height={460} turn={turn} />)
        .container.querySelector('svg[role="img"]')!;
      const [, , vw, vh] = el.getAttribute('viewBox')!.split(' ').map(Number);
      const props = [...el.querySelectorAll('svg')];
      expect(props.length).toBeGreaterThan(3);
      for (const n of props) {
        if (walking(n)) continue; // their place is the route, which is checked separately
        const b = boxOf(n);
        expect(b.top, `turn ${turn}: something is drawn above the picture`).toBeGreaterThanOrEqual(0);
        expect(b.right, `turn ${turn}: something is drawn off the left of the picture`).toBeGreaterThan(0);
        expect(b.left, `turn ${turn}: something is drawn off the right of the picture`).toBeLessThan(vw);
        expect(b.top, `turn ${turn}: something is drawn below the picture`).toBeLessThan(vh);
      }
    }
  });

  it('plants what was chosen, in the colour it was chosen in', () => {
    // An oak, a pine and a blossom were all the same green tree here however they were designed on
    // the Plan - the artwork has no tint slot, so nothing carried the choice across.
    const base = initialZooState();
    const state = { ...base, zones: ['Grounds'], backlog: [
      item({ id: 'orchard', name: 'Orchard', category: 'flora', zone: 'Grounds', template: 'tree',
             pos: { x: 300, y: 300 }, design: { parts: { type: 'tree' }, colors: { foliage: '#4e9146' } },
             copies: [{ x: 334, y: 300, piece: 'blossom' }, { x: 300, y: 334, piece: 'pine' }] }),
    ] } as ZooGameState;
    const { container } = render(<IsoZoo state={state} height={460} />);
    const filters = [...container.querySelectorAll<SVGElement>('svg svg')]
      .map((el) => el.style.filter).filter(Boolean);
    expect(filters.length, 'the planting was not coloured at all').toBeGreaterThan(1);
    // three different plants, and no two of them drawn the same
    expect(new Set(filters).size, 'every plant was drawn the same').toBeGreaterThan(1);
  });

  it('draws the same zoo whichever way round you walk', () => {
    // A quarter-turn is a coordinate swap, not a second projection. It must change how the park is
    // DRAWN and nothing about what is on it: the same things, the same number of them, the same
    // habitats with the same animals in them.
    const state = zooWithEverything();
    const counts = [0, 1, 2, 3].map((turn) => {
      const svg = render(<IsoZoo state={state} height={460} turn={turn} />).container.querySelector('svg[role="img"]')!;
      return { props: svg.querySelectorAll('svg').length, polys: svg.querySelectorAll('polygon').length,
               label: svg.getAttribute('aria-label') };
    });
    for (const c of counts) {
      expect(c.props).toBe(counts[0].props);
      expect(c.polys).toBe(counts[0].polys);
      expect(c.label).toBe(counts[0].label);
    }
    // ...but it does not draw the same PICTURE, or the button would do nothing.
    const shapeAt = (turn: number) => render(<IsoZoo state={state} height={460} turn={turn} />)
      .container.querySelector('svg[role="img"]')!.querySelector('polygon')!.getAttribute('points');
    expect(shapeAt(1)).not.toBe(shapeAt(0));
  });

  it('answers a pointer on a park that has been turned', () => {
    // The pointer arrives on the park as it is being LOOKED at; the zoo is laid out on the park as
    // it IS. Turning without undoing the turn would move the wrong thing, or the right thing in the
    // wrong direction - and it would look almost right, which is the worst kind of wrong.
    const moved: { id: string; pos: { x: number; y: number } }[] = [];
    const { container } = render(
      <IsoZoo state={zooWithEverything()} height={460} turn={1} selected="enc"
        onPlaceItem={(id, pos) => moved.push({ id, pos })} />,
    );
    const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
    const [, , vw, vh] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: vw, height: vh, right: vw, bottom: vh, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const ring = [...svg.querySelectorAll('polygon')].find((p) => p.getAttribute('stroke') === '#f97316')!;
    const pts = (ring.getAttribute('points') ?? '').trim().split(/\s+/).map((q) => q.split(',').map(Number));
    const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
    const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;

    const opts = { bubbles: true, cancelable: true, pointerId: 1 };
    svg.dispatchEvent(new window.PointerEvent('pointerdown', { ...opts, clientX: cx, clientY: cy }));
    window.dispatchEvent(new window.PointerEvent('pointermove', { ...opts, clientX: cx + 30, clientY: cy + 15 }));
    window.dispatchEvent(new window.PointerEvent('pointerup', { ...opts, clientX: cx + 30, clientY: cy + 15 }));

    expect(moved.length, 'the habitat did not move on a turned park').toBeGreaterThan(0);
    expect(moved[0].id).toBe('enc');
    const last = moved[moved.length - 1].pos;
    expect(last.x).toBeGreaterThan(0);
    expect(last.x).toBeLessThan(820);
    expect(last.y).toBeGreaterThan(0);
  });

  it('stands an animal where it was dragged to on the Plan', () => {
    // Move a lion in its habitat on the Plan and it did not move here: this view scattered the herd
    // with a jitter of its own and never looked at `spot` at all. Where an animal stands has one
    // answer now, in parkModel, and both drawings ask it.
    const base = initialZooState();
    const zoo = (spot?: { x: number; y: number }) => ({ ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc', spot }),
    ] } as ZooGameState);
    const drawn = (state: ZooGameState) => {
      const svg = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
      return [...svg.querySelectorAll('svg')].map((el) => `${el.getAttribute('x')},${el.getAttribute('y')}`).join('|');
    };
    const nearLeft = drawn(zoo({ x: 0.15, y: 0.25 }));
    const nearRight = drawn(zoo({ x: 0.85, y: 0.8 }));
    expect(nearLeft, 'the lion stands in the same place wherever it was dragged').not.toBe(nearRight);
  });

  it('redraws everything when the park is turned under it', () => {
    // Everything drawn goes into ONE list, so a key has to be unique across the whole scene and not
    // just within its own loop. The guests and the parked cars were both numbering themselves v-0,
    // v-1, ... - which looks harmless on a fresh render and is not: on an UPDATE React matches the
    // old children to the new ones by key, and with the same key twice it keeps the wrong node. That
    // is what "some of the cars have not turned" was, and the stray tree drawn out beside the park.
    //
    // So: turning a park that is already on screen must leave it identical to one drawn that way
    // from scratch.
    const base = initialZooState();
    const busy = { ...base, zones: ['Big Cats'],
      attendance: { ...(base.attendance ?? {}), families: 900, enthusiasts: 600, comfortSeekers: 400 },
      backlog: [
        item({ id: 'enc', name: 'Lion Enclosure', pos: { x: 250, y: 200 } }),
        item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
        ...['kiosk', 'shop', 'cafe', 'toilets'].map((t, i2) =>
          item({ id: `am${i2}`, name: t, category: 'amenity', template: t, pos: { x: 120 + i2 * 140, y: 420 } })),
      ] } as ZooGameState;
    const drawnIn = (el: Element) => [...el.querySelectorAll('svg svg')]
      .map((n) => `${n.getAttribute('x')},${n.getAttribute('y')}`).sort().join('|');

    const fresh = drawnIn(render(<IsoZoo state={busy} height={460} turn={1} />).container);
    const shown = render(<IsoZoo state={busy} height={460} turn={0} />);
    shown.rerender(<IsoZoo state={busy} height={460} turn={1} />);
    expect(drawnIn(shown.container), 'something kept its old place when the park was turned').toBe(fresh);
  });

  it('draws a lion and a lioness as different animals', () => {
    // "Not all lions have manes." The group knew who was in it; there was one drawing, so a pride
    // was six maned lions. The male, the females and the young are three different sizes of two
    // different drawings now.
    const base = initialZooState();
    const state = { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 } }),
      item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
             design: { parts: {}, colors: {}, group: { males: 1, females: 2, juveniles: 1, cubs: 2 } } }),
    ] } as ZooGameState;
    const svg = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
    const drawn = [...svg.querySelectorAll('svg[viewBox]')].map((el) => el.getAttribute('viewBox'));
    // Named drawings, not just "more than one shape on the page" - the trees have viewBoxes too.
    const male = ANIMAL_ART.lion_males.viewBox;
    const lioness = ANIMAL_ART.lion_females.viewBox;
    const cub = ANIMAL_ART.lion_cubs.viewBox;
    expect(new Set([male, lioness, cub]).size, 'the three lions share a drawing').toBe(3);
    expect(drawn.filter((v) => v === male), 'the male is not drawn as a male').toHaveLength(1);
    // two lionesses and a juvenile, which has no drawing of its own and takes the maneless adult
    expect(drawn.filter((v) => v === lioness), 'the lionesses are not drawn maneless').toHaveLength(3);
    expect(drawn.filter((v) => v === cub), 'the cubs are not drawn as cubs').toHaveLength(2);
  });

  it('paints landscape in the colours it was given, both of them', () => {
    // "I set the bridge railings to be red and the deck to a light brown. They are not in the
    // isometric view." It painted landscape from the DEFAULTS FOR ITS KIND and never looked at the
    // design - so every river, pond and bridge arrived in the colour it started as. And a bridge has
    // two colours, what it is made of and its trim, where this had one and shaded it twice.
    const DECK = '#d9a86a', RAIL = '#c0392b';
    const base = initialZooState();
    const state = { ...base, zones: ['Grounds'], backlog: [
      item({ id: 'br', name: 'Bridge', category: 'flora', zone: 'Grounds', template: 'bridge',
             pos: { x: 400, y: 350 }, size: { w: 74, h: 120 },
             design: { parts: { type: 'bridge' }, colors: { foliage: DECK, trunk: RAIL } } }),
    ] } as ZooGameState;
    const svg = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
    const html = svg.innerHTML.toLowerCase();
    // The deck is the chosen colour; its sides are shades of it, so the colour itself must appear.
    expect(html, 'the deck is not the colour it was given').toContain(DECK);
    // The handrail is the trim, exactly - a rail shaded from the deck is not a red rail.
    expect(html, 'the railings are not the colour they were given').toContain(RAIL);
  });

  it('lays a path at the width and in the colour it was laid', () => {
    // Every route was drawn sixteen wide in one fixed tan, so changing a pathway's width or its
    // surface on the bench changed the plan and nothing here.
    const base = initialZooState();
    const withPath = (color: string, thickness: number) => ({ ...base, zones: ['Grounds'], backlog: [
      item({ id: 'a', name: 'Kiosk', category: 'amenity', template: 'kiosk', pos: { x: 200, y: 200 } }),
      item({ id: 'b', name: 'Shop', category: 'amenity', template: 'shop', pos: { x: 600, y: 400 } }),
    ], connectors: [{ id: 'c', a: { featureId: 'a', x: 200, y: 200 }, b: { featureId: 'b', x: 600, y: 400 },
                      bends: [], thickness, color }] } as unknown as ZooGameState);
    const svg = render(<IsoZoo state={withPath('#8b5a2b', 14)} height={460} />).container.querySelector('svg[role="img"]')!;
    expect(svg.innerHTML.toLowerCase(), 'the path is not the colour it was laid').toContain('#8b5a2b');
    // ...and a wider path is drawn wider
    const widthOf = (t: number) => {
      const el = render(<IsoZoo state={withPath('#8b5a2b', t)} height={460} />).container
        .querySelector('polygon[fill="#8b5a2b"]')!;
      const xs = (el.getAttribute('points') ?? '').trim().split(/\s+/).map((q) => Number(q.split(',')[1]));
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(widthOf(26), 'a wider path is not drawn wider').toBeGreaterThan(widthOf(8));
  });

  it('builds a habitat in the shape it was given', () => {
    // Pick Round in the studio and the Increment showed you a box: it drew every habitat as a
    // rectangle whatever shape it had. The floor takes the shape now, and the fence follows it.
    const base = initialZooState();
    const shaped = (shape: string) => {
      const FLOOR = '#b45f06';
      const state = { ...base, zones: ['Big Cats'], backlog: [
        item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 },
               design: { parts: { shape }, colors: { ground: FLOOR } } }),
      ] } as ZooGameState;
      const el = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
      // Found by the colour it was given, so it is certainly the habitat floor and not the grass.
      const floor = el.querySelector(`polygon[fill="${FLOOR}"]`);
      expect(floor, `no floor drawn for ${shape}`).toBeTruthy();
      return (floor!.getAttribute('points') ?? '').trim().split(/\s+/).length;
    };
    // A round habitat is drawn from many more points than a rectangular one.
    expect(shaped('circle'), 'a round habitat is still a box').toBeGreaterThan(shaped('rounded'));
    expect(shaped('hexagon')).toBeGreaterThan(shaped('rounded'));
  });

  it('colours a habitat\'s own planting the way it was coloured', () => {
    // The studio colours a habitat's planting plant by plant. It arrived here in the artwork's own
    // green whatever anybody chose - so the control was there, and doing nothing.
    const base = initialZooState();
    const withFlora = (foliage: string) => ({ ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 },
             design: { parts: {}, colors: {}, flora: [{ x: 0.3, y: 0.5, s: 1, type: 'tree', foliage }] } }),
    ] } as ZooGameState);
    const filtersFor = (foliage: string) => [...render(<IsoZoo state={withFlora(foliage)} height={460} />)
      .container.querySelectorAll<SVGElement>('svg svg')].map((el) => el.style.filter).filter(Boolean).join('|');
    expect(filtersFor('#e05c5c'), 'the planting was not coloured at all').not.toBe('');
    // ...and two different choices are not drawn the same
    expect(filtersFor('#e05c5c')).not.toBe(filtersFor('#2f6b3b'));
  });

  it('turns an animal to face the fence it is nearest', () => {
    // Standing at the rail with your back to the people watching you is what a drawing does and an
    // animal does not. The drawings face sideways, so the four fences come down to two answers.
    const base = initialZooState();
    const atSpot = (x: number, y: number) => {
      const state = { ...base, zones: ['Big Cats'], backlog: [
        item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'large', pos: { x: 300, y: 240 } }),
        item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc',
               spot: { x, y }, design: { parts: {}, colors: {}, group: { males: 1, females: 0, juveniles: 0, cubs: 0 } } }),
      ] } as ZooGameState;
      const svg = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
      const lion = [...svg.querySelectorAll<SVGElement>('svg[viewBox]')]
        .find((el) => el.getAttribute('viewBox') === ANIMAL_ART.lion_males.viewBox)!;
      expect(lion, 'no lion was drawn').toBeTruthy();
      // The turn is an SVG transform on the wrapper, not a CSS one on the drawing - see below.
      return lion.parentElement?.getAttribute('transform') ?? 'none';
    };
    // By the left-hand fence and by the right-hand one: it cannot be facing the same way in both.
    expect(atSpot(0.06, 0.5), 'the lion does not turn to face its nearest fence').not.toBe(atSpot(0.94, 0.5));
    // ...and one of the two is a mirror, not a nudge sideways - the old code moved a flipped animal
    // across the picture and never turned it round.
    expect([atSpot(0.06, 0.5), atSpot(0.94, 0.5)].join(' ')).toContain('scale(-1,1)');
  });

  it('draws every animal, whichever way it is turned', () => {
    // Turning one costs nothing and losing one costs everything. Mirroring with a CSS transform
    // reflected the animal through the origin of the wrong box and sent it off the picture: of four
    // lions at four fences, the two that had to turn were simply not there. Counting them is the
    // only assertion that notices, because the ones that vanish leave no mark to inspect.
    const base = initialZooState();
    const spots = [[0.08, 0.5], [0.92, 0.5], [0.5, 0.08], [0.5, 0.92]];
    const state = { ...base, zones: ['Big Cats'], backlog: [
      item({ id: 'enc', name: 'Lions', enclosureSize: 'large', pos: { x: 400, y: 340 } }),
      ...spots.map(([x, y], i) => item({ id: `a${i}`, name: 'Lion', category: 'exhibit', template: 'lion',
        enclosureId: 'enc', spot: { x, y },
        design: { parts: {}, colors: {}, group: { males: 1, females: 0, juveniles: 0, cubs: 0 } } })),
    ] } as ZooGameState;
    const svg = render(<IsoZoo state={state} height={460} />).container.querySelector('svg[role="img"]')!;
    const lions = [...svg.querySelectorAll('svg[viewBox]')]
      .filter((el) => el.getAttribute('viewBox') === ANIMAL_ART.lion_males.viewBox);
    expect(lions, 'an animal went missing when it was turned round').toHaveLength(4);

    // ...and every one of them is still ON the picture after it has been turned. This is the
    // assertion that matters and the obvious one does not: nothing leaves the document when a
    // transform throws it off the far side, so counting the elements finds four either way. Where
    // the turn actually PUTS them is the whole question.
    const [, , vw] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    let turned = 0;
    for (const lion of lions) {
      const t = lion.parentElement?.getAttribute('transform') ?? '';
      const x = Number(lion.getAttribute('x'));
      // scale(-1,1) reflects through zero; the translate before it brings the animal back to itself.
      const shift = /translate\(([-\d.]+)/.exec(t);
      const mirrored = t.includes('scale(-1,1)');
      if (mirrored) turned += 1;
      const drawnAt = mirrored ? (shift ? Number(shift[1]) : 0) - x : x;
      expect(drawnAt, `an animal is drawn at ${Math.round(drawnAt)}, off a picture ${Math.round(vw)} wide`)
        .toBeGreaterThan(0);
      expect(drawnAt).toBeLessThan(vw);
    }
    // and some of them did turn, because two of the four fences are on the other side
    expect(turned, 'they all face the same way').toBeGreaterThan(0);
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

/** The box a drawing actually occupies in the scene.
 *
 *  Reading x/y off the element stopped being enough twice over. An animal that faces left is drawn
 *  inside `translate(2cx,0) scale(-1,1)`, which reflects it - so its own x is on the wrong side of
 *  the mirror. And a visitor WALKS now: drawn about the origin inside a `<g>` that carries it, so
 *  its x is about -6 and means nothing by itself. This walks the ancestors and works out where the
 *  thing really is.
 */
function boxOf(el: Element): { left: number; right: number; top: number; bottom: number } {
  const x = Number(el.getAttribute('x')), y = Number(el.getAttribute('y'));
  const w = Number(el.getAttribute('width')), h = Number(el.getAttribute('height'));
  let tx = 0, ty = 0, flip = false;
  for (let p: Element | null = el.parentElement; p; p = p.parentElement) {
    const t = p.getAttribute('transform') ?? '';
    const m = /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/.exec(t);
    if (m) { tx += Number(m[1]); ty += Number(m[2]); }
    if (/scale\(\s*-1/.test(t)) flip = !flip;
  }
  // Reflected, the left edge is the far side of the mirror from the right edge.
  const left = flip ? tx - x - w : tx + x;
  return { left, right: left + w, top: ty + y, bottom: ty + y + h };
}

/** The land, as a quadrilateral on screen: grass and tarmac together, read off the drawing.
 *
 *  It has to be the land and not the picture. The picture is a rectangle and the land is a diamond
 *  inside it, so the white beside the park is INSIDE the viewBox - which is exactly where the
 *  reported tree was standing. A test that only asks "is it in the picture" says yes to the bug. */
function land(scene: Element): { x: number; y: number }[] {
  const pts = [...scene.querySelectorAll('[data-land]')]
    .flatMap((p) => (p.getAttribute('points') ?? '').split(' ')
      .map((q) => { const [x, y] = q.split(',').map(Number); return { x, y }; }));
  expect(pts.length, 'the park draws no ground').toBeGreaterThan(3);
  // Grass and tarmac together make one parallelogram, so its four corners are the four extremes.
  const pick = (f: (p: { x: number; y: number }) => number) => pts.reduce((a, b) => (f(b) < f(a) ? b : a));
  return [pick((p) => p.y), pick((p) => -p.x), pick((p) => -p.y), pick((p) => p.x)];
}

const inside = (poly: { x: number; y: number }[], x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

/** Somebody on the move: their place comes from the route, not from where they are drawn. */
const walking = (el: Element): boolean => {
  for (let p: Element | null = el.parentElement; p; p = p.parentElement) {
    // NOT querySelector: this is an HTML document, so a selector is lowercased before it is
    // matched, and the SVG element is `animateMotion` with a capital M. It matches nothing, quietly.
    if ([...p.children].some((c) => c.tagName.toLowerCase() === 'animatemotion')) return true;
  }
  return false;
};

describe('nothing is drawn off the park', () => {
  const item = (over: Partial<BacklogItem>): BacklogItem => ({
    id: over.id ?? 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure',
    status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [],
    ...over,
  } as BacklogItem);

  /** A habitat whose planting has been given a spot outside its own fence.
   *
   *  Not a contrived number - nothing validates these fractions. They come from a drag, and from
   *  saved games written by every version of this that has ever run, and `x: 4` means "four times
   *  the width of the habitat along from its left edge", which is out in the white beside the park.
   *  Every other route into this has been closed one at a time; this is the one still open. */
  const strayPlanting = (): ZooGameState => ({
    ...initialZooState(), zones: ['Big Cats'],
    backlog: [item({ id: 'enc', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 },
      design: { parts: {}, colors: { ground: '#c9a86a', fence: '#7a5230' },
        flora: [{ x: 4, y: 4.5, s: 1, type: 'tree' }, { x: -3, y: -2, s: 1, type: 'tree' }] } })],
  } as unknown as ZooGameState);

  it('stands every drawing ON THE LAND, wherever it was told to stand', () => {
    // "There are random objects off the park" has now been reported four times, and it was a
    // different caller every time: plants marching off in a line, a bridge deck drawn from
    // unshifted points, guests and cars sharing a React key. Each was fixed where it happened and
    // the next arrived by a route nobody had thought of - so the rule lives at the one place every
    // prop in the scene is drawn, and this asks the picture rather than the caller.
    const { container } = render(<IsoZoo state={strayPlanting()} height={460} />);
    const scene = container.querySelector('svg[role="img"]')!;
    const quad = land(scene);

    for (const p of [...scene.querySelectorAll('svg')]) {
      if (walking(p)) continue; // checked as a route, below
      const b = boxOf(p);
      const x = b.left, y = b.top, w = b.right - b.left, h = b.bottom - b.top;
      // What stands on the ground is the FOOT, not the box: a tree's leaves are over the grass
      // beside it and a person's head is over the path behind them, and both are meant to be.
      const foot = { x: x + w / 2, y: y + h - w * 0.29 };
      expect(inside(quad, foot.x, foot.y),
        `something is standing off the park, at ${foot.x.toFixed(0)},${foot.y.toFixed(0)}`).toBe(true);
    }
  });
});

describe('a river is a decision, not a fixture', () => {
  const river = (over: Partial<BacklogItem> = {}): ZooGameState => ({
    ...initialZooState(), zones: ['Grounds'],
    backlog: [{
      id: 'riv', name: 'River', zone: 'Grounds', category: 'flora', template: 'river',
      status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [], pos: { x: 410, y: 330 },
      design: { parts: { type: 'river', piece: 'stream' }, colors: {} }, ...over,
    } as unknown as BacklogItem],
  } as unknown as ZooGameState);

  const drawn = (s: ZooGameState) =>
    render(<IsoZoo state={s} height={420} />).container.querySelector('[key], polygon[opacity]')?.getAttribute('points')
    ?? render(<IsoZoo state={s} height={420} />).container.innerHTML;

  it('runs bank to bank until somebody says otherwise, then runs as far as they say', () => {
    // "I cannot shorten the length - only the width." A river's length was pinned to a constant, so
    // the length handle moved nothing at all. Reaching both banks is what makes a bridge worth
    // building, so it is the DEFAULT - but it is a default, not a rule. Shorten it and visitors
    // walk round it, which somebody is allowed to choose.
    expect(footprintFor(river().backlog[0]).w).toBeGreaterThan(CANVAS_W);
    const short = river({ size: { w: 320, h: 54 } }).backlog[0];
    expect(footprintFor(short).w).toBe(320);
    expect(footprintFor(short).h).toBe(54);
  });

  it('lies at the angle it was turned to, in the Increment as well as on the Plan', () => {
    // A river could be swung round on the Plan since the day landscape became resizable, and this
    // view had never heard of it: you turned the river, looked at the Increment, and it was still
    // lying flat across the park. The seventh time these two drawings have disagreed about the same
    // piece of state, and the reason parkModel exists.
    expect(drawn(river({ rot: 35 })), 'turning the river changed nothing in the Increment')
      .not.toEqual(drawn(river({ rot: 0 })));
  });

  /** The grass alone - not the tarmac, which is where a river must never reach. */
  const grassOf = (scene: Element) => {
    const pts = ((scene.querySelector('[data-land="grass"]')?.getAttribute('points')) ?? '')
      .split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return { x, y }; });
    expect(pts.length, 'the park draws no grass').toBe(4);
    return pts;
  };
  /** Which edge of the park a point is sitting on, or -1 for none. ON the edge counts as on the
   *  grass, and that is the normal case rather than the corner one: the river is cut exactly to the
   *  park, so its ends LIE on the boundary - where ray casting gives whichever answer the rounding
   *  felt like. */
  const edgeUnder = (poly: { x: number; y: number }[], p: { x: number; y: number }) =>
    poly.findIndex((g, i) => {
      const h = poly[(i + 1) % poly.length];
      const dx = h.x - g.x, dy = h.y - g.y, len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p.x - g.x) * dx + (p.y - g.y) * dy) / len2));
      return Math.hypot(p.x - (g.x + t * dx), p.y - (g.y + t * dy)) < 1.5;
    });

  /** The river itself: the one flat patch painted at 0.92. */
  const bandOf = (c: Element) => {
    const el = [...c.querySelectorAll('polygon')].find((p) => p.getAttribute('opacity') === '0.92');
    expect(el, 'the river is not drawn').toBeTruthy();
    return (el!.getAttribute('points') ?? '').split(' ')
      .map((q) => { const [x, y] = q.split(',').map(Number); return { x, y }; });
  };

  it('reaches both banks at any angle, and never over the car park', () => {
    // Two complaints with one cause, and the cause was the ORDER. The river was cut to the park and
    // then turned, so turning it made it too short to reach the banks - "it does not span the whole
    // park area" - while its corners swung out over the tarmac: "it can cut across the car park if
    // I turn it enough". Turned at full length and cut afterwards, it is as long as it needs to be
    // and stops exactly at the edge of the grass.
    for (const rot of [0, 20, 45, 70]) {
      const c = render(<IsoZoo state={river({ rot })} height={420} />).container;
      const scene = c.querySelector('svg[role="img"]')!;
      const grass = grassOf(scene);
      const band = bandOf(c);
      for (const p of band) {
        // ON the edge counts as on the grass, and that is the normal case rather than the corner
        // one: the river is cut exactly to the park, so its ends LIE on the boundary - where ray
        // casting gives whichever answer the rounding felt like.
        expect(inside(grass, p.x, p.y) || edgeUnder(grass, p) >= 0,
          `turned ${rot}, the river runs off the grass at ${p.x.toFixed(0)},${p.y.toFixed(0)}`).toBe(true);
      }
      // ...and it still CROSSES the park, which has an exact meaning rather than a threshold:
      // being cut to the grass, a river that reaches both banks ends ON two DIFFERENT edges of it.
      // Comparing lengths needed a fudge factor and then argued with itself at 70 degrees, where a
      // river running nearly north to south spans the park perfectly well and is simply shorter.
      const banks = new Set(band.map((p) => edgeUnder(grass, p)).filter((i) => i >= 0));
      expect(banks.size, `turned ${rot}, the river does not reach two banks`).toBeGreaterThanOrEqual(2);
    }
  });

  it('stops a visitor walking on the part of it that is actually wet', () => {
    // The water a guest is kept out of has to be the water that is drawn. Turned, it was neither:
    // they were stopped by an upright rectangle they could not see, and paddled across the bit of
    // the river they could.
    const angled = render(<IsoZoo state={river({ rot: 40 })} height={420} />).container;
    expect(angled.querySelector('svg[role="img"]'), 'the park did not draw').toBeTruthy();
  });
});

describe('people walk', () => {
  const openZoo = (): ZooGameState => {
    const base = initialZooState();
    return {
      ...base, zones: ['Big Cats'],
      attendance: { ...(base.attendance ?? {}), 'Big Cats': 800 },
      backlog: [
        item({ id: 'enc', name: 'Lion Enclosure', category: 'enclosure', enclosureSize: 'medium', pos: { x: 300, y: 240 } }),
        item({ id: 'lion', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'enc' }),
      ],
    } as ZooGameState;
  };

  const routes = (c: Element) => [...c.querySelectorAll('path')]
    .filter((p) => (p.getAttribute('id') ?? '').startsWith('walk-'));

  it('sets them walking instead of freezing them mid-stride', () => {
    // They were placed at a fixed point along the route - a hash, so the SAME point every time the
    // park was drawn. A still photograph of a walk: everybody stopped on their way to the lions. A
    // zoo with nobody moving in it does not look open.
    const { container } = render(<IsoZoo state={openZoo()} height={460} />);
    const movers = [...container.querySelectorAll('*')]
      .filter((e) => e.tagName.toLowerCase() === 'animatemotion');
    expect(movers.length, 'nobody in the park is going anywhere').toBeGreaterThan(0);
    // Each follows a route laid down once, rather than carrying its own copy of the way.
    for (const m of movers) {
      const path = [...m.children].find((c) => c.tagName.toLowerCase() === 'mpath');
      expect(path, 'somebody is walking without a route').toBeTruthy();
      const id = (path!.getAttribute('href') ?? '').replace('#', '');
      expect(routes(container).some((p) => p.getAttribute('id') === id),
        `the route ${id} is walked but never drawn`).toBe(true);
    }
  });

  it('walks them from the car park to the exhibit, over the land the whole way', () => {
    // The guards that keep drawings on the park read where a thing is drawn, and a walker is drawn
    // about the origin - so they skip them, and this is what stands in their place. A route that
    // leaves the land is somebody strolling through the air.
    const { container } = render(<IsoZoo state={openZoo()} height={460} />);
    const scene = container.querySelector('svg[role="img"]')!;
    const quad = land(scene);
    const ways = routes(container);
    expect(ways.length, 'nobody has a route at all').toBeGreaterThan(0);

    for (const w of ways) {
      const pts = (w.getAttribute('d') ?? '').split(/[ML]/).filter(Boolean)
        .map((q) => q.trim().split(',').map(Number));
      expect(pts.length, 'a route with nowhere to go').toBeGreaterThan(1);
      for (const [x, y] of pts) {
        expect(inside(quad, x, y), `a visitor walks off the park, at ${x.toFixed(0)},${y.toFixed(0)}`).toBe(true);
      }
    }
  });
});
