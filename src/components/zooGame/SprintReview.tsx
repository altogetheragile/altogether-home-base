import { Suspense, lazy, useState } from 'react';
import type { ZooGameState } from './types';
import type { SegmentId } from './simulation/types';
import { productGoalProgress, goalMeasures, availableItems, readyHorizon, notReady, sprintCapacity, zoneSlices, isSignOffTask, GOAL_HAPPINESS_TARGET } from './engine';
import { PbiCard } from './PbiCard';
import { CardDetail } from './Board';
// The showcase carries the isometric artwork - props, and every vehicle in the car park - and
// nobody needs any of it until they reach a Review. Loading it with the game made opening the game
// slower to pay for a picture shown at the end of a Sprint.
const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));

import { CoachTip } from './CoachTip';
import { ExplainButton } from './Explain';
import { StepTrack } from './StepTrack';
import { ActionBar } from './ActionBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, PADDING, SURFACE, TEXT, TONE } from './ui/tokens';
import { Users, Quote, Lightbulb, CheckCircle2, CircleDashed, Check } from 'lucide-react';

type Step = 'done' | 'visitors' | 'next';
const STEPS: { key: Step; label: string; question: string; lead: string }[] = [
  { key: 'done', label: 'Done', question: 'What did we get Done?', lead: 'Inspect the Increment: what met the Definition of Done this Sprint.' },
  { key: 'visitors', label: 'Visitors', question: 'What do the visitors make of it?', lead: 'The people the zoo is for, telling you what they found.' },
  { key: 'next', label: 'What next', question: 'So what do we do next?', lead: 'Adapt the Product Backlog, and judge how far the Product Goal has come.' },
];
/** What the Guide says about the Review - behind the "?", not on the page. */
// Which Teaching Cards each step is about - one source for the teaching, and an editable one.
const STEP_CARDS: Record<Step, string[]> = { done: ['sprint-review', 'increment'], visitors: ['sprint-review', 'empiricism'], next: ['sprint-review', 'product-backlog'] };

interface SprintReviewProps {
  state: ZooGameState;
  onTakeSignal: (index: number) => void;
  onContinue: () => void;
  /** The PO judging the Product Goal met - the game has no fixed length. */
  onWrapUp?: () => void;
  /** Release something Done to visitors, from the Review. The Guide is explicit that the Review
   *  is not a gate to releasing value, so this is not "approving" anything: it is the Product
   *  Owner doing here what they could have done the day the item was Done. */
  onOpen?: (id: string) => void;
  /** Accepting a criterion, and ticking the plan, from the Review. Whatever is holding a Done item
   *  shut is nearly always the Product Owner's own sign-off, and sending them back to a board that
   *  belongs to a Sprint which has ended would be a dead end. */
  onConfirmAc?: (id: string, index: number, value: boolean) => void;
  onToggleTask?: (id: string, taskId: string) => void;
  /** The Sprint Review teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

const SEG_LABEL: Record<SegmentId, string> = { families: 'Families', enthusiasts: 'Enthusiasts', comfortSeekers: 'Comfort Seekers' };
const SEG_COLOR: Record<SegmentId, string> = { families: 'bg-orange-500', enthusiasts: TONE.coach.solid, comfortSeekers: 'bg-amber-700' };
const barTone = (v: number) => (v >= 67 ? 'bg-emerald-500' : v >= 34 ? 'bg-amber-500' : 'bg-rose-500');

/** Sprint Review: inspect what was Done and how the visitors responded, then adapt.
 *  It is a working conversation, not a release gate. */
export function SprintReview({ state, onTakeSignal, onContinue, onWrapUp, onOpen, onConfirmAc, onToggleTask, teachCard, onMarkTaught }: SprintReviewProps) {
  const r = state.lastReview;
  const velocity = state.velocity[state.velocity.length - 1] ?? 0;
  const slices = zoneSlices(state);
  // A snapshot rather than a diff: the Review inspects the Increment as it stands, and "what a
  // visitor can walk into today" is the honest version of that.
  const openZones = slices.filter((z) => z.open).map((z) => z.zone);
  const startedNotOpen = slices.filter((z) => !z.open && z.delivered > 0);
  const progress = Math.round(productGoalProgress(state) * 100);
  const goalChecks = goalMeasures(state);
  const history = (state.happiness ?? []).slice(-6);
  // Output-chasing: a lot delivered but visitors are not loving it (low happiness).
  const outputChasing = velocity >= 8 && r != null && r.totalAttendance > 0 && r.overallHappiness < 34;

  // Built, accepted, and still nobody can see it. The Guide: an Increment may be delivered to
  // stakeholders before the end of the Sprint, and "the Sprint Review should never be considered
  // a gate to releasing value" - so arriving here with Done work unreleased is not tidy, it is a
  // Sprint's worth of value that no visitor has had yet.
  const unreleased = state.backlog.filter((it) => it.status === 'done');

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
          <ExplainButton cards={STEP_CARDS[step]} phase="review" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{current.question}</h2>
          <p className="text-sm text-muted-foreground">{current.lead}</p>
        </div>
      </header>

      {step === 'done' && (<>
      {/* The Increment itself, before anything is said about it. A Review that opens with a chart
          is a status meeting; a Review that opens with the product is an inspection. This is the
          same zoo the park view holds, seen the way a visitor arriving at the gate would see it. */}
      <section className="overflow-hidden rounded-lg border border-border bg-[#8cc063]/25">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">The Increment &middot; everything delivered so far</span>
          <span className="text-[11px] text-muted-foreground">Not this Sprint's work alone - the whole zoo, which is what an Increment is.</span>
        </div>
        <Suspense fallback={<div className="mx-3 mb-2 h-[470px] animate-pulse rounded-md bg-black/5" aria-label="Drawing the zoo" />}>
          <IsoZoo state={state} height={470} className="px-3 pb-2" />
        </Suspense>
      </section>

      {/* Work that is Done and still shut. It sits directly under the picture, because it is the
          honest caption for it: what you are looking at is not everything the Sprint finished.
          The Review is where it becomes obvious, and it is the one screen that never said so. */}
      {unreleased.length > 0 && (
        <section className="rounded-lg border border-amber-400/60 bg-amber-500/[0.06] px-3 py-2.5">
          <div className={cn(EYEBROW, 'mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-400')}>
            Done, and nobody can see it
            <ExplainButton cards={['increment', 'sprint-review']} compact />
          </div>
          <p className="mb-2 text-sm">
            {unreleased.length === 1 ? 'One item met' : `${unreleased.length} items met`} the Definition of Done and
            {unreleased.length === 1 ? ' is' : ' are'} not open to visitors. The Review is not the gate: this could have
            gone live the day it was Done, and until it does, nobody gets anything from it.
          </p>
          <ul className="space-y-1.5">
            {unreleased.map((it) => {
              // The same guard the engine applies, said out loud rather than pressed and ignored.
              const waiting = (it.tasks ?? []).some((t) => isSignOffTask(t.label) && !t.done);
              return (
                <li key={it.id}>
                  {/* "built" is the card's own word for finished and not yet released, so the row
                      says it without a badge repeating the heading. Nothing is said twice. */}
                  <PbiCard item={it} state="built" density="row"
                    note={waiting ? 'Not open yet: its acceptance criteria are below, and the sign-off follows them.' : undefined}
                    detail={waiting && onToggleTask ? (
                      <CardDetail item={it} state={state} showAcceptance interactive defaultOpen
                        onToggleTask={onToggleTask} onConfirmAc={onConfirmAc} />
                    ) : undefined}
                    trailing={onOpen && (
                      <Button size="sm" className="h-7 shrink-0 px-2 text-xs" disabled={waiting}
                        title={waiting ? 'Accept its acceptance criteria first' : undefined}
                        onClick={() => onOpen(it.id)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Open it to visitors
                      </Button>
                    )} />
                </li>
              );
            })}
          </ul>
          {/* Releasing is the Product Owner's, so a Developer pressing this is refused by the same
              gate as anywhere else, and told whose call it is. Nothing extra is said here. */}
        </section>
      )}

      {/* Progress toward the Product Goal opens the Review: the widest question first, before the
          Sprint that just ran. The Product Owner's decision on it comes at the end, once the
          visitors have been heard. */}
      <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-1.5')}>
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
        {/* If the Scrum Team wrote measures with their Goal, this is where they pay for themselves:
            the Review stops being a feeling about progress and becomes a comparison. Every one of
            them is something the park counts, so none of it is anybody's opinion. */}
        {goalChecks.length > 0 && (
          <div className="space-y-1 rounded-md border border-border bg-muted/30 px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Its measures <span className="font-normal normal-case tracking-normal">- what you said would tell you it had happened</span>
            </div>
            <ul className="space-y-0.5">
              {goalChecks.map((m) => (
                <li key={m.metric} className="flex items-center gap-2 text-xs">
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full', m.met ? 'bg-emerald-500 text-white' : 'border border-border')}>
                    {m.met && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className={cn('min-w-0 flex-1', m.met ? 'text-muted-foreground' : 'text-foreground')}>{m.label}</span>
                  <span className={cn('shrink-0 font-mono text-[11px]', m.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {m.actual}{m.unit ?? ''} <span className="text-muted-foreground/70">/ {m.target}{m.unit ?? ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {history.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
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
          {state.sprintGoalMet ? <CheckCircle2 className={cn(TONE.done.text, "mt-0.5 h-5 w-5 shrink-0")} /> : <CircleDashed className={cn(TONE.attention.text, "mt-0.5 h-5 w-5 shrink-0")} />}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint Goal · {state.sprintGoalMet ? 'met' : 'not met'}</div>
            <p className="text-sm font-medium">{state.sprintGoal}</p>
            {state.sprintGoalMet
              ? <p className="text-[11px] text-muted-foreground">The work the Goal depended on was delivered - dropping less-essential scope to protect the Goal is a win, not a miss.</p>
              : <p className="text-[11px] text-muted-foreground">Work the Goal depended on was left unfinished. Inspect why, and adapt - protect the Goal by forecasting less, or marking fewer items essential.</p>}
          </div>
        </div>
      )}

      {/* Slices, not layers. Points delivered says how much was built; zones open says how much of it
          anybody can visit, and the gap between the two is the lesson. The card explains it. */}
      {velocity > 0 && (openZones.length > 0 || startedNotOpen.length > 0) && (
        <div className={cn('rounded-lg border px-3 py-2.5 text-sm',
          openZones.length ? 'border-emerald-400/60 bg-emerald-500/[0.06]' : 'border-amber-400/60 bg-amber-500/[0.06]')}>
          <div className={cn(EYEBROW, 'mb-1 flex items-center gap-1.5', openZones.length ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
            {openZones.length ? 'Open to visitors' : 'Nothing is open to visitors yet'}
            <ExplainButton cards={['slices', 'increment']} compact />
          </div>
          {openZones.length > 0 && (
            <p className="mb-1"><strong>{openZones.join(' and ')}</strong> {openZones.length === 1 ? 'is a zone' : 'are zones'} anyone
              can walk into - somewhere to see an animal, an animal to see, and a path to walk in on. A slice of the zoo
              rather than a layer of it.</p>
          )}
          {startedNotOpen.length > 0 && (
            <p className="text-muted-foreground">
              Still nobody can visit {startedNotOpen.map((z) => `${z.zone} (needs ${z.missing.join(' and ')})`).join(', ')}.
              {openZones.length ? ' ' : ' All that work is real. '}
              A zone is a slice of cake: it needs every layer before anyone can eat it.
              {!openZones.length && r != null && r.totalAttendance > 0 && (
                <> <strong className="text-foreground">{r.totalAttendance.toLocaleString()} people came anyway</strong> and
                  found no animal on show. They will tell their friends, and fewer will come next Sprint.</>
              )}
            </p>
          )}
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
      <p className={cn(SURFACE.quiet, 'px-4 py-2.5 text-[11px] text-muted-foreground')}>
            You forecast <strong>{state.sprintForecast} pts</strong> and delivered <strong>{velocity} pts</strong>
            {velocity > state.sprintForecast ? ' - faster than forecast' : velocity < state.sprintForecast ? ' - short of the forecast' : ' - right on forecast'}.
        Velocity is measured, not fixed: next Sprint&rsquo;s forecast is your average over the last {sprintCapacity(state).measuredSprints} Sprint{sprintCapacity(state).measuredSprints === 1 ? '' : 's'} of this length (<strong>{sprintCapacity(state).points} pts</strong>).{sprintCapacity(state).discarded > 0 && ' Sprints run at a different length are left out - their delivery says nothing about this one.'}
      </p>
      </>)}

      {/* ---- The visitors ---- */}
      {step === 'visitors' && (!r || r.totalAttendance === 0 ? (
        <p className={cn(SURFACE.quiet, 'px-5 py-4 text-sm text-muted-foreground')}>Nothing is open to visitors yet, so there is no crowd to inspect. Open some of what you built next Sprint and they will come.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Visitors today" value={r.totalAttendance.toLocaleString()} />
            <Stat label="Happiness" value={`${r.overallHappiness}`} accent={barTone(r.overallHappiness)} />
          </div>

          {/* Per-segment happiness */}
          <section className={cn(SURFACE.quiet, PADDING.roomy, 'space-y-2')}>
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
              <div className={cn(TONE.attention.text, "flex items-center gap-2 text-sm font-semibold")}><Lightbulb className="h-4 w-4" /> Adapt the Backlog</div>
              <p className={cn(TONE.attention.text, "text-[11px]")}>You are the Product Owner. Turn a signal into work now, or decide it can wait - ignored ones get louder.</p>
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
            <p className={cn(SURFACE.quiet, 'px-4 py-2.5 text-xs text-muted-foreground')}>
              Nothing the visitors said needs turning into work this time. Adapting the Product Backlog is the Review&rsquo;s output - some Sprints it is a long list, some Sprints it is nothing.
            </p>
          )}

      {/* What is next: the top of the Backlog as it stands after this conversation. The Guide has the
          attendees collaborating on what to do next, and "next" is a list you can point at. */}
      <section className={cn(SURFACE.quiet, PADDING.roomy, 'space-y-1.5')}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">What is next</h3>
          <span className="text-[11px] text-muted-foreground">
            {taken > 0 ? `${taken} item${taken === 1 ? '' : 's'} added from what the visitors said` : 'Nothing added this time'}
            {' \u00b7 '}about {readyHorizon(state)} Sprint{readyHorizon(state) === 1 ? '' : 's'} of ready work
          </span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {upNext.length === 0
            ? <p className="text-xs text-muted-foreground">Nothing ready. The next Sprint starts with refinement.</p>
            : upNext.map((it) => <PbiCard key={it.id} item={it} state={notReady(it) ? 'locked' : 'backlog'} />)}
        </div>
        <p className="text-[11px] text-muted-foreground">
          The order is yours as Product Owner, and it is not settled here - the next Sprint Planning forecasts from whatever
          is ready by then.
        </p>
      </section>

      {/* The one decision only the Product Owner makes, after the visitors have been heard. */}
      <section className={cn(SURFACE.card, PADDING.roomy, 'space-y-2')}>
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
            {progress < 80 && <span className="text-[11px] text-muted-foreground/80">It is your call as PO - but the visitors are not there yet.</span>}
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
    <div className={cn(SURFACE.card, PADDING.default, 'text-center')}>
      <div className={cn(TEXT.figure, accent && accent.replace('bg-', 'text-'))}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
