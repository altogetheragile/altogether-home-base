import { cn } from '@/lib/utils';

/** Choosing how long a Sprint runs. A Sprint is a fixed-length container, so this is agreed once
 *  before the first one and revisited only at a Retrospective - never while planning a Sprint,
 *  where sizing the box to the work is exactly backwards. */
export function SprintLengthPicker({ days, options, onSet, at }: {
  days: number; options: readonly number[]; onSet: (d: number) => void; at: 'setup' | 'retro';
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint length</span>
      <div className="flex gap-1.5">
        {options.map((d) => (
          <button key={d} type="button" onClick={() => onSet(d)}
            className={cn('rounded-md border px-3 py-1 text-sm transition-colors',
              days === d ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted')}>
            {d} days
          </button>
        ))}
      </div>
      <span className="max-w-md text-[11px] text-muted-foreground">
        {at === 'setup'
          ? 'Shorter gives faster feedback; longer gives more build time. Pick one and keep it - the cadence is the point, and you can only change it at a Retrospective.'
          : 'Only change this if the cadence itself is wrong - it applies from the next Sprint. If work is not finishing, a longer Sprint is rarely the fix; smaller pieces usually are.'}
      </span>
    </div>
  );
}
