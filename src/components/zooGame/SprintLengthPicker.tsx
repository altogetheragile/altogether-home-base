import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS, SURFACE } from './ui/tokens';

/** How many days a custom Sprint may run to. A Sprint is "one month or less"; the game's days stand
 *  in for weeks, so ten is generous and anything past it is not a Sprint. */
const MAX_DAYS = 10;

/** Choosing how long a Sprint runs. A Sprint is a fixed-length container, so this is agreed once
 *  before the first one and revisited only at a Retrospective - never while planning a Sprint,
 *  where sizing the box to the work is exactly backwards. */
export function SprintLengthPicker({ days, options, onSet, at }: {
  days: number; options: readonly number[]; onSet: (d: number) => void; at: 'setup' | 'retro';
}) {
  const preset = options.includes(days);
  const [custom, setCustom] = useState(!preset);
  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n) && n >= 1 && n <= MAX_DAYS) onSet(n);
  };
  return (
    // The guidance used to sit under the buttons, where it read as a footnote to the whole panel
    // rather than as the thing that helps you choose. It sits beside them now, at the moment of
    // choosing, and the buttons keep the left edge where the eye starts.
    <div className={cn(SURFACE.card, 'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5')}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint length</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((d) => (
          <button key={d} type="button" onClick={() => { setCustom(false); onSet(d); }}
            className={cn(FOCUS, 'rounded-md border px-3 py-1 text-sm transition-colors',
              !custom && days === d ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted')}>
            {d} days
          </button>
        ))}
        {/* A team whose cadence is four days should be able to say four. The presets are the common
            answers, not the only ones. */}
        {custom ? (
          <span className={cn('flex items-center gap-1 rounded-md border px-2 py-1 text-sm',
            preset ? 'border-border' : 'border-primary bg-primary/10 text-primary')}>
            <input type="number" min={1} max={MAX_DAYS} defaultValue={days} autoFocus aria-label="Sprint length in days"
              onChange={(e) => commit(e.target.value)}
              className="w-12 bg-transparent text-center font-medium outline-none" />
            days
          </span>
        ) : (
          <button type="button" onClick={() => setCustom(true)}
            className={cn(FOCUS, "rounded-md border border-dashed border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground")}>
            Custom
          </button>
        )}
      </div>
      <span className="min-w-[16rem] flex-1 text-[11px] text-muted-foreground">
        {at === 'setup'
          ? 'Shorter gives faster feedback; longer gives more build time. Pick one and keep it - the cadence is the point, and you can only change it at a Retrospective.'
          : 'Only change this if the cadence itself is wrong - it applies from the next Sprint. If work is not finishing, a longer Sprint is rarely the fix; smaller pieces usually are.'}
      </span>
    </div>
  );
}
