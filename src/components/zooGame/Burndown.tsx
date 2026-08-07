import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ZooGameState } from './types';
import { sprintProgress } from './engine';
import { cn } from '@/lib/utils';

/** A tiny inline burndown for the board toolbar: "N pts left" plus a hand-drawn sparkline of
 *  remaining points against the ideal line. The full chart lives in the Daily Scrum - this is
 *  just an at-a-glance pulse so the board stays uncluttered. */
export function BurndownChip({ state, className }: { state: ZooGameState; className?: string }) {
  const start = state.burndown[0] ?? state.sprintForecast;
  const days = state.sprintDays;
  const remaining = sprintProgress(state).remaining;
  const w = 52, h = 16;
  const x = (i: number) => (days === 0 ? 0 : (i / days) * w);
  const y = (v: number) => h - (start === 0 ? 0 : (v / start) * h);
  const idealD = `M ${x(0)},${y(start).toFixed(1)} L ${x(days)},${y(0).toFixed(1)}`;
  const actualD = state.burndown.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <span title="Burndown - remaining points vs the ideal line (full chart at the Daily Scrum)"
      className={cn('flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground', className)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
        <path d={idealD} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
        {state.burndown.length > 1 && <path d={actualD} fill="none" stroke="#e6842a" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
        {state.burndown.length > 0 && <circle cx={x(state.burndown.length - 1)} cy={y(state.burndown[state.burndown.length - 1])} r={1.8} fill="#e6842a" />}
      </svg>
      <span className="tabular-nums text-foreground">{remaining}</span> pts left
    </span>
  );
}

/** The Sprint burndown: committed points still remaining per day (the actual line) against a
 *  straight ideal from the full commitment to zero. Makes progress toward the Sprint Goal
 *  visible - are we above or below the line? `compact` is the slim version for the board. */
export function Burndown({ state, compact = false }: { state: ZooGameState; compact?: boolean }) {
  const start = state.burndown[0] ?? state.sprintForecast;
  const days = state.sprintDays;
  const data = Array.from({ length: days + 1 }, (_, i) => ({
    day: i,
    ideal: Math.round((start * (days - i)) / days),
    remaining: i < state.burndown.length ? state.burndown[i] : null,
  }));
  const height = compact ? 130 : 190;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 10, bottom: 2, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.2)" />
        {!compact && <Legend verticalAlign="top" height={22} wrapperStyle={{ fontSize: 11 }} />}
        <XAxis dataKey="day" tick={{ fontSize: 10 }} label={compact ? undefined : { value: 'Day', position: 'insideBottom', offset: -2, fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={28} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94a3b8" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#e6842a" strokeWidth={2} connectNulls dot={{ r: 2 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
