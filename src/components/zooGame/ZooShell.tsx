import { useEffect, useState, type ReactNode } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { ParkView, type EditApi } from './ParkView';
import { DoneGate } from './DoneGate';
import { goalPulse } from './engine';
import { DayTimer } from './DayTimer';
import { CopyEditor } from './CopyEditor';
import { TeachingCard } from './ScrumTeaching';
import { LearnDrawer } from './LearnDrawer';
import { CARDS_BY_PHASE, BACK_FROM } from './scrumContent';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SeatBadge } from './SeatBadge';
import { GameNotesProvider } from './GameNotes';
import type { GameNote } from './notesDock';
import { whatIsYours } from './seatCopy';
import type { SeatName } from './useZooSessions';
import { Target, Trees, ClipboardList, ListChecks, Save, FolderOpen, Sparkles, Loader2, MoreHorizontal, ChevronLeft } from 'lucide-react';
import { FOCUS, SURFACE } from './ui/tokens';

const PHASE_LABEL: Record<string, string> = { refine: 'Refinement', planning: 'Planning', sprint: 'Sprint', review: 'Review', retro: 'Retrospective' };
/** The work tab's label per phase - what you are actually doing there. */
/** Which Scrum accountabilities you are wearing in each phase - a solo game plays all
 *  three, so naming the "hat" keeps who-does-what visible (shown as a tooltip to save space). */
const ROLE_HINT: Record<string, string> = {
  refine: 'Hats: Product Owner (orders the Backlog) + Developers (estimate)',
  planning: 'Hats: the whole Scrum Team - PO proposes value, Developers forecast & plan',
  sprint: 'Hats: Developers (do the work) - the Scrum Master keeps the way clear',
  review: 'Hats: the Scrum Team + your visitors (the stakeholders) inspect the Increment',
  retro: 'Hats: the Scrum Team inspects how it works and adapts',
};




/** The game's own controls - save, resume - out of the way of the Scrum. */
function GameMenu({ onSave, onOpenSaves, links }: { onSave?: () => void; onOpenSaves?: () => void; links?: ReactNode }) {
  if (!onSave && !onOpenSaves && !links) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Game" aria-label="Game menu"
          className={cn(FOCUS, SURFACE.inset, 'shrink-0 p-1.5 text-muted-foreground hover:text-foreground')}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="space-y-0.5">
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
      className={cn(FOCUS, 'flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors',
        locked ? 'cursor-not-allowed border-transparent text-muted-foreground/45'
          : active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
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
export function ZooShell({ state, children, parkTab, onSetTab, buildMode = 'plan', links, menuLinks, backlogTab, building, onOpenBuild, edit, onPart, drawRoute, drawing, onDrawing, onStartHere, onPlaceItem, onSetPathStyle, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, deployAcs, onFinishDeploy, onImprove, onSetSpot, onSetMemberSpot, onSetSize, onSetRot, onMoveCopy, onRemoveCopy, onNest, onUnnest, onEndDay, onSetDod, onSetDor, onSetProductGoal, onSave, onOpenSaves, onPoRefine, poRefining, poNote, onDismissPoNote, said, onDismissSaid, refused, onDismissRefused, onSetTeaching, onMarkTaught, onBack, copy, seat = null, observer, covering }: { state: ZooGameState; children: ReactNode; onPart?: (p: { id: string; key: string } | null) => void; drawRoute?: { id: string; name: string; style: { thickness: number; color: string } } | null; drawing?: boolean; onDrawing?: (on: boolean) => void; parkTab?: ArtifactTab; onSetTab?: (t: ArtifactTab) => void; buildMode?: 'plan' | 'build';
  /** The way back to the site and who is signed in, handed in rather than reached for: the shell
   *  should not need to know there is such a thing as signing in. */
  links?: ReactNode;
  /** ...and what belongs in the game menu rather than the strip: signing in, and who is signed in. */
  menuLinks?: ReactNode;
  /** The Product Backlog tab when the Refinement screen is not on it: the list and the bench that
   *  works on it, handed in by the page because the shell holds no game handlers of its own. */
  backlogTab?: ReactNode; building?: string | null; onOpenBuild?: (id: string | null) => void; edit?: EditApi; onStartHere?: (id: string, pos: { x: number; y: number }) => void; onPlaceItem?: (id: string, pos: { x: number; y: number }) => void; onSetPathStyle?: (key: string) => void; onAddConnector?: (c: ZooConnector) => void; onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void; onDeleteConnector?: (id: string) => void; deployMode?: string | null; deployStyle?: { thickness: number; color: string } | null; deployAcs?: { index: number; label: string; confirmed: boolean; placement: boolean }[]; onFinishDeploy?: () => void; onImprove?: (id: string) => void; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void; onSetSize?: (id: string, size: { w: number; h: number }) => void; onSetRot?: (id: string, rot: number) => void; onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void; onRemoveCopy?: (id: string, index: number) => void; onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onEndDay?: () => void; onSetDod?: (dod: string[]) => void; onSetDor?: (dor: string[]) => void; onSetProductGoal?: (goal: string) => void; onSave?: () => void; onOpenSaves?: () => void; onPoRefine?: () => void; poRefining?: boolean; poNote?: string | null; onDismissPoNote?: () => void; said?: { id: number; seat: string; says: string; also: number }[]; onDismissSaid?: (id: number) => void; refused?: string | null; onDismissRefused?: () => void; onSetTeaching?: (on: boolean) => void; onMarkTaught?: (id: string) => void; onBack?: (phase: string) => void; copy?: { overrides: Record<string, string>; onChanged: (key: string, value: string) => void }; seat?: SeatName | null; observer?: boolean; covering?: SeatName[] }) {
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
  const home: ArtifactTab = state.phase === 'refine' ? 'backlog'
    : state.phase === 'review' ? 'increment' : 'sprint';
  const setTab = onSetTab ?? setLocalTab;
  // An artifact that does not exist yet cannot be the one you are looking at, whoever asked for it.
  const wanted = parkTab ?? localTab;
  const tab: ArtifactTab = wanted === 'sprint' && !sprintBacklog ? 'backlog' : wanted;
  /** An event fills the screen over the tab it belongs to: Planning and the Retrospective over the
   *  Sprint Backlog, the Review over the Increment. Tabs are artifacts; events are moments. */
  // The park follows the work: beside the item while it is being built, on its own tab otherwise.
  const inBuild = tab === 'sprint' && buildMode === 'build' && state.phase === 'sprint';
  const takeover = state.phase === 'planning' || state.phase === 'review' || state.phase === 'retro';
  // The game moves you to the artifact it is about: Refinement to the Product Backlog, a Sprint to
  // the Sprint Backlog, the Review to the Increment. You can go anywhere from there; this only says
  // where each part of the game starts, so nobody arrives at a screen behind the wrong tab.
  useEffect(() => { setTab(home); }, [state.phase, home, setTab]);
  const dayStage = state.dayStage;
  // Building happens during the build stage. At the Daily Scrum the event is what you are in, so
  // the park lets go of whatever was selected rather than floating a toolbar over it.
  const onPark = state.phase !== 'sprint' || dayStage === 'building';
  const selected = onPark ? building : null;
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
  const pulse = state.phase === 'sprint' ? goalPulse(state) : null;
  // ...and the sentence only while the day is being built. At the Daily Scrum you are already in
  // the conversation it would send you to, and "take it to tomorrow's Daily Scrum" said during one
  // is the game talking over itself.
  const warn = pulse?.level === 'risk' && state.dayStage === 'building' ? pulse : null;

  const notes: GameNote[] = [];
  if (refused) notes.push({ id: 'refused', title: 'Whose call it is', tone: 'rule', body: refused, onDismiss: onDismissRefused });
  if (poNote) notes.push({ id: 'refinement', title: 'Refinement session · the Scrum Team', body: <span className="whitespace-pre-line">{poNote}</span>, onDismiss: onDismissPoNote });
  for (const one of said ?? []) {
    notes.push({
      id: `said-${one.id}`, title: `${one.seat.replace('_', ' ')} (AI)`, tone: 'team', dismissLabel: 'ok',
      onDismiss: () => onDismissSaid?.(one.id),
      body: <>{one.says}{one.also > 0 && <div className="mt-1 text-muted-foreground">and {one.also} more like it</div>}</>,
    });
  }

  return (
    <GameNotesProvider notes={notes}>
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
        <div className="zoo-band -mx-2 mb-1.5 flex items-center gap-3 px-2 py-1.5 sm:-mx-3 sm:px-3">
          {/* The mark is the way back to the site: it says whose game this is and does the wordmark's
              job in a fifth of the room. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {links}
            {/* Back, wherever going back is honest. Where it is not, the control says why - a Sprint
                that has started cannot be un-started, and that is the lesson, not an oversight. */}
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
            {/* Whose hat you are wearing, where somebody else is wearing the others. In a solo game
                you are all three, and a chip saying so on every screen is noise. */}
            {seat && <SeatBadge seat={seat} phase={state.phase} observer={observer} covering={covering} />}
            <span title={ROLE_HINT[state.phase]} className="text-xs font-medium opacity-90">
              {state.phase === 'refine'
                ? 'Before Sprint 1'
                : <>Sprint {state.sprintNumber}{state.phase === 'sprint'
                  ? <> &middot; Day {state.dayNumber} of {state.sprintDays}</>
                  : <> &middot; <span className="font-bold uppercase tracking-wide">{PHASE_LABEL[state.phase] ?? ''}</span></>}</>}
            </span>
          </div>

          {/* How much of today is left. The one thing on this screen that changes what you do next,
              so it is the biggest thing on it. */}
          {state.phase === 'sprint' && state.dayStage !== 'dailyScrum' && onEndDay && (
            <DayTimer big dayTimeMult={state.dayTimeMult} refinePenalty={state.refinePenalty} impeded={!!state.carriedImpediment} learnMode={state.learnMode} secondsLeft={state.daySecondsLeft} />
          )}

          {/* Is the Sprint Goal safe. The answer in bold, from the Sprint's own arithmetic; the Goal
              itself in small type under it, opening in full when you ask for it. */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" data-part="goal-line" title={state.sprintGoal.trim() || 'No Sprint Goal yet - agree one at Planning'}
                className={cn(FOCUS, 'flex min-w-0 flex-1 flex-col items-start rounded-md px-1 py-0.5 text-left hover:bg-white/10')}>
                {state.phase === 'sprint' && pulse ? (
                  <span className={cn('truncate text-sm font-bold leading-tight', pulse.level === 'risk' && 'text-amber-300')}>{pulse.line}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] opacity-70">
                    <Target className="h-3 w-3" /> Sprint Goal
                  </span>
                )}
                <span className={cn('w-full truncate text-[11px]', state.sprintGoal.trim() ? 'opacity-80' : 'opacity-60')}>
                  {state.sprintGoal.trim() || 'No Sprint Goal yet - agree one at Planning'}
                </span>
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
            <LearnDrawer state={state} notes={notes} teaching={state.teaching ?? true} onSetTeaching={onSetTeaching}
              onSetProductGoal={onSetProductGoal} onSetDod={onSetDod} onSetDor={onSetDor} />
            {/* Polishing the teaching happens while playing, so the editor lives here rather than
                in an admin screen. Admins only - it renders nothing for everyone else. */}
            {copy && <CopyEditor phase={state.phase} overrides={copy.overrides} onChanged={copy.onChanged} />}
            <GameMenu onSave={onSave} onOpenSaves={onOpenSaves} links={menuLinks} />
          </div>
        </div>

        {/* ...and when the answer changes, the strip says so in a sentence and nothing else on the
            screen moves. Both ways out of it are decisions, and the game records either. */}
        {warn?.headline && (
          <div data-part="goal-warning" className="mb-1.5 rounded-lg border-2 border-primary bg-primary/5 px-3 py-1.5">
            <p className="text-xs font-bold text-foreground">{warn.headline}</p>
            <p className="text-[11px] text-muted-foreground">{warn.sentence}</p>
          </div>
        )}
        {/* The three artifacts, in the order work moves through them. */}
        <div className="mt-1 flex gap-1">
          <Tab active={tab === 'backlog'} onClick={() => setTab('backlog')} icon={ClipboardList} label="Product Backlog" />
          <Tab active={tab === 'sprint'} onClick={() => setTab('sprint')} icon={ListChecks} label="Sprint Backlog"
            locked={sprintBacklog ? undefined : 'made at Planning'} />
          {/* Naming it matters: the park is the PRODUCT, and what each Sprint adds to it is an
              Increment. A learner who never connects the two is playing a building game. */}
          <Tab active={tab === 'increment'} onClick={() => setTab('increment')} icon={Trees} label="Increment" badge={open ? String(open) : undefined} />
        </div>
      </header>

      {/* What that accountability holds on THIS screen. Its own row, because the header is
          already full and squeezing it in there collided with the Sprint Goal field. */}
      {seat && !observer && whatIsYours(seat, state.phase) && (
        <div className="shrink-0 border-b border-border bg-primary/5 px-3 py-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-primary">Yours here:</span> {whatIsYours(seat, state.phase)}
        </div>
      )}

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
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab !== 'sprint' && 'hidden')}>
          {/* Building means the thing in your hands and the park you are building it on, side by
              side - which is the whole point of the Build state. There is only ever one park in the
              game, so while it is here the Increment tab does without it rather than drawing a
              second one: two isometric scenes rebuilding every second is a slow game. */}
          <div className={cn('mx-auto flex h-full min-h-0 flex-col gap-3 pb-24',
            inBuild ? 'max-w-none xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,46%)] xl:items-start' : 'max-w-[1600px]')}>
            {home === 'sprint' && !takeover ? children : <SprintBacklogGlance state={state} locked={!sprintBacklog} />}
            {inBuild && (
              <div className="min-w-0 rounded-lg border border-border bg-card p-2">
                <ParkView state={state} large onPart={onPart} drawRoute={drawRoute} drawing={drawing} onDrawing={onDrawing} building={selected} onOpenBuild={onOpenBuild} edit={onPark ? edit : undefined} onStartHere={onStartHere} onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onAddConnector={onAddConnector} onUpdateConnector={onUpdateConnector} onDeleteConnector={onDeleteConnector} deployMode={deployMode} deployStyle={deployStyle} deployAcs={deployAcs} onFinishDeploy={onFinishDeploy} onImprove={onImprove} onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onSetSize={onSetSize} onSetRot={onSetRot} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} />
              </div>
            )}
          </div>
        </div>

        {/* The Increment: the park, all the time, at the width it deserves. */}
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', (tab !== 'increment' || inBuild) && 'hidden')}>
          <div className={cn('flex min-h-0 gap-3', gateItem ? 'flex-col xl:flex-row' : '')}>
            <div className="min-w-0 flex-1">
            <ParkView state={state} large onPart={onPart} drawRoute={drawRoute} drawing={drawing} onDrawing={onDrawing} building={selected} onOpenBuild={onOpenBuild} edit={onPark ? edit : undefined} onStartHere={onStartHere} onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onAddConnector={onAddConnector} onUpdateConnector={onUpdateConnector} onDeleteConnector={onDeleteConnector} deployMode={deployMode} deployStyle={deployStyle} deployAcs={deployAcs} onFinishDeploy={onFinishDeploy} onImprove={onImprove} onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onSetSize={onSetSize} onSetRot={onSetRot} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} />
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
        {takeover && (
          <div className="absolute inset-0 z-30 overflow-y-auto bg-background/80 px-2 py-3 pb-24 backdrop-blur-sm sm:px-3">
            <div className="mx-auto max-w-5xl rounded-xl border border-border bg-background p-3 shadow-xl">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
    </GameNotesProvider>
  );
}
