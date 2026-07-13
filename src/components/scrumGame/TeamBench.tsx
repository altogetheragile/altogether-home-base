import type { Developer, ScrumState } from './types';
import { devColor } from './config';
import { DevBadge } from './DevBadge';
import { cn } from '@/lib/utils';

interface TeamBenchProps {
  state: ScrumState;
  selectedDevId: string | null;
  onSelect: (devId: string) => void;
  onUnassign: (devId: string) => void;
  /** Titles by story id, so an assigned Developer shows what they're working on. */
  storyTitleById: Map<string, string>;
  /** Whether there is work a benched Developer could pick up - drives the idle nudge. */
  workAvailable: boolean;
  disabled?: boolean;
}

/** The Developer bench: click an idle person to pick them up, then click a story
 *  to put them on it. Click an assigned person to send them back. Idle Developers
 *  do no work, so the bench going empty is the goal each day. */
export function TeamBench({ state, selectedDevId, onSelect, onUnassign, storyTitleById, workAvailable, disabled }: TeamBenchProps) {
  const idle = state.team.filter((d) => !state.assignments[d.id]).length;
  const wasting = idle > 0 && workAvailable && !disabled;

  const pawn = (dev: Developer, index: number) => {
    const storyId = state.assignments[dev.id];
    const assigned = !!storyId;
    const selected = selectedDevId === dev.id && !assigned;
    return (
      <button
        key={dev.id}
        type="button"
        disabled={disabled}
        onClick={() => (assigned ? onUnassign(dev.id) : onSelect(dev.id))}
        title={assigned ? `${dev.name} - working on "${storyTitleById.get(storyId) ?? ''}" (click to send to the bench)` : `${dev.name} - click, then click a story to assign`}
        className={cn(
          'flex items-center gap-1.5 rounded-full border bg-card pl-1 pr-2.5 py-1 transition-all select-none shrink-0',
          !disabled && 'hover:shadow-sm cursor-pointer',
          selected && 'ring-2 ring-primary ring-offset-1 scale-105',
          assigned && 'opacity-40',
          disabled && 'cursor-not-allowed opacity-40',
          !selected && !assigned ? 'border-border' : 'border-transparent',
        )}
      >
        <DevBadge initials={dev.initials} colorClass={devColor(index)} />
        <span className="flex flex-col items-start leading-none">
          <span className="text-xs font-medium">{dev.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {assigned ? (storyTitleById.get(storyId) ?? 'working') : 'on the bench'}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span
        className={cn(
          'shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold',
          idle === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            : wasting ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
            : 'bg-muted text-muted-foreground',
        )}
        title="Developers on the bench do no work today. Assign them to a story."
      >
        {idle === 0 ? 'All working' : wasting ? `${idle} on the bench - work is waiting` : `${idle} on the bench`}
      </span>
      <div className="flex flex-1 flex-nowrap gap-2 overflow-x-auto py-0.5">
        {state.team.map(pawn)}
      </div>
      {selectedDevId && !state.assignments[selectedDevId] && !disabled && (
        <p className="shrink-0 whitespace-nowrap text-sm font-medium text-primary">
          Click a story to assign {state.team.find((d) => d.id === selectedDevId)?.name}
        </p>
      )}
    </div>
  );
}
