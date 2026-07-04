import { useMemo, useState } from 'react';
import {
  Kanban, RotateCw, Timer, Check, ChevronLeft, Info, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Flow Simulator - design preview of the Claude Design mockup "Flow Simulator.dc.html".
// Two screens (Setup -> Results) with three delivery modes. Uses our tokens
// (orange primary) and the app's Button/Progress/Checkbox/Tabs/Select. Sample
// data; the real thing consumes a backlog scenario and the sim engine.
//
// Mode naming corrected: the third mode is fixed-date / flex-scope / MoSCoW,
// i.e. a Timebox (classic DSDM / AgilePM), so it is labelled "AgilePM Timebox"
// (the mockup's setup card said "AgilePM Sprint" while its results tab said
// "Timebox"). Sprint dynamics (Scrum and AgilePM v3) share the Sprint mode.

type Mode = 'kanban' | 'scrum' | 'agilepm';
type MoscoW = 'Must' | 'Should' | 'Could';

const MODES: { key: Mode; title: string; Icon: LucideIcon; rows: [string, string][] }[] = [
  {
    key: 'kanban', title: 'Kanban Flow', Icon: Kanban,
    rows: [['Cadence', 'Continuous flow'], ['Commitment', 'Pull continuously'], ['Prioritisation', 'WSJF'], ['Headline metrics', 'Cycle time · Throughput']],
  },
  {
    key: 'scrum', title: 'Scrum Sprint', Icon: RotateCw,
    rows: [['Cadence', '10-day sprint'], ['Commitment', 'Commit a batch up front'], ['Prioritisation', 'Ordered backlog'], ['Headline metrics', 'Velocity · Say/Do']],
  },
  {
    key: 'agilepm', title: 'AgilePM Timebox', Icon: Timer,
    rows: [['Cadence', 'Fixed end date'], ['Commitment', 'Fixed date, flex scope'], ['Prioritisation', 'MoSCoW'], ['Headline metrics', 'Date hit · Scope %']],
  },
];

const BACKLOG: { id: string; title: string; points: number; moscow: MoscoW }[] = [
  { id: 'i1', title: 'Offline sync', points: 5, moscow: 'Must' },
  { id: 'i2', title: 'Push notifications', points: 3, moscow: 'Must' },
  { id: 'i8', title: 'Crash reporting', points: 2, moscow: 'Must' },
  { id: 'i3', title: 'Map clustering', points: 3, moscow: 'Should' },
  { id: 'i7', title: 'Barcode scan', points: 3, moscow: 'Should' },
  { id: 'i4', title: 'Photo capture', points: 2, moscow: 'Should' },
  { id: 'i5', title: 'CSV export', points: 2, moscow: 'Could' },
  { id: 'i6', title: 'Dark mode', points: 1, moscow: 'Could' },
];

const SOURCES = [
  { key: 'nimbus', label: 'Nimbus Field App backlog' },
  { key: 'payments', label: 'Payments revamp backlog' },
  { key: 'teaching', label: 'Teaching scenario (default)' },
];

const CAPACITY = 15;
const BLUE = 'hsl(210 90% 46%)';

const moscowClasses: Record<MoscoW, string> = {
  Must: 'text-primary bg-primary/10',
  Should: 'text-[hsl(210_80%_42%)] bg-[hsl(210_80%_42%/0.12)]',
  Could: 'text-muted-foreground bg-muted-foreground/15',
};

// --- tiny chart helpers (ported from the mockup) ---
function bars(vals: number[], max: number, o: { w?: number; base?: number; top?: number; pad?: number } = {}) {
  const { w = 260, base = 112, top = 16, pad = 30 } = o;
  const n = vals.length, span = (w - pad - 8) / n, bw = span * 0.55;
  return vals.map((v, i) => { const h = (v / max) * (base - top); return { x: pad + span * i + (span - bw) / 2, w: bw, h, y: base - h }; });
}
function line(vals: number[], max: number, o: { w?: number; base?: number; top?: number; pad?: number } = {}) {
  const { w = 260, base = 112, top = 16, pad = 30 } = o;
  const n = vals.length, span = (w - pad - 8) / (n - 1);
  return vals.map((v, i) => `${(pad + span * i).toFixed(1)},${(base - (v / max) * (base - top)).toFixed(1)}`).join(' ');
}

const SCATTER = [[55, 40], [72, 62], [88, 30], [104, 78], [120, 52], [136, 88], [150, 44], [166, 70], [182, 34], [198, 96], [214, 58], [232, 48]];
const THROUGHPUT = bars([5, 6, 8, 7, 9, 7], 10);
const WIP_LINE = line([4, 6, 5, 7, 6, 5], 9);
const BURN_IDEAL = line([15, 13.5, 12, 10.5, 9, 7.5, 6, 4.5, 3, 1.5, 0], 15, { base: 120, top: 14, pad: 28 });
const BURN_ACTUAL = line([15, 15, 13, 12, 12, 10, 9, 7, 5, 4, 3], 15, { base: 120, top: 14, pad: 28 });
const VELOCITY = bars([11, 13, 10, 12, 12], 15, { base: 120, top: 18, pad: 28 });
const MOSCOW_RESULT: { label: string; tag: string; done: number; total: number; pct: string; bar: string; key: MoscoW }[] = [
  { label: 'Must', tag: 'All shipped', done: 4, total: 4, pct: '100%', bar: 'hsl(var(--primary))', key: 'Must' },
  { label: 'Should', tag: '1 dropped', done: 2, total: 3, pct: '66%', bar: BLUE, key: 'Should' },
  { label: 'Could', tag: 'Dropped', done: 0, total: 2, pct: '4%', bar: 'hsl(var(--muted-foreground)/0.5)', key: 'Could' },
];

const StatCard = ({ value, unit, label, accent }: { value: string; unit?: string; label: string; accent?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className={cn('text-[28px] font-bold leading-none tracking-tight', accent)}>
      {value}{unit && <span className="text-[15px] font-semibold text-muted-foreground">{unit}</span>}
    </div>
    <div className="mt-1.5 text-[13px] text-muted-foreground">{label}</div>
  </div>
);

const ChartCard = ({ title, foot, children }: { title: string; foot?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-[18px]">
    <div className="mb-2 text-[13px] font-semibold">{title}</div>
    {children}
    {foot && <div className="mt-2 text-xs text-muted-foreground">{foot}</div>}
  </div>
);

const Debrief = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/[0.06] p-[18px] text-sm leading-relaxed">
    <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] flex-none text-primary" />
    <span>{children}</span>
  </div>
);

export function FlowSimulatorPreview() {
  const [screen, setScreen] = useState<'setup' | 'results'>('setup');
  const [mode, setMode] = useState<Mode>('scrum');
  const [source, setSource] = useState('nimbus');
  const [committed, setCommitted] = useState<Record<string, boolean>>({ i1: true, i2: true, i3: true, i4: true, i8: true });
  const [wip, setWip] = useState({ analysis: 2, dev: 3, test: 2 });
  const [cfdOpen, setCfdOpen] = useState(false);

  const needsPlan = mode === 'scrum' || mode === 'agilepm';
  const sourceLabel = SOURCES.find((s) => s.key === source)?.label ?? SOURCES[0].label;

  const committedPoints = useMemo(() => BACKLOG.filter((b) => committed[b.id]).reduce((s, b) => s + b.points, 0), [committed]);
  const committedCount = useMemo(() => BACKLOG.filter((b) => committed[b.id]).length, [committed]);
  const capacityPct = Math.min(100, Math.round((committedPoints / CAPACITY) * 100));
  const overCapacity = committedPoints > CAPACITY;

  const setWipVal = (k: keyof typeof wip, d: number) =>
    setWip((w) => ({ ...w, [k]: Math.min(9, Math.max(1, w[k] + d)) }));

  const modeSeg = MODES.map((m) => ({ key: m.key, label: m.key === 'kanban' ? 'Flow' : m.key === 'scrum' ? 'Sprint' : 'Timebox' }));

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-muted/40 to-muted/70">
      <div className="mx-auto max-w-[1120px] px-6 py-10 pb-16">

        {/* ============ SETUP ============ */}
        {screen === 'setup' && (
          <div>
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span>Simulate</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span className="tracking-normal">Step 1 of 2 · Setup</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Run a flow simulation</h1>
              <p className="mt-2 max-w-[600px] text-[15px] leading-relaxed text-muted-foreground">
                Pick how the team delivers, choose what to simulate, then run it. Each mode changes cadence, commitment, and the metrics you get back.
              </p>
            </div>

            {/* Mode cards */}
            <div className="mb-3.5 text-[13px] font-semibold">Delivery mode</div>
            <div className="mb-[30px] grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              {MODES.map((m) => {
                const sel = mode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMode(m.key)}
                    className={cn(
                      'flex flex-col items-start rounded-2xl border-2 bg-card p-[18px] text-left transition-all',
                      sel ? 'border-primary -translate-y-0.5 shadow-lg ring-2 ring-primary/15' : 'border-border shadow-sm hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
                    )}
                  >
                    <div className="mb-3.5 flex w-full items-center gap-2.5">
                      <m.Icon className={cn('h-[22px] w-[22px]', sel ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.7} />
                      <span className="text-base font-bold">{m.title}</span>
                      {sel && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex w-full flex-col gap-[7px]">
                      {m.rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 text-[13px]">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="text-right font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Source + WIP */}
            <div className="mb-[26px] grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-1 text-[13px] font-semibold">Simulate</div>
                <p className="mb-3 text-[13px] text-muted-foreground">Run against a real backlog, or the built-in teaching scenario.</p>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-1 text-[13px] font-semibold">WIP limits</div>
                <p className="mb-3.5 text-[13px] text-muted-foreground">Cap concurrent work at each stage.</p>
                <div className="flex flex-col gap-3">
                  {([['analysis', 'Analysis'], ['dev', 'Development'], ['test', 'Test']] as const).map(([k, label]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-0.5">
                        <button type="button" onClick={() => setWipVal(k, -1)} className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-card text-lg leading-none hover:bg-muted">−</button>
                        <span className="min-w-[34px] text-center text-[15px] font-bold tabular-nums">{wip[k]}</span>
                        <button type="button" onClick={() => setWipVal(k, 1)} className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-card text-lg leading-none hover:bg-muted">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan the sprint/timebox, or Kanban banner */}
            {needsPlan ? (
              <div className="mb-[26px] rounded-2xl border border-border bg-card p-6">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{mode === 'agilepm' ? 'Plan the timebox' : 'Plan the sprint'}</h2>
                  <span className="text-[13px] text-muted-foreground">{committedCount} items committed</span>
                </div>
                <p className="mb-4 text-[13px] text-muted-foreground">Commit a batch up front. The meter fills as you pull items in against capacity.</p>

                <div className="mb-[18px]">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[13px] font-semibold text-muted-foreground">Capacity</span>
                    <span className={cn('text-[13px] font-bold', overCapacity ? 'text-destructive' : 'text-primary')}>{committedPoints} / {CAPACITY} pts</span>
                  </div>
                  <Progress value={capacityPct} className="h-2.5" />
                  {overCapacity && <div className="mt-1.5 text-xs font-semibold text-destructive">Over capacity. Drop an item or split it.</div>}
                </div>

                <div className="flex flex-col gap-2">
                  {BACKLOG.map((b) => {
                    const checked = !!committed[b.id];
                    return (
                      <label
                        key={b.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border px-3.5 py-[11px] transition-colors',
                          checked ? 'border-primary/30 bg-primary/[0.04]' : 'border-border bg-card',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => setCommitted((c) => ({ ...c, [b.id]: !c[b.id] }))}
                          />
                          <span className={cn('text-sm font-medium', !checked && 'text-muted-foreground')}>{b.title}</span>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-px text-[11px] font-bold', moscowClasses[b.moscow])}>{b.moscow}</span>
                        </div>
                        <span className="flex-none text-[13px] font-bold tabular-nums text-muted-foreground">{b.points} pts</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-[26px] flex items-center gap-2.5 rounded-2xl border border-dashed border-border bg-muted/40 px-[18px] py-4">
                <Info className="h-[18px] w-[18px] flex-none text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Kanban pulls work continuously, no up-front commitment, so there's no batch to plan. Set WIP limits above and run.</span>
              </div>
            )}

            {/* Run */}
            <div className="flex items-center justify-end gap-3.5">
              <span className="text-[13px] text-muted-foreground">{needsPlan ? `${committedCount} items · ${committedPoints} pts committed` : 'WIP-limited pull system'}</span>
              <Button size="lg" onClick={() => setScreen('results')}>Run simulation →</Button>
            </div>
          </div>
        )}

        {/* ============ RESULTS ============ */}
        {screen === 'results' && (
          <div>
            <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5">
              <div>
                <div className="mb-2 flex items-center gap-2.5">
                  <button type="button" onClick={() => setScreen('setup')} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-[15px] w-[15px]" /> Back to setup
                  </button>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span className="text-[13px] text-muted-foreground">{sourceLabel}</span>
                </div>
                <h1 className="text-[28px] font-bold tracking-tight">
                  {mode === 'kanban' ? 'Flow results' : mode === 'scrum' ? 'Sprint results' : 'Timebox results'}
                </h1>
              </div>
              <div className="inline-flex rounded-[10px] border border-border bg-muted p-[3px]">
                {modeSeg.map((s) => (
                  <button key={s.key} type="button" onClick={() => setMode(s.key)} className={cn('rounded-lg px-4 py-[7px] text-[13px] font-semibold transition-colors', mode === s.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FLOW */}
            {mode === 'kanban' && (
              <div className="space-y-4">
                <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                  <StatCard value="4.8" unit=" days" label="Avg cycle time" />
                  <StatCard value="7" unit="/wk" label="Throughput" />
                  <StatCard value="42%" label="Flow efficiency" accent="text-primary" />
                  <StatCard value="6" label="Avg WIP" />
                </div>

                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                  <ChartCard title="Cycle-time scatter" foot="Each dot = one item's days in progress">
                    <svg viewBox="0 0 260 130" width="100%" height="130" preserveAspectRatio="none">
                      <line x1="30" y1="10" x2="30" y2="112" stroke="hsl(var(--border))" />
                      <line x1="30" y1="112" x2="252" y2="112" stroke="hsl(var(--border))" />
                      <line x1="30" y1="60" x2="252" y2="60" stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      {SCATTER.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="4" fill="hsl(var(--primary)/0.65)" />)}
                    </svg>
                  </ChartCard>
                  <ChartCard title="Throughput / week" foot="Items completed each week">
                    <svg viewBox="0 0 260 130" width="100%" height="130" preserveAspectRatio="none">
                      <line x1="30" y1="112" x2="252" y2="112" stroke="hsl(var(--border))" />
                      {THROUGHPUT.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="hsl(var(--primary)/0.8)" />)}
                    </svg>
                  </ChartCard>
                  <ChartCard title="WIP over time" foot="Concurrent items in the system">
                    <svg viewBox="0 0 260 130" width="100%" height="130" preserveAspectRatio="none">
                      <line x1="30" y1="112" x2="252" y2="112" stroke="hsl(var(--border))" />
                      <polyline points={WIP_LINE} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinejoin="round" />
                    </svg>
                  </ChartCard>
                </div>

                <div className="flex flex-wrap items-center gap-[18px] rounded-2xl border border-primary/35 bg-primary/[0.06] px-[22px] py-[18px]">
                  <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-primary">Little's Law</div>
                  <div className="flex flex-wrap items-center gap-3.5 text-[15px]">
                    <span>Cycle time <strong>=</strong> WIP <strong>÷</strong> Throughput</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-bold">4.3 days = 6 ÷ 1.4/day</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button type="button" onClick={() => setCfdOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold">
                    Cumulative Flow Diagram
                    <span className={cn('text-muted-foreground transition-transform', cfdOpen && 'rotate-180')}>▾</span>
                  </button>
                  {cfdOpen && (
                    <div className="px-5 pb-5">
                      <svg viewBox="0 0 480 160" width="100%" height="170" preserveAspectRatio="none">
                        <polygon points="0,150 480,150 480,20 0,70" fill="hsl(var(--primary)/0.2)" />
                        <polygon points="0,150 480,150 480,60 0,95" fill="hsl(210 90% 46%/0.25)" />
                        <polygon points="0,150 480,150 480,100 0,120" fill="hsl(215 16% 60%/0.3)" />
                        <polyline points="0,70 480,20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                        <polyline points="0,95 480,60" fill="none" stroke={BLUE} strokeWidth="2" />
                        <polyline points="0,120 480,100" fill="none" stroke="hsl(215 16% 55%)" strokeWidth="2" />
                      </svg>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-primary/50" />Done</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'hsl(210 90% 46% / 0.5)' }} />In progress</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'hsl(215 16% 60%)' }} />Backlog</span>
                      </div>
                    </div>
                  )}
                </div>

                <Debrief>Work is flowing, but items spend ~58% of their time waiting. Tightening the <strong>Test</strong> WIP limit would cut cycle time the most.</Debrief>
              </div>
            )}

            {/* SPRINT */}
            {mode === 'scrum' && (
              <div className="space-y-4">
                <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                  <StatCard value="15" unit=" pts" label="Committed" />
                  <StatCard value="12" unit=" pts" label="Delivered" />
                  <StatCard value="80%" label="Say / Do ratio" accent="text-primary" />
                  <StatCard value="1" label="Carryover item" accent="text-primary" />
                </div>

                <div className="rounded-2xl border border-border bg-card px-5 pb-5 pt-1.5">
                  <Tabs defaultValue="sprint">
                    <div className="my-3.5">
                      <TabsList>
                        <TabsTrigger value="sprint">Burndown &amp; velocity</TabsTrigger>
                        <TabsTrigger value="flow">Flow charts</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="sprint">
                      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                        <div>
                          <div className="mb-2 text-[13px] font-semibold">Sprint burndown</div>
                          <svg viewBox="0 0 260 140" width="100%" height="150" preserveAspectRatio="none">
                            <line x1="28" y1="120" x2="248" y2="120" stroke="hsl(var(--border))" />
                            <line x1="28" y1="14" x2="28" y2="120" stroke="hsl(var(--border))" />
                            <polyline points={BURN_IDEAL} fill="none" stroke="hsl(var(--muted-foreground)/0.5)" strokeWidth="2" strokeDasharray="4 4" />
                            <polyline points={BURN_ACTUAL} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />
                          </svg>
                          <div className="mt-2 text-xs text-muted-foreground">Actual (solid) vs ideal (dashed) · 3 pts remaining</div>
                        </div>
                        <div>
                          <div className="mb-2 text-[13px] font-semibold">Velocity vs prior sprints</div>
                          <svg viewBox="0 0 260 140" width="100%" height="150" preserveAspectRatio="none">
                            <line x1="28" y1="120" x2="248" y2="120" stroke="hsl(var(--border))" />
                            {VELOCITY.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={i === VELOCITY.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.35)'} />)}
                          </svg>
                          <div className="mt-2 text-xs text-muted-foreground">This sprint = 12 · 4-sprint avg = 11.5</div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="flow">
                      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
                        <div>
                          <div className="mb-2 text-[13px] font-semibold">Cycle-time scatter</div>
                          <svg viewBox="0 0 260 130" width="100%" height="130" preserveAspectRatio="none">
                            <line x1="30" y1="112" x2="252" y2="112" stroke="hsl(var(--border))" />
                            {SCATTER.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="4" fill="hsl(var(--primary)/0.65)" />)}
                          </svg>
                          <div className="mt-2 text-xs text-muted-foreground">Item days in progress this sprint</div>
                        </div>
                        <div>
                          <div className="mb-2 text-[13px] font-semibold">Throughput / week</div>
                          <svg viewBox="0 0 260 130" width="100%" height="130" preserveAspectRatio="none">
                            <line x1="30" y1="112" x2="252" y2="112" stroke="hsl(var(--border))" />
                            {THROUGHPUT.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="hsl(var(--primary)/0.8)" />)}
                          </svg>
                          <div className="mt-2 text-xs text-muted-foreground">Items completed each week</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <Debrief>Delivered <strong>12 of 15</strong> committed points, an 80% say/do ratio. One Should carried over; trimming commitment by a point or two would make the sprint more predictable.</Debrief>
              </div>
            )}

            {/* TIMEBOX */}
            {mode === 'agilepm' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-[18px] rounded-2xl border border-primary/40 bg-primary/[0.07] px-6 py-[22px]">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-[26px] w-[26px]" strokeWidth={2.5} />
                  </span>
                  <div>
                    <div className="text-[19px] font-bold text-primary">Hit the date</div>
                    <div className="text-sm text-muted-foreground">Shipped on <strong className="text-foreground">30 Jun</strong>, the fixed end date held. Scope flexed to protect it.</div>
                  </div>
                </div>

                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                  <ChartCard title="What shipped, by MoSCoW">
                    <div className="mt-1.5 flex flex-col gap-3.5">
                      {MOSCOW_RESULT.map((m) => (
                        <div key={m.label}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              {m.label}
                              <span className={cn('inline-flex items-center rounded-full px-2 py-px text-[11px] font-bold', moscowClasses[m.key])}>{m.tag}</span>
                            </span>
                            <span className="text-[13px] font-bold tabular-nums text-muted-foreground">{m.done} / {m.total}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full" style={{ width: m.pct, background: m.bar }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                  <ChartCard title="Scope delivered vs planned">
                    <div className="mt-2.5 flex items-center gap-5">
                      <svg width="120" height="120" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                        <circle cx="21" cy="21" r="15.9" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeDasharray="75 25" transform="rotate(-90 21 21)" />
                        <text x="21" y="22" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="hsl(var(--foreground))">75%</text>
                      </svg>
                      <div className="flex flex-col gap-2">
                        <div><span className="text-[22px] font-bold">9</span><span className="text-sm text-muted-foreground"> of 12 pts delivered</span></div>
                        <div className="text-[13px] text-muted-foreground">All Musts in. Two Coulds and one Should consciously dropped to hold the date.</div>
                      </div>
                    </div>
                  </ChartCard>
                </div>

                <Debrief>The date was protected. Every <strong>Must</strong> shipped; the two Coulds and one Should were dropped as planned, exactly how a fixed-date, flex-scope timebox is meant to behave.</Debrief>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default FlowSimulatorPreview;
