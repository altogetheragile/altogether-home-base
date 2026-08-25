import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { shade, speciesColors, landscapePalette, isLandscapeType, enclosureFlora, enclosureWater, pieceByKey } from './design';
import { standsOnPark } from './engine';
import { buildNav, routeAcross } from './parkNav';
import { insidePark, CANVAS_W, PLAY_H } from './parkLayout';
import { standingOnPark, parkPositions, restingPlace, groundSize, habitatSpot, workingDesign as working, parkType as landType } from './parkModel';
import { themeFor } from './zoneTheme';
import { carParkLayout, carCapacity, CAR_HW, CAR_HH, BUS_HW, BUS_HH, type CarSpot } from './carPark';
import { animalArtFor } from './art/animalArt';
import { KIND_SCALE, groupMembers } from './design';
import {
  project, unproject, depth as depthOf, screenBounds, groundPoints, boxFaces as boxFacesOf, boxTones,
  roofFaces as roofFacesOf, wallPanel as wallPanelOf, prop, tint, fenceRun as fenceRunOf, jitter, COS, TILE_SPREAD, footprintWidth, type Pt,
} from './art/iso';
import { VEHICLE_ART } from './art/vehicleArt.generated';
import { BUILDING_ART } from './art/buildingArt.generated';

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
  const roofFaces = (x0: number, y0: number, x1: number, y1: number, wh: number, rh: number, e: number, k: number) => roofFacesOf(...Tbox(x0, y0, x1, y1), wh, rh, e, k);
  const wallPanel = (a: Pt, z: Pt, ...rest: [number, number, number, number, number]) => wallPanelOf(T(a.x, a.y), T(z.x, z.y), ...rest);
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
    const wdt = 16;
    const dx = z.x - a.x, dy = z.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * wdt, ny = (dx / len) * wdt;
    // Run each path half its own width past both ends, so where two meet they overlap into the
    // corner instead of leaving a notch. They are all one colour, so the overlap cannot be seen -
    // which is the whole trick: a junction should look like a junction, not like two paths.
    const ex = (dx / len) * wdt, ey = (dy / len) * wdt;
    const a2 = { x: a.x - ex, y: a.y - ey }, z2 = { x: z.x + ex, y: z.y + ey };
    const corners = [P(a2.x + nx, a2.y + ny), P(z2.x + nx, z2.y + ny), P(z2.x - nx, z2.y - ny), P(a2.x - nx, a2.y - ny)];
    nodes.push(<polygon key={`path-${c.id}`} points={corners.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="#ddc79a" />);
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

    // The habitat floor, laid flat, before anything stands on it.
    nodes.push(<polygon key={`floor-${e.id}`} points={ground(x0, y0, x1, y1)} fill={floor} />);

    // Water lies on the floor, in its own corner of the habitat - held as fractions of the box, so
    // it stays where it was put whatever size the habitat is.
    for (const [i, wf] of enclosureWater(d).entries()) {
      nodes.push(<polygon key={`water-${e.id}-${i}`}
        points={ground(x0 + wf.x * size.w, y0 + wf.y * size.h, x0 + (wf.x + wf.w) * size.w, y0 + (wf.y + wf.h) * size.h)}
        fill={d?.colors.water ?? '#5aa9c8'} />);
    }

    // Fencing. The two far sides go down first so the near sides can stand in front of them.
    const runs: [Pt, Pt, boolean][] = [
      [{ x: x0, y: y0 }, { x: x1, y: y0 }, false],
      [{ x: x0, y: y0 }, { x: x0, y: y1 }, true],
      [{ x: x0, y: y1 }, { x: x1, y: y1 }, false],
      [{ x: x1, y: y0 }, { x: x1, y: y1 }, true],
    ];
    runs.forEach(([from, to, up], ri) => {
      for (const [pi, pl] of fenceRun(from, to, u, up).entries()) {
        const p = prop(pl.name)!;
        nodes.push(null); // keep the key space stable
        push(pl.z, (
          <svg key={`f-${e.id}-${ri}-${pi}`} x={pl.x + ox} y={pl.y + oy} width={pl.w} height={pl.h} viewBox={p.viewBox} overflow="visible"
            dangerouslySetInnerHTML={{ __html: tint(p.body, fence, p.tint ?? 3) }} />
        ));
      }
    });

    // Planting inside the habitat: both the enclosure's own greenery, which is part of its design
    // and holds its own spot in the box, and any planting item dragged in on top of it.
    for (const [i, f] of enclosureFlora(d).entries()) {
      place(treeProp(f.type), x0 + f.x * size.w, y0 + f.y * size.h, u * 1.2 * (f.s || 1), `ef-${e.id}-${i}`);
    }
    const plants = roomFor.get(e.id)?.plants ?? [];
    plants.forEach((pl, i) => {
      const t = jitter(i + 1, e.id.length);
      const wx = x0 + 16 + t * Math.max(4, size.w - 32);
      const wy = y0 + 12 + jitter(i + 2, e.id.length + 7) * Math.max(4, size.h - 24);
      place(treeProp(landType(pl)), wx, wy, u * 1.2, `pl-${e.id}-${pl.id}-${i}`);
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
        const at = P(wx, wy);
        const key = `a-${e.id}-${a.id}-${mi}`;
        if (art) {
          const h = art.h * u * 0.30 * m.scale;
          const w = h * (art.w / art.h);
          push(depth(wx, wy), (
            <svg key={key} x={at.x - w / 2} y={at.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
              style={art.flip ? { transform: `translateX(${(at.x * 2 + 0).toFixed(1)}px)`, transformOrigin: 'center' } : undefined}
              dangerouslySetInnerHTML={{ __html: art.body }} />
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
        nodes.push(<polygon key={`land-${it.id}`} points={ground(x0, y0, x1, y1)} fill={primary} opacity={0.92} />);
      } else {
        const plant = (name: string, wx: number, wy: number, key: string, foliage?: string) =>
          place(name, wx, wy, u * 1.9 * (FLORA_SCALE[name] ?? 1), key, undefined, foliageFilter(foliage));
        plant(treeProp(type), c.x, c.y, `t-${it.id}`, working(it).colors.foliage);
        // The rest of what this item plants. One planting PBI is several trees, and it has to be
        // several here too - otherwise switching to this view loses everything but the first.
        for (const [i, k] of (it.copies ?? []).entries()) {
          const at = insidePark({ w: 8, h: 8 }, { x: c.x + k.dx, y: c.y + k.dy });
          const piece = pieceByKey(k.piece);
          plant(treeProp(piece?.type ?? type, k.piece), at.x, at.y, `t-${it.id}-${i}`,
            piece?.colors.foliage ?? working(it).colors.foliage);
        }
      }
      continue;
    }
    // A facility. Drawn where there is a tile for its kind, and built out of boxes where there is
    // not - a zoo can offer a kind of building nobody has drawn yet, and it should still appear.
    const special = amenityProp(it);
    if (special) { place(special, c.x, c.y, u * 0.85, `am-${it.id}`); continue; }
    const wd = working(it);
    const kind = wd.parts.type ?? it.template ?? '';
    const tile = BUILDING_ART[kind];
    const fw = size.w * 0.66, fh = size.h * 0.66;
    const x0 = c.x - fw / 2, y0 = c.y - fh / 2, x1 = c.x + fw / 2, y1 = c.y + fh / 2;

    if (tile) {
      // The tile is sized from the footprint, so a cafe is drawn bigger than a kiosk on the same
      // artwork - the FOOTPRINT table stays the single place a building's size is decided.
      const w = footprintWidth(fw, fh, u) * TILE_SPREAD;
      const h = w * (tile.h / tile.w);
      const at = P(c.x, c.y);
      const front = P(x1, y1);
      push(depth(c.x, c.y), (
        <image key={`b-${it.id}`} href={tile.src} x={at.x - w / 2} y={front.y - h} width={w} height={h}
          // The tiles are painted a shade duller than the rest of the park. This is not a
          // correction to the artwork - it is what makes it sit beside artwork from elsewhere.
          style={{ filter: 'saturate(1.35)' }} preserveAspectRatio="xMidYMax meet" />
      ));
      continue;
    }

    // No tile: walls, a pitched roof, a door and a window, in the colours it was designed in.
    const walls = wd.colors.walls ?? '#e6ddd0';
    const roof = wd.colors.roof ?? '#b8563f';
    const door = wd.colors.door ?? '#7a5230';
    const wallH = Math.max(5, u * 30);
    const riseH = Math.max(3, u * 17);
    const f = boxFaces(x0, y0, x1, y1, wallH, u);
    const r = roofFaces(x0, y0, x1, y1, wallH, riseH, Math.min(fw, fh) * 0.09, u);
    const tone = boxTones(walls);
    const rt = boxTones(roof);
    const dl = { x: x0, y: y1 }, dr = { x: x1, y: y1 }, wr = { x: x1, y: y0 };
    push(depth(c.x, c.y), (
      <g key={`b-${it.id}`}>
        <polygon points={shift(f.left)} fill={tone.left} />
        <polygon points={shift(f.right)} fill={tone.right} />
        <polygon points={shift(wallPanel(dl, dr, 0.36, 0.64, 0, wallH * 0.66, u))} fill={shade(door, -6)} />
        <polygon points={shift(wallPanel(wr, dr, 0.3, 0.66, wallH * 0.3, wallH * 0.72, u))} fill="#93b8cc" />
        <polygon points={shift(r.far)} fill={rt.left} />
        <polygon points={shift(r.near)} fill={rt.right} />
        <polygon points={shift(r.gable)} fill={rt.top} />
      </g>
    ));
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
  if (t === 'stall' || t === 'bench' || t === 'seating') return 'bench';
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
