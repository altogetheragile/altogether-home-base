import type { ScrumState } from './types';
import {
  sprintStories, deliveredPoints, acceptedPoints, sprintGoalMet, forecastPoints, acceptedStories,
} from './engine';
import { totalValue } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Undo2, ClipboardCheck } from 'lucide-react';

interface SprintReviewProps {
  state: ScrumState;
  onAccept: (storyId: string) => void;
  onReject: (storyId: string) => void;
  onFinish: () => void;
}

/** Sprint Review: the Product Owner inspects the finished work and accepts it
 *  against the Definition of Done. Only accepted work is in the Increment and
 *  counts toward velocity and the Product Goal; the rest goes back for rework. */
export function SprintReview({ state, onAccept, onReject, onFinish }: SprintReviewProps) {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const done = sprintStories(state, sprint.number).filter((s) => s.status === 'done');
  const pending = done.filter((s) => !s.accepted);
  const accepted = acceptedStories(state, sprint.number);
  const forecast = forecastPoints(state, sprint.number);
  const acceptedPts = acceptedPoints(state, sprint.number);
  const deliveredPts = deliveredPoints(state, sprint.number);
  const valueAccepted = totalValue(accepted);
  const met = sprintGoalMet(state, sprint.number);
  const exceeded = acceptedPts > forecast;

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

      {/* Product Owner acceptance against the Definition of Done. */}
      <section className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">{state.productOwner} accepts against the Definition of Done</h2>
          </div>
          {pending.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => pending.forEach((s) => onAccept(s.id))}>
              Accept all
            </Button>
          )}
        </div>

        <ul className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          {state.definitionOfDone.map((c) => (
            <li key={c.id} className="rounded-full border border-border bg-background px-2 py-0.5">{c.label}</li>
          ))}
        </ul>

        <div className="space-y-1.5">
          {done.length === 0 && <p className="text-xs text-muted-foreground/60">Nothing reached Done this Sprint - nothing to accept.</p>}
          {done.map((s) => (
            <div key={s.id} className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
              s.accepted ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border bg-card',
            )}>
              <span className="flex-1">{s.title}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.points} pts</span>
              {s.accepted ? (
                <>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Accepted</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onReject(s.id)} title="Send back for rework">
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onAccept(s.id)}>Accept</Button>
                  <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => onReject(s.id)}>Send back</Button>
                </>
              )}
            </div>
          ))}
        </div>
        {pending.length > 0 && (
          <p className="text-xs text-amber-700">
            {pending.length} finished {pending.length > 1 ? 'stories are' : 'story is'} still waiting on acceptance. Anything not accepted goes back to the Product Backlog for rework and does not count toward velocity.
          </p>
        )}
      </section>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border p-3">
          <div className={cn('text-2xl font-bold', exceeded && 'text-emerald-600')}>{acceptedPts}<span className="text-sm font-normal text-muted-foreground"> / {forecast}</span></div>
          <div className="text-xs text-muted-foreground">accepted / forecast</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{accepted.length}<span className="text-sm font-normal text-muted-foreground"> / {done.length}</span></div>
          <div className="text-xs text-muted-foreground">accepted / finished</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-2xl font-bold">{valueAccepted}</div>
          <div className="text-xs text-muted-foreground">value toward the Product Goal</div>
        </div>
      </div>

      {exceeded && (
        <p className="text-xs text-emerald-700">
          The team delivered <strong>{acceptedPts - forecast}</strong> accepted points beyond the forecast - velocity reflects what was actually accepted, not just the plan.
        </p>
      )}

      {/* Velocity trend - past Sprints plus a preview of this one's accepted points. */}
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
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 rounded-t bg-primary/40" style={{ height: `${Math.max(4, acceptedPts * 4)}px` }} />
            <span className="text-[10px] text-muted-foreground">S{state.velocity.length + 1}</span>
            <span className="text-[10px] font-mono">{acceptedPts}</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Points accepted per Sprint. This Sprint (faded) is recorded when you continue. Your next forecast uses the average.</p>
      </section>

      <div className="flex items-center justify-end gap-3">
        {deliveredPts > acceptedPts && (
          <span className="text-xs text-muted-foreground">{deliveredPts - acceptedPts} finished pts will go back for rework</span>
        )}
        <Button size="lg" onClick={onFinish}>Continue to Retrospective</Button>
      </div>
    </div>
  );
}
