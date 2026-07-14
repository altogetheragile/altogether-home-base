import type { ScrumState } from './types';
import { sprintScore } from './engine';
import { cn } from '@/lib/utils';
import { Star, Check, X } from 'lucide-react';

interface SprintScorecardProps {
  state: ScrumState;
  sprintNumber: number;
}

/** A one-glance rating of the Sprint - a star for each Scrum-healthy outcome. It
 *  recomputes as the Product Owner accepts work, so accepting the Increment lights
 *  the stars up. */
export function SprintScorecard({ state, sprintNumber }: SprintScorecardProps) {
  const score = sprintScore(state, sprintNumber);

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Sprint scorecard</h2>
        <div className="flex items-center gap-1">
          {Array.from({ length: score.max }, (_, i) => (
            <Star
              key={i}
              className={cn('h-5 w-5', i < score.stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
            />
          ))}
          <span className="ml-1 font-mono text-sm text-muted-foreground">{score.stars}/{score.max}</span>
        </div>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {score.items.map((it) => (
          <li key={it.label} className="flex items-start gap-2 text-sm">
            {it.ok
              ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              : <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />}
            <span>
              <span className={cn('font-medium', !it.ok && 'text-muted-foreground')}>{it.label}</span>
              <span className="block text-[11px] text-muted-foreground">{it.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
