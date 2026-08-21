import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/** The one primary action, in the one place it always is.
 *
 *  Every screen in the game ends in this bar: floating over the content, same shape, same corner,
 *  so "what do I press to go on" is never a question you have to answer twice. Anything secondary -
 *  going back, a hint about why the action is disabled - sits on the left, quiet.
 */
export function ActionBar({ left, hint, className, children }: {
  /** Secondary controls: Back, skip, resume. */
  left?: ReactNode;
  /** Why the primary action is not available yet, said beside it rather than in a tooltip. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  // Pinned to the window, not stuck to a scroll box. `position: sticky` needs a scrolling ancestor
  // and something below it to scroll past; as the last child of a pane whose height it defines it
  // had neither, so the one button that moves the game on sat at the foot of a long page where you
  // could not see it. Portalled to the body so no filtered or clipping ancestor can trap it.
  return createPortal(
    <div className={cn('fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(64rem,94vw)] items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur', className)}>
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-2.5">
        {hint && <span className="hidden text-[11px] text-muted-foreground sm:inline">{hint}</span>}
        {children}
      </div>
    </div>,
    document.body,
  );
}
