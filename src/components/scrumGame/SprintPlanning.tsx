import { useState } from 'react';
import type { ScrumState, Story } from './types';
import { availableStories } from './engine';
import { sprintCapacity, totalPoints } from './config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface SprintPlanningProps {
  state: ScrumState;
  onCommit: (goal: string, storyIds: string[]) => void;
  onBack: () => void;
}

/** Sprint Planning: name the Sprint Goal and forecast stories from the Product
 *  Backlog into the Sprint, watching the forecast against capacity/velocity so an
 *  over-commitment is visible before you make it. */
export function SprintPlanning({ state, onCommit, onBack }: SprintPlanningProps) {
  const sprintNumber = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const [goal, setGoal] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = availableStories(state);
  const chosen = available.filter((s) => selected.has(s.id));
  const remaining = available.filter((s) => !selected.has(s.id));
  const committed = totalPoints(chosen);
  const capacity = sprintCapacity(state.velocity);
  const over = committed > capacity;
  const canStart = goal.trim().length > 0 && chosen.length > 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const Row = ({ s, action }: { s: Story; action: 'add' | 'remove' }) => (
    <button
      type="button"
      onClick={() => toggle(s.id)}
      className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-sm hover:bg-muted"
    >
      {action === 'add' ? <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <X className="h-3.5 w-3.5 shrink-0 text-destructive" />}
      <span className="flex-1 truncate">{s.title}</span>
      <span className="shrink-0 font-mono text-xs">{s.points} pts</span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">v{s.value}</span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sprint {sprintNumber} Planning</h1>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
        <p className="text-sm font-medium">{state.productGoal}</p>
      </div>

      {/* Sprint Goal */}
      <div className="space-y-1.5">
        <label htmlFor="sprint-goal" className="text-sm font-semibold">Sprint Goal</label>
        <Input
          id="sprint-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="One outcome this Sprint is aiming for, e.g. 'A customer can book and pay for a slot'"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Backlog (available to pull in) */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({remaining.length})</span></h2>
          <div className="space-y-1.5">
            {remaining.length === 0 && <p className="text-xs text-muted-foreground/60">Everything's been pulled into the Sprint.</p>}
            {remaining.map((s) => <Row key={s.id} s={s} action="add" />)}
          </div>
        </section>

        {/* Sprint Backlog (the forecast) */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Sprint Backlog <span className="font-normal text-muted-foreground">({chosen.length})</span></h2>
            <span className={cn('text-xs font-mono', over ? 'text-destructive' : 'text-muted-foreground')}>
              {committed} / {capacity} pts
            </span>
          </div>
          {/* Capacity bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${Math.min(100, capacity ? (committed / capacity) * 100 : 0)}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {chosen.length === 0 && <p className="text-xs text-muted-foreground/60">Add stories from the Product Backlog.</p>}
            {chosen.map((s) => <Row key={s.id} s={s} action="remove" />)}
          </div>
          {over && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              You're forecasting <strong>{committed} pts</strong> against a capacity of ~{capacity}. Teams that
              over-commit tend to miss the Sprint Goal and carry unfinished work.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {state.velocity.length
              ? `Capacity is your average velocity over ${state.velocity.length} sprint${state.velocity.length > 1 ? 's' : ''}.`
              : 'No velocity yet - this is a first-Sprint capacity guess. Velocity will replace it after Sprint 1.'}
          </p>
        </section>
      </div>

      <div className="flex justify-end">
        <Button size="lg" disabled={!canStart} onClick={() => onCommit(goal, [...selected])}>
          Start Sprint {sprintNumber}
        </Button>
      </div>
    </div>
  );
}
