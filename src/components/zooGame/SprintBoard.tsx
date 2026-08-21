import { useEffect, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ZooGameState, BacklogItem } from './types';
import { isDeployAcceptance } from './design';
import { enclosureReady, enclosureOf, availableItems, notReady, readyHorizon, revealed, activeWipLimit, isSignOffTask, signOffReady } from './engine';
import { NewHere } from './NewHere';
import { ActionBar } from './ActionBar';
import { BurndownChip } from './Burndown';
import { ScrumTeamStrip, AssignDevs } from './ScrumTeam';
import { DailyScrum } from './DailyScrum';
import { ExplainButton } from './Explain';
import { BoardColumn, CardDetail, SplitEpicPanel } from './Board';
import { PbiCard } from './PbiCard';
import { Workspace } from './ui/Workspace';
import { Chip } from './ui/Chip';
import { PickCard } from './PickCard';
import { PlanningPoker } from './PlanningPoker';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Palette, Check, AlertTriangle, Pencil, CopyPlus, Sunrise, ArrowRight, SlidersHorizontal, MapPin, ChevronUp, ChevronDown, ListChecks, ClipboardList, X } from 'lucide-react';

interface SprintBoardProps {
  state: ZooGameState;
  onAddAnother: (id: string) => void;
  onEstimate: (id: string, points: number) => void;
  onToggleTask: (id: string, taskId: string) => void;
  /** Accepting a criterion, on the card the criterion belongs to. */
  onConfirmAc: (id: string, index: number, value: boolean) => void;
  onStartItem: (id: string) => void;
  /** The Product Owner cancelling the Sprint - only they can, and only if the Goal is obsolete. */
  onCancelSprint?: () => void;
  /** Re-order what to pick up next - the Developers arranging their own Sprint Backlog. */
  onReorderSprint?: (id: string, dir: 'up' | 'down') => void;
  onSetLearnMode: (on: boolean) => void;
  /** The WIP limit is the Developers' own agreement, so they can change it or switch it off. */
  onSetWipLimit?: (n: number) => void;
  onSetScrumAt: (at: 'start' | 'end') => void;
  onPull: (id: string) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onAssignDev: (itemId: string, devId: string) => void;
  onRenameMember: (memberId: string, name: string) => void;
  onOpen: (id: string) => void;
  /** Put a built item on the park to place & size it (for items with placement acceptance criteria)
   *  before releasing it to visitors. */
  onPlaceOnPark: (id: string) => void;
  onEndDay: () => void;
  onHoldDailyScrum: () => void;
  onSkipDailyScrum: () => void;
  onStartDay: () => void;
  /** Hold the refinement the Scrum Team planned into this Sprint at topic three. */
  onHoldRefinement?: () => void;
  /** Selecting an item on the park, so starting one takes you straight to building it there. */
  onBuilding: (id: string | null) => void;
  /** The Sprint teaching card, shown inside the "?" rather than as a block above the board. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

/** The start of a new day, after the Daily Scrum: the team gathers before the build.
 *  The day's clock is already running (shown above), so this pause uses some of the
 *  day's time - start building when the team is ready. */
function DayStart({ state, onStart }: { state: ZooGameState; onStart: () => void }) {
  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
      <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Sunrise className="h-3.5 w-3.5" /> A new day begins</div>
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">The team gathers to start the day. The clock is already running - start the build when you are ready.</p>
      {state.carriedImpediment && (
        <p className="mx-auto max-w-sm rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">Yesterday's blocker ({state.carriedImpediment.title}) is still being dealt with, so today's build time is shorter.</p>
      )}
      <Button size="lg" onClick={onStart}>Start building &rarr;</Button>
    </div>
  );
}

/** The board's two set-once settings, tucked behind a gear so they don't sit in prime space:
 *  when the Daily Scrum is held, and whether days run on a timer (learn mode pauses the clock). */
function BoardSettings({ dailyScrumAt, learnMode, wipLimit, onSetScrumAt, onSetLearnMode, onSetWipLimit, onCancelSprint }: { dailyScrumAt: 'start' | 'end'; learnMode: boolean; wipLimit: number; onSetScrumAt: (at: 'start' | 'end') => void; onSetLearnMode: (on: boolean) => void; onSetWipLimit?: (n: number) => void; onCancelSprint?: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Board settings" aria-label="Board settings"
          className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Board settings</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground" title="When the Developers hold their Daily Scrum - at the start of a day, planning the day ahead, or at its end">Daily Scrum</span>
            <button type="button" onClick={() => onSetScrumAt(dailyScrumAt === 'start' ? 'end' : 'start')}
              className="rounded-full border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/40">
              {dailyScrumAt === 'start' ? 'Day start' : 'Day end'}
            </button>
          </div>
          <div className="-mt-1 text-[10px] leading-snug text-muted-foreground/80">
            {dailyScrumAt === 'start'
              ? 'Held first thing, so the Developers plan the day ahead. Ending a day takes you into the next day\u2019s Scrum.'
              : 'Held as the day closes, looking back on it.'}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground" title="How many items the Developers will have under way at once">Work in progress limit</span>
            {onSetWipLimit ? (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => onSetWipLimit(n)}
                    className={cn('rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                      wipLimit === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {n === 0 ? 'Off' : n}
                  </button>
                ))}
              </div>
            ) : <span className="text-[11px] font-medium">{wipLimit || 'Off'}</span>}
          </div>
          <div className="-mt-1 text-[10px] leading-snug text-muted-foreground/80">
            {wipLimit > 0
              ? `The Developers start no more than ${wipLimit} at once, and swarm to finish rather than starting more. Fewer things in flight means things actually finish.`
              : 'No limit: anything can be started at any time. Watch how much ends the Sprint unfinished.'}
            {' '}A WIP limit is Lean thinking, not part of Scrum - it is the Developers' own agreement.
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Days</span>
            <button type="button" onClick={() => onSetLearnMode(!learnMode)}
              title={learnMode ? 'Switch to timed days (Sprint pressure)' : 'Switch to learn mode (pause the clock)'}
              className="rounded-full border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/40">
              {learnMode ? 'Learn mode (paused)' : 'Timed'}
            </button>
          </div>
          {onCancelSprint && (
            // Rare, and deliberately out of the way: it is not an exit from a Sprint that is going
            // badly, it is for a Sprint Goal that has stopped being worth pursuing.
            <div className="border-t border-border pt-2">
              <button type="button"
                onClick={() => { if (window.confirm('Cancel this Sprint?\n\nOnly the Product Owner can, and only when the Sprint Goal has become obsolete - not because the Sprint is going badly.\n\nWork that is Done is kept and can still be released. Everything unfinished goes back to the Product Backlog to be re-estimated. A new Sprint starts straight away.')) onCancelSprint(); }}
                className="text-[11px] font-medium text-destructive/80 underline-offset-2 transition-colors hover:text-destructive hover:underline">
                Cancel the Sprint
              </button>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">The Product Owner&rsquo;s call, and only when the Sprint Goal is obsolete.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** How far ahead the Product Backlog is prepared, and the prompt to do something about it.
 *
 *  Refinement is ongoing work during the Sprint, done by the whole Scrum Team - so the game has to
 *  ask for it while the Sprint runs, not offer it as a tidy-up between Sprints. The chip is quiet
 *  when the Backlog is a Sprint or two ahead and speaks up when it is not, which is the whole
 *  lesson: you refine to keep the next Planning worth holding, and it costs today's build time. */
function RefineChip({ horizon, onOpen, planned }: { horizon: number; onOpen: () => void; planned?: { points: number; done: boolean } }) {
  const thin = horizon < 1, deep = horizon > 3;
  const owed = !!planned && !planned.done;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="How many Sprints of ready work are waiting"
          className={cn('flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
            owed ? 'border-violet-400 bg-violet-500/10 text-violet-700 dark:text-violet-300'
              : thin || deep ? 'border-amber-400/70 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-border bg-background text-muted-foreground hover:text-foreground')}>
          <ListChecks className="h-3.5 w-3.5" /> {owed ? 'Refinement planned' : `${horizon} ready`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Product Backlog refinement</h4>
          <p className="text-[12px] text-muted-foreground">
            About <strong>{horizon} Sprint{horizon === 1 ? '' : 's'}</strong> of ready work is waiting. Aim for one to three:
            enough that the next Sprint Planning has something to choose from, not so much that you are analysing work you
            may never build.
          </p>
          <p className="text-[12px] text-muted-foreground">
            {thin ? 'That is thin. Refine together now, or the next Planning will have nothing ready to forecast.'
              : deep ? 'That is a lot of detail on work that may change. Build something and learn from it instead.'
                : 'That is about right. Keep it there as this Sprint burns through the work.'}
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Refinement is ongoing work, done by the whole Scrum Team - the Product Owner brings why an item matters, the
            Developers bring what it would take and the size. It is not an event, and doing it now costs the day&rsquo;s
            build time. What it prepares is later Sprints, not this one.
          </p>
          {owed && (
            <p className="rounded-md border border-violet-400/50 bg-violet-500/10 px-2 py-1.5 text-[12px] text-violet-800 dark:text-violet-200">
              You set aside <strong>{planned!.points} point{planned!.points === 1 ? '' : 's'}</strong> for this at Sprint
              Planning and have not held it yet. It is on the board in To Do.
            </p>
          )}
          <Button size="sm" className="h-7 w-full px-2 text-xs" onClick={onOpen}>Refine the Product Backlog</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The Sprint board: To Do / Doing / Done, played over a run of timed days. Each day
 *  you take a committed item into the studio (Doing), build it to the Definition of
 *  Done, and open (release) it whenever you like; the day ends on the timer or when
 *  you call it, opening the Daily Scrum. After the last day's Daily Scrum the Review
 *  opens. The Product Backlog stays on the left to pull, add and refine items. */
export function SprintBoard({ state, onAddAnother, onEstimate, onToggleTask, onConfirmAc, onStartItem, onCancelSprint, onReorderSprint, onSetLearnMode, onSetWipLimit, onSetScrumAt, onPull, onSplitEpic, onAssignDev, onRenameMember, onOpen, onPlaceOnPark, onEndDay, onHoldDailyScrum, onSkipDailyScrum, onStartDay, onHoldRefinement, onBuilding, teachCard, onMarkTaught }: SprintBoardProps) {
  const setDesigning = onBuilding;
  // Open by default now that it sits at the top of the rail: the work flows Product Backlog to
  // Sprint Backlog to park, and a source you cannot see is not a source anyone reasons about. The
  // caveat that pulling more in is a negotiation, not a default, is written on it.
  const [showBacklog, setShowBacklog] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null); // refining an item mid-Sprint
  // In-progress design, kept here (the board stays mounted through the Daily Scrum)
  // so an unfinished animal survives the day ending and resumes the next day.
  const committed = state.backlog.filter((it) =>
    (it.sprintNumber === state.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'))
    // Unreleased Done work built in an earlier Sprint carries over here (not lost) until you open it.
    || (it.status === 'done' && it.sprintNumber !== state.sprintNumber)
    // ...and once you do release it, it belongs in this Sprint's Done column - it went live now,
    // even though it was built earlier. Without this it would drop off the board on deployment.
    || (it.status === 'open' && it.openedIn === state.sprintNumber),
  );
  const cut = Math.round((1 - state.dayTimeMult) * 100);

  // Columns follow the item's real state: To Do (not started) -> Doing (started: being
  // built in the studio and its tasks ticked off) -> Done (built AND every task ticked,
  // or already open). Starting an item is what moves it into Doing and opens the studio.
  const todo = committed.filter((it) => it.status === 'committed' && !it.started);
  const doing = committed.filter((it) => it.status === 'committed' && it.started);
  // Deploy = built to the Definition of Done, awaiting release; Done = deployed (live to visitors).
  const deploy = committed.filter((it) => it.status === 'done');
  const done = committed.filter((it) => it.status === 'open');
  const atWipLimit = activeWipLimit(state) > 0 && doing.length >= activeWipLimit(state);
  // Refinement planned in at topic three: on the board until somebody holds it.
  const sprintTotal = todo.length + doing.length + deploy.length + done.length;
  const refineTodo = !!state.sprintRefinement && !state.sprintRefinement.done;
  const refineDone = !!state.sprintRefinement?.done;
  // Ideas that waited for the Sprint where they matter introduce themselves in the Sprint they
  // arrive in, and then stop shouting.
  const fresh = state.sprintNumber === 2;
  const backlog = availableItems(state);
  const available = backlog.length; // shown on the collapsed tab, so it still tells you what is waiting
  const fixingItem = fixing ? backlog.find((i) => i.id === fixing) : null;
  // Same as Planning: the refine panel comes to you rather than opening somewhere off screen.
  const fixRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (fixing) fixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [fixing]);

  // Drag a card to the next column, as an alternative to its button. The columns are the
  // workflow, but a card's column is derived from its real state, so a drag runs the same
  // gated transition the button would: To Do -> Build starts it (needs the enclosure + WIP
  // room); Deploy -> Done places & opens it. Build -> Deploy stays in the studio - you can't
  // drag your way through building an animal - so that drop points you there. Buttons still work.
  const COLS = ['todo', 'doing', 'done'];
  const [drag, setDrag] = useState<{ id: string; from: string } | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);
  const dropOutcome = (from: string, to: string): 'start' | 'open' | 'studio' | 'far' | 'none' => {
    const fi = COLS.indexOf(from), ti = COLS.indexOf(to);
    if (ti <= fi) return 'none';
    if (ti > fi + 1) return 'far';
    if (from === 'todo') return 'start';
    return 'studio';
  };
  const canStart = (id: string) => { const it = todo.find((x) => x.id === id); return !!it && enclosureReady(state, it) && !atWipLimit; };
  // A built item goes live only once the Product Owner has signed it off, and they only sign off
  // when every acceptance criterion is met - which for the placement ones means after it is on the
  // park. You can't accept placement before you have placed it.
  const deployReady = (id: string) => {
    const it = deploy.find((x) => x.id === id);
    return !!it && !!it.placed && signOffReady(it) && !(it.tasks ?? []).some((t) => isSignOffTask(t.label) && !t.done);
  };
  const willSucceed = (from: string, to: string, id: string) => {
    const o = dropOutcome(from, to);
    return o === 'start' && canStart(id);
  };
  const handleDrop = (to: string) => {
    if (!drag) return;
    const { id, from } = drag;
    const o = dropOutcome(from, to);
    setDrag(null); setDropCol(null);
    if (o === 'start') {
      const it = todo.find((x) => x.id === id);
      if (!it) return;
      if (!enclosureReady(state, it)) { toast.error(`Build ${enclosureOf(state, it)?.name ?? 'its enclosure'} first - the animal goes in once its habitat is ready.`); return; }
      if (atWipLimit) { toast.error(`WIP limit ${activeWipLimit(state)} reached - finish something in Doing first.`); return; }
      onStartItem(id);
    } else if (o === 'studio') {
      toast('Build it on the park to finish it - it moves to Done once it is built and the plan is ticked off.');
    } else if (o === 'far') {
      toast('One column at a time - a card moves to the next stage, not past it.');
    }
  };
  const dragProps = (id: string, from: string) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch { /* some browsers */ } setDrag({ id, from }); },
    onDragEnd: () => { setDrag(null); setDropCol(null); },
  });
  const dropProps = (to: string) => ({
    onDragOver: (e: DragEvent) => { if (drag && drag.from !== to) { e.preventDefault(); if (dropCol !== to) setDropCol(to); } },
    onDragLeave: () => setDropCol((c) => (c === to ? null : c)),
    onDrop: (e: DragEvent) => { e.preventDefault(); handleDrop(to); },
  });
  const dropClass = (to: string) => (!drag || dropCol !== to ? '' : willSucceed(drag.from, to, drag.id) ? 'rounded-lg ring-2 ring-emerald-400' : 'rounded-lg ring-2 ring-amber-400');

  if (state.dayStage === 'dailyScrum') {
    return <DailyScrum state={state} onHold={onHoldDailyScrum} onSkip={onSkipDailyScrum} />;
  }
  const dayStarting = state.dayStage === 'dayStart';

  // A card that is Done but not yet open. It was built on the park, so it is already standing where
  // it will stand: what is left is confirming where that is, and opening it. "Deploy complete" was
  // the language of a column that no longer exists - this is releasing it to visitors.
  const deployActions = (it: BacklogItem) => {
    const deployAcs = it.acceptance.map((label, i) => ({ label, i })).filter((a) => isDeployAcceptance(a.label));
    const acsDone = deployAcs.every((a) => !!it.acConfirmed?.[a.i]);
    const ready = deployReady(it.id);
    const why = !it.placed ? 'Place it on the park first'
      : !acsDone ? 'Confirm its placement criteria on the park - the Product Owner signs off once every criterion is met'
      : !ready ? 'Waiting on the Product Owner\u2019s sign-off' : undefined;
    return <>
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onPlaceOnPark(it.id)}><MapPin className="mr-1 h-3.5 w-3.5" /> Show me on the park</Button>
      <Button size="sm" className="h-7 px-2 text-xs" disabled={!ready} title={why} onClick={() => onOpen(it.id)}><Check className="mr-1 h-3.5 w-3.5" /> Open it to visitors</Button>
      <Button size="sm" variant="ghost" className="h-7 px-1.5" title="Edit" onClick={() => setDesigning(it.id)}><Pencil className="h-3.5 w-3.5" /></Button>
      {it.category === 'exhibit' && <Button size="sm" variant="ghost" className="h-7 px-1.5" title={`Add another ${it.name.replace(/ \d+$/, '')} PBI`} onClick={() => onAddAnother(it.id)}><CopyPlus className="h-3.5 w-3.5" /></Button>}
    </>;
  };
  // Done column: deployed, live to visitors.
  const doneActions = (it: BacklogItem) => (
    <>
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Live to visitors</span>
      {it.category === 'exhibit' && <Button size="sm" variant="ghost" className="h-7 px-1.5" title={`Add another ${it.name.replace(/ \d+$/, '')} PBI`} onClick={() => onAddAnother(it.id)}><CopyPlus className="h-3.5 w-3.5" /></Button>}
    </>
  );

  return (
    <div className="relative flex min-h-full flex-1 flex-col gap-3">
      {/* One slim board toolbar: the day + the visible Scrum Team (left), and the burndown
          pulse, settings and End Day (right). Replaces the old stack of separate bands. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* The shell's header already says which Sprint and which day, and the dock says what
                this is - so on the canvas the board leads with its question and nothing else. */}
            <h2 className="text-base font-bold leading-tight tracking-tight">What can we finish today?</h2>
            <ScrumTeamStrip team={state.team} onRename={onRenameMember} compact />
            <ExplainButton cards={['sprint', 'sprint-backlog', 'daily-scrum']} phase="sprint" teachCard={teachCard} onMarkTaught={onMarkTaught} compact />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!dayStarting && revealed(state, 'burndown') && (
            <span className="flex items-center gap-1">
              <BurndownChip state={state} />
              {fresh && <NewHere title="A burndown">
                <p>How much of the forecast is left, day by day. It needed a Sprint behind it to be worth anything.</p>
                <p>It is a common practice, not part of Scrum - and it is for the Developers to see their own progress, not a report to anyone.</p>
              </NewHere>}
            </span>
          )}
          {!dayStarting && (
            <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setShowBacklog(true)}>
              <ClipboardList className="h-3.5 w-3.5" /> Product Backlog <span className="text-muted-foreground">({available})</span>
            </Button>
          )}
          {!dayStarting && <RefineChip horizon={readyHorizon(state)} planned={state.sprintRefinement} onOpen={() => setShowBacklog(true)} />}
          <BoardSettings dailyScrumAt={state.dailyScrumAt} learnMode={state.learnMode} wipLimit={state.wipLimit} onSetScrumAt={onSetScrumAt} onSetLearnMode={onSetLearnMode} onSetWipLimit={onSetWipLimit} onCancelSprint={onCancelSprint} />
        </div>
      </div>

      {dayStarting ? (
        <DayStart state={state} onStart={onStartDay} />
      ) : (
        <>
          {state.carriedImpediment && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">Yesterday's blocker landed on you: {state.carriedImpediment.title}</div>
                  <div className="text-sm text-amber-800/90 dark:text-amber-200/80">{state.carriedImpediment.detail} <span className="font-semibold">Today's build time is cut by ~{cut}%</span> while you deal with it.</div>
                  {state.carriedImpediment.tip && (
                    <div className="mt-1 text-xs italic text-amber-700/80 dark:text-amber-300/70">Tip: {state.carriedImpediment.tip}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* The board: Product Backlog (left) + To Do / Doing / Done columns. */}
          {/* The Product Backlog is there to pull from mid-Sprint, but the board is the thing you are
              working on - so it tucks away and gives the columns the whole width when you don't need it. */}
          {/* Three columns, left to right, in the order the work moves: the Product Backlog you pull
              from, the Sprint Backlog you pulled it into, and the park you build it on. */}
          {/* The Sprint Backlog fills the bottom of the half, laid out the way a board is: To Do,
              Doing, Done, left to right. The Product Backlog is not a column here - it is a panel
              you open when you want to pull something in, and close again. Most of a Sprint you are
              working the Sprint Backlog, and a permanent Product Backlog column beside it invites
              exactly the mid-Sprint scope creep the Guide asks you to negotiate rather than assume. */}
          <div className="mt-auto">
            <div className="min-w-0 space-y-2">
              <h3 className="text-sm font-semibold">Sprint Backlog <span className="font-normal text-muted-foreground">({sprintTotal})</span></h3>
              {atWipLimit && deploy.length === 0 && done.length === 0 && (
                <CoachTip>You&rsquo;re at your WIP limit with nothing built yet. Swarm to finish one item before starting more - a team delivers more by limiting work in progress, not by starting everything at once.</CoachTip>
              )}
              {/* Four equal columns at sm+ (a 2x2 grid on mobile) - uniform, whatever each holds. */}
              <div className="grid grid-cols-3 gap-2 items-start">
                <div {...dropProps('todo')} className={cn('min-w-0 transition-shadow', dropClass('todo'))}>
                <BoardColumn title="To Do" count={todo.length + (refineTodo ? 1 : 0)} hint="Everything is under way or done">
                  {refineTodo && (
                    // Refinement the Scrum Team put in the plan, sitting on the board like the work
                    // it is. It is not a Product Backlog item - nothing about it reaches a visitor -
                    // so it does not wear a PBI's clothes.
                    <div className="rounded-lg border-2 border-violet-400/70 bg-violet-500/[0.07] p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                            <ListChecks className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                            Refine the Product Backlog
                          </div>
                          <p className="text-[10px] text-muted-foreground">Planned into this Sprint &middot; the whole Scrum Team</p>
                        </div>
                        <Chip tone="teach">{state.sprintRefinement!.points} pt{state.sprintRefinement!.points === 1 ? '' : 's'}</Chip>
                      </div>
                      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                        It costs the day you hold it, and what it prepares is later Sprints. Skip it and the next
                        Planning has less to choose from.
                      </p>
                      <div className="mt-1.5 flex justify-end">
                        <Button size="sm" className="h-7 bg-violet-600 px-2 text-xs text-white hover:bg-violet-700"
                          onClick={() => { setShowBacklog(true); onHoldRefinement?.(); }}>
                          Hold it now
                        </Button>
                      </div>
                    </div>
                  )}
                  {todo.map((it, i) => {
                    // You build the habitat before its animals: an animal can't start until
                    // its enclosure is built.
                    const needsEnc = !enclosureReady(state, it);
                    const encName = enclosureOf(state, it)?.name ?? 'its enclosure';
                    const blocked = atWipLimit || needsEnc;
                    const why = needsEnc ? `Build ${encName} first - animals go in once their habitat is ready`
                      : atWipLimit ? `WIP limit ${activeWipLimit(state)} reached - finish something in Doing first` : undefined;
                    return (
                      <div key={it.id} {...dragProps(it.id, 'todo')} className="cursor-grab active:cursor-grabbing">
                      <PbiCard item={it} state="forecast" density="row"
                        badges={<Chip>{it.zone}</Chip>}
                        lead={onReorderSprint && todo.length > 1 && (
                          // The order to pick things up in is the Developers' plan, so they can change it.
                          <div className="flex shrink-0 flex-col items-center leading-none text-muted-foreground" title="Re-order what to pick up next">
                            <button type="button" title="Move up" aria-label={`Move ${it.name} up the Sprint Backlog`} disabled={i === 0}
                              onClick={(e) => { e.stopPropagation(); onReorderSprint(it.id, 'up'); }} className="disabled:opacity-30 hover:text-foreground"><ChevronUp className="h-3 w-3" /></button>
                            <button type="button" title="Move down" aria-label={`Move ${it.name} down the Sprint Backlog`} disabled={i === todo.length - 1}
                              onClick={(e) => { e.stopPropagation(); onReorderSprint(it.id, 'down'); }} className="disabled:opacity-30 hover:text-foreground"><ChevronDown className="h-3 w-3" /></button>
                          </div>
                        )}
                        note={needsEnc ? `Needs ${encName} built first` : undefined}
                        trailing={<Button size="sm" className="h-7 shrink-0 px-2 text-xs" disabled={blocked} title={why}
                          onClick={(e) => { e.stopPropagation(); onStartItem(it.id); setDesigning(it.id); }}><ArrowRight className="mr-1 h-3.5 w-3.5" /> Start</Button>}
                        detail={<CardDetail item={it} showAcceptance onToggleTask={onToggleTask} />} />
                      </div>
                    );
                  })}
                </BoardColumn>
                </div>
                <div {...dropProps('doing')} className={cn('min-w-0 transition-shadow', dropClass('doing'))}>
                <BoardColumn title="Doing" count={doing.length} limit={activeWipLimit(state) || undefined} hint="Nothing in progress"
                  note={fresh && revealed(state, 'wip') ? (
                    <NewHere title="A work-in-progress limit">
                      <p>The Developers start no more than {activeWipLimit(state)} items at once, and swarm to finish rather than starting more.</p>
                      <p>You have run a Sprint now, so it means something: things finish sooner when fewer are in flight. It is Lean thinking rather than part of Scrum, it is the Developers&rsquo; own agreement, and you can change or switch it off in board settings.</p>
                    </NewHere>
                  ) : undefined}>
                  {doing.map((it) => {
                    const left = (it.tasks ?? []).filter((t) => t.label.trim() && !t.done).length;
                    return (
                      <div key={it.id} {...dragProps(it.id, 'doing')} className="cursor-grab active:cursor-grabbing">
                      <PbiCard item={it} state="doing" density="row"
                        badges={<>
                          <Chip>{it.zone}</Chip>
                          {it.design
                            ? <Chip tone="coach">built{left ? ` · ${left} left` : ''}</Chip>
                            : <Chip tone="attention">in progress</Chip>}
                        </>}
                        trailing={<Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); setDesigning(it.id); }}><Palette className="mr-1 h-3.5 w-3.5" /> Build</Button>}
                        detail={<>
                          {/* Collapsed by default so the card stays one line - tap "Plan · AC" to see
                              and tick the detail. The real building happens on the park. */}
                          <CardDetail item={it} interactive showAcceptance built={!!it.design} onToggleTask={onToggleTask} onConfirmAc={onConfirmAc} />
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Working it:</span>
                            <AssignDevs team={state.team} assigned={it.assignedDevs ?? []} onToggle={(devId) => onAssignDev(it.id, devId)} />
                          </div>
                        </>} />
                      </div>
                    );
                  })}
                </BoardColumn>
                </div>
                <div {...dropProps('done')} className={cn('min-w-0 transition-shadow', dropClass('done'))}>
                <BoardColumn title="Done ✓" count={deploy.length + done.length + (refineDone ? 1 : 0)} hint="Nothing Done yet" tone="done">
                  {/* Done means it meets the Definition of Done. Whether it is OPEN to visitors is a
                      separate decision about the same card - you may release the moment it is Done,
                      or hold it. A whole column for "Done but not opened" said that badly: since the
                      building happens on the park, the card passed through it unseen. */}
                  {deploy.map((it) => (
                    <div key={it.id} {...dragProps(it.id, 'deploy')} className="cursor-grab active:cursor-grabbing">
                    <PbiCard item={it} state="built" density="row"
                      // Built in an earlier Sprint and still not released: say so, so a finished
                      // Increment waiting on deployment does not read as this Sprint's work.
                      badges={<>
                        <Chip>{it.zone}</Chip>
                        <Chip tone="attention">not open yet</Chip>
                        {it.sprintNumber !== null && it.sprintNumber !== state.sprintNumber && (
                          <Chip tone="coach" title={`Built in Sprint ${it.sprintNumber} and Done - it is waiting to be released, not work forecast for this Sprint`}>
                            built in Sprint {it.sprintNumber}
                          </Chip>
                        )}
                      </>}
                      detail={<>
                        <CardDetail item={it} interactive showAcceptance built onToggleTask={onToggleTask} onConfirmAc={onConfirmAc} />
                        <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">{deployActions(it)}</div>
                      </>} />
                    </div>
                  ))}
                  {refineDone && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/[0.06] px-2 py-1.5 text-[12px]">
                      <Check className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                      <span className="font-medium">Refined the Product Backlog</span>
                      <Chip tone="teach">{state.sprintRefinement!.points} pt{state.sprintRefinement!.points === 1 ? '' : 's'}</Chip>
                    </div>
                  )}
                  {done.map((it) => (
                    // data-done-card lets the delivery celebration burst confetti from this card.
                    <div key={it.id} data-done-card={it.id}>
                      <PbiCard item={it} state="live" density="row" badges={<Chip>{it.zone}</Chip>}
                        detail={<>
                          <CardDetail item={it} showAcceptance built onToggleTask={onToggleTask} />
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">{doneActions(it)}</div>
                        </>} />
                    </div>
                  ))}
                </BoardColumn>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pulling something in mid-Sprint is a negotiation, so it is something you go and do rather
          than something sitting open beside the work. The panel covers the left half while it is
          open and gets out of the way when it is not. */}
      {showBacklog && !dayStarting && (
        <div className="absolute inset-0 z-30 flex flex-col rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({available})</span></h3>
              <p className="text-[11px] text-muted-foreground">Pull one in by agreement, if it will not put the Sprint Goal at risk.</p>
            </div>
            <button type="button" onClick={() => setShowBacklog(false)} aria-label="Close the Product Backlog"
              className="shrink-0 rounded-md border border-border p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          {fixingItem && (
            <Workspace wide={fixingItem.category === 'epic'}
              title={fixingItem.category === 'epic' ? `Split ${fixingItem.name}` : `Size ${fixingItem.name}`}
              subtitle="Refining together costs the day's build time - what it prepares is later Sprints."
              onClose={() => setFixing(null)}>
              {fixingItem.category === 'epic'
                ? <SplitEpicPanel epic={fixingItem} onSplit={(ids) => { onSplitEpic(fixingItem.id, ids); setFixing(null); }} />
                : <PlanningPoker item={fixingItem} state={state} seed={state.gameSeed}
                  onCommit={(pts) => { onEstimate(fixingItem.id, pts); setFixing(null); }} />}
            </Workspace>
          )}
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
            {backlog.map((it) => (
              <PickCard key={it.id} item={it} why={notReady(it)} onPick={() => { onPull(it.id); setShowBacklog(false); }} onFix={() => setFixing(it.id)}
                note={"Refining now is the whole Scrum Team\u2019s work and costs the day\u2019s build time - what it prepares is later Sprints."} />
            ))}
          </div>
        </div>
      )}

      {/* The day ends from the same floating bar every other screen uses. Say which day's Daily
          Scrum is coming: held at the day's START it belongs to the NEXT day, which otherwise reads
          as though the Scrum is an end-of-day event. */}
      {!dayStarting && (
        <ActionBar>
          <Button onClick={onEndDay}>
            {state.dayNumber === state.sprintDays
              ? 'End day \u2192 Review'
              : state.dailyScrumAt === 'start'
                ? `End Day ${state.dayNumber} \u2192 Day ${state.dayNumber + 1} Scrum`
                : `End Day ${state.dayNumber} \u2192 its Scrum`}
          </Button>
        </ActionBar>
      )}


    </div>
  );
}
