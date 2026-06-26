import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { RoundState, Specialism } from './types';
import { DAYS_PER_ROUND, STAGES, pullTarget, laneOf } from './config';
import { StageColumn } from './StageColumn';
import { WorkItemCard } from './WorkItemCard';
import { WorkerPool } from './WorkerPool';
import { DaySummary } from './DaySummary';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkItem, WorkerAssignment } from './types';

/** Done is a drop target for Test-Done cards. Must live INSIDE <DndContext>, so
 *  it's a child component (a useDroppable hook in BoardView's body would sit
 *  outside the context it renders and never register). */
function DoneColumn({ items, assignments, canInteract }: { items: WorkItem[]; assignments: WorkerAssignment[]; canInteract: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'lane:done', disabled: !canInteract });
  return (
    <div className="flex flex-col w-[150px] shrink-0">
      <div className="rounded-t-lg px-2 py-2 border border-b-0 bg-muted border-border">
        <h3 className="font-semibold text-sm">Done</h3>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 border border-border rounded-b-lg bg-card/50 p-1.5 space-y-1.5 min-h-[200px] overflow-y-auto',
          isOver && 'ring-2 ring-primary ring-inset bg-primary/5',
        )}
      >
        {items.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-4">Empty</div>}
        {items.map((item) => (
          <WorkItemCard key={item.id} item={item} assignments={assignments} isSelected={false} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}

interface BoardViewProps {
  round: RoundState;
  onPullItem: (cardId: string) => void;
  onReorderItem: (activeId: string, overId: string) => void;
  onAssignWorker: (workerId: string, cardId: string) => void;
  onUnassignWorker: (workerId: string) => void;
  onSetWip: (stage: Specialism, value: number) => void;
  onSetEnforceWip: (enforce: boolean) => void;
  onRunDay: () => void;
  onNextDay: () => void;
}

export function BoardView({
  round,
  onPullItem,
  onReorderItem,
  onAssignWorker,
  onUnassignWorker,
  onSetWip,
  onSetEnforceWip,
  onRunDay,
  onNextDay,
}: BoardViewProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const canInteract = round.dayPhase === 'assign';
  // A small drag threshold so a plain click still assigns workers.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleAssignCard = (cardId: string) => {
    if (!canInteract || !selectedWorkerId) return;
    onAssignWorker(selectedWorkerId, cardId);
    setSelectedWorkerId(null);
  };
  const handleSelectWorker = (workerId: string) =>
    setSelectedWorkerId((prev) => (prev === workerId ? null : workerId));

  // One handler routes three gestures by id namespace:
  //   worker:<id> -> card:<id>  = assign a worker to an active card
  //   card:<id>   -> lane:<col> = pull the card onward (if a valid next zone)
  //   card:<id>   -> card:<id>  = reorder within the same lane
  const handleDragEnd = (e: DragEndEvent) => {
    const active = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;
    if (!over) return;

    if (active.startsWith('worker:')) {
      if (over.startsWith('card:')) {
        const workerId = active.slice('worker:'.length);
        const cardId = over.slice('card:'.length);
        const item = round.items.find((i) => i.id === cardId);
        if (item && laneOf(item.column) === 'active') onAssignWorker(workerId, cardId);
      }
      return;
    }

    if (active.startsWith('card:')) {
      const cardId = active.slice('card:'.length);
      const item = round.items.find((i) => i.id === cardId);
      if (!item) return;
      if (over.startsWith('lane:')) {
        if (pullTarget(item.column) === over.slice('lane:'.length)) onPullItem(cardId);
      } else if (over.startsWith('card:')) {
        const overId = over.slice('card:'.length);
        if (overId === cardId) return;
        const overItem = round.items.find((i) => i.id === overId);
        if (!overItem) return;
        if (overItem.column === item.column) onReorderItem(cardId, overId); // same lane → reorder
        else if (pullTarget(item.column) === overItem.column) onPullItem(cardId); // dropped onto a card in the target lane → pull
      }
    }
  };

  const lastSummary = round.dayHistory[round.dayHistory.length - 1];
  const isLastDay = round.day >= DAYS_PER_ROUND;
  const items = round.items;
  const backlogItems = items.filter((i) => i.column === 'backlog');
  const doneItems = items.filter((i) => i.column === 'done');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-3">
      {/* DndContext spans the worker pool AND the board so pawns can be dragged onto cards */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Top bar */}
      <div className="flex items-center gap-4 flex-wrap shrink-0">
        <div className="shrink-0">
          <h2 className="text-lg font-bold leading-tight">
            Round {round.roundNumber} - Day {round.day}/{DAYS_PER_ROUND}
          </h2>
          <p className="text-xs text-muted-foreground">
            {doneItems.length} done · drag cards across to pull work, then assign your people
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <WorkerPool
            assignments={round.assignments}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={handleSelectWorker}
            onUnassign={onUnassignWorker}
            disabled={!canInteract}
          />
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {round.wipLimits && (
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={round.enforceWip}
                onChange={(e) => onSetEnforceWip(e.target.checked)}
                className="accent-primary"
              />
              Enforce WIP
            </label>
          )}
          {canInteract && (
            <Button onClick={onRunDay} size="lg" disabled={round.assignments.length === 0}>
              Run Day
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
        <div className="flex gap-2 overflow-x-auto flex-1 min-h-0 pb-2">
          {/* Backlog — narrow single column; cards drag into Analysis */}
          <div className="flex flex-col w-[150px] shrink-0">
            <div className="rounded-t-lg px-2 py-2 border border-b-0 bg-muted border-border">
              <h3 className="font-semibold text-sm">Backlog</h3>
            </div>
            <div className="flex-1 border border-border rounded-b-lg bg-card/50 p-1.5 space-y-1.5 min-h-[200px] overflow-y-auto">
              {backlogItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-4">Empty</div>}
              {backlogItems.map((item) => (
                <WorkItemCard key={item.id} item={item} assignments={round.assignments} isSelected={false} onClick={() => {}} draggable={canInteract} />
              ))}
            </div>
          </div>

          {/* Stages */}
          {STAGES.map((s) => (
            <StageColumn
              key={s.stage}
              stage={s.stage}
              label={s.label}
              items={items}
              assignments={round.assignments}
              wipLimits={round.wipLimits}
              enforceWip={round.enforceWip}
              canInteract={canInteract}
              currentDay={round.day}
              selectedWorkerId={selectedWorkerId}
              onAssignCard={handleAssignCard}
              onSetWip={onSetWip}
            />
          ))}

          {/* Done — narrow single column; drop zone for Test Done cards */}
          <DoneColumn items={doneItems} assignments={round.assignments} canInteract={canInteract} />
        </div>
      </DndContext>

      {/* Day results */}
      {round.dayPhase === 'results' && lastSummary && (
        <div className="shrink-0">
          <DaySummary summary={lastSummary} isLastDay={isLastDay} onNextDay={onNextDay} />
        </div>
      )}
    </div>
  );
}
