import { useState } from 'react';
import type { ScrumState, Criterion } from './types';
import { RETRO_IMPROVEMENTS } from './config';
import { availableStories } from './engine';
import { ScrumDodEditor } from './ScrumDodEditor';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { FloatingBar } from './FloatingBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintRetroProps {
  state: ScrumState;
  onChoose: (improvement: string) => void;
  onSetDod: (dod: Criterion[]) => void;
  onEnd: () => void;
}

/** Retrospective: the team inspects HOW it worked and its quality bar - the
 *  Definition of Done - and commits to ONE improvement to carry forward.
 *  Improvements accumulate and make the team a little more effective over time.
 *  (The product and the Product Goal are inspected at the Review, not here.) */
export function SprintRetro({ state, onChoose, onSetDod, onEnd }: SprintRetroProps) {
  const sprint = state.currentSprint;
  const number = sprint?.number ?? state.sprints.length;
  const [selected, setSelected] = useState<string | null>(null);
  const backlogEmpty = availableStories(state).length === 0 && state.productBacklog.every((s) => s.status === 'done');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sprint {number} Retrospective</h1>
        <p className="text-sm text-muted-foreground">
          How did the team work, and how's the quality bar? Inspect, then pick the one change to carry forward.
        </p>
      </div>

      {/* The team's quality bar - inspect and, if needed, strengthen it here. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Definition of Done</span>
          <div className="flex flex-wrap gap-1.5">
            {state.definitionOfDone.map((c) => (
              <span key={c.id} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{c.label}</span>
            ))}
          </div>
        </div>
        <ScrumDodEditor dod={state.definitionOfDone} onSave={onSetDod} />
      </div>

      <LearningTip point={learningFor('dod')} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Pick one improvement to carry forward</h2>
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

      <LearningTip point={learningFor('retro')} />

      {!selected && !backlogEmpty && (
        <p className="text-[11px] text-muted-foreground">Pick an improvement to carry into the next Sprint.</p>
      )}
      {backlogEmpty && (
        <p className="text-xs text-muted-foreground">The Product Backlog is delivered - there's nothing left to plan.</p>
      )}

      <FloatingBar>
        {backlogEmpty ? (
          <Button size="sm" onClick={onEnd}>Wrap up</Button>
        ) : (
          <Button size="sm" disabled={!selected} onClick={() => selected && onChoose(selected)}>
            Start Sprint {number + 1}
          </Button>
        )}
      </FloatingBar>
    </div>
  );
}
