import { useEffect, useState, type ReactNode } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { ParkView, type EditApi } from './ParkView';
import { DoneGate } from './DoneGate';
import { DayClock } from './DayClock';
import { SeatBand } from './SeatBand';
import { eventPill, goalLine } from './header';
import { inHandItem } from './engine';
import { ParkOptions } from './ParkOptions';
import { ParkInspector } from './ParkInspector';
import { footprintFor } from './design';
import { CANVAS_W, PLAY_H } from './parkLayout';
import { ParkPlan } from './ParkPlan';
import { DOCKED_BAR_H } from './ActionBar';
import { CopyEditor } from './CopyEditor';
import { TeachingCard } from './ScrumTeaching';
import { LearnDrawer, type Section as LearnSection } from './LearnDrawer';
import { CARDS_BY_PHASE, BACK_FROM } from './scrumContent';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { GameNotesProvider } from './GameNotes';
import type { GameNote } from './notesDock';
import type { SeatName } from './useZooSessions';
import { Target, Trees, ClipboardList, ListChecks, Save, FolderOpen, Sparkles, Loader2, MoreHorizontal, ChevronLeft, Gauge } from 'lucide-react';
import { FOCUS, SURFACE } from './ui/tokens';

/** The work tab's label per phase - what you are actually doing there. */




/** The game's own controls - save, resume - out of the way of the Scrum. */
function GameMenu({ onSave, onOpenSaves, onMeasures, links, tools }: { onSave?: () => void; onOpenSaves?: () => void; onMeasures?: () => void; links?: ReactNode; tools?: ReactNode }) {
  if (!onSave && !onOpenSaves && !links && !onMeasures && !tools) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Game" aria-label="Game menu"
          className={cn(FOCUS, SURFACE.inset, 'shrink-0 p-1.5 text-muted-foreground hover:text-foreground')}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56">
        <div className="space-y-0.5">
          {tools}
          {/* The four key value measures. They are reference during a Sprint - they have their
              answers at the Review - so they live behind a menu rather than on the band. */}
          {onMeasures && (
            <button type="button" onClick={onMeasures} className={cn(FOCUS, "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/60")}>
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" /> Value measures
            </button>
          )}
          {onSave && (
            <button type="button" onClick={onSave} className={cn(FOCUS, "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/60")}>
              <Save className="h-3.5 w-3.5 text-muted-foreground" /> Save this game
            </button>
          )}
          {onOpenSaves && (
            <button type="button" onClick={onOpenSaves} className={cn(FOCUS, "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/60")}>
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Saved games
            </button>
          )}
          {links}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The Product Backlog when it is not the screen you are on: what is in it, in the Product Owner's
 *  order, so it can be read at any time without leaving what you were doing.
 *
 *  Read-only on purpose. Ordering and refining are the Product Owner's work at Refinement, and
 *  during a Sprint they cost the Developers time - so they belong to a screen that can say so,
 *  not to a glance. */
function BacklogGlance({ state }: { state: ZooGameState }) {
  const items = state.backlog.filter((it) => it.status === 'backlog');
  const ready = items.filter((it) => !it.unsized).length;
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">Product Backlog</h2>
        <span className="text-xs text-muted-foreground">{items.length} items · {ready} sized</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Everything the product might need, in the Product Owner's order. Pulling from it mid-Sprint
        is a negotiation, and it costs the Developers build time.
      </p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate">{it.name}</span>
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">{it.zone}</span>
            {it.epicMembers?.length
              ? <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">epic</span>
              : <span className="shrink-0 tabular-nums text-xs font-semibold text-muted-foreground">{it.unsized ? '?' : it.estimate}</span>}
          </li>
        ))}
        {!items.length && <li className="px-2.5 py-3 text-sm text-muted-foreground">Nothing in it yet.</li>}
      </ul>
    </section>
  );
}

/** The Sprint Backlog when it is not the screen you are on - or before there is one at all. */
function SprintBacklogGlance({ state, locked }: { state: ZooGameState; locked: boolean }) {
  const inSprint = state.backlog.filter((it) => it.status === 'committed' || (it.status !== 'backlog' && it.sprintNumber === state.sprintNumber));
  if (locked) {
    return (
      <section className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">There is no Sprint Backlog yet.</p>
        <p className="mt-1">The Developers make one at Sprint Planning: what they forecast, and their plan for
          delivering it. Until then this artifact does not exist - which is why the tab is locked rather than empty.</p>
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">Sprint Backlog</h2>
        <span className="text-xs text-muted-foreground">Sprint {state.sprintNumber} · {inSprint.length} items</span>
      </div>
      {state.sprintGoal && <p className="text-sm"><span className="font-semibold">Sprint Goal:</span> {state.sprintGoal}</p>}
      <ul className="divide-y divide-border rounded-lg border border-border">
        {inSprint.map((it) => (
          <li key={it.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate">{it.name}</span>
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">{it.status}</span>
          </li>
        ))}
        {!inSprint.length && <li className="px-2.5 py-3 text-sm text-muted-foreground">Nothing forecast.</li>}
      </ul>
    </section>
  );
}

/** Which artifact you are looking at. */
export type ArtifactTab = 'backlog' | 'sprint' | 'increment';

function Tab({ active, onClick, icon: Icon, label, badge, locked }: { active: boolean; onClick: () => void; icon: typeof Target; label: string; badge?: string; locked?: string }) {
  return (
    <button type="button" onClick={locked ? undefined : onClick} disabled={!!locked} title={locked}
      aria-current={active ? 'page' : undefined}
      // Drawn as tabs: an outlined shape that the active one joins to the screen below it. They were
      // three words with an underline, which reads as a menu rather than as three artifacts you are
      // standing in front of.
      className={cn(FOCUS, 'relative -mb-px flex items-center gap-1.5 rounded-t-lg border-2 px-3 py-1.5 text-sm font-semibold transition-colors',
        locked ? 'cursor-not-allowed border-transparent text-muted-foreground/45'
          : active ? 'border-border border-b-background bg-background text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground')}>
      <Icon className="h-4 w-4" /> {label}
      {/* The lock is written on the tab. "Sprint Backlog" greyed out with no reason is a dead
          control; with the reason on it, it is the rule being taught. */}
      {locked && <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium normal-case">{locked}</span>}
      {!locked && badge && <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">{badge}</span>}
    </button>
  );
}

/** The app-shell: a fixed-height frame (no page scroll) with a slim header - phase, Sprint
 *  Goal, and the game controls collapsed into one row plus tabs - over a body that fills the
 *  screen and scrolls INTERNALLY. Built to fit a tablet without scrolling the page. */
export function ZooShell({ state, children, parkTab, onSetTab, links, menuLinks, backlogTab, onReading, onCommitBuild, onTurn, onSetMemberSpot, onMoveInside, onSetClockPaused,  onWho, tools,  onPutIn, onAskToCheck, canBuild = true, building, onOpenBuild, edit,  drawRoute, drawing, onDrawing,  onPlaceItem,  onAddConnector, onRemoveRun,         onSetSize,      onSetDod, onSetDor, onSetProductGoal, onSave, onOpenSaves, onPoRefine, poRefining, poNote, onDismissPoNote, said, onDismissSaid, refused, onDismissRefused, onSetTeaching, onMarkTaught, onBack, copy, seat = null, observer, covering }: { state: ZooGameState; children: ReactNode; onPart?: (p: { id: string; key: string } | null) => void; drawRoute?: { id: string; name: string; style: { thickness: number; color: string } } | null; drawing?: boolean; onDrawing?: (on: boolean) => void; parkTab?: ArtifactTab; onSetTab?: (t: ArtifactTab) => void;
  /** Whether there is anything in hand to build - Build with empty hands is not a state. */
  canBuild?: boolean;
  /** The way back to the site and who is signed in, handed in rather than reached for: the shell
   *  should not need to know there is such a thing as signing in. */
  links?: ReactNode;
  /** ...and what belongs in the game menu rather than the strip: signing in, and who is signed in. */
  menuLinks?: ReactNode;
  /** What this screen hangs on the strip beside Learn - for a Sprint, the burndown, the help and
   *  the board settings. */
  tools?: ReactNode;
  /** The Developers say when something is ready for the Product Owner to look at. */
  onAskToCheck?: (id: string) => void;
  /** An animal goes into the habitat chosen for it in the takeover. */
  onPutIn?: (id: string, enclosureId: string) => void;
  /** A hand on the clock, or off it. */
  onSetClockPaused?: (paused: boolean) => void;
  onWho?: (why: string) => void;
  /** Somebody is reading what the game said, or has stopped. A solo game stops its clock while they
   *  are: the Sprint's time is for building, and charging a learner for reading what the game chose
   *  to tell them is the game punishing its own teaching. */
  onReading?: (reading: boolean) => void;
  /** The Product Backlog tab when the Refinement screen is not on it: the list and the bench that
   *  works on it, handed in by the page because the shell holds no game handlers of its own. */
  /** Dropping a thing on the park is the moment it exists: the draft becomes the item's design.
   *  Until this ran, a habitat somebody had plainly built had nothing anybody could accept. */
  onCommitBuild?: (id: string) => void;
  backlogTab?: ReactNode; building?: string | null; onOpenBuild?: (id: string | null) => void; edit?: EditApi; onStartHere?: (id: string, pos: { x: number; y: number }) => void; onPlaceItem?: (id: string, pos: { x: number; y: number }) => void; onTurn?: (id: string, rot: number) => void; onMoveInside?: (id: string, kind: 'water' | 'flora', index: number, spot: { x: number; y: number }) => void; onSetPathStyle?: (key: string) => void; onAddConnector?: (c: ZooConnector) => void; onRemoveRun?: (connectorId: string) => void; onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void; onDeleteConnector?: (id: string) => void; deployMode?: string | null; deployStyle?: { thickness: number; color: string } | null; deployAcs?: { index: number; label: string; confirmed: boolean; placement: boolean }[]; onFinishDeploy?: () => void; onImprove?: (id: string) => void; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void; onSetSize?: (id: string, size: { w: number; h: number }) => void; onSetRot?: (id: string, rot: number) => void; onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void; onRemoveCopy?: (id: string, index: number) => void; onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onSetDod?: (dod: string[]) => void; onSetDor?: (dor: string[]) => void; onSetProductGoal?: (goal: string) => void; onSave?: () => void; onOpenSaves?: () => void; onPoRefine?: () => void; poRefining?: boolean; poNote?: string | null; onDismissPoNote?: () => void; said?: { id: number; seat: string; says: string; also: number }[]; onDismissSaid?: (id: number) => void; refused?: string | null; onDismissRefused?: () => void; onSetTeaching?: (on: boolean) => void; onMarkTaught?: (id: string) => void; onBack?: (phase: string) => void; copy?: { overrides: Record<string, string>; onChanged: (key: string, value: string) => void }; seat?: SeatName | null; observer?: boolean; covering?: SeatName[] }) {
  // The navigation is the three artifacts. A learner who can name the tabs can name the artifacts,
  // which is most of what this game is for - so Product Backlog, Sprint Backlog and Increment are
  // the whole of it, and there is no tab called Build or Sprint. Building is the Sprint Backlog in
  // use, and Sprint Planning is the first thing IN the Sprint, so neither earns a tab of its own.
  //
  // Controlled from above when something outside decides which artifact you are looking at -
  // Inspect goes to the Increment - and owned here otherwise.
  const [localTab, setLocalTab] = useState<ArtifactTab>('sprint');
  const open = state.backlog.filter((it) => it.status === 'open').length;
  // Locked until there is one. The Sprint Backlog is made at Planning; before that the tab says so
  // rather than opening on an empty board, because an empty artifact and an artifact that does not
  // exist yet are different things.
  const sprintBacklog = state.phase !== 'intro' && state.phase !== 'brief' && state.phase !== 'refine';
  /** Where each screen lives. The events are takeovers OVER their tab, not tabs of their own. */
  const home: ArtifactTab = state.phase === 'refine' || state.phase === 'brief' || state.phase === 'intro' ? 'backlog'
    : state.phase === 'review' ? 'increment' : 'sprint';
  const setTab = onSetTab ?? setLocalTab;
  // An artifact that does not exist yet cannot be the one you are looking at, whoever asked for it.
  const wanted = parkTab ?? localTab;
  const tab: ArtifactTab = wanted === 'sprint' && !sprintBacklog ? 'backlog' : wanted;
  /** An event fills the screen over the tab it belongs to: Planning and the Retrospective over the
   *  Sprint Backlog, the Review over the Increment. Tabs are artifacts; events are moments. */
  // The park follows the work: beside the item while it is being built, on its own tab otherwise.
  // The Sprint Backlog tab is one screen: the board, whatever is in your hands, and the park you are
  // building it on, all at once.
  //
  // It was two states with a switch between them - Plan and Build - and the switch was reported as
  // confusing. It was: the board and the thing you are building are the same work, and hiding
  // either of them to show the other made you flip back and forth to answer one question.
  const onSprint = tab === 'sprint' && state.phase === 'sprint';
  const takeover = state.phase === 'planning' || state.phase === 'review' || state.phase === 'retro';
  // The game moves you to the artifact it is about: Refinement to the Product Backlog, a Sprint to
  // the Sprint Backlog, the Review to the Increment. You can go anywhere from there; this only says
  // where each part of the game starts, so nobody arrives at a screen behind the wrong tab.
  useEffect(() => { setTab(home); }, [state.phase, home, setTab]);
  // Two states of the Sprint Backlog tab, decided by what the learner is doing rather than by a
  // toggle. Nothing in hand: the board at full width, no park. Something in hand: the park takes
  // the width and the board becomes a column of tokens beside it.
  const inHand = onSprint && state.dayStage !== 'dailyScrum' ? inHandItem(state, building ?? null) : null;
  /** The item the Done gate is about: whatever is in hand, once there is something to judge. */
  const gateItem = state.phase === 'sprint' && building
    ? state.backlog.find((it) => it.id === building && (it.status === 'committed' || it.status === 'done'))
    : undefined;

  // The next thing worth explaining here, if the teaching is on and it has not been read yet.
  const back = BACK_FROM[state.phase];
  // Every event screen carries its own teaching inside the "?" beside its question, so the shell
  // does not also stack a card above it. Nothing is said twice.
  const teachCard = (state.teaching ?? true) && !['refine', 'planning', 'sprint', 'review', 'retro'].includes(state.phase)
    ? (CARDS_BY_PHASE[state.phase] ?? []).find((id) => !(state.taught ?? []).includes(id))
    : undefined;

  // Everything the game has to say, newest first, handed to the dock in the corner so it rides in
  // the same pill as the button that moves you on. A refusal is the teaching, the Product Owner's
  // account of a refinement is a long read, and what a seat played by the game did is commentary -
  // three registers, one place, never over the work.
  // Is the Sprint Goal safe, and if it is not, what the two ways out of it are. Only during a
  // Sprint: before one there is nothing to be at risk, and after it the Review has the answer.
  // Where the Learn drawer has been sent from outside it - the value measures, from the game menu.
  const [learnAt, setLearnAt] = useState<LearnSection | null>(null);
  // What is following the cursor, waiting to be put down on the park.
  /** Something already standing that you have picked up again to put down somewhere else. */
  const [moving, setMoving] = useState<string | null>(null);
  // Which habitat the park is zoomed into, so its inside can be worked on at a size you can see.
  // "Back to the park" zooms out. This replaces the takeover: there is no window over the park any
  // more, and nothing is built anywhere else.
  const [inside, setInside] = useState<string | null>(null);
  const insideItem = inside ? state.backlog.find((it) => it.id === inside) ?? null : null;

  // Pick a card and the thing is in your hands: it follows the cursor until you put it down. There
  // is no dialog to open and no button to press first - "the object appears as a ghost under the
  // cursor, drop it, it is now built, not Done". A path is drawn rather than dropped, and anything
  // already standing is only picked up again by choosing Move.
  // Derived, not stored: something is in your hands when it has been picked up and is not standing
  // anywhere yet, or when you have said Move. Keeping it in state meant an effect that corrected
  // itself after every render.
  const placingId = moving ?? (inHand && edit && inHand.category !== 'path' && !inHand.pos ? inHand.id : null);
  /** Which corner to dock the inspector in: the one furthest from the thing you are working on, so
   *  what it is telling you about is never underneath it. */
  const farthestCorner = (it: { pos?: { x: number; y: number } }): 'tl' | 'tr' | 'bl' | 'br' => {
    const at = it.pos ?? { x: CANVAS_W / 2, y: PLAY_H / 2 };
    const corner = `${at.y > PLAY_H / 2 ? 't' : 'b'}${at.x > CANVAS_W / 2 ? 'l' : 'r'}` as 'tl' | 'tr' | 'bl' | 'br';
    // ...never bottom right, whatever is selected: the day's dock floats there, and two things in
    // one corner means one of them cannot be read or pressed.
    return corner === 'br' ? 'bl' : corner;
  };

  const pill = eventPill(state);
  const goal = goalLine(state);

  const notes: GameNote[] = [];
  if (refused) notes.push({ id: 'refused', title: 'Whose call it is', tone: 'rule', body: refused, text: refused, onDismiss: onDismissRefused });
  if (poNote) notes.push({ id: 'refinement', title: 'Refinement session · the Scrum Team', text: poNote, body: <span className="whitespace-pre-line">{poNote}</span>, onDismiss: onDismissPoNote });
  for (const one of said ?? []) {
    notes.push({
      id: `said-${one.id}`, title: `${one.seat.replace('_', ' ')} (AI)`, tone: 'team', dismissLabel: 'ok', text: one.says,
      onDismiss: () => onDismissSaid?.(one.id),
      body: <>{one.says}{one.also > 0 && <div className="mt-1 text-muted-foreground">and {one.also} more like it</div>}</>,
    });
  }

  return (
    <GameNotesProvider notes={notes} onReading={onReading}>
    <div className="zoo-theme flex h-full flex-col bg-background">
      {/* Where you are, on one dark band; the artifacts themselves are the white below it. */}
      <header className="shrink-0 border-b border-border px-2 pt-1.5 sm:px-3">
        {/* The strip, in the order the learner needs it.
            
            It carried twelve pills of equal weight: four dials with no values, two drawer buttons, a
            help icon, a wordmark, the clock, the goal, the seat, the phase. When nothing is bigger,
            nothing is important - and the one element that decides what to do next was the same size
            as an abbreviation nobody had explained.
            
            So: where you are, small. The clock, big, with a bar that empties. Whether the Goal is
            safe, in one line, with the Goal itself under it in small type. Then one button: Learn.
            Everything that is words went behind it. */}
        <div className="zoo-band -mx-2 mb-1.5 flex items-center gap-3 px-2 py-2 sm:-mx-3 sm:px-3">
          {/* The mark is the way back to the site: it says whose game this is and does the wordmark's
              job in a fifth of the room. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {links}
            {back && (
              'blocked' in back
                ? (
                  <span title={back.blocked} className="flex shrink-0 cursor-help items-center rounded-md border border-white/25 p-1 opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                ) : onBack && (
                  <button type="button" onClick={() => onBack(back.to)} title={back.label} aria-label={back.label}
                    className={cn(FOCUS, 'flex shrink-0 items-center rounded-md border border-white/25 p-1 opacity-80 transition-opacity hover:opacity-100')}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )
            )}
            {/* Where you are, in the words the event uses for itself - and orange while an event is
                running, because an event is a moment and a working day is not. It replaces the seat
                chip, the phase label and the day counter, which said three parts of one thing. */}
            <span data-part="event-pill"
              className={cn('rounded-full px-3 py-1 text-base font-bold leading-tight',
                pill.event ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white')}>
              {pill.text}
            </span>
          </div>

          {/* The clock, dead centre and the biggest thing on the strip. */}
          <div className="flex flex-1 justify-center"><DayClock state={state} onPause={onSetClockPaused} /></div>

          {/* Is the Sprint Goal safe. The answer in bold, from the Sprint's own arithmetic; the Goal
              itself in small type under it, opening in full when you ask for it. */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" data-part="goal-line" title={state.sprintGoal.trim() || 'No Sprint Goal yet - agree one at Planning'}
                className={cn(FOCUS, 'hidden min-w-0 max-w-[26rem] shrink flex-col items-start overflow-hidden rounded-md px-1 py-0.5 text-left hover:bg-white/10 lg:flex')}>
                {/* One line, cut off where it runs out of room. The Goal is longer than the verdict
                    it replaced at Planning, and it was running underneath the Learn button. */}
                <span className={cn('w-full truncate text-sm font-bold leading-tight', goal.risk && 'text-amber-300')}>{goal.line}</span>
                {/* The Goal itself under the verdict - and nothing where there is no Goal, rather
                    than the same sentence twice in two weights. */}
                {state.sprintGoal.trim() && !goal.isGoal && (
                  <span className="w-full truncate text-[11px] opacity-80">{state.sprintGoal.trim()}</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(92vw,32rem)]">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Sprint Goal{state.phase === 'sprint' ? ` \u00b7 Sprint ${state.sprintNumber}` : ''}
              </div>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {state.sprintGoal.trim() || 'No Sprint Goal yet - the Scrum Team agrees one at Sprint Planning.'}
              </p>
              {state.sprintGoal.trim() && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  The single objective for the Sprint. It is the commitment of the Sprint Backlog, and it
                  does not change while the Sprint runs - what is built to meet it can.
                </p>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Refinement belongs where refinement happens: shaping the Backlog before the first
                Sprint, and adapting it at the Review. Not in Sprint Planning, which forecasts from
                the Backlog rather than changing it, and not mid-Sprint, where the Developers refine
                on the board and it costs the day's build time. It stays in the strip because it is
                work rather than words. */}
            {onPoRefine && (state.phase === 'refine' || state.phase === 'review') && (
              <button type="button" onClick={onPoRefine} disabled={poRefining}
                title="Hold a Product Backlog refinement session: the Product Owner brings value and order, the Developers bring what is too big, unclear or dependent on something else. Sizing stays yours - you are the Developers - and nothing here touches a Sprint Goal you have agreed."
                className={cn(FOCUS, 'flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-2 py-1 text-xs font-medium hover:bg-white/20 disabled:opacity-60')}>
                {poRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">{poRefining ? 'Refining together\u2026' : 'Refine with the Scrum Team'}</span>
                <span className="md:hidden">{poRefining ? '\u2026' : 'Refine'}</span>
              </button>
            )}
            {/* One button for everything the game can explain. It replaced Artifacts, Scrum, the four
                dials and the help icons - each of those is a section in it now. */}
            <LearnDrawer state={state} notes={notes} teaching={state.teaching ?? true} onSetTeaching={onSetTeaching} onReading={onReading}
              openAt={learnAt} onOpenAt={setLearnAt}
              onSetProductGoal={onSetProductGoal} onSetDod={onSetDod} onSetDor={onSetDor} />
            {/* Polishing the teaching happens while playing, so the editor lives here rather than
                in an admin screen. Admins only - it renders nothing for everyone else. */}
            {copy && <CopyEditor phase={state.phase} overrides={copy.overrides} onChanged={copy.onChanged} />}
            {/* The settings that were icons on the strip live in here now: they are set once, and a
                gear beside the clock was a control competing with the thing it sits next to. */}
            <GameMenu onSave={onSave} onOpenSaves={onOpenSaves} onMeasures={() => setLearnAt('value')} links={menuLinks} tools={tools} />
          </div>
        </div>

        {/* The three artifacts, in the order work moves through them - and, at the end of the row,
            which state the Sprint Backlog is in. The switch used to live on the board itself, where
            it wrapped from one side to the other as the pane narrowed: the same control in two
            places depending on which state you were in. It is a property of the tab, so it rides on
            the tab row, in one place, on both states. */}
        <div data-part="tab-row" className="mt-1 flex items-end gap-1 border-b-2 border-border">
          <Tab active={tab === 'backlog'} onClick={() => setTab('backlog')} icon={ClipboardList} label="Product Backlog" />
          <Tab active={tab === 'sprint'} onClick={() => setTab('sprint')} icon={ListChecks} label="Sprint Backlog"
            locked={sprintBacklog ? undefined : 'made at Planning'} />
          {/* Naming it matters: the park is the PRODUCT, and what each Sprint adds to it is an
              Increment. A learner who never connects the two is playing a building game. */}
          <Tab active={tab === 'increment'} onClick={() => setTab('increment')} icon={Trees} label="Increment" badge={open ? String(open) : undefined} />
        </div>
      </header>

      {/* The band: who does what now, and what each of the five is doing. The accountabilities were
          invisible - a row of name chips that said nothing about what any of them were for. */}
      <SeatBand state={state} seat={seat} covering={covering} observer={observer} onWho={onWho} />

      {/* Body: one artifact at a time, filling the width. Each pane stays mounted and is toggled
          with CSS, so the day clock, a half-finished design and the park's own scroll all survive
          a look at another artifact. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* The Product Backlog. Before the first Sprint this is where the Backlog is written and
            the three agreements are made; during a Sprint it is what you pull from, and pulling
            costs the Developers time. */}
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab !== 'backlog' && 'hidden')}>
          {/* Wide, because this tab is two panes now - the artifact and the bench that works on it.
              A 1024px column on a 1440px screen made the bench a column of wrapped words. */}
          <div className="mx-auto max-w-[1600px] space-y-3 pb-24">
            {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
            {/* The artifact is a place you can work, whatever else is going on. Refinement is the
                screen on this tab before the first Sprint; for the rest of the game the tab is the
                bench, because refinement is ongoing work and not a phase in front of the Sprints.
                The read-only glance is what is left when nobody handed a bench in. */}
            {home === 'backlog' && !takeover ? children : (backlogTab ?? <BacklogGlance state={state} />)}
          </div>
        </div>

        {/* The Sprint Backlog: the board, and the studio when something is in hand. Full width,
            because this is the artifact the Sprint is worked through. */}
        <div className={cn('flex h-full min-h-0 flex-col overflow-hidden px-2 py-3 sm:px-3', tab !== 'sprint' && 'hidden')}>
          {/* The work on the left, the park on the right, for the whole Sprint. There is only ever one
              park in the game, so while it is here the Increment tab does without it rather than
              drawing a second one: two isometric scenes rebuilding every second is a slow game. */}
          {/* Both halves are exactly the height of the pane, so neither can push the other off the
              screen: the board scrolls in its columns, what is being asked scrolls in its panel, and
              the park stays where it is. Reported from a live game - a full To Do column pushed the
              messages and the studio off the bottom of it. */}
          <div className={cn('flex min-h-0 w-full flex-1 flex-col gap-3',
            onSprint ? 'max-w-none xl:grid xl:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch'
              : 'mx-auto max-w-[1600px] pb-24')}>
            {home === 'sprint' && !takeover ? children : <SprintBacklogGlance state={state} locked={!sprintBacklog} />}
            {onSprint && (
              <div className="relative flex min-h-0 min-w-0 flex-col rounded-lg border-2 border-border bg-card p-2">
                {/* Placement, and nothing else: the object itself is built in the takeover.
                    Straight down, because a metre is a metre wherever it is on the screen and a
                    thing is where you drop it. The isometric view is the zoo as a visitor meets it,
                    and it lives on the Increment tab where nobody is trying to build in it. */}
                {/* Above the park, not under it. The day's dock floats over the bottom right corner
                    and covered whichever group ended up there - "the main navigation button
                    obscures the build menus". Nothing floats over the top. */}
                {edit && canBuild && (
                  <ParkOptions className="mb-2 shrink-0 border-b border-border pb-2" state={state}
                    item={inHand ?? null} inside={insideItem ?? null}
                    drawing={drawing} onDrawing={onDrawing}
                    api={{
                      onDesign: edit.onDesign,
                      onAddInside: edit.onAddInside,
                      onSetEnclosure: edit.onSetEnclosure,
                      onTurn,
                      onUnplace: (id) => setMoving(id),
                      onSetSize,
                      onPutIn,
                      onInside: (id) => setInside(id),
                      onRemoveRun,
                    }} />
                )}
                {/* Room at the foot for the day's dock, so the park stops above it rather than
                    running underneath. It is fixed to the bottom right of the window and the park is
                    the right-hand pane, so it lay over the one corner you draw a run into: "the
                    navigation button obscures the park and cannot draw a path properly". The same
                    measure every other pane leaves for it. */}
                <div className="relative min-h-0 flex-1 overflow-hidden"
                  style={{ paddingBottom: DOCKED_BAR_H }}>
                  {/* What it has to be, docked on the park rather than in a window over it. Inside a
                      habitat it collapses to a pill, because in there the whole picture is the pen. */}
                  {inHand && (inHand.acceptance ?? []).length > 0 && (
                    <ParkInspector state={state} item={insideItem ?? inHand} collapsed={!!insideItem} quiet={drawing}
                      corner={insideItem ? 'tl' : farthestCorner(inHand)} onAskToCheck={onAskToCheck} />
                  )}
                  <ParkPlan state={state} height={620} selected={building ?? null} inside={inside}
                    // Picking a thing up on the park opens it, the way picking its card up does.
                    // Reported from playing it: "when I click the bridge it does not automatically
                    // open - I have to click the card." Once something had been kept as a draft or
                    // placed, the takeover stayed shut however often you pressed the thing itself.
                    onSelect={(id) => onOpenBuild?.(id)}
                    onPlaceItem={onPlaceItem} onSetSize={onSetSize} onTurn={onTurn} onSetMemberSpot={onSetMemberSpot} onMoveInside={onMoveInside}
                    placing={placingId && inHand ? { id: placingId, ...footprintFor(inHand) } : null}
                    onPlace={(id, pos, _drawn, into) => {
                      // An animal dropped inside a habitat moves in; everything else stands where
                      // it was dropped. Both are the same gesture - carry it and let go.
                      if (into) { onPutIn?.(id, into); setMoving(null); return; }
                      onCommitBuild?.(id); onPlaceItem?.(id, pos); setMoving(null);
                    }}
                    tool={drawing ? 'path' : 'none'} pathStyle={drawRoute?.style}
                    runFor={inHand?.category === 'path' ? inHand.id : undefined}
                    onAddConnector={onAddConnector}
                    onAskToCheck={onAskToCheck} />
                </div>

                {/* Everything is built on the park. One strip under it says what the selected thing
                    has, whether it was put down a moment ago or a Sprint ago - building something
                    and changing it later are the same act, so they are the same controls. */}
                {/* How a thing gets made is the Developers'. A Product Owner watching sees the park
                    and what the work has to be, and no controls. */}
              </div>
            )}
          </div>
        </div>

        {/* The Increment: the park, all the time, at the width it deserves. */}
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', (tab !== 'increment' || onSprint) && 'hidden')}>
          <div className={cn('flex min-h-0 gap-3', gateItem ? 'flex-col xl:flex-row' : '')}>
            <div className="min-w-0 flex-1">
            {/* A picture, not a drawing board. The Increment is the zoo as a visitor meets it, so
                nothing here edits anything: what it offers is walking round it and looking closer.
                Building happens from above, on the Sprint Backlog tab. */}
            <ParkView state={state} large focus increment />
            </div>
            {/* The Done gate stands beside the thing it is judging. This is where the item was
                placed and where the park's evidence comes from, so it is where the question
                "is it Done?" is worth asking. */}
            {gateItem && (
              <DoneGate state={state} item={gateItem} className="w-full shrink-0 xl:w-[26rem]" />
            )}
          </div>
        </div>

        {/* An event is a moment, not an artifact: it dims the tab it belongs to and fills the
            screen over it. You can still see which artifact it is about behind it. */}
        {/* Room at the foot for the action bar, which floats over the window rather than sitting in
            the flow. Without it the last card on an event screen - the Sprint Goal verdict at the
            Review - sits under the button that takes you onward, and scrolling does not help,
            because the bottom of the page is where the button is. */}
        {/* An event fills the screen it takes over: the whole width, and the whole height, so what
            it has to say fits on it. It was a column down the middle of a wide screen with the room
            either side of it left empty, which put half of a Sprint Review below the fold. */}
        {takeover && (
          <div data-part="takeover" className="absolute inset-0 z-30 flex bg-background/80 p-2 pb-20 backdrop-blur-sm sm:p-3 sm:pb-20">
            <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-background p-3 shadow-xl">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
    </GameNotesProvider>
  );
}
