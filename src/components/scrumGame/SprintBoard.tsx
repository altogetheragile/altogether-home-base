import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ScrumState, Story } from './types';
import { sprintStories, isSprintOver, deliveredPoints } from './engine';
import { totalPoints, SPRINT_TEAM } from './config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SprintBoardProps {
  state: ScrumState;
  onStartStory: (storyId: string) => void;
  onRunDay: () => void;
  onReview: () => void;
}

function StoryCard({ s, onStart }: { s: Story; onStart?: () => void }) {
  const worked = s.points - s.effortRemaining;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{s.title}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.points} pts</span>
      </div>
      {s.status === 'doing' && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(worked / s.points) * 100}%` }} />
        </div>
      )}
      {onStart && (
        <Button variant="outline" size="sm" className="mt-1.5 h-6 w-full text-xs" onClick={onStart}>Start</Button>
      )}
    </div>
  );
}

function Column({ title, stories, render }: { title: string; stories: Story[]; render: (s: Story) => React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="rounded-t-lg border border-b-0 border-border bg-muted px-3 py-2">
        <h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({stories.length})</span></h3>
      </div>
      <div className="flex-1 space-y-1.5 rounded-b-lg border border-border bg-card/50 p-2 min-h-[120px]">
        {stories.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground/40">—</div>}
        {stories.map(render)}
      </div>
    </div>
  );
}

/** The Sprint board: To Do / Doing / Done, played day by day. Each day is a Daily
 *  Scrum (pull work into Doing, then Run Day). A burndown tracks remaining work;
 *  when the timebox runs out, the Sprint is reviewed and velocity recorded. */
export function SprintBoard({ state, onStartStory, onRunDay, onReview }: SprintBoardProps) {
  const sprint = state.currentSprint;
  if (!sprint) return null;
  const stories = sprintStories(state, sprint.number);
  const todo = stories.filter((s) => s.status === 'todo');
  const doing = stories.filter((s) => s.status === 'doing');
  const done = stories.filter((s) => s.status === 'done');
  const over = isSprintOver(sprint);
  const delivered = deliveredPoints(state, sprint.number);
  const committed = totalPoints(stories);
  // The Sprint can be reviewed when the timebox is up OR all committed work is
  // already Done (finishing early is a good outcome, not a dead end).
  const workLeft = todo.length + doing.length > 0;
  const canReview = over || !workLeft;

  // Burndown: ideal straight line vs actual remaining points per day.
  const start = sprint.burndown[0] ?? committed;
  const data = Array.from({ length: sprint.length + 1 }, (_, i) => ({
    day: i,
    ideal: Math.round((start * (sprint.length - i)) / sprint.length),
    remaining: i < sprint.burndown.length ? sprint.burndown[i] : null,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Sprint {sprint.number} · Day {Math.min(sprint.day, sprint.length)}/{sprint.length}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Team: {SPRINT_TEAM.join(', ')}</span>
          {!canReview ? (
            <div className="flex flex-col items-end gap-0.5">
              <Button size="lg" onClick={onRunDay} disabled={doing.length === 0}>Run Day</Button>
              {doing.length === 0 && <span className="text-[10px] text-muted-foreground">Start a story to run the day</span>}
            </div>
          ) : (
            <Button size="lg" onClick={onReview}>Sprint Review</Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 dark:bg-emerald-950/30">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Sprint Goal</div>
        <p className="text-sm font-medium">{sprint.goal}</p>
      </div>

      {canReview && (
        <div className="rounded-lg border border-border bg-muted/40 px-5 py-3 text-sm">
          <strong>{over ? 'Sprint over.' : 'Work finished early.'}</strong> Delivered <strong>{delivered}</strong> of {committed} committed points
          {' '}({done.length}/{stories.length} stories). {workLeft
            ? 'Unfinished work returns to the Product Backlog.'
            : 'Everything committed reached Done - the Sprint Goal is met.'}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Column title="To Do" stories={todo} render={(s) => (
          <StoryCard key={s.id} s={s} onStart={canReview ? undefined : () => onStartStory(s.id)} />
        )} />
        <Column title="Doing" stories={doing} render={(s) => <StoryCard key={s.id} s={s} />} />
        <Column title="Done ✓" stories={done} render={(s) => <StoryCard key={s.id} s={s} />} />
      </div>

      {/* Burndown */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Burndown</h2>
        <div className="rounded-lg border border-border p-3">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'pts left', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#94a3b8" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="remaining" name="Actual" stroke="#3b82f6" strokeWidth={2} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className={cn('text-xs', over && delivered < committed ? 'text-amber-700' : 'text-muted-foreground')}>
          The actual line above the ideal means work is burning down too slowly - a sign of over-commitment
          or too much started at once.
        </p>
      </section>
    </div>
  );
}
