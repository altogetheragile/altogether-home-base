import { useState } from 'react';
import type { ZooGameState, PbiDraft } from './types';
import { availableItems, suggestSprintGoal } from './engine';
import { zooCapacity } from './config';
import { ProductBacklogSidebar, BoardColumn, ItemCard } from './Board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Wand2, X, Check, ClipboardCheck } from 'lucide-react';

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

type Step = 'why' | 'what' | 'how';
const STEPS: { key: Step; label: string; full: string }[] = [
  { key: 'why', label: 'Why', full: 'Why is this Sprint valuable?' },
  { key: 'what', label: 'What', full: 'What can we build?' },
  { key: 'how', label: 'How', full: 'How will we get it done?' },
];

/** Sprint Planning as its three real topics, in order: Why (agree the Sprint Goal),
 *  What (forecast Backlog items into the Sprint), then How (confirm the plan - the
 *  Sprint Backlog built to the Definition of Done over the Sprint's days). The initial
 *  Product Backlog refinement is a separate step before this (the Refine phase). */
export function SprintPlanning({ state, onPlan, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveBefore, onSetUseStories, onSetSprintGoal, onTakeSignal }: SprintPlanningProps) {
  const [step, setStep] = useState<Step>('why');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const hasGoal = state.sprintGoal.trim().length > 0;
  const hasWhat = chosen.length > 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // A step is reachable when the earlier steps are satisfied.
  const reachable = (s: Step) => s === 'why' || (s === 'what' ? hasGoal : hasGoal && hasWhat);
  const goTo = (s: Step) => { if (reachable(s)) setStep(s); };

  return (
    <div className="space-y-4">
      {/* Stepper: the three topics of Sprint Planning, in order. */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.key;
          const done = (s.key === 'why' && hasGoal) || (s.key === 'what' && hasWhat);
          const can = reachable(s.key);
          return (
            <div key={s.key} className="flex items-center gap-2">
              <button type="button" disabled={!can} onClick={() => goTo(s.key)}
                className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active ? 'border-primary bg-primary/10 font-semibold text-primary' : can ? 'border-border hover:bg-muted' : 'border-border/60 text-muted-foreground/50',
                  'disabled:cursor-not-allowed')}>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                  active ? 'bg-primary text-primary-foreground' : done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                  {done && !active ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-bold">{STEPS.find((s) => s.key === step)!.full}</h2>

      {/* ---- WHY: agree the Sprint Goal ---- */}
      {step === 'why' && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-sm text-muted-foreground">
            The Sprint Goal is the single objective this Sprint commits to - the reason it is worth doing. Agree it first;
            it guides what you select next, and stays fixed even if the scope flexes.
          </p>
          <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
            <textarea
              value={state.sprintGoal}
              onChange={(e) => onSetSprintGoal(e.target.value)}
              rows={3}
              autoFocus
              placeholder="One outcome for this Sprint - e.g. &ldquo;Open the Savanna so families have more to see.&rdquo;"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">Not sure yet? Draft one now - you can refine it while choosing what to build, including a coached suggestion from your selection.</p>
          </div>
          <div className="flex justify-end">
            <Button size="lg" disabled={!hasGoal} onClick={() => setStep('what')}>Next: what to build →</Button>
          </div>
        </div>
      )}

      {/* ---- WHAT: forecast Backlog items into the Sprint ---- */}
      {step === 'what' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Forecast Ready items from the Product Backlog into the Sprint - what you believe you can build to the Definition
            of Done, guided by the Sprint Goal and your capacity. Finishing fewer things well beats starting many.
          </p>

          {state.signals.length > 0 && (
            <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/70 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300"><Lightbulb className="h-4 w-4" /> Signals from your visitors</div>
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

          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <ProductBacklogSidebar state={state} mode="plan" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
              onSetUseStories={onSetUseStories} onEstimate={onEstimate} selected={selected} onToggle={toggle}
              onReorder={onReorder} onMoveBefore={onMoveBefore} />

            <div className="min-w-0 space-y-3">
              {/* Capacity + a coached goal suggestion from the selection. */}
              <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">Sprint forecast</span>
                  <span className={cn('font-mono', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, capacity ? (committed / capacity) * 100 : 0)}%` }} />
                </div>
                {over && <p className="text-[11px] text-destructive">Over capacity of ~{capacity}. Prefer finishing fewer things to the Definition of Done over starting more.</p>}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">{state.velocity.length ? `Capacity is your average velocity over ${state.velocity.length} Sprint${state.velocity.length > 1 ? 's' : ''}.` : 'First-Sprint guess. Velocity will replace it after Sprint 1.'}</p>
                  <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" disabled={chosen.length === 0} onClick={() => onSetSprintGoal(suggestSprintGoal(chosen))} title="Draft a Sprint Goal from what you selected">
                    <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest Goal
                  </Button>
                </div>
              </div>

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

          <div className="flex justify-between">
            <Button variant="outline" size="lg" onClick={() => setStep('why')}>← Back</Button>
            <Button size="lg" disabled={!hasWhat} onClick={() => setStep('how')}>Next: plan the how →</Button>
          </div>
        </div>
      )}

      {/* ---- HOW: confirm the plan and start ---- */}
      {step === 'how' && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-sm text-muted-foreground">
            The plan for turning the forecast into a Done Increment: build each item in the Sprint Backlog to the Definition
            of Done over the Sprint&rsquo;s {state.sprintDays} days. You can adapt day by day at each Daily Scrum.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
            <p className="text-sm font-medium">{state.sprintGoal || '(not set)'}</p>
          </div>

          <section className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">Sprint Backlog <span className="font-normal text-muted-foreground">({chosen.length})</span></h3>
              <span className={cn('font-mono text-xs', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
            </div>
            <div className="space-y-1.5">
              {chosen.map((it) => <ItemCard key={it.id} item={it} />)}
            </div>
          </section>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><ClipboardCheck className="h-3.5 w-3.5" /> Definition of Done</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {state.definitionOfDone.map((d) => <span key={d} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>)}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" size="lg" onClick={() => setStep('what')}>← Back</Button>
            <Button size="lg" onClick={() => onPlan([...selected])}>Start Sprint {state.sprintNumber} →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
