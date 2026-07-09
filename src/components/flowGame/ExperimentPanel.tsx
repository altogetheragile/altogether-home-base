import { useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import { sweepWipLimit, findSweetSpot } from './experiment';

const CYCLE_COLOR = '#ef4444';
const THROUGHPUT_COLOR = '#3b82f6';

/** The WIP sweep experiment: same seeded scenario auto-played at each WIP limit,
 *  plotted so the sweet spot (lowest WIP that keeps throughput near its max) is
 *  visible as the knee where cycle time and throughput stop trading off. */
export function ExperimentPanel() {
  const { sweep, sweet } = useMemo(() => {
    const s = sweepWipLimit(1, 8);
    return { sweep: s, sweet: findSweetSpot(s) };
  }, []);

  const maxWip = sweep.length ? sweep[sweep.length - 1].wipLimit : 8;
  const sweetWip = sweet?.wipLimit ?? null;

  return (
    <div className="bg-muted/50 border rounded-lg p-6 space-y-4 max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold">Find the WIP sweet spot</h3>
        <p className="text-sm text-muted-foreground">
          The same scenario, the same luck - only the WIP limit changes. Watch cycle time and
          throughput trade off as the limit moves.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={sweep} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
          {/* Zones: too little (starved) | sweet spot | too much (just slower) */}
          {sweetWip != null && (
            <>
              <ReferenceArea x1={1} x2={sweetWip} yAxisId="cycle" fill="#f59e0b" fillOpacity={0.1}
                label={{ value: 'too little (starved)', position: 'insideBottom', fill: '#b45309', fontSize: 11 }} />
              <ReferenceArea x1={sweetWip} x2={maxWip} yAxisId="cycle" fill="#6b7280" fillOpacity={0.08}
                label={{ value: 'too much (just slower)', position: 'insideBottom', fill: '#6b7280', fontSize: 11 }} />
              <ReferenceLine
                x={sweetWip}
                yAxisId="cycle"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 4"
                label={{ value: `sweet spot: WIP ${sweetWip}`, position: 'insideTop', fill: '#059669', fontSize: 12, fontWeight: 700 }}
              />
            </>
          )}
          <XAxis dataKey="wipLimit" tick={{ fontSize: 12 }} label={{ value: 'WIP limit per stage', position: 'insideBottom', offset: -10, fontSize: 12 }} />
          <YAxis yAxisId="cycle" tick={{ fontSize: 11 }} width={38} label={{ value: 'days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <YAxis yAxisId="thr" orientation="right" tick={{ fontSize: 11 }} width={40} label={{ value: 'items/day', angle: 90, position: 'insideRight', fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [Number(value).toFixed(name.startsWith('Throughput') ? 2 : 1), name]}
            labelFormatter={(l) => `WIP limit ${l}`}
          />
          <Line yAxisId="cycle" type="monotone" dataKey="averageCycleTime" name="Cycle time (days)" stroke={CYCLE_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line yAxisId="thr" type="monotone" dataKey="throughputRate" name="Throughput (items/day)" stroke={THROUGHPUT_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {sweet && (
        <div className="text-center text-sm rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 max-w-2xl mx-auto">
          <strong>Sweet spot: WIP {sweet.wipLimit} per stage.</strong>{' '}
          It reaches the best throughput ({sweet.throughputRate.toFixed(2)} items/day) with the least
          work in progress. Below it the team starves and throughput falls; above it, cycle time
          climbs for no extra throughput.
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        This is the empirical way to set a WIP limit: drop it until throughput starts to suffer, then
        settle just above that. There is no formula - the sweet spot depends on your team and your work.
      </p>
    </div>
  );
}
