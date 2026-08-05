import { useState } from 'react';
import type { ZooGameState, PbiDraft, SprintTask } from './types';
import { availableItems, suggestSprintGoal, suggestTasks } from './engine';
import { zooCapacity, SPRINT_LENGTH_OPTIONS } from './config';
import { ProductBacklogSidebar, BoardColumn, ItemCard, TaskEditor } from './Board';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Wand2, X, Check, ClipboardCheck } from 'lucide-react';

interface SprintPlanningProps {
  state: ZooGameState;
  onPlan: (ids: string[]) => void;
  onEstimate: (id: string, points: number) => void;
  onSetTasks: (id: string, tasks: SprintTask[]) => void;
  onToggleGoalCritical: (id: string) => void;
  onSetSprintDays: (days: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSetSprintGoal: (goal: string) => void;
  onTakeSignal: (index: number) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
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
export function SprintPlanning({ state, onPlan, onEstimate, onSetTasks, onToggleGoalCritical, onSetSprintDays, onAddPbi, onRefinePbi, onReorder, onMoveBefore, onSetUseStories, onSetSprintGoal, onTakeSignal, onSplitEpic }: SprintPlanningProps) {
  const [step, setStep] = useState<Step>('why');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const hasGoal = state.sprintGoal.trim().length > 0;
  const hasWhat = chosen.length > 0;
  const totalTasks = chosen.reduce((s, i) => s + (i.tasks?.filter((t) => t.label.trim()).length ?? 0), 0);
  const essentials = chosen.filter((i) => i.goalCritical).length;

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
        </div>
      )}

      {/* ---- WHAT: forecast Backlog items into the Sprint ---- */}
      {step === 'what' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Forecast Ready items from the Product Backlog into the Sprint - what you believe you can build to the Definition
            of Done, guided by the Sprint Goal and your capacity. Finishing fewer things well beats starting many.
          </p>

          {/* The Sprint Goal you agreed in Why - shown here to guide selection, and editable so
              you can refine it as the forecast takes shape (or draft one from your selection). */}
          <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
            <textarea
              value={state.sprintGoal}
              onChange={(e) => onSetSprintGoal(e.target.value)}
              rows={2}
              placeholder="One outcome for this Sprint - refine it as you choose what to build."
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

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
              onReorder={onReorder} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} />

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
                {over && <CoachTip>You&rsquo;re forecasting <strong>{committed} pts</strong> against a capacity of ~{capacity}. Over-committing tends to miss the Sprint Goal and carry unfinished work - forecast what you can finish to Done, not the most you could start.</CoachTip>}
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

        </div>
      )}

      {/* ---- HOW: decompose each item into a plan of tasks, then start ---- */}
      {step === 'how' && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-sm text-muted-foreground">
            Plan <em>how</em> the work gets done: break each item in the Sprint Backlog into the tasks that build it to the
            Definition of Done. This is the Developers&rsquo; plan - suggest a breakdown or write your own, and adapt it day
            by day. The Definition of Done still decides when an item is truly Done.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
            <p className="text-sm font-medium">{state.sprintGoal || '(not set)'}</p>
          </div>

          {/* Sprint length: a real cadence choice - shorter gives faster feedback but more
              event overhead per build day; longer gives more build time but slower feedback. */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint length</span>
            <div className="flex gap-1.5">
              {SPRINT_LENGTH_OPTIONS.map((d) => (
                <button key={d} type="button" onClick={() => onSetSprintDays(d)}
                  className={cn('rounded-md border px-3 py-1 text-sm transition-colors', state.sprintDays === d ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted')}>{d} days</button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">Shorter = faster feedback; longer = more build time. A short, regular cadence is usually best.</span>
          </div>

          {/* Mark which items the Goal depends on. The Goal is an outcome: deliver the
              essentials and it is met, even if you drop the rest. */}
          <p className="rounded-lg border border-amber-300/70 bg-amber-50/60 px-4 py-2 text-[11px] text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-200">
            Star the items the <strong>Sprint Goal</strong> truly depends on. The Goal is an outcome, not a to-do list -
            deliver the {essentials} essential{essentials === 1 ? '' : 's'} and it is met, even if you drop the rest.
            {essentials === 0 && ' (None starred yet - the Goal will then need every item.)'}
          </p>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Sprint Backlog <span className="font-normal text-muted-foreground">({chosen.length})</span> <span className="font-normal text-muted-foreground">· {totalTasks} task{totalTasks === 1 ? '' : 's'}</span></h3>
              <div className="flex items-center gap-2">
                <span className={cn('font-mono text-xs', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => chosen.forEach((it) => { if (!(it.tasks ?? []).length) onSetTasks(it.id, suggestTasks(it)); })}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" /> Break all down
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {chosen.map((it) => <TaskEditor key={it.id} item={it} onSetTasks={onSetTasks} onToggleGoalCritical={onToggleGoalCritical} />)}
            </div>
          </section>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><ClipboardCheck className="h-3.5 w-3.5" /> Definition of Done</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {state.definitionOfDone.map((d) => <span key={d} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>)}
            </div>
          </div>

        </div>
      )}

      {/* Always-visible step navigation so Next / Start never sits below the fold. */}
      <div className="sticky bottom-4 z-20 mt-2 flex items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="min-w-0">
          {step !== 'why' && <Button variant="outline" size="sm" onClick={() => setStep(step === 'how' ? 'what' : 'why')}>← Back</Button>}
        </div>
        <div className="flex items-center gap-2.5">
          {step === 'why' && (
            <>
              {!hasGoal && <span className="hidden text-[11px] text-muted-foreground sm:inline">Agree a Sprint Goal to continue</span>}
              <Button size="sm" disabled={!hasGoal} onClick={() => setStep('what')}>Next: what to build →</Button>
            </>
          )}
          {step === 'what' && (
            <>
              {!hasWhat && <span className="hidden text-[11px] text-muted-foreground sm:inline">Forecast at least one item to continue</span>}
              <Button size="sm" disabled={!hasWhat} onClick={() => setStep('how')}>Next: plan the how →</Button>
            </>
          )}
          {step === 'how' && <Button size="sm" onClick={() => onPlan([...selected])}>Start Sprint {state.sprintNumber} →</Button>}
        </div>
      </div>
    </div>
  );
}
