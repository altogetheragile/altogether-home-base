import type { ScrumState } from './types';
import { productGoalTotalValue, productGoalDeliveredValue, productGoalProgress } from './engine';
import { averageVelocity } from './config';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw } from 'lucide-react';

interface ScrumFinalProps {
  state: ScrumState;
  onReset: () => void;
}

/** Wrap-up: the Product Owner has declared the Product Goal achieved. A look back
 *  across the Sprints - value delivered, how many Sprints it took, and the velocity
 *  the team settled into. */
export function ScrumFinal({ state, onReset }: ScrumFinalProps) {
  const total = productGoalTotalValue(state);
  const delivered = productGoalDeliveredValue(state);
  const pct = Math.round(productGoalProgress(state) * 100);
  const sprintsRun = state.sprints.length;
  const avgVel = averageVelocity(state.velocity);
  const storiesDone = state.productBacklog.filter((s) => s.status === 'done').length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Product Goal achieved</h1>
        <p className="max-w-md text-sm text-muted-foreground">{state.productGoal}</p>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">Value delivered</span>
          <span className="font-mono text-muted-foreground">{delivered} / {total} · {pct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{sprintsRun}</div>
          <div className="text-xs text-muted-foreground">Sprints</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{storiesDone}</div>
          <div className="text-xs text-muted-foreground">stories accepted</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{avgVel}</div>
          <div className="text-xs text-muted-foreground">avg velocity</div>
        </div>
      </div>

      {/* Velocity trend across the whole game. */}
      {state.velocity.length > 0 && (
        <div className="space-y-1.5 text-left">
          <h2 className="text-sm font-semibold">Velocity across the Sprints</h2>
          <div className="flex items-end gap-2">
            {state.velocity.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-8 rounded-t bg-primary" style={{ height: `${Math.max(4, v * 4)}px` }} />
                <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
                <span className="text-[10px] font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.improvements.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-left">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What the team improved</div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {state.improvements.map((imp, i) => <li key={i}>· {imp}</li>)}
          </ul>
        </div>
      )}

      <Button size="lg" onClick={onReset}>
        <RotateCcw className="mr-1.5 h-4 w-4" /> Play again
      </Button>
    </div>
  );
}
