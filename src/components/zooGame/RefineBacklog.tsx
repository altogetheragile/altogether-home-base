import type { ZooGameState, PbiDraft } from './types';
import { availableItems } from './engine';
import { ProductBacklogSidebar } from './Board';
import { Button } from '@/components/ui/button';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

interface RefineBacklogProps {
  state: ZooGameState;
  onEstimate: (id: string, points: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. You need
 *  a Backlog, however rough, to start: order it and estimate the unsized items until the
 *  top items are Ready to plan. From Sprint 2 on, refinement is not a separate step - it
 *  is ongoing, done during each Sprint on the board, where it costs a little capacity. */
export function RefineBacklog({ state, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveBefore, onSetUseStories, onPlan }: RefineBacklogProps) {
  const items = availableItems(state);
  const ready = items.filter((it) => !it.unsized);
  const unsized = items.length - ready.length;
  const canPlan = ready.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><ClipboardList className="h-3.5 w-3.5" /> Before Sprint 1 · Product Backlog Refinement</div>
        <h2 className="text-lg font-bold">Refine the Product Backlog</h2>
        <p className="text-sm text-muted-foreground">
          Ready the Backlog <strong>just enough</strong> to start: order it, and <strong>estimate</strong> the unsized
          items so the top ones are <strong>Ready</strong> to plan. Refinement is ongoing - from Sprint 2 you will keep
          refining on the board, as much as each Sprint needs. Then move on to Sprint Planning.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs">
        <span className="text-muted-foreground">{items.length} in the Backlog</span>
        <span className="flex items-center gap-3">
          {unsized > 0 && <span className="text-sky-700 dark:text-sky-400">{unsized} to estimate</span>}
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {ready.length} Ready</span>
        </span>
      </div>

      <ProductBacklogSidebar state={state} mode="refine" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
        onSetUseStories={onSetUseStories} onEstimate={onEstimate} onReorder={onReorder} onMoveBefore={onMoveBefore} />

      <div className="sticky bottom-4 flex flex-col items-end gap-1">
        {!canPlan && <span className="text-[11px] text-muted-foreground">Estimate at least one item so it is Ready to plan.</span>}
        <Button size="lg" disabled={!canPlan} onClick={onPlan}>Go to Sprint Planning →</Button>
      </div>
    </div>
  );
}
