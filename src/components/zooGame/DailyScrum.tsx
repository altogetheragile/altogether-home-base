import type { ZooGameState, ImpedimentAnswer } from './types';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2, Clock, Star, Target } from 'lucide-react';
import { DAILY_SCRUM_SECONDS } from './config';
import { sprintProgress, todaysDecision, inTheWayOfTheGoal } from './engine';
import { Burndown } from './Burndown';
import { cn } from '@/lib/utils';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';
import { Chip } from './ui/Chip';

interface DailyScrumProps {
  state: ZooGameState;
  onHold: () => void;
  onSkip: () => void;
  /** Take something back out of the Sprint Backlog to protect the Goal. The Developers' call, and
   *  the one this event exists to make. */
  onDrop?: (id: string) => void;
  /** What the Scrum Master does about what surfaced. Four answers, and the game charges each. */
  onAnswer?: (how: ImpedimentAnswer) => void;
}

/** The Daily Scrum: the Developers' short, TIMEBOXED daily event to inspect progress toward
 *  the Sprint Goal (the burndown + essentials) and adapt the plan for the next day. It always happens.
 *  Blockers are surfaced here, not solved here - the Scrum Master removes them outside it. The
 *  real choice is whether you ADAPT to what it surfaced or carry on regardless (letting a
 *  blocker grow overnight). The timebox counts down; on expiry it adapts (the disciplined
 *  default), so you decide within the box. In learn mode the timebox is paused. */
export function DailyScrum({ state, onHold, onSkip, onDrop, onAnswer }: DailyScrumProps) {
  const decision = todaysDecision(state);
  const prog = sprintProgress(state);
  // Today counts. The Daily Scrum is held at the start of the day it is named for, so "days left"
  // that excluded it disagreed with the decision panel underneath, which counts the day you are
  // about to spend - two numbers for the same thing, on the same screen.
  const daysLeft = Math.max(0, state.sprintDays - state.dayNumber + 1);
  const imp = state.pendingImpediment;
  // Before essentials can be marked, the Goal rests on everything forecast - so the figure counts
  // items rather than reporting that nothing has a star on it.
  const inSprint = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber && it.status !== 'backlog');
  const itemsTotal = inSprint.length;
  const itemsDone = inSprint.filter((it) => it.status === 'done' || it.status === 'open').length;

  // The timebox counts in game state (TICK_SCRUM), not here, so it survives a reload and
  // can be shared. On expiry the reducer takes the disciplined default and adapts.
  const left = state.scrumSecondsLeft;

  const boxPct = Math.max(0, Math.min(100, (left / DAILY_SCRUM_SECONDS) * 100));
  const low = boxPct <= 30;

  // Who is in the room. The Daily Scrum is the Developers' event: the Product Owner and the Scrum
  // Master take part only if they are working on Sprint Backlog items. The line is on the screen
  // because the accountability is the thing being taught, and implying it teaches nobody.
  const devs = state.team.developers.map((d) => d.name).join(', ');
  const block = imp?.kind === 'block';
  const goalRisk = inTheWayOfTheGoal(state, imp ?? null);

  return (
    <div className="space-y-3">
      {/* One line: which event, how long it is, and how much of it is left. The timebox used to be a
          bar of its own under the title, which is a third block of furniture before the decision. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
          state.learnMode ? 'bg-muted text-muted-foreground' : low ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary')}>
          <Users className="h-3.5 w-3.5" /> Daily Scrum
          <span className="opacity-60">&middot;</span>
          {/* The timebox in the game's own seconds. It used to read "15 min timebox &middot; 0:03
              left" - two different units in one sentence, which is why the clock read as broken. The
              real fifteen minutes is a teaching point, and it is made in the text below. */}
          {state.learnMode ? 'timebox paused' : <>timebox <span className="opacity-60">&middot;</span> <span className="tabular-nums">0:{String(left).padStart(2, '0')}</span> left</>}
        </span>
        {!state.learnMode && (
          <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className={cn('block h-full rounded-full transition-[width] duration-500 ease-linear', low ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${boxPct}%` }} />
          </span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">Day {state.dayNumber} Daily Scrum</h1>
        {/* The Guide has this every day of the Sprint. The game lets you carry on regardless and
            shows what that costs - so the copy says that, rather than "it always happens" on a
            screen with a button that skips it. */}
        <p className="text-sm text-muted-foreground">
          Are we on track for the Sprint Goal? Inspect progress and adapt the plan for today. The Scrum Guide has this
          every day of a Sprint, timeboxed to 15 minutes; here it runs in the game&rsquo;s own seconds,
          you can carry on regardless, and the cost of that is shown.
        </p>
      </div>

      {/* Inspect: the three numbers this event is about. */}
      <div className="grid gap-2 sm:grid-cols-3">
        {/* Marking essentials is revealed after the first Sprint. "none ⭐" was the figure until
            then, which reads as a fault rather than as a thing you have not met yet. */}
        {prog.essentialsTotal
          ? <Stat icon={Star} label="Essentials done" value={`${prog.essentialsDone} of ${prog.essentialsTotal}`} />
          : <Stat icon={Star} label="Items done" value={`${itemsDone} of ${itemsTotal}`} />}
        <Stat icon={Target} label="Points done" value={`${prog.pointsDone} of ${prog.pointsCommitted}`} />
        <Stat icon={Clock} label={daysLeft === 1 ? 'Day left' : 'Days left'} value={`${daysLeft}`} />
      </div>

      {/* ...and adapt: the burndown and the decision, side by side, above the fold. The decision is
          the reason this screen exists, and it used to start eight hundred pixels down it. */}
      <div className={cn('grid gap-2', decision && onDrop ? 'lg:grid-cols-2' : '')}>
        <div className={cn(SURFACE.card, PADDING.default)}>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-muted-foreground" /> Burndown
            <span className="font-normal text-muted-foreground">- above the line means behind</span>
          </div>
          <Burndown state={state} />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {prog.remaining === 0 ? 'All the forecast work is done - ahead of the line.'
              : `${prog.remaining} pts remain over ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`}
          </p>
        </div>

        {decision && onDrop && (
          <div data-part="decision" className="rounded-lg border-2 border-amber-400/70 bg-amber-500/[0.07] p-3">
            <div className="text-sm font-bold">Decision for today</div>
            <p className="mt-1 text-sm">
              {decision.left} points left, {decision.daysLeft} day{decision.daysLeft === 1 ? '' : 's'} to do
              about {decision.capacity} of them.{' '}
              {decision.essentialsKnown
                ? <><strong>{decision.candidate.name}</strong> is not what the Goal depends on.</>
                : <>Nothing is marked essential this Sprint, so which to put down is the Developers&rsquo; judgement.
                  <strong> {decision.candidate.name}</strong> is the biggest of them.</>}
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">{decision.ifDropped}</p>
            <p className="text-[12px] text-muted-foreground">{decision.ifKept}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              {/* "Protect the Goal" is a claim, and it is only true where the team has said what the
                  Goal depends on. Until then dropping something is how the rest gets finished. */}
              <Button size="sm" onClick={() => { onDrop(decision.candidate.id); onHold(); }}>
                Drop {decision.candidate.name}, {decision.essentialsKnown ? 'protect the Goal' : 'finish the rest'}
              </Button>
              <Button size="sm" variant="outline" onClick={onHold}>Keep the plan</Button>
            </div>
          </div>
        )}
      </div>

      {imp ? (
        <>
          {/* What surfaced, and which kind of thing it is.
              
              A block stops one item and the Developers can clear it themselves; an impediment slows
              the whole team and is beyond their self-management, which is what makes it the Scrum
              Master's. The arbiter is the Sprint Goal, and the screen says which test it applied. */}
          <div data-part="surfaced" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={cn(TONE.attention.text, "mt-0.5 h-5 w-5 shrink-0")} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn(TONE.attention.text, 'text-sm font-semibold')}>{imp.title}</span>
                  <Chip tone={block ? 'quiet' : 'attention'}>{block ? 'a block · one item' : 'an impediment · the whole team'}</Chip>
                </div>
                <div className={cn(TONE.attention.text, "text-sm")}>{imp.detail}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {block
                    ? (goalRisk
                      ? 'It is on work the Sprint Goal depends on, so it is not just one item\u2019s problem any more.'
                      : 'The Sprint Goal does not depend on it, and the Developers can clear their own blocks. Is this really yours?')
                    : 'It is beyond what the Developers can sort out between themselves, which is what makes it yours.'}
                </div>
              </div>
            </div>
          </div>

          {/* Four answers, none forbidden, each with what it costs written on it. */}
          <div data-part="answers" className="grid gap-2 sm:grid-cols-2">
            {([
              { how: 'team' as const, label: 'Leave it to the Developers',
                cost: block ? 'they clear it - about 5% of the day' : 'it is beyond them, and it grows overnight' },
              { how: 'remove' as const, label: 'Remove it yourself',
                cost: block ? 'cleared, and they learn to wait for you' : 'cleared today, at about 10% of the day' },
              { how: 'around' as const, label: 'Work around it',
                cost: 'a small cut today, and it is still there tomorrow' },
              { how: 'escalate' as const, label: 'Escalate it',
                cost: 'nothing today. It clears in a day or two, and nobody here solved it' },
            ]).map((o) => (
              // None of them is drawn as the answer. The screen leaned on one - the conventional
              // move for whichever kind of thing it was - and a judgement with an orange button on
              // it is not a judgement, it is a prompt. The costs are the argument; the choice is
              // the Scrum Master's.
              <button key={o.how} type="button" onClick={() => onAnswer?.(o.how)} disabled={!onAnswer}
                className={cn(FOCUS, 'rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 disabled:opacity-50')}>
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.cost}</span>
              </button>
            ))}
          </div>
          {/* Holding the event is its own act, and it was missing: with something on the table the
              only ways out were to answer it or to skip the event altogether. Reported from playing
              it - "there is no option to perform a Daily Scrum on the takeover". The Developers can
              hold their Daily Scrum and leave the thing where it is; working around it is an
              answer, and so is deciding not to decide today. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex flex-col gap-1">
              <Button onClick={() => { onAnswer?.('around'); onHold(); }}>Hold the Daily Scrum &rarr;</Button>
              <span className="text-[11px] text-muted-foreground">the event happens; what surfaced is worked around and is still there tomorrow</span>
            </div>
            <div>
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">Carry on regardless</Button>
              <span className="ml-2 text-[11px] text-muted-foreground">the event does not happen, and it grows overnight</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className={cn(TONE.done.text, "h-5 w-5 shrink-0")} />
            {prog.essentialsTotal && prog.essentialsDone < prog.essentialsTotal
              ? 'Nothing blocking today - but essentials are still open. Adapt the plan to finish those first.'
              : 'On track for the Sprint Goal - nothing blocking today. The Daily Scrum is how you know that.'}
          </div>
          <div className="flex flex-col gap-1">
            <Button onClick={onHold}>Adapt and continue &rarr;</Button>
            <span className="text-[11px] text-muted-foreground">{state.scrumDiscipline ? 'efficient - no time lost' : 'the event takes ~10% of tomorrow'}</span>
          </div>
        </div>
      )}

      {/* Whose event this is, said rather than implied. */}
      <p data-part="in-the-room" className="border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">In the room:</span> the Developers - {devs}. The Product Owner and
        the Scrum Master take part only if they are working on Sprint Backlog items. The plan is the Developers&rsquo; to
        change, and the Sprint Goal is the thing being protected.
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className={cn(SURFACE.card, PADDING.default, 'text-center')}>
      <div className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums"><Icon className="h-4 w-4 text-muted-foreground" />{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
