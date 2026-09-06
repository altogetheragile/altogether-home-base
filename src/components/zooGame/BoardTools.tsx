import { SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FOCUS, SURFACE } from './ui/tokens';
import { BurndownChip } from './Burndown';
import { ExplainButton } from './Explain';
import { NewHere } from './NewHere';
import { revealed } from './engine';
import type { ZooGameState } from './types';

// The game's tools, on the strip beside Learn.
//
// They used to sit on the board: a help button on one row, the burndown and the gear on another,
// above the columns. Two rows of chrome between the tab you just pressed and the work you came for,
// and a band of empty space where the play space should be. None of them is part of the board - the
// help explains the game, the burndown is a glance at the Sprint, the settings are set once - so
// they belong with the other things you reach for rather than in front of the thing you are doing.

/** The board's two set-once settings, tucked behind a gear so they don't sit in prime space:
 *  when the Daily Scrum is held, and whether days run on a timer (learn mode pauses the clock). */
function BoardSettings({ dailyScrumAt, learnMode, wipLimit, onSetScrumAt, onSetLearnMode, onSetWipLimit, onCancelSprint }: { dailyScrumAt: 'start' | 'end'; learnMode: boolean; wipLimit: number; onSetScrumAt: (at: 'start' | 'end') => void; onSetLearnMode: (on: boolean) => void; onSetWipLimit?: (n: number) => void; onCancelSprint?: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Board settings" aria-label="Board settings"
          className={cn(FOCUS, SURFACE.inset, 'p-1.5 text-muted-foreground hover:text-foreground')}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Board settings</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground" title="When the Developers hold their Daily Scrum - at the start of a day, planning the day ahead, or at its end">Daily Scrum</span>
            <button type="button" onClick={() => onSetScrumAt(dailyScrumAt === 'start' ? 'end' : 'start')}
              className={cn(FOCUS, "rounded-full border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/40")}>
              {dailyScrumAt === 'start' ? 'Day start' : 'Day end'}
            </button>
          </div>
          <div className="-mt-1 text-[11px] leading-snug text-muted-foreground/80">
            {dailyScrumAt === 'start'
              ? 'Held first thing, so the Developers plan the day ahead. Ending a day takes you into the next day\u2019s Scrum.'
              : 'Held as the day closes, looking back on it.'}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground" title="How many items the Developers will have under way at once">Work in progress limit</span>
            {onSetWipLimit ? (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => onSetWipLimit(n)}
                    className={cn(FOCUS, 'rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                      wipLimit === n ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                    {n === 0 ? 'Off' : n}
                  </button>
                ))}
              </div>
            ) : <span className="text-[11px] font-medium">{wipLimit || 'Off'}</span>}
          </div>
          <div className="-mt-1 text-[11px] leading-snug text-muted-foreground/80">
            {wipLimit > 0
              ? `The Developers start no more than ${wipLimit} at once, and swarm to finish rather than starting more. Fewer things in flight means things actually finish.`
              : 'No limit: anything can be started at any time. Watch how much ends the Sprint unfinished.'}
            {' '}A WIP limit is Lean thinking, not part of Scrum - it is the Developers' own agreement.
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Days</span>
            <button type="button" onClick={() => onSetLearnMode(!learnMode)}
              title={learnMode ? 'Switch to timed days (Sprint pressure)' : 'Switch to learn mode (pause the clock)'}
              className={cn(FOCUS, "rounded-full border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/40")}>
              {learnMode ? 'Learn mode (paused)' : 'Timed'}
            </button>
          </div>
          {onCancelSprint && (
            // Rare, and deliberately out of the way: it is not an exit from a Sprint that is going
            // badly, it is for a Sprint Goal that has stopped being worth pursuing.
            <div className="border-t border-border pt-2">
              <button type="button"
                onClick={() => { if (window.confirm('Cancel this Sprint?\n\nOnly the Product Owner can, and only when the Sprint Goal has become obsolete - not because the Sprint is going badly.\n\nWork that is Done is kept and can still be released. Everything unfinished goes back to the Product Backlog to be re-estimated. A new Sprint starts straight away.')) onCancelSprint(); }}
                className={cn(FOCUS, "text-[11px] font-medium text-destructive/80 underline-offset-2 transition-colors hover:text-destructive hover:underline")}>
                Cancel the Sprint
              </button>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">The Product Owner&rsquo;s call, and only when the Sprint Goal is obsolete.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Everything the strip carries for a Sprint: what is left to burn, what the game can explain, and
 *  the settings behind a gear. */
export function BoardTools({ state, teachCard, onMarkTaught, onSetScrumAt, onSetLearnMode, onSetWipLimit, onCancelSprint }: {
  state: ZooGameState;
  teachCard?: string | null;
  onMarkTaught?: (id: string) => void;
  onSetScrumAt: (at: 'start' | 'end') => void;
  onSetLearnMode: (on: boolean) => void;
  onSetWipLimit?: (n: number) => void;
  onCancelSprint?: () => void;
}) {
  // A burndown needs a Sprint behind it to mean anything, so it appears when the game reveals it.
  const fresh = state.sprintNumber === 2;
  return (
    <div data-part="board-controls" className="flex items-center gap-1.5">
      {revealed(state, 'burndown') && (
        <span className="hidden items-center gap-1 sm:flex">
          <BurndownChip state={state} onDark />
          {fresh && <NewHere title="A burndown">
            <p>How much of the forecast is left, day by day. It needed a Sprint behind it to be worth anything.</p>
            <p>It is a common practice, not part of Scrum - and it is for the Developers to see their own progress, not a report to anyone.</p>
          </NewHere>}
        </span>
      )}
      <ExplainButton cards={['sprint', 'sprint-backlog', 'daily-scrum']} phase="sprint" teachCard={teachCard} onMarkTaught={onMarkTaught} compact />
      <BoardSettings dailyScrumAt={state.dailyScrumAt} learnMode={state.learnMode} wipLimit={state.wipLimit}
        onSetScrumAt={onSetScrumAt} onSetLearnMode={onSetLearnMode} onSetWipLimit={onSetWipLimit} onCancelSprint={onCancelSprint} />
    </div>
  );
}
