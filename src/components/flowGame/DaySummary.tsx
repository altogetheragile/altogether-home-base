import type { DaySummaryData, WorkerDef } from './types';
import { Button } from '@/components/ui/button';

interface DaySummaryProps {
  summary: DaySummaryData;
  workers: WorkerDef[];
  isLastDay: boolean;
  onNextDay: () => void;
}

export function DaySummary({ summary, workers, isLastDay, onNextDay }: DaySummaryProps) {
  return (
    <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">Day {summary.day} Results</h3>

      {/* Roll results */}
      {summary.rolls.length > 0 && (
        <div className="space-y-1">
          {summary.rolls.map((roll, i) => {
            const worker = workers.find((w) => w.id === roll.workerId);
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

      {/* Events. Blockers are surfaced on the board at the start of each day, so
          the day-run events worth calling out are work that reached Done, work
          that finished a (non-final) stage, and cleared blockers. */}
      {summary.itemsCompleted.length > 0 && (
        <p className="text-sm font-semibold text-emerald-700">
          {summary.itemsCompleted.length} item(s) reached Done
        </p>
      )}
      {summary.advanced.length > 0 && (
        <p className="text-sm text-primary font-medium">
          {summary.advanced.length} item(s) finished a stage - pull them onward
        </p>
      )}
      {summary.blockersCleared.length > 0 && (
        <p className="text-sm text-emerald-600">
          Blockers cleared on {summary.blockersCleared.length} item(s)
        </p>
      )}

      {/* Where the work sits now, per active stage. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
        <span className="font-medium">WIP now:</span>
        <span>Analysis {summary.columnSnapshot.analysis}</span>
        <span>Development {summary.columnSnapshot.development}</span>
        <span>Test {summary.columnSnapshot.test}</span>
        <span>Done {summary.columnSnapshot.done}</span>
      </div>

      <Button onClick={onNextDay} className="w-full">
        {isLastDay ? 'See Results' : 'Next Day →'}
      </Button>
    </div>
  );
}
