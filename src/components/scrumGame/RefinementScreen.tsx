import type { ScrumState } from './types';
import { availableStories } from './engine';
import { isReady, isSplittable, REFINE_MAX } from './config';
import { ProductGoalProgress } from './ProductGoalProgress';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { FloatingBar } from './FloatingBar';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Scissors, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RefinementScreenProps {
  state: ScrumState;
  onMoveStory: (storyId: string, dir: 'up' | 'down') => void;
  onSplitStory: (storyId: string) => void;
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
  /** Back to the intro (only offered before the first Sprint). */
  onBack?: () => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. A
 *  team needs a Backlog, however rough, to start running Sprints, so they ready it
 *  just enough to start: order it and split the too-big items until enough are Ready
 *  to plan Sprint 1. From then on refinement is not a separate step - it is ongoing,
 *  done DURING each Sprint on the board (as much as each Sprint needs), which is
 *  where it costs the running Sprint a little capacity. */
export function RefinementScreen({ state, onMoveStory, onSplitStory, onPlan, onBack }: RefinementScreenProps) {
  const sprintNumber = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const items = availableStories(state);
  const ready = items.filter((s) => isReady(s.points));
  const canPlan = ready.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Refine the Product Backlog</h1>
          <p className="text-sm text-muted-foreground">
            You need a Backlog to start. Ready it <strong>just enough</strong> to begin Sprint {sprintNumber}:
            order it, and split the biggest items until a few are <strong>Ready</strong> to pull in. From here
            on you'll keep refining <strong>during</strong> each Sprint, on the board - as much as each one needs.
          </p>
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>Back</Button>}
      </div>

      {state.velocity.length > 0 ? (
        <ProductGoalProgress state={state} />
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
          <p className="text-sm font-medium">{state.productGoal}</p>
        </div>
      )}

      <LearningTip point={learningFor('refinement')} />

      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Product Backlog <span className="font-normal text-muted-foreground">({items.length})</span>
          </h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {ready.length} Ready to plan
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ordered by the Product Owner ({state.productOwner}). Items over {REFINE_MAX} points aren't Ready -
          split them here to refine. Refining now, before the Sprint starts, is free; once a Sprint is
          running, refining on the board takes some of the team's time.
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
                {isReady(s.points) ? (
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
        {!canPlan && <span className="hidden text-[11px] text-muted-foreground sm:inline">Split an item until at least one is Ready</span>}
        <Button size="sm" disabled={!canPlan} onClick={onPlan}>
          Plan Sprint {sprintNumber}
        </Button>
      </FloatingBar>
    </div>
  );
}
