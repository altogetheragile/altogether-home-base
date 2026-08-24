import { useMemo } from 'react';
import type { BacklogItem, ZooGameState } from './types';
import { standsOnPark } from './engine';
import { ENCLOSURE_SIZE, footprintFor, shade, speciesColors, floraDefaultColors, isLandscapeType, enclosureFlora, pieceByKey } from './design';
import { autoLayout, insidePark, CANVAS_W, PLAY_H, PAD } from './parkLayout';
import { themeFor } from './zoneTheme';
import { carParkLayout, carCapacity, CAR_HW, CAR_HH, BUS_HW, BUS_HH, type CarSpot } from './carPark';
import { hasAnimalArt, animalArtFor } from './art/animalArt';
import { AGE_SCALE, groupMembers } from './design';
import {
  project, depth, screenBounds, groundPoints, boxFaces, boxTones, roofFaces, wallPanel, prop, tint, fenceRun, jitter, COS, TILE_SPREAD, footprintWidth, type Pt,
} from './art/iso';
import { VEHICLE_ART } from './art/vehicleArt.generated';
import { BUILDING_ART } from './art/buildingArt.generated';

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
  /** Everything is drawn inset by the scene's margin, but `boxFaces` and `roofFaces` hand back raw
   *  projected points. Anything built from those has to be shifted, or it is drawn off the edge of
   *  the picture - which is silent, because a polygon at the wrong coordinates is still a polygon. */
  const shift = (s: string) => s.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${(x + ox).toFixed(1)},${(y + oy).toFixed(1)}`; }).join(' ');
  const ground = (x0: number, y0: number, x1: number, y1: number) => shift(groundPoints(x0, y0, x1, y1, u));

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

  /** A bridge, built rather than painted on.
   *
   *  Every landscape feature was one flat coloured diamond lying on the grass, which is fine for a
   *  pond and wrong for a bridge: a bridge is the one piece of landscape that is above the ground,
   *  and drawing it flat left a brown rectangle in the water with nothing to walk on. This gives it
   *  the three things that read as a bridge from the corner - a deck you can see the top of, the
   *  side of that deck, and a handrail along both edges.
   */
  const bridge = (id: string, x0: number, y0: number, x1: number, y1: number, wood: string) => {
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
        return <line key={`p${i}`} x1={px} y1={py} x2={px} y2={py - railH} stroke={shade(wood, -46)} strokeWidth={post} strokeLinecap="round" />;
      });
      return (
        <g key={`rail-${s}`}>
          {posts}
          <line x1={A.x} y1={A.y - railH} x2={B.x} y2={B.y - railH} stroke={shade(wood, -22)} strokeWidth={Math.max(0.9, u * 1.5)} strokeLinecap="round" />
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
    if (it.category === 'flora') {
      const type = landType(it);
      if (isLandscapeType(type)) {
        const cols = floraDefaultColors(type ?? 'pond');
        // Held to the park. A river is longer than the park is wide, on purpose - that is what makes
        // it reach both banks - and painted at its full length it ran out over the edge of the grass
        // and hung in the air.
        const x0 = Math.max(0, c.x - size.w / 2), x1 = Math.min(CANVAS_W, c.x + size.w / 2);
        const y0 = Math.max(0, c.y - size.h / 2), y1 = Math.min(PLAY_H, c.y + size.h / 2);
        if (type === 'bridge') { bridge(it.id, x0, y0, x1, y1, cols.foliage ?? '#c8965a'); continue; }
        nodes.push(<polygon key={`land-${it.id}`} points={ground(x0, y0, x1, y1)} fill={cols.foliage ?? '#6fb0d6'} opacity={0.92} />);
      } else {
        const plant = (name: string, wx: number, wy: number, key: string) =>
          place(name, wx, wy, u * 1.9 * (FLORA_SCALE[name] ?? 1), key);
        plant(treeProp(type), c.x, c.y, `t-${it.id}`);
        // The rest of what this item plants. One planting PBI is several trees, and it has to be
        // several here too - otherwise switching to this view loses everything but the first.
        for (const [i, k] of (it.copies ?? []).entries()) {
          const at = insidePark({ w: 8, h: 8 }, { x: c.x + k.dx, y: c.y + k.dy });
          plant(treeProp(pieceByKey(k.piece)?.type ?? type, k.piece), at.x, at.y, `t-${it.id}-${i}`);
        }
      }
      continue;
    }
    // A facility. Drawn where there is a tile for its kind, and built out of boxes where there is
    // not - a zoo can offer a kind of building nobody has drawn yet, and it should still appear.
    const special = amenityProp(it);
    if (special) { place(special, c.x, c.y, u * 0.85, `am-${it.id}`); continue; }
    const kind = it.design?.parts.type ?? it.template ?? '';
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
    const walls = it.design?.colors.walls ?? '#e6ddd0';
    const roof = it.design?.colors.roof ?? '#b8563f';
    const door = it.design?.colors.door ?? '#7a5230';
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
