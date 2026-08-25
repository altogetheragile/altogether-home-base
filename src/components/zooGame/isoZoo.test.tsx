import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { initialZooState } from './config';
import type { BacklogItem, ZooGameState } from './types';
import { IsoZoo } from './IsoZoo';
import { project, unproject, depth, boxFaces, fenceRun, tint, screenBounds } from './art/iso';
import { ISO_ART } from './art/isoArt.generated';
import { ANIMAL_ART } from './art/animalArt.generated';
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
        const x = Number(n.getAttribute('x')), y = Number(n.getAttribute('y'));
        const w = Number(n.getAttribute("width"));
        expect(y, `turn ${turn}: something is drawn above the picture`).toBeGreaterThanOrEqual(0);
        expect(x + w, `turn ${turn}: something is drawn off the left of the picture`).toBeGreaterThan(0);
        expect(x, `turn ${turn}: something is drawn off the right of the picture`).toBeLessThan(vw);
        expect(y, `turn ${turn}: something is drawn below the picture`).toBeLessThan(vh);
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
             copies: [{ dx: 34, dy: 0, piece: 'blossom' }, { dx: 0, dy: 34, piece: 'pine' }] }),
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
    const male = ANIMAL_ART.lion_males.viewBox, lioness = ANIMAL_ART.lion_females.viewBox;
    expect(male).not.toBe(lioness);
    expect(drawn.filter((v) => v === male), 'the male is not drawn as a male').toHaveLength(1);
    expect(drawn.filter((v) => v === lioness).length, 'the lionesses and young are not drawn maneless')
      .toBeGreaterThanOrEqual(5);
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
