import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The steps of an event as a progress track: where you are, what is behind you, what is still
 *  locked. Shared by every multi-step screen so "how far through am I" always looks the same. */
export function StepTrack<K extends string>({ steps, current, done, onGo }: {
  steps: { key: K; label: string }[];
  current: K;
  /** Whether a step is finished - shown with a tick, and what makes the next one reachable. */
  done: (k: K) => boolean;
  onGo: (k: K) => void;
}) {
  const at = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const active = s.key === current;
        const complete = done(s.key) && !active;
        const locked = !done(s.key) && !active && i > at;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <button type="button" disabled={locked} onClick={() => onGo(s.key)}
              title={locked ? 'Finish the step before this one' : s.label}
              className={cn('flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs transition-colors',
                active ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : complete ? 'text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-muted-foreground/60')}>
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                active ? 'bg-primary-foreground/20' : complete ? 'bg-emerald-500 text-white' : 'bg-muted')}>
                {complete ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && <span className={cn('h-px w-4', complete ? 'bg-emerald-400' : 'bg-border')} />}
          </div>
        );
      })}
    </div>
  );
}
