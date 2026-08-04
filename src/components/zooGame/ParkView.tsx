import { useRef, useState, useLayoutEffect, type ReactNode } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { renderDesign, presetFor, GRID_W, type ItemDesign } from './design';
import type { SegmentId } from './simulation/types';
import { cn } from '@/lib/utils';
import { Users, Smile, LayoutGrid, Trees } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Open
// exhibits sit in their themed zone as plot tiles showing the design the team built;
// amenities sit alongside; visitors from the simulation wander the grounds. The park
// is a picture of delivered work - what it looks like is decided by the Backlog:
// every item names its zone, so laying out the park is done by refining PBIs (their
// zone) and adding new ones, and delivering them through Sprints.

const SEG_DOT: Record<SegmentId, string> = { families: '#e6842a', enthusiasts: '#3f8fd0', comfortSeekers: '#8a5a2b' };

interface ZoneTheme { region: string; border: string; pill: string; plot: string; plotBorder: string }
const THEMES: Record<string, ZoneTheme> = {
  savanna: { region: 'rgba(214,176,112,.30)', border: 'rgba(150,110,50,.55)', pill: '#b7864a', plot: '#d9b98a', plotBorder: '#b7965f' },
  water: { region: 'rgba(90,170,205,.24)', border: 'rgba(55,125,160,.55)', pill: '#3f8fb0', plot: '#6db6d8', plotBorder: '#4f9cbf' },
  forest: { region: 'rgba(70,150,80,.24)', border: 'rgba(40,110,55,.55)', pill: '#3f8a4c', plot: '#93c977', plotBorder: '#6b8f4e' },
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

/** One themed zone as a translucent region with a pill label: its built enclosure (with
 *  the animals inside), plus any amenities and planting on the grounds. Animals whose
 *  enclosure is not built yet fall back to plots (this should not normally happen, since
 *  the habitat is built first). */
function ZoneRegion({ zone, theme, cell, enclosure, animals, others }: {
  zone: string; theme: ZoneTheme; cell: number;
  enclosure?: BacklogItem; animals: BacklogItem[]; others: BacklogItem[];
}) {
  const empty = !enclosure && animals.length === 0 && others.length === 0;
  const unserved = animals.length > 0 && others.every((o) => o.category !== 'amenity');
  return (
    <div className="relative rounded-2xl border-2 border-dashed p-3 pt-5"
      style={{ background: theme.region, borderColor: theme.border }}>
      <span className="absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: theme.pill }}>{zone}</span>
      {empty ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/60 py-4 text-[11px] font-semibold text-white/90">plot ready - nothing open here yet</div>
      ) : (
        <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
          {enclosure
            ? <Enclosure key={enclosure.id} enc={enclosure} animals={animals} theme={theme} />
            : animals.map((it) => <Plot key={it.id} item={it} theme={theme} cell={cell} />)}
          {others.map((it) => <Plot key={it.id} item={it} theme={theme} cell={cell} />)}
        </div>
      )}
      {unserved && <div className="mt-2 text-[10px] font-medium italic text-amber-900/80 dark:text-amber-200/80">Great animals, but no amenities nearby yet.</div>}
    </div>
  );
}

/** Lay content out at a FIXED design width and scale it uniformly to fill the container.
 *  Because the layout always computes at `designWidth`, it never reflows on resize - the
 *  whole park just scales up or down as one piece, like zooming a map. */
function ScaledScene({ designWidth, children }: { designWidth: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const o = outer.current, i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const s = o.clientWidth / designWidth;
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    update();
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div ref={outer} style={{ height }} className="relative w-full">
      <div ref={inner} style={{ width: designWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

/** Deterministic 0..1 from an index + channel (stable across renders). */
const jitter = (n: number, k: number) => {
  const x = Math.sin((n + 1) * (k === 0 ? 12.9898 : 78.233)) * 43758.5453;
  return x - Math.floor(x);
};

interface ParkViewProps { state: ZooGameState; compact?: boolean; fill?: boolean; large?: boolean }

/** The park as it stands: open items in their themed zones, a HUD at a glance, and
 *  visitors strolling when there is something to see. `large` = the full-width Park
 *  tab (big, impressive); `fill` = square side panel; `compact` = small live strip. */
export function ParkView({ state, compact = false, fill = false, large = false }: ParkViewProps) {
  const open = state.backlog.filter((it) => it.status === 'open');
  // An enclosure appears in the park once it is BUILT (Done or Open) - the habitat is
  // infrastructure, so it is there before its animals are released.
  const builtEnc = state.backlog.filter((it) => it.category === 'enclosure' && (it.status === 'done' || it.status === 'open'));
  const zones = Array.from(new Set([...state.zones, ...open.map((it) => it.zone), ...builtEnc.map((it) => it.zone)]));
  const byZone = zones.map((z, i) => ({
    zone: z,
    theme: themeFor(z, i),
    enclosure: builtEnc.find((e) => e.zone === z),
    animals: open.filter((it) => it.category === 'exhibit' && it.zone === z),
    others: open.filter((it) => (it.category === 'amenity' || it.category === 'flora') && it.zone === z),
  }));
  const filled = byZone.filter((z) => z.enclosure || z.animals.length > 0 || z.others.length > 0).length;
  const exhibits = open.filter((it) => it.category === 'exhibit').length;
  const amenities = open.filter((it) => it.category === 'amenity').length;
  const total = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const happiness = state.lastReview?.overallHappiness ?? null;
  const cell = compact ? 2 : large ? 5 : fill ? 4 : 3;

  // Little visitors stroll once there is an exhibit to see.
  const dots: SegmentId[] = [];
  if (open.some((it) => it.category === 'exhibit')) {
    const cap = compact ? 8 : large ? 34 : fill ? 24 : 16;
    for (const seg of ['families', 'enthusiasts', 'comfortSeekers'] as SegmentId[]) {
      const n = Math.min(cap, Math.round(((state.attendance[seg] ?? 0) / Math.max(1, total)) * Math.min(cap, Math.max(3, Math.round(total / 60)))));
      for (let i = 0; i < n; i++) dots.push(seg);
    }
  }

  // The park scene, laid out once. For the large (Park tab) view it renders inside a
  // ScaledScene at a fixed design width, so it scales rather than reflows on resize.
  const scene = (
    <div className={cn('relative overflow-hidden rounded-2xl border shadow-sm', fill && 'aspect-square')}
      style={{ borderColor: 'rgba(120,140,90,.5)', background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0 2px, transparent 3px) 0 0/22px 22px, linear-gradient(#86c06a,#7ab85f)' }}>
      {/* Fixed 2-column grid (not the viewport-based sm: breakpoint) so the layout is
          driven by content, not window width - the ScaledScene handles fitting the width. */}
      <div className={cn('relative z-10 grid gap-3 p-4 pb-9', compact ? 'grid-cols-1' : 'grid-cols-2',
        fill ? 'h-full content-stretch' : 'content-start')}
        style={{ minHeight: fill ? undefined : compact ? 140 : large ? 460 : 230 }}>
        {byZone.map((z) => <ZoneRegion key={z.zone} zone={z.zone} theme={z.theme} cell={cell} enclosure={z.enclosure} animals={z.animals} others={z.others} />)}
      </div>

      {/* Decor: a path/promenade along the foot (where the visitors stroll), trees at the
          corners, an entrance gate. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" style={{ height: compact ? 22 : 34, background: 'linear-gradient(#d9c7a6,#cdb98f)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25)' }} aria-hidden />
      {!compact && (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <Tree style={{ left: '2%', bottom: '36px' }} />
          <Tree style={{ right: '2%', bottom: '36px' }} />
          <div className="absolute left-1/2 bottom-0.5 -translate-x-1/2 text-[9px] font-black tracking-widest" style={{ color: '#5a3a1c' }}>
            ENTRANCE
          </div>
        </div>
      )}

      {/* Visitors keep to the path around the enclosures - they stroll the promenade
          along the foot of the park, never inside a habitat. */}
      {dots.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" style={{ height: compact ? 22 : 34 }} aria-hidden>
          {dots.map((seg, i) => (
            <span key={i} className="zoo-visitor absolute" style={{
              left: `${4 + jitter(i, 0) * 92}%`, top: `${18 + jitter(i, 1) * 55}%`,
              animation: `zooStroll ${7 + jitter(i, 0) * 6}s ease-in-out ${(-jitter(i, 1) * 9).toFixed(2)}s infinite`,
            }}>
              <span className="block rounded-full ring-1 ring-white/70" style={{ width: compact ? 4 : 5, height: compact ? 4 : 5, margin: '0 auto', background: '#f0c9a8' }} />
              <span className="block rounded-b-sm rounded-t" style={{ width: compact ? 6 : 7, height: compact ? 6 : 7, background: SEG_DOT[seg] }} />
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className={cn('space-y-3', compact && 'space-y-2')}>
      <style>{`
        @keyframes zooStroll { 0%{transform:translate(0,0)} 25%{transform:translate(10px,-7px)} 50%{transform:translate(-6px,8px)} 75%{transform:translate(7px,5px)} 100%{transform:translate(0,0)} }
        @media (prefers-reduced-motion: reduce) { .zoo-visitor { animation: none !important } }
      `}</style>

      {!compact && (
        <div className="grid grid-cols-4 gap-2">
          <Hud icon={LayoutGrid} label="Zones" value={`${filled}/${zones.length}`} />
          <Hud icon={Trees} label={`${amenities} amenit${amenities === 1 ? 'y' : 'ies'}`} value={`${exhibits}`} sub="exhibits" />
          <Hud icon={Users} label="Visitors" value={total ? total.toLocaleString() : '—'} />
          <Hud icon={Smile} label="Happiness" value={happiness === null ? '—' : `${happiness}`} />
        </div>
      )}

      {/* The park scene - scaled to fit (never reflows) on the large Park tab. */}
      {large ? <ScaledScene designWidth={880}>{scene}</ScaledScene> : scene}
    </section>
  );
}

function Tree({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute" style={{ width: 26, height: 34, ...style }}>
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
