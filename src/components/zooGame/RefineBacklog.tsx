import type { ZooGameState, PbiDraft } from './types';
import { SprintLengthPicker } from './SprintLengthPicker';
import { ActionBar } from './ActionBar';
import { ExplainButton } from './Explain';
import { availableItems, readyHorizon, START_READY } from './engine';
import { SPRINT_LENGTH_OPTIONS } from './config';
import { ProductBacklogSidebar } from './Board';
import { GroundPanel } from './GroundPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FOCUS, TONE, type Tone } from './ui/tokens';
import { useState, type ReactNode } from 'react';
import { CheckCircle2, Check, CircleDashed } from 'lucide-react';
import { DodEditor } from './DodEditor';
import { ItemTakeover } from './BacklogBench';
import { PriyaHandover } from './PriyaHandover';
import { SplitPanes } from './SplitPanes';
import { useSplit } from './useSplit';
import { handover, nextToRefine } from './handover';

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

/** Something already settled on this screen, as one quiet line with a way back in. The numbered
 *  steps these replaced were all on screen at once, open or shut, beside the "Your move" card and
 *  the ground panel - four things asking at once on the screen a newcomer meets first. Now the
 *  screen asks one thing, in the card, and what is settled steps back to a line. */
function Settled({ part, children, open, onToggle, change = 'Change', body, pending }: {
  part: string; children: ReactNode; open?: boolean; onToggle?: () => void; change?: string; body?: ReactNode;
  /** Not settled yet, and not the move either: there to be done early by whoever wants to. */
  pending?: boolean;
}) {
  return (
    <li data-part={part} className="space-y-1.5">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        {pending
          ? <CircleDashed className={cn(TONE.attention.text, 'h-3.5 w-3.5 shrink-0')} />
          : <Check className={cn(TONE.done.text, 'h-3.5 w-3.5 shrink-0')} />}
        <span className="min-w-0 flex-1">{children}</span>
        {onToggle && (
          <button type="button" onClick={onToggle} aria-expanded={!!open}
            className={cn(FOCUS, 'shrink-0 rounded px-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline')}>
            {open ? 'Done' : change}
          </button>
        )}
      </div>
      {open && body}
    </li>
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
  /** The Developers decide what will meet a need - the moment this screen exists for. */
  onChooseSolution?: (id: string, pick: string) => void;
  onDeletePbi: (id: string) => void;
  onDuplicatePbi: (id: string) => void;
  /** Move on to Sprint Planning with the refined Backlog. */
  onPlan: () => void;
  /** Open the ground for another area, out of what the zoo is worth. The Product Owner's call. */
  onOpenGround?: (zone: string) => void;
  /** Agreed once, here, before the first Sprint. After that only a Retrospective changes it. */
  onSetSprintDays?: (days: number) => void;
  /** The Increment's commitment, agreed before the first Sprint. */
  onSetDod?: (dod: string[]) => void;
  onAgreeDod?: () => void;
  /** The refinement teaching card, shown inside the "?" rather than on the page. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
}

/** The two decisions that genuinely precede the first Sprint - how long a Sprint is, and
 *  what Done means - plus a look at the Product Backlog the Product Owner has just written.
 *
 *  This screen used to be called Initial Refinement and invited you to get the Product Backlog
 *  right before starting. That is Sprint 0, and it is the habit trainers spend a day
 *  undoing: the Guide has no phase before the first Sprint ("a new Sprint starts
 *  immediately after the conclusion of the previous Sprint"), and refinement is ongoing
 *  work inside Sprints, not a gate in front of them. A rough Backlog with a Sprint's
 *  worth ready at the top is enough, and the rest is built out through the Sprints - which
 *  is what actually happens, and what costs capacity you can see. You can still tidy the
 *  list here; the screen just stops telling you to finish it first. */
export function RefineBacklog({ state, onSetSprintDays, onSetDod, onAgreeDod, onEstimate, onAddPbi, onRefinePbi, onReorder, onMoveZone, onMoveBefore, onSetUseStories, onSplitEpic, onChooseSolution, onDeletePbi, onDuplicatePbi, onPlan, onOpenGround, teachCard, onMarkTaught }: RefineBacklogProps) {
  // Closed, like the agreement below it. Two steps side by side, one open and one shut, said that
  // the first was further along than the second when neither had been done.
  const [lengthOpen, setLengthOpen] = useState(false);
  const [dodChanging, setDodChanging] = useState(false);
  const wide = useSplit('lg');
  // Which item is on the bench. Nothing, until you pick one.
  const [focus, setFocus] = useState<string | null>(null);
  const items = availableItems(state);
  const benchItem = items.find((it) => it.id === focus) ?? null;
  const ready = items.filter((it) => !it.unsized);
  const unsized = items.length - ready.length;
  // Nothing Ready is not a gate. "The Scrum Team may refine these items during this process" (Sprint
  // Planning, Scrum Guide 2020), and the game lets them, at Planning's cost. Refusing the button until
  // something was sized decided for the team that refinement happens up front. Reported from playing
  // it: "they might decide not to do upfront refinement and refine an item in Sprint Planning."
  const nothingReady = ready.length === 0;
  const first = state.sprintNumber === 1 && state.velocity.length === 0; // the very first pass, before any Sprint
  const horizon = readyHorizon(state);
  // The counts, built once - they sit on step two's heading row during setup and on their own after
  // that, and they should be the same numbers either way.
  const figures = (
    <div className="flex flex-wrap items-center gap-2">
      <Figure value={items.length} label="in the Product Backlog" tone="quiet" />
      <Figure value={`${horizon}`} label={`Sprint${horizon === 1 ? '' : 's'} ready`} tone={horizon > 3 ? 'attention' : horizon >= START_READY ? 'done' : 'attention'}
        title="How far ahead the Product Backlog is prepared: Ready points against your capacity. Aim for a Sprint or two - past three is analysis you may never use." />
      {unsized > 0 && <Figure value={unsized} label="to size" tone={horizon >= START_READY ? 'quiet' : 'coach'} />}
      <Figure value={ready.length} label="Ready" tone="done" icon={CheckCircle2} />
    </div>
  );

  // The one move, with what it is done with inside the card that asks for it. Priya says what she
  // wants next (see `handover`), and the card under her line is the only thing on the screen asking.
  const step = first ? handover(state)?.key : undefined;
  const next = nextToRefine(state);
  const dodEditor = onSetDod && (
    <div className="space-y-2">
      <DodEditor dod={state.definitionOfDone} onSave={onSetDod} suggesting={!state.dodAgreed} brief />
      {!state.dodAgreed && onAgreeDod && (<>
        <Button size="sm" className="w-full" disabled={!state.definitionOfDone.length} onClick={() => { onAgreeDod(); setDodChanging(false); }}>
          <Check className="mr-1 h-4 w-4" /> We agree - this is our Definition of Done
        </Button>
        {/* The other way out, said as plainly as the first. Plenty of teams start without one; what
            they learn is what it costs, and that is a Sprint's worth of teaching. It is not a gate:
            a team that starts without one finds out at the Review what Done meant. */}
        <button type="button" onClick={() => { onSetDod([]); setDodChanging(false); }}
          className={cn(FOCUS, 'w-full rounded-md border border-dashed border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground')}>
          Start without one - and find out at the Review what Done meant
        </button>
      </>)}
    </div>
  );
  const ask = (
    <PriyaHandover state={state}>
      {step === 'refinement' ? (next
        // Which one, by name, and where: the card and the lit row say the same thing. The counts
        // that were here are the progress line above, said once.
        ? <p data-part="start-with" className="text-sm">Start with <strong>{next.name}</strong>, at the top. {next.category === 'epic' ? 'Split it up' : next.category === 'need' ? 'Decide what will meet it' : 'Size it'} and the rest follows in order.</p>
        : figures) : step === 'dod' ? dodEditor : null}
    </PriyaHandover>
  );
  // What is settled, one line each. The Sprint length was step one, asked before anything else on
  // the first screen with a sensible default already chosen. It is still agreed here - never at
  // Planning, where sizing the box to the work is backwards (see `setSprintDays`) - but as a line
  // that says what it is and can be changed, the way games start you on the defaults.
  const settled = (
    <ul data-part="settled" className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
      {onSetSprintDays && (
        <Settled part="settled-length" open={lengthOpen} onToggle={() => setLengthOpen((o) => !o)}
          body={<SprintLengthPicker days={state.sprintDays} options={SPRINT_LENGTH_OPTIONS} onSet={onSetSprintDays} at="setup" />}>
          Sprints are <strong className="text-foreground">{state.sprintDays} days</strong>
        </Settled>
      )}
      {horizon >= START_READY && (
        <Settled part="enough-to-start">
          <strong className="text-foreground">Enough to start:</strong> {ready.length} item{ready.length === 1 ? '' : 's'} Ready. The rest is refined during the Sprints.
        </Settled>
      )}
      {/* While the move is refining, what Done means is one press away rather than a step of its
          own. Priya asks for it once there is enough to start, but a team that wants the bar before
          it sizes against it can agree it first: "when we estimate size then we need to understand
          what Done looks like." */}
      {!state.dodAgreed && step === 'refinement' && onSetDod && (
        <Settled part="settled-dod" pending open={dodChanging} onToggle={() => setDodChanging((o) => !o)} body={dodEditor} change="Agree it now">
          Definition of Done: <strong className={TONE.attention.text}>nobody has agreed it yet</strong>
        </Settled>
      )}
      {state.dodAgreed && onSetDod && (
        <Settled part="settled-dod" open={dodChanging} onToggle={() => setDodChanging((o) => !o)} body={dodEditor}>
          {state.definitionOfDone.length
            ? <>Definition of Done agreed: <strong className="text-foreground">{state.definitionOfDone.length} item{state.definitionOfDone.length === 1 ? '' : 's'}</strong></>
            : <>Starting without a Definition of Done</>}
        </Settled>
      )}
    </ul>
  );

  return (
    // Two panes, the way the redesign frames it: what is in the Product Backlog on the left, and
    // the card that acts on it on the right. The card has two faces - the agreements before the
    // first Sprint, and the item you are refining once you pick one.
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
      {/* The first pass through the Product Backlog is not the same conversation as the ones after it: nothing
          has been built, nothing is ready, and there is no Sprint yet to be "in". Either way what
          refining costs comes out of the Sprint you are about to forecast, not one you are inside. */}
      {/* One question, like every other screen. What refinement is, who does it and how much is
          enough sits behind the "?" rather than as a paragraph over the work. */}
      <header className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary">{first ? 'Before the first Sprint' : 'Product Backlog Refinement'}</div>
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{first ? 'Ready to start the first Sprint?' : 'What is ready for the Sprints ahead?'}</h2>
          <ExplainButton cards={['refinement', 'product-backlog', 'pbi']} phase="refine" teachCard={teachCard} onMarkTaught={onMarkTaught} />
        </div>
        <p className="text-sm text-muted-foreground">{first ? 'Just enough ready at the top to start. The rest is refined during the Sprints.' : 'Split what is too big, size what is not sized, and order it by value.'}</p>
      </header>

      {/* This screen asks for two things in order, and nothing said so. Numbering them is the whole
          fix: agree the cadence, then get the top of the Product Backlog ready. */}
      {/* Agreed once and then in the way. It folds down to what was agreed, and opens again if the
          Scrum Team wants to change its mind before the first Sprint starts. */}
      {/* Green when it is settled, like the Definition of Done below - the three steps then read as
          a checklist you are working through rather than three panels that always look the same. */}
      {/* The Backlog on the left, and the card that acts on it on the right: what the Product
          Owner has ordered, beside the agreements that have to be made before any of it can be
          built. On a narrow screen they stack, list first - it is the thing being talked about. */}
      {/* What Priya is asking for, first on a narrow screen. In the right-hand column it would come
          after the whole Product Backlog, which is a long way down to find out what to do. */}
      {!wide && first && settled}
      {!wide && ask}
      {/* The bar between them drags, so whoever needs the room has it: the Product Backlog when
          splitting, the agreements when writing the Definition of Done. */}
      <SplitPanes id="refine" sizes={[60, 40]} min={[35, 25]} stackedClassName="grid gap-3"
        firstClassName="min-w-0" secondClassName="min-w-0 space-y-3"
        first={<>
        {/* One scrollbar for the screen, not one per column. The list used to scroll inside itself,
            which was fine when it was the whole screen and wrong beside a second column: the two
            columns then ended at different heights, and the agreements on the right needed the page
            scrolled while the list on the left did not. Reported from playing it. */}
        <div className="pr-1">
        <ProductBacklogSidebar state={state} mode="refine" compact laterFolds={first} focus={focus} onFocus={setFocus} onAddPbi={onAddPbi} onRefinePbi={onRefinePbi}
          onSetUseStories={onSetUseStories} onEstimate={onEstimate} onReorder={onReorder} onMoveZone={onMoveZone} onMoveBefore={onMoveBefore} onSplitEpic={onSplitEpic} onChooseSolution={onChooseSolution} onDeletePbi={onDeletePbi} onDuplicatePbi={onDuplicatePbi} />
        </div>
  
        </>}
        second={<>
        {/* What is settled first, as a line each, then the move: done so far, and what is next. */}
        {wide && first && settled}
        {wide && ask}
        {/* What the zoo cannot build on yet, and what it would cost to be able to. Not before the
            first Sprint: the zoo is worth nothing until somebody has visited it, so every button in
            it was dead, and a panel of dead buttons is a thing a newcomer has to read to learn it is
            not for them yet. It arrives when there is something to spend. */}
        {!first && <GroundPanel state={state} onOpenGround={onOpenGround} />}
        {!first && <div className="flex flex-wrap items-center justify-end gap-2">{figures}</div>}
        </>} />
      {benchItem && (
        <ItemTakeover state={state} item={benchItem} onEstimate={onEstimate} onRefinePbi={onRefinePbi}
          onSplitEpic={onSplitEpic} onChooseSolution={onChooseSolution} onSetUseStories={onSetUseStories}
          onClose={() => setFocus(null)} />
      )}

      <ActionBar hint={nothingReady ? 'Nothing is Ready yet. You can refine in Sprint Planning, out of its time.'
        : first && !state.dodAgreed
          ? state.definitionOfDone.length
            ? 'Nobody has agreed the Definition of Done. You can start anyway.'
            : 'No Definition of Done. Done will mean whatever anybody says it means.'
          : undefined}>
        <Button onClick={onPlan}>Go to Sprint Planning &rarr;</Button>
      </ActionBar>
    </div>
  );
}
