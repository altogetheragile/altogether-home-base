import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RoundMetrics } from './types';

interface CumulativeFlowDiagramProps {
  metrics: RoundMetrics;
  title?: string;
}

export function CumulativeFlowDiagram({ metrics, title }: CumulativeFlowDiagramProps) {
  const data = metrics.cfdPerDay.map((d) => ({
    day: d.day,
    Done: d.done,
    Test: d.test,
    Development: d.development,
    Analysis: d.analysis,
    Backlog: d.backlog,
  }));

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
          <Area type="monotone" dataKey="Analysis" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
          <Area type="monotone" dataKey="Development" stackId="1" stroke="#10b981" fill="#10b981" />
          <Area type="monotone" dataKey="Test" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
          <Area type="monotone" dataKey="Done" stackId="1" stroke="#6366f1" fill="#6366f1" />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground">
        The cumulative flow diagram shows how items accumulate in each column over time.
        A widening band indicates growing WIP — items stuck in that stage.
      </p>
    </div>
  );
}
