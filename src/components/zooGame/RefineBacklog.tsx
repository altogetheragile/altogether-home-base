import type { ZooGameState, PbiDraft } from './types';
import { PhaseHeader, SprintLengthPicker } from './PhaseHeader';
import { availableItems, readyHorizon } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { ProductBacklogSidebar } from './Board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface RefineBacklogProps {
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
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
  /** Agreed once, here, before the first Sprint. After that only a Retrospective changes it. */
  onSetSprintDays?: (days: number) => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. You need
 *  a Backlog, however rough, to start: order it and estimate the unsized items until the
 *  top items are Ready to plan. From Sprint 2 on, refinement is not a separate step - it
 *  is ongoing, done during each Sprint on the board, where it costs a little capacity. */
export function RefineBacklog({ state, onSetSprintDays, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onDeletePbi, onDuplicatePbi, onPlan }: RefineBacklogProps) {
  const items = availableItems(state);
  const ready = items.filter((it) => !it.unsized);
  const unsized = items.length - ready.length;
  const canPlan = ready.length > 0;
  const first = state.sprintNumber === 1 && state.velocity.length === 0; // the very first pass, before any Sprint
  const horizon = readyHorizon(state);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {/* The first pass through the Backlog is not the same conversation as the ones after it: nothing
          has been built, nothing is ready, and there is no Sprint yet to be "in". Either way what
          refining costs comes out of the Sprint you are about to forecast, not one you are inside. */}
      <PhaseHeader event="Backlog Refinement"
        title={first ? 'First, shape the Product Backlog' : 'Get the Backlog ready'}>
        Split what is too big, size what is not sized, and order it by value.{' '}
        {first
          ? 'Do enough discovery to get started - a Sprint or two of ready work, not the whole zoo. What you learn from building the first exhibits will change the rest of it.'
          : 'Refinement keeps a couple of Sprints ready ahead of you. It does not settle what goes into the next Sprint - that is decided at Planning, from whatever is Ready by then.'}
      </PhaseHeader>

      {first && onSetSprintDays && (
        <SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="setup" />
      )}

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs">
        <span className="text-muted-foreground">{items.length} in the Backlog</span>
        <span className={cn('font-medium', horizon > 3 ? 'text-amber-700 dark:text-amber-400' : horizon >= 1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}
          title="How far ahead the Backlog is prepared: Ready points against your capacity. Aim for a Sprint or two - past three is analysis you may never use.">
          {horizon} {horizon === 1 ? 'Sprint' : 'Sprints'} ready
        </span>
        <span className="flex items-center gap-3">
          {unsized > 0 && <span className="text-sky-700 dark:text-sky-400">{unsized} to estimate</span>}
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {ready.length} Ready</span>
        </span>
      </div>

      <ProductBacklogSidebar state={state} mode="refine" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
        onSetUseStories={onSetUseStories} onEstimate={onEstimate} onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />

      <div className="sticky bottom-4 flex flex-col items-end gap-1">
        {!canPlan && <span className="text-[11px] text-muted-foreground">Estimate at least one item so it is Ready to plan.</span>}
        <Button size="lg" disabled={!canPlan} onClick={onPlan}>Go to Sprint Planning →</Button>
      </div>
    </div>
  );
}
