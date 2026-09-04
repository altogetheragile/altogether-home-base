import type { ZooGameState } from './types';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2, Clock, Star, Target } from 'lucide-react';
import { DAILY_SCRUM_SECONDS } from './config';
import { sprintProgress, todaysDecision } from './engine';
import { Burndown } from './Burndown';
import { cn } from '@/lib/utils';
import { PADDING, SURFACE, TEXT, TONE } from './ui/tokens';

interface DailyScrumProps {
  state: ZooGameState;
  onHold: () => void;
  onSkip: () => void;
  /** Take something back out of the Sprint Backlog to protect the Goal. The Developers' call, and
   *  the one this event exists to make. */
  onDrop?: (id: string) => void;
}

/** The Daily Scrum: the Developers' short, TIMEBOXED daily event to inspect progress toward
 *  the Sprint Goal (the burndown + essentials) and adapt the plan for the next day. It always happens.
 *  Blockers are surfaced here, not solved here - the Scrum Master removes them outside it. The
 *  real choice is whether you ADAPT to what it surfaced or carry on regardless (letting a
 *  blocker grow overnight). The timebox counts down; on expiry it adapts (the disciplined
 *  default), so you decide within the box. In learn mode the timebox is paused. */
export function DailyScrum({ state, onHold, onSkip, onDrop }: DailyScrumProps) {
  const decision = todaysDecision(state);
  const prog = sprintProgress(state);
  // Today counts. The Daily Scrum is held at the start of the day it is named for, so "days left"
  // that excluded it disagreed with the decision panel underneath, which counts the day you are
  // about to spend - two numbers for the same thing, on the same screen.
  const daysLeft = Math.max(0, state.sprintDays - state.dayNumber + 1);
  const imp = state.pendingImpediment;
  const pct = prog.pointsCommitted ? Math.round((prog.pointsDone / prog.pointsCommitted) * 100) : 0;

  // The timebox counts in game state (TICK_SCRUM), not here, so it survives a reload and
  // can be shared. On expiry the reducer takes the disciplined default and adapts.
  const left = state.scrumSecondsLeft;

  const boxPct = Math.max(0, Math.min(100, (left / DAILY_SCRUM_SECONDS) * 100));
  const low = boxPct <= 30;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-5">
      <div className="space-y-1.5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Users className="h-3.5 w-3.5" /> Daily Scrum
        </div>
        <h1 className={TEXT.screen}>Day {state.dayNumber} Daily Scrum</h1>
        <p className="text-sm text-muted-foreground">
          A short, timeboxed check: inspect progress toward the Sprint Goal and adapt the plan for the next day. It
          always happens. Blockers are surfaced here and removed by the Scrum Master outside it.
        </p>
      </div>

      {/* The timebox: a real countdown, so the event stays short. */}
      {state.learnMode ? (
        <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <Clock className="h-3 w-3" /> Learn mode - timebox paused, adapt when ready
        </div>
      ) : (
        <div className="mx-auto max-w-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Timebox (stands in for 15 min)</span>
            <span className={cn('tabular-nums', low && 'text-red-600 dark:text-red-400')}>0:{String(left).padStart(2, '0')}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-[width] duration-500 ease-linear', low ? 'bg-red-500' : 'bg-primary')} style={{ width: `${boxPct}%` }} />
          </div>
        </div>
      )}

      {state.sprintGoal.trim() && (
        <p className="mx-auto max-w-md rounded-md bg-primary/5 px-3 py-1.5 text-center text-xs text-muted-foreground">Working toward: <span className="font-medium text-foreground">{state.sprintGoal}</span></p>
      )}

      {/* Inspect progress toward the Goal: essentials, points, days left - and the burndown. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Star} label="Essentials done" value={prog.essentialsTotal ? `${prog.essentialsDone}/${prog.essentialsTotal}` : 'none ⭐'} />
        <Stat icon={Target} label="Points done" value={`${prog.pointsDone}/${prog.pointsCommitted}`} />
        <Stat icon={Clock} label="Days left" value={`${daysLeft}`} />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className={cn(SURFACE.card, PADDING.default)}>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Target className="h-3.5 w-3.5 text-muted-foreground" /> Burndown <span className="font-normal text-muted-foreground">- forecast points still to do</span></div>
        <Burndown state={state} />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {prog.remaining === 0 ? 'All the forecast work is done - ahead of the line.'
            : `${prog.remaining} pts remain over ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Above the ideal line = behind; adapt by focusing the essentials.`}
        </p>
      </div>

      {/* "Are we on track for the Sprint Goal?" answered with the arithmetic rather than asked as a
          question. Where the forecast no longer fits, the honest move is to drop what the Goal does
          not need while there is still time for what it does - so the game says which item that
          would be, and what each choice leaves. */}
      {decision && onDrop && (
        <div className="rounded-lg border border-amber-400/60 bg-amber-500/[0.06] p-3">
          <div className="text-sm font-semibold">Decision for today</div>
          <p className="mt-1 text-sm">
            {decision.left} points left and {decision.daysLeft} day{decision.daysLeft === 1 ? '' : 's'} to do
            about {decision.capacity} of them. <strong>{decision.candidate.name}</strong> is not what the Goal
            depends on.
          </p>
          <p className="mt-1.5 text-[12px] text-muted-foreground">{decision.ifDropped}</p>
          <p className="text-[12px] text-muted-foreground">{decision.ifKept}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button size="sm" onClick={() => { onDrop(decision.candidate.id); onHold(); }}>
              Drop {decision.candidate.name}, protect the Goal
            </Button>
            <Button size="sm" variant="outline" onClick={onHold}>Keep the plan</Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The Developers hold this. The Product Owner is not in the room, and that is the point: the plan is
            theirs to change, and the Goal is the thing being protected.
          </p>
        </div>
      )}

      {imp ? (
        <>
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={cn(TONE.attention.text, "mt-0.5 h-5 w-5 shrink-0")} />
              <div>
                <div className={cn(TONE.attention.text, "text-sm font-semibold")}>A blocker surfaced: {imp.title}</div>
                <div className={cn(TONE.attention.text, "text-sm")}>{imp.detail}</div>
                {/* Surfaced here, removed outside here. The screen used to say the Scrum Master
                    removed it as part of adapting the plan, which put a Scrum Master act inside a
                    Developers' event and contradicted the Daily Scrum card two clicks away. */}
                <div className={cn(TONE.attention.text, "mt-1 text-xs")}>Do you adapt today&rsquo;s plan around it, so the Scrum Master can get it removed, or carry on with the original plan?</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <div className="flex flex-col items-center gap-1">
              <Button size="lg" onClick={onHold}>Adapt the plan</Button>
              <span className="text-[11px] text-muted-foreground">{state.scrumDiscipline ? 'efficient - no time lost tomorrow' : 'the event takes ~10% of tomorrow'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button size="lg" variant="ghost" onClick={onSkip} className="text-muted-foreground">Carry on regardless</Button>
              <span className="text-[11px] text-muted-foreground">the blocker grows overnight - ~45% of tomorrow</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Adapting is cheap; ignoring a surfaced blocker lets it grow overnight and eat into a whole day&rsquo;s build time.
          </p>
        </>
      ) : (
        <>
          <div className={cn(SURFACE.quiet, PADDING.roomy, 'flex items-center gap-2.5 text-sm text-muted-foreground')}>
            <CheckCircle2 className={cn(TONE.done.text, "h-5 w-5 shrink-0")} />
            {prog.essentialsTotal && prog.essentialsDone < prog.essentialsTotal
              ? 'Nothing blocking today - but essentials are still open. Adapt the plan to finish those first.'
              : 'On track for the Sprint Goal - nothing blocking today. The Daily Scrum is how you know that.'}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button size="lg" onClick={onHold}>Adapt and continue &rarr;</Button>
            <span className="text-[11px] text-muted-foreground">{state.scrumDiscipline ? 'efficient - no time lost' : 'the event takes ~10% of tomorrow'}</span>
          </div>
        </>
      )}
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
