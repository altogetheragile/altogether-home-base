import { useState } from 'react';
import type { ZooGameState } from './types';
import { SprintLengthPicker } from './SprintLengthPicker';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { ActionBar } from './ActionBar';
import { retroQuestions, decisionsIn, whoIs, sprintProgress, improvementsFrom } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { DodEditor } from './DodEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Zap, ClipboardList, MessageCircleQuestion } from 'lucide-react';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';

type Step = 'inspect' | 'adapt';
const STEPS: { key: Step; label: string; question: string; lead: string }[] = [
  { key: 'inspect', label: 'Inspect', question: 'How did we work this Sprint?', lead: 'Talk it through before changing anything. No score, no right answers.' },
  { key: 'adapt', label: 'Adapt', question: 'What will we change?', lead: 'One improvement you will actually make, and the agreements you own.' },
];
/** What the Guide says about the Retrospective - behind the "?", not on the page. */
// Which Teaching Cards each step is about - one source for the teaching, and an editable one.
const STEP_CARDS: Record<Step, string[]> = { inspect: ['sprint-retrospective'], adapt: ['sprint-retrospective', 'definition-of-done'] };

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


/** Retrospective: inspect how the Scrum Team worked and pick one improvement to carry
 *  forward, then plan the next Sprint. */
export function SprintRetro({ state, onNextSprint, onSetDod, onSetSprintDays, teachCard, onMarkTaught }: SprintRetroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('inspect');
  const questions = retroQuestions(state);
  // What to improve, drawn from what this team did rather than from a fixed list. Every option
  // changes how the next Sprint works, and each one that came out of the log says what put it there.
  const improvements = improvementsFrom(state);
  // What the game noticed this Sprint, and anything that has now happened often enough to be a
  // habit rather than a one-off. A habit is the thing worth inspecting; a single Sprint is noise.
  const did = decisionsIn(state, state.sprintNumber);
  const prog = sprintProgress(state);
  // What was promised, and what arrived. By now the unfinished work has gone back to the Product
  // Backlog, so counting the Sprint's own items says "0 of 0" - which tells a team that
  // over-forecast by eighteen points nothing at all.
  const forecast = state.forecastPoints ?? prog.pointsCommitted;
  const delivered = state.velocity.length ? state.velocity[state.velocity.length - 1] : prog.pointsDone;
  const habits = (() => {
    const out: string[] = [];
    const skipped = (state.decisions ?? []).filter((d) => d.kind === 'daily-scrum' && /skipped/.test(d.what));
    if (skipped.length > 1) out.push(`The Daily Scrum has been skipped ${skipped.length} times across this game.`);
    const unready = (state.decisions ?? []).filter((d) => d.kind === 'unready');
    if (unready.length > 1) out.push(`Work that was not ready has gone into a Sprint ${unready.length} times.`);
    const noRefine = (state.decisions ?? []).filter((d) => d.kind === 'refinement' && /^No time/.test(d.what));
    if (noRefine.length > 1) out.push(`${noRefine.length} Sprints have set aside no time to refine the Backlog.`);
    return out;
  })();
  const current = STEPS.find((s) => s.key === step)!;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {/* Inspect, then adapt - in that order, because that is the event. */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <StepTrack steps={STEPS} current={step} done={(k) => k === 'inspect' && step === 'adapt'} onGo={setStep} />
          <ExplainButton cards={STEP_CARDS[step]} phase="retro" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {/* What the team actually did, before anybody discusses how it went.
          
          The Retrospective inspects "individuals, interactions, processes and tools", and a team
          cannot inspect what it cannot remember: who chose the Sprint Backlog, whether the Daily
          Scrum was held on the third day, whether anything went in unready. The game noticed at
          the time and says so here, without an opinion. Nothing in this list is marked good or
          bad, because whether it was is the conversation, and the conversation is the event. */}
      {/* What you did, beside what happened. The log on the left is the Sprint as the team actually
          worked it - each line attributed, and carrying its cost where the game knows one. The
          right-hand column is what it came to. Two columns because they are read together: a
          decision means little without its outcome, and an outcome without its decisions is luck. */}
      {step === 'inspect' && did.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
          <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-2')}>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <ClipboardList className="h-4 w-4" /> Decision log <span className="font-normal text-muted-foreground">· this Sprint</span>
            </div>
            <ul className="divide-y divide-border">
              {did.map((d, i) => (
                <li key={i} className="flex items-start gap-2 py-1.5 text-sm">
                  <span className="mt-[1px] shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {whoIs(d.by).replace(/^The /, '')}
                  </span>
                  <span className="min-w-0">
                    <span className="text-foreground">{d.what.replace(/^(The Developers|The Product Owner|The Scrum Master|You) /, '')}</span>
                    {d.cost && <span className="block text-[11px] text-amber-700 dark:text-amber-300">{d.cost}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {habits.length > 0 && (
              <p className="text-[11px] text-muted-foreground/80">{habits.join(' ')}</p>
            )}
          </section>

          {/* What it cost, and what it earned. The numbers the team is inspecting, in one place, so
              the conversation is about the Sprint rather than about where to find the figures. */}
          <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-2')}>
            <div className="text-sm font-semibold">What it cost, and what it earned</div>
            <p className={cn('text-sm font-semibold', state.sprintGoalMet ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300')}>
              Delivered {delivered} of {forecast} points · goal {state.sprintGoalMet ? 'met' : 'not met'}
            </p>
            {prog.essentialsTotal > 0 && (
              <p className="text-[12px] text-muted-foreground">
                {prog.essentialsDone} of {prog.essentialsTotal} essential item{prog.essentialsTotal === 1 ? '' : 's'} finished -
                the ones the Sprint Goal actually depended on.
              </p>
            )}
            {state.velocity.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Velocity so far: {state.velocity.join(', ')} ({state.sprintDays}-day Sprints). It is measured, not chosen.
              </p>
            )}
          </section>
        </div>
      )}

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
      {/* The Retrospective is where the team inspects and adapts the Definition of Done. It is a
          long editor, so it scrolls inside itself rather than pushing the improvements off screen. */}
      {/* Not a scroll box. The Definition of Done is the Increment's commitment and the whole point
          of inspecting it here is to read it; a list that scrolls inside a card on a page that also
          scrolls is a list nobody reads to the end of. */}
      <DodEditor dod={state.definitionOfDone} onSave={onSetDod} />

      {/* ...and the only place the Sprint's own length changes, because a fixed container is the
          point of it. Never in Planning, where the box would just be sized to the work. */}
      {onSetSprintDays && (
        <SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="retro" />
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Pick one improvement</h3>
        <p className="text-[11px] text-muted-foreground">
          Drawn from your own decision log, and every one of them changes how the next Sprint works.
          Current WIP limit: <strong>{state.wipLimit}</strong>{state.scrumDiscipline ? ' · blockers are caught early' : ''}{state.refineHabit ? ' · refinement time is set aside' : ''}.
        </p>
      </div>
      <div className="max-h-[26vh] space-y-2 overflow-y-auto pr-1">
        {improvements.map((imp) => (
          <button key={imp.text} type="button" onClick={() => setSelected(imp.text)}
            className={cn(FOCUS, 'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
              selected === imp.text ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-card hover:border-primary hover:bg-primary/5')}>
            {imp.text}
            {/* Every option changes something. An improvement with no effect is a poster. */}
            <span className={cn(TONE.attention.text, 'mt-1 flex items-center gap-1 text-[11px] font-medium')}><Zap className="h-3 w-3" /> {imp.effect}</span>
            {/* ...and where the log put it on the list, the log gets to say so. */}
            {imp.because && <span className="mt-0.5 block text-[11px] text-muted-foreground">{imp.because}</span>}
          </button>
        ))}
      </div>

      {state.improvements.length > 0 && (
        <div className={cn(SURFACE.quiet, PADDING.default, 'text-xs text-muted-foreground')}>
          <div className="font-semibold uppercase tracking-wide">Carried so far</div>
          <ul className="mt-1 space-y-0.5">{state.improvements.map((imp, i) => <li key={i}>· {imp}</li>)}</ul>
        </div>
      )}

      </>)}

      <ActionBar left={step === 'adapt' ? <Button variant="ghost" size="sm" onClick={() => setStep('inspect')}>&larr; Back</Button> : undefined}
        hint={step === 'adapt' && !selected ? 'Pick one improvement to carry forward' : undefined}>
        {step === 'inspect'
          ? <Button onClick={() => setStep('adapt')}>Next: what we will change &rarr;</Button>
          : <Button disabled={!selected} onClick={() => selected && onNextSprint(selected)}>Start Sprint {state.sprintNumber + 1} &rarr;</Button>}
      </ActionBar>
    </div>
  );
}
