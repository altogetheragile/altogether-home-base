import { useEffect, useRef, useState } from 'react';

/** Whether this tab is being looked at, and how long it was not.
 *
 *  The day is counted in TICKS, not in elapsed time: `setInterval` dispatches TICK_DAY and the
 *  reducer takes one second off. Nothing anywhere reads a wall clock. So when a browser throttles a
 *  background tab - roughly once a minute after five minutes hidden, in Chrome and Safari both, and
 *  frozen outright on battery - the day does not pause, it crawls, and how long a day lasts comes
 *  down to somebody's power settings.
 *
 *  Reported from playing it: "It has been Sprint 3 for a few hours now with minimal changes to the
 *  clock." That was not a hold. It was sixty seconds of real time buying one second of the day.
 *
 *  A day being a fixed timebox is the thing this game teaches, so the honest answer is to stop
 *  rather than crawl, and to say so. Not `clockPaused`: that is a hand somebody PUT on the clock,
 *  it is shared state, and taking it off on return would lift a trainer's deliberate hold as well
 *  as this one.
 *
 *  `awayFor` lingers after coming back, because a message shown to a hidden tab is a message
 *  nobody reads. */
export function useTabAway(linger = 12000) {
  const hiddenNow = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
  const [hidden, setHidden] = useState(hiddenNow);
  const [awayFor, setAwayFor] = useState<number | null>(null);
  const since = useRef<number | null>(null);

  useEffect(() => {
    const changed = () => {
      if (hiddenNow()) { since.current = Date.now(); setHidden(true); return; }
      setHidden(false);
      const went = since.current;
      since.current = null;
      if (went == null) return;
      const seconds = Math.round((Date.now() - went) / 1000);
      // Glancing at another window is not being away, and a note about it would be noise on every
      // alt-tab. Long enough to matter is long enough to mention.
      if (seconds >= 5) setAwayFor(seconds);
    };
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);

  useEffect(() => {
    if (awayFor == null) return;
    const id = setTimeout(() => setAwayFor(null), linger);
    return () => clearTimeout(id);
  }, [awayFor, linger]);

  return { hidden, awayFor };
}

/** "4 minutes", "20 seconds" - what to put after "held for". */
export const awayText = (seconds: number): string => {
  // A minute, at a minute. The cut used to be at 90 seconds, which made "1 minute" unreachable -
  // anything long enough to be counted in minutes already rounded to 2 - so the singular was dead
  // code dressed up as a kindness. Caught by mutating it and watching nothing go red.
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const mins = Math.round(seconds / 60);
  if (mins < 90) return `${mins} minute${mins === 1 ? '' : 's'}`;
  const hours = Math.round(mins / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
};
