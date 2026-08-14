import { useState } from 'react';
import type { ZooGameState } from './types';
import { PhaseHeader, SprintLengthPicker } from './PhaseHeader';
import { retroQuestions } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { DodEditor } from './DodEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, MessageCircleQuestion } from 'lucide-react';

interface SprintRetroProps {
  state: ZooGameState;
  onNextSprint: (improvement: string) => void;
  onSetDod: (dod: string[]) => void;
  /** The one place the Sprint's length can change - inspect and adapt, from the next Sprint. */
  onSetSprintDays?: (days: number) => void;
}

/** Improvements the Scrum Team can pick. Some have a real mechanical effect next Sprint,
 *  so inspect-and-adapt actually changes how the team works. */
const IMPROVEMENTS: { text: string; effect?: string }[] = [
  { text: 'Finish fewer things properly, rather than starting more', effect: 'Tightens the WIP limit by 1' },
  { text: 'Hold the Daily Scrum every day and catch issues early', effect: 'Daily Scrums become efficient - they cost no build time' },
  { text: 'Serve each zone before adding the next exhibit' },
  { text: 'Read the visitor feedback before adapting the plan' },
];

/** Retrospective: inspect how the Scrum Team worked and pick one improvement to carry
 *  forward, then plan the next Sprint. */
export function SprintRetro({ state, onNextSprint, onSetDod, onSetSprintDays }: SprintRetroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const questions = retroQuestions(state);

  return (
    <div className="space-y-5">
      <PhaseHeader event="Sprint Retrospective" title={`Sprint ${state.sprintNumber}: how did we work?`}>
        Refine the Definition of Done and pick one improvement to carry into the next Sprint.
      </PhaseHeader>

      {/* Coaching questions: open prompts drawn from what happened, to inspect before adapting.
          Reflective and unscored - the point is the thinking, not a right answer. */}
      <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary"><MessageCircleQuestion className="h-4 w-4" /> Reflect on the Sprint</div>
        <p className="text-[11px] text-muted-foreground">Open questions, no right answers and no score - this is the inspect in inspect-and-adapt. Talk them through as a team.</p>
        <ul className="space-y-1.5">
          {questions.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground"><span className="mt-0.5 shrink-0 text-primary/70">&bull;</span><span>{q}</span></li>
          ))}
        </ul>
      </section>

      {/* The Retrospective is where the team inspects and adapts the Definition of Done. */}
      <DodEditor dod={state.definitionOfDone} onSave={onSetDod} />

      {/* ...and the only place the Sprint's own length changes, because a fixed container is the
          point of it. Never in Planning, where the box would just be sized to the work. */}
      {onSetSprintDays && (
        <SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="retro" />
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Pick one improvement</h3>
        <p className="text-[11px] text-muted-foreground">Inspect-and-adapt has teeth: some improvements change how the Scrum Team works next Sprint. Current WIP limit: <strong>{state.wipLimit}</strong>{state.scrumDiscipline ? ' · Daily Scrums are efficient' : ''}.</p>
      </div>
      <div className="space-y-2">
        {IMPROVEMENTS.map((imp) => (
          <button key={imp.text} type="button" onClick={() => setSelected(imp.text)}
            className={cn('w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              selected === imp.text ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-card hover:border-primary hover:bg-primary/5')}>
            {imp.text}
            {imp.effect && <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300"><Zap className="h-3 w-3" /> {imp.effect}</span>}
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
        <Button size="sm" disabled={!selected} onClick={() => selected && onNextSprint(selected)}>Start Sprint {state.sprintNumber + 1}</Button>
      </div>
    </div>
  );
}
