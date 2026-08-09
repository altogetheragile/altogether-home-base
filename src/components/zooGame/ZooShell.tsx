import { useState, type ReactNode } from 'react';
import type { ZooGameState } from './types';
import { ParkView } from './ParkView';
import { DayTimer } from './DayTimer';
import { DodEditor } from './DodEditor';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Target, Trophy, Trees, ClipboardList, ClipboardCheck, Pencil, Check, Save, FolderOpen, Sparkles, Loader2, X } from 'lucide-react';

const PHASE_LABEL: Record<string, string> = { refine: 'Refinement', planning: 'Planning', sprint: 'Sprint', review: 'Review', retro: 'Retrospective' };
/** The work tab's label per phase - what you are actually doing there. */
const WORK_TAB: Record<string, string> = { refine: 'Refine', planning: 'Plan', sprint: 'Build', review: 'Review', retro: 'Retro' };
/** Which Scrum accountabilities you are wearing in each phase - a solo game plays all
 *  three, so naming the "hat" keeps who-does-what visible (shown as a tooltip to save space). */
const ROLE_HINT: Record<string, string> = {
  refine: 'Hats: Product Owner (orders the Backlog) + Developers (estimate)',
  planning: 'Hats: the whole Scrum Team - PO proposes value, Developers forecast & plan',
  sprint: 'Hats: Developers (do the work) - the Scrum Master keeps the way clear',
  review: 'Hats: the Scrum Team + your visitors (the stakeholders) inspect the Increment',
  retro: 'Hats: the Scrum Team inspects how it works and adapts',
};

/** The Definition of Done as a compact popover chip: it stays one line in the header and
 *  opens on demand (chips, and an inline editor). Editable any time. */
function DodPopover({ dod, onSetDod }: { dod: string[]; onSetDod?: (dod: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" /> DoD <span className="text-muted-foreground/70">({dod.length})</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Definition of Done</span>
          {onSetDod && (
            <button type="button" onClick={() => setEditing((e) => !e)} className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">
              {editing ? <><Check className="h-3 w-3" /> Done</> : <><Pencil className="h-3 w-3" /> Edit</>}
            </button>
          )}
        </div>
        {editing && onSetDod ? (
          <DodEditor dod={dod} onSave={onSetDod} />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {dod.map((d) => <span key={d} className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>)}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The Product Goal as a tappable popover on the trophy - readable, and editable in place
 *  (the PO refines it any time), consistent with the DoD chip. */
function ProductGoalPopover({ goal, onSetGoal }: { goal: string; onSetGoal?: (g: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);
  return (
    <Popover onOpenChange={(o) => { if (!o) setEditing(false); }}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Product Goal" title="Product Goal"
          className="shrink-0 rounded-md border border-primary/30 bg-primary/5 p-1.5 text-primary hover:bg-primary/10">
          <Trophy className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</span>
          {onSetGoal && !editing && (
            <button type="button" onClick={() => { setDraft(goal); setEditing(true); }} className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
        {editing && onSetGoal ? (
          <div className="space-y-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus
              className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              placeholder="One clear outcome: a park that [who] love, so that [outcome]." />
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="button" disabled={!draft.trim()} onClick={() => { onSetGoal(draft); setEditing(false); }} className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Save</button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-snug">{goal}</p>
        )}
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
export function ZooShell({ state, children, parkTab, onSetTab, onPlaceItem, onSetPathStyle, onSetPathRoute, onAddPath, onDeletePath, onClearPaths, onImprove, onSetSpot, onEndDay, onSetDod, onSetProductGoal, onSave, onOpenSaves, onPoRefine, poRefining, poNote, onDismissPoNote }: { state: ZooGameState; children: ReactNode; parkTab?: 'work' | 'park'; onSetTab?: (t: 'work' | 'park') => void; onPlaceItem?: (id: string, pos: { x: number; y: number }) => void; onSetPathStyle?: (key: string) => void; onSetPathRoute?: (route: 'straight' | 'elbow' | 'spine' | 'none') => void; onAddPath?: (points: { x: number; y: number }[]) => void; onDeletePath?: (id: string) => void; onClearPaths?: () => void; onImprove?: (id: string) => void; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onEndDay?: () => void; onSetDod?: (dod: string[]) => void; onSetProductGoal?: (goal: string) => void; onSave?: () => void; onOpenSaves?: () => void; onPoRefine?: () => void; poRefining?: boolean; poNote?: string | null; onDismissPoNote?: () => void }) {
  // `tab` is controlled from above when provided, so an event (place & open) can switch to
  // the Park view; otherwise the shell owns it. Placing & opening jumps to Park so you can
  // position the released item there.
  const [localTab, setLocalTab] = useState<'work' | 'park'>('work');
  const tab = parkTab ?? localTab;
  const setTab = onSetTab ?? setLocalTab;
  const open = state.backlog.filter((it) => it.status === 'open').length;

  return (
    <div className="flex h-full flex-col">
      {/* Slim header: everything that used to be a stack of bands, in one row + a tabs row. */}
      <header className="shrink-0 border-b border-border bg-background/95 px-2 pt-1.5 sm:px-3">
        <div className="flex items-center gap-2">
          {/* Product Goal: tappable popover on the trophy - readable and editable in place. */}
          <ProductGoalPopover goal={state.productGoal} onSetGoal={onSetProductGoal} />
          <span title={ROLE_HINT[state.phase]} className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-xs font-semibold">
            {state.phase === 'refine'
              ? 'Initial Refinement'
              : <>Sprint {state.sprintNumber}{state.phase === 'sprint' && <><span className="mx-1 text-muted-foreground">·</span>Day {state.dayNumber}/{state.sprintDays}</>}{state.phase !== 'sprint' && <><span className="mx-1 text-muted-foreground">·</span>{PHASE_LABEL[state.phase] ?? ''}</>}</>}
          </span>
          {/* The day clock lives here so it stays visible on both the Build and Park tabs. The
              z-index lifts it above the design-studio modal (z-40) so the Sprint clock is never
              hidden while you build - the build spends the day's time, so you need to see it. */}
          {state.phase === 'sprint' && state.dayStage !== 'dailyScrum' && onEndDay && (
            <span className="relative z-[45] rounded-full bg-background">
              <DayTimer key={state.dayNumber} compact dayNumber={state.dayNumber} dayTimeMult={state.dayTimeMult} refinePenalty={state.refinePenalty} impeded={!!state.carriedImpediment} learnMode={state.learnMode} onExpire={onEndDay} />
            </span>
          )}
          <span className="flex min-w-0 flex-1 items-center gap-1 text-xs">
            <Target className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={cn('truncate', state.sprintGoal.trim() ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {state.sprintGoal.trim() || 'No Sprint Goal yet - agree one at Planning'}
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {onPoRefine && state.phase !== 'sprint' && (
              <button type="button" onClick={onPoRefine} disabled={poRefining}
                title="The AI Product Owner refines the Backlog by value - splits epics, adds items, clarifies acceptance (it doesn't estimate effort)"
                className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60">
                {poRefining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span className="hidden md:inline">{poRefining ? 'PO refining…' : 'Ask the PO'}</span>
              </button>
            )}
            {onSetDod !== undefined && <DodPopover dod={state.definitionOfDone} onSetDod={onSetDod} />}
            {onOpenSaves && (
              <button type="button" onClick={onOpenSaves} title="Saved games" className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"><FolderOpen className="h-3.5 w-3.5" /></button>
            )}
            {onSave && (
              <button type="button" onClick={onSave} title="Save game" className="rounded-md border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground"><Save className="h-3.5 w-3.5" /></button>
            )}
          </div>
        </div>
        {/* Tabs at every size. Narrow/portrait: they switch the single visible pane. Wide (xl):
            Work shows the work pane + the Park rail; Park expands the park to the full width. */}
        <div className="mt-1 flex gap-1">
          <Tab active={tab === 'work'} onClick={() => setTab('work')} icon={ClipboardList} label={WORK_TAB[state.phase] ?? 'Work'} />
          <Tab active={tab === 'park'} onClick={() => setTab('park')} icon={Trees} label="Park" badge={open ? String(open) : undefined} />
        </div>
      </header>

      {/* The AI Product Owner's note, from the last refinement - readable and dismissible. */}
      {poNote && (
        <div className="mx-2 mt-2 flex shrink-0 items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:mx-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Owner</div>
            <p className="mt-0.5 whitespace-pre-line text-sm leading-snug text-foreground">{poNote}</p>
          </div>
          {onDismissPoNote && (
            <button type="button" onClick={onDismissPoNote} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        </div>
      )}

      {/* Body: fills the remaining height and scrolls INTERNALLY so the page never scrolls.
          Narrow/portrait: one pane at a time via the tabs. Wide (xl), Work tab: the work pane
          and a persistent Park rail sit side by side, so you can watch the zoo fill while you
          build. Wide (xl), Park tab: the park expands to the full width for a large view.
          Both panes stay mounted (toggled with CSS) so the day clock / studio work survive. */}
      <div className="min-h-0 flex-1 overflow-hidden xl:flex">
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3 xl:min-w-0 xl:flex-1', tab === 'park' && 'hidden')}>
          <div className={cn(state.phase === 'planning' || state.phase === 'sprint' ? 'w-full' : 'mx-auto max-w-3xl')}>{children}</div>
        </div>
        <div className={cn('h-full overflow-y-auto px-2 py-3 sm:px-3',
          tab !== 'park' && 'hidden xl:block',
          tab === 'work' && 'xl:w-[360px] xl:shrink-0 xl:border-l xl:border-border',
          tab === 'park' && 'xl:flex-1 xl:min-w-0')}>
          <p className="mb-2 text-[11px] text-muted-foreground">The park shows the work you have delivered. Drag an enclosure, building or planting to lay out your zoo - animals move with their enclosure.</p>
          <ParkView state={state} large onPlaceItem={onPlaceItem} onSetPathStyle={onSetPathStyle} onSetPathRoute={onSetPathRoute} onAddPath={onAddPath} onDeletePath={onDeletePath} onClearPaths={onClearPaths} onImprove={onImprove} onSetSpot={onSetSpot} />
        </div>
      </div>
    </div>
  );
}
