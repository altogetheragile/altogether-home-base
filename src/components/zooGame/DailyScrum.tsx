import type { ZooGameState } from './types';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DailyScrumProps {
  state: ZooGameState;
  onHold: () => void;
  onSkip: () => void;
}

/** The Daily Scrum: the Developers' short daily event to inspect progress toward the
 *  Sprint Goal and re-plan the next day's work. It always happens (it is not optional).
 *  Blockers are surfaced here, not solved here - the Scrum Master removes them outside
 *  the event. The real choice is whether you ADAPT the plan to what it surfaced or carry
 *  on regardless; carrying on lets a blocker grow overnight, costing far more tomorrow. */
export function DailyScrum({ state, onHold, onSkip }: DailyScrumProps) {
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber);
  const built = committed.filter((it) => it.status === 'done' || it.status === 'open').length;
  const openCount = committed.filter((it) => it.status === 'open').length;
  const pts = committed.filter((it) => it.status === 'done' || it.status === 'open').reduce((s, it) => s + it.estimate, 0);
  const daysLeft = state.sprintDays - state.dayNumber;
  const imp = state.pendingImpediment;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-6">
      <div className="space-y-1.5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Users className="h-3.5 w-3.5" /> Daily Scrum
        </div>
        <h1 className="text-2xl font-bold">End of Day {state.dayNumber}</h1>
        <p className="text-sm text-muted-foreground">
          The Developers inspect progress toward the Sprint Goal and re-plan the next day. This event always
          happens - it is not optional. Blockers are surfaced here and removed by the Scrum Master outside it.
        </p>
        {state.sprintGoal.trim() && (
          <p className="mx-auto max-w-md rounded-md bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">Working toward: <span className="font-medium text-foreground">{state.sprintGoal}</span></p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Built', value: `${built}/${committed.length}` },
          { label: 'Points Done', value: pts },
          { label: 'Open to visitors', value: openCount },
          { label: 'Days left', value: daysLeft },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
            <div className="text-lg font-bold tabular-nums">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {imp ? (
        <>
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">A blocker surfaced: {imp.title}</div>
                <div className="text-sm text-amber-800/90 dark:text-amber-200/80">{imp.detail}</div>
                <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">Do you adapt the plan around it (the Scrum Master removes it), or carry on with the original plan?</div>
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
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            On track for the Sprint Goal - nothing blocking today. The Daily Scrum is how you know that.
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button size="lg" onClick={onHold}>Re-plan and continue &rarr;</Button>
            <span className="text-[11px] text-muted-foreground">{state.scrumDiscipline ? 'efficient - no time lost' : 'the event takes ~10% of tomorrow'}</span>
          </div>
        </>
      )}
    </div>
  );
}
