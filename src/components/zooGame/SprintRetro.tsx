import { useState } from 'react';
import type { ZooGameState } from './types';
import { SprintLengthPicker } from './SprintLengthPicker';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { retroQuestions } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { DodEditor } from './DodEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, MessageCircleQuestion } from 'lucide-react';

type Step = 'inspect' | 'adapt';
const STEPS: { key: Step; label: string; question: string; lead: string }[] = [
  { key: 'inspect', label: 'Inspect', question: 'How did we work this Sprint?', lead: 'Talk it through before changing anything. No score, no right answers.' },
  { key: 'adapt', label: 'Adapt', question: 'What will we change?', lead: 'One improvement you will actually make, and the agreements you own.' },
];
/** What the Guide says about the Retrospective - behind the "?", not on the page. */
const DETAIL: Record<Step, string[]> = {
  inspect: [
    'The Sprint Retrospective inspects how the last Sprint went with regard to individuals, interactions, processes, tools and the Definition of Done.',
    'It is the Scrum Team inspecting itself - the only event that does. What it inspects is not an artifact, which is why nothing here is being adapted yet.',
    'Inspected elements often vary with the domain of work. Assumptions that led the team astray are identified and their origins explored.',
  ],
  adapt: [
    'The Scrum Team identifies the most helpful changes to improve its effectiveness, and the most impactful are addressed as soon as possible - they may even be added to the Sprint Backlog for the next Sprint.',
    'This is where the Definition of Done is adapted, and the only place the Sprint length changes - a fixed-length container is the point of a Sprint, so it is never resized to fit the work.',
  ],
};

interface SprintRetroProps {
  state: ZooGameState;
  onNextSprint: (improvement: string) => void;
  onSetDod: (dod: string[]) => void;
  /** The one place the Sprint's length can change - inspect and adapt, from the next Sprint. */
  onSetSprintDays?: (days: number) => void;
  /** The Retrospective teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
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
export function SprintRetro({ state, onNextSprint, onSetDod, onSetSprintDays, teachCard, onMarkTaught }: SprintRetroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('inspect');
  const questions = retroQuestions(state);
  const current = STEPS.find((s) => s.key === step)!;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Inspect, then adapt - in that order, because that is the event. */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <StepTrack steps={STEPS} current={step} done={(k) => k === 'inspect' && step === 'adapt'} onGo={setStep} />
          <ExplainButton title={`Sprint Retrospective \u00b7 Sprint ${state.sprintNumber}`} body={DETAIL[step]} phase="retro"
            teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {/* Coaching questions: open prompts drawn from what happened, to inspect before adapting.
          Reflective and unscored - the point is the thinking, not a right answer. */}
      {step === 'inspect' && (
        <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary"><MessageCircleQuestion className="h-4 w-4" /> Talk these through</div>
          <ul className="space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground"><span className="mt-0.5 shrink-0 text-primary/70">&bull;</span><span>{q}</span></li>
            ))}
          </ul>
        </section>
      )}

      {step === 'adapt' && (<>
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

      </>)}

      {/* A normal in-flow action row (not sticky), so a long, coached DoD editor is never
          overlapped by a floating bar. */}
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>{step === 'adapt' && <Button variant="ghost" size="sm" onClick={() => setStep('inspect')}>&larr; Back</Button>}</div>
        {step === 'inspect'
          ? <Button onClick={() => setStep('adapt')}>Next: what we will change &rarr;</Button>
          : <>
            {!selected && <span className="hidden text-[11px] text-muted-foreground sm:inline">Pick one improvement to carry forward</span>}
            <Button disabled={!selected} onClick={() => selected && onNextSprint(selected)}>Start Sprint {state.sprintNumber + 1} &rarr;</Button>
          </>}
      </div>
    </div>
  );
}
