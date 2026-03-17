import type { WorkItem, WorkerAssignment, ColumnId } from './types';
import { COLUMNS } from './config';
import { WorkItemCard } from './WorkItemCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  columnId: ColumnId;
  items: WorkItem[];
  assignments: WorkerAssignment[];
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  wipLimit?: number | null;
}

export function KanbanColumn({
  columnId,
  items,
  assignments,
  selectedCardId,
  onCardClick,
  wipLimit,
}: KanbanColumnProps) {
  const colDef = COLUMNS.find((c) => c.id === columnId)!;
  const columnItems = items.filter((i) => i.column === columnId);
  const isOverLimit = wipLimit != null && columnItems.length > wipLimit;
  const isAtLimit = wipLimit != null && columnItems.length === wipLimit;

  return (
    <div className="flex flex-col min-w-[180px] flex-1">
      {/* Column header */}
      <div
        className={cn(
          'rounded-t-lg px-3 py-2 border border-b-0',
          'flex items-center justify-between',
          isOverLimit ? 'bg-destructive/10 border-destructive' : 'bg-muted border-border'
        )}
      >
        <h3 className="font-semibold text-sm">{colDef.label}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{columnItems.length}</span>
          {wipLimit != null && (
            <span
              className={cn(
                'text-xs font-mono px-1.5 py-0.5 rounded',
                isOverLimit && 'bg-destructive text-destructive-foreground',
                isAtLimit && !isOverLimit && 'bg-amber-100 text-amber-800',
                !isOverLimit && !isAtLimit && 'bg-muted-foreground/10 text-muted-foreground'
              )}
            >
              /{wipLimit}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        className={cn(
          'flex-1 border rounded-b-lg p-2 space-y-2 min-h-[200px] overflow-y-auto',
          isOverLimit ? 'border-destructive bg-destructive/5' : 'border-border bg-card/50'
        )}
      >
        {columnItems.length === 0 && (
          <div className="text-xs text-muted-foreground/50 text-center py-4">Empty</div>
        )}
        {columnItems.map((item) => (
          <WorkItemCard
            key={item.id}
            item={item}
            assignments={assignments}
            isSelected={selectedCardId === item.id}
            onClick={() => onCardClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
