import { useState } from 'react';
import type { ZooGameState, BacklogItem } from './types';
import { renderDesign, presetFor, GRID_W, type ItemDesign } from './design';
import type { SegmentId } from './simulation/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Smile, LayoutGrid, Trees, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Open
// exhibits sit in their themed zone as plot tiles showing the design the team built;
// amenities sit alongside; visitors from the simulation wander the grounds. With the
// arrange controls you lay the park out - create and name zones, and drag exhibits
// and amenities between them - while building still happens via Sprints.

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

/** The arrange handlers + drag state, present only while arranging. */
export interface ParkArrange {
  onMoveZone: (id: string, zone: string) => void;
  onAddZone: (name: string) => void;
  onRenameZone: (oldName: string, newName: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
}
interface ArrangeCtx extends ParkArrange {
  zones: string[];
  dragId: string | null;
  setDragId: (id: string | null) => void;
  overZone: string | null;
  setOverZone: (z: string | null) => void;
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

/** A single exhibit / amenity as a plot tile. In arrange mode it can be dragged to
 *  another zone, moved via a menu, and reordered within its zone. */
function Plot({ item, theme, cell, arrange }: { item: BacklogItem; theme: ZoneTheme; cell: number; arrange?: ArrangeCtx }) {
  const tile = item.category === 'amenity' ? '#cfd4d8' : theme.plot;
  const border = item.category === 'amenity' ? '#9aa3ab' : theme.plotBorder;
  return (
    <div className={cn('relative flex flex-col items-center', arrange && 'cursor-grab')}
      draggable={!!arrange}
      onDragStart={arrange ? (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id); arrange.setDragId(item.id); } : undefined}
      onDragEnd={arrange ? () => arrange.setDragId(null) : undefined}>
      <div className="flex items-center justify-center rounded-lg"
        style={{ background: tile, border: `2px solid ${border}`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.08)', padding: cell }}>
        <Sprite item={item} design={item.design ?? presetFor(item)} cell={cell} />
      </div>
      <span className="mt-1 rounded-full bg-white/80 px-1.5 text-[9px] font-semibold text-emerald-950 dark:bg-black/50 dark:text-emerald-50">{item.name}</span>
      {arrange && (
        <div className="mt-1 flex items-center gap-0.5">
          <button type="button" title="Move earlier" onClick={() => arrange.onReorder(item.id, 'up')} className="rounded bg-white/80 p-0.5 text-emerald-950 dark:bg-black/50 dark:text-emerald-50"><ChevronLeft className="h-3 w-3" /></button>
          <select aria-label={`Move ${item.name} to a zone`} value="" onChange={(e) => { if (e.target.value) arrange.onMoveZone(item.id, e.target.value); }}
            className="rounded border border-border bg-white/90 px-1 text-[9px] text-emerald-950 dark:bg-black/60 dark:text-emerald-50">
            <option value="">move to…</option>
            {arrange.zones.filter((z) => z !== item.zone).map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <button type="button" title="Move later" onClick={() => arrange.onReorder(item.id, 'down')} className="rounded bg-white/80 p-0.5 text-emerald-950 dark:bg-black/50 dark:text-emerald-50"><ChevronRight className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  );
}

/** The zone's pill label; editable when arranging. */
function ZoneLabel({ zone, theme, arrange }: { zone: string; theme: ZoneTheme; arrange?: ArrangeCtx }) {
  if (!arrange) return <span className="absolute -top-2.5 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: theme.pill }}>{zone}</span>;
  return (
    <input
      key={zone}
      defaultValue={zone}
      onBlur={(e) => arrange.onRenameZone(zone, e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className="absolute -top-3 left-3 w-28 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow outline-none ring-white/50 focus:ring-2"
      style={{ background: theme.pill }}
      aria-label={`Rename ${zone} zone`}
    />
  );
}

/** One themed zone as a translucent region with a pill label and its plots. In
 *  arrange mode it is a drop target for dragged plots. */
function ZoneRegion({ zone, items, theme, cell, arrange }: { zone: string; items: BacklogItem[]; theme: ZoneTheme; cell: number; arrange?: ArrangeCtx }) {
  const exhibits = items.filter((i) => i.category === 'exhibit').length;
  const amenities = items.filter((i) => i.category === 'amenity').length;
  const unserved = exhibits > 0 && amenities === 0;
  const over = arrange?.overZone === zone;
  return (
    <div className={cn('relative rounded-2xl border-2 border-dashed p-3 pt-5', over && 'ring-2 ring-primary ring-offset-1')}
      style={{ background: theme.region, borderColor: theme.border }}
      onDragOver={arrange ? (e) => { e.preventDefault(); arrange.setOverZone(zone); } : undefined}
      onDragLeave={arrange ? () => arrange.setOverZone(null) : undefined}
      onDrop={arrange ? (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || arrange.dragId; if (id) arrange.onMoveZone(id, zone); arrange.setOverZone(null); arrange.setDragId(null); } : undefined}>
      <ZoneLabel zone={zone} theme={theme} arrange={arrange} />
      {items.length ? (
        <div className="flex flex-wrap items-end gap-x-3 gap-y-4">
          {items.map((it) => <Plot key={it.id} item={it} theme={theme} cell={cell} arrange={arrange} />)}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-white/60 py-4 text-[11px] font-semibold text-white/90">{arrange ? 'drop an animal or amenity here' : 'plot ready - nothing open here yet'}</div>
      )}
      {unserved && !arrange && <div className="mt-2 text-[10px] font-medium italic text-amber-900/80 dark:text-amber-200/80">Great animals, but no amenities nearby yet.</div>}
    </div>
  );
}

/** Create a new named zone. */
function NewZoneTile({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const add = () => { if (name.trim()) { onAdd(name.trim()); setName(''); } };
  return (
    <div className="flex flex-col justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/40 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">New zone</div>
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="Zone name" className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary" />
        <Button size="sm" className="h-7 px-2 text-xs" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

/** Deterministic 0..1 from an index + channel (stable across renders). */
const jitter = (n: number, k: number) => {
  const x = Math.sin((n + 1) * (k === 0 ? 12.9898 : 78.233)) * 43758.5453;
  return x - Math.floor(x);
};

interface ParkViewProps { state: ZooGameState; compact?: boolean; fill?: boolean; arrange?: ParkArrange }

/** The park as it stands: open items in their themed zones, a HUD at a glance, and
 *  visitors strolling when there is something to see. `fill` = large square side
 *  panel; `compact` = small live strip; `arrange` enables the layout controls. */
export function ParkView({ state, compact = false, fill = false, arrange }: ParkViewProps) {
  const [arranging, setArranging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overZone, setOverZone] = useState<string | null>(null);
  const canArrange = !!arrange && !compact && !fill;

  const open = state.backlog.filter((it) => it.status === 'open');
  const zones = Array.from(new Set([...state.zones, ...open.map((it) => it.zone)]));
  const byZone = zones.map((z, i) => ({ zone: z, theme: themeFor(z, i), items: open.filter((it) => it.zone === z) }));
  const filled = byZone.filter((z) => z.items.length > 0).length;
  const exhibits = open.filter((it) => it.category === 'exhibit').length;
  const amenities = open.filter((it) => it.category === 'amenity').length;
  const total = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const happiness = state.lastReview?.overallHappiness ?? null;
  const cell = compact ? 2 : fill ? 4 : 3;

  const arrangeCtx: ArrangeCtx | undefined = canArrange && arranging && arrange
    ? { ...arrange, zones, dragId, setDragId, overZone, setOverZone } : undefined;

  // Little visitors stroll once there is an exhibit to see; hidden while arranging.
  const dots: SegmentId[] = [];
  if (!arrangeCtx && open.some((it) => it.category === 'exhibit')) {
    const cap = compact ? 8 : fill ? 24 : 16;
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
          <Hud icon={LayoutGrid} label="Zones" value={`${filled}/${zones.length}`} />
          <Hud icon={Trees} label={`${amenities} amenit${amenities === 1 ? 'y' : 'ies'}`} value={`${exhibits}`} sub="exhibits" />
          <Hud icon={Users} label="Visitors" value={total ? total.toLocaleString() : '—'} />
          <Hud icon={Smile} label="Happiness" value={happiness === null ? '—' : `${happiness}`} />
        </div>
      )}

      {canArrange && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">{arranging ? 'Drag animals between zones, rename or add zones, reorder plots.' : 'Lay out your park: group animals into zones.'}</span>
          <Button variant={arranging ? 'default' : 'outline'} size="sm" onClick={() => setArranging((a) => !a)}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> {arranging ? 'Done arranging' : 'Arrange the park'}
          </Button>
        </div>
      )}

      {/* The park scene */}
      <div className={cn('relative overflow-hidden rounded-2xl border shadow-sm', fill && 'aspect-square')}
        style={{ borderColor: 'rgba(120,140,90,.5)', background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.06) 0 2px, transparent 3px) 0 0/22px 22px, linear-gradient(#86c06a,#7ab85f)' }}>
        <div className={cn('relative z-10 grid grid-cols-1 gap-3 p-3 pb-9 sm:grid-cols-2 sm:p-4',
          fill ? 'h-full content-stretch' : 'content-start')}
          style={{ minHeight: fill ? undefined : compact ? 140 : 230 }}>
          {byZone.map((z) => <ZoneRegion key={z.zone} zone={z.zone} items={z.items} theme={z.theme} cell={cell} arrange={arrangeCtx} />)}
          {arrangeCtx && <NewZoneTile onAdd={arrangeCtx.onAddZone} />}
        </div>

        {/* Decor: trees at the corners, an entrance gate at the foot. */}
        {!compact && (
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
            <Tree style={{ left: '2%', bottom: '4%' }} />
            <Tree style={{ right: '2%', bottom: '4%' }} />
            <div className="absolute left-1/2 bottom-1 -translate-x-1/2 text-[9px] font-black tracking-widest" style={{ color: '#5a3a1c' }}>
              <div className="mx-auto mb-0.5 h-2.5 w-24 rounded-t-md border-2 border-b-0" style={{ borderColor: '#8a5a2b', background: 'rgba(138,90,43,.15)' }} />
              ENTRANCE
            </div>
          </div>
        )}

        {/* Visitors */}
        {dots.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
            {dots.map((seg, i) => (
              <span key={i} className="zoo-visitor absolute" style={{
                left: `${6 + jitter(i, 0) * 88}%`, top: `${10 + jitter(i, 1) * 78}%`,
                animation: `zooStroll ${7 + jitter(i, 0) * 6}s ease-in-out ${(-jitter(i, 1) * 9).toFixed(2)}s infinite`,
              }}>
                <span className="block rounded-full ring-1 ring-white/70" style={{ width: compact ? 4 : 5, height: compact ? 4 : 5, margin: '0 auto', background: '#f0c9a8' }} />
                <span className="block rounded-b-sm rounded-t" style={{ width: compact ? 6 : 7, height: compact ? 6 : 7, background: SEG_DOT[seg] }} />
              </span>
            ))}
          </div>
        )}
      </div>
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
