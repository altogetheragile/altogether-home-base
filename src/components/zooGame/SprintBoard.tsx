import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ZooGameState, BacklogItem, PbiDraft, ImpedimentAnswer } from './types';
import { isDesignDone, presetFor } from './design';
import { enclosureReady, enclosureOf, availableItems, notReady, revealed, activeWipLimit, whyNothingMoves, PLACEMENT_CHOICES, isSignOffTask, waitingOn, whoIs } from './engine';
import { NewHere } from './NewHere';
import { ActionBar } from './ActionBar';
import { MEMBER_DRAG } from './ScrumTeam';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DailyScrum } from './DailyScrum';
import { BoardColumn, CategoryIcon, SplitEpicPanel } from './Board';
import { CardDialog } from './CardDialog';
import { Workspace } from './ui/Workspace';
import { Chip } from './ui/Chip';
import { PickCard } from './PickCard';
import { PbiEditor } from './PbiEditor';
import { Toolbox } from './Toolbox';
import { toolboxDraft } from './toolboxItems';
import type { EditApi } from './ParkView';
import type { SeatName } from './useZooSessions';
import { PlanningPoker } from './PlanningPoker';
import { CoachTip } from './CoachTip';
import { Button } from '@/components/ui/button';
import { Boxes, MessageCircleQuestion, FilePlus, Check, AlertTriangle, Sunrise, ListChecks, X, Clock } from 'lucide-react';
import { EYEBROW, FOCUS, TONE } from './ui/tokens';

interface SprintBoardProps {
  state: ZooGameState;
  onEstimate: (id: string, points: number) => void;
  onToggleTask: (id: string, taskId: string) => void;
  /** Accepting a criterion, on the card the criterion belongs to. */
  onConfirmAc: (id: string, index: number, value: boolean) => void;
  /** The message centre, rendered under the board: the game's one action channel. */
  rail?: ReactNode;
  /** Not accepting what was built. The Product Owner's call, so the board only offers it. */
  onSendBack?: (id: string) => void;
  /** Move it to Done: built, standing where it stands, and open to visitors. */
  onFinishItem: (id: string) => void;
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
  /** Take work back out of the Sprint Backlog: the Developers protecting the Sprint Goal. */
  onDropFromSprint?: (id: string) => void;
  /** Answer the Developers' question about where something goes. */
  onAnswerPlacement?: (id: string, choice: string) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onAssignDev: (itemId: string, devId: string) => void;
  onRenameMember: (memberId: string, name: string) => void;
  onOpen: (id: string) => void;
  /** Ask the Product Owner to look at built work. Offered on the card as well as on the park:
   *  "how does Priya approve the last AC?" is not a question the pill was answering. */
  onAskToCheck?: (id: string) => void;
  onEndDay: () => void;
  onHoldDailyScrum: () => void;
  /** What the Scrum Master does about what surfaced at the Daily Scrum. */
  onAnswerImpediment?: (how: ImpedimentAnswer) => void;
  onSkipDailyScrum: () => void;
  onStartDay: () => void;
  /** Hold the refinement the Scrum Team planned into this Sprint at topic three. */
  onHoldRefinement?: () => void;
  /** Selecting an item on the park, so starting one takes you straight to building it there. */
  onBuilding: (id: string | null) => void;
  /** The item currently on the bench - the same selection the park highlights. */
  building?: string | null;
  /** Design controls for it. Given, the bench appears under the board and the park stops floating
   *  a toolbar over the thing it is about. */
  edit?: EditApi;
  part?: { id: string; key: string } | null;
  onPart?: (p: { id: string; key: string } | null) => void;
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  onRemoveRun?: (connectorId: string) => void;
  /** Write a new Product Backlog item while refining mid-Sprint. */
  onAddPbi?: (draft: PbiDraft) => void;
  onSetUserStories?: (on: boolean) => void;
  /** The Product Owner's look-ahead: add what the forecast implies, or turn it down. */
  onAddProposal?: (draft: PbiDraft) => void;
  onDeclineProposal?: (proposalId: string) => void;
  /** Whether this player holds the Developers' work: a solo player holds all three, and a Product
   *  Owner sitting with real Developers holds none of it. The bench follows it. */
  canBuild?: boolean;
  /** Which accountability is looking, so what is asked of them comes first. */
  seat?: SeatName | null;
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

/** A card on the board: name, points, who is on it, and a dot for each step of its plan.
 *
 *  It used to carry the plan, the criteria, the reasons, and two buttons. Four of those in a column
 *  is a wall, and you cannot watch work move through a wall. Everything else is one click away in
 *  the card dialog, which is the only place an item's detail lives now. */
function BoardCard({ item, state, tone, note, waiting, onOpen }: {
  item: BacklogItem;
  state: ZooGameState;
  tone?: 'doing' | 'done' | 'live';
  /** One quiet line where the game owes a reason - why this cannot start yet, mostly. */
  note?: string;
  /** Whose answer this card is waiting on, where one is outstanding. */
  waiting?: string | null;
  onOpen: () => void;
}) {
  const steps = (item.tasks ?? []).filter((t) => t.label.trim() && !isSignOffTask(t.label));
  const devs = state.team.developers.filter((d) => (item.assignedDevs ?? []).includes(d.id));
  return (
    <button type="button" onClick={onOpen} data-part="board-card"
      title={`${item.name} - open it`}
      className={cn(FOCUS, 'w-full rounded-lg border-2 bg-card px-3 py-2 text-left transition-colors hover:border-primary/70',
        tone === 'doing' ? 'border-primary/70'
          : tone === 'done' ? 'border-emerald-500/60'
            : tone === 'live' ? 'border-emerald-600/70 bg-emerald-500/[0.06]' : 'border-border')}>
      <div className="flex items-start gap-2">
        <CategoryIcon item={item} className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">{item.estimate}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {/* A dot per step, filled as the Developers work through them. It is the whole of the plan
            that belongs on a board: how far along, not what the steps say. */}
        <span className="flex items-center gap-1">
          {steps.map((t) => (
            <span key={t.id} className={cn('h-2 w-2 rounded-full', t.done ? 'bg-emerald-500' : 'bg-muted-foreground/25')} />
          ))}
        </span>
        {devs.length > 0 && (
          <span className="ml-auto flex items-center -space-x-1.5">
            {devs.map((d) => (
              <span key={d.id} title={d.name}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-sky-600 text-[9px] font-bold text-white">
                {d.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </div>
      {/* Somebody is waiting on an answer about this card, and everybody can see who. */}
      {waiting && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
          <Clock className="h-3 w-3" /> waiting on {waiting}
        </p>
      )}
      {note && <p className={cn(TONE.attention.text, 'mt-1 text-[11px] leading-snug')}>{note}</p>}
    </button>
  );
}

/** The Sprint board: To Do / Doing / Done, played over a run of timed days. Each day
 *  you take a committed item into the studio (Doing), build it to the Definition of
 *  Done, and open (release) it whenever you like; the day ends on the timer or when
 *  you call it, opening the Daily Scrum. After the last day's Daily Scrum the Review
 *  opens. The Product Backlog stays on the left to pull, add and refine items. */
export function SprintBoard({ state, rail,  onEstimate,    onFinishItem, onStartItem,   onPull, onDropFromSprint, onAnswerPlacement, onSplitEpic, onAssignDev, onOpen, onAskToCheck, onToggleTask,  onEndDay, onHoldDailyScrum, onAnswerImpediment, onSkipDailyScrum, onStartDay, onHoldRefinement, onBuilding,        onAddPbi, onSetUserStories,     }: SprintBoardProps) {
  const setDesigning = onBuilding;
  // Which item's dialog is open. Detail lives there now: the board carries four things per card.
  const [cardId, setCardId] = useState<string | null>(null);
  // ...and which item has just been pulled into Doing and is waiting for somebody to take it.
  const [pulling, setPulling] = useState<string | null>(null);
  // Open by default now that it sits at the top of the rail: the work flows Product Backlog to
  // Sprint Backlog to park, and a source you cannot see is not a source anyone reasons about. The
  // caveat that pulling more in is a negotiation, not a default, is written on it.
  const [showBacklog, setShowBacklog] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null); // refining an item mid-Sprint
  const [writing, setWriting] = useState(false);              // writing a new one, mid-Sprint
  const [showToolbox, setShowToolbox] = useState(false);
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
  const dropOutcome = (from: string, to: string): 'start' | 'finish' | 'studio' | 'far' | 'none' => {
    const fi = COLS.indexOf(from), ti = COLS.indexOf(to);
    if (ti <= fi) return 'none';
    if (ti > fi + 1) return 'far';
    if (from === 'todo') return 'start';
    if (from === 'doing') return 'finish';
    return 'studio';
  };
  const canStart = (id: string) => { const it = todo.find((x) => x.id === id); return !!it && enclosureReady(state, it) && !atWipLimit; };
  // A built item goes live only once the Product Owner has signed it off, and they only sign off
  // when every acceptance criterion is met - which for the placement ones means after it is on the
  // Everything the Definition of Done asks of this item: it is built, the Developers' plan is
  // ticked, and the Product Owner's criteria are accepted. The sign-off task follows the criteria
  // rather than being ticked by hand, so it is not part of the gate.
  const readyForDone = (it: BacklogItem) =>
    isDesignDone(it, it.draftDesign ?? it.design ?? presetFor(it))
    && (it.acceptance ?? []).every((_, i) => !!it.acConfirmed?.[i])
    // The whole plan, sign-off included. It ticks itself once every criterion is accepted, so this
    // is not an extra hoop - it is the reason the card cannot reach Done without the Product Owner.
    && (it.tasks ?? []).filter((t) => t.label.trim()).every((t) => t.done);
  // What is left, in words, so the card itself says why it cannot move rather than hiding it in a
  // tooltip nobody sees on a tablet.
  const whyNotDone = (it: BacklogItem) => {
    if (!isDesignDone(it, it.draftDesign ?? it.design ?? presetFor(it))) return 'Next: build it on the park';
    const left = (it.acceptance ?? []).filter((_, i) => !it.acConfirmed?.[i]).length;
    if (left) return `Next: accept ${left} more criteri${left === 1 ? 'on' : 'a'}`;
    const task = (it.tasks ?? []).find((t) => t.label.trim() && !t.done);
    return task ? `Next: ${task.label.toLowerCase()}` : 'Next: finish the plan';
  };
  const willSucceed = (from: string, to: string, id: string) => {
    const o = dropOutcome(from, to);
    if (o === 'start') return canStart(id);
    if (o === 'finish') { const it = doing.find((x) => x.id === id); return !!it && readyForDone(it); }
    return false;
  };
  /** Why the last drop came back, and which card it came back to. On the card rather than in a
   *  toast: a toast about a card you are looking at is a second place to look, and it is gone by
   *  the time you have read it. */
  const [refusedMove, setRefusedMove] = useState<{ id: string; why: string } | null>(null);
  const refuse = (id: string, why: string) => setRefusedMove({ id, why });
  const handleDrop = (to: string) => {
    if (!drag) return;
    const { id, from } = drag;
    const o = dropOutcome(from, to);
    setDrag(null); setDropCol(null);
    if (o === 'start') {
      const it = todo.find((x) => x.id === id);
      if (!it) return;
      if (!enclosureReady(state, it)) { refuse(id, `${enclosureOf(state, it)?.name ?? 'Its enclosure'} has to be built first - the animal goes in once its habitat is ready.`); return; }
      if (atWipLimit) { refuse(id, `Work in progress is limited to ${activeWipLimit(state)}. Finish something in Doing before starting this.`); return; }
      setRefusedMove(null);
      onStartItem(id);
      // Who takes it is the Developers' own call, asked on the drop rather than assumed. Nobody
      // assigns work here: the question is which of them is picking this up, and more than one may.
      setPulling(id);
    } else if (o === 'finish') {
      const it = doing.find((x) => x.id === id);
      if (!it) return;
      if (!readyForDone(it)) { refuse(id, `${whyNotDone(it).replace(/^Next: /, 'Not Done yet. ')}.`); return; }
      setRefusedMove(null);
      onFinishItem(id);
    } else if (o === 'studio') {
      toast('Build it on the park to finish it - it moves to Done once it is built and the plan is ticked off.');
    } else if (o === 'far') {
      toast('One column at a time - a card moves to the next stage, not past it.');
    }
  };
  /** The note a refused card carries, under the card itself. */
  const cameBack = (id: string) => (refusedMove?.id === id ? (
    <div role="status" className="mt-1 flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-[11px] text-destructive">
      <X className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{refusedMove.why}</span>
    </div>
  ) : null);
  /** A person dropped on a card takes that work. The card is draggable itself - that is how work
   *  moves between columns - so the payload is prefixed and anything else falls through to the
   *  column's own handler. */
  const takeProps = (itemId: string) => ({
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('text/plain')) e.preventDefault();
    },
    onDrop: (e: DragEvent) => {
      const raw = e.dataTransfer?.getData('text/plain') ?? '';
      if (!raw.startsWith(MEMBER_DRAG)) return;      // a card being moved: let the column have it
      e.preventDefault();
      e.stopPropagation();
      onAssignDev(itemId, raw.slice(MEMBER_DRAG.length));
    },
  });
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

  // What the Developers have asked about, if anything.
  const asked = state.pendingPlacement
    ? state.backlog.find((it) => it.id === state.pendingPlacement!.itemId) ?? null : null;
  const dayStarting = state.dayStage === 'dayStart';
  // The item just pulled into Doing, waiting for the Developers to say who is on it.
  const pulled = pulling ? state.backlog.find((it) => it.id === pulling) ?? null : null;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-3">
      {/* The board starts at the top of its pane. The help button, the burndown and the settings
          used to sit here in two rows of their own, above the columns: a band of empty space
          between the tabs and the work. They are the game's tools rather than the board's, so they
          ride on the strip beside Learn, and the play space is the play space. */}
      {/* Everything but the day bar scrolls in here, inside the half, so the half itself never grows
          past the window and the bench stays pinned to its foot. The bench covers the last stretch
          of it, which the padding at the end gives back: a card at the bottom of To Do can always be
          scrolled out from behind it. */}
      {/* In Plan this scrolls under a bench pinned to the foot, so it reserves the bench's height.
          In Build the bench is the content, so the pane shrinks to what is in it - otherwise the
          studio is pushed to the bottom of an empty screen. */}
      {/* Room at the foot for the floating action bar - but only where the bar is actually over
          this pane. Beside the park it floats over the park, and the space it was given here was
          64px of nothing under the message centre and the bench. */}
      <div className={cn('flex min-h-0 flex-1 gap-3 pb-16 pr-0.5 xl:pb-0',
        state.dayStage === 'dailyScrum' ? 'flex-row' : 'flex-col')}>
      <div className={cn('flex min-h-0 flex-col gap-3',
        state.dayStage === 'dailyScrum' ? 'flex-[2]' : 'flex-1')}>
      {dayStarting ? (
        <DayStart state={state} onStart={onStartDay} />
      ) : (
        <>
          {state.carriedImpediment && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={cn(TONE.attention.text, "mt-0.5 h-5 w-5 shrink-0")} />
                <div>
                  <div className={cn(TONE.attention.text, "text-sm font-semibold")}>Yesterday's blocker landed on you: {state.carriedImpediment.title}</div>
                  <div className={cn(TONE.attention.text, "text-sm")}>{state.carriedImpediment.detail} <span className="font-semibold">Today's build time is cut by ~{cut}%</span> while you deal with it.</div>
                  {state.carriedImpediment.tip && (
                    <div className={cn(TONE.attention.text, "mt-1 text-xs italic")}>Tip: {state.carriedImpediment.tip}</div>
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
          {/* The height runs all the way down to the columns. These two wrappers used to be plain
              blocks, so the board sized itself to its cards and pushed what is being asked and the
              thing in your hands off the bottom of the screen - reported from a live game with a
              full To Do column. */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-2">
              {/* The tab says which artifact this is; in Build the item in hand is the heading. */}

              {/* The Developers have a question, and it is above the board because a question you
                  have to go looking for is a question nobody answers. Where a habitat or a
                  building goes is what a visitor meets and in what order, so it is the Product
                  Owner's - and they get on with it if nobody answers, which costs you the say. */}
              {asked && onAnswerPlacement && (
                <div className="rounded-lg border-2 border-primary/50 bg-primary/5 px-3 py-2.5">
                  <div className={cn(EYEBROW, 'mb-1 flex items-center gap-1.5 text-primary')}>
                    <MessageCircleQuestion className="h-3.5 w-3.5" /> The Developers are asking
                  </div>
                  <p className="mb-2 text-sm">
                    Where should <strong>{asked.name}</strong> go? It is what visitors walk up to, so it is your call.
                    They will place it themselves if you would rather not say.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLACEMENT_CHOICES.map((c) => (
                      <Button key={c.key} size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => onAnswerPlacement(asked.id, c.key)}>{c.label}</Button>
                    ))}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                      onClick={() => onAnswerPlacement(asked.id, 'them')}>You choose</Button>
                  </div>
                </div>
              )}

              {atWipLimit && deploy.length === 0 && done.length === 0 && (
                <CoachTip>You&rsquo;re at your WIP limit with nothing built yet. Swarm to finish one item before starting more - a team delivers more by limiting work in progress, not by starting everything at once.</CoachTip>
              )}
              {/* In Build the board stands down: what is in your hands gets the screen, which is the
                  whole point of the switch. The goal band stays either way - it is what both states
                  are for. */}

              {/* Four columns, in the order work moves: what you could pull from, what you have not
                  started, what is in hand, and what is Done. The Product Backlog was a panel you
                  opened - which hid the cost of a mid-Sprint pull behind a button. It is a rail
                  again, deliberately: the pull should be visible, and it should look like a
                  negotiation rather than a menu. */}
              {/* One outlined region per thing, so the screen reads as areas rather than as a wall
                  of cards: the board here, what is being asked below it, the park beside both. */}
              {/* One row, exactly as tall as the region: the columns scroll inside it. Without the
                  explicit row the cells took their content's height and the region clipped them,
                  so a card lower down the column could not be reached at all. */}
              <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-2 overflow-hidden rounded-lg border-2 border-border p-2 md:grid-cols-3">
                <div {...dropProps('todo')} className={cn('flex min-h-0 min-w-0 flex-col transition-shadow', dropClass('todo'))}>
                <BoardColumn title="To Do" count={todo.length + (refineTodo ? 1 : 0)} hint="Everything is under way or done">
                  {refineTodo && (
                    // Refinement the Scrum Team put in the plan, sitting on the board like the work
                    // it is. It is not a Product Backlog item - nothing about it reaches a visitor -
                    // so it does not wear a PBI's clothes.
                    <div className="rounded-lg border-2 border-violet-400/70 bg-violet-500/[0.07] p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            <ListChecks className={cn(TONE.teach.text, "h-3.5 w-3.5 shrink-0")} />
                            Refine the Product Backlog
                          </div>
                          <p className="text-[11px] text-muted-foreground">Planned into this Sprint &middot; the whole Scrum Team</p>
                        </div>
                        <Chip tone="teach">{state.sprintRefinement!.points} pt{state.sprintRefinement!.points === 1 ? '' : 's'}</Chip>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        It costs the day you hold it, and what it prepares is later Sprints. Skip it and the next
                        Planning has less to choose from.
                      </p>
                      <div className="mt-1.5 flex justify-end">
                        <Button size="sm" className={cn(TONE.teach.solid, "h-7 px-2 text-xs text-white hover:bg-violet-700")}
                          onClick={() => { setShowBacklog(true); onHoldRefinement?.(); }}>
                          Hold it now
                        </Button>
                      </div>
                    </div>
                  )}
                  {todo.map((it) => {
                    // You build the habitat before its animals: an animal can't start until
                    // its enclosure is built.
                    const needsEnc = !enclosureReady(state, it);
                    const encName = enclosureOf(state, it)?.name ?? 'its enclosure';
                    const blocked = atWipLimit || needsEnc;
                    const why = needsEnc ? `Build ${encName} first - animals go in once their habitat is ready`
                      : atWipLimit ? `WIP limit ${activeWipLimit(state)} reached - finish something in Doing first` : undefined;
                    return (
                      <div key={it.id} {...dragProps(it.id, 'todo')} {...takeProps(it.id)} className="cursor-grab active:cursor-grabbing">
                      {cameBack(it.id)}
                      <BoardCard item={it} state={state} note={needsEnc ? `Needs ${encName} built first` : blocked ? why : undefined}
                        onOpen={() => setCardId(it.id)} />
                      </div>
                    );
                  })}
                  {/* Available through the day, not only during the Daily Scrum. The event is a
                      takeover now, so a drop target behind it could not be reached - and handing
                      work back is a negotiation with the Product Owner, which Scrum does not
                      restrict to one fifteen-minute window anyway. */}
                  {onDropFromSprint && (
                    <div data-part="hand-it-back"
                      onDragOver={(e) => { if (drag) e.preventDefault(); }}
                      onDrop={(e) => { e.preventDefault(); if (drag) { onDropFromSprint(drag.id); setDrag(null); setDropCol(null); } }}
                      className="mt-1 rounded-lg border-2 border-dashed border-amber-400/70 bg-amber-500/[0.06] px-2.5 py-2 text-[11px]">
                      <span className="font-semibold text-amber-700 dark:text-amber-300">Hand it back</span>
                      <span className="block text-muted-foreground">
                        Drop something here to return it to the Product Backlog. The Product Owner is told, and the points
                        come back out of the forecast.
                      </span>
                    </div>
                  )}
                </BoardColumn>
                </div>
                <div {...dropProps('doing')} className={cn('flex min-h-0 min-w-0 flex-col transition-shadow', dropClass('doing'))}>
                <BoardColumn title="Doing" count={doing.length} limit={activeWipLimit(state) || undefined} hint="Nothing in progress"
                  note={fresh && revealed(state, 'wip') ? (
                    <NewHere title="A work-in-progress limit">
                      <p>The Developers start no more than {activeWipLimit(state)} items at once, and swarm to finish rather than starting more.</p>
                      <p>You have run a Sprint now, so it means something: things finish sooner when fewer are in flight. It is Lean thinking rather than part of Scrum, it is the Developers&rsquo; own agreement, and you can change or switch it off in board settings.</p>
                    </NewHere>
                  ) : undefined}>
                  {/* Nothing stands in for the empty room in this column: the heading already
                      carries the WIP limit, and the column takes a card wherever you drop it. */}
                    {/* Who takes it, asked on the drop. Nobody is given work: this is which of the
                      Developers is picking it up, and more than one may - that is swarming. */}
                    {pulled && (
                      <div data-part="who-takes-it" className="mt-1 rounded-lg border-2 border-primary bg-primary/[0.06] px-2.5 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {state.team.developers.map((d) => {
                          const on = (pulled.assignedDevs ?? []).includes(d.id);
                          return (
                            <button key={d.id} type="button" onClick={() => onAssignDev(pulled.id, d.id)}
                              className={cn(FOCUS, 'rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors',
                                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted/60')}>
                              {d.name}
                            </button>
                          );
                        })}
                        <button type="button" onClick={() => { setPulling(null); setDesigning(pulled.id); }}
                          className={cn(FOCUS, 'ml-auto text-[11px] font-semibold text-primary underline underline-offset-2')}>
                          start building
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        pick who takes it &middot; more than one is swarming
                      </p>
                      </div>
                    )}
                  {doing.map((it) => (
                    <div key={it.id} {...dragProps(it.id, 'doing')} {...takeProps(it.id)} className="cursor-grab active:cursor-grabbing">
                      {cameBack(it.id)}
                      <BoardCard item={it} state={state} tone="doing" waiting={waitingOn(state, it.id) ? whoIs(waitingOn(state, it.id)!.of).replace(/^The /, '') : null}
                        note={readyForDone(it) ? 'Ready for Done - drag it there' : whyNotDone(it)}
                        onOpen={() => setCardId(it.id)} />
                    </div>
                  ))}
                </BoardColumn>
                </div>
                <div {...dropProps('done')} className={cn('flex min-h-0 min-w-0 flex-col transition-shadow', dropClass('done'))}>
                <BoardColumn title="Done ✓" count={deploy.length + done.length + (refineDone ? 1 : 0)} hint="Nothing Done yet - Done is built, accepted and open">
                  {/* Done means it meets the Definition of Done. Whether it is OPEN to visitors is a
                      separate decision about the same card - you may release the moment it is Done,
                      or hold it. A whole column for "Done but not opened" said that badly: since the
                      building happens on the park, the card passed through it unseen. */}
                  {deploy.map((it) => (
                    // data-done-card here as well as on the released ones: the celebration bursts
                    // from the card, and a card built-but-not-yet-open is the one you press "Open it
                    // to visitors" on - so without this the confetti came from the middle of the
                    // screen instead of from the thing you had just delivered.
                    <div key={it.id} data-done-card={it.id} {...dragProps(it.id, 'deploy')} className="cursor-grab active:cursor-grabbing">
                    {cameBack(it.id)}
                    <BoardCard item={it} state={state} tone="done"
                      note={it.sprintNumber !== null && it.sprintNumber !== state.sprintNumber
                        ? `Built in Sprint ${it.sprintNumber} and still shut`
                        : 'Done, and not open to visitors yet'}
                      onOpen={() => setCardId(it.id)} />

                    </div>
                  ))}
                  {refineDone && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/[0.06] px-2 py-1.5 text-xs">
                      <Check className={cn(TONE.teach.text, "h-3.5 w-3.5 shrink-0")} />
                      <span className="font-medium">Refined the Product Backlog</span>
                      <Chip tone="teach">{state.sprintRefinement!.points} pt{state.sprintRefinement!.points === 1 ? '' : 's'}</Chip>
                    </div>
                  )}
                  {done.map((it) => (
                    // data-done-card lets the delivery celebration burst confetti from this card.
                    <div key={it.id} data-done-card={it.id}>
                      <BoardCard item={it} state={state} tone="live" note="Live to visitors"
                        onOpen={() => setCardId(it.id)} />

                    </div>
                  ))}
                </BoardColumn>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* The bench floats over the foot of the board rather than sitting under it in the flow. Under
          it, a bench big enough to work in pushed the board off the top of the screen, and building
          one thing meant scrolling up to see where it was and down again to work on it. Pinned to
          the bottom of the half it is always there and the board is always there, and neither has
          to move. It gives most of its height back when there is nothing on it. */}
      {/* The studio belongs to Build and nowhere else. Docked under the board in Plan it covered the
          columns you were trying to work - the board became unusable, which is exactly what the
          Plan/Build switch exists to prevent. Reported from playing it. */}
      {/* What is being asked of whom, beside what is in your hands: the two halves of the middle of
          a Sprint. Somebody is waiting on you, and something is on the bench. */}
      {/* The board and what is being asked share the height between them rather than one taking a
          fixed slice - a fixed slice left white space under the panel on a tall screen and squeezed
          the board on a short one. */}

      </div>


      {/* Pulling something in mid-Sprint is a negotiation, so it is something you go and do rather
          than something sitting open beside the work. The panel covers the left half while it is
          open and gets out of the way when it is not. */}
      {showBacklog && !dayStarting && (
        // Opaque. It was bg-background/98, which is not a step on the opacity scale and so compiled
        // to nothing at all - leaving a panel with no background over a busy board, held together by
        // a backdrop blur. A modal you have to squint through is not a modal.
        <div className="absolute inset-0 z-30 flex flex-col rounded-lg border border-border bg-background shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">Product Backlog <span className="font-normal text-muted-foreground">({available})</span></h3>
              <p className="text-[11px] text-muted-foreground">Pull one in by agreement, if it will not put the Sprint Goal at risk - or write something new.</p>
            </div>
            {/* Refining is not only tidying what is there. Half of it is noticing what is missing and
                writing it down, and there was nowhere to do that without leaving the Sprint. */}
            {onAddPbi && (
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setShowToolbox(true)}><Boxes className="mr-1 h-3.5 w-3.5" /> Toolbox</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setWriting(true)}><FilePlus className="mr-1 h-3.5 w-3.5" /> New PBI</Button>
              </div>
            )}
            <button type="button" onClick={() => setShowBacklog(false)} aria-label="Close the Product Backlog"
              className={cn(FOCUS, "shrink-0 rounded-md border border-border p-1 text-muted-foreground hover:text-foreground")}><X className="h-4 w-4" /></button>
          </div>
          {writing && onAddPbi && (
            <Workspace title="Write a Product Backlog item"
              subtitle="It arrives unsized, like anything the Product Owner writes - the Developers size it."
              onClose={() => setWriting(false)}>
              <PbiEditor zones={Array.from(new Set(state.backlog.map((it) => it.zone)))}
                enclosures={state.backlog.filter((it) => it.category === 'enclosure')}
                useStories={state.useUserStories}
                onToggleStories={onSetUserStories ?? (() => {})}
                onSave={(draft) => { onAddPbi(draft); setWriting(false); }}
                onCancel={() => setWriting(false)} />
            </Workspace>
          )}
          {showToolbox && onAddPbi && (
            <Toolbox onPick={(t) => onAddPbi(toolboxDraft(t))} onClose={() => setShowToolbox(false)} />
          )}
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


      </div>

      {/* The Daily Scrum takes the screen, like every other event. It was a column beside the board
          so the Developers could drag the Sprint Backlog while they talked - a good idea that ran
          out of room when the park took half the screen: three columns at ninety pixels each is not
          a live artifact, it is a sliver. The board is right behind it, and the event ends on its
          own buttons. */}
      <Dialog open={state.dayStage === 'dailyScrum'}>
        {/* No close button: the event ends by adapting the plan or carrying on regardless, and a
            cross that silently did nothing would be worse than no cross at all. */}
        <DialogContent data-part="daily-scrum"
          className="max-h-[88vh] max-w-[min(96vw,1100px)] overflow-y-auto border-2 border-primary p-4 [&>button]:hidden">
          <DialogTitle className="sr-only">Daily Scrum</DialogTitle>
          <div>
            <DailyScrum state={state} onHold={onHoldDailyScrum} onSkip={onSkipDailyScrum} onDrop={onDropFromSprint} onAnswer={onAnswerImpediment} />
          </div>
        </DialogContent>
      </Dialog>

      {/* The day ends from the same floating bar every other screen uses. Say which day's Daily
          Scrum is coming: held at the day's START it belongs to the NEXT day, which otherwise reads
          as though the Scrum is an end-of-day event. */}
      {/* Why a quiet board is quiet. Work costs the day, so what is left of one is sometimes too
          small to build anything with, and the board used to go silent for twenty seconds with no
          way to tell that from the game having stopped. A day running out with work still in the
          Sprint is the lesson, not a fault to hide. */}
      {/* Not during the Daily Scrum: the event is the way on, and a floating "End day" beside it is
          a second way out of a conversation the game is asking you to have. */}
      {!dayStarting && state.dayStage !== 'dailyScrum' && (
        <ActionBar hint={(() => {
          const why = whyNothingMoves(state);
          if (why === 'day') return 'Nothing left fits in what is left of today.';
          if (why === 'blocked') return 'Nothing in this Sprint can start: what is here is waiting on something that is not.';
          return undefined;
        })()}>
          <Button onClick={onEndDay}>
            {state.dayNumber === state.sprintDays
              ? 'End day \u2192 Review'
              : state.dailyScrumAt === 'start'
                ? `End Day ${state.dayNumber} \u2192 Day ${state.dayNumber + 1} Scrum`
                : `End Day ${state.dayNumber} \u2192 its Scrum`}
          </Button>
        </ActionBar>
      )}

      {/* The message centre, under the work it is about: what is being asked of somebody, and what
          has just happened. One channel, and an action here is answered or it waits. */}
      {!dayStarting && state.dayStage !== 'dailyScrum' && rail}

      {/* An item's detail, in the one place it lives. */}
      <CardDialog state={state} item={cardId ? state.backlog.find((it) => it.id === cardId) ?? null : null}
        onClose={() => setCardId(null)}
        onStart={(id) => { onStartItem(id); setPulling(id); }}
        onBuilding={(id) => setDesigning(id)}
        onAskToCheck={onAskToCheck}
        onToggleTask={onToggleTask}
        onOpen={onOpen} />
    </div>
  );
}
