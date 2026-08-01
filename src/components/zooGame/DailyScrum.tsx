import type { ZooGameState } from './types';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface DailyScrumProps {
  state: ZooGameState;
  onHold: () => void;
  onSkip: () => void;
}

/** The Daily Scrum: the Developers' short daily sync to inspect progress toward the
 *  Sprint's goal and re-plan the day. It is not a problem-solving session - blockers
 *  are surfaced here, then removed outside the event (the Scrum Master helps). The
 *  Scrum Master is accountable for it happening, not for attending. Hold it and a
 *  waiting blocker is spotted early; skip it and it goes unseen and resurfaces
 *  tomorrow, later and costlier. */
export function DailyScrum({ state, onHold, onSkip }: DailyScrumProps) {
  const committed = state.backlog.filter((it) => it.sprintNumber === state.sprintNumber);
  const built = committed.filter((it) => it.status === 'done' || it.status === 'open').length;
  const openCount = committed.filter((it) => it.status === 'open').length;
  const pts = committed.filter((it) => it.status === 'done' || it.status === 'open').reduce((s, it) => s + it.estimate, 0);
  const daysLeft = state.sprintDays - state.dayNumber;
  const imp = state.pendingImpediment;
  const last = state.dayNumber === state.sprintDays;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-6">
      <div className="space-y-1.5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Users className="h-3.5 w-3.5" /> Daily Scrum
        </div>
        <h1 className="text-2xl font-bold">End of Day {state.dayNumber}</h1>
        <p className="text-sm text-muted-foreground">
          The Developers check how the Sprint is tracking and re-plan the day. It is a short progress sync,
          not a problem-solving session. The Scrum Master makes sure it happens.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Built', value: `${built}/${committed.length}` },
          { label: 'Points Done', value: pts },
          { label: 'Open to visitors', value: openCount },
          { label: 'Days left', value: last ? 'last day' : daysLeft },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-3 py-2.5 text-center">
            <div className="text-lg font-bold tabular-nums">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {imp ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/30">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">A blocker has come up: {imp.title}</div>
              <div className="text-sm text-amber-800/90 dark:text-amber-200/80">{imp.detail}</div>
              <div className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">The Daily Scrum surfaces it early - you note it now and it is dealt with outside the event, before it grows.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          No blockers surfaced today. Holding the Daily Scrum is still how you find that out.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={onHold}>
          Hold the Daily Scrum
          {last ? <ArrowRight className="ml-1.5 h-4 w-4" /> : null}
        </Button>
        <Button size="lg" variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip it, keep building
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        The sync takes a little time from tomorrow. Skipping saves that time, but a blocker you never surface
        will cost you more when it resurfaces.
      </p>
    </div>
  );
}
