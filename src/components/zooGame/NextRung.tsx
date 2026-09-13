import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nextRung, LADDER, adopted } from './engine';
import { EYEBROW } from './ui/tokens';
import type { ZooGameState } from './types';

// ============= One practice, handed over at the Retrospective that earned it =============
//
// The Retrospective is where a Scrum Team decides how it will work. So it is the only place a new
// practice can arrive from - not a tutorial, not a tooltip, not a level-up - and it arrives named
// against the Sprint that just happened.
//
// One per Retrospective. A Retrospective that hands over three things is a syllabus with a wrapper
// on it, and the learner takes none of them seriously.
//
// The Definition of Done is the first rung and has a panel of its own, because it is handed over
// with the evidence of what went out without it. The rest are simpler: here is the thing, here is
// what its absence has been costing you, here is what it changes.

export function NextRung({ state, onAdopt }: { state: ZooGameState; onAdopt: (key: string) => void }) {
  const rung = nextRung(state);
  // The Definition of Done has its own hand-over, with what it would have caught in this zoo.
  if (!rung || rung.key === 'definition-of-done') return null;

  const have = LADDER.filter((r) => adopted(state, r.key));

  return (
    <section data-part="next-rung" data-key={rung.key}
      className="space-y-2 rounded-lg border-2 border-primary/50 bg-primary/[0.06] px-3 py-2.5">
      <div className={cn(EYEBROW, 'flex items-center gap-1.5 text-primary')}>
        <ArrowUpRight className="h-4 w-4" /> Something you could start doing
      </div>
      <p className="text-sm font-semibold">{rung.label}</p>
      <p className="text-[12px] leading-snug text-muted-foreground">{rung.because}</p>
      <p className="text-[12px] leading-snug">
        <span className="font-semibold">If you take it on: </span>{rung.changes}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" data-part="adopt-rung" onClick={() => onAdopt(rung.key)}>
          We&rsquo;ll do that from now on
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Or leave it: nothing in the game needs it, and you can take it on at any Retrospective.
        </span>
      </div>
      {have.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Already yours: {have.map((r) => r.label.toLowerCase()).join(', ')}.
        </p>
      )}
    </section>
  );
}
