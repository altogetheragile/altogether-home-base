import { useState } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { RoundState, Specialism } from './types';
import { DAYS_PER_ROUND, pullTarget, laneOf, stageOf, underfilledStage, bottleneckStage, isLastStage } from './config';
import { StageColumn } from './StageColumn';
import { WorkItemCard } from './WorkItemCard';
import { WorkerPool } from './WorkerPool';
import { DaySummary } from './DaySummary';
import { RoundReport } from './RoundReport';
import { TeamEditor } from './TeamEditor';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkItem, WorkerAssignment, WorkerDef, StageDef } from './types';

/** Done is a drop target for Test-Done cards. Must live INSIDE <DndContext>, so
 *  it's a child component (a useDroppable hook in BoardView's body would sit
 *  outside the context it renders and never register). */
function DoneColumn({ items, assignments, workers, stages, canInteract }: { items: WorkItem[]; assignments: WorkerAssignment[]; workers: WorkerDef[]; stages: StageDef[]; canInteract: boolean }) {
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
          <WorkItemCard key={item.id} item={item} assignments={assignments} workers={workers} stages={stages} isSelected={false} onClick={() => {}} />
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
  onSetUseWip: (use: boolean) => void;
  onSetEnforceWip: (enforce: boolean) => void;
  onSetMaximizeWip: (maximize: boolean) => void;
  onSetEnforceExitCriteria: (enforce: boolean) => void;
  onToggleCriterion: (cardId: string, criterionId: string) => void;
  onRunDay: () => void;
  onNextDay: () => void;
  onSaveGame?: () => void;
  onEditTeam: (workers: WorkerDef[]) => void;
}

export function BoardView({
  round,
  onPullItem,
  onReorderItem,
  onAssignWorker,
  onUnassignWorker,
  onSetWip,
  onSetUseWip,
  onSetEnforceWip,
  onSetEnforceExitCriteria,
  onToggleCriterion,
  onSetMaximizeWip,
  onRunDay,
  onNextDay,
  onSaveGame,
  onEditTeam,
}: BoardViewProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const canInteract = round.dayPhase === 'assign';
  // Cross-device drag. Mouse: a 6px threshold so a plain click still assigns
  // workers (drag only kicks in past 6px). Touch: press-and-hold ~200ms to start
  // a drag, so a quick swipe scrolls the board/columns and a tap still assigns.
  // This is what makes the board usable on iPad — a bare PointerSensor treats
  // every touch as a scroll and never starts the drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

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
        if (item && laneOf(item.column) === 'active') {
          onAssignWorker(workerId, cardId);
          // Clear the pending selection when we place that worker, so the
          // "click a card to assign X" prompt doesn't linger once X is assigned.
          if (workerId === selectedWorkerId) setSelectedWorkerId(null);
        }
      }
      return;
    }

    if (active.startsWith('card:')) {
      const cardId = active.slice('card:'.length);
      const item = round.items.find((i) => i.id === cardId);
      if (!item) return;
      if (over.startsWith('lane:')) {
        if (pullTarget(item.column, round.stages) === over.slice('lane:'.length)) onPullItem(cardId);
      } else if (over.startsWith('card:')) {
        const overId = over.slice('card:'.length);
        if (overId === cardId) return;
        const overItem = round.items.find((i) => i.id === overId);
        if (!overItem) return;
        if (overItem.column === item.column) onReorderItem(cardId, overId); // same lane → reorder
        else if (pullTarget(item.column, round.stages) === overItem.column) onPullItem(cardId); // dropped onto a card in the target lane → pull
      }
    }
  };

  const lastSummary = round.dayHistory[round.dayHistory.length - 1];
  const isLastDay = round.day >= DAYS_PER_ROUND;
  const items = round.items;
  const backlogItems = items.filter((i) => i.column === 'backlog');
  const doneItems = items.filter((i) => i.column === 'done');
  // Is there any active work a worker could actually progress today? When there
  // isn't (everything's in Done, or only sitting in Done-lanes waiting to be
  // pulled), we must still let the day run — otherwise a player who clears the
  // board before day 20 is soft-locked, unable to reach the end-of-round metrics.
  const hasAssignableWork = items.some(
    (i) => laneOf(i.column) === 'active' && (i.blocked || i.effortRemaining[stageOf(i.column)!] > 0),
  );
  // Maximize WIP: block Run Day while a stage is below its limit with work waiting.
  const blockedStage = round.maximizeWip ? underfilledStage(items, round.wipLimits, round.stages) : null;
  const stageLabel = blockedStage ? round.stages.find((s) => s.id === blockedStage)?.name : null;
  // Bottleneck: a full stage with work queued in front of it (P4: see where flow stalls).
  const bottleneck = bottleneckStage(items, round.wipLimits, round.stages);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] p-4 gap-3">
      {/* DndContext spans the worker pool AND the board so pawns can be dragged onto cards */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Top bar — row 1: title on the left, actions on the right. The team gets
          its own full-width strip below (row 2) so a large roster never squeezes
          these controls or wraps into a tall block. */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="shrink-0">
          <h2 className="text-lg font-bold leading-tight">
            Round {round.roundNumber} - Day {round.day}/{DAYS_PER_ROUND}
          </h2>
          <p className="text-xs text-muted-foreground">
            {doneItems.length} done · drag cards across to pull work, then assign your people
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <TeamEditor workers={round.workers} stages={round.stages} onSave={onEditTeam} />
          {onSaveGame && (
            <Button variant="outline" size="sm" onClick={onSaveGame}>
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
          )}
          <RoundReport round={round} />
          <div className="flex flex-col gap-0.5">
            <label
              className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
              title="Use WIP limits: off means the columns are uncapped (an undisciplined team). Turn on to cap each stage and reveal its -/+ editor."
            >
              <input type="checkbox" checked={!!round.wipLimits} onChange={(e) => onSetUseWip(e.target.checked)} className="accent-primary" />
              Use WIP limits
            </label>
            {round.wipLimits && (
              <>
                <label
                  className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
                  title="Enforce WIP: pulling a card into a stage that is already at its limit is blocked - finish something first."
                >
                  <input type="checkbox" checked={round.enforceWip} onChange={(e) => onSetEnforceWip(e.target.checked)} className="accent-primary" />
                  Enforce WIP
                </label>
                <label
                  className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
                  title="Maximize WIP: you cannot run the day while a stage sits below its limit with work waiting upstream - don't leave capacity idle."
                >
                  <input type="checkbox" checked={round.maximizeWip} onChange={(e) => onSetMaximizeWip(e.target.checked)} className="accent-primary" />
                  Maximize WIP
                </label>
              </>
            )}
            <label
              className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
              title="Enforce exit criteria: an item can't be pulled out of a stage until that stage's exit criteria are all ticked - the quality gate bites."
            >
              <input type="checkbox" checked={round.enforceExitCriteria} onChange={(e) => onSetEnforceExitCriteria(e.target.checked)} className="accent-primary" />
              Enforce exit criteria
            </label>
          </div>
          {canInteract && (
            <div className="flex flex-col items-end gap-0.5">
              <Button
                onClick={onRunDay}
                size="lg"
                disabled={(round.assignments.length === 0 && hasAssignableWork) || !!blockedStage}
              >
                Run Day
              </Button>
              {blockedStage ? (
                <span className="text-[10px] text-amber-700 leading-tight">Fill {stageLabel} to its WIP limit first</span>
              ) : round.assignments.length === 0 && hasAssignableWork ? (
                <span className="text-[10px] text-muted-foreground leading-tight">Assign a worker to run the day</span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Top bar — row 2: the team, as a single horizontal strip that scrolls
          when the roster is large rather than wrapping into several rows. */}
      <div className="shrink-0">
        <WorkerPool
          workers={round.workers}
          assignments={round.assignments}
          stages={round.stages}
          selectedWorkerId={selectedWorkerId}
          onSelectWorker={handleSelectWorker}
          onUnassign={onUnassignWorker}
          disabled={!canInteract}
          workAvailable={hasAssignableWork}
        />
      </div>

      {/* New-blocker alert: blockers land silently on active cards as a day
          begins, so call them out until the day is run. */}
      {canInteract && round.newBlockers.length > 0 && (
        <div className="shrink-0 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
          {round.newBlockers.length} new blocker{round.newBlockers.length > 1 ? 's' : ''} appeared overnight - assign a worker to clear{round.newBlockers.length > 1 ? ' each one' : ' it'} before that work resumes.
        </div>
      )}

      {/* Board */}
        <div className="flex gap-2 overflow-x-auto flex-1 min-h-0 pb-2">
          {/* Backlog — two compact cards wide so more of the queue is visible;
              cards drag into Analysis. */}
          <div className="flex flex-col w-[292px] shrink-0">
            <div className="rounded-t-lg px-2 py-2 border border-b-0 bg-muted border-border">
              <h3 className="font-semibold text-sm">Backlog <span className="text-muted-foreground font-normal">({backlogItems.length})</span></h3>
            </div>
            <div className="flex-1 border border-border rounded-b-lg bg-card/50 p-1.5 grid grid-cols-2 gap-1 content-start min-h-[200px] overflow-y-auto">
              {backlogItems.length === 0 && <div className="col-span-2 text-xs text-muted-foreground/40 text-center py-4">Empty</div>}
              {backlogItems.map((item) => (
                <WorkItemCard key={item.id} item={item} assignments={round.assignments} workers={round.workers} stages={round.stages} isSelected={false} onClick={() => {}} draggable={canInteract} compact />
              ))}
            </div>
          </div>

          {/* Stages */}
          {round.stages.map((s) => (
            <StageColumn
              key={s.id}
              stage={s.id}
              label={s.name}
              items={items}
              assignments={round.assignments}
              workers={round.workers}
              wipLimits={round.wipLimits}
              enforceWip={round.enforceWip}
              stages={round.stages}
              isBottleneck={bottleneck === s.id}
              canInteract={canInteract}
              currentDay={round.day}
              selectedWorkerId={selectedWorkerId}
              hasDoneLane={!isLastStage(s.id, round.stages)}
              onAssignCard={handleAssignCard}
              onSetWip={onSetWip}
              onToggleCriterion={onToggleCriterion}
            />
          ))}

          {/* Done — narrow single column; drop zone for Test Done cards */}
          <DoneColumn items={doneItems} assignments={round.assignments} workers={round.workers} stages={round.stages} canInteract={canInteract} />
        </div>
      </DndContext>

      {/* Day results */}
      {round.dayPhase === 'results' && lastSummary && (
        <div className="shrink-0">
          <DaySummary summary={lastSummary} workers={round.workers} isLastDay={isLastDay} onNextDay={onNextDay} />
        </div>
      )}
    </div>
  );
}
