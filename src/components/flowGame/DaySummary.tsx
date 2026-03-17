import type { DaySummaryData } from './types';
import { WORKERS } from './config';
import { Button } from '@/components/ui/button';

interface DaySummaryProps {
  summary: DaySummaryData;
  isLastDay: boolean;
  onNextDay: () => void;
}

export function DaySummary({ summary, isLastDay, onNextDay }: DaySummaryProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Day {summary.day} Results</h3>

      {/* Roll results */}
      {summary.rolls.length > 0 && (
        <div className="space-y-1">
          {summary.rolls.map((roll, i) => {
            const worker = WORKERS.find((w) => w.id === roll.workerId);
            return (
              <div key={i} className="text-sm flex items-center gap-2">
                <span className="font-medium w-16">{worker?.name}</span>
                <span className="text-muted-foreground">
                  rolled {roll.roll}
                  {!roll.isSpecialist && ' (off-spec)'}
                </span>
                <span className="font-mono text-primary">→ {roll.effectiveWork} work</span>
              </div>
            );
          })}
        </div>
      )}

      {summary.rolls.length === 0 && (
        <p className="text-sm text-muted-foreground">No workers were assigned this day.</p>
      )}

      {/* Events */}
      {summary.blockersApplied.length > 0 && (
        <p className="text-sm text-destructive">
          Blockers appeared on {summary.blockersApplied.length} item(s)
        </p>
      )}
      {summary.blockersCleared.length > 0 && (
        <p className="text-sm text-emerald-600">
          Blockers cleared on {summary.blockersCleared.length} item(s)
        </p>
      )}
      {summary.itemsCompleted.length > 0 && (
        <p className="text-sm text-primary font-medium">
          {summary.itemsCompleted.length} item(s) completed!
        </p>
      )}

      <Button onClick={onNextDay} className="w-full">
        {isLastDay ? 'See Results' : 'Next Day →'}
      </Button>
    </div>
  );
}
