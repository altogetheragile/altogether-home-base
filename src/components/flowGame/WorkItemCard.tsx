import type { WorkItem, WorkerAssignment, Specialism } from './types';
import { WORKERS, ACTIVE_COLUMNS, stageOf, laneOf } from './config';
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
  /** Shown when the item can be pulled onward by the player. */
  pullable?: boolean;
  pullDisabled?: boolean;
  pullLabel?: string;
  onPull?: () => void;
}

/** Remaining effort per stage, as small coloured pips (TWiG-style at-a-glance load). */
function EffortPips({ item }: { item: WorkItem }) {
  return (
    <div className="flex items-end gap-2 mt-1.5">
      {ACTIVE_COLUMNS.map((s) => {
        const total = item.effortTotal[s];
        const remaining = item.effortRemaining[s];
        return (
          <div key={s} className="flex flex-col items-start gap-0.5" title={`${s}: ${remaining}/${total} effort left`}>
            <div className="flex gap-px">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1.5 h-2.5 rounded-[1px]',
                    i < total - remaining ? 'bg-muted-foreground/25' : SPECIALISM_COLORS[s],
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WorkItemCard({
  item,
  assignments,
  isSelected,
  onClick,
  pullable,
  pullDisabled,
  pullLabel,
  onPull,
}: WorkItemCardProps) {
  const cardAssignments = assignments.filter((a) => a.cardId === item.id);
  const stage = stageOf(item.column);
  const isActive = laneOf(item.column) === 'active';

  return (
    <div
      className={cn(
        'w-full rounded-md border p-2 transition-all text-sm',
        isSelected && 'ring-2 ring-primary border-primary',
        item.blocked && 'border-destructive bg-destructive/5',
        !item.blocked && !isSelected && 'border-border bg-card',
      )}
    >
      <button type="button" onClick={onClick} className="w-full text-left cursor-pointer">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium truncate">{item.title}</span>
          {item.blocked && (
            <span className="shrink-0 text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              BLOCKED
            </span>
          )}
        </div>

        {/* Per-stage effort load (hidden once Done) */}
        {item.column !== 'done' && <EffortPips item={item} />}

        {isActive && stage && (
          <div className="mt-1 text-xs text-muted-foreground">
            {item.effortRemaining[stage]} {stage} effort left
            {item.blocked && <span className="text-destructive ml-2">{item.blockerEffort} to unblock</span>}
          </div>
        )}

        {item.column === 'done' && item.startDay != null && item.endDay != null && (
          <div className="mt-1 text-xs text-muted-foreground">
            Cycle time: {item.endDay - item.startDay + 1} days
          </div>
        )}

        {/* Assigned workers */}
        {cardAssignments.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {cardAssignments.map((a) => {
              const worker = WORKERS.find((w) => w.id === a.workerId);
              if (!worker) return null;
              const isSpec = worker.specialism === stage;
              return (
                <span
                  key={a.workerId}
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white',
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
      </button>

      {pullable && onPull && (
        <button
          type="button"
          onClick={onPull}
          disabled={pullDisabled}
          className={cn(
            'mt-2 w-full text-xs font-semibold rounded px-2 py-1 transition-colors',
            pullDisabled
              ? 'bg-muted text-muted-foreground/50 cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
          title={pullDisabled ? 'Destination stage is at its WIP limit — finish something first' : undefined}
        >
          {pullLabel ?? 'Pull →'}
        </button>
      )}
    </div>
  );
}
