import { Check, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ZooGameState } from './types';
import { journey } from './journey';

/** The whole of Scrum on one line, with where you are lit. See `journey.ts`. */
export function JourneyLine({ state, className }: { state: ZooGameState; className?: string }) {
  const { steps, sprint, looped } = journey(state);
  return (
    <ol data-part="journey" aria-label="Where you are in Scrum"
      className={cn('flex min-w-0 items-center gap-1 overflow-x-auto text-[11px] leading-tight', className)}>
      {steps.map((s, i) => (
        <li key={s.key} data-step={s.key} data-status={s.status} aria-current={s.status === 'now' ? 'step' : undefined}
          className="flex shrink-0 items-center gap-1">
          {/* The cycle starts at Planning. From Sprint 2 it says so, because that is where the team
              comes back to and the setting up is behind them. */}
          {s.key === 'planning' && (
            <span data-part="journey-cycle" title={looped ? `Back round to Sprint Planning for Sprint ${sprint}` : 'Every Sprint runs these four'}
              className={cn('mx-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                looped ? 'bg-primary/15 text-primary' : 'text-muted-foreground/70')}>
              <RotateCw className="h-3 w-3" aria-hidden />
              <span>Sprint {sprint}</span>
            </span>
          )}
          {i > 0 && s.key !== 'planning' && <span aria-hidden className="h-px w-2 bg-border sm:w-3" />}
          <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5',
            s.status === 'now' && 'bg-primary font-bold text-primary-foreground',
            s.status === 'done' && 'text-foreground/80',
            s.status === 'todo' && 'text-muted-foreground/70',
            s.status === 'passed' && 'border border-dashed border-amber-500/70 text-amber-700')}
            title={s.status === 'passed' ? `${s.label}: never agreed` : undefined}>
            {s.status === 'done' && <Check className="h-3 w-3 text-emerald-600" aria-label="done" />}
            {/* Narrow screens keep the step you are on in words and the rest as marks. */}
            <span className={cn(s.status !== 'now' && 'hidden md:inline')}>{s.label}</span>
            {s.status === 'passed' && <span className="sr-only"> (never agreed)</span>}
            {s.detail && <span className="font-medium opacity-90">· {s.detail}</span>}
            {s.status !== 'now' && s.status !== 'done' && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-50 md:hidden" />}
          </span>
        </li>
      ))}
    </ol>
  );
}
