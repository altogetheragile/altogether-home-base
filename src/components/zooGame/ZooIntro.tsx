import { useState } from 'react';
import { Target, Pencil } from 'lucide-react';
import { TeachingCard } from './ScrumTeaching';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { Button } from '@/components/ui/button';

interface ZooIntroProps {
  productGoal: string;
  /** The Product Goal card, shown here because this is where the Product Goal is first met. */
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
  /** Back to the one page of Scrum, for a player who wants to read it again. */
  onBack?: () => void;
  onSetGoal: (goal: string) => void;
  onStart: () => void;
  /** Signed-in players can resume a saved game. */
  onOpenSaves?: () => void;
  /** Editing the teaching copy, for an admin polishing it in place. */
  copy?: CopyEditorProps;
}

/** Landing screen, read top to bottom as it narrows: what this is, how a Sprint goes, what a Product
 *  Goal is, and then the Product Goal itself - which is the one thing the player writes before they
 *  start, so it is the last thing on the page and the most prominent. The player is the Product
 *  Owner here, and the Goal is theirs to shape. */
export function ZooIntro({ productGoal, teachCard, onMarkTaught, onBack, onSetGoal, onStart, onOpenSaves, copy }: ZooIntroProps) {
  const [goal, setGoal] = useState(productGoal);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          {onBack ? (
            <button type="button" onClick={onBack} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
              &larr; Scrum on one page
            </button>
          ) : <span />}
          {copy && <CopyEditor phase="intro" {...copy} />}
        </div>

        {/* 1. What this is - said once, briefly, because the thing to DO is below it. */}
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Build a Zoo</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Run a zoo in Sprints, and learn Scrum by doing it: forecast, build to your Definition of Done,
            open it to visitors, and adapt as they tell you what they value.
          </p>
        </header>

        {/* 2. How a Sprint goes, and what a Product Goal is - side by side, so the Goal itself stays
               above the fold. It is the one thing this page asks you to write. */}
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <section className="rounded-lg border border-border bg-muted/40 p-3">
            <h2 className="mb-1 text-sm font-semibold">Each Sprint</h2>
            <ul className="space-y-0.5 text-[13px] leading-snug text-muted-foreground">
              <li><strong className="text-foreground">Plan</strong> - forecast the exhibits and amenities you can finish.</li>
              <li><strong className="text-foreground">Build</strong> - deliver each to the Definition of Done.</li>
              <li><strong className="text-foreground">Open</strong> - release Done work to visitors whenever you like.</li>
              <li><strong className="text-foreground">Review</strong> - the visitors turn up and tell you what worked.</li>
              <li><strong className="text-foreground">Retro</strong> - pick one improvement, then plan the next Sprint.</li>
            </ul>
          </section>
          {teachCard && onMarkTaught && <TeachingCard id={teachCard} onDismiss={onMarkTaught} />}
        </div>

        {/* 4. The Product Goal itself: the one thing written here, so it gets the weight. */}
        <section className="space-y-1.5 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Target className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="text-lg font-semibold">Your Product Goal</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
              Commitment of the Product Backlog
            </span>
          </div>
          <p className="text-[13px] leading-snug text-muted-foreground">
            You are the Product Owner, so this one is yours to write. Shape it into a single clear outcome -
            a park that [who] love, so that [outcome] - and every Sprint will aim at it.
          </p>
          <label className="block">
            <span className="sr-only">Product Goal</span>
            <span className="flex items-center gap-2 rounded-md border-2 border-primary/50 bg-background px-3 py-2 focus-within:border-primary">
              <Pencil className="h-4 w-4 shrink-0 text-primary/70" />
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Open a zoo that visitors love and come back to"
                aria-label="Product Goal"
                className="w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
              />
            </span>
          </label>
          <p className="text-[11px] text-muted-foreground">Edit it here, and again at any time from the trophy in the header.</p>
        </section>

        {/* Floating, like every other primary action in the game. */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
          {onOpenSaves ? (
            <button type="button" onClick={onOpenSaves}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
              Resume a saved game
            </button>
          ) : <span />}
          <Button size="lg" className="rounded-full px-6" onClick={() => { onSetGoal(goal); onStart(); }}>
            Start building &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
