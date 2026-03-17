import type { WorkItem, WorkerAssignment, Specialism } from './types';
import { WORKERS } from './config';
import { cn } from '@/lib/utils';

const SPECIALISM_COLORS: Record<Specialism, string> = {
  analysis: 'bg-blue-500',
  development: 'bg-emerald-500',
  test: 'bg-amber-500',
};

interface WorkItemCardProps {
  item: WorkItem;
  assignments: WorkerAssignment[];
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function WorkItemCard({ item, assignments, isSelected, onClick, compact }: WorkItemCardProps) {
  const cardAssignments = assignments.filter((a) => a.cardId === item.id);
  const column = item.column as Specialism;
  const isActive = item.column !== 'backlog' && item.column !== 'done';

  const effortPercent = isActive
    ? Math.round(
        ((item.effortTotal[column] - item.effortRemaining[column]) / item.effortTotal[column]) * 100
      )
    : item.column === 'done'
      ? 100
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md border p-2 transition-all text-sm',
        'hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-primary border-primary',
        item.blocked && 'border-destructive bg-destructive/5',
        !item.blocked && !isSelected && 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-medium truncate">{item.title}</span>
        {item.blocked && (
          <span className="shrink-0 text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
            BLOCKED
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-1.5">
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${effortPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{item.effortRemaining[column]} effort left</span>
            {item.blocked && <span className="text-destructive">{item.blockerEffort} to unblock</span>}
          </div>
        </div>
      )}

      {/* Assigned workers */}
      {cardAssignments.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {cardAssignments.map((a) => {
            const worker = WORKERS.find((w) => w.id === a.workerId);
            if (!worker) return null;
            const isSpec = worker.specialism === column;
            return (
              <span
                key={a.workerId}
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white',
                  SPECIALISM_COLORS[worker.specialism],
                  !isSpec && 'opacity-60'
                )}
                title={`${worker.name} (${worker.specialism}${isSpec ? ' - specialist' : ' - 60% effective'})`}
              >
                {worker.initials}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
