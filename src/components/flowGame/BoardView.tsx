import { useState } from 'react';
import type { RoundState } from './types';
import { DAYS_PER_ROUND, STAGES, stageCount } from './config';
import { StageColumn } from './StageColumn';
import { WorkItemCard } from './WorkItemCard';
import { WorkerPool } from './WorkerPool';
import { DaySummary } from './DaySummary';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BoardViewProps {
  round: RoundState;
  onPullItem: (cardId: string) => void;
  onAssignWorker: (workerId: string, cardId: string) => void;
  onUnassignWorker: (workerId: string) => void;
  onRunDay: () => void;
  onNextDay: () => void;
}

export function BoardView({
  round,
  onPullItem,
  onAssignWorker,
  onUnassignWorker,
  onRunDay,
  onNextDay,
}: BoardViewProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const canInteract = round.dayPhase === 'assign';

  const handleAssignCard = (cardId: string) => {
    if (!canInteract || !selectedWorkerId) return;
    onAssignWorker(selectedWorkerId, cardId);
    setSelectedWorkerId(null);
  };
  const handleSelectWorker = (workerId: string) =>
    setSelectedWorkerId((prev) => (prev === workerId ? null : workerId));

  const lastSummary = round.dayHistory[round.dayHistory.length - 1];
  const isLastDay = round.day >= DAYS_PER_ROUND;
  const items = round.items;
  const backlogItems = items.filter((i) => i.column === 'backlog');
  const doneItems = items.filter((i) => i.column === 'done');
  const doneCount = doneItems.length;

  // Backlog pulls into Analysis — gated by the Analysis WIP limit (round 2).
  const analysisFull =
    round.wipLimits != null && stageCount(items, 'analysis') >= round.wipLimits.analysis;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-3">
      {/* Top bar: header + workers + run button */}
      <div className="flex items-center gap-4 flex-wrap shrink-0">
        <div className="shrink-0">
          <h2 className="text-lg font-bold leading-tight">
            Round {round.roundNumber} - Day {round.day}/{DAYS_PER_ROUND}
          </h2>
          <p className="text-xs text-muted-foreground">
            {round.wipLimits ? 'WIP limits active' : 'No WIP limits'} · {doneCount} done · pull work across, then assign your people
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

        <div className="shrink-0">
          {canInteract && (
            <Button onClick={onRunDay} size="lg" disabled={round.assignments.length === 0}>
              Run Day
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 pb-2">
        {/* Backlog */}
        <div className="flex flex-col min-w-[170px] flex-1">
          <div className="rounded-t-lg px-3 py-2 border border-b-0 bg-muted border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Backlog</h3>
            <span className="text-xs text-muted-foreground">{backlogItems.length}</span>
          </div>
          <div className="flex-1 border border-border rounded-b-lg bg-card/50 p-2 space-y-2 min-h-[200px] overflow-y-auto">
            {backlogItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-4">Empty</div>}
            {backlogItems.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                assignments={round.assignments}
                isSelected={false}
                onClick={() => {}}
                pullable
                pullDisabled={!canInteract || analysisFull}
                pullLabel="Start (Analysis) →"
                onPull={() => onPullItem(item.id)}
              />
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
            canInteract={canInteract}
            selectedWorkerId={selectedWorkerId}
            onAssignCard={handleAssignCard}
            onPull={onPullItem}
          />
        ))}

        {/* Done */}
        <div className="flex flex-col min-w-[170px] flex-1">
          <div className="rounded-t-lg px-3 py-2 border border-b-0 bg-muted border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Done</h3>
            <span className="text-xs text-muted-foreground">{doneCount}</span>
          </div>
          <div className={cn('flex-1 border border-border rounded-b-lg bg-card/50 p-2 space-y-2 min-h-[200px] overflow-y-auto')}>
            {doneItems.length === 0 && <div className="text-xs text-muted-foreground/40 text-center py-4">Empty</div>}
            {doneItems.map((item) => (
              <WorkItemCard key={item.id} item={item} assignments={round.assignments} isSelected={false} onClick={() => {}} />
            ))}
          </div>
        </div>
      </div>

      {/* Day results */}
      {round.dayPhase === 'results' && lastSummary && (
        <div className="shrink-0">
          <DaySummary summary={lastSummary} isLastDay={isLastDay} onNextDay={onNextDay} />
        </div>
      )}
    </div>
  );
}
