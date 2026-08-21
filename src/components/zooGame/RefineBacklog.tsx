import type { ZooGameState, PbiDraft } from './types';
import { SprintLengthPicker } from './SprintLengthPicker';
import { ActionBar } from './ActionBar';
import { ExplainButton } from './Explain';
import { availableItems, readyHorizon } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { ProductBacklogSidebar } from './Board';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EYEBROW, TONE, type Tone } from './ui/tokens';
import { CheckCircle2 } from 'lucide-react';

/** A number worth reading: the figure at a size you can see, its meaning under it, in the colour of
 *  what it means. Replaces a row of 12px grey text that carried the same information invisibly. */
function Figure({ value, label, tone, icon: Icon, title }: { value: number | string; label: string; tone: Tone; icon?: typeof CheckCircle2; title?: string }) {
  return (
    <span title={title} className={cn('flex items-center gap-1.5 rounded-lg border px-2.5 py-1', TONE[tone].soft, title && 'cursor-help')}>
      {Icon && <Icon className={cn('h-4 w-4 shrink-0', TONE[tone].text)} />}
      <span className={cn('text-base font-bold leading-none tabular-nums', TONE[tone].text)}>{value}</span>
      <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
    </span>
  );
}

interface RefineBacklogProps {
  state: ZooGameState;
  onEstimate: (id: string, points: number) => void;
  onAddPbi: (draft: PbiDraft) => void;
  onRefinePbi: (id: string, draft: PbiDraft) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onMoveZone: (zone: string, dir: 'up' | 'down') => void;
  onMoveBefore: (id: string, beforeId: string) => void;
  onSetUseStories: (on: boolean) => void;
  onSplitEpic: (id: string, memberIds: string[]) => void;
  onDeletePbi: (id: string) => void;
  onDuplicatePbi: (id: string) => void;
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
  /** Agreed once, here, before the first Sprint. After that only a Retrospective changes it. */
  onSetSprintDays?: (days: number) => void;
  /** The refinement teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. You need
 *  a Backlog, however rough, to start: order it and estimate the unsized items until the
 *  top items are Ready to plan. From Sprint 2 on, refinement is not a separate step - it
 *  is ongoing, done during each Sprint on the board, where it costs a little capacity. */
export function RefineBacklog({ state, onSetSprintDays, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onDeletePbi, onDuplicatePbi, onPlan, teachCard, onMarkTaught }: RefineBacklogProps) {
  const items = availableItems(state);
  const ready = items.filter((it) => !it.unsized);
  const unsized = items.length - ready.length;
  const canPlan = ready.length > 0;
  const first = state.sprintNumber === 1 && state.velocity.length === 0; // the very first pass, before any Sprint
  const horizon = readyHorizon(state);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {/* The first pass through the Backlog is not the same conversation as the ones after it: nothing
          has been built, nothing is ready, and there is no Sprint yet to be "in". Either way what
          refining costs comes out of the Sprint you are about to forecast, not one you are inside. */}
      {/* One question, like every other screen. What refinement is, who does it and how much is
          enough sits behind the "?" rather than as a paragraph over the work. */}
      <header className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Backlog Refinement</div>
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{first ? 'What could we build first?' : 'What is ready for the Sprints ahead?'}</h2>
          <ExplainButton title="Product Backlog refinement" phase="refine" teachCard={teachCard} onMarkTaught={onMarkTaught}
            body={[
              'Refinement breaks Product Backlog items into smaller, more precise ones, and adds detail: what it is, the order it sits in, and how big it is. The Developers who will do the work are the ones who size it.',
              first
                ? 'This first pass is discovery, not a plan for the whole product. A Sprint or two of ready work is enough - what you learn from building the first exhibits will change the rest of it, and detailed analysis of work that may never be built is waste.'
                : 'Refinement is ongoing work during a Sprint, done by the whole Scrum Team. It prepares later Sprints - typically two or three ahead - and it does not settle what goes into the next one. That is decided at Sprint Planning, from whatever is ready by then.',
              'It is not an event, and there is no gap between Sprints for it to happen in.',
            ]} />
        </div>
        <p className="text-sm text-muted-foreground">Split what is too big, size what is not sized, and order it by value.</p>
      </header>

      {/* This screen asks for two things in order, and nothing said so. Numbering them is the whole
          fix: agree the cadence, then get the top of the Backlog ready. */}
      {first && onSetSprintDays && (
        <section className="rounded-lg border-2 border-primary/30 bg-primary/[0.04] p-2.5">
          <h3 className={cn(EYEBROW, 'mb-1.5 flex items-center gap-1.5 text-primary')}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">1</span>
            First, agree how long a Sprint is
          </h3>
          <SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="setup" />
        </section>
      )}

      {/* Genuinely useful numbers set in grey 12px, which is how you hide something in plain sight.
          Each one is now a labelled figure in the colour of what it means. */}
      <div className="flex flex-wrap items-stretch gap-2">
        {first && (
          <span className={cn(EYEBROW, 'flex items-center gap-1.5 self-center text-primary')}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">2</span>
            Then get the top ready
          </span>
        )}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Figure value={items.length} label="in the Product Backlog" tone="quiet" />
          <Figure value={`${horizon}`} label={`Sprint${horizon === 1 ? '' : 's'} ready`} tone={horizon > 3 ? 'attention' : horizon >= 1 ? 'done' : 'attention'}
            title="How far ahead the Product Backlog is prepared: Ready points against your capacity. Aim for a Sprint or two - past three is analysis you may never use." />
          {unsized > 0 && <Figure value={unsized} label="to estimate" tone="coach" />}
          <Figure value={ready.length} label="Ready" tone="done" icon={CheckCircle2} />
        </div>
      </div>

      {/* The list scrolls inside itself, so the question, the Sprint length and the readiness bar
          stay put - nothing important goes below the fold just because the Backlog is long. */}
      <div className="max-h-[42vh] overflow-y-auto pr-1">
      <ProductBacklogSidebar state={state} mode="refine" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
        onSetUseStories={onSetUseStories} onEstimate={onEstimate} onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />
      </div>

      <ActionBar hint={!canPlan ? 'Estimate at least one item so it is Ready to plan' : undefined}>
        <Button disabled={!canPlan} onClick={onPlan}>Go to Sprint Planning &rarr;</Button>
      </ActionBar>
    </div>
  );
}
