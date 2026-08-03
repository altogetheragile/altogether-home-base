import { useState } from 'react';
import type { ZooGameState } from './types';
import { productGoalProgress } from './engine';
import { DodEditor } from './DodEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintRetroProps {
  state: ZooGameState;
  onNextSprint: (improvement: string) => void;
  onSetDod: (dod: string[]) => void;
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
export function SprintRetro({ state, onNextSprint, onSetDod, onWrapUp }: SprintRetroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const canWrap = productGoalProgress(state) >= 0.8;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">Sprint {state.sprintNumber} Retrospective</h2>
        <p className="text-xs text-muted-foreground">How did the team work this Sprint? Refine the Definition of Done and pick one improvement to carry into the next one.</p>
      </div>

      {/* The Retrospective is where the team inspects and adapts the Definition of Done. */}
      <DodEditor dod={state.definitionOfDone} onSave={onSetDod} />

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

      {/* A normal in-flow action row (not sticky), so a long, coached DoD editor is never
          overlapped by a floating bar. */}
      <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-4">
        {canWrap && <Button size="sm" variant="outline" onClick={onWrapUp}>Wrap up</Button>}
        <Button size="sm" disabled={!selected} onClick={() => selected && onNextSprint(selected)}>Start Sprint {state.sprintNumber + 1}</Button>
      </div>
    </div>
  );
}
