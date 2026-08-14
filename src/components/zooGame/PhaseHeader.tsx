import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Where you are, said once and said properly.
 *
 *  Every phase screen used the same modest heading, so "Sprint Planning, topic 2 of 3" looked no
 *  different from "Sprint 2 Review" - you had to read the words to work out where you were. This
 *  puts the Scrum event's name above the heading as an eyebrow, with the step you are on beside it,
 *  and gives the heading itself enough weight to be the first thing you see.
 */
export function PhaseHeader({ event, title, step, of, aside, children }: {
  /** The Scrum event you are in - "Sprint Planning", "Sprint Review". */
  event: string;
  /** What this particular screen is asking - the topic, question or day. */
  title: string;
  /** Which step of the event, when it has several (Sprint Planning's three topics). */
  step?: number;
  of?: number;
  /** Anything that belongs on the same line as the heading, hard right. */
  aside?: ReactNode;
  /** A sentence under the heading saying what this step is for. */
  children?: ReactNode;
}) {
  return (
    <header className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">{event}</span>
        {step != null && of != null && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Topic {step} of {of}</span>
        )}
      </div>
      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', aside && 'justify-between')}>
        <h2 className="text-2xl font-bold leading-tight tracking-tight">{title}</h2>
        {aside}
      </div>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </header>
  );
}

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
