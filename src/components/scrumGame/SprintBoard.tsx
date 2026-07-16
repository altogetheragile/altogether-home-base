import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { ScrumState, Story, Developer } from './types';
import { sprintStories, availableStories, isSprintOver, deliveredPoints, forecastPoints, changeRequestDue } from './engine';
import { devColor } from './config';
import { DevBadge } from './DevBadge';
import { TeamBench } from './TeamBench';
import { ScrumMasterPanel } from './ScrumMasterPanel';
import { ChangeRequestPanel } from './ChangeRequestPanel';
import { DaySummary } from './DaySummary';
import { DailyScrum } from './DailyScrum';
import { BuildCanvas } from './BuildCanvas';
import { BacklogSidebar } from './BacklogSidebar';
import { LearningTip } from './LearningTip';
import { learningFor } from './learning';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FastForward } from 'lucide-react';

interface SprintBoardProps {
  state: ScrumState;
  onAssignDev: (devId: string, storyId: string) => void;
  onUnassignDev: (devId: string) => void;
  onAddToSprint: (storyId: string) => void;
  onSplitStory: (storyId: string) => void;
  onClearImpediment: () => void;
  onAcceptChange: () => void;
  onDeclineChange: () => void;
  onRunDay: () => void;
  onRunToEnd: () => void;
  onReview: () => void;
}

/** Devs working a story, with their roster colour, for the badges on a card. */
function storyDevs(state: ScrumState, storyId: string): { dev: Developer; index: number }[] {
  return state.team
    .map((dev, index) => ({ dev, index }))
    .filter(({ dev }) => state.assignments[dev.id] === storyId);
}

function StoryCard({
  s, devs, assignable, onAssign, onUnassignDev,
}: {
  s: Story;
  devs: { dev: Developer; index: number }[];
  /** True when a Developer is selected and this card can take them. */
  assignable: boolean;
  onAssign: () => void;
  onUnassignDev: (devId: string) => void;
}) {
  const worked = s.points - s.effortRemaining;
  return (
    <div
      role={assignable ? 'button' : undefined}
      onClick={assignable ? onAssign : undefined}
      className={cn(
        'rounded-md border border-border bg-card p-2 text-sm transition-all',
        assignable && 'cursor-pointer ring-2 ring-primary/60 hover:ring-primary hover:bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">{s.title}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.points} pts</span>
      </div>
      {s.status === 'doing' && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(worked / s.points) * 100}%` }} />
        </div>
      )}
      {(devs.length > 0 || assignable) && (
        <div className="mt-1.5 flex items-center gap-1">
          {devs.map(({ dev, index }) => (
            <DevBadge
              key={dev.id}
              initials={dev.initials}
              colorClass={devColor(index)}
              size="sm"
              title={`${dev.name} - click to send to the bench`}
              onClick={(e) => { e.stopPropagation(); onUnassignDev(dev.id); }}
            />
          ))}
          {devs.length === 0 && assignable && (
            <span className="text-[10px] text-muted-foreground">click to assign</span>
          )}
        </div>
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
        {stories.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground/40">-</div>}
        {stories.map(render)}
      </div>
    </div>
  );
}

/** The Sprint board: To Do / Doing / Done, played day by day. Each day is a Daily
 *  Scrum - assign Developers to the stories they'll swarm, then Run Day. A burndown
 *  tracks remaining work; when the timebox runs out, the Sprint is reviewed. */
export function SprintBoard({ state, onAssignDev, onUnassignDev, onAddToSprint, onSplitStory, onClearImpediment, onAcceptChange, onDeclineChange, onRunDay, onRunToEnd, onReview }: SprintBoardProps) {
  const sprint = state.currentSprint;
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  if (!sprint) return null;

  const stories = sprintStories(state, sprint.number);
  const todo = stories.filter((s) => s.status === 'todo');
  const doing = stories.filter((s) => s.status === 'doing');
  const done = stories.filter((s) => s.status === 'done');
  const over = isSprintOver(sprint);
  const delivered = deliveredPoints(state, sprint.number);
  const forecast = forecastPoints(state, sprint.number); // the original commitment
  const available = availableStories(state); // Product Backlog items that could be pulled in
  const working = Object.keys(state.assignments).length; // Developers actually on stories today

  // The Sprint can be reviewed when the timebox is up OR all committed work is
  // already Done (finishing early is a good outcome, not a dead end).
  const workLeft = todo.length + doing.length > 0;
  const canReview = over || !workLeft;
  // The bench and cards only take assignments while the timebox is still open.
  const locked = over;

  // One contextual coaching point for whatever the board is currently about.
  const boardTrigger = changeRequestDue(state) && state.changeRequest ? 'change-request'
    : state.currentImpediment && !state.currentImpediment.addressed ? 'impediment'
    : !over && available.length > 0 ? 'renegotiate'
    : null;

  const storyTitleById = new Map(state.productBacklog.map((s) => [s.id, s.title]));
  // A story a selected Developer could be placed on (not started-and-done, timebox open).
  const assignableIds = new Set(locked ? [] : [...todo, ...doing].map((s) => s.id));

  const select = (devId: string) => setSelectedDevId((cur) => (cur === devId ? null : devId));
  const assignTo = (storyId: string) => {
    if (!selectedDevId) return;
    onAssignDev(selectedDevId, storyId);
    setSelectedDevId(null);
  };

  // Burndown: ideal straight line vs actual remaining points per day.
  const start = sprint.burndown[0] ?? forecast;
  const data = Array.from({ length: sprint.length + 1 }, (_, i) => ({
    day: i,
    ideal: Math.round((start * (sprint.length - i)) / sprint.length),
    remaining: i < sprint.burndown.length ? sprint.burndown[i] : null,
  }));

  const card = (s: Story) => (
    <StoryCard
      key={s.id}
      s={s}
      devs={storyDevs(state, s.id)}
      assignable={!!selectedDevId && assignableIds.has(s.id)}
      onAssign={() => assignTo(s.id)}
      onUnassignDev={onUnassignDev}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 space-y-4">
      {/* Compact header: title + the Sprint Goal on one line. The day controls
          live in a sticky bar (below) so they're always reachable. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-xl font-bold">
          Sprint {sprint.number} · Day {Math.min(sprint.day, sprint.length)}/{sprint.length}
          {sprint.devDays !== sprint.length && sprint.day === sprint.length && (
            <span className="ml-2 align-middle rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">half day</span>
          )}
        </h1>
        <span className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Sprint Goal</span>
          <span className="truncate font-medium">{sprint.goal}</span>
        </span>
      </div>

      {/* The Daily Scrum, performed: the Developers inspect toward the Sprint Goal
          and re-plan the day. */}
      {!canReview && <DailyScrum state={state} />}

      {/* Around the Daily Scrum: the Scrum Master clears the way - only shown when
          there's actually an impediment, to keep the board uncluttered. */}
      {!canReview && state.currentImpediment && (
        <ScrumMasterPanel
          scrumMaster={state.scrumMaster}
          impediment={state.currentImpediment}
          onClear={onClearImpediment}
          disabled={locked}
        />
      )}

      {/* ...the Product Owner may raise a change request to decide on together... */}
      {!canReview && changeRequestDue(state) && state.changeRequest && (
        <ChangeRequestPanel
          productOwner={state.productOwner}
          request={state.changeRequest}
          onAccept={onAcceptChange}
          onDecline={onDeclineChange}
          disabled={locked}
        />
      )}

      {/* ...then the team decides who's working on what today */}
      <TeamBench
        state={state}
        selectedDevId={selectedDevId}
        onSelect={select}
        onUnassign={onUnassignDev}
        storyTitleById={storyTitleById}
        workAvailable={workLeft}
        disabled={locked}
      />

      {canReview && (
        <div className="rounded-lg border border-border bg-muted/40 px-5 py-3 text-sm">
          <strong>{over ? 'Sprint over.' : 'Committed work is done.'}</strong> Delivered <strong>{delivered}</strong> pts against a forecast of {forecast}
          {' '}({done.length} stories). {workLeft
            ? 'Unfinished work returns to the Product Backlog.'
            : delivered > forecast
              ? 'You pulled in extra work beyond the forecast - nicely done.'
              : 'The Sprint Goal is met. Ahead of schedule? Pull more from the Product Backlog, or review.'}
        </div>
      )}

      {/* The dice reveal + Done celebration for the last day run. */}
      <DaySummary state={state} />

      {/* The flow, left to right: Product Backlog -> Scrum board -> Product. */}
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
        {/* Product Backlog: pull Ready items across, refine the big ones here. */}
        <BacklogSidebar state={state} onAddToSprint={onAddToSprint} onSplitStory={onSplitStory} disabled={over} />

        {/* The Scrum board */}
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <Column title="To Do" stories={todo} render={card} />
          <Column title="Doing" stories={doing} render={card} />
          <Column title="Done ✓" stories={done} render={(s) => (
            <StoryCard key={s.id} s={s} devs={[]} assignable={false} onAssign={() => {}} onUnassignDev={onUnassignDev} />
          )} />
        </div>

        {/* The product assembling: each completed story lights up its component. */}
        <BuildCanvas state={state} compact />
      </div>

      {/* Coaching tip for what's on the board right now. */}
      {!canReview && boardTrigger && <LearningTip point={learningFor(boardTrigger)} />}

      {/* Charts: burndown and velocity, grouped like the Flow game's metrics. */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Charts</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 text-xs font-medium">Burndown <span className="font-normal text-muted-foreground">- remaining work per day</span></div>
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
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 text-xs font-medium">Velocity <span className="font-normal text-muted-foreground">- points delivered per Sprint</span></div>
            {state.velocity.length === 0 ? (
              <p className="flex h-[200px] items-center justify-center text-center text-xs text-muted-foreground/60">Velocity appears after your first Sprint.</p>
            ) : (
              <div className="flex h-[200px] items-end gap-2 pt-4">
                {state.velocity.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-mono">{v}</span>
                    <div className="w-full max-w-[2.5rem] rounded-t bg-primary" style={{ height: `${Math.max(4, v * 3)}px` }} />
                    <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky action bar: the day's controls stay in view so you never scroll
          up and down to Run the day. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
          <span className="text-xs font-medium text-muted-foreground">Day {Math.min(sprint.day, sprint.length)}/{sprint.length}</span>
          {!canReview ? (
            <>
              {sprint.day < sprint.length && (
                <Button variant="outline" size="sm" onClick={onRunToEnd} disabled={working === 0} title="Fast-forward the rest of the Sprint; the Scrum Master keeps the way clear">
                  <FastForward className="mr-1.5 h-4 w-4" /> Run remaining
                </Button>
              )}
              <Button size="sm" onClick={onRunDay} disabled={working === 0}>Run Day</Button>
              {working === 0 && <span className="hidden text-[10px] text-muted-foreground sm:inline">assign a Developer first</span>}
            </>
          ) : (
            <Button size="sm" onClick={onReview}>Sprint Review</Button>
          )}
        </div>
      </div>
    </div>
  );
}
