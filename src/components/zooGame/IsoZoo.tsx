import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { shade, speciesColors, landscapePalette, floraDefaultColors, isLandscapeType, enclosureFlora, enclosureWater, enclosureShapePoints, pieceByKey } from './design';
import { standsOnPark } from './engine';
import { buildNav, routeAcross } from './parkNav';
import { insidePark, CANVAS_W, PLAY_H } from './parkLayout';
import { standingOnPark, parkPositions, restingPlace, groundSize, habitatSpot, workingDesign as working, parkType as landType } from './parkModel';
import { themeFor } from './zoneTheme';
import { carParkLayout, carCapacity, CAR_HW, CAR_HH, BUS_HW, BUS_HH, type CarSpot } from './carPark';
import { animalArtFor, coatFilter } from './art/animalArt';
import { KIND_SCALE, groupMembers } from './design';
import {
  project, unproject, depth as depthOf, screenBounds, groundPoints, boxFaces as boxFacesOf, boxTones,
  roofFaces as roofFacesOf, wallPanel as wallPanelOf, prop, tint, fenceRun as fenceRunOf, jitter, COS, type Pt,
} from './art/iso';
import { VEHICLE_ART } from './art/vehicleArt.generated';

/** The zoo, seen from the corner.
 *
 *  This draws exactly what the park view draws - the same items, in the same places, from the same
 *  state. In the Sprint Review it gives "inspect the Increment" something to inspect, in the shape a
 *  visitor would actually see.
 *
 *  It used to be read-only, on the reasoning that the plan is where a zoo is built and this is where
 *  it is looked at. That reasoning did not survive contact: this is the view carrying the drawn
 *  artwork, so it is the view people want to be in, and being unable to move anything in it read as
 *  the game being broken rather than as a deliberate line. Given `onPlaceItem` it is somewhere you
 *  build. The pointer is answered by running the projection backwards - see `unproject`.
 *
 *  Everything is sorted back to front before it is drawn, which is the whole trick of a view like
 *  this: get the order wrong and a lion stands in front of the fence that is meant to be holding it.
 */

/** What each kind of building is, before anybody has chosen anything about it.
 *
 *  `shape` is the part that matters and the part the player cannot change: it is how you tell a
 *  cafe from a gift shop across a park. The colours are only starting points - every one of them
 *  is a control in the studio. */
const FACILITY: Record<string, { walls: string; roof: string; sign: string; height: number;
  shape: 'awning' | 'hatch' | 'glazed' | 'stall' | 'plain' }> = {
  cafe:    { walls: '#f4eee3', roof: '#b8563f', sign: '#e8b84b', height: 30, shape: 'awning' },
  kiosk:   { walls: '#efe6d8', roof: '#3f8f6f', sign: '#e6a53a', height: 21, shape: 'hatch' },
  shop:    { walls: '#f5f0e7', roof: '#4a6fa5', sign: '#e0653f', height: 30, shape: 'glazed' },
  stall:   { walls: '#efe6d8', roof: '#c85a3c', sign: '#f2c14e', height: 17, shape: 'stall' },
  toilets: { walls: '#e9e7e1', roof: '#8f9aa3', sign: '#4a6fa5', height: 25, shape: 'plain' },
};

const VISITOR_PROPS = ['visitor01', 'visitor02', 'visitor03', 'visitor04', 'visitor05', 'visitor06', 'visitor07', 'visitor09'];
const CHILD_PROPS = ['child01', 'child02', 'child03'];

/** Anything with a place in the scene, carrying how far back it stands. */
interface Piece { z: number; el: React.ReactNode }

/** Colour a drawing to the foliage somebody chose.
 *
 *  The tree artwork arrives with no tint slot - unlike the fences, there is no marked colour in it
 *  to swap - so an oak, a pine and a blossom were all drawn as the same green tree however they were
 *  designed on the Plan. Turning the whole drawing by the difference between its own green and the
 *  chosen colour is not the same as repainting it leaf by leaf, but it is honest: choose a pink
 *  blossom on the Plan and a pink tree is what stands in the Increment. */
function foliageFilter(hex?: string): string | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return undefined;
  const v = parseInt(m[1], 16);
  const r = ((v >> 16) & 0xff) / 255, g = ((v >> 8) & 0xff) / 255, b = (v & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  // What the artwork already is: a mid, fairly saturated green.
  const BASE_H = 104, BASE_S = 0.42, BASE_L = 0.42;
  const turn = Math.round(((h - BASE_H + 540) % 360) - 180);
  return `hue-rotate(${turn}deg) saturate(${Math.max(0.15, sat / BASE_S).toFixed(2)}) brightness(${Math.max(0.55, Math.min(1.5, l / BASE_L)).toFixed(2)})`;
}

/** The outline of a habitat, as points round its own box.
 *
 *  The plan can draw a round habitat with a border-radius and a pill with one rule; from the corner
 *  there is no such shortcut, so the shape has to become points before it can be projected. Every
 *  habitat here was drawn as a rectangle whatever shape it had been given - pick Round in the studio
 *  and the Increment showed you a box.
 *
 *  Sampled coarsely on purpose: the fence is built of panels along each segment, and a segment too
 *  short to hold one is a gap in the fence.
 */
/** Does every side of this outline run true across the park? Only then can it wear the fence
 *  panels, which are drawn for those two directions and no other. */
function runsAll(outline: { x: number; y: number }[]): boolean {
  return outline.every((from, i) => {
    const to = outline[(i + 1) % outline.length];
    return Math.abs(to.x - from.x) < 0.5 || Math.abs(to.y - from.y) < 0.5;
  });
}

function outlineOf(shape: string, w: number, h: number): [number, number][] {
  if (shape === 'circle') {
    return Array.from({ length: 12 }, (_, i) => {
      const t = Math.PI * 0.25 + (i / 12) * Math.PI * 2;
      return [w / 2 + (w / 2) * Math.cos(t), h / 2 + (h / 2) * Math.sin(t)] as [number, number];
    });
  }
  if (shape === 'pill') {
    // A stadium: two straight sides and two rounded ends, each end a few segments.
    const r = h / 2, n = 4;
    const end = (cx: number, from: number) => Array.from({ length: n + 1 }, (_, i) => {
      const t = from + (i / n) * Math.PI;
      return [cx + r * Math.cos(t), h / 2 + r * Math.sin(t)] as [number, number];
    });
    return [...end(w - r, -Math.PI / 2), ...end(r, Math.PI / 2)];
  }
  const pts = enclosureShapePoints(shape, w, h, 0);
  if (pts) return pts.split(' ').map((q) => q.split(',').map(Number) as [number, number]);
  return [[0, 0], [w, 0], [w, h], [0, h]];
}

/** A patch of the park, in world coordinates. */
interface Rect { x0: number; y0: number; x1: number; y1: number }

const within = (r: Rect, p: Pt) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

/** A point some fraction of the way along a chain of points. */
function along(route: Pt[], t: number): Pt {
  const legs = route.length - 1;
  if (legs < 1) return route[0] ?? { x: 0, y: 0 };
  const at = Math.min(legs - 0.0001, Math.max(0, t) * legs);
  const i = Math.floor(at), f = at - i;
  const a = route[i], b = route[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

export function IsoZoo({ state, height = 460, className, turn = 0, onPlaceItem, selected, onSelect }: {
  state: ZooGameState;
  height?: number;
  className?: string;
  /** Quarter-turns clockwise: 0, 1, 2 or 3. Walk round the park to see behind something. */
  turn?: number;
  /** Move something. Given, this view stops being a picture and becomes somewhere you build. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const scene = useMemo(() => build(state, height, turn), [state, height, turn]);
  const svgRef = useRef<SVGSVGElement>(null);
  const editable = !!onPlaceItem;

  /** Where the pointer is, in the world the zoo is laid out in.
   *
   *  Three coordinate spaces, in order: the pointer arrives in the browser's, the drawing is scaled
   *  to whatever width it was given, and the scene is inset by its own margin. Undo all three and
   *  the projection can be run backwards. */
  const worldAt = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    const k = scene.w / r.width;
    const p = unproject((e.clientX - r.left) * k - scene.ox, (e.clientY - r.top) * k - scene.oy, scene.u);
    return scene.unturn(p.x, p.y);
  };

  /** What is under that point. Nearest first: where two things overlap, the pointer means the one
   *  in front, which is the one you can see. */
  const pick = (w: { x: number; y: number }) => [...scene.movable].sort((a, b) => b.z - a.z)
    .find((m) => Math.abs(w.x - m.x) <= m.w / 2 && Math.abs(w.y - m.y) <= m.h / 2);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!onPlaceItem) return;
    const w = worldAt(e);
    if (!w) return;
    const hit = pick(w);
    if (!hit) { onSelect?.(null); return; }
    onSelect?.(hit.id);
    e.preventDefault();
    // Held where it was grabbed, so it does not jump its own centre under the pointer.
    const grabX = w.x - hit.x, grabY = w.y - hit.y;
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (p) onPlaceItem(hit.id, insidePark({ w: hit.w, h: hit.h }, { x: p.x - grabX, y: p.y - grabY }));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // A ring round what is picked up, drawn on the ground in the same projection as everything else,
  // so it lies flat on the grass instead of floating over it as a browser rectangle would.
  const held = selected ? scene.movable.find((m) => m.id === selected) : undefined;
  const ring = held && scene.ground(held.x - held.w / 2, held.y - held.h / 2, held.x + held.w / 2, held.y + held.h / 2);

  return (
    <div className={className}>
      {/* The scene keeps its own proportions and takes the width it is given: a park drawn to fit a
          fixed height sits letterboxed in the middle of a wide panel, half the size it could be. */}
      <svg ref={svgRef} viewBox={`0 0 ${scene.w} ${scene.h}`} role="img" aria-label={scene.label}
        onPointerDown={editable ? onPointerDown : undefined}
        // Clipped. A prop is drawn ABOVE the point it stands on, so a tall tree at the back of the
        // park reaches past the top of the scene - and with the picture uncropped it was painted
        // over the page instead: a tree in the corner of the screen, cars and people off the park.
        // The scene keeps headroom for the tallest thing in it, and then holds its edges.
        style={{ display: 'block', width: '100%', height: 'auto', maxHeight: height,
          touchAction: editable ? 'none' : undefined, cursor: editable ? 'grab' : undefined }}>
        {scene.nodes}
        {ring && <polygon points={ring} fill="none" stroke="#f97316" strokeWidth={Math.max(1.2, scene.u * 2)} strokeLinejoin="round" pointerEvents="none" />}
      </svg>
    </div>
  );
}

function build(state: ZooGameState, targetH: number, turn = 0) {
  // WHAT is on the park, how big it is and where it stands are decided in one place, shared with
  // the plan view - see parkModel. This file's job is to draw it from the corner, nothing else.
  const standing = standingOnPark(state);
  const underWay = new Set(standing.filter((s) => s.underWay).map((s) => s.item.id));
  // Delivered work, for the counts: an animal living in a habitat is nested inside it rather than
  // standing on its own patch of ground, so it is not in `standing` and has to be counted from the
  // Backlog. The zoo has exhibits whether or not they take up room.
  const live = state.backlog.filter(standsOnPark);
  const encs = standing.filter((s) => s.item.category === 'enclosure').map((s) => s.item);
  const loose = standing.filter((s) => s.item.category !== 'enclosure').map((s) => s.item);
  const roomFor = new Map(standing.map((s) => [s.item.id, s]));

  // How busy the zoo is, on the same terms the park view uses: the lot fills with what is open to
  // visit, so the two views never disagree about how many cars turned up.
  const visitors = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const built = live.filter((i) => i.category === 'exhibit' || i.category === 'amenity').length;
  const carCount = Math.min(carCapacity(CANVAS_W), built * 3);
  const busCount = built >= 5 ? 2 : built >= 3 ? 1 : 0;
  const lot = carParkLayout(CANVAS_W, PLAY_H, carCount, busCount);
  const worldH = PLAY_H + lot.height;

  // ---- which way round the park is being looked at ---------------------------------------
  //
  // A quarter-turn is a coordinate swap, not a second projection: turn the world before projecting
  // it and everything follows, the back-to-front drawing order included. Quarter-turns only, on
  // purpose - every prop is drawn from one fixed angle, so at 37 degrees the trees, the cars and
  // the animals would all be facing the wrong way.
  //
  // Everything below still works in the park's own coordinates. The turn is applied here, in the
  // handful of places that convert a place in the park into a place in the picture.
  const q = ((turn % 4) + 4) % 4;
  const T = (x: number, y: number): Pt =>
    q === 1 ? { x: worldH - y, y: x }
      : q === 2 ? { x: CANVAS_W - x, y: worldH - y }
        : q === 3 ? { x: y, y: CANVAS_W - x }
          : { x, y };
  /** ...and back again, for a pointer arriving on a park that has been turned. */
  const unturn = (x: number, y: number): Pt =>
    q === 1 ? { x: y, y: worldH - x }
      : q === 2 ? { x: CANVAS_W - x, y: worldH - y }
        : q === 3 ? { x: CANVAS_W - y, y: x }
          : { x, y };
  /** A turned box is still a box - it is the corners that swap. */
  const Tbox = (x0: number, y0: number, x1: number, y1: number) => {
    const a = T(x0, y0), z = T(x1, y1);
    return [Math.min(a.x, z.x), Math.min(a.y, z.y), Math.max(a.x, z.x), Math.max(a.y, z.y)] as const;
  };
  // Turned a quarter, the park is as wide as it was tall.
  const RW = q % 2 ? worldH : CANVAS_W, RH = q % 2 ? CANVAS_W : worldH;

  // Fit the whole thing, car park included, into the space we have been given.
  const fit = screenBounds(RW, RH, 1);
  const u = Math.min((targetH * 1.9) / fit.w, targetH / fit.h) * 0.94;
  const b = screenBounds(RW, RH, u);
  const MARGIN = 26;
  // Room above the park for the tallest prop standing at the very back of it.
  const HEAD = (prop('tree')?.h ?? 0) * u * 1.9;
  const ox = b.ox + MARGIN, oy = b.oy + MARGIN + HEAD;

  const P = (wx: number, wy: number): Pt => { const t = T(wx, wy); const p = project(t.x, t.y, u); return { x: p.x + ox, y: p.y + oy }; };
  /** How far back something stands, on the park as it is being looked at. */
  const depth = (wx: number, wy: number): number => { const t = T(wx, wy); return depthOf(t.x, t.y); };
  const boxFaces = (x0: number, y0: number, x1: number, y1: number, h: number, k: number) => boxFacesOf(...Tbox(x0, y0, x1, y1), h, k);
  /** Fencing runs the way the park is turned, and a panel drawn up-slope becomes one drawn down. */
  const fenceRun = (from: Pt, to: Pt, k: number, up: boolean) => fenceRunOf(T(from.x, from.y), T(to.x, to.y), k, q % 2 ? !up : up);
  /** Everything is drawn inset by the scene's margin, but `boxFaces` and `roofFaces` hand back raw
   *  projected points. Anything built from those has to be shifted, or it is drawn off the edge of
   *  the picture - which is silent, because a polygon at the wrong coordinates is still a polygon. */
  const shift = (s: string) => s.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${(x + ox).toFixed(1)},${(y + oy).toFixed(1)}`; }).join(' ');
  const ground = (x0: number, y0: number, x1: number, y1: number) => shift(groundPoints(...Tbox(x0, y0, x1, y1), u));

  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((i) => i.zone)]));
  const themeOf = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));

  // Positions: the item's own spot if it has one, otherwise the same automatic layout the park uses,
  // so the two views never disagree about where anything is.
  const sizeOf = (it: BacklogItem): { w: number; h: number } => roomFor.get(it.id)?.size ?? groundSize(it);
  const auto = parkPositions(standing);
  const posOf = (it: BacklogItem): Pt => restingPlace(it, sizeOf(it), auto);

  const pieces: Piece[] = [];
  const push = (z: number, el: React.ReactNode) => pieces.push({ z, el });

  /** A licensed prop, standing on a world point. `k` scales it; props are drawn feet-down, so the
   *  drawing hangs above the point it stands on. */
  const place = (name: string, wx: number, wy: number, k: number, key: string, tintTo?: string, filter?: string) => {
    const p = prop(name);
    if (!p) return;
    const at = P(wx, wy);
    const w = p.w * k, h = p.h * k;
    const body = p.tint && tintTo ? tint(p.body, tintTo, p.tint) : p.body;
    push(depth(wx, wy), (
      <svg key={key} x={at.x - w / 2} y={at.y - h + w * 0.29} width={w} height={h} viewBox={p.viewBox} overflow="visible"
        style={filter ? { filter } : undefined} dangerouslySetInnerHTML={{ __html: body }} />
    ));
  };

  // ---- the land itself -------------------------------------------------------------------
  // Park and car park are one piece of ground, so the ground is drawn once, with one edge around
  // the outside of the lot. Giving the park its own edge put a cliff between the fence and the
  // tarmac that visitors were then seen to walk off.
  const nodes: React.ReactNode[] = [];
  const EDGE = 13;
  const grass = '#8cc063';
  const tarmac = '#9a9ea3';
  const promY = PLAY_H - 40;
  const cFL = P(0, worldH), cFR = P(CANVAS_W, worldH), cR = P(CANVAS_W, 0);
  nodes.push(
    <polygon key="edge-l" points={`${P(0, worldH).x},${P(0, worldH).y} ${cFR.x},${cFR.y} ${cFR.x},${cFR.y + EDGE} ${cFL.x},${cFL.y + EDGE}`} fill={shade(tarmac, -40)} />,
    <polygon key="edge-r" points={`${cR.x},${cR.y} ${cFR.x},${cFR.y} ${cFR.x},${cFR.y + EDGE} ${cR.x},${cR.y + EDGE}`} fill={shade(grass, -52)} />,
    <polygon key="grass" points={ground(0, 0, CANVAS_W, PLAY_H)} fill={grass} />,
    <polygon key="prom" points={ground(0, promY, CANVAS_W, PLAY_H)} fill="#e7d6a8" />,
    <polygon key="apron" points={ground(0, PLAY_H, CANVAS_W, worldH)} fill={tarmac} />,
  );

  // A bay's x,y is its CENTRE, the same as a parked car's - so the markings line up with what is
  // parked in them instead of sitting half a bay down the tarmac.
  for (const bay of lot.empties ?? []) {
    nodes.push(<polygon key={`bay-${bay.x}-${bay.y}`}
      points={ground(bay.x - bay.w / 2, bay.y - bay.h / 2, bay.x + bay.w / 2, bay.y + bay.h / 2)}
      fill="none" stroke="#f2f4f5" strokeWidth={Math.max(0.6, u * 1.4)} strokeLinejoin="round" />);
  }
  // The footway from the lay-by up to the gate, which is where the guests actually walk in.
  nodes.push(<polygon key="walkway" points={ground(lot.walkway.x, lot.walkway.y, lot.walkway.x + lot.walkway.w, lot.walkway.y + lot.walkway.h)} fill="#c9cdd1" />);

  // Where a guest may put their feet. Collected as the park is drawn, because the park is what
  // decides it: the paths are the ones actually laid, and the water is the water actually there.
  const walks: [Pt, Pt][] = [];
  const water: Rect[] = [];
  const dry: Rect[] = [];

  // ---- paths the player drew -------------------------------------------------------------
  for (const c of state.connectors ?? []) {
    const a = c.a.featureId ? posOf(state.backlog.find((i) => i.id === c.a.featureId) ?? ({} as BacklogItem)) : { x: c.a.x, y: c.a.y };
    const z = c.b.featureId ? posOf(state.backlog.find((i) => i.id === c.b.featureId) ?? ({} as BacklogItem)) : { x: c.b.x, y: c.b.y };
    if (!Number.isFinite(a.x) || !Number.isFinite(z.x)) continue;
    // The width and the colour the path was actually laid with. This drew every route sixteen wide
    // in one fixed tan, so changing a pathway's width or its surface on the bench changed the plan
    // and nothing here - and the Increment is where a path is meant to look like a path.
    const wdt = Math.max(4, (c.thickness || 14) * 1.15);
    const dx = z.x - a.x, dy = z.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * wdt, ny = (dx / len) * wdt;
    // Run each path half its own width past both ends, so where two meet they overlap into the
    // corner instead of leaving a notch. They are all one colour, so the overlap cannot be seen -
    // which is the whole trick: a junction should look like a junction, not like two paths.
    const ex = (dx / len) * wdt, ey = (dy / len) * wdt;
    const a2 = { x: a.x - ex, y: a.y - ey }, z2 = { x: z.x + ex, y: z.y + ey };
    const corners = [P(a2.x + nx, a2.y + ny), P(z2.x + nx, z2.y + ny), P(z2.x - nx, z2.y - ny), P(a2.x - nx, a2.y - ny)];
    nodes.push(<polygon key={`path-${c.id}`} points={corners.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill={c.color || '#ddc79a'} />);
    walks.push([{ x: a.x, y: a.y }, { x: z.x, y: z.y }]);
  }

  /** The hoardings round work that is under way.
   *
   *  The same language the plan view uses - amber hatching, a dashed line and hazard posts at the
   *  corners - so that "this is a building site" reads the same in both views. They come down when
   *  the item is Done and released, which is the Definition of Done made into something you watch.
   */
  const hoard = (id: string, x0: number, y0: number, x1: number, y1: number) => {
    const pad = 9;
    const a = x0 - pad, b = y0 - pad, c = x1 + pad, d = y1 + pad;
    const dash = Math.max(2.5, u * 7);
    nodes.push(
      <polygon key={`site-${id}`} points={ground(a, b, c, d)} fill="#f59e0b" opacity={0.16} />,
      <polygon key={`site-edge-${id}`} points={ground(a, b, c, d)} fill="none" stroke="#f59e0b"
        strokeWidth={Math.max(0.7, u * 1.6)} strokeDasharray={`${dash} ${dash * 0.7}`} strokeLinejoin="round" />,
    );
    const posts: [number, number][] = [[a, b], [c, b], [c, d], [a, d]];
    for (const [i, [px, py]] of posts.entries()) {
      const f = boxFaces(px - 3, py - 3, px + 3, py + 3, Math.max(2.5, u * 9), u);
      push(depth(px, py), (
        <g key={`post-${id}-${i}`}>
          <polygon points={shift(f.left)} fill="#b45309" />
          <polygon points={shift(f.right)} fill="#d97706" />
          <polygon points={shift(f.top)} fill="#fbbf24" />
        </g>
      ));
    }
  };

  // ---- enclosures ------------------------------------------------------------------------
  // ---- rock ----------------------------------------------------------------------------------
  //
  // A rocky outcrop, drawn rather than found. There is no rock on the artwork sheet, and rocks were
  // getting whatever the sheet handed back for a name it did not know - which was a tree. So a
  // boulder in a big cat enclosure came out as a white tree, and out on the grounds a Boulders item
  // was a flat grey rectangle lying on the grass.
  //
  // Each boulder is a ring of points at a height, its facets dropped to the ground and shaded by
  // which way they turn, with a paler cap on top. The ring is wobbled by `jitter`, which is a hash
  // rather than a random number, so a rock has its own shape and keeps it - the same rock every
  // time the park is drawn, which matters when the park is redrawn on every tick.
  const boulder = (key: string, cx: number, cy: number, r: number, h: number, hex: string, seed: number) => {
    const N = 6;
    const ring = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 + 0.35;
      const wob = 0.74 + jitter(seed + i, 5) * 0.5;
      return { x: cx + Math.cos(a) * r * wob, y: cy + Math.sin(a) * r * wob };
    });
    const cap = ring.map((q2) => { const s2 = P(q2.x, q2.y); return { x: s2.x, y: s2.y - h }; });
    const foot = ring.map((q2) => P(q2.x, q2.y));
    const pts = (ps: Pt[]) => ps.map((q2) => `${q2.x.toFixed(1)},${q2.y.toFixed(1)}`).join(' ');
    return (
      <g key={key}>
        {ring.map((_, i) => {
          const j = (i + 1) % N;
          const face = Math.sin((i / N) * Math.PI * 2 + 0.35);
          return <polygon key={i} points={pts([cap[i], cap[j], foot[j], foot[i]])}
            fill={shade(hex, -14 - Math.round(20 * (0.5 + 0.5 * face)))} />;
        })}
        <polygon points={pts(cap)} fill={shade(hex, 16)} />
      </g>
    );
  };

  /** An outcrop: a big one with two or three smaller ones tumbled round it. One boulder alone reads
   *  as a pebble somebody dropped; a group reads as rock. */
  const outcrop = (key: string, cx: number, cy: number, w: number, hex: string, seed: number) => {
    const r = Math.max(2.5, w * 0.3);
    const round = [[0, 0, 1], [-0.85, 0.34, 0.6], [0.78, 0.42, 0.52], [0.1, -0.66, 0.44]];
    return (
      <g key={key}>
        {round.map(([dx, dy, k], i) => boulder(`${key}-${i}`,
          cx + dx * r * 1.15, cy + dy * r * 1.15, r * k, Math.max(1.5, u * 15 * k), hex, seed + i * 7))}
      </g>
    );
  };

  for (const e of encs) {
    const c = posOf(e), size = sizeOf(e);
    const x0 = c.x - size.w / 2, y0 = c.y - size.h / 2, x1 = c.x + size.w / 2, y1 = c.y + size.h / 2;
    const theme = themeOf(e.zone);
    if (underWay.has(e.id)) hoard(e.id, x0, y0, x1, y1);

    // What has been designed so far - including the draft, because a habitat being built is exactly
    // the one whose ground and fence you are choosing right now. This view painted from the zone's
    // theme and ignored the design altogether, so picking a ground or a fence changed nothing here
    // and adding water added nothing. There is no preview: the thing itself is what you look at.
    const d = working(e);
    const floor = d?.colors.ground ?? theme.plot;
    const fence = d?.colors.fence ?? theme.plotBorder;

    // The habitat floor, laid flat, in the shape it was given.
    const outline = outlineOf(d?.parts.shape ?? 'rounded', size.w, size.h)
      .map(([px, py]: [number, number]) => ({ x: x0 + px, y: y0 + py }));
    nodes.push(<polygon key={`floor-${e.id}`} fill={floor}
      points={outline.map((q) => { const p = P(q.x, q.y); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')} />);

    // Water lies on the floor, in its own corner of the habitat - held as fractions of the box, so
    // it stays where it was put whatever size the habitat is.
    for (const [i, wf] of enclosureWater(d).entries()) {
      nodes.push(<polygon key={`water-${e.id}-${i}`}
        points={ground(x0 + wf.x * size.w, y0 + wf.y * size.h, x0 + (wf.x + wf.w) * size.w, y0 + (wf.y + wf.h) * size.h)}
        fill={d?.colors.water ?? '#5aa9c8'} />);
    }

    // Fencing, following the outline round.
    //
    // The panels are drawings, and there are two of them: one for a side running one way across the
    // park and one for the other. That is fine for a rectangle, whose four sides run exactly those
    // two ways, and impossible for a hexagon - a slanted side has no panel to stand along it, which
    // is why the first attempt at this scattered broken fencing round the shaped habitats.
    //
    // So a habitat whose sides all run true gets its pickets, and any other shape gets a low wall
    // built the same way the bridge deck is: one drawing per habitat, never half of each.
    const square = runsAll(outline);
    if (square) {
      const runs: [Pt, Pt, boolean][] = outline.map((from, i) => {
        const to = outline[(i + 1) % outline.length];
        return [from, to, Math.abs(to.y - from.y) > Math.abs(to.x - from.x)];
      });
      runs.forEach(([from, to, up], ri) => {
        for (const [pi, pl] of fenceRun(from, to, u, up).entries()) {
          const pr = prop(pl.name)!;
          nodes.push(null); // keep the key space stable
          push(pl.z, (
            <svg key={`f-${e.id}-${ri}-${pi}`} x={pl.x + ox} y={pl.y + oy} width={pl.w} height={pl.h} viewBox={pr.viewBox} overflow="visible"
              dangerouslySetInnerHTML={{ __html: tint(pr.body, fence, pr.tint ?? 3) }} />
          ));
        }
      });
    } else {
      const wallH = Math.max(3, u * 13);
      const up = (q: Pt, k: number): Pt => ({ x: q.x, y: q.y - k });
      outline.forEach((from, i) => {
        const to = outline[(i + 1) % outline.length];
        const a = P(from.x, from.y), b = P(to.x, to.y);
        // Each side is its own piece, sorted with everything else, so the near ones stand in front.
        push(depth((from.x + to.x) / 2, (from.y + to.y) / 2), (
          <g key={`w-${e.id}-${i}`}>
            <polygon points={[a, b, up(b, wallH), up(a, wallH)].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
              fill={shade(fence, -18)} />
            <line x1={up(a, wallH).x} y1={up(a, wallH).y} x2={up(b, wallH).x} y2={up(b, wallH).y}
              stroke={fence} strokeWidth={Math.max(1, u * 2)} strokeLinecap="round" />
          </g>
        ));
      });
    }

    // Planting inside the habitat: both the enclosure's own greenery, which is part of its design
    // and holds its own spot in the box, and any planting item dragged in on top of it.
    for (const [i, f] of enclosureFlora(d).entries()) {
      // In the colours it was given. A habitat's own planting is coloured plant by plant in the
      // studio and arrived here in the artwork's green whatever anybody chose - so the control was
      // there, and doing nothing.
      const fx = x0 + f.x * size.w, fy = y0 + f.y * size.h;
      if (f.type === 'rocks') {
        push(depth(fx, fy), outcrop(`ef-${e.id}-${i}`, fx, fy, 26 * (f.s || 1),
          f.foliage ?? floraDefaultColors('rocks').foliage, i * 11 + e.id.length));
        continue;
      }
      place(treeProp(f.type), fx, fy, u * 1.2 * (f.s || 1),
        `ef-${e.id}-${i}`, undefined, foliageFilter(f.foliage ?? floraDefaultColors(f.type).foliage));
    }
    const plants = roomFor.get(e.id)?.plants ?? [];
    plants.forEach((pl, i) => {
      const t = jitter(i + 1, e.id.length);
      const wx = x0 + 16 + t * Math.max(4, size.w - 32);
      const wy = y0 + 12 + jitter(i + 2, e.id.length + 7) * Math.max(4, size.h - 24);
      place(treeProp(landType(pl)), wx, wy, u * 1.2, `pl-${e.id}-${pl.id}-${i}`,
        undefined, foliageFilter(working(pl).colors.foliage));
    });

    // The animals themselves, in the side view they were drawn in.
    // Including the one being stocked right now, so you watch the lion arrive rather than having it
    // appear the instant somebody presses Done.
    const stock = roomFor.get(e.id)?.animals ?? [];
    // Flattened the same way the Plan flattens it, so the two views number the herd alike and an
    // animal dragged there is the animal that moves here.
    const herd = stock.flatMap((a) => {
      const members = groupMembers(working(a).group);
      const list = members.length ? members : [{ kind: 'males' as const, scale: KIND_SCALE.males }];
      return list.map((m, mi) => ({ a, m, mi }));
    });
    herd.forEach(({ a, m, mi }, hi) => {
      {
        const f = habitatSpot(a, hi, herd.length, mi, size);
        const wx = x0 + f.x * size.w;
        const wy = y0 + f.y * size.h;
        const species = a.template ?? a.id;
        // A lioness has no mane, and a cub is a small lion that has not grown one.
        const art = animalArtFor(species, m.kind);
        // ...and a coat is a decision about what the zoo is for, so it has to be visible. It was
        // drawn on the plan view's animals, and the plan view stopped drawing animals.
        const coat = coatFilter(working(a).parts.coat);
        const at = P(wx, wy);
        const key = `a-${e.id}-${a.id}-${mi}`;
        if (art) {
          const h = art.h * u * 0.30 * m.scale;
          const w = h * (art.w / art.h);
          // An animal looks at the fence it is nearest. Standing by the rail with your back to the
          // people watching you is what a drawing does and an animal does not, and it is the tell
          // that a habitat is a box with pictures in it rather than somewhere something lives.
          //
          // The drawings face sideways, so the four fences come down to two answers: the near edge
          // is either off to the left of the picture or off to the right. `flip` is the sheet's own
          // facing, so the two are combined rather than one overriding the other - which is also
          // what fixes the species that were marked flipped and were being SHIFTED sideways instead
          // of turned round, because the old transform moved them and never mirrored them.
          const toLeft = Math.min(wx - x0, y1 - wy);
          const toRight = Math.min(x1 - wx, wy - y0);
          const facesLeft = toLeft <= toRight;
          const mirror = facesLeft !== !!art.flip;
          push(depth(wx, wy), (
            // Mirrored with an SVG transform on a wrapper, about the line the animal stands on:
            // `scale(-1,1)` alone reflects through the origin and sends it off the far side, so the
            // translate brings it back. A CSS transform with transform-box: fill-box looked like the
            // tidier way to say this and put two lions in four somewhere off the picture entirely.
            <g key={key} transform={mirror ? `translate(${(at.x * 2).toFixed(1)},0) scale(-1,1)` : undefined}>
              <svg x={at.x - w / 2} y={at.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
                style={coat ? { filter: coat } : undefined}
                dangerouslySetInnerHTML={{ __html: art.body }} />
            </g>
          ));
        } else {
          // No drawing for this species yet: a coloured marker, so it is still visibly here.
          const cols = speciesColors(a);
          const r = Math.max(2, u * 7 * m.scale);
          push(depth(wx, wy), (
            <g key={key}>
              <ellipse cx={at.x} cy={at.y} rx={r * 1.1} ry={r * 0.5} fill="rgba(0,0,0,.16)" />
              <ellipse cx={at.x} cy={at.y - r * 0.8} rx={r} ry={r * 0.8} fill={cols.body} />
            </g>
          ));
        }
      }
    });
  }

  /** A bridge, built rather than painted on.
   *
   *  Every landscape feature was one flat coloured diamond lying on the grass, which is fine for a
   *  pond and wrong for a bridge: a bridge is the one piece of landscape that is above the ground,
   *  and drawing it flat left a brown rectangle in the water with nothing to walk on. This gives it
   *  the three things that read as a bridge from the corner - a deck you can see the top of, the
   *  side of that deck, and a handrail along both edges.
   */
  const bridge = (id: string, x0: number, y0: number, x1: number, y1: number, wood: string, trim: string) => {
    const deckH = Math.max(2.5, u * 7);
    const railH = Math.max(4, u * 10);
    const f = boxFaces(x0, y0, x1, y1, deckH, u);
    const up = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
    // The handrails run along the two long sides - the way you walk over it.
    const along = (x1 - x0) >= (y1 - y0);
    const sides: [Pt, Pt][] = along
      ? [[{ x: x0, y: y0 }, { x: x1, y: y0 }], [{ x: x0, y: y1 }, { x: x1, y: y1 }]]
      : [[{ x: x0, y: y0 }, { x: x0, y: y1 }], [{ x: x1, y: y0 }, { x: x1, y: y1 }]];
    // Planks across the way you walk, so the deck reads as a deck and not a slab of colour.
    const span = along ? x1 - x0 : y1 - y0;
    const n = Math.max(3, Math.min(14, Math.round(span / 14)));
    const planks = Array.from({ length: n - 1 }, (_, i) => {
      const t = (i + 1) / n;
      const a = along ? { x: x0 + (x1 - x0) * t, y: y0 } : { x: x0, y: y0 + (y1 - y0) * t };
      const z = along ? { x: x0 + (x1 - x0) * t, y: y1 } : { x: x1, y: y0 + (y1 - y0) * t };
      const A = up(P(a.x, a.y), deckH), B = up(P(z.x, z.y), deckH);
      return <line key={`k${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={shade(wood, -14)} strokeWidth={Math.max(0.35, u * 0.5)} />;
    });
    const post = Math.max(0.7, u * 1.1);
    const rails = sides.map(([a, z], s) => {
      const A = up(P(a.x, a.y), deckH), B = up(P(z.x, z.y), deckH);
      const posts = Array.from({ length: 6 }, (_, i) => {
        const t = i / 5, px = A.x + (B.x - A.x) * t, py = A.y + (B.y - A.y) * t;
        return <line key={`p${i}`} x1={px} y1={py} x2={px} y2={py - railH} stroke={shade(trim, -18)} strokeWidth={post} strokeLinecap="round" />;
      });
      return (
        <g key={`rail-${s}`}>
          {posts}
          <line x1={A.x} y1={A.y - railH} x2={B.x} y2={B.y - railH} stroke={trim} strokeWidth={Math.max(0.9, u * 1.5)} strokeLinecap="round" />
        </g>
      );
    });
    push(depth((x0 + x1) / 2, (y0 + y1) / 2), (
      <g key={`bridge-${id}`}>
        <polygon points={shift(f.left)} fill={shade(wood, -34)} />
        <polygon points={shift(f.right)} fill={shade(wood, -18)} />
        <polygon points={shift(f.top)} fill={wood} />
        {planks}
        {rails}
      </g>
    ));
  };

  // ---- facilities --------------------------------------------------------------------------
  //
  // Drawn, not photographed. These were tiles out of a city set - four flat-roofed boxes - and a
  // cafe looked like a gift shop looked like an office block. In a game whose whole subject is
  // showing somebody the thing they built, a building that cannot be told from its neighbour is
  // the one thing it must not be: "a gift shop or cafe do not have a sign. Nor do they look like a
  // cafe or a gift shop."
  //
  // So a building says what it is by its SHAPE, which survives being small and being turned:
  // an awning and parasols is a cafe, a hatch over a counter is a kiosk, a glazed front is a shop,
  // two doors in a plain block is a lavatory, a canopy on posts is a stall. Colour is what the
  // player chooses on top of that, and the sign colour is used where a sign would actually be -
  // the board over the door, the stripes of the awning - so choosing it does something visible.
  //
  // Everything below works in TURNED space: Tbox hands back corners already turned, so "the front"
  // is whichever wall faces the viewer. That is why it uses the raw iso helpers rather than the
  // turn-applying wrappers further up - turning twice puts the door round the back.
  const facility = (it: BacklogItem, c: Pt, size: { w: number; h: number }) => {
    const wd = working(it);
    const look = FACILITY[wd.parts.type ?? it.template ?? ''] ?? FACILITY.shop;
    const walls = wd.colors.walls ?? look.walls;
    const roof = wd.colors.roof ?? look.roof;
    const door = wd.colors.door ?? '#7a5230';
    const sign = wd.colors.sign ?? look.sign;
    const signed = wd.parts.sign !== 'off';

    const fw = size.w * 0.66, fh = size.h * 0.66;
    const [x0, y0, x1, y1] = Tbox(c.x - fw / 2, c.y - fh / 2, c.x + fw / 2, c.y + fh / 2);
    const wallH = Math.max(5, u * look.height);
    const tone = boxTones(walls), rt = boxTones(roof);
    const GLASS = '#a8cadd';

    /** A point on the park at a height above it, ready to draw. */
    const at = (wx: number, wy: number, h = 0): Pt => {
      const q2 = project(wx, wy, u); return { x: q2.x + ox, y: q2.y + oy - h };
    };
    const quad = (ps: Pt[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    /** A panel let into the wall facing the viewer, as fractions along it and up it. */
    const face = (t0: number, t1: number, h0: number, h1: number) =>
      shift(wallPanelOf({ x: x0, y: y1 }, { x: x1, y: y1 }, t0, t1, h0, h1, u));
    /** ...and into the one running away to the right. */
    const flank = (t0: number, t1: number, h0: number, h1: number) =>
      shift(wallPanelOf({ x: x1, y: y1 }, { x: x1, y: y0 }, t0, t1, h0, h1, u));
    const lerp = (t: number) => x0 + (x1 - x0) * t;

    /** A flat slab lying over the walls - a canopy, or a roof with no pitch to it. */
    const slab = (key: string, over: number, base: number, thick: number, hex: string) => {
      const t = boxTones(hex);
      const X0 = x0 - over, X1 = x1 + over, Y0 = y0 - over, Y1 = y1 + over, top = base + thick;
      return (
        <g key={key}>
          <polygon points={quad([at(X0, Y1, top), at(X1, Y1, top), at(X1, Y1, base), at(X0, Y1, base)])} fill={t.left} />
          <polygon points={quad([at(X1, Y1, top), at(X1, Y0, top), at(X1, Y0, base), at(X1, Y1, base)])} fill={t.right} />
          <polygon points={quad([at(X0, Y0, top), at(X1, Y0, top), at(X1, Y1, top), at(X0, Y1, top)])} fill={t.top} />
        </g>
      );
    };

    /** A striped awning sloping out over the front. The stripes are the sign colour, so the one
     *  thing you choose about how a cafe looks is the thing you see first. */
    const awning = (key: string, h: number, out: number, drop: number, bands: number) => (
      <g key={key}>
        {Array.from({ length: bands }, (_, i) => (
          <polygon key={i} fill={i % 2 ? '#f7f4ee' : sign}
            points={quad([at(lerp(i / bands), y1, h), at(lerp((i + 1) / bands), y1, h),
                          at(lerp((i + 1) / bands), y1 + out, h - drop), at(lerp(i / bands), y1 + out, h - drop)])} />
        ))}
      </g>
    );

    /** The name board: a fascia hung on the front, just under the eaves.
     *
     *  It has been in the wrong place twice. Free-standing above the ridge it read as a stray beam
     *  driven through the tiles; flush with the wall it disappeared behind the roof overhang, which
     *  is what an overhang is for. So it stands a hair proud of the wall and is painted after the
     *  roof - a board screwed to the front of a building, which is what a shop sign is.
     *
     *  Not lettered: at the size a park is drawn, type turns to mud. */
    const board = (t0 = 0.14, t1 = 0.86, lift = 0) => {
      const y = y1 + 0.9, lo = wallH * 0.72 + lift, hi = wallH * 0.98 + lift;
      const p0 = lerp(t0), p1 = lerp(t1), i0 = lerp(t0 + (t1 - t0) * 0.07), i1 = lerp(t1 - (t1 - t0) * 0.07);
      const band = (a: number, b: number, h0: number, h1: number) =>
        quad([at(a, y, h1), at(b, y, h1), at(b, y, h0), at(a, y, h0)]);
      return (
        <g key="sb">
          {/* Edged, so it separates from whatever is behind it. A cafe's board sat against a roof
              of nearly its own colour and vanished, which is a hard thing to see in a screenshot
              and an easy one to see in a game. */}
          <polygon points={band(p0, p1, lo, hi)} fill={shade(sign, -34)} />
          <polygon points={band(lerp(t0 + 0.012), lerp(t1 - 0.012), lo + (hi - lo) * 0.1, hi - (hi - lo) * 0.1)} fill={sign} />
          <polygon points={band(i0, i1, lo + (hi - lo) * 0.26, hi - (hi - lo) * 0.26)} fill={shade(sign, 28)} />
        </g>
      );
    };

    /** A parasol: a post and a disc. Two of these outside settle any argument about which building
     *  is the cafe. */
    const parasol = (key: string, wx: number, wy: number) => {
      const foot = at(wx, wy, 0), top = at(wx, wy, u * 22), r = Math.max(3, u * 12);
      return (
        <g key={key}>
          <ellipse cx={foot.x} cy={foot.y} rx={r * 0.5} ry={r * 0.25} fill="rgba(0,0,0,0.13)" />
          <line x1={foot.x} y1={foot.y} x2={top.x} y2={top.y} stroke="#8a8078" strokeWidth={Math.max(0.6, u * 1.1)} />
          <ellipse cx={top.x} cy={top.y} rx={r} ry={r * 0.5} fill={sign} />
          <ellipse cx={top.x} cy={top.y - r * 0.16} rx={r * 0.62} ry={r * 0.31} fill={shade(sign, 22)} />
        </g>
      );
    };

    const box = boxFacesOf(x0, y0, x1, y1, wallH, u);
    const walled = [
      <polygon key="wl" points={shift(box.left)} fill={tone.left} />,
      <polygon key="wr" points={shift(box.right)} fill={tone.right} />,
    ];
    const pitched = (rise: number) => {
      const r = roofFacesOf(x0, y0, x1, y1, wallH, Math.max(3, u * rise), Math.min(fw, fh) * 0.1, u);
      return [
        <polygon key="rf" points={shift(r.far)} fill={rt.left} />,
        <polygon key="rn" points={shift(r.near)} fill={rt.right} />,
        <polygon key="rg" points={shift(r.gable)} fill={rt.top} />,
      ];
    };

    let parts: React.ReactNode[];
    switch (look.shape) {
      case 'awning':
        // A cafe: its name board under the eaves, a striped awning below that, and tables out in
        // front under parasols. Sign above, awning below - the way a cafe front is actually stacked.
        parts = [
          ...walled,
          <polygon key="w1" points={face(0.08, 0.32, wallH * 0.24, wallH * 0.56)} fill={GLASS} />,
          <polygon key="dr" points={face(0.42, 0.60, 0, wallH * 0.56)} fill={shade(door, -6)} />,
          <polygon key="w2" points={face(0.70, 0.94, wallH * 0.24, wallH * 0.56)} fill={GLASS} />,
          <polygon key="fk" points={flank(0.24, 0.70, wallH * 0.28, wallH * 0.62)} fill={shade(GLASS, -12)} />,
          ...pitched(17),
          ...(signed ? [board()] : []),
          awning('aw', wallH * 0.68, Math.min(fh * 0.40, 13), Math.max(1.5, u * 5), 6),
          parasol('p1', x0 + (x1 - x0) * 0.20, y1 + Math.min(fh * 0.9, 26)),
          parasol('p2', x0 + (x1 - x0) * 0.74, y1 + Math.min(fh * 0.7, 20)),
        ];
        break;
      case 'hatch':
        // A kiosk: no door at all - a serving hatch with goods on the counter, under a canopy that
        // overhangs just enough to shade it. It swallowed the whole building at 30%.
        parts = [
          ...walled,
          <polygon key="ht" points={face(0.14, 0.86, wallH * 0.26, wallH * 0.62)} fill="#3b3a36" />,
          <polygon key="gd" points={face(0.20, 0.80, wallH * 0.30, wallH * 0.44)} fill={shade(sign, 12)} />,
          <polygon key="cs" points={face(0.10, 0.90, wallH * 0.22, wallH * 0.28)} fill={shade(walls, -10)} />,
          slab('rf', Math.min(fw, fh) * 0.13, wallH, Math.max(1.5, u * 4), roof),
          ...(signed ? [board(0.12, 0.88)] : []),
        ];
        break;
      case 'glazed':
        // A gift shop: a glazed shopfront with a mullion down it, a door at one end, its name board
        // across the top. Which is what a shop is, from the pavement.
        parts = [
          ...walled,
          <polygon key="gl" points={face(0.06, 0.66, wallH * 0.10, wallH * 0.66)} fill={GLASS} />,
          <polygon key="ml" points={face(0.35, 0.375, wallH * 0.10, wallH * 0.66)} fill={shade(walls, -22)} />,
          <polygon key="dr" points={face(0.72, 0.92, 0, wallH * 0.62)} fill={shade(door, -6)} />,
          <polygon key="fk" points={flank(0.24, 0.74, wallH * 0.28, wallH * 0.62)} fill={shade(GLASS, -14)} />,
          ...pitched(16),
          ...(signed ? [board(0.06, 0.94)] : []),
        ];
        break;
      case 'stall':
        // A stall has no walls: a counter, four posts, and a striped canopy over it. It was being
        // drawn as a park bench, which is a different thing to sit on entirely.
        parts = [
          <polygon key="ct" points={shift(boxFacesOf(x0, y1 - Math.max(3, fh * 0.3), x1, y1, wallH * 0.46, u).left)} fill={tone.left} />,
          <polygon key="cr" points={shift(boxFacesOf(x0, y1 - Math.max(3, fh * 0.3), x1, y1, wallH * 0.46, u).right)} fill={tone.right} />,
          <polygon key="cw" points={face(0.06, 0.94, wallH * 0.46, wallH * 0.52)} fill={shade(walls, 14)} />,
          ...[[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([px, py], i) => (
            <line key={`ps${i}`} x1={at(px, py, 0).x} y1={at(px, py, 0).y} x2={at(px, py, wallH).x} y2={at(px, py, wallH).y}
              stroke={shade(walls, -34)} strokeWidth={Math.max(0.7, u * 1.3)} />
          )),
          slab('rf', Math.min(fw, fh) * 0.08, wallH, Math.max(1, u * 2.5), roof),
          awning('cp', wallH, Math.min(fh * 0.34, 11), Math.max(1, u * 3), 6),
          ...(signed ? [board(0.2, 0.8, Math.max(1.5, u * 5))] : []),
        ];
        break;
      default:
        // A lavatory block: plain, flat-roofed, two doors and a vent over each. It is meant to be
        // the dullest building in the zoo, because that is what it is.
        parts = [
          ...walled,
          <polygon key="d1" points={face(0.12, 0.40, 0, wallH * 0.64)} fill={shade(door, -6)} />,
          <polygon key="d2" points={face(0.60, 0.88, 0, wallH * 0.64)} fill={shade(door, -6)} />,
          slab('rf', Math.min(fw, fh) * 0.1, wallH, Math.max(1.5, u * 4), roof),
          ...(signed ? [board(0.3, 0.7)] : []),
        ];
    }
    push(depth(c.x, c.y), <g key={`b-${it.id}`} data-facility={look.shape}>{parts}</g>);
  };

  // ---- amenities and loose planting -------------------------------------------------------
  for (const it of loose) {
    const c = posOf(it), size = sizeOf(it);
    if (underWay.has(it.id)) hoard(it.id, c.x - size.w / 2, c.y - size.h / 2, c.x + size.w / 2, c.y + size.h / 2);
    if (it.category === 'flora') {
      const type = landType(it);
      if (isLandscapeType(type)) {
        // The colours somebody CHOSE for it, not the ones its kind starts with. This read the
        // defaults for the type and ignored the design entirely, so a bridge given red railings and
        // a light brown deck arrived here in the brown it started as - and so did every river and
        // pond. A landscape feature has two colours: what it is made of, and its trim.
        const { primary, secondary } = landscapePalette(type, working(it).colors);
        // Held to the park. A river is longer than the park is wide, on purpose - that is what makes
        // it reach both banks - and painted at its full length it ran out over the edge of the grass
        // and hung in the air.
        const x0 = Math.max(0, c.x - size.w / 2), x1 = Math.min(CANVAS_W, c.x + size.w / 2);
        const y0 = Math.max(0, c.y - size.h / 2), y1 = Math.min(PLAY_H, c.y + size.h / 2);
        if (type === 'bridge') {
          bridge(it.id, x0, y0, x1, y1, primary, secondary);
          // A bridge is the one door through the water, and it is walked across bank to bank.
          dry.push({ x0, y0, x1, y1 });
          walks.push([{ x: (x0 + x1) / 2, y: y0 - 10 }, { x: (x0 + x1) / 2, y: y1 + 10 }]);
          continue;
        }
        if (type === 'river' || type === 'pond') water.push({ x0, y0, x1, y1 });
        if (type === 'rocks') {
          push(depth(c.x, c.y), outcrop(`land-${it.id}`, c.x, c.y, Math.min(x1 - x0, y1 - y0), primary, it.id.length * 3));
          continue;
        }
        nodes.push(<polygon key={`land-${it.id}`} points={ground(x0, y0, x1, y1)} fill={primary} opacity={0.92} />);
      } else {
        const plant = (name: string, wx: number, wy: number, key: string, foliage?: string) =>
          place(name, wx, wy, u * 1.9 * (FLORA_SCALE[name] ?? 1), key, undefined, foliageFilter(foliage));
        plant(treeProp(type), c.x, c.y, `t-${it.id}`, working(it).colors.foliage);
        // The rest of what this item plants. One planting PBI is several trees, and it has to be
        // several here too - otherwise switching to this view loses everything but the first.
        for (const [i, k] of (it.copies ?? []).entries()) {
          const at = insidePark({ w: 8, h: 8 }, { x: k.x, y: k.y });
          const piece = pieceByKey(k.piece);
          plant(treeProp(piece?.type ?? type, k.piece), at.x, at.y, `t-${it.id}-${i}`,
            piece?.colors.foliage ?? working(it).colors.foliage);
        }
      }
      continue;
    }
    // A facility, drawn as the kind of building it is.
    const special = amenityProp(it);
    if (special) { place(special, c.x, c.y, u * 0.85, `am-${it.id}`); continue; }
    facility(it, c, size);
  }

  // ---- the car park ------------------------------------------------------------------------
  for (const [i, spot] of (lot.spots ?? []).entries()) push(...vehicle(spot, i, u, P, depth, q));

  // ---- visitors ----------------------------------------------------------------------------
  //
  // Everything drawn goes into ONE list, so every key in this file has to be unique across the whole
  // scene and not just within its own loop. The guests and the parked cars were both numbering
  // themselves `v-0`, `v-1`, ... - React's answer to a duplicate key is that children "may be
  // duplicated and/or omitted", and it was both: a tree drawn out on the page beside the park, and
  // cars that kept their old angle when the park was turned under them.
  //
  // People arrive. They were scattered at random over the whole park instead, which put them in the
  // river and gave no sense of anyone going anywhere. A visit has a shape: you park, you walk up
  // from the lot, and you head for something worth seeing.
  //
  // So everyone stands somewhere on a route from the car park to an exhibit - along the paths the
  // player laid where there are any, and never in the water. Some come on their own and some come
  // as a family, because a zoo on a good day is mostly families.
  const wet = (p: Pt) => water.some((r) => within(r, p)) && !dry.some((r) => within(r, p));
  const gate = { x: lot.walkway.x + lot.walkway.w / 2, y: lot.walkway.y };
  const arrival = { x: gate.x, y: lot.walkway.y + lot.walkway.h - 6 };  // stepping off the tarmac
  const entry = { x: gate.x, y: promY + 18 };                            // on the promenade

  /** The way to one exhibit: up from the lot, onto the promenade, then along whatever the player
   *  has actually laid - the same path network the guests in the plan view used to walk, which is
   *  where this routing comes from. Water is a wall with one door in it, and the door is a bridge. */
  const nav = buildNav({ paths: walks.map(([a, z]) => [a, z]), water, crossings: dry });
  const routeTo = (target: Pt): Pt[] => [arrival, entry, ...(routeAcross(nav, entry, target) ?? [target])];
  // Somewhere worth walking to: the habitats, or the middle of the park if none are open yet.
  const draws = encs.length ? encs.map((e) => posOf(e)) : [{ x: CANVAS_W / 2, y: promY - 120 }];
  const routes = draws.map(routeTo);

  const parties = Math.max(1, Math.min(14, Math.round(visitors / 80)));
  let n = 0;
  for (let i = 0; i < parties; i++) {
    const route = routes[i % routes.length];
    // Spread the parties down the route so the walk reads as a walk: some just off the tarmac,
    // some most of the way to the lions.
    const t = 0.08 + jitter(i + 1, 7) * 0.88;
    const at = along(route, t);
    const spot = { x: at.x + (jitter(i + 3, 5) - 0.5) * 16, y: at.y + (jitter(i + 4, 11) - 0.5) * 14 };
    if (spot.x < 14 || spot.x > CANVAS_W - 14 || spot.y < 14 || spot.y > worldH - 14) continue;
    if (wet(spot)) continue;
    place(VISITOR_PROPS[n % VISITOR_PROPS.length], spot.x, spot.y, u * 0.92, `guest-${n}`); n += 1;
    // Every third party is a family: another grown-up and a child or two, at their elbow.
    if (i % 3 !== 2) continue;
    const withThem = 1 + (i % 2);
    for (let k = 0; k <= withThem; k += 1) {
      const beside = { x: spot.x + 9 + k * 8, y: spot.y + (k % 2 ? 7 : -5) };
      if (wet(beside) || beside.x > CANVAS_W - 14) continue;
      const kid = k > 0;
      const pool = kid ? CHILD_PROPS : VISITOR_PROPS;
      place(pool[(n + k) % pool.length], beside.x, beside.y, u * (kid ? 0.72 : 0.9), `guest-${n}-${k}`);
    }
    n += 1;
  }

  pieces.sort((a, z) => a.z - z.z);
  const total = screenBounds(RW, RH, u);
  return {
    w: total.w + MARGIN * 2,
    h: total.h + MARGIN * 2 + EDGE + HEAD,
    nodes: [...nodes.filter(Boolean), ...pieces.map((p) => p.el)],
    label: `The zoo from above: ${encs.length} habitat${encs.length === 1 ? '' : 's'}, ${live.filter((i) => i.category === 'exhibit').length} exhibits, ${visitors} visitors`,
    // What a pointer can take hold of, and the frame needed to work out where it is pointing. The
    // hit area is the thing's own footprint on the ground - not its drawing, which for a habitat
    // includes fences and animals standing well above it, and for a tree is mostly sky.
    u,
    ox,
    oy,
    /** A pointer arrives on the park as it is being LOOKED at; the zoo is laid out on the park as it
     *  IS. One of these undoes the turn, the other draws a box in the picture. */
    unturn,
    ground,
    movable: [...encs, ...loose].map((it) => {
      const c = posOf(it), s = sizeOf(it);
      return { id: it.id, name: it.name, x: c.x, y: c.y, w: s.w, h: s.h, z: depth(c.x, c.y) };
    }),
  };
}

/** Which tree drawing a planting gets. Two shapes is enough to stop an avenue looking stamped. */
/** How big a piece of planting is drawn, against a tree.
 *
 *  Everything was drawn at a tree's size, which made a signpost as tall as the oak behind it and
 *  wider than the giraffe - and four of them a thicket of crossed arms. A signpost is a post with a
 *  sign on it: it is smaller than a kiosk, and much smaller than a tree. */
const FLORA_SCALE: Record<string, number> = { signpost: 0.42, hedge: 0.8, fountain: 0.9 };

function treeProp(type?: string, piece?: string): string {
  // What it is beats what it is called. This used to pick between the two trees on whether the
  // type's name had an even number of letters, which drew a signpost as a sapling.
  switch (type) {
    case 'signpost': return 'signpost';
    case 'fountain': return 'fountain';
    case 'hedge': case 'shrub': case 'bush': case 'flowers': return 'hedge';
    default: break;
  }
  // Two trees and several kinds of tree, so a mixed planting is visibly mixed rather than a row of
  // the same drawing: the taller one for the taller pieces.
  return piece === 'pine' || piece === 'palm' ? 'treeTall' : 'tree';
}

/** Some amenities are a thing the sheet already has a drawing of, and a drawn bench beats a box. */
function amenityProp(it: BacklogItem): string | undefined {
  const t = working(it).parts.type ?? it.template;
  if (t === 'signpost') return 'signpost';
  if (t === 'bench' || t === 'seating') return 'bench';
  if (t === 'fountain') return 'fountain';
  return undefined;
}

/** The vehicles in the lot, from the illustration sheet.
 *
 *  They are all drawn facing one way, along the sheet's own axis. Mirroring an isometric drawing
 *  horizontally gives you the other axis, which is exactly the pair the car park needs: cars nose up
 *  to the curb along one, coaches lie along their lay-by on the other.
 *
 *  Both rows of cars therefore face the same way, where a real lot would have them nose to nose.
 *  At the size a car is drawn here that is not a thing anyone can see, and the alternative is a
 *  drawing that does not exist. */
const CARS = ['suv', 'saloonRed', 'saloonBlue', 'saloonGrey', 'estateRed', 'estate4x4', 'vanYellow', 'pickup', 'cityCar'];
const LARGE = ['coach', 'boxVan'];

function vehicle(spot: CarSpot, i: number, u: number, P: (x: number, y: number) => Pt,
  depth: (x: number, y: number) => number,
  /** Quarter-turns of the park: a bay that ran across it now runs up it, so a car that nosed into
   *  its bay is lying along it. The same swap the fencing needs. */
  q: number): [number, React.ReactNode] {
  const name = spot.bus ? LARGE[i % LARGE.length] : CARS[i % CARS.length];
  const art = VEHICLE_ART[name];
  const [hw, hh] = spot.bus ? [BUS_HW, BUS_HH] : [CAR_HW, CAR_HH];
  // A coach lies along its lay-by; a car noses into its bay. `rot` is radians, not degrees.
  const across = (Math.abs(Math.sin(spot.rot)) > 0.5) !== (q % 2 === 1);
  const fw = (across ? hw : hh) * 2, fh = (across ? hh : hw) * 2;
  // Fit the drawing's width to the width its footprint projects to, so a coach takes a coach's
  // room - less a margin, because a drawing carries its own shadow and a car sized to the outside
  // of that parks on top of its neighbour.
  const k = (((fw + fh) * COS * u) / art.w) * 0.8;
  const w = art.w * k, h = art.h * k;
  const at = P(spot.x, spot.y);
  // The drawing stands on the ground, so its foot goes at the near corner of the footprint.
  const foot = P(spot.x + (across ? hw : hh), spot.y + (across ? hh : hw));
  return [depth(spot.x, spot.y), (
    <g key={`car-${i}`} transform={across ? undefined : `translate(${(at.x * 2).toFixed(1)},0) scale(-1,1)`}>
      <svg x={at.x - w / 2} y={foot.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
        dangerouslySetInnerHTML={{ __html: art.body }} />
    </g>
  )];
}
