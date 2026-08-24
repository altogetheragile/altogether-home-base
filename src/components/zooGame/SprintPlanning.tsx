import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ZooGameState, SprintTask } from './types';
import { availableItems, goalCandidates, readyHorizon, sprintCapacity, suggestSprintGoal, suggestTasks, isDraftedGoal, notReady, revealed } from './engine';
import { NewHere } from './NewHere';


import { TaskEditor, SplitEpicPanel } from './Board';
import { PbiCard } from './PbiCard';
import { ShapeChooser } from './ShapeChooser';
import { Workspace } from './ui/Workspace';
import { PickCard } from './PickCard';
import { PlanningPoker } from './PlanningPoker';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { REFINE_POINT_OPTIONS } from './config';
import { ActionBar } from './ActionBar';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Target, Wand2, Star, Lightbulb, ChevronDown, ArrowRight, ListChecks } from 'lucide-react';
import { EYEBROW, FOCUS, TONE } from './ui/tokens';

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
  onPlan: (ids: string[], refinementPoints?: number) => void;
  onEstimate: (id: string, points: number) => void;
  onSetTasks: (id: string, tasks: SprintTask[]) => void;
  /** Topic three's shape decisions: how big, which habitat, what kind of building or planting. */
  onPlanShape: (id: string, patch: { enclosureSize?: 'small' | 'medium' | 'large'; enclosureId?: string; template?: string }) => void;
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
// The Guide's three topics, worded as the Guide words them. A learner who meets "What can we build?"
// here and "What can be Done this Sprint?" in the exam has been taught two things, one of which is
// wrong; `topic` carries the Guide's phrasing and `label` is only the short chip on the step track.
const STEPS: { key: Step; n: number; label: string; topic: string; question: string; lead: string }[] = [
  { key: 'why', n: 1, label: 'Why', topic: 'Topic One', question: 'Why is this Sprint valuable?', lead: 'Agree one objective the whole Sprint aims at.' },
  { key: 'what', n: 2, label: 'What', topic: 'Topic Two', question: 'What can be Done this Sprint?', lead: 'Pull in the work you believe you can finish.' },
  { key: 'how', n: 3, label: 'How', topic: 'Topic Three', question: 'How will the chosen work get done?', lead: 'Decide what each item will be, and the steps that build it.' },
];

// Which Teaching Cards each topic is about. The prose that used to live here said the same things
// the cards say, in slightly different words, and only the cards were editable.
const TOPIC_CARDS: Record<Step, string[]> = {
  why: ['sprint-goal', 'sprint-planning'],
  what: ['sprint-backlog', 'velocity', 'pbi'],
  how: ['sprint-backlog', 'developers'],
};

/** The shape every topic of Sprint Planning takes: the Product Backlog on the left, the Sprint you
 *  are assembling on the right. Topic two was the one screen that read well, and this is why - the
 *  thing you are choosing from and the thing you are building are side by side, and you can see one
 *  fill as the other empties. The other two topics now stand in the same frame, so moving between
 *  them is moving through one event rather than arriving somewhere new. */
function PlanColumns({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <section className="min-w-0 space-y-1.5">{left}</section>
      <section className="min-w-0 space-y-2 rounded-xl border-2 border-border bg-muted/20 p-3">{right}</section>
    </div>
  );
}

/** The left column's heading, so all three topics label it the same way. */
function BacklogHeading({ count, note, onRefine }: { count: number; note?: string; onRefine?: () => void }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
      <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({count})</span></h3>
      {onRefine
        ? <button type="button" onClick={onRefine} title="Sizing and splitting belong in refinement, during the Sprint before this one."
          className={cn(FOCUS, "text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline")}>Refine the Backlog</button>
        : note && <span className="text-[11px] text-muted-foreground/70">{note}</span>}
    </div>
  );
}

/** How full the Sprint is. The one number that matters while selecting, said as a picture. */
function Meter({ committed, capacity, count, basis }: { committed: number; capacity: number; count: number; basis: { estimated: boolean; measuredSprints: number; discarded: number } }) {
  const over = committed > capacity;
  const pct = Math.min(100, capacity ? (committed / capacity) * 100 : 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{count} item{count === 1 ? '' : 's'} in this Sprint</span>
        <span className={cn('font-mono text-sm font-semibold', over ? 'text-destructive' : 'text-foreground')}>{committed}<span className="text-muted-foreground"> / {capacity} pts</span></span>
      </div>
      {/* Never call a guess "velocity". Velocity is measured, and until a Sprint of this length has
          run there is nothing measured to go on. */}
      <p className="text-[11px] text-muted-foreground">
        {basis.estimated
          ? <><strong className="text-foreground">Estimated velocity</strong> - nothing measured at this Sprint length yet{basis.discarded > 0 ? `, so ${basis.discarded} earlier Sprint${basis.discarded === 1 ? '' : 's'} of a different length ${basis.discarded === 1 ? 'is' : 'are'} not counted` : ''}.</>
          : <><strong className="text-foreground">Velocity</strong> - measured over your last {basis.measuredSprints} Sprint{basis.measuredSprints === 1 ? '' : 's'} of this length{basis.discarded > 0 ? `, ignoring ${basis.discarded} at a different length` : ''}.</>}
      </p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', over ? 'bg-destructive' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Sprint Planning as its three topics, one screen each: agree the Sprint Goal, forecast the work,
 *  then plan how it gets done. */
export function SprintPlanning({ state, onPlan, onEstimate, onSetTasks, onPlanShape, onToggleGoalCritical, onReorderForecast, onRefine, onSetSprintGoal, onTakeSignal, onSplitEpic, onNavigateStep, teachCard, onMarkTaught }: SprintPlanningProps) {
  const [step, setStepState] = useState<Step>('why');
  const setStep = (s: Step) => { onNavigateStep?.(); setStepState(s); };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fixing, setFixing] = useState<string | null>(null);   // refining an item mid-Planning
  const [openPlan, setOpenPlan] = useState<string | null>(null); // which item's task plan is open
  // Topic three's other question, which the Guide asks and the game did not: does the state of the
  // Backlog mean refinement has to be planned INTO this Sprint?
  const [refinePts, setRefinePts] = useState(0);

  const items = availableItems(state);
  const chosen = items.filter((i) => selected.has(i.id));
  const committed = chosen.reduce((s, i) => s + i.estimate, 0);
  const cap = sprintCapacity(state);
  const capacity = cap.points;
  const over = committed > capacity;
  const hasGoal = isDraftedGoal(state.sprintGoal);
  const hasWhat = chosen.length > 0;
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
  // How the work gets done is topic three's whole job, so an item with no steps is topic three left
  // undone. "Suggest steps for all" is one press away if you would rather not write them yourself.
  const unplanned = chosen.filter((i) => !(i.tasks ?? []).some((t) => t.label.trim())).length;
  // Habitats an animal can be assigned to: anything in the Backlog that is an enclosure.
  const habitats = state.backlog.filter((it) => it.category === 'enclosure').map((it) => ({ id: it.id, name: it.name }));

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
          <StepTrack steps={STEPS} current={step} done={done} onGo={goTo} caption="The three topics of Sprint Planning" />
          <ExplainButton cards={TOPIC_CARDS[step]} phase="planning" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          {/* Named as the Guide names it. Sprint Planning has three topics, and saying which one you
              are on is the difference between three screens and one event with three parts. */}
          <div className={cn(EYEBROW, 'text-primary')}>{current.topic} of Sprint Planning</div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {/* ---- WHY ---- */}
      {step === 'why' && (
        <PlanColumns
          left={<>
            <BacklogHeading count={items.length} note="ordered by the Product Owner - open one to read it" />
            <p className="text-[11px] text-muted-foreground/70">
              What the Product Owner is proposing value from. The marked items are about a Sprint&rsquo;s worth off the
              top, which is what a Sprint Goal is usually about.
            </p>
            <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className={cn(candidates.some((c) => c.id === it.id) ? 'border-l-4 border-l-primary pl-1' : 'pl-1 opacity-60')}>
                  <PickCard item={it} why={notReady(it)} readOnly onPick={() => {}} />
                </div>
              ))}
            </div>
          </>}
          right={<>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Sprint Goal</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Commitment of the Sprint Backlog</span>
              </div>
              {/* The wizards are the game offering to do a piece of work for you, so they read as an
                  offer: filled, not a tinted ghost of the primary action. */}
              <Button size="sm" className={cn(TONE.teach.solid, TONE.teach.solid, TONE.teach.solid, "h-8 gap-1 px-3 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 dark: dark:hover:")}
                onClick={() => onSetSprintGoal(suggestSprintGoal(goalCandidates(state)))}
                title="Writes a first draft from what is ready in the Backlog. Wording only - the Goal is the Scrum Team's to agree.">
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Word it for me
              </Button>
            </div>
            <textarea value={state.sprintGoal} onChange={(e) => onSetSprintGoal(e.target.value)} rows={3} autoFocus
              placeholder="One outcome for this Sprint - e.g. &ldquo;Open the Savanna so families have more to see.&rdquo;"
              className="w-full resize-none rounded-lg border-2 border-primary/40 bg-background px-3 py-2 text-lg font-medium leading-snug outline-none focus:border-primary" />
            {/* The right-hand column is the Sprint. At topic one it is empty on purpose, and saying
                so is better than leaving a blank panel: the Goal comes before the work, not after. */}
            <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">Nothing forecast yet</p>
              <p className="text-[11px] text-muted-foreground/70">The Sprint Backlog fills at topic two, once you know what this Sprint is for.</p>
            </div>
          </>} />
      )}

      {/* ---- WHAT ---- */}
      {step === 'what' && (
        <div className="space-y-3">
          {state.signals.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(FOCUS, "flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-300")}>
                  <Lightbulb className="h-3.5 w-3.5" /> {state.signals.length} signal{state.signals.length === 1 ? '' : 's'} from your visitors
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96">
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">What the Sprint Review heard. Adding one puts it in the Product Backlog, unsized.</p>
                  {state.signals.map((sig, i) => (
                    <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs">
                      <span className="min-w-0 flex-1">{sig.suggestion}</span>
                      <Button size="sm" variant="outline" className="h-6 shrink-0 px-1.5 text-[11px]" onClick={() => onTakeSignal(i)}>Add</Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {fixingItem && (
            <Workspace wide={fixingItem.category === 'epic'}
              title={fixingItem.category === 'epic' ? `Split ${fixingItem.name}` : `Size ${fixingItem.name}`}
              subtitle="Refining here is allowed, but a Backlog refined during the last Sprint would not need it - and this is Planning's time."
              onClose={() => setFixing(null)}>
              {fixingItem.category === 'epic'
                ? <SplitEpicPanel epic={fixingItem} onSplit={(ids) => { onSplitEpic(fixingItem.id, ids); setFixing(null); }} />
                : <PlanningPoker item={fixingItem} state={state} seed={state.gameSeed}
                  onCommit={(pts) => { onEstimate(fixingItem.id, pts); setFixing(null); }} />}
            </Workspace>
          )}

          {/* Pick from the left, and watch the Sprint fill on the right. */}
          <PlanColumns
            left={<>
              <BacklogHeading count={items.length - chosen.length} onRefine={onRefine} />
              <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
                {items.filter((i) => !selected.has(i.id)).map((it) => (
                  <PickCard key={it.id} item={it} why={notReady(it)} onPick={() => toggle(it.id)} onFix={() => setFixing(it.id)}
                    note={"You can put that right here, but a Backlog refined during the last Sprint would not need it - and this is Planning\u2019s time."} />
                ))}
              </div>
            </>}
            right={<>
              <Meter committed={committed} capacity={capacity} count={chosen.length} basis={cap} />
              {over && <CoachTip>More than you can finish. Over-forecasting tends to miss the Sprint Goal and carry work over - pick what you can take all the way to Done.</CoachTip>}
              {chosen.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground/70">Nothing yet. Pick items from the Backlog that serve the Sprint Goal.</p>}
              <div className="max-h-[34vh] space-y-1.5 overflow-y-auto pr-1">
                {chosen.map((it) => (
                  <PickCard key={it.id} item={it} chosen why={null} onPick={() => toggle(it.id)} />
                ))}
              </div>
              {chosen.length > 1 && onReorderForecast && (
                <p className="text-[11px] text-muted-foreground/70">You can arrange the order of work on the board once the Sprint starts.</p>
              )}
            </>} />
        </div>
      )}

      {/* ---- HOW ---- */}
      {step === 'how' && (
        <div className="space-y-3">
          <PlanColumns
            left={<>
              <BacklogHeading count={items.length - chosen.length} note="what you did NOT take - still the Product Owner's to order" />
              <p className="text-[11px] text-muted-foreground/70">
                Left where it was. Seeing it beside the Sprint is the point: this is what the next Planning will choose
                from, and it is the reason refining costs you something now.
              </p>

              {/* Refinement is work in the plan, so it is planned like work: sized, in the forecast, and
                  somebody has to hold it. A yes/no flag made it a tax nobody paid attention to. */}
              <section className={cn('rounded-lg border px-3 py-2.5', refinePts ? 'border-violet-400/60 bg-violet-500/[0.07]' : 'border-border bg-muted/20')}>
                <h3 className="text-sm font-semibold">How much refinement will you do this Sprint?</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  About <strong>{horizon} Sprint{horizon === 1 ? '' : 's'}</strong> of ready work is waiting.
                  {horizon < 1 ? ' The next Planning will have nothing to choose from unless you make time.'
                    : horizon > 3 ? ' That is plenty - build instead.'
                      : ' Enough for now, but it burns down as you go.'}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {REFINE_POINT_OPTIONS.map((v) => (
                    <button key={v} type="button" onClick={() => setRefinePts(v)}
                      className={cn(FOCUS, 'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        refinePts === v ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'border-border text-muted-foreground hover:text-foreground')}>
                      {v === 0 ? 'None' : `${v} pt${v === 1 ? '' : 's'}`}
                    </button>
                  ))}
                </div>
                {refinePts > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {refinePts} point{refinePts === 1 ? '' : 's'} set aside for the whole Scrum Team to refine together. It
                    goes on the board like any other work and it is not Done until you have held it.
                  </p>
                )}
              </section>

              <div className="max-h-[32vh] space-y-1.5 overflow-y-auto pr-1">
                {items.filter((i) => !selected.has(i.id)).map((it) => (
                  <PickCard key={it.id} item={it} why={notReady(it)} readOnly onPick={() => {}} />
                ))}
              </div>
            </>}
            right={<>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Sprint Backlog <span className="font-normal text-muted-foreground">({chosen.length})</span></h3>
                  <p className="text-[11px] text-muted-foreground">
                    {stars ? 'Star what the Goal depends on, and break each item into steps.' : 'Open each item to decide what it will be, and the steps that build it.'}
                    {' '}<strong className="text-foreground">{totalSteps} step{totalSteps === 1 ? '' : 's'}</strong> so far.
                  </p>
                </div>
                <Button size="sm" className={cn(TONE.teach.solid, TONE.teach.solid, TONE.teach.solid, "h-8 gap-1 px-3 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 dark: dark:hover:")}
                  onClick={() => chosen.forEach((it) => { if (!(it.tasks ?? []).length) onSetTasks(it.id, suggestTasks(it)); })}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" /> Suggest steps for all
                </Button>
              </div>
              {stars && state.sprintNumber === 2 && (
                <NewHere title="Marking the essentials">
                  <p>Star the items the Sprint Goal truly depends on. The Goal is an outcome, not a to-do list: deliver the essentials and it is met, even if you drop the rest.</p>
                  <p>It appears now because you have watched a Sprint end. Protecting the Goal by dropping scope is a win, not a miss - but only if you have said what the Goal actually rests on.</p>
                </NewHere>
              )}

              <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                {chosen.map((it) => {
                  const tasks = (it.tasks ?? []).filter((t) => t.label.trim());
                  const open = openPlan === it.id;
                  return (
                    <div key={it.id}>
                      {open ? (
                        <div className="space-y-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2">
                          {/* What kind of thing, before how it gets built - the first "how" is what shape
                              it takes, and it decides the order of the Sprint. */}
                          {(() => {
                            const shape = <ShapeChooser item={it} enclosures={habitats} onPlan={(patch) => onPlanShape(it.id, patch)} />;
                            return shape ? <div className="rounded-md border border-border bg-card px-2 py-1.5">{shape}</div> : null;
                          })()}
                          <TaskEditor item={it} onSetTasks={onSetTasks} onToggleGoalCritical={stars ? onToggleGoalCritical : undefined} onClose={() => setOpenPlan(null)} />
                        </div>
                      ) : (
                        // Everything here is already in the Sprint, so tinting every row orange says
                        // nothing. What differs between these rows is whether they have been planned -
                        // so THAT is what carries the colour.
                        <PbiCard item={it} state="backlog" onClick={() => setOpenPlan(it.id)} label={`Plan ${it.name}`}
                          className={cn(it.goalCritical && 'border-l-4 border-l-amber-400',
                            tasks.length ? 'border-emerald-400/60 bg-emerald-500/[0.04]' : 'border-dashed')}
                          lead={stars ? (
                            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleGoalCritical(it.id); }} aria-label={`Mark ${it.name} essential to the Sprint Goal`}
                              title={it.goalCritical ? 'Essential to the Sprint Goal' : 'Mark essential to the Sprint Goal'} className={cn(FOCUS, "shrink-0")}>
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
                {refinePts > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-violet-400/60 bg-violet-500/[0.07] px-2 py-1.5 text-xs">
                    <ListChecks className={cn(TONE.teach.text, "h-3.5 w-3.5 shrink-0")} />
                    <span className="min-w-0 flex-1 font-medium">Refine the Product Backlog</span>
                    <span className={cn(TONE.teach.text, "shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold")}>{refinePts} pts</span>
                  </div>
                )}
              </div>
            </>} />
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
              {/* Topic three is where the Developers plan HOW. Letting the Sprint start with nothing
                  planned makes the topic optional, which teaches that it is. It is not. */}
              {unplanned > 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  {unplanned} item{unplanned === 1 ? ' has' : 's have'} no steps yet
                </span>
              ) : (
                // What the three topics just produced, said at the moment it comes into being. The
                // Sprint Backlog is the output of the event, and the learner should watch it appear.
                <span className="hidden text-[11px] text-muted-foreground lg:inline">
                  Creates the <strong className="text-foreground">Sprint Backlog</strong>: your Sprint Goal, {chosen.length} item{chosen.length === 1 ? '' : 's'} ({committed} pts){totalSteps > 0 ? `, ${totalSteps} steps` : ''}
                </span>
              )}
              <Button disabled={unplanned > 0} onClick={() => onPlan([...selected], refinePts)}>Start Sprint {state.sprintNumber} <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </>
          )}
        </div>
      </ActionBar>
    </div>
  );
}
