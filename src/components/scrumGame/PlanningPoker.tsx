import { useState } from 'react';
import type { ScrumState, Story } from './types';
import { pokerHand, estimateSuggestion } from './engine';
import { FIBONACCI, devColor } from './config';
import { DevBadge } from './DevBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Spade, Sparkles } from 'lucide-react';

interface PlanningPokerProps {
  state: ScrumState;
  story: Story;
  onEstimate: (storyId: string, points: number) => void;
  /** Compact mode drops the per-Developer reveal (for narrow columns like the
   *  board's Backlog sidebar); the roomy Refinement screen shows the full hand. */
  compact?: boolean;
  disabled?: boolean;
}

/** Planning poker for one un-sized Backlog item: the Developers reveal their cards
 *  (relative sizes, not hours), the spread invites a quick discussion, and the team
 *  commits the size it agrees on. Teaches that the people doing the work estimate,
 *  and that estimates are relative and collaborative - not handed down. */
export function PlanningPoker({ state, story, onEstimate, compact, disabled }: PlanningPokerProps) {
  const [open, setOpen] = useState(false);
  const devIndex = new Map(state.team.map((d, i) => [d.id, i] as const));
  const devById = new Map(state.team.map((d) => [d.id, d] as const));
  const hand = pokerHand(story, state.team);
  const suggestion = estimateSuggestion(hand);

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        title="Un-sized - the team estimates it before it is Ready"
        className="flex w-full items-center gap-2 rounded-md border border-dashed border-sky-300 bg-sky-50/60 px-2.5 py-1.5 text-left text-sm hover:bg-sky-100 disabled:opacity-60 dark:border-sky-800/50 dark:bg-sky-950/20"
      >
        <Spade className="h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-400" />
        <span className="flex-1 truncate text-muted-foreground">{story.title}</span>
        <span className="shrink-0 text-[10px] font-medium text-sky-700 dark:text-sky-400">estimate</span>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">v{story.value}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-sky-300 bg-sky-50/70 p-2.5 dark:border-sky-800/50 dark:bg-sky-950/20">
      <div className="flex items-center gap-2">
        <Spade className="h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-400" />
        <span className="flex-1 truncate text-sm font-medium">{story.title}</span>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">v{story.value}</span>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          {hand.map(({ devId, card }) => {
            const dev = devById.get(devId);
            if (!dev) return null;
            return (
              <span key={devId} className="flex items-center gap-0.5" title={`${dev.name} played ${card}`}>
                <DevBadge initials={dev.initials} colorClass={devColor(devIndex.get(devId) ?? 0)} size="sm" />
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-background px-1 font-mono text-[11px] font-bold shadow-sm">{card}</span>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-sky-600 dark:text-sky-400" />
        Team suggests <strong className="text-foreground">{suggestion}</strong>. Estimate relative size, not hours - and it is the Developers' call.
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {FIBONACCI.map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onEstimate(story.id, n)}
            className={cn(
              'h-7 min-w-8 rounded border px-2 font-mono text-xs transition-colors disabled:opacity-60',
              n === suggestion
                ? 'border-sky-500 bg-sky-500/15 font-bold text-sky-800 dark:text-sky-200'
                : 'border-border bg-background hover:border-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30',
            )}
          >
            {n}
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
