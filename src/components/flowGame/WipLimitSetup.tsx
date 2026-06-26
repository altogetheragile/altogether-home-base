import { useState } from 'react';
import type { Specialism, Prediction } from './types';
import { DEFAULT_WIP_LIMITS, ACTIVE_COLUMNS } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLUMN_LABELS: Record<Specialism, string> = {
  analysis: 'Analysis',
  development: 'Development',
  test: 'Test',
};

const PREDICTIONS: { value: Prediction; label: string }[] = [
  { value: 'lower', label: 'Lower' },
  { value: 'same', label: 'About the same' },
  { value: 'higher', label: 'Higher' },
];

interface WipLimitSetupProps {
  round1CycleTime: number;
  onStart: (limits: Record<Specialism, number>) => void;
  onPredict: (prediction: Prediction) => void;
}

export function WipLimitSetup({ round1CycleTime, onStart, onPredict }: WipLimitSetupProps) {
  const [limits, setLimits] = useState<Record<Specialism, number>>({ ...DEFAULT_WIP_LIMITS });
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const updateLimit = (col: Specialism, delta: number) => {
    setLimits((prev) => ({
      ...prev,
      [col]: Math.max(1, Math.min(10, prev[col] + delta)),
    }));
  };

  const handleStart = () => {
    if (prediction) onPredict(prediction);
    onStart(limits);
  };

  return (
    <div className="max-w-lg mx-auto text-center space-y-8 py-16 px-4">
      <h2 className="text-3xl font-bold">Set WIP Limits</h2>
      <p className="text-muted-foreground">
        Based on what you saw in Round 1, what limits would help improve flow?
        Set a maximum number of items allowed in each active column.
      </p>

      <div className="space-y-4">
        {ACTIVE_COLUMNS.map((col) => (
          <div key={col} className="flex items-center justify-center gap-4">
            <span className="w-28 text-right font-medium">{COLUMN_LABELS[col]}</span>
            <button
              type="button"
              onClick={() => updateLimit(col, -1)}
              className="w-9 h-9 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            <span className="w-10 text-center text-2xl font-bold font-mono">{limits[col]}</span>
            <button
              type="button"
              onClick={() => updateLimit(col, 1)}
              className="w-9 h-9 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* Predict-then-reveal: commit to a guess before playing Round 2 */}
      <div className="border-t pt-6 space-y-3">
        <p className="font-medium">
          Make a prediction first
        </p>
        <p className="text-sm text-muted-foreground">
          In Round 1 your average cycle time was{' '}
          <strong>{round1CycleTime.toFixed(1)} days</strong>. With these WIP limits, Round 2's
          average cycle time will be:
        </p>
        <div className="flex justify-center gap-2">
          {PREDICTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPrediction(p.value)}
              className={cn(
                'px-4 py-2 rounded-md border text-sm font-medium transition-colors',
                prediction === p.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleStart}
        disabled={!prediction}
        className="text-lg px-8 py-6"
      >
        Start Round 2
      </Button>
      {!prediction && (
        <p className="text-xs text-muted-foreground -mt-4">Pick a prediction to continue</p>
      )}
    </div>
  );
}
