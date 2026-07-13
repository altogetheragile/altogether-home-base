import type { ScrumState } from './types';
import { sprintStories, deliveredPoints, sprintGoalMet, forecastPoints } from './engine';
import { totalValue } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintReviewProps {
  state: ScrumState;
  onContinue: () => void;
}

/** Sprint Review: inspect the Increment against the forecast and the Sprint Goal.
 *  What met the Definition of Done? Forecast vs actual? */
export function SprintReview({ state, onContinue }: SprintReviewProps) {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const stories = sprintStories(state, sprint.number);
  const done = stories.filter((s) => s.status === 'done');
  const forecast = forecastPoints(state, sprint.number);
  const delivered = deliveredPoints(state, sprint.number);
  const valueDelivered = totalValue(done);
  const met = sprintGoalMet(state, sprint.number);
  const exceeded = delivered > forecast;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Sprint {sprint.number} Review</h1>

      <div className={cn(
        'rounded-lg border px-5 py-3',
        met ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
      )}>
        <div className={cn('text-[11px] font-semibold uppercase tracking-wide', met ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
          Sprint Goal {met ? '· met ✓' : '· not met'}
        </div>
        <p className="text-sm font-medium">{sprint.goal}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <div className={cn('text-2xl font-bold', exceeded && 'text-emerald-600')}>{delivered}<span className="text-sm font-normal text-muted-foreground"> / {forecast}</span></div>
          <div className="text-xs text-muted-foreground">delivered / forecast</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{done.length}</div>
          <div className="text-xs text-muted-foreground">stories reached Done</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{valueDelivered}</div>
          <div className="text-xs text-muted-foreground">value toward the Product Goal</div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">The Increment - stories that met the Definition of Done</h2>
        <div className="space-y-1.5">
          {done.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing reached Done this Sprint.</p>}
          {done.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className="text-emerald-500">✓</span>
              <span className="flex-1">{s.title}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.points} pts</span>
            </div>
          ))}
        </div>
        {exceeded && (
          <p className="text-xs text-emerald-700">
            You delivered <strong>{delivered - forecast}</strong> points beyond the forecast by pulling more work in - velocity reflects
            what the team actually finished, not just the plan.
          </p>
        )}
        {!met && (
          <p className="text-xs text-amber-700">
            Unfinished work has gone back to the Product Backlog to be re-planned - it does not count in the Increment.
          </p>
        )}
      </section>

      {/* Velocity trend */}
      <section className="space-y-1.5">
        <h2 className="text-sm font-semibold">Velocity</h2>
        <div className="flex items-end gap-2">
          {state.velocity.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 rounded-t bg-primary" style={{ height: `${Math.max(4, v * 6)}px` }} />
              <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
              <span className="text-[10px] font-mono">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Points delivered per Sprint. Your next forecast uses the average.</p>
      </section>

      <div className="flex justify-end">
        <Button size="lg" onClick={onContinue}>Continue to Retrospective</Button>
      </div>
    </div>
  );
}
