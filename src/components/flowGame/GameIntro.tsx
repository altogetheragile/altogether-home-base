import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WorkflowEditor } from './WorkflowEditor';
import type { Workflow } from './types';

interface GameIntroProps {
  onStart: (warmStart: boolean) => void;
  /** The configurable board, shown in the brief and editable before starting. */
  workflow: Workflow;
  onSetWorkflow: (workflow: Workflow) => void;
  /** Signed in, so saved games can be resumed. */
  canResume?: boolean;
  onOpenSaves?: () => void;
}

/** Join stage names into readable prose: "A, B, and C". */
function stageList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function GameIntro({ onStart, workflow, onSetWorkflow, canResume, onOpenSaves }: GameIntroProps) {
  const [warmStart, setWarmStart] = useState(false);
  const stageNames = workflow.stages.map((s) => s.name);
  const teamSize = workflow.workers.length;
  return (
    // Fill the viewport below the 4rem nav and centre the card, so the whole
    // brief - heading through the Start button - sits above the fold with no
    // scroll. The two info boxes go side by side to keep it short vertically.
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Kanban Flow Simulation</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Experience why limiting work-in-progress improves flow. You'll play two rounds
          managing a Kanban board - first without constraints, then with WIP limits you choose.
        </p>
      </div>

      <div className="grid w-full items-start gap-4 text-left sm:grid-cols-[3fr_2fr]">
        <div className="rounded-lg bg-muted/50 p-5 space-y-2">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><strong>20 work items</strong> flow through {stageList(stageNames)}.</li>
            <li><strong>{teamSize} {teamSize === 1 ? 'worker' : 'workers'}</strong> - each specialises in one column (full effectiveness) but can work anywhere (at 60%).</li>
            <li>Each day: assign workers to cards, then click <strong>Run Day</strong>. Dice determine progress.</li>
            <li><strong>Blockers</strong> appear randomly - a worker must clear them before work resumes.</li>
            <li>After 20 days you'll see your metrics, then set WIP limits and try again.</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 p-5 space-y-2">
          <h2 className="text-lg font-semibold">Your goal</h2>
          <p className="text-sm text-muted-foreground">
            Get as many items to Done as possible with the shortest cycle times.
            After both rounds, you'll see Little's Law in action with your own numbers.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* Start mode: an empty backlog, or a board already mid-flow. */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          <button
            type="button"
            onClick={() => setWarmStart(false)}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              !warmStart ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Empty board
          </button>
          <button
            type="button"
            onClick={() => setWarmStart(true)}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              warmStart ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Start mid-flow
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {warmStart
            ? 'Some work is already in progress across the board - jump straight in.'
            : 'Everything starts in the backlog - you pull the first work in.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <WorkflowEditor workflow={workflow} onSave={onSetWorkflow} />
          <Button size="lg" onClick={() => onStart(warmStart)} className="px-8 py-6 text-lg">
            Start Round 1
          </Button>
        </div>

        {canResume && (
          <button type="button" onClick={onOpenSaves} className="text-sm font-medium text-primary hover:underline">
            Resume a saved game
          </button>
        )}
      </div>
    </div>
  );
}
