import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The steps of an event as a progress track: where you are, what is behind you, what is still
 *  locked. Shared by every multi-step screen so "how far through am I" always looks the same. */
export function StepTrack<K extends string>({ steps, current, done, onGo, caption }: {
  steps: { key: K; label: string }[];
  current: K;
  /** What this run of steps IS - "The three topics of Sprint Planning". Three unlabelled chips read
   *  as a progress bar; named, they read as the shape of the event you are in. */
  caption?: string;
  /** Whether a step is finished - shown with a tick, and what makes the next one reachable. */
  done: (k: K) => boolean;
  onGo: (k: K) => void;
}) {
  const at = steps.findIndex((s) => s.key === current);
  return (
    <div className="inline-flex flex-col gap-1 rounded-xl border border-border bg-muted/40 px-2 py-1.5">
      {caption && <span className="px-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{caption}</span>}
      <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const active = s.key === current;
        const complete = done(s.key) && !active;
        const locked = !done(s.key) && !active && i > at;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <button type="button" disabled={locked} onClick={() => onGo(s.key)}
              title={locked ? 'Finish the step before this one' : s.label}
              className={cn('flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium transition-colors',
                active ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : complete ? 'text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-muted-foreground')}>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',
                active ? 'bg-primary-foreground/20' : complete ? 'bg-emerald-500 text-white' : 'bg-muted')}>
                {complete ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className={cn('h-0.5 w-5 rounded-full', complete ? 'bg-emerald-400' : 'bg-border')} />}
          </div>
        );
      })}
      </div>
    </div>
  );
}
