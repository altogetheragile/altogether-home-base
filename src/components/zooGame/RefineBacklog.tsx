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
import { useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { DodEditor } from './DodEditor';

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

/** One of the numbered things this screen asks for. All three are built from this, because when
 *  they were three hand-written headings they were three slightly different headings - the middle
 *  one was not even a panel, so its number sat at a different place on the page from the other two. */
function Step({ n, title, note, done, right, onToggle, children }: {
  n: number; title: string; note?: string; done?: boolean;
  /** Shown on the heading row, hard against the right - a summary, or a collapse control. */
  right?: ReactNode;
  /** If the step folds away, the WHOLE heading row opens it. A chevron on its own is a target the
   *  width of a thumbnail at the far end of a wide panel. */
  onToggle?: () => void;
  children?: ReactNode;
}) {
  const Head = onToggle ? 'button' : 'div';
  return (
    <section className={cn('rounded-lg border-2 p-2.5', done ? 'border-emerald-400/60 bg-emerald-500/[0.05]' : 'border-primary/30 bg-primary/[0.04]')}>
      <Head {...(onToggle ? { type: 'button' as const, onClick: onToggle } : {})}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
        <h3 className={cn(EYEBROW, 'flex items-center gap-1.5', done ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary')}>
          <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', done ? 'bg-emerald-500' : 'bg-primary')}>
            {done ? <Check className="h-3 w-3" /> : n}
          </span>
          {title}
          {note && <span className="font-normal normal-case tracking-normal text-muted-foreground">{note}</span>}
        </h3>
        {right}
      </Head>
      {children}
    </section>
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
  /** The Increment's commitment, agreed before the first Sprint. */
  onSetDod?: (dod: string[]) => void;
  onAgreeDod?: () => void;
  /** The refinement teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

/** Product Backlog Refinement - a one-time bootstrap before the FIRST Sprint. You need
 *  a Backlog, however rough, to start: order it and estimate the unsized items until the
 *  top items are Ready to plan. From Sprint 2 on, refinement is not a separate step - it
 *  is ongoing, done during each Sprint on the board, where it costs a little capacity. */
export function RefineBacklog({ state, onSetSprintDays, onSetDod, onAgreeDod, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onDeletePbi, onDuplicatePbi, onPlan, teachCard, onMarkTaught }: RefineBacklogProps) {
  const [lengthOpen, setLengthOpen] = useState(true);
  const [dodOpen, setDodOpen] = useState(false);
  const items = availableItems(state);
  const ready = items.filter((it) => !it.unsized);
  const unsized = items.length - ready.length;
  const canPlan = ready.length > 0;
  const first = state.sprintNumber === 1 && state.velocity.length === 0; // the very first pass, before any Sprint
  const horizon = readyHorizon(state);
  // The counts, built once - they sit on step two's heading row during setup and on their own after
  // that, and they should be the same numbers either way.
  const figures = (
    <div className="flex flex-wrap items-center gap-2">
      <Figure value={items.length} label="in the Product Backlog" tone="quiet" />
      <Figure value={`${horizon}`} label={`Sprint${horizon === 1 ? '' : 's'} ready`} tone={horizon > 3 ? 'attention' : horizon >= 1 ? 'done' : 'attention'}
        title="How far ahead the Product Backlog is prepared: Ready points against your capacity. Aim for a Sprint or two - past three is analysis you may never use." />
      {unsized > 0 && <Figure value={unsized} label="to estimate" tone="coach" />}
      <Figure value={ready.length} label="Ready" tone="done" icon={CheckCircle2} />
    </div>
  );

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
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{first ? 'Build a Product Backlog for the Product Goal' : 'What is ready for the Sprints ahead?'}</h2>
          <ExplainButton cards={['refinement', 'product-backlog', 'pbi']} phase="refine" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <p className="text-sm text-muted-foreground">Split what is too big, size what is not sized, and order it by value.</p>
      </header>

      {/* This screen asks for two things in order, and nothing said so. Numbering them is the whole
          fix: agree the cadence, then get the top of the Backlog ready. */}
      {/* Agreed once and then in the way. It folds down to what was agreed, and opens again if the
          Scrum Team wants to change its mind before the first Sprint starts. */}
      {/* Green when it is settled, like the Definition of Done below - the three steps then read as
          a checklist you are working through rather than three panels that always look the same. */}
      {first && onSetSprintDays && (
        <Step n={1} title="First, agree how long a Sprint is" done={state.sprintDaysAgreed} onToggle={() => setLengthOpen((o) => !o)}
          right={<span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <strong className="text-foreground">{state.sprintDays} days</strong>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !lengthOpen && '-rotate-90')} />
          </span>}>
          {lengthOpen && (
            <div className="mt-1.5">
              <SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="setup" />
            </div>
          )}
        </Step>
      )}

      {/* Genuinely useful numbers set in grey 12px, which is how you hide something in plain sight.
          Each one is now a labelled figure in the colour of what it means. */}
      {/* A Sprint's worth of Ready work is what step two is FOR, so that is when it is done. */}
      {first ? (
        <Step n={2} title="Then get the top ready" done={horizon >= 1} right={figures} />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">{figures}</div>
      )}

      {/* Nothing can be Done against a bar nobody has read. The Definition of Done is the Increment's
          commitment and it belongs to the whole Scrum Team, so it is agreed here - before the first
          Sprint - rather than discovered halfway through one. */}
      {first && onSetDod && (
        <Step n={3} title="And agree the Definition of Done" note={'the Increment\u2019s commitment'} done={state.dodAgreed}
          onToggle={() => setDodOpen((o) => !o)}
          right={<span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            {!dodOpen && <strong className="text-foreground">{state.definitionOfDone.length} item{state.definitionOfDone.length === 1 ? '' : 's'}</strong>}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !dodOpen && '-rotate-90')} />
          </span>}>
          {dodOpen && (
            <div className="mt-1.5 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                The bar every item clears before it is Done, and the same bar for every item. It is the whole Scrum
                Team&rsquo;s, and you can raise it at a Retrospective as the team gets better - but not lower it to get
                something through.
              </p>
              <DodEditor dod={state.definitionOfDone} onSave={onSetDod} />
              {!state.dodAgreed && onAgreeDod && (
                <Button size="sm" className="w-full" disabled={!state.definitionOfDone.length} onClick={() => { onAgreeDod(); setDodOpen(false); }}>
                  <Check className="mr-1 h-4 w-4" /> We agree - this is our Definition of Done
                </Button>
              )}
            </div>
          )}
        </Step>
      )}

      {/* The list scrolls inside itself, so the question, the Sprint length and the readiness bar
          stay put - nothing important goes below the fold just because the Backlog is long. */}
      <div className="max-h-[42vh] overflow-y-auto pr-1">
      <ProductBacklogSidebar state={state} mode="refine" onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
        onSetUseStories={onSetUseStories} onEstimate={onEstimate} onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />
      </div>

      <ActionBar hint={!canPlan ? 'Estimate at least one item so it is Ready to plan'
        : first && !state.dodAgreed ? 'Agree the Definition of Done before the first Sprint' : undefined}>
        <Button disabled={!canPlan || (first && !state.dodAgreed)} onClick={onPlan}>Go to Sprint Planning &rarr;</Button>
      </ActionBar>
    </div>
  );
}
