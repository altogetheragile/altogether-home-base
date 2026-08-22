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
  // It is as wide as what is in it and no wider. It used to be a fixed 64rem, which on a screen with
  // one button in it was most of a metre of empty white lying across the park - and the park is the
  // product, so the bar was covering the thing the game is about.
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
      <div className={cn('pointer-events-auto flex max-w-[94vw] items-center gap-4 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur', className)}>
        {left && <div className="flex min-w-0 items-center gap-2">{left}</div>}
        {hint && <span className="hidden min-w-0 truncate text-[11px] text-muted-foreground sm:block">{hint}</span>}
        <div className="flex shrink-0 items-center gap-2.5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
