import { useState } from 'react';
import type { ZooGameState, BacklogItem, PbiDraft } from './types';
import { availableItems, notReady, refinementTalk, readyHorizon, sprintCapacity } from './engine';
import { REFINE_COSTS } from './config';
import { ProductBacklogSidebar, SplitEpicPanel } from './Board';
import { PlanningPoker } from './PlanningPoker';
import { PbiEditor } from './PbiEditor';
import { CategoryChip } from './PbiCard';
import { Chip } from './ui/Chip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';
import { Target, Scissors, HelpCircle, Pencil, Clock, MessageCircleQuestion, Check, AlertCircle, X } from 'lucide-react';

// The Product Backlog tab, as a place you can work.
//
// It was a read-only list: epics at the top, no Product Goal, nothing to do. Which meant Backlog
// refinement could only happen before Sprint 1 - the one time the Guide does NOT single out, since
// refinement is "the act of breaking down and further defining Product Backlog items into smaller
// more precise items... an ongoing activity to add details".
//
// So the artifact gets a bench. The list on the left is the Product Owner's order; the card on the
// right is the item you picked, the conversation about it, and the three things refinement actually
// does: size it, split it, say what Done would look like.
//
// And it costs. Refining during a Sprint comes out of the Developers' build day (REFINE_COSTS,
// charged by the engine), so every action here says its price before you spend it, and the strip
// says what today has already gone on. A team that never feels the trade-off learns that
// refinement is free.

/** What an act of refinement costs the Developers, said on the control that spends it.
 *  Nothing outside a Sprint: Refinement and Planning are the dedicated time, and it is free there. */
function Cost({ state, seconds }: { state: ZooGameState; seconds: number }) {
  if (state.phase !== 'sprint' || state.learnMode) return null;
  return <span className="ml-1 text-[10px] font-normal tabular-nums opacity-70">{seconds}s</span>;
}

/** The item you picked, and what refining it would mean.
 *
 *  The conversation first, because that is what refinement IS - the Product Owner on why it matters
 *  and what they would trade, the Developers on what it would take. The three acts follow, each
 *  opening in the card rather than over the screen: the bench is the place, so nothing has to
 *  take over to use it. */
export function ItemBench({ state, item, onEstimate, onRefinePbi, onSplitEpic, onSetUseStories, onClose, className }: {
  state: ZooGameState;
  item: BacklogItem | null;
  onEstimate: (id: string, points: number) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onSetUseStories: (on: boolean) => void;
  /** Put the bench away, where the card it shares has something else to show. */
  onClose?: () => void;
  className?: string;
}) {
  const [doing, setDoing] = useState<'size' | 'split' | 'word' | null>(null);
  const enclosures = state.backlog.filter((it) => it.category === 'enclosure').map((it) => ({ id: it.id, name: it.name }));

  if (!item) {
    return (
      <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-2', className)}>
        <div className={cn(EYEBROW, 'text-primary')}>The refinement bench</div>
        <p className="text-sm text-muted-foreground">
          Pick an item on the left and it opens here: what it is for, what the Developers say it would
          take, and the three things refinement does - size it, split it, and agree what Done looks like.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Refinement is ongoing work, not a phase before the Sprints. It happens while the Sprint runs, and
          what it prepares is the Sprints after this one.
        </p>
      </section>
    );
  }

  const why = notReady(item);
  const talk = refinementTalk(state, item);
  return (
    <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-2.5', className)}>
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold leading-tight">{item.name}</h3>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close the bench" title="Close the bench"
              className={cn(FOCUS, 'shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground')}>
              <X className="h-4 w-4" />
            </button>
          )}
          {item.unsized
            ? <Chip tone="attention">not sized</Chip>
            : <span className="shrink-0 tabular-nums text-sm font-bold">{item.estimate} pts</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryChip item={item} />
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.zone}</span>
          {why
            ? <span className={cn(TONE.attention.text, 'flex items-center gap-1 text-[11px] font-medium')}><AlertCircle className="h-3.5 w-3.5" /> {why}</span>
            : <span className={cn(TONE.done.text, 'flex items-center gap-1 text-[11px] font-medium')}><Check className="h-3.5 w-3.5" /> Ready</span>}
        </div>
      </header>

      {/* Who says what. The Guide is precise about it: the Product Owner may influence by helping
          the Developers understand the trade-offs, and the Developers who will do the work are
          responsible for the sizing. */}
      <div className="space-y-1.5 rounded-lg border border-primary/25 bg-primary/[0.04] p-2.5">
        <div className={cn(EYEBROW, 'flex items-center gap-1.5 text-primary')}>
          <MessageCircleQuestion className="h-3.5 w-3.5" /> The conversation
        </div>
        <p className="text-xs"><span className="font-semibold">{talk.po.name}</span> <span className="text-muted-foreground">(PO)</span>: {talk.po.line}</p>
        {talk.devs.map((d, i) => (
          <p key={i} className="text-xs"><span className="font-semibold">{d.name}</span>: {d.line}</p>
        ))}
      </div>

      {item.story && <p className="text-xs italic text-muted-foreground">{item.story}</p>}

      <div>
        <div className={cn(EYEBROW, 'text-muted-foreground')}>Acceptance criteria</div>
        {item.acceptance.length ? (
          <ul className="mt-0.5 space-y-0.5">
            {item.acceptance.map((c, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-muted-foreground"><span className="text-muted-foreground/50">&bull;</span><span>{c}</span></li>
            ))}
          </ul>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">None yet - and without them nobody can say when it is Done.</p>
        )}
      </div>

      {/* The three acts, each with what it costs the day. */}
      <div className="flex flex-wrap gap-1.5">
        {item.category === 'epic' ? (
          <Button size="sm" className={cn(TONE.reflect.solid, 'h-7 px-2 text-xs text-white hover:bg-rose-700')}
            onClick={() => setDoing(doing === 'split' ? null : 'split')}>
            <Scissors className="mr-1 h-3.5 w-3.5" /> Split it up<Cost state={state} seconds={REFINE_COSTS.split} />
          </Button>
        ) : (
          <Button size="sm" variant={item.unsized ? 'default' : 'outline'} className="h-7 px-2 text-xs"
            onClick={() => setDoing(doing === 'size' ? null : 'size')}>
            <HelpCircle className="mr-1 h-3.5 w-3.5" /> {item.unsized ? 'Size it' : 'Size it again'}<Cost state={state} seconds={REFINE_COSTS.estimate} />
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDoing(doing === 'word' ? null : 'word')}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Word it, and its criteria<Cost state={state} seconds={REFINE_COSTS.refinePbi} />
        </Button>
      </div>

      {doing === 'size' && (
        <div className="rounded-lg border border-border p-2">
          <PlanningPoker item={item} state={state} seed={state.gameSeed}
            onCommit={(pts) => { onEstimate(item.id, pts); setDoing(null); }} />
        </div>
      )}
      {doing === 'split' && (
        <div className="rounded-lg border border-border p-2">
          <SplitEpicPanel epic={item} onSplit={(ids) => { onSplitEpic(item.id, ids); setDoing(null); }} />
        </div>
      )}
      {doing === 'word' && (
        <div className="rounded-lg border border-border p-2">
          <PbiEditor zones={state.zones} state={state} item={item} enclosures={enclosures}
            useStories={state.useUserStories} onToggleStories={onSetUseStories}
            onSave={(d) => { onRefinePbi(item.id, d); setDoing(null); }}
            onEstimate={(pts) => onEstimate(item.id, pts)}
            onCancel={() => setDoing(null)} />
        </div>
      )}
      {/* Adding is refinement too, and it is the one act that is not about the item in hand - so it
          is said here and done there, rather than being a fourth button that means something else. */}
      <p className="text-[11px] text-muted-foreground">A whole new item is written from the list on the left.</p>
    </section>
  );
}

/** The Product Backlog tab: the artifact, its commitment, and the bench that works on it. */
export function BacklogTab({ state, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onDeletePbi, onDuplicatePbi, onPull }: {
  state: ZooGameState;
  onEstimate: (id: string, points: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveZone: (zone: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onDeletePbi: (id: string) => void;
  onDuplicatePbi: (id: string) => void;
  /** Pulling a Ready item into a running Sprint - by agreement, and only during one. */
  onPull?: (id: string) => void;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const items = availableItems(state);
  const item = items.find((it) => it.id === focus) ?? null;
  // The item can leave the Backlog under you - split, pulled into the Sprint, deleted - so the
  // bench falls back to nothing rather than to a stale card.
  const inSprint = state.phase === 'sprint';
  const spent = state.refinePenalty ?? 0;
  const horizon = readyHorizon(state);

  return (
    <div className="space-y-3">
      {/* The commitment of the Product Backlog, on the Product Backlog. An artifact and its
          commitment belong together - the Sprint Backlog has its Goal above the board, and this is
          the same rule applied to the artifact that had none. */}
      <div className="rounded-lg border border-primary/25 bg-primary/[0.04] px-3 py-2">
        <div className={cn(EYEBROW, 'flex items-center gap-1.5 text-primary')}>
          <Target className="h-3.5 w-3.5" /> Product Goal <span className="font-normal normal-case tracking-normal text-muted-foreground">commitment of the Product Backlog</span>
        </div>
        <p className={cn('text-sm leading-snug', state.productGoal.trim() ? 'font-semibold' : 'text-muted-foreground')}>
          {state.productGoal.trim() || 'No Product Goal set yet - it is the long-term objective the Backlog is ordered towards.'}
        </p>
      </div>

      {/* What refinement has cost today, where the spending happens. Only during a Sprint: outside
          one this is the dedicated time for it and it costs nothing. */}
      {inSprint && !state.learnMode && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-300/70 bg-amber-50/60 px-3 py-1.5 text-[11px] dark:border-amber-700/50 dark:bg-amber-950/20">
          <span className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
            <Clock className="h-3.5 w-3.5" /> Refining now costs the Developers build time
          </span>
          <span className="tabular-nums text-muted-foreground">{spent}s spent today</span>
          <span className="tabular-nums text-muted-foreground">{Math.max(0, Math.round(state.daySecondsLeft))}s of the day left</span>
          <span className="text-muted-foreground">
            {horizon} Sprint{horizon === 1 ? '' : 's'} ready · what you prepare here is for the Sprints after this one
          </span>
        </div>
      )}

      {/* The list and the bench, the way Refinement frames it: the artifact on the left, the card
          that acts on it on the right. The bench sticks: it is the thing you are working in, and a
          list of nineteen items is taller than the window, so an unsticky bench scrolls away from
          you as soon as you reach for anything on the left. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
        <div className="min-w-0">
          <ProductBacklogSidebar state={state} mode={inSprint ? 'sprint' : 'refine'}
            focus={focus} onFocus={setFocus}
            onAddPbi={onAddPbi} onRefinePbi={onRefinePbi} onSetUseStories={onSetUseStories}
            onEstimate={onEstimate} onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore}
            onPull={onPull} onSplitEpic={onSplitEpic} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />
        </div>
        <ItemBench className="min-w-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto lg:pb-16" state={state} item={item} onEstimate={onEstimate}
          onRefinePbi={onRefinePbi} onSplitEpic={onSplitEpic} onSetUseStories={onSetUseStories} />
      </div>
      {/* Capacity, so ordering the list is a decision with a size beside it rather than a preference. */}
      <p className="text-[11px] text-muted-foreground">
        The Developers finish about {sprintCapacity(state).points} points a Sprint. Everything above that line in this
        list is what the next Sprint could be about.
      </p>
    </div>
  );
}
