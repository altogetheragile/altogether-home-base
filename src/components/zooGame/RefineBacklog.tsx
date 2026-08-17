import type { ZooGameState, PbiDraft } from './types';
import { SprintLengthPicker } from './SprintLengthPicker';
import { ExplainButton } from './Explain';
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
  /** The refinement teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. You need
 *  a Backlog, however rough, to start: order it and estimate the unsized items until the
 *  top items are Ready to plan. From Sprint 2 on, refinement is not a separate step - it
 *  is ongoing, done during each Sprint on the board, where it costs a little capacity. */
export function RefineBacklog({ state, onSetSprintDays, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onDeletePbi, onDuplicatePbi, onPlan, teachCard, onMarkTaught }: RefineBacklogProps) {
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
      {/* One question, like every other screen. What refinement is, who does it and how much is
          enough sits behind the "?" rather than as a paragraph over the work. */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{first ? 'What could we build first?' : 'What is ready for the Sprints ahead?'}</h2>
          <ExplainButton title="Product Backlog refinement" phase="refine" teachCard={teachCard} onMarkTaught={onMarkTaught}
            body={[
              'Refinement breaks Product Backlog items into smaller, more precise ones, and adds detail: what it is, the order it sits in, and how big it is. The Developers who will do the work are the ones who size it.',
              first
                ? 'This first pass is discovery, not a plan for the whole product. A Sprint or two of ready work is enough - what you learn from building the first exhibits will change the rest of it, and detailed analysis of work that may never be built is waste.'
                : 'Refinement is ongoing work during a Sprint, done by the whole Scrum Team. It prepares later Sprints - typically two or three ahead - and it does not settle what goes into the next one. That is decided at Sprint Planning, from whatever is ready by then.',
              'It is not an event, and there is no gap between Sprints for it to happen in.',
            ]} />
        </div>
        <p className="text-sm text-muted-foreground">Split what is too big, size what is not sized, and order it by value.</p>
      </header>

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
