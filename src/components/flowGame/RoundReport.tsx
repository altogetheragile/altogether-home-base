import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line,
} from 'recharts';
import type { RoundState } from './types';
import { calculateMetrics } from './engine';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { STAGES, stageOf, laneOf } from './config';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLOR = '#3b82f6';

/** Human label for an in-flight item's current position. */
function positionLabel(column: RoundState['items'][number]['column']): string {
  if (column === 'backlog') return 'Backlog';
  if (column === 'done') return 'Done';
  const stage = STAGES.find((s) => s.stage === stageOf(column));
  const lane = laneOf(column) === 'done' ? 'Done' : 'Active';
  return `${stage?.label ?? ''} ${lane}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
    </div>
  );
}

export function RoundReport({ round }: { round: RoundState }) {
  // Live metrics from the days played so far (dayHistory has one entry per run day).
  const daysPlayed = round.dayHistory.length;
  const metrics = useMemo(
    () => calculateMetrics(round.dayHistory, round.items, Math.max(1, daysPlayed)),
    [round.dayHistory, round.items, daysPlayed],
  );

  // In-flight items (left backlog, not yet done), oldest first — the aging report.
  const aging = useMemo(() => {
    return round.items
      .filter((i) => i.startDay != null && i.endDay == null)
      .map((i) => ({ ...i, age: round.day - (i.startDay as number) + 1 }))
      .sort((a, b) => b.age - a.age);
  }, [round.items, round.day]);

  const currentWip = aging.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg">Reports</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Flow Report - Day {round.day}/20</SheetTitle>
          <SheetDescription>
            Live metrics for Round {round.roundNumber}, based on the {daysPlayed} day(s) played so far.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Headline stats */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Completed" value={`${metrics.totalCompleted}`} />
            <Stat label="In Flight (WIP)" value={`${currentWip}`} />
            <Stat
              label="Avg Cycle Time"
              value={metrics.totalCompleted > 0 ? `${metrics.averageCycleTime.toFixed(1)}d` : '-'}
            />
            <Stat label="Throughput" value={`${metrics.throughputRate.toFixed(2)}/day`} />
          </div>

          {/* Aging work items — the in-flight items by age */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Aging Work Items</h4>
            {aging.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing in flight right now.</p>
            ) : (
              <div className="rounded-lg border divide-y">
                {aging.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <span className="flex-1 truncate font-medium">{item.title}</span>
                    {item.blocked && (
                      <span className="text-[10px] font-semibold text-destructive uppercase">Blocked</span>
                    )}
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{positionLabel(item.column)}</span>
                    <span
                      className={cn(
                        'font-mono font-semibold w-10 text-right shrink-0',
                        item.age >= 8 ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      {item.age}d
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              Age is days since the item left the backlog. Red marks items aging past 8 days.
            </p>
          </div>

          {/* Charts */}
          {daysPlayed > 0 && (
            <>
              <div>
                <h4 className="font-semibold text-sm mb-2">Throughput (completed per day)</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={metrics.throughputPerDay.map((v, i) => ({ day: i + 1, completed: v }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="completed" fill={COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">WIP Over Time</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={metrics.wipPerDay.map((v, i) => ({ day: i + 1, wip: v }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="wip" stroke={COLOR} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {metrics.cycleTimePerItem.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Cycle Time (days per completed item)</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="completionDay" name="Completion Day" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="cycleTime" name="Cycle Time" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={metrics.cycleTimePerItem} fill={COLOR} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              <CumulativeFlowDiagram metrics={metrics} title="Cumulative Flow" />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
