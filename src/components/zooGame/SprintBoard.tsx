import { useState, useEffect, useRef } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft } from './types';
import type { ItemDesign } from './design';
import { openZoo, enclosureReady, enclosureOf } from './engine';
import { DAY_SECONDS } from './config';
import { DesignStudio, type CopySource } from './DesignStudio';
import { DailyScrum } from './DailyScrum';
import { ProductBacklogSidebar, BoardColumn, ItemCard, TaskChecklist } from './Board';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Palette, DoorOpen, Check, AlertTriangle, Clock, Pencil, CopyPlus, Sunrise, ArrowRight } from 'lucide-react';

interface SprintBoardProps {
  state: ZooGameState;
  onBuild: (id: string, design?: ItemDesign) => void;
  onEditBuild: (id: string, design: ItemDesign) => void;
  onAddAnother: (id: string) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onSetUseStories: (on: boolean) => void;
  onToggleTask: (id: string, taskId: string) => void;
  onStartItem: (id: string) => void;
  onSetEnclosure: (id: string, size: 'small' | 'medium' | 'large') => void;
  onSetLearnMode: (on: boolean) => void;
  onSetScrumAt: (at: 'start' | 'end') => void;
  onPull: (id: string) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onOpen: (id: string) => void;
  onEndDay: () => void;
  onHoldDailyScrum: () => void;
  onSkipDailyScrum: () => void;
  onStartDay: () => void;
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

/** The countdown for a single timed day. Runs while the day is being worked; when it
 *  reaches zero the day ends and the Daily Scrum opens. When a day is shortened -
 *  by the Daily Scrum's timebox, or (much more) by a blocker that slipped through -
 *  it says so, so the cost of impediments is obvious. */
function DayTimer({ dayNumber, dayTimeMult, refinePenalty, impeded, learnMode, onExpire }: { dayNumber: number; dayTimeMult: number; refinePenalty: number; impeded: boolean; learnMode: boolean; onExpire: () => void }) {
  const total = Math.round(DAY_SECONDS * dayTimeMult);
  const [left, setLeft] = useState(total);
  const fired = useRef(false);
  const spent = useRef(0); // refinement seconds already deducted this day

  // Reset for each new day (dayNumber changes) and count down once per second. In learn
  // mode the clock is paused - no countdown and no auto-expire, so you end days yourself.
  useEffect(() => {
    fired.current = false;
    spent.current = 0;
    setLeft(total);
    if (learnMode) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!fired.current) { fired.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // total is derived from dayNumber+dayTimeMult; reset on a genuinely new day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber, learnMode]);

  // Refining the Backlog mid-Sprint spends build time: deduct the new refinement seconds
  // from the clock as they accrue (the interval below picks up the expiry within a tick).
  useEffect(() => {
    const delta = refinePenalty - spent.current;
    spent.current = refinePenalty;
    if (delta > 0) setLeft((s) => Math.max(0, s - delta));
  }, [refinePenalty]);

  if (learnMode) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
        <Clock className="h-3 w-3" /> Learn mode - clock paused, end days yourself
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const low = pct <= 25;
  const cut = Math.round((1 - dayTimeMult) * 100);
  return (
    <div className="w-full max-w-[240px]">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Day time</span>
        <span className={cn('tabular-nums', low && 'text-red-600 dark:text-red-400')}>{mm}:{ss}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-linear', impeded ? 'bg-red-500' : low ? 'bg-red-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      {dayTimeMult < 1 && (
        <div className={cn('mt-1 text-[10px] font-semibold', impeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`}
        </div>
      )}
      {refinePenalty > 0 && (
        <div className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">−{refinePenalty}s: refining the Backlog this Sprint</div>
      )}
    </div>
  );
}

/** The Sprint board: To Do / Doing / Done, played over a run of timed days. Each day
 *  you take a committed item into the studio (Doing), build it to the Definition of
 *  Done, and open (release) it whenever you like; the day ends on the timer or when
 *  you call it, opening the Daily Scrum. After the last day's Daily Scrum the Review
 *  opens. The Product Backlog stays on the left to pull, add and refine items. */
export function SprintBoard({ state, onBuild, onEditBuild, onAddAnother, onAddPbi, onRefinePbi, onSetUseStories, onToggleTask, onStartItem, onSetEnclosure, onSetLearnMode, onSetScrumAt, onPull, onSplitEpic, onOpen, onEndDay, onHoldDailyScrum, onSkipDailyScrum, onStartDay }: SprintBoardProps) {
  const [designing, setDesigning] = useState<string | null>(null);
  // In-progress design, kept here (the board stays mounted through the Daily Scrum)
  // so an unfinished animal survives the day ending and resumes the next day.
  const [draft, setDraft] = useState<{ id: string; design: ItemDesign } | null>(null);
  const committed = state.backlog.filter((it) =>
    (it.sprintNumber === state.sprintNumber && (it.status === 'committed' || it.status === 'done' || it.status === 'open'))
    // Unreleased Done work built in an earlier Sprint carries over here (not lost) until you open it.
    || (it.status === 'done' && it.sprintNumber !== state.sprintNumber),
  );
  const open = openZoo(state);
  const designItem = designing ? committed.find((it) => it.id === designing) : null;
  const editing = !!designItem && designItem.status !== 'committed';
  const cut = Math.round((1 - state.dayTimeMult) * 100);

  // Columns follow the item's real state: To Do (not started) -> Doing (started: being
  // built in the studio and its tasks ticked off) -> Done (built AND every task ticked,
  // or already open). Starting an item is what moves it into Doing and opens the studio.
  const todo = committed.filter((it) => it.status === 'committed' && !it.started);
  const doing = committed.filter((it) => it.status === 'committed' && it.started);
  const done = committed.filter((it) => it.status === 'done' || it.status === 'open');
  const atWipLimit = doing.length >= state.wipLimit;

  // Built animals you can copy from when designing another of the same kind.
  const copySources: CopySource[] = designItem
    ? state.backlog.filter((it) => it.id !== designItem.id && it.category === designItem.category && it.design).map((it) => ({ id: it.id, name: it.name, design: it.design! }))
    : [];

  if (state.dayStage === 'dailyScrum') {
    return <DailyScrum state={state} onHold={onHoldDailyScrum} onSkip={onSkipDailyScrum} />;
  }
  const dayStarting = state.dayStage === 'dayStart';

  const doneActions = (it: BacklogItem) => (
    <>
      {it.status === 'done' && <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onOpen(it.id)}><DoorOpen className="mr-1 h-3.5 w-3.5" /> Open</Button>}
      {it.status === 'open' && <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Open</span>}
      <Button size="sm" variant="ghost" className="h-7 px-1.5" title="Edit" onClick={() => setDesigning(it.id)}><Pencil className="h-3.5 w-3.5" /></Button>
      {it.category === 'exhibit' && <Button size="sm" variant="ghost" className="h-7 px-1.5" title={`Add another ${it.name.replace(/ \d+$/, '')} PBI`} onClick={() => onAddAnother(it.id)}><CopyPlus className="h-3.5 w-3.5" /></Button>}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Build &middot; Day {state.dayNumber} of {state.sprintDays}</h2>
          <p className="text-xs text-muted-foreground">{open.length} open to visitors</p>
        </div>
        {/* The clock runs through the start-of-day breather and the build alike. */}
        <div className="flex items-center gap-2">
          <DayTimer key={state.dayNumber} dayNumber={state.dayNumber} dayTimeMult={state.dayTimeMult} refinePenalty={state.refinePenalty} impeded={!!state.carriedImpediment} learnMode={state.learnMode} onExpire={onEndDay} />
          <button type="button" onClick={() => onSetScrumAt(state.dailyScrumAt === 'start' ? 'end' : 'start')}
            title="When the Daily Scrum is held each day"
            className="rounded-full border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
            Daily Scrum: {state.dailyScrumAt === 'start' ? 'start of day' : 'end of day'}
          </button>
          <button type="button" onClick={() => onSetLearnMode(!state.learnMode)}
            title={state.learnMode ? 'Switch to timed days (Sprint pressure)' : 'Switch to learn mode (pause the clock)'}
            className="rounded-full border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">
            {state.learnMode ? 'Timed mode' : 'Learn mode'}
          </button>
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
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <ProductBacklogSidebar state={state} mode="sprint" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
              onSetUseStories={onSetUseStories} onPull={onPull} onSplitEpic={onSplitEpic} />

            <div className="min-w-0 space-y-3">
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
                <strong>Start</strong> an item to move it into <strong>Doing</strong> - up to the <strong>WIP limit of {state.wipLimit}</strong>, so you finish work before starting more. Then <strong>Design &amp; build</strong> it in the studio and tick off its plan; when the build is done and every task is ticked it moves to <strong>Done</strong>, ready to open to visitors.
              </p>
              {atWipLimit && done.length === 0 && (
                <CoachTip>You&rsquo;re at your WIP limit with nothing Done yet. Swarm to finish one item before starting more - a team delivers more by limiting work in progress, not by starting everything at once.</CoachTip>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <BoardColumn title="To Do" count={todo.length} hint="Everything is under way or done">
                  {todo.map((it) => {
                    // You build the habitat before its animals: an animal can't start until
                    // its enclosure is built.
                    const needsEnc = !enclosureReady(state, it);
                    const encName = enclosureOf(state, it)?.name ?? 'its enclosure';
                    const blocked = atWipLimit || needsEnc;
                    const why = needsEnc ? `Build ${encName} first - animals go in once their habitat is ready`
                      : atWipLimit ? `WIP limit ${state.wipLimit} reached - finish something in Doing first` : undefined;
                    return (
                      <ItemCard key={it.id} item={it}
                        subtitle={<>
                          <div className="mt-1 text-[10px] text-muted-foreground">Meet: {it.acceptance.join(', ')}</div>
                          {needsEnc && <div className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">Needs {encName} built first</div>}
                          <TaskChecklist item={it} onToggle={onToggleTask} readOnly />
                        </>}
                        actions={<Button size="sm" className="h-7 px-2 text-xs" disabled={blocked} title={why} onClick={() => onStartItem(it.id)}><ArrowRight className="mr-1 h-3.5 w-3.5" /> Start</Button>} />
                    );
                  })}
                </BoardColumn>
                <BoardColumn title="Doing" count={doing.length} limit={state.wipLimit} hint="Nothing in progress">
                  {doing.map((it) => {
                    const left = (it.tasks ?? []).filter((t) => t.label.trim() && !t.done).length;
                    return (
                      <ItemCard key={it.id} item={it}
                        badge={it.design
                          ? <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">built{left ? ` · ${left} task${left === 1 ? '' : 's'} left` : ''}</span>
                          : <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">in progress</span>}
                        subtitle={<TaskChecklist item={it} onToggle={onToggleTask} />}
                        actions={<Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDesigning(it.id)}><Palette className="mr-1 h-3.5 w-3.5" /> {it.design ? 'Edit design' : 'Design & build'}</Button>} />
                    );
                  })}
                </BoardColumn>
                <BoardColumn title="Done ✓" count={done.length} hint="Nothing built yet" tone="done">
                  {done.map((it) => (
                    <ItemCard key={it.id} item={it} className={it.status === 'open' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : undefined}
                      subtitle={<TaskChecklist item={it} onToggle={onToggleTask} readOnly />}
                      actions={doneActions(it)} />
                  ))}
                </BoardColumn>
              </div>
            </div>
          </div>
        </>
      )}

      {/* The studio opens as a modal OVER the board, so the Scrum board stays in view
          (the card sits in Doing behind it) while you build. */}
      {designItem && !dayStarting && (
        <div className="fixed inset-0 z-40 flex overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
          <div className="m-auto w-full max-w-3xl">
            <DesignStudio
              item={designItem}
              dod={state.definitionOfDone}
              editing={editing}
              copySources={copySources}
              onSetEnclosure={(size) => onSetEnclosure(designItem.id, size)}
              initial={draft && draft.id === designItem.id ? draft.design : undefined}
              onChange={(d) => setDraft({ id: designItem.id, design: d })}
              onFinish={(d) => { if (editing) onEditBuild(designItem.id, d); else onBuild(designItem.id, d); setDesigning(null); setDraft(null); }}
              onCancel={() => setDesigning(null)}
            />
          </div>
        </div>
      )}

      {!dayStarting && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur">
          <span className="text-xs font-medium text-muted-foreground">Definition of Done: {state.definitionOfDone.length} criteria</span>
          <Button size="sm" onClick={onEndDay}>
            {state.dayNumber === state.sprintDays ? 'End last day → Review' : `End Day ${state.dayNumber} → Daily Scrum`}
          </Button>
        </div>
      )}
    </div>
  );
}
