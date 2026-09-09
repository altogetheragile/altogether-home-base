import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clocks, clockText } from './header';
import { FOCUS } from './ui/tokens';
import type { ZooGameState } from './types';

// The clock, dead centre of the strip, and the biggest thing on it.
//
// It was a line of text where a learner reads where they are, then a small LED panel at the end of
// the tab row. It is the thing the Sprint is measured in and the thing that decides what to do
// next, so it is the one element with weight: 44pt, centred, with a bar under it that empties.
//
// Two clocks, one big. Every event is inside the Sprint, so the day keeps running through the
// Daily Scrum - which is the lesson. But only one number is big at a time: on a working day it is
// what is left of today; during a timeboxed event it is the timebox, with today small beneath it.
//
// Holding it is a decision somebody takes. It is game state, not one browser's idea, so in a shared
// game everybody is held at the same second - the trainer's pause-all, in miniature.

export function DayClock({ state, onPause }: {
  state: ZooGameState;
  onPause?: (paused: boolean) => void;
}) {
  const { big, small, note } = clocks(state);
  const held = !!state.clockPaused || state.learnMode;
  const pct = big ? Math.max(0, Math.min(100, (big.seconds / Math.max(1, big.total)) * 100)) : 0;
  const low = !!big && pct <= 25;

  return (
    <div data-part="day-clock" className="flex min-w-0 shrink-0 items-center gap-2">
      {onPause && !state.learnMode && big && (
        <button type="button" onClick={() => onPause(!state.clockPaused)}
          aria-label={state.clockPaused ? 'Start the clock' : 'Hold the clock'}
          title={state.clockPaused
            ? 'Start the day again'
            : 'Put a hand on the clock. The day stops until you take it off - in a shared game, for everybody.'}
          className={cn(FOCUS, 'flex h-7 w-7 items-center justify-center rounded-full border border-white/40 text-white/80 transition-colors hover:bg-white/10')}>
          {state.clockPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      )}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {/* Before the first Sprint there is no day to count, and a zero would be a lie. */}
          <span className={cn('font-mono text-[2.75rem] font-bold leading-none tabular-nums tracking-tight',
            !big ? 'text-white/40' : held ? 'text-white/50' : low ? 'text-amber-300' : 'text-white')}>
            {!big ? '—' : state.learnMode ? '--:--' : clockText(big.seconds)}
          </span>
          <span className="shrink-0 text-[11px] leading-tight text-white/70">
            {!big ? (note ?? 'no Sprint yet')
              : state.learnMode ? <>learn mode<br />end days yourself</>
                : state.clockPaused ? <>held<br />nothing is running</>
                  : big.label}
          </span>
        </div>
        {/* The bar tracks whichever number is big, and the day underneath it when an event is
            running - a Daily Scrum is time you spend, not time you are given. */}
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear',
            held || !big ? 'bg-white/30' : low ? 'bg-amber-300' : 'bg-white/80')}
            style={{ width: `${!big || held ? 100 : pct}%` }} />
        </div>
        {small && <div className="mt-0.5 text-[10px] leading-none text-white/60">{small}</div>}
      </div>
    </div>
  );
}
