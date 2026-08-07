import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ZooGameState } from './types';
import { sprintProgress } from './engine';
import { cn } from '@/lib/utils';

/** An at-a-glance Sprint pace chip for the board toolbar: a slim progress bar (points done of
 *  committed) with "N pts left", and - once the Sprint is under way - whether the team is on
 *  track or behind the ideal burn for today. A miniature line chart is unreadable at this size,
 *  so the full burndown lives in the Daily Scrum; this is just the pulse. */
export function BurndownChip({ state, className }: { state: ZooGameState; className?: string }) {
  const committed = state.burndown[0] ?? state.sprintForecast;
  const remaining = sprintProgress(state).remaining;
  const done = Math.max(0, committed - remaining);
  const pct = committed > 0 ? Math.round((done / committed) * 100) : 0;
  // Ideal points still to do at the start of today (days elapsed = dayNumber - 1). Only judge
  // pace once a day has passed - on day 1 nothing has burned down yet.
  const elapsed = Math.max(0, state.dayNumber - 1);
  const idealRemaining = state.sprintDays > 0 ? (committed * (state.sprintDays - elapsed)) / state.sprintDays : 0;
  const behind = elapsed > 0 && remaining > idealRemaining + 0.01;
  const onTrack = elapsed > 0 && !behind;
  const title = `Sprint pace: ${done}/${committed} pts done`
    + (elapsed > 0 ? (behind ? ' - behind the ideal burn for today' : ' - on track') : '')
    + '. Full burndown at the Daily Scrum.';
  return (
    <span title={title}
      className={cn('flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[11px] font-medium',
        behind ? 'border-amber-300 text-amber-700 dark:border-amber-700/60 dark:text-amber-300' : 'border-border text-muted-foreground', className)}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="block h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: behind ? '#f59e0b' : '#e6842a' }} />
      </span>
      <span className="tabular-nums text-foreground">{remaining}</span> pts left
      {behind && <span className="text-amber-700 dark:text-amber-300">· behind</span>}
      {onTrack && <span className="text-emerald-600 dark:text-emerald-400">· on track</span>}
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
