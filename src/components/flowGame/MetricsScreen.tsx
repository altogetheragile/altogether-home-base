import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line,
} from 'recharts';
import type { RoundMetrics, GamePhase, Prediction } from './types';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetricsScreenProps {
  round1Metrics: RoundMetrics;
  round2Metrics: RoundMetrics | null;
  phase: GamePhase;
  prediction?: Prediction | null;
  onContinue: () => void;
  onPlayAgain: () => void;
}

const PREDICTION_LABELS: Record<Prediction, string> = {
  lower: 'Lower',
  same: 'About the same',
  higher: 'Higher',
};

/** Classify the actual Round 2 vs Round 1 cycle-time outcome (0.5d dead-band = "same"). */
function actualDirection(r1: number, r2: number): Prediction {
  const delta = r2 - r1;
  if (Math.abs(delta) <= 0.5) return 'same';
  return delta < 0 ? 'lower' : 'higher';
}

/** Reveal the player's prediction against what actually happened. */
function PredictionReveal({ prediction, r1, r2 }: { prediction: Prediction; r1: number; r2: number }) {
  const actual = actualDirection(r1, r2);
  const correct = prediction === actual;
  return (
    <div
      className={cn(
        'border rounded-lg p-4 max-w-2xl mx-auto text-center space-y-1',
        correct ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50',
      )}
    >
      <p className="font-bold">
        {correct ? 'You called it.' : 'Not quite.'}
      </p>
      <p className="text-sm">
        You predicted Round 2's cycle time would be <strong>{PREDICTION_LABELS[prediction].toLowerCase()}</strong>.
        It came out <strong>{PREDICTION_LABELS[actual].toLowerCase()}</strong> ({r1.toFixed(1)}d → {r2.toFixed(1)}d).
      </p>
    </div>
  );
}

/** Interactive Little's Law: drag WIP / throughput, watch cycle time fall out. */
function LittlesLawCalculator({ defaultWip, defaultThroughput }: { defaultWip: number; defaultThroughput: number }) {
  const [wip, setWip] = useState(Math.max(1, Math.round(defaultWip)));
  const [thr, setThr] = useState(Math.max(1, Math.round(defaultThroughput * 10)) / 10);
  const cycleTime = thr > 0 ? wip / thr : 0;
  return (
    <div className="bg-muted/50 border rounded-lg p-6 space-y-4 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold text-center">Try it yourself</h3>
      <p className="text-center text-sm text-muted-foreground">
        Drag the sliders. Cycle time is just WIP divided by throughput - lower your WIP and
        cycle time drops.
      </p>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>Average WIP</span>
            <span className="font-mono">{wip} items</span>
          </div>
          <input
            type="range" min={1} max={20} step={1} value={wip}
            onChange={(e) => setWip(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>Throughput</span>
            <span className="font-mono">{thr.toFixed(1)} items/day</span>
          </div>
          <input
            type="range" min={0.1} max={5} step={0.1} value={thr}
            onChange={(e) => setThr(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
      <div className="text-center font-mono text-sm pt-2 border-t">
        <span className="text-muted-foreground">Cycle Time = {wip} / {thr.toFixed(1)} = </span>
        <span className="text-xl font-bold text-primary">{cycleTime.toFixed(1)} days</span>
      </div>
    </div>
  );
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

export function MetricsScreen({ round1Metrics, round2Metrics, phase, prediction, onContinue, onPlayAgain }: MetricsScreenProps) {
  const [showCfd, setShowCfd] = useState(false);
  const isFinal = phase === 'metrics-final';

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 py-8">
      <h2 className="text-3xl font-bold text-center">
        {isFinal ? 'Round Comparison' : 'Round 1 Results'}
      </h2>

      {/* Predict-then-reveal (P5): how did the player's guess hold up? */}
      {isFinal && prediction && round2Metrics && (
        <PredictionReveal
          prediction={prediction}
          r1={round1Metrics.averageCycleTime}
          r2={round2Metrics.averageCycleTime}
        />
      )}

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
            ? 'Lower WIP means shorter cycle times - even if throughput stays similar, items flow through faster when you limit work in progress.'
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

      {/* Interactive Little's Law (P5) - seeded from the latest round's numbers */}
      <LittlesLawCalculator
        defaultWip={(round2Metrics ?? round1Metrics).averageWip}
        defaultThroughput={(round2Metrics ?? round1Metrics).throughputRate}
      />

      {/* Dig deeper - CFD */}
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setShowCfd(!showCfd)}
          className="text-sm text-primary hover:underline font-medium"
        >
          {showCfd ? '▾ Hide' : '▸ Dig deeper'} - Cumulative Flow Diagram
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
