import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dayTotalSeconds } from './engine';
import { TONE } from './ui/tokens';

/** The day clock, drawn. It counts nothing: the seconds live in game state and are advanced
 *  by TICK_DAY, which also ends the day when they run out. This used to hold its own
 *  countdown, which is why a saved game came back with a full day however much of it had
 *  been spent, and why two browsers could never have shared one. `compact` renders a tight
 *  chip for the app header; the default is the full labelled bar. In learn mode the clock is
 *  paused - no countdown and no auto-expire, so days are ended by hand. */
export function DayTimer({ dayTimeMult, refinePenalty, impeded, learnMode, secondsLeft, compact = false, big = false }: { dayTimeMult: number; refinePenalty: number; impeded: boolean; learnMode: boolean; secondsLeft: number; compact?: boolean;
  /** The strip's clock during a Sprint: the biggest thing on the screen, with a bar that empties.
   *  It is the one element that changes what the learner does next, so it is drawn like it. */
  big?: boolean }) {
  const total = dayTotalSeconds(dayTimeMult);
  const left = secondsLeft;

  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const low = pct <= 25;
  const cut = Math.round((1 - dayTimeMult) * 100);
  const note = dayTimeMult < 1 ? (impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`) : '';

  if (big) {
    const title = ['Day time' + (note ? ` (${note})` : ''), refinePenalty > 0 ? `−${refinePenalty}s refining the Backlog` : ''].filter(Boolean).join(' · ');
    if (learnMode) {
      return (
        <span title="Learn mode - the clock is paused, so days are ended by hand"
          className="flex shrink-0 items-baseline gap-1.5 text-lg font-bold leading-none">
          <Clock className="h-4 w-4 self-center opacity-70" /> Paused
        </span>
      );
    }
    return (
      <span title={title} data-part="day-clock" className="flex shrink-0 flex-col gap-1">
        <span className="flex items-baseline gap-1.5">
          <span className={cn('text-3xl font-bold leading-none tabular-nums', low && 'text-amber-300')}>{mm}:{ss}</span>
          <span className="text-[11px] opacity-70">left today</span>
        </span>
        {/* The bar empties with the day, and turns as the day gets short. The urgency is carried
            here so no other part of the screen has to raise its voice. */}
        <span className="block h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
          <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear', low ? 'bg-amber-400' : 'bg-white/85')} style={{ width: `${pct}%` }} />
        </span>
      </span>
    );
  }

  if (compact) {
    if (learnMode) {
      return (
        <span title="Learn mode - clock paused, end days yourself"
          className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Clock className="h-3 w-3" /> Paused
        </span>
      );
    }
    const title = ['Day time' + (note ? ` (${note})` : ''), refinePenalty > 0 ? `−${refinePenalty}s refining the Backlog` : ''].filter(Boolean).join(' · ');
    return (
      <span title={title}
        className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
          low ? 'border-red-400 text-red-600 dark:border-red-500/60 dark:text-red-400' : 'border-border text-foreground')}>
        <Clock className="h-3 w-3" /> {mm}:{ss}
        <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
          <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear', impeded || low ? 'bg-red-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
        </span>
      </span>
    );
  }

  if (learnMode) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
        <Clock className="h-3 w-3" /> Learn mode - clock paused, end days yourself
      </div>
    );
  }

  return (
    <div className="w-full max-w-[240px]">
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Day time</span>
        <span className={cn('tabular-nums', low && 'text-red-600 dark:text-red-400')}>{mm}:{ss}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-linear', impeded ? 'bg-red-500' : low ? 'bg-red-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      {dayTimeMult < 1 && (
        <div className={cn('mt-1 text-[11px] font-semibold', impeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`}
        </div>
      )}
      {refinePenalty > 0 && (
        <div className={cn(TONE.attention.text, "mt-1 text-[11px] font-medium")}>−{refinePenalty}s: refining the Backlog this Sprint</div>
      )}
    </div>
  );
}
