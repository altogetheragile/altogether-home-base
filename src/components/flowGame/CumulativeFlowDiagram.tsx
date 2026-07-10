import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RoundMetrics, StageDef } from './types';

interface CumulativeFlowDiagramProps {
  metrics: RoundMetrics;
  /** The configured stages, in pipeline order — one band each. */
  stages: StageDef[];
  title?: string;
}

// Hex equivalents of the STAGE_PALETTE tailwind classes (config.ts), so the CFD
// bands match each stage's colour on the board. The default three stages stay
// blue / emerald / amber.
const STAGE_HEX = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#84cc16', '#f97316'];

export function CumulativeFlowDiagram({ metrics, stages, title }: CumulativeFlowDiagramProps) {
  // Bottom-to-top stack: Backlog, then each stage in order, then Done. Each row
  // pulls a stage's count from its id key in the snapshot.
  const data = metrics.cfdPerDay.map((d) => {
    const row: Record<string, number> = { day: d.day, Backlog: d.backlog, Done: d.done };
    for (const s of stages) row[s.id] = d[s.id] ?? 0;
    return row;
  });

  return (
    <div className="space-y-2">
      {title && <h4 className="font-semibold text-sm">{title}</h4>}
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Items', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Area type="monotone" dataKey="Backlog" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
          {stages.map((s, i) => (
            <Area
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.name}
              stackId="1"
              stroke={STAGE_HEX[i % STAGE_HEX.length]}
              fill={STAGE_HEX[i % STAGE_HEX.length]}
            />
          ))}
          <Area type="monotone" dataKey="Done" stackId="1" stroke="#6366f1" fill="#6366f1" />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground">
        The cumulative flow diagram shows how items accumulate in each column over time.
        A widening band indicates growing WIP - items stuck in that stage.
      </p>
    </div>
  );
}
