import { useRef, useState, useLayoutEffect, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, BacklogItem, ZooPath } from './types';
import { renderDesign, presetFor, GRID_W, type ItemDesign } from './design';
import { PATH_STYLES, pathStyleFor, type PathStyle } from './pathStyles';
import type { SegmentId } from './simulation/types';
import { cn } from '@/lib/utils';
import { Users, Smile, LayoutGrid, Trees, Move, Pencil, Eraser, Undo2, Check, X } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Each SPECIES
// lives in its own built enclosure (a habitat), with the animals you have delivered drawn
// to scale inside it; amenities and planting sit on the grounds; visitors keep to the
// promenade. On the big Park tab the layout is FREE: drag any enclosure, building or
// planting to arrange your zoo (an animal moves with its enclosure). Positions are saved
// on the items, so the park is both a picture of delivered work and something you compose.

const SEG_DOT: Record<SegmentId, string> = { families: '#e6842a', enthusiasts: '#3f8fd0', comfortSeekers: '#8a5a2b' };

// The path route shapes offered on the Park (local, not exported, to keep react-refresh happy).
const ROUTE_OPTIONS: { key: 'straight' | 'elbow' | 'spine' | 'none'; label: string }[] = [
  { key: 'straight', label: 'Straight' },
  { key: 'elbow', label: 'Elbow' },
  { key: 'spine', label: 'Spine' },
  { key: 'none', label: 'None' },
];

interface ZoneTheme { plot: string; plotBorder: string }
const THEMES: Record<string, ZoneTheme> = {
  savanna: { plot: '#d9b98a', plotBorder: '#b7965f' },
  water: { plot: '#6db6d8', plotBorder: '#4f9cbf' },
  forest: { plot: '#93c977', plotBorder: '#6b8f4e' },
};
const ORDER = ['forest', 'savanna', 'water'];
function themeFor(zone: string, idx: number): ZoneTheme {
  if (zone === 'Big Cats') return THEMES.savanna;
  if (zone === 'Waterside') return THEMES.water;
  return THEMES[ORDER[idx % ORDER.length]];
}

/** Render one design (a creature or building) at a small scale. */
function Sprite({ item, design, cell }: { item: BacklogItem; design: ItemDesign; cell: number }) {
  const grid = renderDesign(item, design);
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${cell}px)` }} aria-hidden>
      {grid.flatMap((row, r) => row.map((color, c) => (
        <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />
      )))}
    </div>
  );
}

/** A single feature on the grounds. Amenities (buildings) sit on a plot tile; planting (flora)
 *  is drawn as just the plant - a tree or bush needs no surround. */
function Plot({ item, cell }: { item: BacklogItem; cell: number }) {
  const isFlora = item.category === 'flora';
  return (
    <div className="relative flex flex-col items-center">
      <div className={cn('flex items-center justify-center', !isFlora && 'rounded-lg')}
        style={isFlora
          ? { padding: cell }
          : { background: '#cfd4d8', border: '2px solid #9aa3ab', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.08)', padding: cell }}>
        <Sprite item={item} design={item.design ?? presetFor(item)} cell={cell} />
      </div>
      <span className="mt-1 rounded-full bg-white/80 px-1.5 text-[9px] font-semibold text-emerald-950 dark:bg-black/50 dark:text-emerald-50">{item.name}</span>
    </div>
  );
}

/** Enclosure footprints (in the fixed design px). A bigger habitat is simply a bigger
 *  box; how many animals appear inside is how many you have actually built. */
const ENCLOSURE: Record<'small' | 'medium' | 'large', { w: number; h: number }> = {
  small: { w: 120, h: 84 },
  medium: { w: 164, h: 110 },
  large: { w: 210, h: 138 },
};
const LABEL_H = 18; // the name pill under a feature, counted in its layout height

/** A built enclosure (habitat) with the animals that live in it rendered to scale
 *  inside - one sprite per animal the team has actually built and opened, so you see
 *  "lions in a space", not one huge lion, and never more animals than were built. */
function Enclosure({ enc, animals, flora, theme }: { enc: BacklogItem; animals: BacklogItem[]; flora: BacklogItem[]; theme: ZoneTheme }) {
  const cfg = ENCLOSURE[enc.enclosureSize ?? 'medium'];
  const d = enc.design;
  const ground = d?.colors.ground ?? theme.plot;
  const fence = d?.colors.fence ?? theme.plotBorder;
  const n = animals.length;
  const cell = n >= 4 ? 1 : 2; // more animals share the space, so each is drawn smaller
  const positions = animals.map((_, i) => ({
    left: n <= 1 ? 50 : 14 + (i / (n - 1)) * 72,
    top: 62 + (i % 2 === 0 ? -6 : 6),
  }));
  // Planting sits toward the back corners so it frames the habitat behind the animals.
  const floraPos = flora.map((_, i) => ({ left: i % 2 === 0 ? 12 : 88, top: 26 + Math.floor(i / 2) * 20 }));
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative overflow-hidden rounded-lg"
        style={{ width: cfg.w, height: cfg.h, background: ground, border: `3px solid ${fence}`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.2), 0 2px 0 rgba(0,0,0,.08)' }}>
        <div className="absolute inset-x-0 bottom-0" style={{ height: '30%', background: 'rgba(0,0,0,.08)' }} />
        {d?.parts.water === 'on' && (
          <div className="absolute" style={{ bottom: '12%', right: '10%', width: '34%', height: '30%', borderRadius: 999, background: d.colors.water ?? '#5aa9c8' }} />
        )}
        {floraPos.map((p, i) => (
          <div key={flora[i].id} className="absolute" style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: 0 }} title={flora[i].name}>
            <Sprite item={flora[i]} design={flora[i].design ?? presetFor(flora[i])} cell={1} />
          </div>
        ))}
        {n === 0 && flora.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-black/40">habitat ready</div>}
        {positions.map((p, i) => (
          <div key={animals[i].id} className="absolute" style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: 1 }}>
            <Sprite item={animals[i]} design={animals[i].design ?? presetFor(animals[i])} cell={cell} />
          </div>
        ))}
      </div>
      <span className="mt-1 rounded-full bg-white/80 px-1.5 text-[9px] font-semibold text-emerald-950 dark:bg-black/50 dark:text-emerald-50">{enc.name}</span>
    </div>
  );
}

// ---- Features: the positionable things in the park (enclosures + amenities + planting) ----

interface Feature { item: BacklogItem; kind: 'enclosure' | 'plot'; w: number; h: number; animals: BacklogItem[]; flora: BacklogItem[]; theme: ZoneTheme }

/** Everything currently shown in the park, as positionable features. An enclosure appears
 *  once BUILT (Done or Open) - the habitat is there before its animals are released - with
 *  its open animals inside; amenities and planting appear when open. */
function buildFeatures(state: ZooGameState): Feature[] {
  const open = state.backlog.filter((it) => it.status === 'open');
  const builtEnc = state.backlog.filter((it) => it.category === 'enclosure' && (it.status === 'done' || it.status === 'open'));
  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((it) => it.zone)]));
  const theme = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));
  const feats: Feature[] = [];
  for (const e of builtEnc) {
    const cfg = ENCLOSURE[e.enclosureSize ?? 'medium'];
    const animals = open.filter((o) => o.category === 'exhibit' && o.enclosureId === e.id);
    // Planting assigned to this compound is drawn inside it (like the animals).
    const flora = open.filter((o) => o.category === 'flora' && o.enclosureId === e.id);
    feats.push({ item: e, kind: 'enclosure', w: cfg.w, h: cfg.h + LABEL_H, animals, flora, theme: theme(e.zone) });
  }
  // Any open exhibit whose enclosure is not built falls back to a small plot (shouldn't
  // normally happen, since the habitat is built first).
  for (const o of open.filter((o) => o.category === 'exhibit' && !builtEnc.some((e) => e.id === o.enclosureId))) {
    feats.push({ item: o, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], flora: [], theme: theme(o.zone) });
  }
  // Amenities, and standalone planting (flora NOT assigned to a built compound), sit on the grounds.
  for (const a of open.filter((o) => o.category === 'amenity' || (o.category === 'flora' && !builtEnc.some((e) => e.id === o.enclosureId)))) {
    feats.push({ item: a, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], flora: [], theme: theme(a.zone) });
  }
  return feats;
}

const CANVAS_W = 880;
const PATH_H = 40; // promenade band along the foot, where visitors stroll
const PAD = 20;
const GAP = 18;

/** Default tidy layout for features without a saved position: shelf-pack left-to-right,
 *  wrapping within the canvas width. Returns each feature's CENTRE in design px. */
function autoLayout(features: Feature[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  let x = PAD, y = PAD, rowH = 0;
  for (const f of features) {
    if (x + f.w > CANVAS_W - PAD && x > PAD) { x = PAD; y += rowH + GAP; rowH = 0; }
    pos.set(f.item.id, { x: x + f.w / 2, y: y + f.h / 2 });
    x += f.w + GAP;
    rowH = Math.max(rowH, f.h);
  }
  return pos;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Deterministic 0..1 from an index + channel (stable across renders). */
const jitter = (n: number, k: number) => {
  const x = Math.sin((n + 1) * (k === 0 ? 12.9898 : 78.233)) * 43758.5453;
  return x - Math.floor(x);
};

/** The free-placement park canvas: a fixed design-sized scene scaled to fit, with each
 *  feature absolutely positioned and draggable. Dragging updates a live local position and
 *  commits to the item on release (so the layout persists). */
function FreeScene({ features, dots, style, route, tool, draft, paths, onPlaceItem, onCanvasPoint, onDeletePath }: {
  features: Feature[];
  dots: SegmentId[];
  style: PathStyle;
  route: 'straight' | 'elbow' | 'spine' | 'none';
  tool: 'none' | 'draw' | 'erase';
  draft: { x: number; y: number }[];
  paths: ZooPath[];
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  onCanvasPoint?: (pt: { x: number; y: number }) => void;
  onDeletePath?: (id: string) => void;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{ id: string; pos: { x: number; y: number } } | null>(null);

  const auto = autoLayout(features);
  const posOf = (f: Feature) => (drag?.id === f.item.id ? drag.pos : f.item.pos ?? auto.get(f.item.id) ?? { x: PAD, y: PAD });
  const contentBottom = features.reduce((m, f) => Math.max(m, posOf(f).y + f.h / 2), 0);
  const canvasH = Math.max(440, Math.round(contentBottom + PAD)) + PATH_H;

  useLayoutEffect(() => {
    const o = outer.current;
    if (!o) return;
    const update = () => setScale(o.clientWidth / CANVAS_W);
    const ro = new ResizeObserver(update);
    ro.observe(o);
    update();
    return () => ro.disconnect();
  }, []);

  const startDrag = (e: ReactPointerEvent, f: Feature) => {
    if (!onPlaceItem || tool !== 'none') return; // in draw/erase mode, clicks are for paths
    e.preventDefault();
    const s = inner.current ? inner.current.getBoundingClientRect().width / CANVAS_W : scale || 1;
    const startX = e.clientX, startY = e.clientY;
    const origin = posOf(f);
    const minX = f.w / 2 + 4, maxX = CANVAS_W - f.w / 2 - 4;
    const minY = f.h / 2 + 4, maxY = canvasH - PATH_H - f.h / 2;
    const at = (ev: PointerEvent) => ({
      x: clamp(origin.x + (ev.clientX - startX) / s, minX, maxX),
      y: clamp(origin.y + (ev.clientY - startY) / s, minY, maxY),
    });
    const move = (ev: PointerEvent) => setDrag({ id: f.item.id, pos: at(ev) });
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onPlaceItem(f.item.id, at(ev));
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    setDrag({ id: f.item.id, pos: origin });
  };

  // In draw mode, a click on the canvas adds a vertex to the current path (design-px coords).
  const addPoint = (e: ReactPointerEvent) => {
    if (tool !== 'draw' || !onCanvasPoint || !inner.current) return;
    const rect = inner.current.getBoundingClientRect();
    const s = rect.width / CANVAS_W || 1;
    onCanvasPoint({ x: clamp((e.clientX - rect.left) / s, 0, CANVAS_W), y: clamp((e.clientY - rect.top) / s, 0, canvasH) });
  };

  return (
    <div ref={outer} className="relative w-full" style={{ height: canvasH * scale }}>
      <div ref={inner} onPointerDown={tool === 'draw' ? addPoint : undefined}
        className="absolute left-0 top-0 overflow-hidden rounded-2xl border shadow-sm"
        style={{ width: CANVAS_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left', cursor: tool === 'draw' ? 'crosshair' : undefined,
          borderColor: 'rgba(120,140,90,.5)', background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0 2px, transparent 3px) 0 0/22px 22px, linear-gradient(#86c06a,#7ab85f)' }}>

        {/* Promenade path + entrance + trees along the foot. Surface follows the chosen style. */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: PATH_H, background: `linear-gradient(${style.promenade[0]},${style.promenade[1]})`, boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25)' }} aria-hidden />

        {/* Paths layer: auto-routes connect each feature to the promenade ('straight'/'elbow'/
            'spine'; 'none' turns them off), plus any hand-drawn paths, plus the live draw draft.
            The promenade is the main road; everything branches off it. Auto-routes follow
            features live as they are dragged (posOf recomputes each render). */}
        {(() => {
          const cx = CANVAS_W / 2;
          const promY = canvasH - PATH_H + 3; // where paths meet the promenade
          const auto: { key: string; d: string }[] = [];
          const poly = (key: string, pointsList: number[][]) => auto.push({ key, d: pointsList.map(([x, y]) => `${x},${y}`).join(' ') });
          if (features.length > 0 && route !== 'none') {
            // Planting (flora) is decorative, not a destination, so it gets no path spur.
            const pts = features.filter((f) => f.item.category !== 'flora').map((f) => ({ id: f.item.id, ...posOf(f) }));
            if (route === 'spine') {
              const topY = Math.min(promY, ...pts.map((p) => p.y));
              poly('spine', [[cx, promY], [cx, topY]]);
              pts.forEach((p) => poly(p.id, [[p.x, p.y], [cx, p.y]]));
            } else if (route === 'elbow') {
              const boulevardY = Math.max(promY - 44, Math.max(...pts.map((p) => p.y)) + 4);
              const xs = pts.map((p) => p.x);
              poly('boulevard', [[Math.min(cx, ...xs), boulevardY], [Math.max(cx, ...xs), boulevardY]]);
              poly('entry', [[cx, boulevardY], [cx, promY]]);
              pts.forEach((p) => poly(p.id, [[p.x, p.y], [p.x, boulevardY]]));
            } else {
              pts.forEach((p) => poly(p.id, [[p.x, p.y], [p.x, promY]]));
            }
          }
          const toD = (points: { x: number; y: number }[]) => points.map((p) => `${p.x},${p.y}`).join(' ');
          const layered = (key: string, d: string) => (
            <g key={key}>
              <polyline points={d} fill="none" stroke={style.edge} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={d} fill="none" stroke={style.road} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
              {style.dash && <polyline points={d} fill="none" stroke={style.dash} strokeWidth={12} strokeDasharray="2 9" strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          );
          if (auto.length === 0 && paths.length === 0 && draft.length === 0) return null;
          return (
            <svg className="pointer-events-none absolute inset-0 z-[5]" width={CANVAS_W} height={canvasH} aria-hidden>
              {auto.map((l) => layered(l.key, l.d))}
              {paths.map((p) => layered(p.id, toD(p.points)))}
              {/* Erase mode: a fat clickable overlay per drawn path removes it. */}
              {tool === 'erase' && onDeletePath && paths.map((p) => (
                <polyline key={`erase-${p.id}`} points={toD(p.points)} fill="none" stroke="rgba(220,40,40,.35)" strokeWidth={20}
                  strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onPointerDown={(e) => { e.stopPropagation(); onDeletePath(p.id); }} />
              ))}
              {/* Live draft while drawing: the road preview plus a dot at each placed vertex. */}
              {tool === 'draw' && draft.length > 0 && (
                <g>
                  {draft.length > 1 && layered('draft', toD(draft))}
                  {draft.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={style.edge} strokeWidth={2} />)}
                </g>
              )}
            </svg>
          );
        })()}

        <Tree style={{ left: 14, bottom: PATH_H + 6 }} />
        <Tree style={{ right: 14, bottom: PATH_H + 6 }} />
        <div className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest" style={{ bottom: 4, color: '#5a3a1c' }} aria-hidden>ENTRANCE</div>

        {features.length === 0 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm font-semibold text-white/90">Nothing open yet - build and open an enclosure and its animals.</div>
        )}

        {/* Features - each absolutely positioned at its centre and draggable. */}
        {features.map((f) => {
          const p = posOf(f);
          const dragging = drag?.id === f.item.id;
          return (
            <div key={f.item.id}
              onPointerDown={(e) => startDrag(e, f)}
              className={cn('absolute z-10 select-none', onPlaceItem ? 'cursor-grab active:cursor-grabbing' : '', dragging && 'z-30')}
              style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)', touchAction: 'none', filter: dragging ? 'drop-shadow(0 6px 8px rgba(0,0,0,.25))' : undefined }}>
              {f.kind === 'enclosure'
                ? <Enclosure enc={f.item} animals={f.animals} flora={f.flora} theme={f.theme} />
                : <Plot item={f.item} cell={4} />}
            </div>
          );
        })}

        {/* Visitors keep to the promenade, never inside a habitat. */}
        {dots.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" style={{ height: PATH_H }} aria-hidden>
            {dots.map((seg, i) => (
              <span key={i} className="zoo-visitor absolute" style={{
                left: `${4 + jitter(i, 0) * 92}%`, top: `${18 + jitter(i, 1) * 50}%`,
                animation: `zooStroll ${7 + jitter(i, 0) * 6}s ease-in-out ${(-jitter(i, 1) * 9).toFixed(2)}s infinite`,
              }}>
                <span className="block rounded-full ring-1 ring-white/70" style={{ width: 5, height: 5, margin: '0 auto', background: '#f0c9a8' }} />
                <span className="block rounded-b-sm rounded-t" style={{ width: 7, height: 7, background: SEG_DOT[seg] }} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** A simple read-only flow of features, for the small live views (no drag). */
function FlowScene({ features, dots, minHeight, style }: { features: Feature[]; dots: SegmentId[]; minHeight: number; style: PathStyle }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border shadow-sm"
      style={{ minHeight, borderColor: 'rgba(120,140,90,.5)', background: 'linear-gradient(#86c06a,#7ab85f)' }}>
      <div className="relative z-10 flex flex-wrap items-end gap-3 p-3 pb-8">
        {features.map((f) => (
          <div key={f.item.id}>
            {f.kind === 'enclosure' ? <Enclosure enc={f.item} animals={f.animals} flora={f.flora} theme={f.theme} /> : <Plot item={f.item} cell={3} />}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ height: 22, background: `linear-gradient(${style.promenade[0]},${style.promenade[1]})` }} aria-hidden />
      {dots.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" style={{ height: 22 }} aria-hidden>
          {dots.map((seg, i) => (
            <span key={i} className="zoo-visitor absolute" style={{ left: `${4 + jitter(i, 0) * 92}%`, top: `${18 + jitter(i, 1) * 50}%`, animation: `zooStroll ${7 + jitter(i, 0) * 6}s ease-in-out ${(-jitter(i, 1) * 9).toFixed(2)}s infinite` }}>
              <span className="block rounded-full ring-1 ring-white/70" style={{ width: 4, height: 4, margin: '0 auto', background: '#f0c9a8' }} />
              <span className="block rounded-b-sm rounded-t" style={{ width: 6, height: 6, background: SEG_DOT[seg] }} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ParkViewProps {
  state: ZooGameState;
  compact?: boolean;
  fill?: boolean;
  large?: boolean;
  /** On the big Park tab, called when a feature is dragged to a new position. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  /** On the big Park tab, called when the path/road surface is changed. */
  onSetPathStyle?: (key: string) => void;
  /** On the big Park tab, called when the path route shape is changed. */
  onSetPathRoute?: (route: 'straight' | 'elbow' | 'spine' | 'none') => void;
  /** On the big Park tab, path drawing: commit a drawn path, delete one, or clear all. */
  onAddPath?: (points: { x: number; y: number }[]) => void;
  onDeletePath?: (id: string) => void;
  onClearPaths?: () => void;
}

/** The park as it stands: built enclosures with their animals, amenities and planting,
 *  a HUD at a glance, and visitors on the promenade. `large` = the full-width, draggable
 *  Park tab; `compact`/`fill` = small read-only live views. */
export function ParkView({ state, compact = false, large = false, onPlaceItem, onSetPathStyle, onSetPathRoute, onAddPath, onDeletePath, onClearPaths }: ParkViewProps) {
  const style = pathStyleFor(state.pathStyle);
  const route = state.pathRoute ?? 'straight';
  const paths = state.paths ?? [];
  // The path-drawing tool: 'draw' lays vertices, 'erase' removes a path, 'none' = arrange.
  const [tool, setTool] = useState<'none' | 'draw' | 'erase'>('none');
  const [draft, setDraft] = useState<{ x: number; y: number }[]>([]);
  const commitDraft = () => { if (draft.length >= 2) onAddPath?.(draft); setDraft([]); };
  const exitDraw = () => { setDraft([]); setTool('none'); };
  const open = state.backlog.filter((it) => it.status === 'open');
  const features = buildFeatures(state);
  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((it) => it.zone)]));
  const activeZones = new Set(features.map((f) => f.item.zone));
  const exhibits = open.filter((it) => it.category === 'exhibit').length;
  const amenities = open.filter((it) => it.category === 'amenity').length;
  const total = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const happiness = state.lastReview?.overallHappiness ?? null;

  // Little visitors stroll once there is an exhibit to see.
  const dots: SegmentId[] = [];
  if (open.some((it) => it.category === 'exhibit')) {
    const cap = compact ? 8 : 34;
    for (const seg of ['families', 'enthusiasts', 'comfortSeekers'] as SegmentId[]) {
      const n = Math.min(cap, Math.round(((state.attendance[seg] ?? 0) / Math.max(1, total)) * Math.min(cap, Math.max(3, Math.round(total / 60)))));
      for (let i = 0; i < n; i++) dots.push(seg);
    }
  }

  return (
    <section className={cn('space-y-3', compact && 'space-y-2')}>
      <style>{`
        @keyframes zooStroll { 0%{transform:translate(0,0)} 25%{transform:translate(10px,-7px)} 50%{transform:translate(-6px,8px)} 75%{transform:translate(7px,5px)} 100%{transform:translate(0,0)} }
        @media (prefers-reduced-motion: reduce) { .zoo-visitor { animation: none !important } }
      `}</style>

      {!compact && (
        <div className="grid grid-cols-4 gap-2">
          <Hud icon={LayoutGrid} label="Zones" value={`${activeZones.size}/${zones.length}`} />
          <Hud icon={Trees} label={`${amenities} amenit${amenities === 1 ? 'y' : 'ies'}`} value={`${exhibits}`} sub="exhibits" />
          <Hud icon={Users} label="Visitors" value={total ? total.toLocaleString() : '—'} />
          <Hud icon={Smile} label="Happiness" value={happiness === null ? '—' : `${happiness}`} />
        </div>
      )}

      {large ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {features.length > 0 && onPlaceItem ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Move className="h-3.5 w-3.5" /> Drag an enclosure, building or planting to arrange your zoo.</p>
            ) : <span />}
            <div className="flex items-center gap-3">
              {onSetPathRoute && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Route</span>
                  {ROUTE_OPTIONS.map((r) => (
                    <button key={r.key} type="button" onClick={() => onSetPathRoute(r.key)} title={r.label} aria-label={`${r.label} route`}
                      aria-pressed={route === r.key}
                      className={cn('rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                        route === r.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {onSetPathStyle && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Paths</span>
                  {PATH_STYLES.map((s) => (
                    <button key={s.key} type="button" onClick={() => onSetPathStyle(s.key)} title={s.label} aria-label={`${s.label} paths`}
                      aria-pressed={style.key === s.key}
                      className={cn('h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                        style.key === s.key ? 'border-foreground' : 'border-transparent')}
                      style={{ background: `linear-gradient(135deg, ${s.road}, ${s.edge})` }} />
                  ))}
                </div>
              )}
              {onAddPath && (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setDraft([]); setTool((t) => (t === 'draw' ? 'none' : 'draw')); }} title="Draw a path" aria-pressed={tool === 'draw'}
                    className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                      tool === 'draw' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                    <Pencil className="h-3.5 w-3.5" /> Draw
                  </button>
                  {paths.length > 0 && onDeletePath && (
                    <button type="button" onClick={() => { setDraft([]); setTool((t) => (t === 'erase' ? 'none' : 'erase')); }} title="Erase a path" aria-pressed={tool === 'erase'}
                      className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                        tool === 'erase' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground hover:text-foreground')}>
                      <Eraser className="h-3.5 w-3.5" /> Erase
                    </button>
                  )}
                  {paths.length > 0 && onClearPaths && (
                    <button type="button" onClick={() => { exitDraw(); onClearPaths(); }} title="Remove all drawn paths"
                      className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">Clear</button>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Active-tool guidance and the draft controls. */}
          {tool === 'draw' && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-primary">Tap the park to place points{draft.length > 0 ? ` (${draft.length})` : ''}. Add at least two, then Done.</span>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" disabled={draft.length === 0} onClick={() => setDraft((d) => d.slice(0, -1))} className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"><Undo2 className="h-3 w-3" /> Undo</button>
                <button type="button" disabled={draft.length < 2} onClick={commitDraft} className="flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"><Check className="h-3 w-3" /> Done</button>
                <button type="button" onClick={exitDraw} className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Cancel</button>
              </div>
            </div>
          )}
          {tool === 'erase' && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-destructive">Tap a drawn path to remove it.</span>
              <button type="button" onClick={() => setTool('none')} className="ml-auto flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Done</button>
            </div>
          )}
          <FreeScene features={features} dots={dots} style={style} route={route} tool={tool} draft={draft} paths={paths}
            onPlaceItem={onPlaceItem} onCanvasPoint={(pt) => setDraft((d) => [...d, pt])} onDeletePath={onDeletePath} />
        </>
      ) : (
        <FlowScene features={features} dots={dots} minHeight={compact ? 140 : 230} style={style} />
      )}
    </section>
  );
}

function Tree({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute z-0" style={{ width: 26, height: 34, ...style }} aria-hidden>
      <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: 0, width: 26, height: 26, background: 'radial-gradient(circle at 40% 35%,#5fa049,#3f7d33)', boxShadow: '0 3px 0 rgba(0,0,0,.08)' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 5, height: 12, background: '#7a5230', borderRadius: 2 }} />
    </div>
  );
}

function Hud({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <div className="mt-0.5 text-lg font-bold leading-none tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub ?? label}</div>
    </div>
  );
}
