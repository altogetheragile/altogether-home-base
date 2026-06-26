import { useDraggable } from '@dnd-kit/core';
import type { WorkerAssignment, Specialism, WorkerDef } from './types';
import { WORKERS } from './config';
import { cn } from '@/lib/utils';

const SPECIALISM_COLORS: Record<Specialism, string> = {
  analysis: 'bg-blue-500',
  development: 'bg-emerald-500',
  test: 'bg-amber-500',
};

const SPECIALISM_LABELS: Record<Specialism, string> = {
  analysis: 'Analysis',
  development: 'Dev',
  test: 'Test',
};

interface WorkerPoolProps {
  assignments: WorkerAssignment[];
  selectedWorkerId: string | null;
  onSelectWorker: (workerId: string) => void;
  onUnassign: (workerId: string) => void;
  disabled?: boolean;
}

function WorkerPawn({
  worker,
  isAssigned,
  isSelected,
  disabled,
  onSelectWorker,
  onUnassign,
}: {
  worker: WorkerDef;
  isAssigned: boolean;
  isSelected: boolean;
  disabled?: boolean;
  onSelectWorker: (id: string) => void;
  onUnassign: (id: string) => void;
}) {
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
      title={`${worker.name} - ${SPECIALISM_LABELS[worker.specialism]} specialist — drag onto a card, or click then click a card`}
    >
      <span
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0',
          SPECIALISM_COLORS[worker.specialism],
        )}
      >
        {worker.initials}
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-xs font-medium">{worker.name}</span>
        <span className="text-[10px] text-muted-foreground">{SPECIALISM_LABELS[worker.specialism]}</span>
      </span>
    </button>
  );
}

export function WorkerPool({ assignments, selectedWorkerId, onSelectWorker, onUnassign, disabled }: WorkerPoolProps) {
  const assignedIds = new Set(assignments.map((a) => a.workerId));
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2 flex-wrap justify-center">
        {WORKERS.map((worker) => (
          <WorkerPawn
            key={worker.id}
            worker={worker}
            isAssigned={assignedIds.has(worker.id)}
            isSelected={selectedWorkerId === worker.id}
            disabled={disabled}
            onSelectWorker={onSelectWorker}
            onUnassign={onUnassign}
          />
        ))}
      </div>
      {selectedWorkerId && (
        <p className="text-sm text-primary font-medium whitespace-nowrap">
          Drag onto a card, or click a card to assign {WORKERS.find((w) => w.id === selectedWorkerId)?.name}
        </p>
      )}
    </div>
  );
}
