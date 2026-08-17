import { useState } from 'react';
import type { ZooGameState } from './types';
import type { SegmentId } from './simulation/types';
import { productGoalProgress, availableItems, readyHorizon, GOAL_HAPPINESS_TARGET } from './engine';
import { CategoryIcon } from './Board';
import { zooCapacity } from './config';
import { CoachTip } from './CoachTip';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { ActionBar } from './ActionBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Quote, Lightbulb, CheckCircle2, CircleDashed } from 'lucide-react';

type Step = 'done' | 'visitors' | 'next';
const STEPS: { key: Step; label: string; question: string; lead: string }[] = [
  { key: 'done', label: 'Done', question: 'What did we get Done?', lead: 'Inspect the Increment: what met the Definition of Done this Sprint.' },
  { key: 'visitors', label: 'Visitors', question: 'What do the visitors make of it?', lead: 'The people the zoo is for, telling you what they found.' },
  { key: 'next', label: 'What next', question: 'So what do we do next?', lead: 'Adapt the Product Backlog, and judge how far the Product Goal has come.' },
];
/** What the Guide says about the Review - behind the "?", not on the page. */
const DETAIL: Record<Step, string[]> = {
  done: [
    'Not a release gate: anything Done could have been released the moment it was Done. What is inspected here is the Increment, whether it went live this morning or a fortnight ago.',
    'The Sprint Goal is the Sprint Backlog\u2019s commitment. Dropping less essential scope to protect it is a win, not a miss.',
    'Velocity is measured, not fixed. It is a common forecasting practice rather than part of Scrum, and a forecast was never a promise.',
  ],
  visitors: [
    'The Scrum Team presents the results of their work to the key stakeholders and progress toward the Product Goal is discussed.',
    'This is the feedback loop the whole framework is built on: real people meeting the actual Increment, not a status report about it.',
  ],
  next: [
    'The attendees collaborate on what to do next. That collaboration - not the demonstration - is what the event is for.',
    'The Product Owner decides whether the Product Goal has been met. There is no set number of Sprints - the product runs until the Goal is reached or abandoned.',
  ],
};

interface SprintReviewProps {
  state: ZooGameState;
  onTakeSignal: (index: number) => void;
  onContinue: () => void;
  /** The PO judging the Product Goal met - the game has no fixed length. */
  onWrapUp?: () => void;
  /** The Sprint Review teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

const SEG_LABEL: Record<SegmentId, string> = { families: 'Families', enthusiasts: 'Enthusiasts', comfortSeekers: 'Comfort Seekers' };
const SEG_COLOR: Record<SegmentId, string> = { families: 'bg-orange-500', enthusiasts: 'bg-sky-500', comfortSeekers: 'bg-amber-700' };
const barTone = (v: number) => (v >= 67 ? 'bg-emerald-500' : v >= 34 ? 'bg-amber-500' : 'bg-rose-500');

/** Sprint Review: inspect what was Done and how the visitors responded, then adapt.
 *  It is a working conversation, not a release gate. */
export function SprintReview({ state, onTakeSignal, onContinue, onWrapUp, teachCard, onMarkTaught }: SprintReviewProps) {
  const r = state.lastReview;
  const velocity = state.velocity[state.velocity.length - 1] ?? 0;
  const progress = Math.round(productGoalProgress(state) * 100);
  const history = (state.happiness ?? []).slice(-6);
  // Output-chasing: a lot delivered but visitors are not loving it (low happiness).
  const outputChasing = velocity >= 8 && r != null && r.totalAttendance > 0 && r.overallHappiness < 34;

  const [step, setStep] = useState<Step>('done');
  const [taken, setTaken] = useState(0); // signals turned into Backlog items in this Review
  const upNext = availableItems(state).slice(0, 6);
  const current = STEPS.find((s) => s.key === step)!;
  const seen = STEPS.findIndex((s) => s.key === step);
  const goTo = (k: Step) => setStep(k);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* The Review has a real agenda, so it walks: what was Done, what the visitors made of it,
          and what we do about it. One question at a time, as everywhere else. */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <StepTrack steps={STEPS} current={step} done={(k) => STEPS.findIndex((x) => x.key === k) < seen} onGo={goTo} />
          <ExplainButton title={`Sprint Review \u00b7 Sprint ${state.sprintNumber}`} body={DETAIL[step]} phase="review"
            teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {step === 'done' && (<>
      {/* Progress toward the Product Goal opens the Review: the widest question first, before the
          Sprint that just ran. The Product Owner's decision on it comes at the end, once the
          visitors have been heard. */}
      <section className="space-y-1.5 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Product Goal &middot; progress</span>
          <span className="text-[11px] text-muted-foreground">Sprint {state.sprintNumber} &middot; no set number of Sprints</span>
        </div>
        <p className="text-sm font-medium">{state.productGoal}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full', progress >= 80 ? 'bg-emerald-500' : 'bg-primary')} style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-xs text-muted-foreground" title="Measured by how much visitors love the zoo (happiness), not by how much of the Backlog is built.">{progress}%</span>
        </div>
        {history.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
            <span className="uppercase tracking-wide">Happiness by Sprint</span>
            {history.map((h, i) => (
              <span key={i} className={cn('rounded-full px-1.5 py-0.5 font-mono', i === history.length - 1 ? 'bg-primary/10 font-semibold text-primary' : 'bg-muted')}>{h}</span>
            ))}
            <span>&middot; target {GOAL_HAPPINESS_TARGET}</span>
          </div>
        )}
      </section>
      {state.sprintGoal.trim() && (
        <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3',
          state.sprintGoalMet ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20' : 'border-amber-300 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20')}>
          {state.sprintGoalMet ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint Goal · {state.sprintGoalMet ? 'met' : 'not met'}</div>
            <p className="text-sm font-medium">{state.sprintGoal}</p>
            {state.sprintGoalMet
              ? <p className="text-[11px] text-muted-foreground">The work the Goal depended on was delivered - dropping less-essential scope to protect the Goal is a win, not a miss.</p>
              : <p className="text-[11px] text-muted-foreground">Work the Goal depended on was left unfinished. Inspect why, and adapt - protect the Goal by committing to less, or marking fewer items essential.</p>}
          </div>
        </div>
      )}

      {outputChasing && (
        <CoachTip>You delivered <strong>{velocity} pts</strong>, but visitors aren&rsquo;t loving the zoo yet. Value is the <em>outcome</em>, not the output - build what a visitor group actually wants (serve a zone, match a design to its crowd), not just more.</CoachTip>
      )}

      {/* What was Done, and what it cost - the Increment, in numbers. */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Delivered" value={`${velocity} pts`} />
        <Stat label="Forecast" value={`${state.sprintForecast} pts`} />
      </div>
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
            You forecast <strong>{state.sprintForecast} pts</strong> and delivered <strong>{velocity} pts</strong>
            {velocity > state.sprintForecast ? ' - faster than forecast' : velocity < state.sprintForecast ? ' - short of the forecast' : ' - right on forecast'}.
        Velocity is measured, not fixed: next Sprint&rsquo;s capacity becomes your average over the last {Math.min(state.velocity.length, 3)} Sprint{Math.min(state.velocity.length, 3) === 1 ? '' : 's'} (<strong>{zooCapacity(state.velocity)} pts</strong>).
      </p>
      </>)}

      {/* ---- The visitors ---- */}
      {step === 'visitors' && (!r || r.totalAttendance === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">Nothing is open to visitors yet, so there is no crowd to inspect. Open some of what you built next Sprint and they will come.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Visitors today" value={r.totalAttendance.toLocaleString()} />
            <Stat label="Happiness" value={`${r.overallHappiness}`} accent={barTone(r.overallHappiness)} />
          </div>

          {/* Per-segment happiness */}
          <section className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-muted-foreground" /> How each visitor group felt</div>
            <div className="space-y-2">
              {r.segments.map((s) => (
                <div key={s.segmentId} className="grid grid-cols-[130px_1fr_36px] items-center gap-2">
                  <span className="text-sm">{SEG_LABEL[s.segmentId]}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted"><span className={cn('block h-full rounded-full', SEG_COLOR[s.segmentId])} style={{ width: `${s.happiness}%` }} /></span>
                  <span className="text-right font-mono text-xs text-muted-foreground">{s.happiness}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quotes */}
          {r.quotes.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><Quote className="h-4 w-4 text-muted-foreground" /> What visitors said</div>
              <div className="space-y-2">
                {r.quotes.map((q) => (
                  <div key={q.cause + q.text} className={cn('rounded-md border-l-4 px-3 py-2 text-sm',
                    q.severity === 'praise' ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                      : q.severity === 'warning' ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20'
                        : 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20')}>
                    <span className="font-medium">{SEG_LABEL[q.segmentId]}:</span> {q.text}
                  </div>
                ))}
              </div>
            </section>
          )}

        </>
      ))}

      {/* ---- What next: adapt the Backlog, and the Product Goal call ---- */}
      {step === 'next' && (<>
          {state.signals.length > 0 && (
            <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300"><Lightbulb className="h-4 w-4" /> Adapt the Backlog</div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70">You are the Product Owner. Turn a signal into work now, or decide it can wait - ignored ones get louder.</p>
              {state.signals.map((sig, i) => (
                <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-sm dark:border-amber-900/50">
                  <span className="flex-1">{sig.suggestion}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{sig.estimatedValue}</span>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { onTakeSignal(i); setTaken((n) => n + 1); }}>Add to Backlog</Button>
                </div>
              ))}
            </section>
          )}
          {state.signals.length === 0 && (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-[12px] text-muted-foreground">
              Nothing the visitors said needs turning into work this time. Adapting the Product Backlog is the Review&rsquo;s output - some Sprints it is a long list, some Sprints it is nothing.
            </p>
          )}

      {/* What is next: the top of the Backlog as it stands after this conversation. The Guide has the
          attendees collaborating on what to do next, and "next" is a list you can point at. */}
      <section className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">What is next</h3>
          <span className="text-[11px] text-muted-foreground">
            {taken > 0 ? `${taken} item${taken === 1 ? '' : 's'} added from what the visitors said` : 'Nothing added this time'}
            {' \u00b7 '}about {readyHorizon(state)} Sprint{readyHorizon(state) === 1 ? '' : 's'} of ready work
          </span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {upNext.length === 0
            ? <p className="text-[12px] text-muted-foreground">Nothing ready. The next Sprint starts with refinement.</p>
            : upNext.map((it) => (
              <div key={it.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px]">
                <CategoryIcon item={it} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{it.unsized ? '?' : it.estimate}</span>
              </div>
            ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          The order is yours as Product Owner, and it is not settled here - the next Sprint Planning forecasts from whatever
          is ready by then.
        </p>
      </section>

      {/* The one decision only the Product Owner makes, after the visitors have been heard. */}
      <section className="space-y-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Is the Product Goal met? &middot; the Product Owner&rsquo;s call</span>
        <p className="text-[11px] text-muted-foreground">
          {progress >= 80
            ? 'Visitors love the zoo. If you judge the Product Goal met, wrap up - or keep going and make it better.'
            : 'Not there yet. Another Sprint of value - things to see, somewhere to eat, a park that is easy to get around - moves it.'}
        </p>
        {onWrapUp && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" variant={progress >= 80 ? 'default' : 'outline'} onClick={onWrapUp}>
              {progress >= 80 ? 'The Product Goal is met - wrap up' : 'End it here anyway'}
            </Button>
            {progress < 80 && <span className="text-[10px] text-muted-foreground/80">It is your call as PO - but the visitors are not there yet.</span>}
          </div>
        )}
      </section>

      </>)}

      <ActionBar left={step !== 'done' ? <Button variant="ghost" size="sm" onClick={() => setStep(step === 'next' ? 'visitors' : 'done')}>&larr; Back</Button> : undefined}>
        {step === 'done' ? <Button onClick={() => setStep('visitors')}>Next: the visitors &rarr;</Button>
          : step === 'visitors' ? <Button onClick={() => setStep('next')}>Next: what we do about it &rarr;</Button>
            : <Button onClick={onContinue}>Retrospective &rarr;</Button>}
      </ActionBar>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <div className={cn('text-2xl font-bold', accent && accent.replace('bg-', 'text-'))}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
