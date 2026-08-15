import type { ScrumState } from './types';
import { availableStories } from './engine';
import { isSplittable, REFINE_MAX, storyReady, SPRINT_LENGTH_OPTIONS } from './config';
import { ProductGoalProgress } from './ProductGoalProgress';
import { PlanningPoker } from './PlanningPoker';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { FloatingBar } from './FloatingBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Scissors, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RefinementScreenProps {
  state: ScrumState;
  onMoveStory: (storyId: string, dir: 'up' | 'down') => void;
  onSplitStory: (storyId: string) => void;
  onEstimate: (storyId: string, points: number) => void;
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
  /** Back to the intro (only offered before the first Sprint). */
  onBack?: () => void;
  /** Agreed here, before the first Sprint. After that only a Retrospective changes it. */
  onSetSprintLength?: (devDays: number) => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. A
 *  team needs a Backlog, however rough, to start running Sprints, so they ready it
 *  just enough to start: order it and split the too-big items until enough are Ready
 *  to plan Sprint 1. From then on refinement is not a separate step - it is ongoing,
 *  done DURING each Sprint on the board (as much as each Sprint needs), which is
 *  where it costs the running Sprint a little capacity. */
export function RefinementScreen({ state, onSetSprintLength, onMoveStory, onSplitStory, onEstimate, onPlan, onBack }: RefinementScreenProps) {
  const sprintNumber = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const items = availableStories(state);
  const ready = items.filter(storyReady);
  const unsized = items.filter((s) => !s.estimated).length;
  const canPlan = ready.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Refine the Product Backlog</h1>
          <p className="text-sm text-muted-foreground">
            You need a Backlog to start. Ready it <strong>just enough</strong> to begin Sprint {sprintNumber}:
            order it, <strong>estimate</strong> the un-sized items, and split the biggest until a few are
            <strong> Ready</strong> to pull in. From here on you'll keep refining <strong>during</strong> each
            Sprint, on the board - as much as each one needs.
          </p>
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>Back</Button>}
      </div>

      {/* The cadence, agreed once before the first Sprint. It is fixed after that, and only a
          Retrospective changes it - never Sprint Planning. See docs/SCRUM_MODEL.md. */}
      {onSetSprintLength && state.sprints.length === 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-semibold">Sprint length</span>
          <div className="flex gap-1.5">
            {SPRINT_LENGTH_OPTIONS.map((opt) => (
              <button key={opt.devDays} type="button" onClick={() => onSetSprintLength(opt.devDays)}
                className={cn('rounded-md border px-3 py-1.5 text-sm transition-colors',
                  state.sprintLength === opt.devDays ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted')}>
                {opt.label}
              </button>
            ))}
          </div>
          <span className="max-w-md text-xs text-muted-foreground">
            Agree it once and keep it - the regular cadence is the point. Shorter gives faster feedback,
            longer more development time. You can only change it at a Retrospective.
          </span>
        </div>
      )}

      {state.velocity.length > 0 ? (
        <ProductGoalProgress state={state} />
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
          <p className="text-sm font-medium">{state.productGoal}</p>
        </div>
      )}

      <LearningTip point={learningFor(unsized > 0 ? 'estimation' : 'refinement')} />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span>
          </h2>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {unsized > 0 && <span className="text-sky-700 dark:text-sky-400">{unsized} to estimate</span>}
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {ready.length} Ready to plan
            </span>
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ordered by the Product Owner ({state.productOwner}). Un-sized items need estimating first (the
          Developers size them). Items over {REFINE_MAX} points aren't Ready - split them to refine.
          Refining now, before the Sprint starts, is free; once a Sprint is running, refining on the board
          takes some of the team's time.
        </p>

        <div className="space-y-1.5">
          {items.length === 0 && <p className="text-xs text-muted-foreground/60">The Backlog is empty.</p>}
          {items.map((s, idx) => (
            <div key={s.id} className="flex items-stretch gap-1">
              <div className="flex flex-col justify-center">
                <button
                  type="button"
                  aria-label={`Move ${s.title} up`}
                  disabled={idx === 0}
                  onClick={() => onMoveStory(s.id, 'up')}
                  className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${s.title} down`}
                  disabled={idx === items.length - 1}
                  onClick={() => onMoveStory(s.id, 'down')}
                  className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1">
                {!s.estimated ? (
                  <PlanningPoker state={state} story={s} onEstimate={onEstimate} />
                ) : storyReady(s) ? (
                  <div className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="shrink-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">Ready</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.points} pts</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">v{s.value}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSplitStory(s.id)}
                    disabled={!isSplittable(s.points)}
                    title="Too big to be Ready - split it to refine"
                    className="flex w-full items-center gap-2 rounded-md border border-dashed border-amber-300 bg-amber-50/60 px-2.5 py-1.5 text-left text-sm hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800/50 dark:bg-amber-950/20"
                  >
                    <Scissors className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                    <span className="flex-1 truncate text-muted-foreground">{s.title}</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" /> split</span>
                    <span className="shrink-0 font-mono text-xs">{s.points} pts</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FloatingBar>
        {!canPlan && <span className="hidden text-[11px] text-muted-foreground sm:inline">Estimate (and split) an item until at least one is Ready</span>}
        <Button size="sm" disabled={!canPlan} onClick={onPlan}>
          Plan Sprint {sprintNumber}
        </Button>
      </FloatingBar>
    </div>
  );
}
