import { useState } from 'react';
import type { Specialism } from './types';
import { DEFAULT_WIP_LIMITS, ACTIVE_COLUMNS } from './config';
import { Button } from '@/components/ui/button';

const COLUMN_LABELS: Record<Specialism, string> = {
  analysis: 'Analysis',
  development: 'Development',
  test: 'Test',
};

interface WipLimitSetupProps {
  onStart: (limits: Record<Specialism, number>) => void;
}

export function WipLimitSetup({ onStart }: WipLimitSetupProps) {
  const [limits, setLimits] = useState<Record<Specialism, number>>({ ...DEFAULT_WIP_LIMITS });

  const updateLimit = (col: Specialism, delta: number) => {
    setLimits((prev) => ({
      ...prev,
      [col]: Math.max(1, Math.min(10, prev[col] + delta)),
    }));
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

      <Button size="lg" onClick={() => onStart(limits)} className="text-lg px-8 py-6">
        Start Round 2
      </Button>
    </div>
  );
}
