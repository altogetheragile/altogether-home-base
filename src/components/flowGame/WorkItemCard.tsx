import { useDraggable } from '@dnd-kit/core';
import type { WorkItem, WorkerAssignment, Specialism } from './types';
import { WORKERS, ACTIVE_COLUMNS, stageOf, laneOf } from './config';
import { cn } from '@/lib/utils';

const SPECIALISM_COLORS: Record<Specialism, string> = {
  analysis: 'bg-blue-500',
  development: 'bg-emerald-500',
  test: 'bg-amber-500',
};
const SPECIALISM_SHORT: Record<Specialism, string> = { analysis: 'A', development: 'D', test: 'T' };

interface WorkItemCardProps {
  item: WorkItem;
  assignments: WorkerAssignment[];
  isSelected: boolean;
  onClick: () => void;
  /** Current day, used to show the item's age while it's in flow. */
  currentDay?: number;
  /** When true the card can be dragged to pull it onward. */
  draggable?: boolean;
}

/** Remaining effort per stage as compact, wrapping pip rows (one row per discipline). */
function EffortPips({ item }: { item: WorkItem }) {
  return (
    <div className="flex flex-col gap-0.5 mt-1.5">
      {ACTIVE_COLUMNS.map((s) => {
        const total = item.effortTotal[s];
        const remaining = item.effortRemaining[s];
        return (
          <div key={s} className="flex items-center gap-1" title={`${s}: ${remaining}/${total} effort left`}>
            <span className="text-[9px] font-bold text-muted-foreground w-2 shrink-0">{SPECIALISM_SHORT[s]}</span>
            <div className="flex gap-px flex-wrap">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={cn('w-1.5 h-2 rounded-[1px]', i < total - remaining ? 'bg-muted-foreground/20' : SPECIALISM_COLORS[s])}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WorkItemCard({ item, assignments, isSelected, onClick, currentDay, draggable }: WorkItemCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, disabled: !draggable });
  const cardAssignments = assignments.filter((a) => a.cardId === item.id);
  const stage = stageOf(item.column);
  const isActive = laneOf(item.column) === 'active';
  // Age = days since it left the backlog, while still in flow.
  const age =
    item.startDay != null && item.endDay == null && currentDay != null
      ? currentDay - item.startDay + 1
      : null;

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={onClick}
      className={cn(
        'w-full rounded-md border p-1.5 transition-all text-sm select-none',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
        isSelected && 'ring-2 ring-primary border-primary',
        item.blocked && 'border-destructive bg-destructive/5',
        !item.blocked && !isSelected && 'border-border bg-card',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-medium truncate text-xs">{item.title}</span>
        <span className="shrink-0 flex items-center gap-1">
          {item.blocked && (
            <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1 py-0.5 rounded">BLOCKED</span>
          )}
          {age != null && (
            <span className={cn('text-[9px] font-medium', age >= 8 ? 'text-destructive' : 'text-muted-foreground')}>
              {age}d
            </span>
          )}
        </span>
      </div>

      {item.column !== 'done' && <EffortPips item={item} />}

      {isActive && item.blocked && (
        <div className="mt-1 text-[10px] text-destructive leading-tight">{item.blockerEffort} to unblock</div>
      )}

      {item.column === 'done' && item.startDay != null && item.endDay != null && (
        <div className="mt-1 text-[10px] text-muted-foreground">Cycle: {item.endDay - item.startDay + 1}d</div>
      )}

      {cardAssignments.length > 0 && (
        <div className="flex gap-0.5 mt-1 flex-wrap">
          {cardAssignments.map((a) => {
            const worker = WORKERS.find((w) => w.id === a.workerId);
            if (!worker) return null;
            const isSpec = worker.specialism === stage;
            return (
              <span
                key={a.workerId}
                className={cn(
                  'inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white',
                  SPECIALISM_COLORS[worker.specialism],
                  !isSpec && 'opacity-60',
                )}
                title={`${worker.name} (${worker.specialism}${isSpec ? ' - specialist' : ' - 60% effective'})`}
              >
                {worker.initials}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
