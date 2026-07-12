import type { ScrumState } from './types';
import { sprintStories } from './engine';
import { totalPoints } from './config';
import { Button } from '@/components/ui/button';

interface SprintViewProps {
  state: ScrumState;
  onBack: () => void;
}

/** Placeholder for Sprint execution. Shows the committed Sprint (Goal + Sprint
 *  Backlog); the day-by-day board and Daily Scrum are the next slice. */
export function SprintView({ state, onBack }: SprintViewProps) {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const stories = sprintStories(state, sprint.number);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sprint {sprint.number} · Day {sprint.day}/{sprint.length}</h1>
        <Button variant="outline" size="sm" onClick={onBack}>Back to planning</Button>
      </div>

      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 dark:bg-emerald-950/30">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Sprint Goal</div>
        <p className="text-sm font-medium">{sprint.goal}</p>
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Sprint Backlog</h2>
          <span className="text-xs text-muted-foreground">{stories.length} stories · {totalPoints(stories)} pts forecast</span>
        </div>
        <div className="space-y-1.5">
          {stories.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className="flex-1">{s.title}</span>
              <span className="font-mono text-xs">{s.points} pts</span>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Next slice: play the Sprint day by day - assign the team, run each day (the Daily Scrum),
        and move stories to Done against the Definition of Done. Then Sprint Review and Retrospective.
      </div>
    </div>
  );
}
