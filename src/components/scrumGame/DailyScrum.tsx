import type { ScrumState } from './types';
import { sprintOutlook } from './engine';
import { cn } from '@/lib/utils';
import { CalendarClock } from 'lucide-react';

interface DailyScrumProps {
  state: ScrumState;
}

const STATUS = {
  ahead: { label: 'Ahead of the plan', tone: 'emerald', hint: 'Consider renegotiating with the Product Owner to pull a little more in.' },
  ontrack: { label: 'On track for the Sprint Goal', tone: 'emerald', hint: 'Keep the plan focused - swarm on the nearest story to Done.' },
  atrisk: { label: 'At risk', tone: 'amber', hint: 'Slipping behind the ideal. Swarm the team, cut work in progress, clear impediments.' },
  behind: { label: 'Behind the plan', tone: 'rose', hint: 'The forecast is at risk. Focus everyone on the fewest stories, and talk to the PO about the Sprint Goal.' },
  complete: { label: 'Committed work is done', tone: 'emerald', hint: 'The Sprint Goal is met. Pull in more with the PO, or review.' },
} as const;

const TONES = {
  emerald: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30',
  amber: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
  rose: 'border-rose-300 bg-rose-50 dark:bg-rose-950/30',
} as const;

const DOT = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' } as const;

/** The Daily Scrum, performed: the Developers' event. Each day they inspect
 *  progress toward the Sprint Goal, then re-plan the day (who works on what). The
 *  Scrum Master's impediments and any Product Owner change happen around it, not
 *  as part of it. */
export function DailyScrum({ state }: DailyScrumProps) {
  const sprint = state.currentSprint;
  const outlook = sprintOutlook(state);
  if (!sprint || !outlook) return null;
  const s = STATUS[outlook.status];
  const tone = s.tone;

  return (
    <div className={cn('rounded-lg border px-5 py-3', TONES[tone])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Daily Scrum · Day {Math.min(sprint.day, sprint.length)} of {sprint.length}</span>
          <span className="text-[11px] text-muted-foreground">the Developers inspect and re-plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', DOT[tone])} />
          <span className="text-xs font-medium">{s.label}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {outlook.status === 'complete'
          ? 'All committed work is Done.'
          : <>Committed work left: <strong>{outlook.remaining}</strong> pts · an even burn-down would be near <strong>{outlook.ideal}</strong> by now · <strong>{outlook.daysLeft}</strong> day{outlook.daysLeft === 1 ? '' : 's'} to go.</>}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{s.hint} Re-plan below, then Run the day.</p>
    </div>
  );
}
