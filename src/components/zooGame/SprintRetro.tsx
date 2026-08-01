import { useState } from 'react';
import type { ZooGameState } from './types';
import { productGoalProgress } from './engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintRetroProps {
  state: ZooGameState;
  onNextSprint: (improvement: string) => void;
  onWrapUp: () => void;
}

const IMPROVEMENTS = [
  'Finish fewer things properly, rather than starting more',
  'Hold the Daily Scrum every day and catch issues early',
  'Serve each zone before adding the next exhibit',
  'Read the visitor feedback before re-planning',
];

/** Retrospective: inspect how the team worked and pick one improvement to carry
 *  forward, then plan the next Sprint. */
export function SprintRetro({ state, onNextSprint, onWrapUp }: SprintRetroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const canWrap = productGoalProgress(state) >= 0.8;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sprint {state.sprintNumber} Retrospective</h1>
        <p className="text-sm text-muted-foreground">How did the team work this Sprint? Pick one improvement to carry into the next one.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <span className="text-sm font-semibold">Definition of Done</span>
        {state.definitionOfDone.map((d) => (
          <span key={d} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>
        ))}
      </div>

      <div className="space-y-2">
        {IMPROVEMENTS.map((imp) => (
          <button key={imp} type="button" onClick={() => setSelected(imp)}
            className={cn('w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              selected === imp ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-card hover:border-primary hover:bg-primary/5')}>
            {imp}
          </button>
        ))}
      </div>

      {state.improvements.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="font-semibold uppercase tracking-wide">Carried so far</div>
          <ul className="mt-1 space-y-0.5">{state.improvements.map((imp, i) => <li key={i}>· {imp}</li>)}</ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur">
        {canWrap && <Button size="sm" variant="outline" onClick={onWrapUp}>Wrap up</Button>}
        <Button size="sm" disabled={!selected} onClick={() => selected && onNextSprint(selected)}>Start Sprint {state.sprintNumber + 1}</Button>
      </div>
    </div>
  );
}
