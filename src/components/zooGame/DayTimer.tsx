import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAY_SECONDS } from './config';

/** The day clock: a real countdown for the build day. It resets each day, and can be cut
 *  short by the Daily Scrum's timebox, a blocker that slipped through, or Backlog refinement
 *  spent this Sprint - so the cost of those is obvious. `compact` renders a tight chip for the
 *  app header (always visible across tabs); the default is the full labelled bar. In learn mode
 *  the clock is paused - no countdown and no auto-expire, so days are ended by hand. */
export function DayTimer({ dayNumber, dayTimeMult, refinePenalty, impeded, learnMode, onExpire, compact = false }: { dayNumber: number; dayTimeMult: number; refinePenalty: number; impeded: boolean; learnMode: boolean; onExpire: () => void; compact?: boolean }) {
  const total = Math.round(DAY_SECONDS * dayTimeMult);
  const [left, setLeft] = useState(total);
  const fired = useRef(false);
  const spent = useRef(0); // refinement seconds already deducted this day

  // Reset for each new day (dayNumber changes) and count down once per second. In learn
  // mode the clock is paused - no countdown and no auto-expire, so you end days yourself.
  useEffect(() => {
    fired.current = false;
    spent.current = 0;
    setLeft(total);
    if (learnMode) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!fired.current) { fired.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // total is derived from dayNumber+dayTimeMult; reset on a genuinely new day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayNumber, learnMode]);

  // Refining the Backlog mid-Sprint spends build time: deduct the new refinement seconds
  // from the clock as they accrue (the interval below picks up the expiry within a tick).
  useEffect(() => {
    const delta = refinePenalty - spent.current;
    spent.current = refinePenalty;
    if (delta > 0) setLeft((s) => Math.max(0, s - delta));
  }, [refinePenalty]);

  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const low = pct <= 25;
  const cut = Math.round((1 - dayTimeMult) * 100);
  const note = dayTimeMult < 1 ? (impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`) : '';

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
        <div className={cn('mt-1 text-[10px] font-semibold', impeded ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
          {impeded ? `−${cut}% today: dealing with yesterday's blocker` : `−${cut}%: the Daily Scrum takes a little time`}
        </div>
      )}
      {refinePenalty > 0 && (
        <div className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">−{refinePenalty}s: refining the Backlog this Sprint</div>
      )}
    </div>
  );
}
