import type { ScrumState } from './types';
import {
  incrementStories, deliveredPoints, sprintGoalMet, forecastPoints, productGoalReachable, availableStories,
} from './engine';
import { totalValue } from './config';
import { ProductGoalProgress } from './ProductGoalProgress';
import { SprintScorecard } from './SprintScorecard';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Trophy } from 'lucide-react';

interface SprintReviewProps {
  state: ScrumState;
  onContinue: () => void;
  onEnd: () => void;
}

/** Sprint Review: the Scrum Team and stakeholders inspect the Increment - which
 *  already meets the Definition of Done - and the progress toward the Product Goal,
 *  then decide what's next by adapting the Product Backlog. It is a working session
 *  about the product, not a sign-off gate. */
export function SprintReview({ state, onContinue, onEnd }: SprintReviewProps) {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const increment = incrementStories(state, sprint.number);
  const forecast = forecastPoints(state, sprint.number);
  const delivered = deliveredPoints(state, sprint.number);
  const valueDelivered = totalValue(increment);
  const met = sprintGoalMet(state, sprint.number);
  const exceeded = delivered > forecast;
  const canEnd = productGoalReachable(state);
  const backlogEmpty = availableStories(state).length === 0 && state.productBacklog.every((s) => s.status === 'done');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Sprint {sprint.number} Review</h1>
      <p className="-mt-3 text-sm text-muted-foreground">
        {state.productOwner} and stakeholders inspect the Increment and progress toward the Product Goal.
      </p>

      <div className={cn(
        'rounded-lg border px-5 py-3',
        met ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
      )}>
        <div className={cn('text-[11px] font-semibold uppercase tracking-wide', met ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
          Sprint Goal {met ? '· met ✓' : '· not met'}
        </div>
        <p className="text-sm font-medium">{sprint.goal}</p>
      </div>

      {/* The product perspective: progress toward the Product Goal. */}
      <ProductGoalProgress state={state} />

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <div className={cn('text-2xl font-bold', exceeded && 'text-emerald-600')}>{delivered}<span className="text-sm font-normal text-muted-foreground"> / {forecast}</span></div>
          <div className="text-xs text-muted-foreground">delivered / forecast</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{increment.length}</div>
          <div className="text-xs text-muted-foreground">stories in the Increment</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{valueDelivered}</div>
          <div className="text-xs text-muted-foreground">value toward the Product Goal</div>
        </div>
      </div>

      {/* The Increment - Done work, which already meets the Definition of Done. */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">The Increment <span className="font-normal text-muted-foreground">- meets the Definition of Done</span></h2>
        <div className="space-y-1.5">
          {increment.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing reached Done this Sprint.</p>}
          {increment.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="flex-1">{s.title}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.points} pts</span>
            </div>
          ))}
        </div>
        {exceeded && (
          <p className="text-xs text-emerald-700">
            The team delivered <strong>{delivered - forecast}</strong> points beyond the forecast by pulling more work in - velocity reflects what was actually finished.
          </p>
        )}
        {!met && (
          <p className="text-xs text-amber-700">
            Unfinished work has gone back to the Product Backlog to be re-planned - it is not part of the Increment.
          </p>
        )}
      </section>

      {/* Velocity trend across Sprints (this Sprint is recorded). */}
      <section className="space-y-1.5">
        <h2 className="text-sm font-semibold">Velocity</h2>
        <div className="flex items-end gap-2">
          {state.velocity.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 rounded-t bg-primary" style={{ height: `${Math.max(4, v * 4)}px` }} />
              <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
              <span className="text-[10px] font-mono">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Points delivered per Sprint. Your next forecast uses the average.</p>
      </section>

      <LearningTip point={learningFor(met ? 'review' : 'goal-missed')} />

      <SprintScorecard state={state} sprintNumber={sprint.number} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        {canEnd && (
          <Button variant="outline" size="lg" onClick={onEnd}>
            <Trophy className="mr-1.5 h-4 w-4" />
            {backlogEmpty ? 'Product Goal complete - wrap up' : 'Product Goal achieved - wrap up'}
          </Button>
        )}
        <Button size="lg" onClick={onContinue}>Continue to Retrospective</Button>
      </div>
    </div>
  );
}
