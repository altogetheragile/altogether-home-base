import { useState } from 'react';
import type { ScrumState } from './types';
import { RETRO_IMPROVEMENTS } from './config';
import { productGoalReachable, availableStories } from './engine';
import { ProductGoalProgress } from './ProductGoalProgress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintRetroProps {
  state: ScrumState;
  onChoose: (improvement: string) => void;
  onEnd: () => void;
}

/** Retrospective: inspect how the Sprint went and commit to ONE improvement to
 *  carry forward. Improvements accumulate and make the team a little more
 *  effective over time. From here the team either starts the next Sprint or, if
 *  the Product Owner judges the Product Goal achieved, wraps up. */
export function SprintRetro({ state, onChoose, onEnd }: SprintRetroProps) {
  const sprint = state.currentSprint;
  const number = sprint?.number ?? state.sprints.length;
  const [selected, setSelected] = useState<string | null>(null);

  const canEnd = productGoalReachable(state);
  const backlogEmpty = availableStories(state).length === 0 && state.productBacklog.every((s) => s.accepted);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sprint {number} Retrospective</h1>
        <p className="text-sm text-muted-foreground">
          What's the one thing you'll change to make the next Sprint better? Pick it and it carries forward.
        </p>
      </div>

      <ProductGoalProgress state={state} />

      <div className="space-y-2">
        {RETRO_IMPROVEMENTS.map((imp) => (
          <button
            key={imp}
            type="button"
            onClick={() => setSelected(imp)}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              selected === imp ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-card hover:border-primary hover:bg-primary/5',
            )}
          >
            {imp}
          </button>
        ))}
      </div>

      {state.improvements.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Improvements so far</div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {state.improvements.map((imp, i) => <li key={i}>· {imp}</li>)}
          </ul>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Each one has nudged the team's pace up - kaizen compounds.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {canEnd ? (
          <p className="text-xs text-muted-foreground">
            {backlogEmpty
              ? 'The Backlog is delivered - the Product Goal is complete.'
              : 'Enough value is in that the Product Owner could call the Product Goal achieved.'}
          </p>
        ) : <span />}
        <div className="flex gap-2">
          {canEnd && (
            <Button variant="outline" size="lg" onClick={onEnd}>
              Product Goal achieved - wrap up
            </Button>
          )}
          {!backlogEmpty && (
            <Button size="lg" disabled={!selected} onClick={() => selected && onChoose(selected)}>
              Start Sprint {number + 1}
            </Button>
          )}
        </div>
      </div>
      {!selected && !backlogEmpty && (
        <p className="text-right text-[11px] text-muted-foreground">Pick an improvement to carry into the next Sprint.</p>
      )}
    </div>
  );
}
