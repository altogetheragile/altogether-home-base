import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/** How tall the docked bar is, so whatever it sits under can leave room for it. */
export const DOCKED_BAR_PX = 52;
export const DOCKED_BAR_H = `${DOCKED_BAR_PX}px`;

/** The one primary action, in the one place it always is.
 *
 *  Every screen in the game ends in this bar: same shape, same corner, so "what do I press to go on"
 *  is never a question you have to answer twice. Anything secondary - going back, a hint about why
 *  the action is disabled - sits on the left, quiet.
 *
 *  On a single-column screen it floats over the content. On the Sprint screen, which is two panes
 *  side by side, floating put it exactly on the seam: a pill lying half over the design bench and
 *  half over the car park, obscuring both and belonging to neither. There it docks instead, as the
 *  foot of the half it belongs to - the work is on the left, and ending the day is the work.
 */
export function ActionBar({ left, hint, className, docked = false, children }: {
  /** Secondary controls: Back, skip, resume. */
  left?: ReactNode;
  /** Why the primary action is not available yet, said beside it rather than in a tooltip. */
  hint?: ReactNode;
  className?: string;
  /** Sit as the foot of the nearest positioned pane rather than floating over the window. */
  docked?: boolean;
  children: ReactNode;
}) {
  const inner = (
    <>
      {left && <div className="flex min-w-0 items-center gap-2">{left}</div>}
      {hint && <span className="hidden min-w-0 truncate text-[11px] text-muted-foreground sm:block">{hint}</span>}
      <div className="flex shrink-0 items-center gap-2.5">{children}</div>
    </>
  );

  // Docked: no portal, because it is meant to be trapped by the pane - that is the point of it.
  if (docked) {
    return (
      <div className={cn('absolute inset-x-0 bottom-0 z-30 flex items-center justify-end gap-4 border-t border-border bg-background px-3', className)}
        style={{ height: DOCKED_BAR_H }}>
        {inner}
      </div>
    );
  }

  // Floating: pinned to the window, not stuck to a scroll box. `position: sticky` needs a scrolling
  // ancestor and something below it to scroll past; as the last child of a pane whose height it
  // defines it had neither, so the one button that moves the game on sat at the foot of a long page
  // where you could not see it. Portalled to the body so no filtered or clipping ancestor can trap
  // it. It is as wide as what is in it and no wider: a fixed 64rem was, on a screen with one button
  // in it, most of a metre of empty white lying across the park.
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <div className={cn('pointer-events-auto flex max-w-[94vw] items-center gap-4 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur', className)}>
        {inner}
      </div>
    </div>,
    document.body,
  );
}
