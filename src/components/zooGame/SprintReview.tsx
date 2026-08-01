import type { ZooGameState } from './types';
import type { SegmentId } from './simulation/types';
import { productGoalProgress } from './engine';
import { ParkView, type ParkArrange } from './ParkView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, Quote, Lightbulb, CheckCircle2, CircleDashed } from 'lucide-react';

interface SprintReviewProps {
  state: ZooGameState;
  onTakeSignal: (index: number) => void;
  onContinue: () => void;
  arrange: ParkArrange;
}

const SEG_LABEL: Record<SegmentId, string> = { families: 'Families', enthusiasts: 'Enthusiasts', comfortSeekers: 'Comfort Seekers' };
const SEG_COLOR: Record<SegmentId, string> = { families: 'bg-orange-500', enthusiasts: 'bg-sky-500', comfortSeekers: 'bg-amber-700' };
const barTone = (v: number) => (v >= 67 ? 'bg-emerald-500' : v >= 34 ? 'bg-amber-500' : 'bg-rose-500');

/** Sprint Review: inspect what was Done and how the visitors responded, then adapt.
 *  It is a working conversation, not a release gate. */
export function SprintReview({ state, onTakeSignal, onContinue, arrange }: SprintReviewProps) {
  const r = state.lastReview;
  const velocity = state.velocity[state.velocity.length - 1] ?? 0;
  const progress = Math.round(productGoalProgress(state) * 100);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sprint {state.sprintNumber} Review</h1>
        <p className="text-sm text-muted-foreground">Inspect what was Done and how the visitors responded. Work is Done because it met its criteria during the Sprint - this is not a release gate.</p>
      </div>

      {state.sprintGoal.trim() && (
        <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3',
          state.sprintGoalMet ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20' : 'border-amber-300 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20')}>
          {state.sprintGoalMet ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sprint Goal · {state.sprintGoalMet ? 'met' : 'not met'}</div>
            <p className="text-sm font-medium">{state.sprintGoal}</p>
            {!state.sprintGoalMet && <p className="text-[11px] text-muted-foreground">Not everything committed was finished. Inspect why, and adapt - forecasts get more honest with each Sprint.</p>}
          </div>
        </div>
      )}

      {/* The park the visitors experienced this Sprint. Arrange it here too. */}
      <ParkView state={state} arrange={arrange} />

      {!r || r.totalAttendance === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">Nothing is open to visitors yet, so there is no crowd to inspect. Delivered <strong>{velocity} pts</strong> of work this Sprint - open some of it next time to see the visitors arrive.</p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Visitors today" value={r.totalAttendance.toLocaleString()} />
            <Stat label="Happiness" value={`${r.overallHappiness}`} accent={barTone(r.overallHappiness)} />
            <Stat label="Delivered" value={`${velocity} pts`} />
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

          {/* Signals to adapt the backlog */}
          {state.signals.length > 0 && (
            <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300"><Lightbulb className="h-4 w-4" /> Adapt the Backlog</div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70">You are the Product Owner. Turn a signal into work now, or decide it can wait - ignored ones get louder.</p>
              {state.signals.map((sig, i) => (
                <div key={sig.drivenBy} className="flex items-center gap-2 rounded-md border border-amber-200 bg-background px-2.5 py-1.5 text-sm dark:border-amber-900/50">
                  <span className="flex-1">{sig.suggestion}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{sig.estimatedValue}</span>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onTakeSignal(i)}>Add to Backlog</Button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">Product Goal reached: <span className="font-medium text-foreground">{progress}%</span></p>

      <div className="fixed inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-2.5 shadow-lg backdrop-blur">
        <Button size="sm" onClick={onContinue}>Retrospective &rarr;</Button>
      </div>
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
