import { useState } from 'react';
import type { ZooGameState, PbiDraft, SprintTask } from './types';
import { availableItems, suggestSprintGoal, suggestTasks, isDraftedGoal } from './engine';
import { zooCapacity } from './config';

import { ProductBacklogSidebar, BoardColumn, ItemCard, TaskEditor } from './Board';
import { CoachTip } from './CoachTip';
import { PhaseHeader } from './PhaseHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, Target, Wand2, X, Check, ClipboardCheck, ChevronUp, ChevronDown } from 'lucide-react';

interface SprintPlanningProps {
  state: ZooGameState;
  onPlan: (ids: string[]) => void;
  onEstimate: (id: string, points: number) => void;
  onSetTasks: (id: string, tasks: SprintTask[]) => void;
  onToggleGoalCritical: (id: string) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  /** Re-order the forecast itself - the Developers arranging the plan they are making. */
  onReorderForecast?: (id: string, dir: 'up' | 'down', picked: string[]) => void;
  /** Back to Refinement - sizing and splitting happen there, not here. */
  onRefine?: () => void;
  onMoveZone: (zone: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSetSprintGoal: (goal: string) => void;
  onTakeSignal: (index: number) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onDeletePbi: (id: string) => void;
  onDuplicatePbi: (id: string) => void;
  /** Called when the player moves between planning topics - used to clear the transient
   *  "Ask the PO" note so it doesn't linger onto the next topic. */
  onNavigateStep?: () => void;
}

type Step = 'why' | 'what' | 'how';
const STEPS: { key: Step; label: string; short: string; full: string }[] = [
  { key: 'why', label: 'Why', short: 'the Sprint Goal', full: 'Why is this Sprint valuable?' },
  { key: 'what', label: 'What', short: 'the forecast', full: 'What can we build?' },
  { key: 'how', label: 'How', short: 'the plan', full: 'How will we get it done?' },
];

/** Sprint Planning as its three real topics, in order: Why (agree the Sprint Goal),
 *  What (forecast Backlog items into the Sprint), then How (confirm the plan - the
 *  Sprint Backlog built to the Definition of Done over the Sprint's days). The initial
 *  Product Backlog refinement is a separate step before this (the Refine phase). */
export function SprintPlanning({ state, onPlan, onEstimate, onSetTasks, onToggleGoalCritical, onAddPbi, onRefinePbi, onReorder, onReorderForecast, onRefine, onMoveZone, onMoveBefore, onSetUseStories, onSetSprintGoal, onTakeSignal, onSplitEpic, onDeletePbi, onDuplicatePbi, onNavigateStep }: SprintPlanningProps) {
  const [step, setStepState] = useState<Step>('why');
  // Moving between topics clears the transient "Ask the PO" note so it doesn't follow you.
  const setStep = (s: Step) => { onNavigateStep?.(); setStepState(s); };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wideBacklog, setWideBacklog] = useState(false);
  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const hasGoal = isDraftedGoal(state.sprintGoal); // Why is not done until the Goal is actually drafted
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
                <span className="hidden text-[11px] font-normal text-muted-foreground sm:inline">{s.short}</span>
              </button>
              {i < STEPS.length - 1 && <span className="text-muted-foreground/40">→</span>}
            </div>
          );
        })}
      </div>

      <PhaseHeader phase="planning" event="Sprint Planning" title={STEPS.find((s) => s.key === step)!.full}
        step={STEPS.findIndex((s) => s.key === step) + 1} of={STEPS.length} />

      {/* ---- WHY: agree the Sprint Goal ---- */}
      {step === 'why' && (
        <div className="mx-auto max-w-2xl space-y-3">
          <p className="text-sm text-muted-foreground">
            The Sprint Goal is the single objective this Sprint commits to - the reason it is worth doing. The whole
            Scrum Team crafts it together; it is not handed down by the Product Owner. Agree it first; it guides what
            you select next, and stays fixed even if the scope flexes.
          </p>
          <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Sprint Goal</div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => onSetSprintGoal(suggestSprintGoal(items))}
                title="Writes a first draft from what is ready in the Backlog. Wording only - the Goal is the Scrum Team's to agree.">
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Word it for me
              </Button>
            </div>
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

      {step === 'why' && (
        <div className="mx-auto max-w-2xl">
          {/* The Scrum Team crafts the Sprint Goal looking at the top of the Product Backlog - it is
              what the Product Owner is proposing value from. The same Backlog as topic two, in a
              read-only mode: this topic is about the objective, and the work is selected next. */}
          <ProductBacklogSidebar state={state} mode="view" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
            onSetUseStories={onSetUseStories} onEstimate={onEstimate} onSplitEpic={onSplitEpic}
            onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />
        </div>
      )}

      {step === 'what' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The Developers pull Ready items from the Product Backlog into the Sprint - what they believe they can build to the
            Definition of Done, guided by the Sprint Goal and their capacity. Finishing fewer things well beats starting many.
          </p>

          {/* The Sprint Goal you agreed in Why - shown here to guide selection, and editable so
              you can refine it as the forecast takes shape (or draft one from your selection). */}
          <div className="space-y-1.5 rounded-lg border-2 border-primary/50 bg-primary/5 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Sprint Goal</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Commitment of the Sprint Backlog</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => onSetSprintGoal(suggestSprintGoal(chosen.length ? chosen : items))}
                title="Re-words the Goal around what you have selected. Wording only - the Goal is the Scrum Team's to agree.">
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Word it for me
              </Button>
            </div>
            <textarea
              value={state.sprintGoal}
              onChange={(e) => onSetSprintGoal(e.target.value)}
              rows={2}
              placeholder="One outcome for this Sprint - refine it as you choose what to build."
              className="w-full resize-none rounded-md border-2 border-primary/40 bg-background px-3 py-2 text-base font-medium leading-snug outline-none focus:border-primary"
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

          <div className={cn('grid gap-4 lg:items-start', wideBacklog ? 'lg:grid-cols-[440px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]')}>
            <ProductBacklogSidebar onWidth={setWideBacklog} state={state} mode="plan" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
              onSetUseStories={onSetUseStories} onEstimate={onEstimate} selected={selected} onToggle={toggle}
              onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />

            <div className="min-w-0 space-y-3">
              {/* Capacity + a coached goal suggestion from the selection. */}
              <div className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">Sprint forecast</span>
                  <span className={cn('font-mono', over ? 'text-destructive' : 'text-muted-foreground')}>{committed} / {capacity} pts</span>
                  {onRefine && (
                    // Nothing Ready to forecast? Refinement is where that is fixed - and it costs
                    // this Sprint capacity, which is the point.
                    <button type="button" onClick={onRefine}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      title="Size, split and clarify PBIs. Refinement belongs in the Sprint before - doing it now is catching up.">
                      Refine the Backlog
                    </button>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', over ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, capacity ? (committed / capacity) * 100 : 0)}%` }} />
                </div>
                {over && <CoachTip>You&rsquo;re forecasting <strong>{committed} pts</strong> against a capacity of ~{capacity}. Over-committing tends to miss the Sprint Goal and carry unfinished work - forecast what you can finish to Done, not the most you could start.</CoachTip>}
                <p className="text-[11px] text-muted-foreground">{state.velocity.length ? `Capacity is your average velocity over the last ${Math.min(state.velocity.length, 3)} Sprint${Math.min(state.velocity.length, 3) > 1 ? 's' : ''}. Velocity is a forecasting practice, not a Scrum Guide rule.` : 'We don’t know your velocity yet — this is a first guess. You’ll learn it by doing: after each Sprint, capacity becomes your recent actual delivery. (Velocity is a common practice, not required by Scrum.)'}</p>
              </div>

              {/* The same board you play the Sprint on, so it doesn't change shape when the
                  Sprint starts: your forecast sits in To Do, the rest fill as work flows. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <BoardColumn title="To Do" count={chosen.length} hint="Pull items from the Product Backlog">
                  {chosen.map((it, i) => (
                    <ItemCard key={it.id} item={it} onClick={() => toggle(it.id)} label={`Remove ${it.name} from the Sprint forecast`}
                      lead={onReorderForecast && chosen.length > 1 && (
                        // The order to work in is the Developers' plan, so it is theirs to arrange -
                        // here as well as on the board once the Sprint is running. The arrows must not
                        // fall through to the card, whose click takes the item back out of the Sprint.
                        <div className="flex shrink-0 flex-col items-center leading-none text-muted-foreground" title="Re-order the forecast">
                          <button type="button" title="Move up" aria-label={`Move ${it.name} up the Sprint forecast`} disabled={i === 0}
                            onClick={(e) => { e.stopPropagation(); onReorderForecast(it.id, 'up', chosen.map((c) => c.id)); }}
                            className="disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3 w-3" /></button>
                          <button type="button" title="Move down" aria-label={`Move ${it.name} down the Sprint forecast`} disabled={i === chosen.length - 1}
                            onClick={(e) => { e.stopPropagation(); onReorderForecast(it.id, 'down', chosen.map((c) => c.id)); }}
                            className="disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3 w-3" /></button>
                        </div>
                      )}
                      actions={<span className="flex items-center gap-1 text-[11px] text-muted-foreground"><X className="h-3.5 w-3.5" /> remove</span>} />
                  ))}
                </BoardColumn>
                <BoardColumn title="Doing" count={0} limit={state.wipLimit} hint="Starts once the Sprint begins" />
                <BoardColumn title="Deploy" count={0} hint="Built - place & open it" />
                <BoardColumn title="Done ✓" count={0} hint="Nothing live yet" tone="done" />
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
              {!hasGoal && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {state.sprintGoal.trim() ? 'Say a bit more - a Sprint Goal is an objective, not a word' : 'Draft the Sprint Goal to continue'}
                </span>
              )}
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
