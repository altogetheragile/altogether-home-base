import { useState } from 'react';
import type { ZooGameState, PbiDraft } from './types';
import { availableItems, productGoalProgress, suggestSprintGoal } from './engine';
import { zooCapacity } from './config';
import { ProductBacklogSidebar, BoardColumn, ItemCard } from './Board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Wand2, X } from 'lucide-react';

interface SprintPlanningProps {
  state: ZooGameState;
  onPlan: (ids: string[]) => void;
  onEstimate: (id: string, points: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSetSprintGoal: (goal: string) => void;
  onTakeSignal: (index: number) => void;
}

/** Sprint Planning as a board: the Product Backlog sits on the left, and the items you
 *  forecast fill the To Do column of the Sprint board (Doing / Done wait for the
 *  Sprint to start). Set the Sprint Goal and watch the forecast against capacity. */
export function SprintPlanning({ state, onPlan, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveBefore, onSetUseStories, onSetSprintGoal, onTakeSignal }: SprintPlanningProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const progress = Math.round(productGoalProgress(state) * 100);
  const noGoal = state.sprintGoal.trim().length === 0;
  const canStart = chosen.length > 0 && !noGoal;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Plan the Sprint</h2>
        <span className="text-xs text-muted-foreground">Product Goal {progress}%</span>
      </div>

      {/* Sprint Goal: the single objective for this Sprint (coached, editable). */}
      <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={chosen.length === 0} onClick={() => onSetSprintGoal(suggestSprintGoal(chosen))}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest from selection
          </Button>
        </div>
        <textarea
          value={state.sprintGoal}
          onChange={(e) => onSetSprintGoal(e.target.value)}
          rows={2}
          placeholder="One outcome for this Sprint - e.g. &ldquo;Open the Savanna so families have more to see.&rdquo; Or pick some items and let the coach suggest one."
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* The visitors' signals: candidate backlog items the Product Owner decides on. */}
      {state.signals.length > 0 && (
        <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="h-4 w-4" /> Signals from your visitors
          </div>
          <div className="space-y-1.5">
            {state.signals.map((sig, i) => (
              <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-sm dark:border-amber-900/50">
                <span className="flex-1">{sig.suggestion}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                  sig.estimatedValue === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : sig.estimatedValue === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground')}>{sig.estimatedValue}</span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onTakeSignal(i)}>Add to Backlog</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The board: Product Backlog (left) feeding the To Do column of the Sprint. */}
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <ProductBacklogSidebar state={state} mode="plan" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
          onSetUseStories={onSetUseStories} onEstimate={onEstimate} selected={selected} onToggle={toggle}
          onReorder={onReorder} onMoveBefore={onMoveBefore} />

        <div className="min-w-0 space-y-3">
          {/* Capacity for the forecast */}
          <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">Sprint forecast</span>
              <span className={cn('font-mono', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, capacity ? (committed / capacity) * 100 : 0)}%` }} />
            </div>
            {over && <p className="text-[11px] text-destructive">Over capacity of ~{capacity}. Prefer finishing fewer things to the Definition of Done over starting more and not finishing.</p>}
            <p className="text-[11px] text-muted-foreground">{state.velocity.length ? `Capacity is your average velocity over ${state.velocity.length} Sprint${state.velocity.length > 1 ? 's' : ''}.` : 'First-Sprint guess. Velocity will replace it after Sprint 1.'}</p>
          </div>

          {/* The Sprint board, forecast filling To Do */}
          <div className="grid gap-3 sm:grid-cols-3">
            <BoardColumn title="To Do" count={chosen.length} hint="Add items from the Product Backlog">
              {chosen.map((it) => (
                <ItemCard key={it.id} item={it} onClick={() => toggle(it.id)}
                  actions={<span className="flex items-center gap-1 text-[11px] text-muted-foreground"><X className="h-3.5 w-3.5" /> remove</span>} />
              ))}
            </BoardColumn>
            <BoardColumn title="Doing" count={0} hint="Starts once the Sprint begins" />
            <BoardColumn title="Done ✓" count={0} hint="Nothing built yet" tone="done" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 flex flex-col items-end gap-1">
        {!canStart && (
          <p className="text-[11px] text-muted-foreground">
            {noGoal && chosen.length === 0 ? 'Agree a Sprint Goal and forecast at least one item to start.'
              : noGoal ? 'Agree a Sprint Goal before starting - it is the objective the Sprint commits to.'
                : 'Forecast at least one Backlog item to start.'}
          </p>
        )}
        <Button size="lg" disabled={!canStart} onClick={() => onPlan([...selected])}>Start Sprint {state.sprintNumber}</Button>
      </div>
    </div>
  );
}
