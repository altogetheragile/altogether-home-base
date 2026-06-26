import { useDroppable } from '@dnd-kit/core';
import type { WorkItem, WorkerAssignment, Specialism } from './types';
import { colId, stageCount } from './config';
import { WorkItemCard } from './WorkItemCard';
import { cn } from '@/lib/utils';

interface StageColumnProps {
  stage: Specialism;
  label: string;
  items: WorkItem[];
  assignments: WorkerAssignment[];
  wipLimits: Record<Specialism, number> | null;
  enforceWip: boolean;
  canInteract: boolean;
  selectedWorkerId: string | null;
  onAssignCard: (cardId: string) => void;
  onSetWip: (stage: Specialism, value: number) => void;
}

function Lane({ id, title, active, children }: { id: string; title: string; active?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !active });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-1.5 flex flex-col min-h-[200px]',
        active ? 'bg-card/50' : 'bg-muted/30',
        active && isOver && 'ring-2 ring-primary ring-inset bg-primary/5',
      )}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">{title}</div>
      <div className="space-y-1.5 overflow-y-auto">{children}</div>
    </div>
  );
}

export function StageColumn({
  stage,
  label,
  items,
  assignments,
  wipLimits,
  enforceWip,
  canInteract,
  selectedWorkerId,
  onAssignCard,
  onSetWip,
}: StageColumnProps) {
  const wipLimit = wipLimits ? wipLimits[stage] : null;
  const activeItems = items.filter((i) => i.column === colId(stage, 'active'));
  const doneItems = items.filter((i) => i.column === colId(stage, 'done'));
  const total = stageCount(items, stage);
  const isOver = wipLimit != null && total > wipLimit;
  const isAt = wipLimit != null && total === wipLimit;

  return (
    <div className="flex flex-col min-w-[300px] flex-1">
      {/* Stage header: label, WIP count, and inline −/+ editor (TWiG-style) */}
      <div
        className={cn(
          'rounded-t-lg px-3 py-2 border border-b-0 flex items-center justify-between gap-2',
          isOver && enforceWip ? 'bg-destructive/10 border-destructive' : 'bg-muted border-border',
        )}
      >
        <h3 className="font-semibold text-sm">{label}</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-mono px-1.5 py-0.5 rounded',
              isOver && enforceWip && 'bg-destructive text-destructive-foreground',
              isAt && !isOver && 'bg-amber-100 text-amber-800',
              !isOver && !isAt && 'bg-muted-foreground/10 text-muted-foreground',
            )}
          >
            WIP {total}{wipLimit != null ? ` / ${wipLimit}` : ''}
          </span>
          {wipLimit != null && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onSetWip(stage, wipLimit - 1)}
                className="w-5 h-5 rounded border border-border bg-card text-xs leading-none hover:bg-muted disabled:opacity-30"
                disabled={wipLimit <= 1}
                aria-label={`Decrease ${label} WIP limit`}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => onSetWip(stage, wipLimit + 1)}
                className="w-5 h-5 rounded border border-border bg-card text-xs leading-none hover:bg-muted"
                aria-label={`Increase ${label} WIP limit`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active | Done lanes */}
      <div className={cn('grid grid-cols-2 gap-px flex-1 border rounded-b-lg overflow-hidden', isOver && enforceWip ? 'border-destructive' : 'border-border')}>
        <Lane id={colId(stage, 'active')} title="Active" active>
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
        </Lane>

        <Lane id={colId(stage, 'done')} title="Done ✓">
          {doneItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-3">—</div>}
          {doneItems.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              assignments={assignments}
              isSelected={false}
              onClick={() => {}}
              draggable={canInteract}
            />
          ))}
        </Lane>
      </div>
    </div>
  );
}
