import { useState } from 'react';
import type { RoundState, ColumnId, Specialism } from './types';
import { COLUMNS, DAYS_PER_ROUND } from './config';
import { KanbanColumn } from './KanbanColumn';
import { WorkerPool } from './WorkerPool';
import { DaySummary } from './DaySummary';
import { Button } from '@/components/ui/button';

interface BoardViewProps {
  round: RoundState;
  onAssignWorker: (workerId: string, cardId: string) => void;
  onUnassignWorker: (workerId: string) => void;
  onRunDay: () => void;
  onNextDay: () => void;
}

export function BoardView({
  round,
  onAssignWorker,
  onUnassignWorker,
  onRunDay,
  onNextDay,
}: BoardViewProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    if (round.dayPhase !== 'assign' || !selectedWorkerId) return;
    const item = round.items.find((i) => i.id === cardId);
    if (!item || item.column === 'backlog' || item.column === 'done') return;
    onAssignWorker(selectedWorkerId, cardId);
    setSelectedWorkerId(null);
  };

  const handleSelectWorker = (workerId: string) => {
    setSelectedWorkerId((prev) => (prev === workerId ? null : workerId));
  };

  const lastSummary = round.dayHistory[round.dayHistory.length - 1];
  const isLastDay = round.day >= DAYS_PER_ROUND;
  const doneCount = round.items.filter((i) => i.column === 'done').length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-3">
      {/* Top bar: header + workers + run button in one row */}
      <div className="flex items-center gap-4 flex-wrap shrink-0">
        <div className="shrink-0">
          <h2 className="text-lg font-bold leading-tight">
            Round {round.roundNumber} — Day {round.day}/{DAYS_PER_ROUND}
          </h2>
          <p className="text-xs text-muted-foreground">
            {round.wipLimits ? 'WIP limits active' : 'No WIP limits'} · {doneCount} done
          </p>
        </div>

        <div className="flex-1 flex justify-center">
          <WorkerPool
            assignments={round.assignments}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={handleSelectWorker}
            onUnassign={onUnassignWorker}
            disabled={round.dayPhase !== 'assign'}
          />
        </div>

        <div className="shrink-0">
          {round.dayPhase === 'assign' && (
            <Button onClick={onRunDay} size="lg" disabled={round.assignments.length === 0}>
              Run Day
            </Button>
          )}
        </div>
      </div>

      {/* Board — fills remaining height */}
      <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 pb-2">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            items={round.items}
            assignments={round.assignments}
            selectedCardId={selectedWorkerId ? null : undefined!}
            onCardClick={handleCardClick}
            wipLimit={
              col.type === 'active' && round.wipLimits
                ? round.wipLimits[col.id as Specialism]
                : null
            }
          />
        ))}
      </div>

      {/* Day results — pinned at bottom */}
      {round.dayPhase === 'results' && lastSummary && (
        <div className="shrink-0">
          <DaySummary summary={lastSummary} isLastDay={isLastDay} onNextDay={onNextDay} />
        </div>
      )}
    </div>
  );
}
