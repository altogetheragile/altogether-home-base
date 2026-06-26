import type { WorkItem, WorkerAssignment, Specialism } from './types';
import { colId, stageCount, pullTarget, stageOf } from './config';
import { WorkItemCard } from './WorkItemCard';
import { cn } from '@/lib/utils';

interface StageColumnProps {
  stage: Specialism;
  label: string;
  items: WorkItem[];
  assignments: WorkerAssignment[];
  wipLimits: Record<Specialism, number> | null;
  /** assign-phase interactions */
  canInteract: boolean;
  selectedWorkerId: string | null;
  onAssignCard: (cardId: string) => void;
  onPull: (cardId: string) => void;
}

const PULL_LABELS: Record<Specialism, string> = {
  analysis: 'Pull to Dev →',
  development: 'Pull to Test →',
  test: 'Mark Done →',
};

export function StageColumn({
  stage,
  label,
  items,
  assignments,
  wipLimits,
  canInteract,
  selectedWorkerId,
  onAssignCard,
  onPull,
}: StageColumnProps) {
  const wipLimit = wipLimits ? wipLimits[stage] : null;
  const activeItems = items.filter((i) => i.column === colId(stage, 'active'));
  const doneItems = items.filter((i) => i.column === colId(stage, 'done'));
  const total = stageCount(items, stage);
  const isOver = wipLimit != null && total > wipLimit;
  const isAt = wipLimit != null && total === wipLimit;

  // A pull is blocked when the DESTINATION stage is already at its WIP limit.
  const pullBlocked = (item: WorkItem): boolean => {
    if (!canInteract) return true;
    const dest = pullTarget(item.column);
    if (!dest) return true;
    const destStage = stageOf(dest);
    if (!destStage || !wipLimits) return false; // pulling to Done, or no limits
    return stageCount(items, destStage) >= wipLimits[destStage];
  };

  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      {/* Stage header with WIP count */}
      <div
        className={cn(
          'rounded-t-lg px-3 py-2 border border-b-0 flex items-center justify-between',
          isOver ? 'bg-destructive/10 border-destructive' : 'bg-muted border-border',
        )}
      >
        <h3 className="font-semibold text-sm">{label}</h3>
        <span
          className={cn(
            'text-xs font-mono px-1.5 py-0.5 rounded',
            isOver && 'bg-destructive text-destructive-foreground',
            isAt && !isOver && 'bg-amber-100 text-amber-800',
            !isOver && !isAt && 'bg-muted-foreground/10 text-muted-foreground',
          )}
        >
          {total}{wipLimit != null ? ` / ${wipLimit}` : ''}
        </span>
      </div>

      {/* Two lanes: Active | Done */}
      <div className={cn('grid grid-cols-2 gap-px flex-1 border rounded-b-lg overflow-hidden', isOver ? 'border-destructive' : 'border-border')}>
        {/* Active lane — workers do the effort here */}
        <div className="bg-card/50 p-2 flex flex-col min-h-[200px]">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Active</div>
          <div className="space-y-2 overflow-y-auto">
            {activeItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-3">—</div>}
            {activeItems.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                assignments={assignments}
                isSelected={!!selectedWorkerId && canInteract}
                onClick={() => canInteract && onAssignCard(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Done lane — finished this stage, waiting for the player to pull it on */}
        <div className="bg-muted/30 p-2 flex flex-col min-h-[200px]">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Done ✓</div>
          <div className="space-y-2 overflow-y-auto">
            {doneItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-3">—</div>}
            {doneItems.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                assignments={assignments}
                isSelected={false}
                onClick={() => {}}
                pullable
                pullDisabled={pullBlocked(item)}
                pullLabel={PULL_LABELS[stage]}
                onPull={() => onPull(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
