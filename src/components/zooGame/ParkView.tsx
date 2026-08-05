import { useRef, useState, useLayoutEffect, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { renderDesign, presetFor, GRID_W, type ItemDesign } from './design';
import type { SegmentId } from './simulation/types';
import { cn } from '@/lib/utils';
import { Users, Smile, LayoutGrid, Trees, Move } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Each SPECIES
// lives in its own built enclosure (a habitat), with the animals you have delivered drawn
// to scale inside it; amenities and planting sit on the grounds; visitors keep to the
// promenade. On the big Park tab the layout is FREE: drag any enclosure, building or
// planting to arrange your zoo (an animal moves with its enclosure). Positions are saved
// on the items, so the park is both a picture of delivered work and something you compose.

const SEG_DOT: Record<SegmentId, string> = { families: '#e6842a', enthusiasts: '#3f8fd0', comfortSeekers: '#8a5a2b' };

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

/** A single amenity / flora as a plot tile. */
function Plot({ item, theme, cell }: { item: BacklogItem; theme: ZoneTheme; cell: number }) {
  const tile = item.category === 'amenity' ? '#cfd4d8' : theme.plot;
  const border = item.category === 'amenity' ? '#9aa3ab' : theme.plotBorder;
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-center justify-center rounded-lg"
        style={{ background: tile, border: `2px solid ${border}`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.08)', padding: cell }}>
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
function Enclosure({ enc, animals, theme }: { enc: BacklogItem; animals: BacklogItem[]; theme: ZoneTheme }) {
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
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative overflow-hidden rounded-lg"
        style={{ width: cfg.w, height: cfg.h, background: ground, border: `3px solid ${fence}`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.2), 0 2px 0 rgba(0,0,0,.08)' }}>
        <div className="absolute inset-x-0 bottom-0" style={{ height: '30%', background: 'rgba(0,0,0,.08)' }} />
        {d?.parts.water === 'on' && (
          <div className="absolute" style={{ bottom: '12%', right: '10%', width: '34%', height: '30%', borderRadius: 999, background: d.colors.water ?? '#5aa9c8' }} />
        )}
        {n === 0 && <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-black/40">habitat ready</div>}
        {positions.map((p, i) => (
          <div key={animals[i].id} className="absolute" style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)' }}>
            <Sprite item={animals[i]} design={animals[i].design ?? presetFor(animals[i])} cell={cell} />
          </div>
        ))}
      </div>
      <span className="mt-1 rounded-full bg-white/80 px-1.5 text-[9px] font-semibold text-emerald-950 dark:bg-black/50 dark:text-emerald-50">{enc.name}</span>
    </div>
  );
}

// ---- Features: the positionable things in the park (enclosures + amenities + planting) ----

interface Feature { item: BacklogItem; kind: 'enclosure' | 'plot'; w: number; h: number; animals: BacklogItem[]; theme: ZoneTheme }

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
    feats.push({ item: e, kind: 'enclosure', w: cfg.w, h: cfg.h + LABEL_H, animals, theme: theme(e.zone) });
  }
  // Any open exhibit whose enclosure is not built falls back to a small plot (shouldn't
  // normally happen, since the habitat is built first).
  for (const o of open.filter((o) => o.category === 'exhibit' && !builtEnc.some((e) => e.id === o.enclosureId))) {
    feats.push({ item: o, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], theme: theme(o.zone) });
  }
  for (const a of open.filter((o) => o.category === 'amenity' || o.category === 'flora')) {
    feats.push({ item: a, kind: 'plot', w: 64, h: 60 + LABEL_H, animals: [], theme: theme(a.zone) });
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
function FreeScene({ features, dots, onPlaceItem }: {
  features: Feature[];
  dots: SegmentId[];
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
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
    if (!onPlaceItem) return;
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

  return (
    <div ref={outer} className="relative w-full" style={{ height: canvasH * scale }}>
      <div ref={inner} className="absolute left-0 top-0 overflow-hidden rounded-2xl border shadow-sm"
        style={{ width: CANVAS_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left',
          borderColor: 'rgba(120,140,90,.5)', background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0 2px, transparent 3px) 0 0/22px 22px, linear-gradient(#86c06a,#7ab85f)' }}>

        {/* Promenade path + entrance + trees along the foot. */}
        <div className="absolute inset-x-0 bottom-0" style={{ height: PATH_H, background: 'linear-gradient(#d9c7a6,#cdb98f)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25)' }} aria-hidden />

        {/* Paths: a spur from each feature down to the promenade, so the promenade is the main
            road and every enclosure branches off it - a connected zoo, not floating boxes. The
            spurs follow features live as they are dragged (posOf recomputes each render). */}
        {features.length > 0 && (
          <svg className="pointer-events-none absolute inset-0 z-[5]" width={CANVAS_W} height={canvasH} aria-hidden>
            {features.map((f) => {
              const p = posOf(f);
              const yTop = p.y; // starts under the feature (hidden behind it), so there is no gap
              const yBot = canvasH - PATH_H + 3; // meets the promenade
              return (
                <g key={f.item.id}>
                  <line x1={p.x} y1={yTop} x2={p.x} y2={yBot} stroke="#b9a578" strokeWidth={17} strokeLinecap="round" />
                  <line x1={p.x} y1={yTop} x2={p.x} y2={yBot} stroke="#dccbaa" strokeWidth={12} strokeLinecap="round" />
                  <line x1={p.x} y1={yTop} x2={p.x} y2={yBot} stroke="rgba(255,255,255,.35)" strokeWidth={12} strokeDasharray="2 9" strokeLinecap="round" />
                </g>
              );
            })}
          </svg>
        )}

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
                ? <Enclosure enc={f.item} animals={f.animals} theme={f.theme} />
                : <Plot item={f.item} theme={f.theme} cell={4} />}
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
function FlowScene({ features, dots, minHeight }: { features: Feature[]; dots: SegmentId[]; minHeight: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border shadow-sm"
      style={{ minHeight, borderColor: 'rgba(120,140,90,.5)', background: 'linear-gradient(#86c06a,#7ab85f)' }}>
      <div className="relative z-10 flex flex-wrap items-end gap-3 p-3 pb-8">
        {features.map((f) => (
          <div key={f.item.id}>
            {f.kind === 'enclosure' ? <Enclosure enc={f.item} animals={f.animals} theme={f.theme} /> : <Plot item={f.item} theme={f.theme} cell={3} />}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ height: 22, background: 'linear-gradient(#d9c7a6,#cdb98f)' }} aria-hidden />
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
}

/** The park as it stands: built enclosures with their animals, amenities and planting,
 *  a HUD at a glance, and visitors on the promenade. `large` = the full-width, draggable
 *  Park tab; `compact`/`fill` = small read-only live views. */
export function ParkView({ state, compact = false, large = false, onPlaceItem }: ParkViewProps) {
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
          {features.length > 0 && onPlaceItem && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Move className="h-3.5 w-3.5" /> Drag an enclosure, building or planting to arrange your zoo.</p>
          )}
          <FreeScene features={features} dots={dots} onPlaceItem={onPlaceItem} />
        </>
      ) : (
        <FlowScene features={features} dots={dots} minHeight={compact ? 140 : 230} />
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
