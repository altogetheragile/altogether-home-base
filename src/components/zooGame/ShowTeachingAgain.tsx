import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

// A way out of the game's memory.
//
// The teaching cards are shown once, and "once" now survives closing the tab: what this browser has
// read is kept and seeded back when a game begins. That is right for a learner and exactly wrong for
// the person who wrote it - a trainer opening the zoo in front of a class has played it themselves,
// so the cards they most want the room to see are precisely the ones the game has decided not to
// show. Asked for straight after the memory went in: "yes, add a start fresh control."
//
// Two things it deliberately is not:
//
// It is not a new game. "Start fresh" could mean throw the zoo away, and it does not: it forgets
// what the player has been TOLD, not what they have built. Resetting the park is the end-of-game
// reset, which already exists and already clears this too.
//
// It is not a mode. The switch this whole strand began by deleting was a standing setting, and the
// fault with it was that it hid the cards a player had NOT read. This is a one-press act with a
// visible effect, and afterwards there is nothing switched on anywhere.
//
// It appears only when there is something to forget, so a first-time player never meets it. That is
// most of the argument for putting it on the way-in screen rather than behind a menu: on the screen
// where it does nothing it is not there at all, and on the one visit where it matters it is the only
// new thing on the page.

export function ShowTeachingAgain({ read, onForget, className }: {
  /** How many cards this browser remembers reading. Nothing renders at zero. */
  read: number;
  onForget: () => void;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  // Said rather than silently vanishing. The control's own condition stops being true the moment it
  // is pressed, so without this the answer to "did that work?" is a button that disappeared, which
  // reads the same as a button that broke.
  if (done) {
    return (
      <span data-part="teaching-forgotten"
        className={cn('flex items-center gap-1.5 text-[11px] text-muted-foreground', className)}>
        <GraduationCap className="h-3.5 w-3.5 text-primary" />
        Every card will be shown again.
      </span>
    );
  }

  if (read < 1) return null;

  return (
    <button type="button" data-part="show-teaching-again"
      onClick={() => { onForget(); setDone(true); }}
      // What it will do, not what it is called. "Start fresh" is the request and a poor label: it
      // reads as "throw the zoo away", which is the one thing this does not do.
      title="Forget which teaching cards have been read, so they are all shown again"
      className={cn(FOCUS, 'flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground', className)}>
      <GraduationCap className="h-3.5 w-3.5" />
      {/* The count is the reason to press it. "Show the teaching again" on its own invites "was it
          hidden?"; "you have read 14" answers that before it is asked. */}
      Show the teaching again ({read} read)
    </button>
  );
}
