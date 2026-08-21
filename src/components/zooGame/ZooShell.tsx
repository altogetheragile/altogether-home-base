import { useState, type ReactNode } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { ParkView, type EditApi } from './ParkView';
import { DayTimer } from './DayTimer';
import { CoachNudge } from './CoachTip';
import { ArtifactsPanel } from './ArtifactsPanel';
import { CopyEditor } from './CopyEditor';
import { TeachingCard, ScrumReference } from './ScrumTeaching';
import { CARDS_BY_PHASE, BACK_FROM } from './scrumContent';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Target, Trees, ClipboardList, Save, FolderOpen, Sparkles, Loader2, X, MoreHorizontal, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const PHASE_LABEL: Record<string, string> = { refine: 'Refinement', planning: 'Planning', sprint: 'Sprint', review: 'Review', retro: 'Retrospective' };
/** The work tab's label per phase - what you are actually doing there. */
const WORK_TAB: Record<string, string> = { refine: 'Refine', planning: 'Plan', sprint: 'Sprint Backlog Board', review: 'Review', retro: 'Retro' };
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
          className="shrink-0 rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="space-y-0.5">
          {onSave && (
            <button type="button" onClick={onSave} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/60">
              <Save className="h-3.5 w-3.5 text-muted-foreground" /> Save this game
            </button>
          )}
          {onOpenSaves && (
            <button type="button" onClick={onOpenSaves} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/60">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Saved games
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Tab({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: typeof Target; label: string; badge?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-1.5 text-sm font-semibold transition-colors',
        active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
      <Icon className="h-4 w-4" /> {label}
      {badge && <span className="rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">{badge}</span>}
    </button>
  );
}

/** The app-shell: a fixed-height frame (no page scroll) with a slim header - phase, Sprint
 *  Goal, and the game controls collapsed into one row plus tabs - over a body that fills the
 *  screen and scrolls INTERNALLY. Built to fit a tablet without scrolling the page. */
export function ZooShell({ state, children, parkTab, onSetTab, building, onOpenBuild, edit, boardOpen, onSetBoardOpen, onStartHere, onPlaceItem, onSetPathStyle, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, deployAcs, onConfirmDeployAc, onFinishDeploy, justOpened, onImprove, onSetSpot, onSetSize, onAddCopy, onMoveCopy, onRemoveCopy, onNest, onUnnest, onRename, onEndDay, onSetDod, onSetDor, onSetProductGoal, onSave, onOpenSaves, onPoRefine, poRefining, poNote, onDismissPoNote, nudge, onDismissNudge, onSetTeaching, onMarkTaught, onBack, copy }: { state: ZooGameState; children: ReactNode; parkTab?: 'work' | 'park'; onSetTab?: (t: 'work' | 'park') => void; building?: string | null; onOpenBuild?: (id: string | null) => void; edit?: EditApi; boardOpen?: boolean; onSetBoardOpen?: (open: boolean) => void; onStartHere?: (id: string, pos: { x: number; y: number }) => void; onPlaceItem?: (id: string, pos: { x: number; y: number }) => void; onSetPathStyle?: (key: string) => void; onAddConnector?: (c: ZooConnector) => void; onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void; onDeleteConnector?: (id: string) => void; deployMode?: string | null; deployStyle?: { thickness: number; color: string } | null; deployAcs?: { index: number; label: string; confirmed: boolean; placement: boolean }[]; onConfirmDeployAc?: (index: number, value: boolean) => void; onFinishDeploy?: () => void; justOpened?: string | null; onImprove?: (id: string) => void; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onSetSize?: (id: string, size: { w: number; h: number }) => void; onAddCopy?: (id: string, pos: { x: number; y: number }) => void; onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void; onRemoveCopy?: (id: string, index: number) => void; onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onRename?: (id: string, name: string) => void; onEndDay?: () => void; onSetDod?: (dod: string[]) => void; onSetDor?: (dor: string[]) => void; onSetProductGoal?: (goal: string) => void; onSave?: () => void; onOpenSaves?: () => void; onPoRefine?: () => void; poRefining?: boolean; poNote?: string | null; onDismissPoNote?: () => void; nudge?: { id: string; text: string } | null; onDismissNudge?: (id: string) => void; onSetTeaching?: (on: boolean) => void; onMarkTaught?: (id: string) => void; onBack?: (phase: string) => void; copy?: { overrides: Record<string, string>; onChanged: (key: string, value: string) => void } }) {
  // `tab` is controlled from above when provided, so an event (place & open) can switch to
  // the Park view; otherwise the shell owns it. Placing & opening jumps to Park so you can
  // position the released item there.
  const [localTab, setLocalTab] = useState<'work' | 'park'>('work');
  const tab = parkTab ?? localTab;
  const setTab = onSetTab ?? setLocalTab;
  const open = state.backlog.filter((it) => it.status === 'open').length;
  // During a Sprint the park is the working surface and the board docks over it.
  const canvas = state.phase === 'sprint';
  const dayStage = state.dayStage;
  // Whether the board is up is a decision, not something derived from what is selected. Deriving it
  // meant that clicking away from an enclosure - which only means "I have finished with this one" -
  // threw the whole board back over the park. It now stays where you left it: picking something up
  // on the park puts the board away, and only the handle brings it back.
  const board = boardOpen ?? true;
  const setDock = (o: boolean) => onSetBoardOpen?.(o);
  // Building happens during the build stage. At the Daily Scrum the event is what you are in, so
  // the park lets go of whatever was selected rather than floating a toolbar over it.
  const onPark = state.phase !== 'sprint' || dayStage === 'building';
  const selected = onPark ? building : null;
  const sprintCount = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && it.status !== 'backlog').length;

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
                  className="flex shrink-0 items-center rounded-md border border-border bg-background p-1 text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )
          )}
          <span title={ROLE_HINT[state.phase]} className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold">
            {state.phase === 'refine'
              ? 'Initial Refinement'
              : <>Sprint {state.sprintNumber}{state.phase === 'sprint' && <><span className="mx-1 text-muted-foreground">·</span>Day {state.dayNumber}/{state.sprintDays}</>}{state.phase !== 'sprint' && <><span className="mx-1 text-muted-foreground">·</span><span className="font-bold uppercase tracking-wide text-primary">{PHASE_LABEL[state.phase] ?? ''}</span></>}</>}
          </span>
          {/* The day clock lives here so it stays visible on both the Build and Park tabs. The
              z-index lifts it above the design-studio modal (z-40) so the Sprint clock is never
              hidden while you build - the build spends the day's time, so you need to see it. */}
          {state.phase === 'sprint' && state.dayStage !== 'dailyScrum' && onEndDay && (
            <span className="relative z-[45] rounded-full bg-background">
              <DayTimer key={state.dayNumber} compact dayNumber={state.dayNumber} dayTimeMult={state.dayTimeMult} refinePenalty={state.refinePenalty} impeded={!!state.carriedImpediment} learnMode={state.learnMode} onExpire={onEndDay} />
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
                className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60">
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
        {/* Tabs where the park is somewhere you visit. During a Sprint it is the surface you work
            on and the board docks over it, so there is nothing to switch between. */}
        {!canvas && (
          <div className="mt-1 flex gap-1">
            <Tab active={tab === 'work'} onClick={() => setTab('work')} icon={ClipboardList} label={WORK_TAB[state.phase] ?? 'Work'} />
            {/* Naming it matters: the park is the PRODUCT, and what each Sprint adds to it is an
                Increment. A learner who never connects the two is playing a building game. */}
            <Tab active={tab === 'park'} onClick={() => setTab('park')} icon={Trees} label={"Park \u00b7 the product"} badge={open ? String(open) : undefined} />
          </div>
        )}
      </header>

      {/* What the Scrum Team changed in the last refinement session, and who changed it. */}
      {poNote && (
        <div className="mx-2 mt-2 flex shrink-0 items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:mx-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Refinement session &middot; the Scrum Team</div>
            <p className="mt-0.5 whitespace-pre-line text-sm leading-snug text-foreground">{poNote}</p>
          </div>
          {onDismissPoNote && (
            <button type="button" onClick={onDismissPoNote} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        </div>
      )}

      {/* Body: fills the remaining height and scrolls INTERNALLY so the page never scrolls.
          During the SPRINT the park is the surface you work on, not a place you visit: it fills the
          body and the Sprint Backlog sits in a dock over it, pulled up to pick the next thing and
          pushed down while you build. Everywhere else it is one pane at a time via the tabs, because
          those screens are events and the park is not what they act on.
          Both panes stay mounted (toggled with CSS) so the day clock / studio work survive. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {canvas ? (
          // During a Sprint the screen reads left to right, the way the work flows: the Product
          // Backlog you pull from, the Sprint Backlog you pulled into, and the park you build on.
          // The board used to sit UNDER the park in a dock, which put the thing you pull from below
          // the thing you build on and made "where does work come from" a question about geography.
          <div className="flex h-full min-h-0">
            {board ? (
              <div className="flex min-h-0 w-[min(46%,30rem)] shrink-0 flex-col border-r border-border">
                <button type="button" onClick={() => setDock(false)}
                  className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ClipboardList className="h-4 w-4 text-primary" /> The work
                  </span>
                  <span className="flex items-center gap-1"><PanelLeftClose className="h-3.5 w-3.5" /> Hide</span>
                </button>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                  <div className="space-y-3 pb-24">
                    {nudge && onDismissNudge && <CoachNudge text={nudge.text} onDismiss={() => onDismissNudge(nudge.id)} />}
                    {children}
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setDock(true)} title="Show the Sprint Backlog"
                className="flex shrink-0 items-center gap-2 border-r border-border bg-card px-1.5 py-3 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
                <span className="[writing-mode:vertical-rl]">The work &middot; {sprintCount} item{sprintCount === 1 ? '' : 's'}</span>
              </button>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3">
              <ParkView state={state} large building={selected} onOpenBuild={onOpenBuild} edit={onPark ? edit : undefined} onStartHere={onStartHere} onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onAddConnector={onAddConnector} onUpdateConnector={onUpdateConnector} onDeleteConnector={onDeleteConnector} deployMode={deployMode} deployStyle={deployStyle} deployAcs={deployAcs} onConfirmDeployAc={onConfirmDeployAc} onFinishDeploy={onFinishDeploy} justOpened={justOpened} onImprove={onImprove} onSetSpot={onSetSpot} onSetSize={onSetSize} onAddCopy={onAddCopy} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} onRename={onRename} />
            </div>
          </div>
        ) : (
          <>
            {/* The park: a place you visit, on its own tab. */}
            <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab !== 'park' && 'hidden')}>
              <ParkView state={state} large building={selected} onOpenBuild={onOpenBuild} edit={onPark ? edit : undefined} onStartHere={onStartHere} onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onAddConnector={onAddConnector} onUpdateConnector={onUpdateConnector} onDeleteConnector={onDeleteConnector} deployMode={deployMode} deployStyle={deployStyle} deployAcs={deployAcs} onConfirmDeployAc={onConfirmDeployAc} onFinishDeploy={onFinishDeploy} justOpened={justOpened} onImprove={onImprove} onSetSpot={onSetSpot} onSetSize={onSetSize} onAddCopy={onAddCopy} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} onRename={onRename} />
            </div>
            <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3', tab === 'park' && 'hidden')}>
              <div className="mx-auto max-w-3xl space-y-3 pb-24">
                {/* One card at a time, for the element they have just arrived at, once each. */}
                {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
                {nudge && onDismissNudge && <CoachNudge text={nudge.text} onDismiss={() => onDismissNudge(nudge.id)} />}
                {children}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
