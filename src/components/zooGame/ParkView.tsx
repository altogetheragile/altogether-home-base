import { useRef, useState, useLayoutEffect, type ReactNode, type Ref, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, BacklogItem, ZooConnector, ConnectorEnd } from './types';
import { renderDesign, presetFor, GRID_W, GRID_H, enclosureShapePoints, enclosureWater, enclosureFlora, isLandscapeType, landscapeDefaultSize, type ItemDesign } from './design';
import { PATH_STYLES, pathStyleFor, type PathStyle } from './pathStyles';
import type { SegmentId } from './simulation/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Users, Smile, LayoutGrid, Trees, Fish, Move, Check, X, ChevronDown, Sparkles, Spline, Trash2 } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Each SPECIES
// lives in its own built enclosure (a habitat), with the animals you have delivered drawn
// to scale inside it; amenities and planting sit on the grounds; visitors keep to the
// promenade. On the big Park tab the layout is FREE: drag any enclosure, building or
// planting to arrange your zoo (an animal moves with its enclosure). Positions are saved
// on the items, so the park is both a picture of delivered work and something you compose.

const SEG_DOT: Record<SegmentId, string> = { families: '#e6842a', enthusiasts: '#3f8fd0', comfortSeekers: '#8a5a2b' };

// Quick colours for connectors (path tan, plus a few clear signposting hues).
const CONNECTOR_COLORS = ['#c9a86a', '#8a5a2b', '#c9cdd2', '#e6842a', '#4a90d9', '#43a047', '#e5484d'];

/** A small swatch of a path surface (a gradient dot), reused in the picker trigger and list. */
function SurfaceSwatch({ style, size = 14 }: { style: PathStyle; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full border border-black/10" style={{ width: size, height: size, background: `linear-gradient(135deg, ${style.road}, ${style.edge})` }} aria-hidden />;
}

/** The path surface picker: a labelled dropdown (current surface named + swatch) rather than a
 *  row of anonymous colour dots, so it reads as "Surface: Gravel" and stays compact. */
function SurfacePicker({ current, onPick }: { current: PathStyle; onPick: (key: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Path surface"
          className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
          <span className="text-muted-foreground/80">Surface</span>
          <SurfaceSwatch style={current} />
          <span className="text-foreground">{current.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {PATH_STYLES.map((s) => (
          <button key={s.key} type="button" onClick={() => onPick(s.key)}
            className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs', s.key === current.key ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted/50')}>
            <SurfaceSwatch style={s} />
            <span className="flex-1 text-left">{s.label}</span>
            {s.key === current.key && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

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

/** A planting sprite of a given type and colours, at a chosen cell size. Used for enclosure
 *  planting in both the park and the studio preview so they match. */
export function FloraSprite({ type, foliage, trunk, cell }: { type: string; foliage?: string; trunk?: string; cell: number }) {
  const grid = renderDesign({ category: 'flora' } as BacklogItem, { parts: { type }, colors: { foliage: foliage ?? '#43a047', trunk: trunk ?? '#7a5230' } });
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${GRID_W}, ${cell}px)` }} aria-hidden>
      {grid.flatMap((row, r) => row.map((color, c) => (
        <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />
      )))}
    </div>
  );
}

/** The type of a flora/scenery item (from its built design, or its toolbox template before build). */
const landType = (item: BacklogItem): string | undefined => item.design?.parts.type ?? item.template;
/** A landscape feature's footprint on the park: its saved size, or the default for its type. */
const landSize = (item: BacklogItem): { w: number; h: number } => item.size ?? landscapeDefaultSize(landType(item));

/** A landscape feature (river, pond, rocks, hedge...) drawn to fill a resizable box: the pixel
 *  grid is stretched to the footprint, so a river can run right across the park. */
function LandscapePlot({ item, w, h }: { item: BacklogItem; w: number; h: number }) {
  const grid = renderDesign(item, item.design ?? presetFor(item));
  return (
    <div className="relative flex flex-col items-center">
      <div className="grid" style={{ width: w, height: h, gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, gridTemplateRows: `repeat(${GRID_H}, 1fr)` }} aria-hidden>
        {grid.flatMap((row, r) => row.map((color, c) => <span key={`${r}-${c}`} style={{ background: color ?? 'transparent' }} />))}
      </div>
      <span className="mt-1 rounded-full bg-white/80 px-1.5 text-[9px] font-semibold text-emerald-950 dark:bg-black/50 dark:text-emerald-50">{item.name}</span>
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
/** The habitat box in its chosen shape (rounded rectangle, pill, round, hexagon, octagon), with
 *  the ground fill and fence outline. Rounded keeps the crisp bordered div; the other shapes are
 *  drawn as an SVG outline so the fence follows the shape. Contents (animals, water) overlay it. */
export function EnclosureBox({ shape, w, h, ground, fence, border = 3, children, boxRef }:
  { shape: string; w: number; h: number; ground: string; fence: string; border?: number; children?: ReactNode; boxRef?: Ref<HTMLDivElement> }) {
  const points = enclosureShapePoints(shape, w, h, border);
  return (
    <div ref={boxRef} className="relative" style={{ width: w, height: h }}>
      {shape === 'rounded' || !shape ? (
        <div className="absolute inset-0 overflow-hidden rounded-lg"
          style={{ background: ground, border: `${border}px solid ${fence}`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.2), 0 2px 0 rgba(0,0,0,.08)' }}>
          <div className="absolute inset-x-0 bottom-0" style={{ height: '30%', background: 'rgba(0,0,0,.08)' }} />
        </div>
      ) : (
        <svg className="absolute inset-0" width={w} height={h} aria-hidden>
          {shape === 'circle'
            ? <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - border} ry={h / 2 - border} fill={ground} stroke={fence} strokeWidth={border} />
            : shape === 'pill'
              ? <rect x={border} y={border} width={w - 2 * border} height={h - 2 * border} rx={(h - 2 * border) / 2} fill={ground} stroke={fence} strokeWidth={border} />
              : <polygon points={points ?? ''} fill={ground} stroke={fence} strokeWidth={border} strokeLinejoin="round" />}
        </svg>
      )}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/** The enclosure's name shown as a little sign at the top of the habitat. Click it (on the big
 *  Park tab) to rename the enclosure inline. Read-only in the small live views. */
function EnclosureSign({ name, onRename }: { name: string; onRename?: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const stop = (e: ReactPointerEvent) => e.stopPropagation(); // don't start dragging the enclosure
  const commit = () => { setEditing(false); onRename?.(val); };
  const cls = 'max-w-[132px] truncate rounded-md border-2 border-amber-900/70 bg-amber-200 px-1.5 py-0.5 text-center text-[10px] font-bold leading-tight text-amber-950 shadow-sm dark:bg-amber-300';
  return (
    <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
      {editing ? (
        <input autoFocus value={val} onPointerDown={stop}
          onChange={(e) => setVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(name); setEditing(false); } }}
          className={cn(cls, 'w-[120px] outline-none ring-2 ring-amber-500')} />
      ) : onRename ? (
        <button type="button" title="Rename this enclosure" onPointerDown={stop}
          onClick={() => { setVal(name); setEditing(true); }}
          className={cn(cls, 'cursor-text hover:bg-amber-100')}>{name}</button>
      ) : (
        <span className={cls}>{name}</span>
      )}
    </div>
  );
}

function Enclosure({ enc, animals, plants = [], theme, onSetSpot, onUnnest, onRename }: { enc: BacklogItem; animals: BacklogItem[]; plants?: BacklogItem[]; theme: ZoneTheme; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onRename?: (id: string, name: string) => void }) {
  const cfg = ENCLOSURE[enc.enclosureSize ?? 'medium'];
  const d = enc.design;
  const ground = d?.colors.ground ?? theme.plot;
  const fence = d?.colors.fence ?? theme.plotBorder;
  const n = animals.length;
  const cell = n >= 4 ? 1 : 2; // more animals share the space, so each is drawn smaller
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  // A content item keeps its dragged spot; an animal without one auto-arranges along the floor.
  const spotOf = (a: BacklogItem, i: number) => a.spot
    ? { left: a.spot.x * 100, top: a.spot.y * 100 }
    : { left: n <= 1 ? 50 : 14 + (i / (n - 1)) * 72, top: 62 + (i % 2 === 0 ? -6 : 6) };
  const clampSpot = (p: { x: number; y: number }) => ({ x: clamp(p.x, 0.08, 0.92), y: clamp(p.y, 0.1, 0.94) });

  // Drag a content item (animal or planted flora) to a spot inside its enclosure. Coordinates come
  // from the habitat box, so it works regardless of the park's zoom; stopPropagation keeps the
  // whole enclosure from moving. A plant released well outside the box is taken back out (un-nested).
  const startSpotDrag = (e: ReactPointerEvent, id: string, unnestable: boolean) => {
    if (!onSetSpot) return;
    e.stopPropagation();
    e.preventDefault();
    const raw = (ev: { clientX: number; clientY: number }) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r) return null;
      return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height };
    };
    const move = (ev: globalThis.PointerEvent) => { const p = raw(ev); if (p) { const c = clampSpot(p); setDrag({ id, x: c.x, y: c.y }); } };
    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const p = raw(ev);
      if (p) {
        const outside = p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05;
        if (unnestable && outside && onUnnest) onUnnest(id);
        else onSetSpot(id, clampSpot(p));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="relative flex flex-col items-center">
      <EnclosureBox shape={d?.parts.shape ?? 'rounded'} w={cfg.w} h={cfg.h} ground={ground} fence={fence} boxRef={boxRef}>
        <EnclosureSign name={enc.name} onRename={onRename ? (name) => onRename(enc.id, name) : undefined} />
        {d && enclosureWater(d).map((wf, i) => (
          <div key={i} className="absolute" style={{ left: `${wf.x * 100}%`, top: `${wf.y * 100}%`, width: `${wf.w * 100}%`, height: `${wf.h * 100}%`, borderRadius: 999, background: d.colors.water ?? '#5aa9c8' }} />
        ))}
        {/* Studio-placed planting: decorative flora that is part of the enclosure design. */}
        {d && enclosureFlora(d).map((fl, i) => (
          <div key={`fl-${i}`} className="absolute" style={{ left: `${fl.x * 100}%`, top: `${fl.y * 100}%`, transform: `translate(-50%,-50%) scale(${fl.s})`, transformOrigin: 'center', zIndex: 0 }}>
            <FloraSprite type={fl.type} foliage={d.colors.foliage} trunk={d.colors.trunk} cell={cell} />
          </div>
        ))}
        {n === 0 && plants.length === 0 && (!d || enclosureFlora(d).length === 0) && <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-black/40">habitat ready</div>}
        {/* Planting sits behind the animals; drag it within, or out of the fence to remove it. */}
        {plants.map((pl) => {
          const p = drag?.id === pl.id ? { left: drag.x * 100, top: drag.y * 100 } : { left: (pl.spot?.x ?? 0.5) * 100, top: (pl.spot?.y ?? 0.4) * 100 };
          return (
            <div key={pl.id} title={onSetSpot ? `${pl.name} - drag within, or out of the fence to remove` : undefined}
              className={cn('absolute', onSetSpot && 'cursor-grab active:cursor-grabbing')}
              onPointerDown={(e) => startSpotDrag(e, pl.id, true)}
              style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: drag?.id === pl.id ? 3 : 0, touchAction: onSetSpot ? 'none' : undefined }}>
              <Sprite item={pl} design={pl.design ?? presetFor(pl)} cell={cell} />
            </div>
          );
        })}
        {animals.map((a, i) => {
          const p = drag?.id === a.id ? { left: drag.x * 100, top: drag.y * 100 } : spotOf(a, i);
          return (
            <div key={a.id} className={cn('absolute', onSetSpot && 'cursor-grab active:cursor-grabbing')}
              onPointerDown={(e) => startSpotDrag(e, a.id, false)}
              style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: drag?.id === a.id ? 3 : 1, touchAction: onSetSpot ? 'none' : undefined }}>
              <Sprite item={a} design={a.design ?? presetFor(a)} cell={cell} />
            </div>
          );
        })}
      </EnclosureBox>
    </div>
  );
}

// ---- Features: the positionable things in the park (enclosures + amenities + planting) ----

interface Feature { item: BacklogItem; kind: 'enclosure' | 'plot'; w: number; h: number; animals: BacklogItem[]; plants: BacklogItem[]; theme: ZoneTheme }

/** Everything currently shown in the park, as positionable features. An enclosure appears
 *  once BUILT (Done or Open) - the habitat is there before its animals are released - with
 *  its open animals inside; amenities and planting appear when open. */
function buildFeatures(state: ZooGameState): Feature[] {
  const open = state.backlog.filter((it) => it.status === 'open' && !it.enhancesId);
  const builtEnc = state.backlog.filter((it) => it.category === 'enclosure' && (it.status === 'done' || it.status === 'open') && !it.enhancesId);
  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((it) => it.zone)]));
  const theme = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));
  // Planting dragged into a built enclosure lives inside that habitat, not loose on the grounds.
  const nestedFlora = (o: BacklogItem) => o.category === 'flora' && !!o.enclosureId && builtEnc.some((e) => e.id === o.enclosureId);
  const feats: Feature[] = [];
  for (const e of builtEnc) {
    const cfg = ENCLOSURE[e.enclosureSize ?? 'medium'];
    const animals = open.filter((o) => o.category === 'exhibit' && o.enclosureId === e.id);
    const plants = open.filter((o) => nestedFlora(o) && o.enclosureId === e.id);
    feats.push({ item: e, kind: 'enclosure', w: cfg.w, h: cfg.h + LABEL_H, animals, plants, theme: theme(e.zone) });
  }
  // Any open exhibit whose enclosure is not built falls back to a small plot (shouldn't
  // normally happen, since the habitat is built first).
  for (const o of open.filter((o) => o.category === 'exhibit' && !builtEnc.some((e) => e.id === o.enclosureId))) {
    feats.push({ item: o, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], plants: [], theme: theme(o.zone) });
  }
  // Amenities and loose planting sit freely on the grounds - drag them anywhere (or a plant onto
  // an enclosure to plant it inside). Landscape scenery takes its own resizable footprint.
  for (const a of open.filter((o) => o.category === 'amenity' || (o.category === 'flora' && !nestedFlora(o)))) {
    if (a.category === 'flora' && isLandscapeType(landType(a))) {
      const sz = landSize(a);
      feats.push({ item: a, kind: 'plot', w: sz.w, h: sz.h + LABEL_H, animals: [], plants: [], theme: theme(a.zone) });
    } else {
      feats.push({ item: a, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], plants: [], theme: theme(a.zone) });
    }
  }
  return feats;
}

const CANVAS_W = 880;
const PATH_H = 40; // promenade band along the foot, where visitors stroll
const PAD = 20;
const GAP = 18;
const PERIM = 8;        // how far a perimeter path sits outside a feature's body
const PERIM_W = 8;      // perimeter / park-boundary path thickness
const PATH_TAN = '#c9a86a'; // the default path colour (perimeters, park boundary, new connectors)
const PATH_EDGE = 'rgba(0,0,0,.28)'; // the dark outline under every path

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

/** The point on a feature's bounding box edge, on the ray from its centre toward a target - so a
 *  connector attaches to the edge nearest the thing it points at, not the middle of the sprite. */
function boxEdge(cx: number, cy: number, hw: number, hh: number, tx: number, ty: number): { x: number; y: number } {
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const t = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  if (t >= 1) return { x: tx, y: ty }; // target already inside the box
  return { x: cx + dx * t, y: cy + dy * t };
}

/** Deterministic 0..1 from an index + channel (stable across renders). */
const jitter = (n: number, k: number) => {
  const x = Math.sin((n + 1) * (k === 0 ? 12.9898 : 78.233)) * 43758.5453;
  return x - Math.floor(x);
};

/** The free-placement park canvas: a fixed design-sized scene scaled to fit, with each
 *  feature absolutely positioned and draggable. Dragging updates a live local position and
 *  commits to the item on release (so the layout persists). */
function FreeScene({ features, dots, style, tool, editable, connectors, selectedConn, newConn, onPlaceItem, onImprove, improving, onSetSpot, onSetSize, onNest, onUnnest, onRename, onAddConnector, onUpdateConnector, onSelectConn }: {
  features: Feature[];
  dots: SegmentId[];
  style: PathStyle;
  tool: 'none' | 'connect';
  editable: boolean;
  connectors: ZooConnector[];
  selectedConn: string | null;
  newConn: { thickness: number; color: string };
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  onImprove?: (id: string) => void;
  improving?: Set<string>;
  onSetSpot?: (id: string, spot: { x: number; y: number }) => void;
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void;
  onUnnest?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onAddConnector?: (c: ZooConnector) => void;
  onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void;
  onSelectConn?: (id: string | null) => void;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [drag, setDrag] = useState<{ id: string; pos: { x: number; y: number } } | null>(null);
  // Connector drawing: the first end that has been placed, plus any bends and the live cursor.
  const [draftA, setDraftA] = useState<ConnectorEnd | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const idc = useRef(0);
  const newId = () => `conn-${connectors.length}-${idc.current++}`;

  const auto = autoLayout(features);
  const posOf = (f: Feature) => (drag?.id === f.item.id ? drag.pos : f.item.pos ?? auto.get(f.item.id) ?? { x: PAD, y: PAD });
  const contentBottom = features.reduce((m, f) => Math.max(m, posOf(f).y + f.h / 2), 0);
  const canvasH = Math.max(440, Math.round(contentBottom + PAD)) + PATH_H;

  // The visible body box of a feature (the enclosure box / building tile, excluding the name label),
  // used for both its perimeter path and where connectors attach.
  const coreBox = (f: Feature) => { const c = posOf(f); const bh = f.h - LABEL_H; const cy = f.kind === 'enclosure' ? c.y : c.y - LABEL_H / 2; return { cx: c.x, cy, hw: f.w / 2, hh: bh / 2 }; };
  // --- Connector geometry: resolve each end (its feature's perimeter edge, or a free point) + the polyline.
  const boxOf = (id: string) => { const f = features.find((x) => x.item.id === id); return f ? coreBox(f) : null; };
  const anchor = (end: ConnectorEnd) => { const b = end.featureId ? boxOf(end.featureId) : null; return b ? { x: b.cx, y: b.cy } : { x: end.x, y: end.y }; };
  const resolveEnd = (end: ConnectorEnd, toward: { x: number; y: number }) => {
    const b = end.featureId ? boxOf(end.featureId) : null;
    return b ? boxEdge(b.cx, b.cy, b.hw + PERIM, b.hh + PERIM, toward.x, toward.y) : { x: end.x, y: end.y };
  };
  // A feature's perimeter path (a loop just outside its body), following its shape. Enclosures use
  // their chosen shape; buildings use a rounded rectangle. Only enclosures and buildings get one.
  const perimeters = features.filter((f) => f.kind === 'enclosure' || f.item.category === 'amenity').map((f) => {
    const b = coreBox(f);
    const shape = f.kind === 'enclosure' ? (f.item.design?.parts.shape ?? 'rounded') : 'rounded';
    return { id: f.item.id, shape, x: b.cx - b.hw - PERIM, y: b.cy - b.hh - PERIM, w: b.hw * 2 + PERIM * 2, h: b.hh * 2 + PERIM * 2 };
  });
  const perimEl = (p: { id: string; shape: string; x: number; y: number; w: number; h: number }, stroke: string, width: number, key: string) => {
    const common = { fill: 'none' as const, stroke, strokeWidth: width, strokeLinejoin: 'round' as const };
    if (p.shape === 'circle') return <ellipse key={key} cx={p.x + p.w / 2} cy={p.y + p.h / 2} rx={p.w / 2} ry={p.h / 2} {...common} />;
    if (p.shape === 'pill') return <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.h / 2} {...common} />;
    if (p.shape === 'hexagon' || p.shape === 'octagon') return <polygon key={key} points={enclosureShapePoints(p.shape, p.w, p.h, 0) ?? ''} transform={`translate(${p.x},${p.y})`} {...common} />;
    return <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={14} {...common} />;
  };
  // The park boundary: a rounded loop just inside the canvas, above the promenade.
  const boundary = { x: 10, y: 10, w: CANVAS_W - 20, h: canvasH - PATH_H - 16 };
  const boundaryEl = (stroke: string, width: number, key: string) => (
    <rect key={key} x={boundary.x} y={boundary.y} width={boundary.w} height={boundary.h} rx={22} fill="none" stroke={stroke} strokeWidth={width} />
  );
  const connPoints = (c: { a: ConnectorEnd; b: ConnectorEnd; bends: { x: number; y: number }[] }) => {
    const aToward = c.bends[0] ?? anchor(c.b);
    const bToward = c.bends[c.bends.length - 1] ?? anchor(c.a);
    return [resolveEnd(c.a, aToward), ...c.bends, resolveEnd(c.b, bToward)];
  };
  const toD = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Point (design px) from a pointer event, and the top-most feature under a point.
  const ptOf = (ev: { clientX: number; clientY: number }) => {
    const rect = inner.current!.getBoundingClientRect();
    const s = rect.width / CANVAS_W || 1;
    return { x: clamp((ev.clientX - rect.left) / s, 0, CANVAS_W), y: clamp((ev.clientY - rect.top) / s, 0, canvasH) };
  };
  const featureAt = (pt: { x: number; y: number }) => {
    for (let i = features.length - 1; i >= 0; i--) { const f = features[i]; const c = posOf(f); if (Math.abs(pt.x - c.x) <= f.w / 2 && Math.abs(pt.y - c.y) <= f.h / 2) return f; }
    return null;
  };
  const endAt = (pt: { x: number; y: number }): ConnectorEnd => { const f = featureAt(pt); return f ? { featureId: f.item.id, x: posOf(f).x, y: posOf(f).y } : { x: pt.x, y: pt.y }; };

  // Connect tool: click to place the first end, click a feature (or empty) to finish, empty clicks
  // in between drop a bend so you can route it by hand.
  const connectClick = (e: ReactPointerEvent) => {
    if (tool !== 'connect' || !onAddConnector) return;
    const pt = ptOf(e); const f = featureAt(pt);
    if (!draftA) { setDraftA(endAt(pt)); return; }
    if (f) { onAddConnector({ id: newId(), a: draftA, b: endAt(pt), bends: [], thickness: newConn.thickness, color: newConn.color }); setDraftA(null); setCursor(null); }
    else { onAddConnector({ id: newId(), a: draftA, b: endAt(pt), bends: [], thickness: newConn.thickness, color: newConn.color }); setDraftA(null); setCursor(null); }
  };

  // Drag a connector end or bend. Ends re-attach to a feature if released over one, else go free.
  const dragHandle = (id: string, part: 'a' | 'b' | number) => (e: ReactPointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const conn = connectors.find((c) => c.id === id); if (!conn || !onUpdateConnector) return;
    const move = (ev: PointerEvent) => {
      const pt = ptOf(ev);
      if (part === 'a' || part === 'b') onUpdateConnector(id, { [part]: { x: pt.x, y: pt.y } });
      else { const bends = conn.bends.slice(); bends[part] = pt; onUpdateConnector(id, { bends }); }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      if (part === 'a' || part === 'b') onUpdateConnector(id, { [part]: endAt(ptOf(ev)) });
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  // Insert a bend by dragging a segment's midpoint.
  const dragNewBend = (id: string, segIndex: number, start: { x: number; y: number }) => (e: ReactPointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const conn = connectors.find((c) => c.id === id); if (!conn || !onUpdateConnector) return;
    const bends = conn.bends.slice(); bends.splice(segIndex, 0, start);
    onUpdateConnector(id, { bends });
    const move = (ev: PointerEvent) => { const b2 = bends.slice(); b2[segIndex] = ptOf(ev); onUpdateConnector(id, { bends: b2 }); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

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
    if (!onPlaceItem || tool !== 'none') return; // in connect mode, clicks draw connectors
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
      const drop = at(ev);
      // A plant dropped onto a built enclosure is planted inside it; otherwise it just moves.
      if (onNest && f.kind === 'plot' && f.item.category === 'flora') {
        const enc = features.find((g) => {
          if (g.kind !== 'enclosure') return false;
          const c = posOf(g);
          const left = c.x - g.w / 2, top = c.y - g.h / 2;
          return drop.x >= left && drop.x <= left + g.w && drop.y >= top && drop.y <= top + (g.h - LABEL_H);
        });
        if (enc) {
          const c = posOf(enc);
          const left = c.x - enc.w / 2, top = c.y - enc.h / 2;
          onNest(f.item.id, enc.item.id, { x: clamp((drop.x - left) / enc.w, 0.08, 0.92), y: clamp((drop.y - top) / (enc.h - LABEL_H), 0.1, 0.94) });
          setDrag(null);
          return;
        }
      }
      onPlaceItem(f.item.id, drop);
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    setDrag({ id: f.item.id, pos: origin });
  };

  // Drag the corner handle to resize a landscape feature's footprint (design px). Free arranging,
  // like repositioning - it stretches a river across the park without changing what it is.
  const startResize = (e: ReactPointerEvent, f: Feature) => {
    if (!onSetSize) return;
    e.preventDefault(); e.stopPropagation();
    const s = inner.current ? inner.current.getBoundingClientRect().width / CANVAS_W : scale || 1;
    const sx = e.clientX, sy = e.clientY, w0 = f.w, h0 = f.h - LABEL_H;
    const move = (ev: PointerEvent) => onSetSize(f.item.id, {
      w: Math.round(clamp(w0 + (ev.clientX - sx) / s, 40, CANVAS_W - 40)),
      h: Math.round(clamp(h0 + (ev.clientY - sy) / s, 24, 320)),
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  const selected = connectors.find((c) => c.id === selectedConn) ?? null;

  return (
    <div ref={outer} className="relative w-full" style={{ height: canvasH * scale }}>
      <div ref={inner}
        onPointerDown={tool === 'connect' ? connectClick : (tool === 'none' ? () => onSelectConn?.(null) : undefined)}
        onPointerMove={tool === 'connect' ? (e) => setCursor(ptOf(e)) : undefined}
        className="absolute left-0 top-0 overflow-hidden rounded-2xl border shadow-sm"
        style={{ width: CANVAS_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left', cursor: tool === 'connect' ? 'crosshair' : undefined,
          borderColor: 'rgba(120,140,90,.5)', background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0 2px, transparent 3px) 0 0/22px 22px, linear-gradient(#86c06a,#7ab85f)' }}>

        {/* Promenade path + entrance + trees along the foot. */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: PATH_H, background: `linear-gradient(${style.promenade[0]},${style.promenade[1]})`, boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25)' }} aria-hidden />

        {/* Path layer: the park boundary, a perimeter walkway around each enclosure/building, and the
            manual connectors that join them. Attached connector ends follow their feature (posOf
            recomputes each render). Everything is drawn in two passes - all dark outlines first, then
            all tan bodies - so where paths meet, the bodies merge cleanly instead of one outline
            cutting through another. */}
        {(() => {
          const drawn = connectors.map((c) => ({ c, d: toD(connPoints(c)) }));
          return (
            <svg className="absolute inset-0 z-[5]" width={CANVAS_W} height={canvasH} style={{ pointerEvents: 'none' }}>
              {/* Outlines */}
              {boundaryEl(PATH_EDGE, PERIM_W + 3, 'bo')}
              {perimeters.map((p) => perimEl(p, PATH_EDGE, PERIM_W + 3, `po-${p.id}`))}
              {drawn.map(({ c, d }) => (
                <polyline key={`o-${c.id}`} points={d} fill="none" stroke={PATH_EDGE} strokeWidth={c.thickness + 3} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {/* Bodies */}
              {boundaryEl(PATH_TAN, PERIM_W, 'bb')}
              {perimeters.map((p) => perimEl(p, PATH_TAN, PERIM_W, `pb-${p.id}`))}
              {drawn.map(({ c, d }) => (
                <polyline key={`b-${c.id}`} points={d} fill="none" stroke={c.color} strokeWidth={c.thickness} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {selected && selectedConn && (
                <polyline points={toD(connPoints(selected))} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* Selection hit-lines (only while deploying, i.e. editable). */}
              {editable && tool === 'none' && onSelectConn && drawn.map(({ c, d }) => (
                <polyline key={`h-${c.id}`} points={d} fill="none" stroke="transparent" strokeWidth={Math.max(20, c.thickness + 12)} strokeLinecap="round" strokeLinejoin="round"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onSelectConn(c.id); }} />
              ))}
              {/* Live preview while drawing a connector. */}
              {tool === 'connect' && draftA && cursor && (
                <polyline points={toD([resolveEnd(draftA, cursor), cursor])} fill="none" stroke={newConn.color} strokeWidth={newConn.thickness}
                  strokeLinecap="round" strokeLinejoin="round" opacity={0.65} strokeDasharray="7 6" />
              )}
            </svg>
          );
        })()}

        {/* Handles for the selected connector: drag the ends (re-attach or free), drag a bend to move
            it (double-click to remove), or drag a segment's midpoint dot to add a bend. */}
        {editable && tool === 'none' && selected && (() => {
          const pts = connPoints(selected);
          const mids = pts.slice(0, -1).map((p, i) => ({ x: (p.x + pts[i + 1].x) / 2, y: (p.y + pts[i + 1].y) / 2, seg: i }));
          return (
            <div className="absolute inset-0 z-[25]" style={{ pointerEvents: 'none' }}>
              {mids.map((m) => (
                <div key={`mid-${m.seg}`} onPointerDown={dragNewBend(selected.id, m.seg, { x: m.x, y: m.y })}
                  title="Drag to add a bend" className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-blue-400 bg-white/70"
                  style={{ left: m.x, top: m.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ))}
              {selected.bends.map((bd, i) => (
                <div key={`bend-${i}`} onPointerDown={dragHandle(selected.id, i)}
                  onDoubleClick={(e) => { e.stopPropagation(); onUpdateConnector?.(selected.id, { bends: selected.bends.filter((_, j) => j !== i) }); }}
                  title="Drag to move, double-click to remove" className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-blue-500 bg-white active:cursor-grabbing"
                  style={{ left: bd.x, top: bd.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ))}
              {(['a', 'b'] as const).map((k) => { const p = k === 'a' ? pts[0] : pts[pts.length - 1]; return (
                <div key={k} onPointerDown={dragHandle(selected.id, k)} title="Drag onto a feature to attach, or anywhere to free it"
                  className={cn('absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 bg-white active:cursor-grabbing', selected[k].featureId ? 'border-emerald-500' : 'border-blue-500')}
                  style={{ left: p.x, top: p.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ); })}
            </div>
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
          const queued = improving?.has(f.item.id);
          const isLand = f.kind === 'plot' && f.item.category === 'flora' && isLandscapeType(landType(f.item));
          return (
            <div key={f.item.id}
              onPointerDown={(e) => startDrag(e, f)}
              className={cn('group absolute z-10 select-none', onPlaceItem ? 'cursor-grab active:cursor-grabbing' : '', dragging && 'z-30')}
              style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)', touchAction: 'none', filter: dragging ? 'drop-shadow(0 6px 8px rgba(0,0,0,.25))' : undefined }}>
              {f.kind === 'enclosure'
                ? <Enclosure enc={f.item} animals={f.animals} plants={f.plants} theme={f.theme} onSetSpot={onSetSpot} onUnnest={onUnnest} onRename={onRename} />
                : isLand ? <LandscapePlot item={f.item} w={f.w} h={f.h - LABEL_H} />
                : <Plot item={f.item} cell={4} />}
              {/* Resize handle for landscape scenery: drag to stretch a river across the park. */}
              {isLand && onSetSize && tool === 'none' && !dragging && (
                <div onPointerDown={(e) => startResize(e, f)} title="Drag to resize"
                  className="absolute z-40 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-emerald-600 bg-white opacity-0 shadow group-hover:opacity-100"
                  style={{ right: -6, bottom: LABEL_H - 4, touchAction: 'none' }} />
              )}
              {/* Feedback-driven improvement: raise an "Improve" PBI for this live item (self as PO). */}
              {onImprove && tool === 'none' && !dragging && (
                queued ? (
                  <span className="pointer-events-none absolute -top-2 -right-1 z-40 whitespace-nowrap rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">Improving…</span>
                ) : (
                  <button type="button" title={`Raise an Improve PBI for ${f.item.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onImprove(f.item.id); }}
                    className="absolute -top-2 -right-1 z-40 flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-sky-700">
                    <Sparkles className="h-3 w-3" /> Improve
                  </button>
                )
              )}
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
            {f.kind === 'enclosure' ? <Enclosure enc={f.item} animals={f.animals} theme={f.theme} /> : <Plot item={f.item} cell={3} />}
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
  /** On the big Park tab, called when the promenade surface is changed. */
  onSetPathStyle?: (key: string) => void;
  /** On the big Park tab, manual connectors: add a new one, edit its ends/bends/style, or delete.
   *  Paths are only editable while DEPLOYING an item (see deployMode). */
  onAddConnector?: (c: ZooConnector) => void;
  onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void;
  onDeleteConnector?: (id: string) => void;
  /** Non-null while an item is being deployed (its name) - drawing/editing paths is part of that
   *  placement step. Outside deploy mode connectors are read-only; changes then go through PBIs. */
  deployMode?: string | null;
  /** When deploying a Pathway, the width and colour it was designed at - new connectors use it. */
  deployStyle?: { thickness: number; color: string } | null;
  onFinishDeploy?: () => void;
  /** On the big Park tab, raise a feedback-driven "Improve X" PBI for a delivered feature. */
  onImprove?: (id: string) => void;
  /** On the big Park tab, position an animal within its enclosure (drag inside the habitat). */
  onSetSpot?: (id: string, spot: { x: number; y: number }) => void;
  /** On the big Park tab, resize a landscape feature's footprint (drag its corner). */
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  /** On the big Park tab, plant flora inside an enclosure (drag onto it) or take it back out. */
  onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void;
  onUnnest?: (id: string) => void;
  /** On the big Park tab, rename an enclosure by editing its sign. */
  onRename?: (id: string, name: string) => void;
}

/** The park as it stands: built enclosures with their animals, amenities and planting,
 *  a HUD at a glance, and visitors on the promenade. `large` = the full-width, draggable
 *  Park tab; `compact`/`fill` = small read-only live views. */
export function ParkView({ state, compact = false, large = false, onPlaceItem, onSetPathStyle, onImprove, onSetSpot, onNest, onUnnest, onRename, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, onFinishDeploy, onSetSize }: ParkViewProps) {
  const style = pathStyleFor(state.pathStyle);
  const connectors = state.connectors ?? [];
  // The park tool: 'connect' draws connectors, 'none' = arrange & select. Paths are only editable
  // while DEPLOYING an item; after it's open, connectors are read-only (changes go through PBIs).
  const canConnect = !!deployMode;
  const [tool, setTool] = useState<'none' | 'connect'>('none');
  const [selectedConn, setSelectedConn] = useState<string | null>(null);
  const effectiveTool = canConnect ? tool : 'none';
  // Style applied to a NEW connector; when deploying a Pathway it's the width/colour designed for
  // it, otherwise a sensible default. The toolbar still edits the selected one.
  const newConn = deployStyle ?? { thickness: 8, color: '#c9a86a' };
  const selected = canConnect ? (connectors.find((c) => c.id === selectedConn) ?? null) : null;
  const open = state.backlog.filter((it) => it.status === 'open' && !it.enhancesId);
  // Ids of live features that already have an improvement in flight (so we don't stack PBIs).
  // "Improving…" shows only while an improvement is actively being built this Sprint (committed or
  // done) - a transient state - not while it merely sits in the Backlog waiting to be pulled.
  const improving = new Set(state.backlog.filter((it) => it.enhancesId && (it.status === 'committed' || it.status === 'done')).map((it) => it.enhancesId!));
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border bg-card px-3 py-1.5">
          <Stat icon={LayoutGrid} value={`${activeZones.size}/${zones.length}`} label="zones" />
          <Stat icon={Fish} value={`${exhibits}`} label={exhibits === 1 ? 'exhibit' : 'exhibits'} />
          <Stat icon={Trees} value={`${amenities}`} label={amenities === 1 ? 'amenity' : 'amenities'} />
          <Stat icon={Users} value={total ? total.toLocaleString() : '—'} label="visitors" />
          <Stat icon={Smile} value={happiness === null ? '—' : `${happiness}`} label="happiness" title={happiness === null ? 'Measured at the Sprint Review' : undefined} />
        </div>
      )}

      {large ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {features.length > 0 && onPlaceItem ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Move className="h-3.5 w-3.5" /> Drag an enclosure, building or planting to arrange your zoo.</p>
            ) : <span />}
            <div className="flex items-center gap-3">
              {onSetPathStyle && <SurfacePicker current={style} onPick={onSetPathStyle} />}
              {canConnect && onAddConnector && (
                <button type="button" onClick={() => { setSelectedConn(null); setTool((t) => (t === 'connect' ? 'none' : 'connect')); }} title="Draw a path" aria-pressed={tool === 'connect'}
                  className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                    tool === 'connect' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                  <Spline className="h-3.5 w-3.5" /> Connect
                </button>
              )}
            </div>
          </div>
          {/* Deploy mode: placing an item is when you position it AND lay the paths that link it in. */}
          {canConnect && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/5 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Deploying <b>{deployMode}</b>: drag it into place, and use <b>Connect</b> to lay the paths that link it in. Paths are set at deployment - later changes go through the Backlog.</span>
              {onFinishDeploy && (
                <button type="button" onClick={() => { setTool('none'); setSelectedConn(null); onFinishDeploy(); }}
                  className="ml-auto flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white hover:bg-emerald-700"><Check className="h-3 w-3" /> Finish deploying</button>
              )}
            </div>
          )}
          {/* Connect-tool guidance. */}
          {canConnect && tool === 'connect' && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-primary">Click a start (an enclosure to attach, or empty grass to free-place), then click where it ends. It attaches if you finish on a feature.</span>
              <button type="button" onClick={() => setTool('none')} className="ml-auto flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /> Done</button>
            </div>
          )}
          {/* Selected-connector toolbar: thickness, colour, delete. */}
          {canConnect && tool === 'none' && selected && onUpdateConnector && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-blue-400/50 bg-blue-500/5 px-2 py-1.5 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-muted-foreground">Thickness</span>
                {[4, 8, 14].map((t) => (
                  <button key={t} type="button" onClick={() => onUpdateConnector(selected.id, { thickness: t })} title={`${t}px`} aria-pressed={selected.thickness === t}
                    className={cn('flex h-6 w-7 items-center justify-center rounded border', selected.thickness === t ? 'border-primary bg-primary/10' : 'border-border')}>
                    <span className="rounded-full bg-foreground" style={{ width: 16, height: Math.max(2, t / 2) }} />
                  </button>
                ))}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-muted-foreground">Colour</span>
                {CONNECTOR_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => onUpdateConnector(selected.id, { color: c })} title={c}
                    className={cn('h-5 w-5 rounded-full border', selected.color.toLowerCase() === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border/60')} style={{ background: c }} />
                ))}
              </span>
              {onDeleteConnector && (
                <button type="button" onClick={() => { onDeleteConnector(selected.id); setSelectedConn(null); }} title="Delete connector"
                  className="ml-auto flex items-center gap-1 rounded border border-destructive/50 bg-background px-1.5 py-0.5 font-medium text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button>
              )}
            </div>
          )}
          <FreeScene features={features} dots={dots} style={style} tool={effectiveTool} editable={canConnect} connectors={connectors} selectedConn={selectedConn} newConn={newConn}
            onPlaceItem={onPlaceItem} onImprove={onImprove} improving={improving} onSetSpot={onSetSpot} onSetSize={onSetSize} onNest={onNest} onUnnest={onUnnest} onRename={onRename}
            onAddConnector={(c) => { onAddConnector?.(c); setTool('none'); setSelectedConn(c.id); }} onUpdateConnector={onUpdateConnector} onSelectConn={setSelectedConn} />
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

/** One inline park stat: icon + bold value + label, on a single slim row. */
function Stat({ icon: Icon, label, value, title }: { icon: typeof Users; label: string; value: string; title?: string }) {
  return (
    <span className="flex items-center gap-1.5" title={title}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-sm font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </span>
  );
}
