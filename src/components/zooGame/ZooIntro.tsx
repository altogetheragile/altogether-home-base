import { useState } from 'react';
import { PRODUCT_GOAL } from './config';
import { Pencil, FolderOpen, Trophy, Wand2 } from 'lucide-react';
import { TeachingCard } from './ScrumTeaching';
import { INTRO_COPY } from './scrumContent';
import { GoalShapes } from './GoalShapes';
import { rewordProductGoal } from './engine';
import type { GoalShape, GoalMeasure } from './types';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { Button } from '@/components/ui/button';
import { FOCUS, PADDING, SURFACE, TEXT, WIZARD } from './ui/tokens';
import { cn } from '@/lib/utils';

interface ZooIntroProps {
  productGoal: string;
  /** The Product Goal card, shown here because this is where the Product Goal is first met. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
  /** Back to the one page of Scrum, for a player who wants to read it again. */
  onBack?: () => void;
  onSetGoal: (goal: string) => void;
  /** Writing the Goal in one of the other shapes - optional, and none of them Scrum. */
  goalShape?: GoalShape;
  goalMeasures?: GoalMeasure[];
  onSetGoalShape?: (shape: GoalShape, goal: string, measures: GoalMeasure[]) => void;
  onStart: () => void;
  /** The long way round: write the Product Backlog from the brief, then plan the Sprint. */
  onStartFromTheBrief?: () => void;
  /** Signed-in players can resume a saved game. */
  onOpenSaves?: () => void;
  /** Editing the teaching copy, for an admin polishing it in place. */
  copy?: CopyEditorProps;
}

/** Landing screen, read top to bottom as it narrows: what this is, how a Sprint goes, what a Product
 *  Goal is, and then the Product Goal itself - which is the one thing the player writes before they
 *  start, so it is the last thing on the page and the most prominent. The player is the Product
 *  Owner here, and the Goal is theirs to shape. */
export function ZooIntro({ productGoal, goalShape, goalMeasures, teachCard, onMarkTaught, onBack, onSetGoal, onSetGoalShape, onStart, onStartFromTheBrief, onOpenSaves, copy }: ZooIntroProps) {
  // Empty while it is still the game's own suggestion, so the placeholder is doing the suggesting.
  // The field used to hold the default AS TEXT, identical to the placeholder behind it - so somebody
  // typing their own Goal appended it to one they had not written, and the game ran on whichever
  // half survived. Reported from a play-through: "the Product Goal I wrote was thrown away... this
  // is the same pre-filled-field bug I found in the AI tools suite last week."
  const [goal, setGoal] = useState(productGoal === PRODUCT_GOAL ? '' : productGoal);
  // What the wand changed, cleared the moment they type again - the note was about the sentence
  // that was there.
  const [reworded, setReworded] = useState<string | null>(null);
  // ...and what is committed is what is in the field, or the suggestion if it was left alone.
  const chosen = () => goal.trim() || PRODUCT_GOAL;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pb-28 pt-5">
        <div className="flex items-center justify-between gap-2">
          {onBack ? (
            <button type="button" onClick={onBack} className={cn(FOCUS, "text-[11px] text-muted-foreground underline-offset-2 hover:underline")}>
              &larr; Scrum on one page
            </button>
          ) : <span />}
          {copy && <CopyEditor phase="intro" {...copy} />}
        </div>

        {/* 1. What this is - said once, briefly, because the thing to DO is below it. */}
        <header className="space-y-1 text-center">
          <h1 className={TEXT.hero}>{INTRO_COPY.title}</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">{INTRO_COPY.strapline}</p>
        </header>

        {/* The Product Goal, FIRST. It is the one thing this page asks you to write, and it sat
            under an explanation of how a Sprint goes and a teaching card - so the thing to do was
            below the things to read, and on a short window it was off the bottom. Reported from
            playing it: "this should be at the top and expanded. The messages should be underneath.
            On top they push down the Product Goals dialog." */}
        <section className="space-y-1.5 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* The Product Goal's own mark. It is the thing every Sprint aims at, so it gets a
                symbol you can then recognise in the header rather than another target among targets. */}
            <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
            <h2 className="text-lg font-semibold">Your Product Goal</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
              Commitment of the Product Backlog
            </span>
          </div>
          <p className="text-sm leading-snug text-muted-foreground">
            You are the Product Owner, so this one is yours to write. Shape it into a single clear outcome -
            a park that [who] love, so that [outcome] - and every Sprint will aim at it.
          </p>
          <label className="block">
            <span className="sr-only">Product Goal</span>
            <span className="flex items-center gap-2 rounded-md border-2 border-primary/50 bg-background px-3 py-2 focus-within:border-primary">
              <Pencil className="h-4 w-4 shrink-0 text-primary/70" />
              <input
                value={goal}
                onChange={(e) => { setGoal(e.target.value); setReworded(null); }}
                placeholder="Open a zoo that visitors love and come back to"
                aria-label="Product Goal"
                className="w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
              />
              {/* The same wand the Sprint Goal has, and deliberately only half of it. That one will
                  write a Sprint Goal from nothing, because by then there is a forecast to write it
                  from. Here there is nothing but the player, and a button that writes their Product
                  Goal for them does the one piece of thinking this screen exists for - so it waits
                  until they have had a go, and then rewords what they wrote. */}
              <Button type="button" size="sm" data-part="goal-wand" disabled={!goal.trim()}
                className={cn(WIZARD, 'h-7 shrink-0 gap-1 px-2.5 text-[11px] font-semibold')}
                onClick={() => {
                  const out = rewordProductGoal(goal);
                  setGoal(out.goal);
                  setReworded(out.note);
                }}
                title={goal.trim()
                  ? 'Puts what you wrote into the shape of a Product Goal, and says what it changed. Your words, the Goal’s shape.'
                  : 'Write a rough one first and I will shape it. The Product Goal is the Product Owner’s to decide.'}>
                <Wand2 className="h-3.5 w-3.5" /> Reword mine
              </Button>
            </span>
          </label>
          {/* What the rewording changed, and why. The point of the wand is not a better sentence
              handed over, but the reason theirs was not one yet. */}
          {reworded && (
            <p data-part="goal-reworded" className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-snug">
              <span className="font-semibold">Reworded.</span> {reworded}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">Edit it here, and again at any time from the trophy in Artifacts, in the header.</p>
          {onSetGoalShape && (
            <div className="mt-2">
              <GoalShapes goal={chosen()} shape={goalShape} measures={goalMeasures}
                onSet={(shape, text, ms) => { setGoal(text); onSetGoalShape(shape, text, ms); }} />
            </div>
          )}
        </section>

        {/* ...and then what a Sprint is, and whatever the game is teaching. Reading material, under
            the thing to do rather than over it. */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <section className={cn(SURFACE.quiet, PADDING.default)}>
            <h2 className="mb-1 text-sm font-semibold">{INTRO_COPY.loopTitle}</h2>
            <ul className="space-y-0.5 text-sm leading-snug text-muted-foreground">
              {INTRO_COPY.loop.map((l) => (
                <li key={l.step}><strong className="text-foreground">{l.step}</strong> - {l.text}</li>
              ))}
            </ul>
          </section>
          {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
        </div>


        {/* Floating, like every other primary action in the game. */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
          {onOpenSaves ? (
            // Grey text on a white pill is not a button anyone finds. Bordered, in the foreground
            // colour, with the icon that says what it does.
            <button type="button" onClick={onOpenSaves}
              className={cn(FOCUS, "flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted")}>
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Resume a saved game
            </button>
          ) : <span />}
          {/* The Product Goal is the commitment of the Product Backlog, and every Sprint aims at
              it. Starting with none is not a state the game should let a Product Owner into - it
              arrives written, so this only ever catches somebody who cleared it. */}
          <span className="flex items-center gap-2">
            {!goal.trim() && (
              <span className="hidden text-[11px] text-muted-foreground sm:block">Write a Product Goal first.</span>
            )}
            {/* The other way in, kept quiet. Sprint 1 arrives planned, which is how a Sprint arrives
                on somebody's first day - but a group that wants to write the Product Backlog and
                plan the Sprint themselves is doing the exercise the long way round on purpose, and
                that is a trainer's call rather than a thing to take away. */}
            {onStartFromTheBrief && (
              <button type="button" onClick={() => { onSetGoal(chosen()); onStartFromTheBrief(); }}
                disabled={!goal.trim()} data-part="start-from-brief"
                className={cn(FOCUS, 'rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-40')}>
                Write the Product Backlog first
              </button>
            )}
            <Button size="lg" className="rounded-full px-6" disabled={!goal.trim()}
              title={goal.trim() ? 'Sprint 1 is already planned - the board is open and the clock runs when you are ready'
                : 'Write a Product Goal first - every Sprint aims at it.'}
              onClick={() => { onSetGoal(chosen()); onStart(); }}>
              Start building &rarr;
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
