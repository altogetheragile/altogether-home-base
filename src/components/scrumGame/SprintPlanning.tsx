import { useState } from 'react';
import type { ScrumState, Story, Developer, Criterion } from './types';
import { availableStories } from './engine';
import { sprintCapacity, totalPoints, devColor, SPRINT_LENGTH_OPTIONS, isReady, REFINE_MAX } from './config';
import { DevBadge } from './DevBadge';
import { ScrumTeamEditor } from './ScrumTeamEditor';
import { ScrumDodEditor } from './ScrumDodEditor';
import { ProductGoalProgress } from './ProductGoalProgress';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';

interface SprintPlanningProps {
  state: ScrumState;
  onCommit: (goal: string, storyIds: string[], length: number) => void;
  onSetTeam: (team: Developer[]) => void;
  onSetDod: (dod: Criterion[]) => void;
  onMoveStory: (storyId: string, dir: 'up' | 'down') => void;
  onBack: () => void;
}

/** Sprint Planning: name the Sprint Goal and forecast stories from the Product
 *  Backlog into the Sprint, watching the forecast against capacity/velocity so an
 *  over-commitment is visible before you make it. */
export function SprintPlanning({ state, onCommit, onSetTeam, onSetDod, onMoveStory, onBack }: SprintPlanningProps) {
  const sprintNumber = (state.currentSprint?.number ?? state.sprints.length) + 1;
  const [goal, setGoal] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [length, setLength] = useState(state.sprintLength); // development days
  const lengthOpt = SPRINT_LENGTH_OPTIONS.find((o) => o.devDays === length);

  const available = availableStories(state);
  const chosen = available.filter((s) => selected.has(s.id));
  const remaining = available.filter((s) => !selected.has(s.id));
  const committed = totalPoints(chosen);
  const capacity = sprintCapacity(state.velocity, state.team.length, length);
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

      {/* Product Goal - a plain statement on Sprint 1, a progress bar once value
          has started to land (the Product Backlog is ordered toward this Goal). */}
      {state.velocity.length > 0 ? (
        <ProductGoalProgress state={state} />
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
          <p className="text-sm font-medium">{state.productGoal}</p>
        </div>
      )}

      {/* Scrum Team - the Developers who'll do the work, plus the Scrum Master who
          keeps their way clear. A bigger team can forecast more, but only pays off
          if there's work to swarm on. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Scrum Team</span>
            <div className="flex -space-x-1.5">
              {state.team.map((d, i) => (
                <DevBadge key={d.id} initials={d.initials} colorClass={devColor(i)} title={d.name} className="ring-2 ring-background" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{state.team.length} Developers</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Scrum Master: <span className="font-medium text-foreground">{state.scrumMaster}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Product Owner: <span className="font-medium text-foreground">{state.productOwner}</span>
          </span>
        </div>
        <ScrumTeamEditor team={state.team} onSave={onSetTeam} />
      </div>

      {/* Definition of Done - the team's quality bar for the Increment, editable.
          Acceptance at the Review checks finished work against this. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Definition of Done</span>
          <div className="flex flex-wrap gap-1.5">
            {state.definitionOfDone.map((c) => (
              <span key={c.id} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{c.label}</span>
            ))}
          </div>
        </div>
        <ScrumDodEditor dod={state.definitionOfDone} onSave={onSetDod} />
      </div>

      {/* Sprint length - a real cadence choice. Two weeks is the common default.
          The Sprint is the container: Planning, the Daily Scrums, Review and Retro
          all happen inside it, so not every working day is a development day. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">Sprint length</span>
        <div className="flex gap-1.5">
          {SPRINT_LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.devDays}
              type="button"
              onClick={() => setLength(opt.devDays)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                length === opt.devDays ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {lengthOpt && (
          <span className="text-xs text-muted-foreground">
            {lengthOpt.workingDays} working days - <span className="font-medium text-foreground">{lengthOpt.devDays} for development</span>; the events take the rest
          </span>
        )}
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
        {/* Product Backlog (available to pull in). The Product Owner orders it -
            highest value / priority first - which drives what gets planned. */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({remaining.length})</span></h2>
          <p className="text-[11px] text-muted-foreground">
            Ordered by the Product Owner ({state.productOwner}). Select from the Ready items (this is the "what" of Planning). Items over {REFINE_MAX} points aren't Ready - refine them by splitting on the board during the Sprint, not here.
          </p>
          <div className="space-y-1.5">
            {remaining.length === 0 && <p className="text-xs text-muted-foreground/60">Everything's been pulled into the Sprint.</p>}
            {remaining.map((s, idx) => (
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
                    disabled={idx === remaining.length - 1}
                    onClick={() => onMoveStory(s.id, 'down')}
                    className="flex h-4 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  {isReady(s.points) ? (
                    <Row s={s} action="add" />
                  ) : (
                    /* Not Ready: too big to commit. It gets refined (split) during the
                       Sprint on the board, not here. Shown but not selectable. */
                    <div
                      className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm text-muted-foreground/70"
                      title="Not Ready - refine it (split) on the board during the Sprint"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600/70" />
                      <span className="flex-1 truncate">{s.title}</span>
                      <span className="text-[10px] font-medium text-amber-700/80 dark:text-amber-500/80">not Ready</span>
                      <span className="shrink-0 font-mono text-xs">{s.points} pts</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
              : `No velocity yet - this is a first-Sprint guess scaled to ${state.team.length} Developers over ${length} development days. Velocity will replace it after Sprint 1.`}
          </p>
        </section>
      </div>

      {over && <LearningTip point={learningFor('over-commit')} />}

      <div className="flex justify-end">
        <Button size="lg" disabled={!canStart} onClick={() => onCommit(goal, [...selected], length)}>
          Start Sprint {sprintNumber}
        </Button>
      </div>
    </div>
  );
}
