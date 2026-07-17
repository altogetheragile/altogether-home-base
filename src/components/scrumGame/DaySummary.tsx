import type { ScrumState } from './types';
import { devColor, IMPEDIMENT_EFFECT } from './config';
import { DevBadge } from './DevBadge';
import { cn } from '@/lib/utils';
import { PartyPopper, AlertTriangle, Scissors } from 'lucide-react';

interface DaySummaryProps {
  state: ScrumState;
}

/** Reveals what happened on the last day run: each Developer's die roll (grouped
 *  by the story they swarmed), any impediment that bit, and a celebration for
 *  whatever reached Done. The "juice" that makes Run Day feel like something. */
export function DaySummary({ state }: DaySummaryProps) {
  const last = state.lastDay;
  if (!last || last.rolls.length === 0) return null;

  const devIndex = new Map(state.team.map((d, i) => [d.id, i] as const));
  const devById = new Map(state.team.map((d) => [d.id, d] as const));
  const titleById = new Map(state.productBacklog.map((s) => [s.id, s.title] as const));

  // Group the rolls by the story they were spent on.
  const byStory = new Map<string, { devId: string; roll: number }[]>();
  for (const r of last.rolls) {
    const list = byStory.get(r.storyId) ?? [];
    list.push({ devId: r.devId, roll: r.roll });
    byStory.set(r.storyId, list);
  }
  const completed = last.completed.map((id) => titleById.get(id)).filter(Boolean) as string[];

  return (
    <div className="rounded-lg border border-border bg-card/60 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Day {last.day}{last.dayWeight < 1 ? ' (half day)' : ''} - the dice
        </span>
        {last.impediment && (() => {
          const { kind, addressed } = last.impediment;
          const lost = Math.round((1 - IMPEDIMENT_EFFECT[kind][addressed ? 'addressed' : 'ignored']) * 100);
          const label = kind === 'blocker' ? 'Blocker' : 'Distraction';
          return (
            <span className={cn('flex items-center gap-1 text-[11px]', addressed ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-400')}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {label} cost ~{lost}% today{addressed
                ? kind === 'blocker' ? ' (being escalated)' : ' (handled)'
                : kind === 'blocker' ? ' - escalate it, or it lingers' : ' - a one-day interruption, now passed'}
            </span>
          );
        })()}
      </div>

      {last.refinementCost > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Scissors className="h-3.5 w-3.5" />
          Refinement took {last.refinementCost} effort off today - splitting mid-Sprint is real work.
        </div>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {[...byStory.entries()].map(([storyId, list]) => {
          const total = list.reduce((n, x) => n + x.roll, 0);
          return (
            <div key={storyId} className="flex items-center gap-2">
              <span className="max-w-[10rem] truncate text-xs font-medium">{titleById.get(storyId) ?? storyId}</span>
              <div className="flex items-center gap-1">
                {list.map(({ devId, roll }) => {
                  const dev = devById.get(devId);
                  if (!dev) return null;
                  return (
                    <span key={devId} className="flex items-center gap-0.5" title={`${dev.name} rolled ${roll}`}>
                      <DevBadge initials={dev.initials} colorClass={devColor(devIndex.get(devId) ?? 0)} size="sm" />
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-muted font-mono text-[10px] font-bold">{roll}</span>
                    </span>
                  );
                })}
                <span className="ml-1 font-mono text-[11px] text-muted-foreground">= {total}</span>
              </div>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className={cn('flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs font-medium text-emerald-800',
          'dark:bg-emerald-950/40 dark:text-emerald-300')}>
          <PartyPopper className="h-4 w-4" />
          Done: {completed.join(', ')}
        </div>
      )}
    </div>
  );
}
