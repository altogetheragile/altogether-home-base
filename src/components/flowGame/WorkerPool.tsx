import { useDraggable } from '@dnd-kit/core';
import type { WorkerAssignment, WorkerDef, StageDef } from './types';
import { stageColor } from './config';
import { cn } from '@/lib/utils';

interface WorkerPoolProps {
  workers: WorkerDef[];
  assignments: WorkerAssignment[];
  /** The configured stages, for a worker's colour and specialism label. */
  stages: StageDef[];
  selectedWorkerId: string | null;
  onSelectWorker: (workerId: string) => void;
  onUnassign: (workerId: string) => void;
  disabled?: boolean;
  /** Whether any active card has work a worker could progress today. Drives the
   *  idle nudge: idle workers only "waste" capacity when there is work to do. */
  workAvailable?: boolean;
}

function WorkerPawn({
  worker,
  stages,
  isAssigned,
  isSelected,
  disabled,
  onSelectWorker,
  onUnassign,
}: {
  worker: WorkerDef;
  stages: StageDef[];
  isAssigned: boolean;
  isSelected: boolean;
  disabled?: boolean;
  onSelectWorker: (id: string) => void;
  onUnassign: (id: string) => void;
}) {
  const specialismLabel = stages.find((s) => s.id === worker.specialism)?.name ?? worker.specialism;
  // Drag a pawn onto a work item to assign it; a plain click still selects (6px threshold).
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `worker:${worker.id}`, disabled });
  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={disabled}
      {...listeners}
      {...attributes}
      onClick={() => (isAssigned ? onUnassign(worker.id) : onSelectWorker(worker.id))}
      className={cn(
        'flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 transition-all border select-none',
        !disabled && 'hover:shadow-sm cursor-grab active:cursor-grabbing',
        isSelected && 'ring-2 ring-primary ring-offset-1 scale-105',
        isAssigned && 'opacity-40',
        isDragging && 'opacity-30',
        disabled && 'cursor-not-allowed opacity-30',
        !isSelected && !isAssigned && 'border-border bg-card',
      )}
      title={`${worker.name} - ${specialismLabel} specialist — drag onto a card, or click then click a card`}
    >
      <span
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
          stageColor(worker.specialism, stages),
        )}
      >
        {worker.initials}
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-xs font-medium">{worker.name}</span>
        <span className="text-[10px] text-muted-foreground">{specialismLabel}</span>
      </span>
    </button>
  );
}

export function WorkerPool({ workers, assignments, stages, selectedWorkerId, onSelectWorker, onUnassign, disabled, workAvailable }: WorkerPoolProps) {
  const assignedIds = new Set(assignments.map((a) => a.workerId));
  const idle = workers.length - assignedIds.size;
  // Idle workers only waste capacity when there's work to do — flag amber then,
  // neutral when there's nothing they could pick up, emerald when all assigned.
  const wasting = idle > 0 && !!workAvailable;
  return (
    <div className="flex items-center gap-3">
      {!disabled && (
        <span
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap shrink-0',
            idle === 0 ? 'bg-emerald-100 text-emerald-800'
              : wasting ? 'bg-amber-100 text-amber-800'
              : 'bg-muted text-muted-foreground',
          )}
          title="Workers not assigned to a card today sit idle and do no work."
        >
          {idle === 0 ? 'All working' : wasting ? `${idle} idle - work is waiting` : `${idle} idle`}
        </span>
      )}
      <div className="flex gap-2 flex-wrap justify-center">
        {workers.map((worker) => (
          <WorkerPawn
            key={worker.id}
            worker={worker}
            stages={stages}
            isAssigned={assignedIds.has(worker.id)}
            // A worker who is already assigned is never "awaiting placement".
            isSelected={selectedWorkerId === worker.id && !assignedIds.has(worker.id)}
            disabled={disabled}
            onSelectWorker={onSelectWorker}
            onUnassign={onUnassign}
          />
        ))}
      </div>
      {selectedWorkerId && !assignedIds.has(selectedWorkerId) && (
        <p className="text-sm text-primary font-medium whitespace-nowrap">
          Drag onto a card, or click a card to assign {workers.find((w) => w.id === selectedWorkerId)?.name}
        </p>
      )}
    </div>
  );
}
