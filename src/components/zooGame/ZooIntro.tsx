import { useRef, useState } from 'react';
import { PRODUCT_GOAL } from './config';
import { Pencil, FolderOpen, Wand2 } from 'lucide-react';
import { BoardIcon, BOARD } from './board/BoardIcon';
import { TeachingCard } from './ScrumTeaching';
import { INTRO_COPY } from './scrumContent';
import { GoalShapes } from './GoalShapes';
import { useGoalCoach } from './useGoalCoach';
import type { GoalShape, GoalMeasure } from './types';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { GameLinks } from './GameLinks';
import { Button } from '@/components/ui/button';
import { ACTION_BAR, BAR_ACTION, FOCUS, TEXT, WIZARD } from './ui/tokens';
import { cn } from '@/lib/utils';

interface ZooIntroProps {
  productGoal: string;
  /** The Product Goal card, shown here because this is where the Product Goal is first met. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
  /** Back to the one page of Scrum, for a player who wants to read it again. */
  onBack?: () => void;
  /** ...and back to what the GAME is, which is a different question from what Scrum is. */
  onOrient?: () => void;
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
export function ZooIntro({ productGoal, goalShape, goalMeasures, teachCard, onMarkTaught, onBack, onOrient, onSetGoal, onSetGoalShape, onStart, onStartFromTheBrief, onOpenSaves, copy }: ZooIntroProps) {
  // Empty while it is still the game's own suggestion, so the placeholder is doing the suggesting.
  // The field used to hold the default AS TEXT, identical to the placeholder behind it - so somebody
  // typing their own Goal appended it to one they had not written, and the game ran on whichever
  // half survived. Reported from a play-through: "the Product Goal I wrote was thrown away... this
  // is the same pre-filled-field bug I found in the AI tools suite last week."
  const [goal, setGoal] = useState(productGoal === PRODUCT_GOAL ? '' : productGoal);
  // What the wand changed, cleared the moment they type again - the note was about the sentence
  // that was there.
  const [reworded, setReworded] = useState<string | null>(null);
  const [coached, setCoached] = useState(false);
  const { reword, isCoaching } = useGoalCoach();
  const goalBox = useRef<HTMLTextAreaElement>(null);
  /** Set once the box has been dragged, after which its height is theirs and not ours. */
  const dragged = useRef(false);
  const height = useRef(0);
  // ...and what is committed is what is in the field, or the suggestion if it was left alone.
  const chosen = () => goal.trim() || PRODUCT_GOAL;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 pb-28 pt-5">
        {/* Both ways back, as links rather than as panels. What Scrum is, and what this game is:
            they are two different questions and a player who wants one rarely wants the other. They
            stay up here because the Product Goal owns the top of this page - putting either of them
            in the body is the fault that moved the Goal up in the first place. */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Top left is the way out, the same as on every other screen of this game. The two
                links beside it go WITHIN the game; this one leaves it. */}
            <GameLinks variant="home" />
            {/* Out of the game, then about inside it. The rule is drawn rather than written. */}
            <span aria-hidden className="h-3 w-px bg-border" />
            {onOrient && (
              <button type="button" onClick={onOrient} data-part="to-orientation"
                className={cn(FOCUS, "text-[11px] text-muted-foreground underline-offset-2 hover:underline")}>
                &larr; How the zoo works
              </button>
            )}
            {onBack && (
              <button type="button" onClick={onBack} className={cn(FOCUS, "text-[11px] text-muted-foreground underline-offset-2 hover:underline")}>
                Scrum on one page
              </button>
            )}
          </span>
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
            <BoardIcon name={BOARD.productGoal} className="h-5 w-5 shrink-0" />
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
            {/* A textarea rather than one line. A Product Goal is usually a sentence, but the
                shapes offered below it are not: an objective with key results runs to several
                lines, and on one line it scrolled out of sight while being typed - the player
                could not read the thing they were being asked to think hardest about.

                It grows to what is in it rather than scrolling, up to a point, and can be
                dragged taller after that. `items-start` so the pencil and the wand stay at the
                top as it grows, instead of drifting down beside the middle of the text. */}
            <span className="flex items-start gap-2 rounded-md border-2 border-primary/50 bg-background px-3 py-2 focus-within:border-primary">
              <Pencil className="mt-1 h-4 w-4 shrink-0 text-primary/70" />
              <textarea
                value={goal}
                rows={1}
                onChange={(e) => { setGoal(e.target.value); setReworded(null); }}
                ref={goalBox}
                onInput={(e) => {
                  // Height from content, so it is as tall as what has been written and no taller.
                  // Stops the moment it has been dragged: auto-sizing that overrides a deliberate
                  // drag snaps the box back on the next keystroke, which reads as a bug.
                  if (dragged.current) return;
                  const box = e.currentTarget;
                  box.style.height = 'auto';
                  box.style.height = `${Math.min(box.scrollHeight, 260)}px`;
                }}
                onMouseUp={(e) => {
                  // A drag is the only way the height changes without typing.
                  const box = e.currentTarget;
                  if (Math.abs(box.clientHeight - height.current) > 2) dragged.current = true;
                  height.current = box.clientHeight;
                }}
                placeholder={goalShape === 'epic' ? 'As a … I want … so that …'
                  : goalShape === 'okr' ? 'The objective: the future state you are aiming at'
                  : 'Open a zoo that visitors love and come back to'}
                aria-label="Product Goal"
                className="min-h-[1.75rem] w-full resize-y bg-transparent text-base font-medium leading-snug outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
              />
              {/* The same wand the Sprint Goal has, and deliberately only half of it. That one will
                  write a Sprint Goal from nothing, because by then there is a forecast to write it
                  from. Here there is nothing but the player, and a button that writes their Product
                  Goal for them does the one piece of thinking this screen exists for - so it waits
                  until they have had a go, and then rewords what they wrote. */}
              <Button type="button" size="sm" data-part="goal-wand"
                className={cn(WIZARD, 'h-7 shrink-0 gap-1 px-2.5 text-[11px] font-semibold')}
                disabled={!goal.trim() || isCoaching}
                onClick={async () => {
                  const out = await reword(goal, goalShape ?? 'outcome');
                  setGoal(out.goal);
                  setReworded(out.note);
                  setCoached(out.coached);
                  // The box may now hold several lines it did not before.
                  const box = goalBox.current;
                  if (box && !dragged.current) {
                    box.style.height = 'auto';
                    box.style.height = `${Math.min(box.scrollHeight, 260)}px`;
                  }
                }}
                title={goal.trim()
                  ? 'Puts what you wrote into the shape of a Product Goal, and says what it changed. Your words, the Goal’s shape.'
                  : 'Write a rough one first and I will shape it. The Product Goal is the Product Owner’s to decide.'}>
                <Wand2 className={cn('h-3.5 w-3.5', isCoaching && 'animate-spin')} /> {isCoaching ? 'Reading it' : 'Reword mine'}
              </Button>
            </span>
          </label>
          {/* What the rewording changed, and why. The point of the wand is not a better sentence
              handed over, but the reason theirs was not one yet. */}
          {reworded && (
            <p data-part="goal-reworded" className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs leading-snug">
              <span className="font-semibold">{coached ? 'Coached.' : 'Reworded.'}</span> {reworded}
              {!coached && (
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Tidied here rather than read by a coach - sign in for the coached version.
                </span>
              )}
            </p>
          )}
          {/* Where it actually is. This said "from the trophy in Artifacts, in the header", and
              there has been no trophy button since Learn replaced it - Artifacts is a section
              inside that drawer now. Swapping the Product Goal's trophy for the board's peaks only
              made a stale sentence impossible to follow rather than merely wrong: a line pointing
              at an icon that is not there sends somebody looking for it. */}
          <p className="text-[11px] text-muted-foreground">Edit it here, and again at any time under Artifacts, in the Learn drawer.</p>
          {onSetGoalShape && (
            <div className="mt-2">
              {/* `goal`, not `chosen()`. chosen() falls back to the shipped Product Goal, so with
                  the field above empty this box arrived pre-filled with it - and for a plain
                  outcome the shipped goal IS the worked example, so "For example" and "Your
                  Product Goal" showed the same sentence and a newcomer appeared to have written
                  something they had not. Found by playing it as somebody arriving cold. */}
              <GoalShapes goal={goal} shape={goalShape} measures={goalMeasures}
                onSet={(shape, text, ms) => { setGoal(text); onSetGoalShape(shape, text, ms); }} />
            </div>
          )}
        </section>

        {/* ...and then whatever the game is teaching. Reading material, under the thing to do
            rather than over it.

            The Sprint loop used to sit here too, and it is on the screen before this one - shown
            there against WHEN each step happens, which is more than a list of five. The same five
            lines on two screens in a row is the same thing said twice, and this is the screen that
            asks you to write something. */}
        {teachCard && onMarkTaught && (
          <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
            <TeachingCard id={teachCard} onDismiss={onMarkTaught} />
          </div>
        )}


        {/* Floating, like every other primary action in the game. */}
        <div className={ACTION_BAR}>
          {onOpenSaves ? (
            // Grey text on a white pill is not a button anyone finds. Bordered, in the foreground
            // colour, with the icon that says what it does.
            <button type="button" onClick={onOpenSaves}
              className={cn(FOCUS, BAR_ACTION, "flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted")}>
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Resume a saved game
            </button>
          ) : <span />}
          {/* The Product Goal is the commitment of the Product Backlog, and every Sprint aims at
              it. Starting with none is not a state the game should let a Product Owner into - it
              arrives written, so this only ever catches somebody who cleared it. */}
          {/* The two ways in, kept together as one group so a phone stacks the bar rather than
              splitting this pair across two rows of it. */}
          <span className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {/* One line for the pair, not a hint beside a button that reads like another hint.
                "Write a Product Goal first." sat next to a greyed button labelled "Write the
                Product Backlog first", and the two were different kinds of thing wearing the same
                clothes: one an instruction, one a route. A newcomer read them as contradictory
                instructions. */}
            <span className="text-[11px] text-muted-foreground">
              {!goal.trim()
                ? 'Write a Product Goal above to begin, either way.'
                : 'Sprint 1 arrives planned. Or write the Product Backlog yourself first.'}
            </span>
            {/* The other way in, kept quiet. Sprint 1 arrives planned, which is how a Sprint arrives
                on somebody's first day - but a group that wants to write the Product Backlog and
                plan the Sprint themselves is doing the exercise the long way round on purpose, and
                that is a trainer's call rather than a thing to take away. */}
            {onStartFromTheBrief && (
              <button type="button" onClick={() => { onSetGoal(chosen()); onStartFromTheBrief(); }}
                disabled={!goal.trim()} data-part="start-from-brief"
                title="Start with an empty Product Backlog and plan Sprint 1 yourself. The longer way round, on purpose."
                className={cn(FOCUS, BAR_ACTION, 'rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-40')}>
                Write the Product Backlog myself
              </button>
            )}
            <Button size="lg" className={cn(BAR_ACTION, 'rounded-full px-6')} disabled={!goal.trim()}
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
