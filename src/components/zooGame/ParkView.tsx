import type { ZooGameState, BacklogItem } from './types';
import { templateFor, cellColor, type ItemDesign } from './design';
import type { SegmentId } from './simulation/types';
import { cn } from '@/lib/utils';
import { Trees, Users, Smile, LayoutGrid } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: a top-down park of themed zones.
// Each open exhibit shows the tailored design the team built (reusing the design
// art), amenities sit alongside, and visitors from the simulation wander. Items are
// grouped into their authored zone plots - there is no map-planning here, so it
// stays a Scrum game, not a park-planning game.

const DEFAULT_DESIGN: ItemDesign = { palette: 0, pattern: 'none', features: [] };

const SEG_DOT: Record<SegmentId, string> = { families: '#f97316', enthusiasts: '#0ea5e9', comfortSeekers: '#b45309' };

/** Render an item's template art at a small scale, using the design the team chose. */
function ItemSprite({ item, cell }: { item: BacklogItem; cell: number }) {
  const t = templateFor(item);
  const design = item.design ?? DEFAULT_DESIGN;
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${t.w}, ${cell}px)` }} aria-hidden>
      {t.grid.flatMap((row, r) => row.split('').map((role, c) => {
        const color = cellColor(item, design, role, r, c);
        return <span key={`${r}-${c}`} style={{ width: cell, height: cell, background: color ?? 'transparent' }} />;
      }))}
    </div>
  );
}

/** One themed zone as a plot: its open exhibits and amenities, or a "ready" outline
 *  when nothing is open there yet. */
function ZonePlot({ zone, items, cell }: { zone: string; items: BacklogItem[]; cell: number }) {
  const exhibits = items.filter((i) => i.category === 'exhibit').length;
  const amenities = items.filter((i) => i.category === 'amenity').length;
  const unserved = exhibits > 0 && amenities === 0; // a zone is not truly done until it is served

  return (
    <div className={cn('relative overflow-hidden rounded-xl border p-3',
      items.length ? 'border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/25' : 'border-dashed border-border bg-muted/25')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{zone}</span>
        {items.length
          ? <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">{exhibits} exhibit{exhibits === 1 ? '' : 's'} · {amenities} amenit{amenities === 1 ? 'y' : 'ies'}</span>
          : <span className="text-[10px] text-muted-foreground/70">plot ready</span>}
      </div>
      {items.length ? (
        <div className="flex flex-wrap items-end gap-3">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col items-center gap-1">
              <ItemSprite item={it} cell={cell} />
              <span className="text-[10px] text-muted-foreground">{it.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center text-[11px] text-muted-foreground/60">Nothing open here yet</div>
      )}
      {unserved && (
        <div className="mt-2 text-[10px] italic text-amber-600 dark:text-amber-400">Great animals, but no amenities nearby yet.</div>
      )}
    </div>
  );
}

/** Deterministic 0..1 from an index and a channel (stable across renders, so
 *  visitors do not jump every frame). */
const jitter = (n: number, k: number) => {
  const x = Math.sin((n + 1) * (k === 0 ? 12.9898 : 78.233)) * 43758.5453;
  return x - Math.floor(x);
};

interface ParkViewProps {
  state: ZooGameState;
  /** Compact = smaller, no HUD; used as a live strip on the Sprint board. */
  compact?: boolean;
}

/** The park as it stands: open items placed into their themed-zone plots, a HUD of
 *  the zoo at a glance, and visitors wandering when there is something to see. */
export function ParkView({ state, compact = false }: ParkViewProps) {
  const open = state.backlog.filter((it) => it.status === 'open');
  const zones = Array.from(new Set([...state.zones, ...open.map((it) => it.zone)]));
  const byZone = zones.map((z) => ({ zone: z, items: open.filter((it) => it.zone === z) }));
  const filled = byZone.filter((z) => z.items.length > 0).length;
  const exhibits = open.filter((it) => it.category === 'exhibit').length;
  const amenities = open.filter((it) => it.category === 'amenity').length;
  const total = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const happiness = state.lastReview?.overallHappiness ?? null;
  const cell = compact ? 5 : 7;

  // Visitors wander only once there is an exhibit to see; count scales with crowd.
  const dots: SegmentId[] = [];
  if (open.some((it) => it.category === 'exhibit')) {
    const cap = compact ? 10 : 20;
    for (const seg of ['families', 'enthusiasts', 'comfortSeekers'] as SegmentId[]) {
      const n = Math.min(cap, Math.round(((state.attendance[seg] ?? 0) / Math.max(1, total)) * Math.min(cap, Math.max(4, Math.round(total / 55)))));
      for (let i = 0; i < n; i++) dots.push(seg);
    }
  }

  return (
    <section className={cn('space-y-3', compact && 'space-y-2')}>
      <style>{`
        @keyframes zooWander { 0%{transform:translate(0,0)} 25%{transform:translate(8px,-6px)} 50%{transform:translate(-4px,7px)} 75%{transform:translate(6px,4px)} 100%{transform:translate(0,0)} }
        @media (prefers-reduced-motion: reduce) { .zoo-visitor { animation: none !important } }
      `}</style>

      {!compact && (
        <div className="grid grid-cols-4 gap-2">
          <Hud icon={LayoutGrid} label="Zones" value={`${filled}/${zones.length}`} />
          <Hud icon={Trees} label="Exhibits" value={`${exhibits}`} sub={`${amenities} amenit${amenities === 1 ? 'y' : 'ies'}`} />
          <Hud icon={Users} label="Visitors" value={total ? total.toLocaleString() : '—'} />
          <Hud icon={Smile} label="Happiness" value={happiness === null ? '—' : `${happiness}`} />
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-emerald-100/60 to-lime-50/40 p-3 dark:from-emerald-950/40 dark:to-emerald-950/10">
        <div className={cn('grid gap-3', compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          {byZone.map((z) => <ZonePlot key={z.zone} zone={z.zone} items={z.items} cell={cell} />)}
        </div>
        {/* Wandering visitors overlay */}
        {dots.length > 0 && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {dots.map((seg, i) => (
              <span
                key={i}
                className="zoo-visitor absolute rounded-full ring-1 ring-white/60"
                style={{
                  left: `${5 + jitter(i, 0) * 90}%`,
                  top: `${8 + jitter(i, 1) * 82}%`,
                  width: compact ? 5 : 7,
                  height: compact ? 5 : 7,
                  background: SEG_DOT[seg],
                  animation: `zooWander ${6 + jitter(i, 0) * 6}s ease-in-out ${(-jitter(i, 1) * 8).toFixed(2)}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
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
