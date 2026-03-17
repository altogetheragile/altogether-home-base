import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line,
} from 'recharts';
import type { RoundMetrics, GamePhase } from './types';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetricsScreenProps {
  round1Metrics: RoundMetrics;
  round2Metrics: RoundMetrics | null;
  phase: GamePhase;
  onContinue: () => void;
  onPlayAgain: () => void;
}

function MetricsPanel({ metrics, label, color }: { metrics: RoundMetrics; label: string; color: string }) {
  return (
    <div className="space-y-6 flex-1 min-w-[320px]">
      <h3 className="text-xl font-bold">{label}</h3>

      {/* Throughput bar chart */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Throughput (items completed per day)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={metrics.throughputPerDay.map((v, i) => ({ day: i + 1, completed: v }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="completed" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cycle time scatter */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Cycle Time (days per item)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="completionDay" name="Completion Day" tick={{ fontSize: 11 }} />
            <YAxis dataKey="cycleTime" name="Cycle Time" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={metrics.cycleTimePerItem} fill={color} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* WIP over time */}
      <div>
        <h4 className="font-semibold text-sm mb-2">WIP Over Time</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={metrics.wipPerDay.map((v, i) => ({ day: i + 1, wip: v }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="wip" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MetricsScreen({ round1Metrics, round2Metrics, phase, onContinue, onPlayAgain }: MetricsScreenProps) {
  const [showCfd, setShowCfd] = useState(false);
  const isFinal = phase === 'metrics-final';

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 py-8">
      <h2 className="text-3xl font-bold text-center">
        {isFinal ? 'Round Comparison' : 'Round 1 Results'}
      </h2>

      {/* Side-by-side panels */}
      <div className={cn('flex gap-8', isFinal ? 'flex-col lg:flex-row' : 'justify-center')}>
        <MetricsPanel metrics={round1Metrics} label="Round 1 (No WIP Limits)" color="#ef4444" />
        {round2Metrics && (
          <MetricsPanel metrics={round2Metrics} label="Round 2 (WIP Limits)" color="#3b82f6" />
        )}
      </div>

      {/* Little's Law panel */}
      <div className="bg-muted/50 border rounded-lg p-6 space-y-4 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-center">Little's Law</h3>
        <p className="text-center text-muted-foreground">
          Average Cycle Time = Average WIP / Throughput Rate
        </p>

        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <span className="font-bold text-destructive">Round 1:</span>
            <span>{round1Metrics.averageCycleTime.toFixed(1)} days</span>
            <span>=</span>
            <span>{round1Metrics.averageWip.toFixed(1)} items</span>
            <span>/</span>
            <span>{round1Metrics.throughputRate.toFixed(2)} items/day</span>
          </div>
          {round2Metrics && (
            <div className="flex items-center gap-2 justify-center flex-wrap">
              <span className="font-bold text-blue-500">Round 2:</span>
              <span>{round2Metrics.averageCycleTime.toFixed(1)} days</span>
              <span>=</span>
              <span>{round2Metrics.averageWip.toFixed(1)} items</span>
              <span>/</span>
              <span>{round2Metrics.throughputRate.toFixed(2)} items/day</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {isFinal
            ? 'Lower WIP means shorter cycle times — even if throughput stays similar, items flow through faster when you limit work in progress.'
            : 'The more items in flight at once, the longer each one takes. Can you improve this in Round 2?'}
        </p>

        {isFinal && round2Metrics && (
          <div className="text-center space-y-1 pt-2 border-t">
            <p className="text-sm">
              <strong>Items completed:</strong> Round 1: {round1Metrics.totalCompleted} → Round 2: {round2Metrics.totalCompleted}
            </p>
            <p className="text-sm">
              <strong>Avg cycle time:</strong> Round 1: {round1Metrics.averageCycleTime.toFixed(1)}d → Round 2: {round2Metrics.averageCycleTime.toFixed(1)}d
            </p>
          </div>
        )}
      </div>

      {/* Dig deeper — CFD */}
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setShowCfd(!showCfd)}
          className="text-sm text-primary hover:underline font-medium"
        >
          {showCfd ? '▾ Hide' : '▸ Dig deeper'} — Cumulative Flow Diagram
        </button>
        {showCfd && (
          <div className="mt-4 space-y-6">
            <CumulativeFlowDiagram metrics={round1Metrics} title="Round 1" />
            {round2Metrics && <CumulativeFlowDiagram metrics={round2Metrics} title="Round 2" />}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isFinal && (
          <Button size="lg" onClick={onContinue} className="text-lg px-8 py-6">
            Set WIP Limits for Round 2
          </Button>
        )}
        {isFinal && (
          <Button size="lg" onClick={onPlayAgain} className="text-lg px-8 py-6">
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
}
