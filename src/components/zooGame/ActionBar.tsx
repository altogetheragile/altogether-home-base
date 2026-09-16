import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { NoteStrip } from './GameNotes';
import { DOCK_PILL, DOCK_POSITION, useDockPresence, useGameNotes } from './notesDock';

/** How much room to leave at the foot of a pane so the dock never lies over the last card.
 *
 *  Measured rather than guessed: the pill is 58 tall and sits 16 up from the foot of the window, so
 *  74 is the least that clears it. It was 52, which is 22 short - close enough to look right on the
 *  one pane it was written for and wrong everywhere else. */
export const DOCKED_BAR_PX = 74;
export const DOCKED_BAR_H = `${DOCKED_BAR_PX}px`;

/** The same measure as a class, for panes that scroll rather than size themselves.
 *
 *  Every screen in the game ends in the dock, and the dock is fixed to the window: a scroll
 *  container with no room reserved at its foot ends flush against the window, and its last control
 *  sits under the pill. Found by measuring, not by looking - the Product Backlog wizard's fourth
 *  area was underneath it at a perfectly ordinary window size. Use this on any pane that renders an
 *  ActionBar; `withoutADock.test.tsx` fails if one does not. */
export const DOCK_GUTTER = 'pb-24';

/** The one primary action, in the one place it always is.
 *
 *  Every screen in the game ends in this bar: same shape, same corner, so "what do I press to go on"
 *  is never a question you have to answer twice. Anything secondary - going back, a hint about why
 *  the action is disabled, whatever the game has to say - rides in the same pill, quiet, on the left.
 *
 *  Bottom right, always. It has been centred over the window, and docked as the foot of whichever
 *  half of the screen the work was in - which meant the orange button was in a different place on
 *  every screen and you had to look for it. One corner. The notes come with it, because two floating
 *  things in one corner is the same problem with more of it.
 */
export function ActionBar({ left, hint, className, children }: {
  /** Secondary controls: Back, skip, resume. */
  left?: ReactNode;
  /** Why the primary action is not available yet, said beside it rather than in a tooltip. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  // Tell the dock there is a bar here, so the game's notes ride in this pill rather than in one of
  // their own beside it.
  useDockPresence();
  const { notes } = useGameNotes();

  const inner = (
    <>
      {left && <div className="flex min-w-0 items-center gap-2">{left}</div>}
      {/* What the game is saying comes first: it is news, and the hint is only ever an explanation
          of the button it sits next to. Neither pushes the button out of the corner. */}
      {notes.length > 0
        ? <NoteStrip notes={notes} />
        : hint && <span className="hidden min-w-0 max-w-[52ch] truncate text-[11px] text-muted-foreground sm:block">{hint}</span>}
      <div className="flex shrink-0 items-center gap-2.5">{children}</div>
    </>
  );

  // Pinned to the window, not stuck to a scroll box. `position: sticky` needs a scrolling ancestor
  // and something below it to scroll past; as the last child of a pane whose height it defines it
  // had neither, so the one button that moves the game on sat at the foot of a long page where you
  // could not see it. Portalled to the body so no filtered or clipping ancestor can trap it.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={cn(DOCK_POSITION, 'pointer-events-none')}>
      <div className={cn(DOCK_PILL, className)}>{inner}</div>
    </div>,
    document.body,
  );
}
