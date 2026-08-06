import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ZooGameState } from './types';

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
