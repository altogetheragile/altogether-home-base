import { useEffect, useRef, useState } from 'react';
import type { ZooGameState, SprintTask } from './types';
import { availableItems, goalCandidates, readyHorizon, suggestSprintGoal, suggestTasks, isDraftedGoal, notReady, revealed } from './engine';
import { NewHere } from './NewHere';
import { zooCapacity } from './config';

import { TaskEditor, SplitEpicPanel } from './Board';
import { PbiCard } from './PbiCard';
import { PickCard } from './PickCard';
import { PlanningPoker } from './PlanningPoker';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { ActionBar } from './ActionBar';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Target, Wand2, Star, Lightbulb, ChevronDown, ArrowRight } from 'lucide-react';

// ============= Sprint Planning =============
//
// One question per screen, and as little else as we can get away with.
//
// The rule this screen is built on: at any moment the learner should be able to say what they are
// being asked and what to press. So each topic shows its question in full size, the one thing you
// act on, and a single primary button. Everything that explains, qualifies or teaches lives behind
// the "?" beside the question - available in a breath, never in the way. Nothing is said twice.

interface SprintPlanningProps {
  state: ZooGameState;
  onPlan: (ids: string[], plannedRefinement?: boolean) => void;
  onEstimate: (id: string, points: number) => void;
  onSetTasks: (id: string, tasks: SprintTask[]) => void;
  onToggleGoalCritical: (id: string) => void;
  /** Re-order the forecast itself - the Developers arranging the plan they are making. */
  onReorderForecast?: (id: string, dir: 'up' | 'down', picked: string[]) => void;
  /** Back to Refinement - where sizing and splitting belong. */
  onRefine?: () => void;
  onSetSprintGoal: (goal: string) => void;
  onTakeSignal: (index: number) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  /** Called when the player moves between planning topics - used to clear the transient
   *  "Ask the PO" note so it doesn't linger onto the next topic. */
  onNavigateStep?: () => void;
  /** The Sprint Planning teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

type Step = 'why' | 'what' | 'how';
const STEPS: { key: Step; n: number; label: string; question: string; lead: string }[] = [
  { key: 'why', n: 1, label: 'Why', question: 'Why is this Sprint valuable?', lead: 'Agree one objective the whole Sprint aims at.' },
  { key: 'what', n: 2, label: 'What', question: 'What can we build?', lead: 'Pull in the work you believe you can finish.' },
  { key: 'how', n: 3, label: 'How', question: 'How will we get it done?', lead: 'Break each item into the steps that build it.' },
];

/** What the Guide says about this topic - shown on request, not on the page. */
const DETAIL: Record<Step, { title: string; body: string[] }> = {
  why: {
    title: 'Topic one: why this Sprint is valuable',
    body: [
      'The Sprint Goal is the commitment of the Sprint Backlog: one objective, which stays fixed even when the scope around it flexes. It is what you protect when something has to give.',
      'You write it looking at the top of the Product Backlog, which is what the Product Owner is proposing value from.',
    ],
  },
  what: {
    title: 'Topic two: what can be Done',
    body: [
      'Through discussion with the Product Owner, the Developers select items from the Product Backlog to include in the Sprint. The work is pulled, never pushed.',
      'Only items that are ready can be selected - ready means the Scrum Team could get them Done inside one Sprint.',
      'Capacity here comes from your recent velocity. Velocity is a common forecasting practice, not part of Scrum, and a forecast is not a promise: finishing a few things well beats starting many.',
      'You may refine an item here to make it ready, but a Backlog refined during the last Sprint would not need it, and the time comes out of Planning.',
    ],
  },
  how: {
    title: 'Topic three: how the work gets done',
    body: [
      'The Developers plan how they will turn the selected items into an Increment meeting the Definition of Done. How this is done is at their sole discretion - no one else tells them how.',
      'The plan is theirs to change every day of the Sprint. It is a starting point, not a contract.',
      'Star the items the Sprint Goal truly depends on. The Goal is an outcome, not a to-do list: deliver the essentials and it is met, even if you drop the rest.',
    ],
  },
};

/** The Sprint Goal, once you have written it: one line, always in view, click to reopen it. */
function GoalBanner({ goal, onEdit }: { goal: string; onEdit: () => void }) {
  return (
    <button type="button" onClick={onEdit} title="Back to the Sprint Goal"
      className="flex w-full items-center gap-2 rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2 text-left transition-colors hover:border-primary/70">
      <Target className="h-4 w-4 shrink-0 text-primary" />
      <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Sprint Goal</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{goal}</span>
    </button>
  );
}

/** How full the Sprint is. The one number that matters while selecting, said as a picture. */
function Meter({ committed, capacity, count }: { committed: number; capacity: number; count: number }) {
  const over = committed > capacity;
  const pct = Math.min(100, capacity ? (committed / capacity) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{count} item{count === 1 ? '' : 's'} in this Sprint</span>
        <span className={cn('font-mono text-sm font-semibold', over ? 'text-destructive' : 'text-foreground')}>{committed}<span className="text-muted-foreground"> / {capacity} pts</span></span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Sprint Planning as its three topics, one screen each: agree the Sprint Goal, forecast the work,
 *  then plan how it gets done. */
export function SprintPlanning({ state, onPlan, onEstimate, onSetTasks, onToggleGoalCritical, onReorderForecast, onRefine, onSetSprintGoal, onTakeSignal, onSplitEpic, onNavigateStep, teachCard, onMarkTaught }: SprintPlanningProps) {
  const [step, setStepState] = useState<Step>('why');
  const setStep = (s: Step) => { onNavigateStep?.(); setStepState(s); };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fixing, setFixing] = useState<string | null>(null);   // refining an item mid-Planning
  const [openPlan, setOpenPlan] = useState<string | null>(null); // which item's task plan is open
  // Topic three's other question, which the Guide asks and the game did not: does the state of the
  // Backlog mean refinement has to be planned INTO this Sprint?
  const [planRefine, setPlanRefine] = useState(false);

  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const capacity = zooCapacity(state.velocity);
  const over = committed > capacity;
  const hasGoal = isDraftedGoal(state.sprintGoal);
  const hasWhat = chosen.length > 0;
  const essentials = chosen.filter((i) => i.goalCritical).length;
  const fixingItem = fixing ? items.find((i) => i.id === fixing) : null;
  // Refining opens a panel above the columns; bring it into view so it is not something you have to
  // go looking for after the popover that offered it has closed.
  const fixRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (fixing) fixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [fixing]);
  // What a Goal would be about before anything is picked: the top of the Backlog, capped at a Sprint.
  const candidates = goalCandidates(state);
  // Marking what the Goal rests on means nothing until you have watched a Sprint run.
  const stars = revealed(state, 'essentials');
  const horizon = readyHorizon(state);
  const totalSteps = chosen.reduce((n, i) => n + (i.tasks ?? []).filter((t) => t.label.trim()).length, 0);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const done = (s: Step) => (s === 'why' ? hasGoal : s === 'what' ? hasWhat : false);
  const goTo = (s: Step) => { if (s === 'why' || (s === 'what' && hasGoal) || (s === 'how' && hasGoal && hasWhat)) setStep(s); };

  const current = STEPS.find((s) => s.key === step)!;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Where you are, what you are being asked, and where the words are. Nothing else. */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <StepTrack steps={STEPS} current={step} done={done} onGo={goTo} />
          <ExplainButton title={DETAIL[step].title} body={DETAIL[step].body} phase="planning" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {/* ---- WHY ---- */}
      {step === 'why' && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Sprint Goal</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Commitment of the Sprint Backlog</span>
              </div>
              <Button variant="secondary" size="sm" className="h-8 border border-primary/30 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
                onClick={() => onSetSprintGoal(suggestSprintGoal(goalCandidates(state)))}
                title="Writes a first draft from what is ready in the Backlog. Wording only - the Goal is the Scrum Team's to agree.">
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Word it for me
              </Button>
            </div>
            <textarea value={state.sprintGoal} onChange={(e) => onSetSprintGoal(e.target.value)} rows={2} autoFocus
              placeholder="One outcome for this Sprint - e.g. &ldquo;Open the Savanna so families have more to see.&rdquo;"
              className="w-full resize-none rounded-lg border-2 border-primary/40 bg-background px-3 py-2 text-lg font-medium leading-snug outline-none focus:border-primary" />
          </div>

          {/* What the Product Owner is proposing value from: the top of the Backlog, in order. */}
          <section>
            <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Top of the Product Backlog</h3>
              <span className="text-[11px] text-muted-foreground/70">ordered by the Product Owner &middot; highlighted is about a Sprint&rsquo;s worth</span>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {items.slice(0, 8).map((it) => (
                // The items the Goal would most likely be about, marked so the suggestion and the
                // list agree on screen: the Goal comes off the top of the Backlog, as far down as a
                // Sprint reaches.
                <PbiCard key={it.id} item={it}
                  state={candidates.some((c) => c.id === it.id) ? 'forecast' : 'backlog'}
                  className={candidates.some((c) => c.id === it.id) ? undefined : 'opacity-70'} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ---- WHAT ---- */}
      {step === 'what' && (
        <div className="space-y-3">
          <GoalBanner goal={state.sprintGoal} onEdit={() => setStep('why')} />

          {state.signals.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-[12px] font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-300">
                  <Lightbulb className="h-3.5 w-3.5" /> {state.signals.length} signal{state.signals.length === 1 ? '' : 's'} from your visitors
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96">
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">What the Sprint Review heard. Adding one puts it in the Product Backlog, unsized.</p>
                  {state.signals.map((sig, i) => (
                    <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-[12px]">
                      <span className="min-w-0 flex-1">{sig.suggestion}</span>
                      <Button size="sm" variant="outline" className="h-6 shrink-0 px-1.5 text-[11px]" onClick={() => onTakeSignal(i)}>Add</Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {fixingItem && (
            <div ref={fixRef}>
              {fixingItem.category === 'epic'
                ? <SplitEpicPanel epic={fixingItem} onSplit={(ids) => { onSplitEpic(fixingItem.id, ids); setFixing(null); }} onCancel={() => setFixing(null)} />
                : <PlanningPoker item={fixingItem} state={state} seed={state.gameSeed}
                  onCommit={(pts) => { onEstimate(fixingItem.id, pts); setFixing(null); }} onCancel={() => setFixing(null)} />}
            </div>
          )}

          {/* Pick from the left, and watch the Sprint fill on the right. */}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <section className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({items.length - chosen.length})</span></h3>
                {onRefine && (
                  <button type="button" onClick={onRefine} title="Sizing and splitting belong in refinement, during the Sprint before this one."
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Refine the Backlog</button>
                )}
              </div>
              <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
                {items.filter((i) => !selected.has(i.id)).map((it) => (
                  <PickCard key={it.id} item={it} why={notReady(it)} onPick={() => toggle(it.id)} onFix={() => setFixing(it.id)}
                    note={"You can put that right here, but a Backlog refined during the last Sprint would not need it - and this is Planning\u2019s time."} />
                ))}
              </div>
            </section>

            <section className="space-y-2 rounded-xl border-2 border-border bg-muted/20 p-3">
              <Meter committed={committed} capacity={capacity} count={chosen.length} />
              {over && <CoachTip>More than you can finish. Over-forecasting tends to miss the Sprint Goal and carry work over - pick what you can take all the way to Done.</CoachTip>}
              {chosen.length === 0 && <p className="py-6 text-center text-[12px] text-muted-foreground/70">Nothing yet. Pick items from the Backlog that serve the Sprint Goal.</p>}
              <div className="max-h-[34vh] space-y-1.5 overflow-y-auto pr-1">
                {chosen.map((it) => (
                  <PickCard key={it.id} item={it} chosen why={null} onPick={() => toggle(it.id)} />
                ))}
              </div>
              {chosen.length > 1 && onReorderForecast && (
                <p className="text-[10px] text-muted-foreground/70">You can arrange the order of work on the board once the Sprint starts.</p>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ---- HOW ---- */}
      {step === 'how' && (
        <div className="space-y-3">
          <GoalBanner goal={state.sprintGoal} onEdit={() => setStep('why')} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              {stars ? <>
                <Star className="inline h-3.5 w-3.5 text-amber-500" />
                Star what the Goal depends on{essentials > 0 ? ` (${essentials} starred)` : ''}, and break each item into steps.
                {state.sprintNumber === 2 && (
                  <NewHere title="Marking the essentials">
                    <p>Star the items the Sprint Goal truly depends on. The Goal is an outcome, not a to-do list: deliver the essentials and it is met, even if you drop the rest.</p>
                    <p>It appears now because you have watched a Sprint end. Protecting the Goal by dropping scope is a win, not a miss - but only if you have said what the Goal actually rests on.</p>
                  </NewHere>
                )}
              </> : <>Break each item into the steps that build it.</>}
            </p>
            <Button variant="secondary" size="sm" className="h-8 border border-primary/30 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
              onClick={() => chosen.forEach((it) => { if (!(it.tasks ?? []).length) onSetTasks(it.id, suggestTasks(it)); })}>
              <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest steps for all
            </Button>
          </div>

          {/* The state of the Backlog, and the decision it forces. */}
          <section className={cn('rounded-lg border px-3 py-2.5', planRefine ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Does the Backlog need refining this Sprint?</h3>
                <p className="text-[11px] text-muted-foreground">
                  About <strong>{horizon} Sprint{horizon === 1 ? '' : 's'}</strong> of ready work is waiting.
                  {horizon < 1 ? ' The next Planning will have nothing to choose from unless you make time.'
                    : horizon > 3 ? ' That is plenty - build instead.'
                      : ' Enough for now, but it burns down as you go.'}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {[false, true].map((v) => (
                  <button key={String(v)} type="button" onClick={() => setPlanRefine(v)}
                    className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      planRefine === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {v ? 'Plan it in' : 'Not this Sprint'}
                  </button>
                ))}
              </div>
            </div>
            {planRefine && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Time set aside for the whole Scrum Team to refine together. It comes out of every day&rsquo;s build time -
                that is the trade-off - and what it prepares is later Sprints, not this one.
              </p>
            )}
          </section>

          <div className="space-y-2">
            {chosen.map((it) => {
              const tasks = (it.tasks ?? []).filter((t) => t.label.trim());
              const open = openPlan === it.id;
              return (
                <div key={it.id}>
                  {open ? (
                    <TaskEditor item={it} onSetTasks={onSetTasks} onToggleGoalCritical={stars ? onToggleGoalCritical : undefined} onClose={() => setOpenPlan(null)} />
                  ) : (
                    <PbiCard item={it} state="forecast" onClick={() => setOpenPlan(it.id)} label={`Plan ${it.name}`}
                      className={it.goalCritical ? 'border-amber-400/70' : undefined}
                      lead={stars ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleGoalCritical(it.id); }} aria-label={`Mark ${it.name} essential to the Sprint Goal`}
                          title={it.goalCritical ? 'Essential to the Sprint Goal' : 'Mark essential to the Sprint Goal'} className="shrink-0">
                          <Star className={cn('h-4 w-4', it.goalCritical ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500')} />
                        </button>
                      ) : undefined}
                      trailing={
                        <Button size="sm" variant={tasks.length ? 'ghost' : 'outline'} className="h-7 shrink-0 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); setOpenPlan(it.id); }}>
                          {tasks.length ? `${tasks.length} steps` : 'Plan it'}
                        </Button>} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* One primary action, always in the same place. */}
      <ActionBar left={step !== 'why' ? <Button variant="ghost" size="sm" onClick={() => setStep(step === 'how' ? 'what' : 'why')}>&larr; Back</Button> : undefined}>
        <div className="flex items-center gap-2.5">
          {step === 'why' && (
            <>
              {!hasGoal && <span className="hidden text-[11px] text-muted-foreground sm:inline">{state.sprintGoal.trim() ? 'A Sprint Goal is an objective, not a word' : 'Write the Sprint Goal to continue'}</span>}
              <Button disabled={!hasGoal} onClick={() => setStep('what')}>Next: what to build <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </>
          )}
          {step === 'what' && (
            <>
              {!hasWhat && <span className="hidden text-[11px] text-muted-foreground sm:inline">Pick at least one item to continue</span>}
              <Button disabled={!hasWhat} onClick={() => setStep('how')}>Next: how <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </>
          )}
          {step === 'how' && (
            <>
              {/* What the three topics just produced, said at the moment it comes into being. The
                  Sprint Backlog is the output of the event, and the learner should watch it appear. */}
              <span className="hidden text-[11px] text-muted-foreground lg:inline">
                Creates the <strong className="text-foreground">Sprint Backlog</strong>: your Sprint Goal, {chosen.length} item{chosen.length === 1 ? '' : 's'} ({committed} pts){totalSteps > 0 ? `, ${totalSteps} steps` : ''}
              </span>
              <Button onClick={() => onPlan([...selected], planRefine)}>Start Sprint {state.sprintNumber} <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </>
          )}
        </div>
      </ActionBar>
    </div>
  );
}
