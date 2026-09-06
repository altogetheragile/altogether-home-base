import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dayTotalSeconds } from './engine';
import { FOCUS } from './ui/tokens';
import type { ZooGameState } from './types';

// The day, as a clock you can read across a room.
//
// It was a line of white text on the strip, which is where a learner reads where they are - not
// where they watch time run out. This is the thing the Sprint is measured in, so it is drawn like
// a clock: digits, a bar that empties, and a hand you can put on it.
//
// Holding it is a decision somebody takes. It is game state, not one browser's idea, so in a shared
// game everybody is held at the same second - which is the trainer's pause-all, in miniature.

export function DayClock({ state, onPause }: {
  state: ZooGameState;
  onPause?: (paused: boolean) => void;
}) {
  if (state.phase !== 'sprint') return null;
  const scrum = state.dayStage === 'dailyScrum';
  const left = scrum ? state.scrumSecondsLeft : state.daySecondsLeft;
  const total = scrum ? 20 : dayTotalSeconds(state.dayTimeMult ?? 1);
  const pct = Math.max(0, Math.min(100, (left / Math.max(1, total)) * 100));
  const low = pct <= 25;
  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = String(Math.max(0, left) % 60).padStart(2, '0');
  const held = !!state.clockPaused || state.learnMode;

  return (
    <div data-part="day-clock" className="flex shrink-0 items-center gap-2">
      {onPause && !state.learnMode && (
        <button type="button" onClick={() => onPause(!state.clockPaused)}
          aria-label={state.clockPaused ? 'Start the clock' : 'Hold the clock'}
          title={state.clockPaused
            ? 'Start the day again'
            : 'Put a hand on the clock. The day stops until you take it off - in a shared game, for everybody.'}
          className={cn(FOCUS, 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-current text-primary transition-colors hover:bg-primary/10')}>
          {state.clockPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
      <div className={cn('rounded-lg border-2 px-3 py-1',
        held ? 'border-muted-foreground/40 bg-muted' : low ? 'border-amber-500 bg-[#1c1c1c]' : 'border-foreground bg-[#1c1c1c]')}>
        <div className={cn('font-mono text-2xl font-bold leading-none tabular-nums tracking-tight',
          held ? 'text-muted-foreground' : low ? 'text-amber-400' : 'text-emerald-400')}>
          {state.learnMode ? '--:--' : `${mm}:${ss}`}
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear',
            held ? 'bg-muted-foreground/50' : low ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${held ? 100 : pct}%` }} />
        </div>
      </div>
      <span className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
        {state.learnMode ? <>learn mode<br />end days yourself</>
          : state.clockPaused ? <>held<br />nothing is running</>
            : scrum ? <>of the<br />timebox</> : <>left of<br />today</>}
      </span>
    </div>
  );
}
