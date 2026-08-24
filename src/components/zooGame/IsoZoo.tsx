import { useMemo } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { standsOnPark } from './engine';
import { ENCLOSURE_SIZE, footprintFor, shade, speciesColors, floraDefaultColors, isLandscapeType, enclosureFlora } from './design';
import { autoLayout, insidePark, CANVAS_W, PLAY_H, PAD } from './parkLayout';
import { themeFor } from './zoneTheme';
import { carParkLayout, carCapacity, CAR_HW, CAR_HH, BUS_HW, BUS_HH, type CarSpot } from './carPark';
import { hasAnimalArt, animalArtFor } from './art/animalArt';
import { AGE_SCALE, groupMembers } from './design';
import {
  project, depth, screenBounds, groundPoints, boxFaces, boxTones, roofFaces, wallPanel, prop, tint, fenceRun, jitter, COS, type Pt,
} from './art/iso';
import { VEHICLE_ART } from './art/vehicleArt.generated';

/** The zoo, seen from the corner.
 *
 *  This draws exactly what the park view draws - the same items, in the same places, from the same
 *  state - and nothing else. It is read-only on purpose: the park is where a zoo is built, and this
 *  is where it is looked at. Putting it in the Sprint Review gives "inspect the Increment" something
 *  to inspect, in the shape a visitor would actually see.
 *
 *  Everything is sorted back to front before it is drawn, which is the whole trick of a view like
 *  this: get the order wrong and a lion stands in front of the fence that is meant to be holding it.
 */

const VISITOR_PROPS = ['visitor01', 'visitor02', 'visitor03', 'visitor04', 'visitor05', 'visitor06', 'visitor07', 'visitor09'];
const CHILD_PROPS = ['child01', 'child02', 'child03'];

/** Anything with a place in the scene, carrying how far back it stands. */
interface Piece { z: number; el: React.ReactNode }

const landType = (item: BacklogItem): string | undefined => item.design?.parts.type ?? item.template;

export function IsoZoo({ state, height = 460, className }: { state: ZooGameState; height?: number; className?: string }) {
  const scene = useMemo(() => build(state, height), [state, height]);
  return (
    <div className={className}>
      {/* The scene keeps its own proportions and takes the width it is given: a park drawn to fit a
          fixed height sits letterboxed in the middle of a wide panel, half the size it could be. */}
      <svg viewBox={`0 0 ${scene.w} ${scene.h}`} role="img" aria-label={scene.label}
        style={{ display: 'block', width: '100%', height: 'auto', maxHeight: height, overflow: 'visible' }}>
        {scene.nodes}
      </svg>
    </div>
  );
}

function build(state: ZooGameState, targetH: number) {
  const live = state.backlog.filter(standsOnPark);
  const encs = live.filter((i) => i.category === 'enclosure');
  const loose = live.filter((i) => i.category === 'amenity' || (i.category === 'flora' && !i.enclosureId));

  // How busy the zoo is, on the same terms the park view uses: the lot fills with what is open to
  // visit, so the two views never disagree about how many cars turned up.
  const visitors = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const built = live.filter((i) => i.category === 'exhibit' || i.category === 'amenity').length;
  const carCount = Math.min(carCapacity(CANVAS_W), built * 3);
  const busCount = built >= 5 ? 2 : built >= 3 ? 1 : 0;
  const lot = carParkLayout(CANVAS_W, PLAY_H, carCount, busCount);
  const worldH = PLAY_H + lot.height;

  // Fit the whole thing, car park included, into the space we have been given.
  const fit = screenBounds(CANVAS_W, worldH, 1);
  const u = Math.min((targetH * 1.9) / fit.w, targetH / fit.h) * 0.94;
  const b = screenBounds(CANVAS_W, worldH, u);
  const MARGIN = 26;
  const ox = b.ox + MARGIN, oy = b.oy + MARGIN;

  const P = (wx: number, wy: number): Pt => { const p = project(wx, wy, u); return { x: p.x + ox, y: p.y + oy }; };
  const ground = (x0: number, y0: number, x1: number, y1: number) =>
    groundPoints(x0, y0, x1, y1, u).split(' ').map((s) => { const [x, y] = s.split(',').map(Number); return `${(x + ox).toFixed(1)},${(y + oy).toFixed(1)}`; }).join(' ');

  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((i) => i.zone)]));
  const themeOf = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));

  // Positions: the item's own spot if it has one, otherwise the same automatic layout the park uses,
  // so the two views never disagree about where anything is.
  const sizeOf = (it: BacklogItem): { w: number; h: number } =>
    it.category === 'enclosure' ? ENCLOSURE_SIZE[it.enclosureSize ?? 'medium'] : footprintFor(it);
  const auto = autoLayout([...encs, ...loose].map((it) => ({ id: it.id, ...sizeOf(it) })));
  const posOf = (it: BacklogItem): Pt => {
    const size = sizeOf(it);
    return insidePark(size, it.pos ?? auto.get(it.id) ?? { x: PAD, y: PAD });
  };

  const pieces: Piece[] = [];
  const push = (z: number, el: React.ReactNode) => pieces.push({ z, el });

  /** A licensed prop, standing on a world point. `k` scales it; props are drawn feet-down, so the
   *  drawing hangs above the point it stands on. */
  const place = (name: string, wx: number, wy: number, k: number, key: string, tintTo?: string) => {
    const p = prop(name);
    if (!p) return;
    const at = P(wx, wy);
    const w = p.w * k, h = p.h * k;
    const body = p.tint && tintTo ? tint(p.body, tintTo, p.tint) : p.body;
    push(depth(wx, wy), (
      <svg key={key} x={at.x - w / 2} y={at.y - h + w * 0.29} width={w} height={h} viewBox={p.viewBox} overflow="visible"
        dangerouslySetInnerHTML={{ __html: body }} />
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

  // ---- paths the player drew -------------------------------------------------------------
  for (const c of state.connectors ?? []) {
    const a = c.a.featureId ? posOf(state.backlog.find((i) => i.id === c.a.featureId) ?? ({} as BacklogItem)) : { x: c.a.x, y: c.a.y };
    const z = c.b.featureId ? posOf(state.backlog.find((i) => i.id === c.b.featureId) ?? ({} as BacklogItem)) : { x: c.b.x, y: c.b.y };
    if (!Number.isFinite(a.x) || !Number.isFinite(z.x)) continue;
    const wdt = 16;
    const dx = z.x - a.x, dy = z.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * wdt, ny = (dx / len) * wdt;
    const corners = [P(a.x + nx, a.y + ny), P(z.x + nx, z.y + ny), P(z.x - nx, z.y - ny), P(a.x - nx, a.y - ny)];
    nodes.push(<polygon key={`path-${c.id}`} points={corners.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="#ddc79a" />);
  }

  // ---- enclosures ------------------------------------------------------------------------
  for (const e of encs) {
    const c = posOf(e), size = sizeOf(e);
    const x0 = c.x - size.w / 2, y0 = c.y - size.h / 2, x1 = c.x + size.w / 2, y1 = c.y + size.h / 2;
    const theme = themeOf(e.zone);
    // The habitat floor, laid flat, before anything stands on it.
    nodes.push(<polygon key={`floor-${e.id}`} points={ground(x0, y0, x1, y1)} fill={theme.plot} />);

    // Fencing. The two far sides go down first so the near sides can stand in front of them.
    const fence = theme.plotBorder;
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
    for (const [i, f] of enclosureFlora(e.design ?? { parts: {}, colors: {} }).entries()) {
      place(treeProp(f.type), x0 + f.x * size.w, y0 + f.y * size.h, u * 1.2 * (f.s || 1), `ef-${e.id}-${i}`);
    }
    const plants = live.filter((i) => i.category === 'flora' && i.enclosureId === e.id);
    plants.forEach((pl, i) => {
      const t = jitter(i + 1, e.id.length);
      const wx = x0 + 16 + t * Math.max(4, size.w - 32);
      const wy = y0 + 12 + jitter(i + 2, e.id.length + 7) * Math.max(4, size.h - 24);
      place(treeProp(landType(pl)), wx, wy, u * 1.2, `pl-${e.id}-${pl.id}-${i}`);
    });

    // The animals themselves, in the side view they were drawn in.
    const stock = live.filter((i) => i.category === 'exhibit' && i.enclosureId === e.id);
    stock.forEach((a, ai) => {
      const members = groupMembers(a.design?.group);
      const list = members.length ? members : [{ age: 'adults' as const, scale: AGE_SCALE.adults }];
      list.forEach((m, mi) => {
        const t = jitter(ai * 7 + mi + 1, e.id.length);
        const wx = x0 + 20 + t * Math.max(6, size.w - 40);
        const wy = y0 + 16 + jitter(ai * 7 + mi + 3, e.id.length + 11) * Math.max(6, size.h - 32);
        const species = a.template ?? a.id;
        const at = P(wx, wy);
        const key = `a-${e.id}-${a.id}-${mi}`;
        if (hasAnimalArt(species)) {
          const art = animalArtFor(species)!;
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
      });
    });
  }

  // ---- amenities and loose planting -------------------------------------------------------
  for (const it of loose) {
    const c = posOf(it), size = sizeOf(it);
    if (it.category === 'flora') {
      const type = landType(it);
      if (isLandscapeType(type)) {
        const cols = floraDefaultColors(type ?? 'pond');
        nodes.push(<polygon key={`land-${it.id}`} points={ground(c.x - size.w / 2, c.y - size.h / 2, c.x + size.w / 2, c.y + size.h / 2)} fill={cols.foliage ?? '#6fb0d6'} opacity={0.92} />);
      } else {
        place(treeProp(type), c.x, c.y, u * 1.9, `t-${it.id}`);
      }
      continue;
    }
    // A building: walls, a pitched roof, a door and a window, in the colours it was designed in.
    // A plain box was honest about the geometry and dishonest about the thing - a zoo does not have
    // cubes in it, it has a kiosk you can queue at.
    const special = amenityProp(it);
    if (special) { place(special, c.x, c.y, u * 0.85, `am-${it.id}`); continue; }
    const walls = it.design?.colors.walls ?? '#e6ddd0';
    const roof = it.design?.colors.roof ?? '#b8563f';
    const door = it.design?.colors.door ?? '#7a5230';
    const fw = size.w * 0.66, fh = size.h * 0.66;
    const x0 = c.x - fw / 2, y0 = c.y - fh / 2, x1 = c.x + fw / 2, y1 = c.y + fh / 2;
    const wallH = Math.max(5, u * 30);
    const riseH = Math.max(3, u * 17);
    const f = boxFaces(x0, y0, x1, y1, wallH, u);
    const r = roofFaces(x0, y0, x1, y1, wallH, riseH, Math.min(fw, fh) * 0.09, u);
    const tone = boxTones(walls);
    const rt = boxTones(roof);
    const sh = (str: string) => str.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${(x + ox).toFixed(1)},${(y + oy).toFixed(1)}`; }).join(' ');
    // The front-left wall carries the door; the front-right one gets the window.
    const dl = { x: x0, y: y1 }, dr = { x: x1, y: y1 }, wr = { x: x1, y: y0 };
    push(depth(c.x, c.y), (
      <g key={`b-${it.id}`}>
        <polygon points={sh(f.left)} fill={tone.left} />
        <polygon points={sh(f.right)} fill={tone.right} />
        <polygon points={sh(wallPanel(dl, dr, 0.36, 0.64, 0, wallH * 0.66, u).split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${x},${y}`; }).join(' '))} fill={shade(door, -6)} />
        <polygon points={sh(wallPanel(wr, dr, 0.3, 0.66, wallH * 0.3, wallH * 0.72, u))} fill="#93b8cc" />
        <polygon points={sh(r.far)} fill={rt.left} />
        <polygon points={sh(r.near)} fill={rt.right} />
        <polygon points={sh(r.gable)} fill={rt.top} />
      </g>
    ));
  }

  // ---- the car park ------------------------------------------------------------------------
  for (const [i, spot] of (lot.spots ?? []).entries()) push(...vehicle(spot, i, u, P));

  // ---- visitors ----------------------------------------------------------------------------
  const strolling = Math.min(26, Math.round(visitors / 45));
  for (let i = 0; i < strolling; i++) {
    const onProm = i % 3 === 0;
    const wx = 30 + jitter(i + 1, 3) * (CANVAS_W - 60);
    const wy = onProm ? promY + 8 + jitter(i + 2, 5) * 24 : 40 + jitter(i + 2, 9) * (promY - 60);
    const kid = i % 5 === 4;
    const pool = kid ? CHILD_PROPS : VISITOR_PROPS;
    place(pool[i % pool.length], wx, wy, u * (kid ? 0.78 : 0.92), `v-${i}`);
  }

  pieces.sort((a, z) => a.z - z.z);
  const total = screenBounds(CANVAS_W, worldH, u);
  return {
    w: total.w + MARGIN * 2,
    h: total.h + MARGIN * 2 + EDGE,
    nodes: [...nodes.filter(Boolean), ...pieces.map((p) => p.el)],
    label: `The zoo from above: ${encs.length} habitat${encs.length === 1 ? '' : 's'}, ${live.filter((i) => i.category === 'exhibit').length} exhibits, ${visitors} visitors`,
  };
}

/** Which tree drawing a planting gets. Two shapes is enough to stop an avenue looking stamped. */
function treeProp(type?: string): string {
  if (type === 'hedge' || type === 'shrub' || type === 'bush') return 'hedge';
  return type && type.length % 2 === 0 ? 'treeTall' : 'tree';
}

/** Some amenities are a thing the sheet already has a drawing of, and a drawn bench beats a box. */
function amenityProp(it: BacklogItem): string | undefined {
  const t = it.design?.parts.type ?? it.template;
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

function vehicle(spot: CarSpot, i: number, u: number, P: (x: number, y: number) => Pt): [number, React.ReactNode] {
  const name = spot.bus ? LARGE[i % LARGE.length] : CARS[i % CARS.length];
  const art = VEHICLE_ART[name];
  const [hw, hh] = spot.bus ? [BUS_HW, BUS_HH] : [CAR_HW, CAR_HH];
  // A coach lies along its lay-by; a car noses into its bay. `rot` is radians, not degrees.
  const across = Math.abs(Math.sin(spot.rot)) > 0.5;
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
    <g key={`v-${i}`} transform={across ? undefined : `translate(${(at.x * 2).toFixed(1)},0) scale(-1,1)`}>
      <svg x={at.x - w / 2} y={foot.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
        dangerouslySetInnerHTML={{ __html: art.body }} />
    </g>
  )];
}
