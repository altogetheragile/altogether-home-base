import { useEffect, useState, type ReactNode } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { ParkView, type EditApi } from './ParkView';
import { DayTimer } from './DayTimer';
import { ArtifactsPanel } from './ArtifactsPanel';
import { CopyEditor } from './CopyEditor';
import { TeachingCard, ScrumReference } from './ScrumTeaching';
import { CARDS_BY_PHASE, BACK_FROM } from './scrumContent';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SeatBadge } from './SeatBadge';
import { MessageRail, RailNote } from './MessageRail';
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
function GameMenu({ onSave, onOpenSaves }: { onSave?: () => void; onOpenSaves?: () => void }) {
  if (!onSave && !onOpenSaves) return null;
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
export function ZooShell({ state, children, parkTab, onSetTab, building, onOpenBuild, edit, onPart, drawRoute, drawing, onDrawing, onStartHere, onPlaceItem, onSetPathStyle, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, deployAcs, onFinishDeploy, onImprove, onSetSpot, onSetMemberSpot, onSetSize, onSetRot, onMoveCopy, onRemoveCopy, onNest, onUnnest, onEndDay, onSetDod, onSetDor, onSetProductGoal, onSave, onOpenSaves, onPoRefine, poRefining, poNote, onDismissPoNote, nudge, onDismissNudge, said, onDismissSaid, refused, onDismissRefused, onSetTeaching, onMarkTaught, onBack, copy, seat = null, observer, covering }: { state: ZooGameState; children: ReactNode; onPart?: (p: { id: string; key: string } | null) => void; drawRoute?: { id: string; name: string; style: { thickness: number; color: string } } | null; drawing?: boolean; onDrawing?: (on: boolean) => void; parkTab?: ArtifactTab; onSetTab?: (t: ArtifactTab) => void; building?: string | null; onOpenBuild?: (id: string | null) => void; edit?: EditApi; onStartHere?: (id: string, pos: { x: number; y: number }) => void; onPlaceItem?: (id: string, pos: { x: number; y: number }) => void; onSetPathStyle?: (key: string) => void; onAddConnector?: (c: ZooConnector) => void; onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void; onDeleteConnector?: (id: string) => void; deployMode?: string | null; deployStyle?: { thickness: number; color: string } | null; deployAcs?: { index: number; label: string; confirmed: boolean; placement: boolean }[]; onFinishDeploy?: () => void; onImprove?: (id: string) => void; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void; onSetSize?: (id: string, size: { w: number; h: number }) => void; onSetRot?: (id: string, rot: number) => void; onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void; onRemoveCopy?: (id: string, index: number) => void; onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onEndDay?: () => void; onSetDod?: (dod: string[]) => void; onSetDor?: (dor: string[]) => void; onSetProductGoal?: (goal: string) => void; onSave?: () => void; onOpenSaves?: () => void; onPoRefine?: () => void; poRefining?: boolean; poNote?: string | null; onDismissPoNote?: () => void; nudge?: { id: string; text: string } | null; onDismissNudge?: (id: string) => void; said?: { id: number; seat: string; says: string; also: number }[]; onDismissSaid?: (id: number) => void; refused?: string | null; onDismissRefused?: () => void; onSetTeaching?: (on: boolean) => void; onMarkTaught?: (id: string) => void; onBack?: (phase: string) => void; copy?: { overrides: Record<string, string>; onChanged: (key: string, value: string) => void }; seat?: SeatName | null; observer?: boolean; covering?: SeatName[] }) {
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

  // The next thing worth explaining here, if the teaching is on and it has not been read yet.
  const back = BACK_FROM[state.phase];
  // Every event screen carries its own teaching inside the "?" beside its question, so the shell
  // does not also stack a card above it. Nothing is said twice.
  const teachCard = (state.teaching ?? true) && !['refine', 'planning', 'sprint', 'review', 'retro'].includes(state.phase)
    ? (CARDS_BY_PHASE[state.phase] ?? []).find((id) => !(state.taught ?? []).includes(id))
    : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Slim header: everything that used to be a stack of bands, in one row + a tabs row. */}
      <header className="shrink-0 border-b border-border bg-background/95 px-2 pt-1.5 sm:px-3">
        <div className="flex items-center gap-2">
          {/* Back, wherever going back is honest. Where it is not, the control says why - a Sprint
              that has started cannot be un-started, and that is the lesson, not an oversight. */}
          {back && (
            'blocked' in back
              ? (
                <span title={back.blocked} className="flex shrink-0 cursor-help items-center rounded-md border border-border/60 p-1 text-muted-foreground/40">
                  <ChevronLeft className="h-4 w-4" />
                </span>
              ) : onBack && (
                <button type="button" onClick={() => onBack(back.to)} title={back.label} aria-label={back.label}
                  className={cn(FOCUS, SURFACE.inset, 'flex shrink-0 items-center p-1 text-muted-foreground transition-colors hover:text-foreground')}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )
          )}
          {/* Whose hat you are wearing, said rather than implied. The gate only speaks when
              you reach outside your accountability, so a Product Owner doing Product Owner
              things would otherwise be told nothing at all. */}
          <SeatBadge seat={seat} phase={state.phase} observer={observer} covering={covering} />
          <span title={ROLE_HINT[state.phase]} className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold">
            {state.phase === 'refine'
              ? 'Before Sprint 1'
              : <>Sprint {state.sprintNumber}{state.phase === 'sprint' && <><span className="mx-1 text-muted-foreground">·</span>Day {state.dayNumber}/{state.sprintDays}</>}{state.phase !== 'sprint' && <><span className="mx-1 text-muted-foreground">·</span><span className="font-bold uppercase tracking-wide text-primary">{PHASE_LABEL[state.phase] ?? ''}</span></>}</>}
          </span>
          {/* The day clock lives here so it stays visible on both the Build and Park tabs. The
              z-index lifts it above the design-studio modal (z-40) so the Sprint clock is never
              hidden while you build - the build spends the day's time, so you need to see it. */}
          {state.phase === 'sprint' && state.dayStage !== 'dailyScrum' && onEndDay && (
            <span className="relative z-[45] rounded-full bg-background">
              <DayTimer compact dayTimeMult={state.dayTimeMult} refinePenalty={state.refinePenalty} impeded={!!state.carriedImpediment} learnMode={state.learnMode} secondsLeft={state.daySecondsLeft} />
            </span>
          )}
          {/* The Sprint's commitment, on screen at all times - so it needs to read as more than one
              more grey line in a crowded bar. Labelled, tinted and set in medium weight. */}
          <span className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
            state.sprintGoal.trim() ? 'border-primary/30 bg-primary/5' : 'border-dashed border-border')}>
            <Target className={cn('h-3.5 w-3.5 shrink-0', state.sprintGoal.trim() ? 'text-primary' : 'text-muted-foreground')} />
            <span className="hidden shrink-0 text-[9px] font-bold uppercase tracking-[0.08em] text-primary lg:inline">Sprint Goal</span>
            <span className={cn('truncate', state.sprintGoal.trim() ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {state.sprintGoal.trim() || 'No Sprint Goal yet - agree one at Planning'}
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Refinement belongs where refinement happens: shaping the Backlog before the first
                Sprint, and adapting it at the Review. Not in Sprint Planning, which forecasts from
                the Backlog rather than changing it, and not mid-Sprint, where the Developers refine
                on the board and it costs the day's build time. */}
            {onPoRefine && (state.phase === 'refine' || state.phase === 'review') && (
              // Not the same thing as the "Word it for me" draft in Planning: this is the Product
              // Owner doing THEIR job on the Product BACKLOG - splitting, adding, clarifying,
              // ordering by value. It changes the Backlog, it runs an AI, and it needs signing in.
              <button type="button" onClick={onPoRefine} disabled={poRefining}
                title="Hold a Product Backlog refinement session: the Product Owner brings value and order, the Developers bring what is too big, unclear or dependent on something else. Sizing stays yours - you are the Developers - and nothing here touches a Sprint Goal you have agreed."
                className={cn(FOCUS, "flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60")}>
                {poRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">{poRefining ? 'Refining together…' : 'Refine with the Scrum Team'}</span>
                <span className="md:hidden">{poRefining ? '…' : 'Refine'}</span>
              </button>
            )}
            {/* One control for the artifacts, their commitments and the team's agreements, and one
                for the game itself. The header used to carry ten. */}
            <ArtifactsPanel state={state} onSetProductGoal={onSetProductGoal} onSetDod={onSetDod} onSetDor={onSetDor} />
            <ScrumReference teaching={state.teaching ?? true} onSetTeaching={onSetTeaching} />
            {/* Polishing the teaching happens while playing, so the editor lives here rather than
                in an admin screen. Admins only - it renders nothing for everyone else. */}
            {copy && <CopyEditor phase={state.phase} overrides={copy.overrides} onChanged={copy.onChanged} />}
            <GameMenu onSave={onSave} onOpenSaves={onOpenSaves} />
          </div>
        </div>
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

      {/* Everything the game says, in the margins rather than in the flow. Split by who is
          talking: the coach and the rules on the left, your team on the right. */}
      <MessageRail side="left">
        {nudge && onDismissNudge && (
          <RailNote title="Coach" onDismiss={() => onDismissNudge(nudge.id)}>{nudge.text}</RailNote>
        )}
        {refused && (
          <RailNote title="Whose call it is" tone="rule" onDismiss={onDismissRefused}>{refused}</RailNote>
        )}
        {/* The Product Owner's account of a refinement is a long read rather than a passing
            remark, so it sits with the things you read and not with the running commentary. */}
        {poNote && (
          <RailNote title="Refinement session · the Scrum Team" onDismiss={onDismissPoNote}>
            <span className="whitespace-pre-line">{poNote}</span>
          </RailNote>
        )}
      </MessageRail>

      <MessageRail side="right">
        {/* Newest first, and the last few kept. What a seat played by the game did while you
            were reading a different screen is the only account you get of it. */}
        {(said ?? []).map((one) => (
          <RailNote key={one.id} title={`${one.seat.replace('_', ' ')} (AI)`} tone="team"
            onDismiss={() => onDismissSaid?.(one.id)} dismissLabel="ok">
            {one.says}
            {one.also > 0 && <div className="mt-1 text-muted-foreground">and {one.also} more like it</div>}
          </RailNote>
        ))}
      </MessageRail>

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
          <div className="mx-auto max-w-5xl space-y-3 pb-24">
            {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
            {home === 'backlog' && !takeover ? children : <BacklogGlance state={state} />}
          </div>
        </div>

        {/* The Sprint Backlog: the board, and the studio when something is in hand. Full width,
            because this is the artifact the Sprint is worked through. */}
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab !== 'sprint' && 'hidden')}>
          <div className="mx-auto flex h-full min-h-0 max-w-[1600px] flex-col gap-3 pb-24">
            {home === 'sprint' && !takeover ? children : <SprintBacklogGlance state={state} locked={!sprintBacklog} />}
          </div>
        </div>

        {/* The Increment: the park, all the time, at the width it deserves. */}
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab !== 'increment' && 'hidden')}>
          <ParkView state={state} large onPart={onPart} drawRoute={drawRoute} drawing={drawing} onDrawing={onDrawing} building={selected} onOpenBuild={onOpenBuild} edit={onPark ? edit : undefined} onStartHere={onStartHere} onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onAddConnector={onAddConnector} onUpdateConnector={onUpdateConnector} onDeleteConnector={onDeleteConnector} deployMode={deployMode} deployStyle={deployStyle} deployAcs={deployAcs} onFinishDeploy={onFinishDeploy} onImprove={onImprove} onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onSetSize={onSetSize} onSetRot={onSetRot} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} />
        </div>

        {/* An event is a moment, not an artifact: it dims the tab it belongs to and fills the
            screen over it. You can still see which artifact it is about behind it. */}
        {takeover && (
          <div className="absolute inset-0 z-30 overflow-y-auto bg-background/80 px-2 py-3 backdrop-blur-sm sm:px-3">
            <div className="mx-auto max-w-5xl rounded-xl border border-border bg-background p-3 shadow-xl">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
