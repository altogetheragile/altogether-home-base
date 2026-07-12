import type { ScrumState } from './types';
import { RETRO_IMPROVEMENTS } from './config';

interface SprintRetroProps {
  state: ScrumState;
  onChoose: (improvement: string) => void;
}

/** Retrospective: inspect how the Sprint went and commit to ONE improvement to
 *  carry forward. Improvements accumulate and make the team a little more
 *  effective over time - continuous improvement made tangible. */
export function SprintRetro({ state, onChoose }: SprintRetroProps) {
  const sprint = state.currentSprint;
  const number = sprint?.number ?? state.sprints.length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sprint {number} Retrospective</h1>
        <p className="text-sm text-muted-foreground">
          What's the one thing you'll change to make the next Sprint better? Pick it and it carries forward.
        </p>
      </div>

      <div className="space-y-2">
        {RETRO_IMPROVEMENTS.map((imp) => (
          <button
            key={imp}
            type="button"
            onClick={() => onChoose(imp)}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
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
    </div>
  );
}
