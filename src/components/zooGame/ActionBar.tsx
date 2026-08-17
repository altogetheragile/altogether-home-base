import type { ReactNode } from 'react';
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
  return (
    <div className={cn('sticky bottom-4 z-20 mt-2 flex items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur', className)}>
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-2.5">
        {hint && <span className="hidden text-[11px] text-muted-foreground sm:inline">{hint}</span>}
        {children}
      </div>
    </div>
  );
}
