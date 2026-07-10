import { useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from 'recharts';
import { sweepTeamSize, findTeamSweetSpot } from './experiment';

const CYCLE_COLOR = '#ef4444';
const THROUGHPUT_COLOR = '#3b82f6';

/** The team-size sweep: the same seeded scenario auto-played with more and more
 *  people at a fixed WIP limit, so the diminishing return on head count is
 *  visible as the point where throughput stops rising however many you add. */
export function TeamSizePanel() {
  const { sweep, sweet } = useMemo(() => {
    const s = sweepTeamSize(1, 9);
    return { sweep: s, sweet: findTeamSweetSpot(s) };
  }, []);

  const maxTeam = sweep.length ? sweep[sweep.length - 1].teamSize : 9;
  const sweetTeam = sweet?.teamSize ?? null;

  return (
    <div className="bg-muted/50 border rounded-lg p-6 space-y-4 max-w-3xl mx-auto">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold">How big a team do you need?</h3>
        <p className="text-sm text-muted-foreground">
          The same scenario, the same luck, the same WIP limit - only the number of people changes.
          Watch throughput flatten once the board can't absorb any more hands.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={sweep} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12 }} />
          {/* Zones: understaffed | enough | more people, no more flow */}
          {sweetTeam != null && (
            <>
              <ReferenceArea x1={1} x2={sweetTeam} yAxisId="cycle" fill="#f59e0b" fillOpacity={0.1}
                label={{ value: 'understaffed', position: 'insideBottom', fill: '#b45309', fontSize: 11 }} />
              <ReferenceArea x1={sweetTeam} x2={maxTeam} yAxisId="cycle" fill="#6b7280" fillOpacity={0.08}
                label={{ value: 'more people, no more flow', position: 'insideBottom', fill: '#6b7280', fontSize: 11 }} />
              <ReferenceLine
                x={sweetTeam}
                yAxisId="cycle"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 4"
                label={{ value: `enough: ${sweetTeam} people`, position: 'insideTop', fill: '#059669', fontSize: 12, fontWeight: 700 }}
              />
            </>
          )}
          <XAxis dataKey="teamSize" tick={{ fontSize: 12 }} label={{ value: 'team size', position: 'insideBottom', offset: -10, fontSize: 12 }} />
          <YAxis yAxisId="cycle" tick={{ fontSize: 11 }} width={38} label={{ value: 'days', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <YAxis yAxisId="thr" orientation="right" tick={{ fontSize: 11 }} width={40} label={{ value: 'items/day', angle: 90, position: 'insideRight', fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [Number(value).toFixed(name.startsWith('Throughput') ? 2 : 1), name]}
            labelFormatter={(l) => `${l} people`}
          />
          <Line yAxisId="cycle" type="monotone" dataKey="averageCycleTime" name="Cycle time (days)" stroke={CYCLE_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line yAxisId="thr" type="monotone" dataKey="throughputRate" name="Throughput (items/day)" stroke={THROUGHPUT_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {sweet && (
        <div className="text-center text-sm rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 max-w-2xl mx-auto">
          <strong>{sweet.teamSize} people is enough here.</strong>{' '}
          They reach the best throughput ({sweet.throughputRate.toFixed(2)} items/day) this board can sustain.
          Adding more can't push work through any faster - the flow, not the head count, is the limit.
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        More people only help until a stage becomes the constraint. Past that, extra hands sit idle or
        pile on work in progress - the reason a bigger team so often does not mean more done.
      </p>
    </div>
  );
}
