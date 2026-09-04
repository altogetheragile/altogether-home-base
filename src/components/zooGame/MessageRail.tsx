import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Everything the game wants to say to you, in one place, out of the way of the thing it is about.
//
// It used to be two rails in the empty margins beside the board - one for things to read, one for
// what your team just did. Then the board grew to fill the width, and there were no margins: a
// coach card landed on top of the day's event banner, which is two messages about the same moment
// covering each other up.
//
// So: one stack, in the corner, above the action bar. Each note already says who is talking - the
// coach, the rules, a seat - and with them in one column that is the only thing you need to tell
// them apart. Newest at the bottom, nearest the corner your eye is already in.

export function MessageRail({ children }: { children: ReactNode }) {
  return (
    <div className={cn(
      'pointer-events-none fixed bottom-20 right-2 z-40 flex w-[min(20rem,calc(100vw-1rem))] flex-col gap-2',
      // Capped and scrollable: a coach nudge, a refusal and a long refinement note at once cannot
      // run off the top of the screen.
      'max-h-[55vh] overflow-y-auto',
    )}>
      {children}
    </div>
  );
}

/** One thing said, with a way to make it go away. `tone` is who is talking, not how urgent
 *  it is - the refusals are not warnings, they are the teaching. */
export function RailNote({ title, tone = 'coach', onDismiss, dismissLabel = 'dismiss', children }: {
  title?: string; tone?: 'coach' | 'rule' | 'team'; onDismiss?: () => void;
  dismissLabel?: string; children: ReactNode;
}) {
  // All three are solid. The team tone used to be a five per cent wash of the accent, which was
  // a pleasant tint over a white page and unreadable over the park: the rail floats above the
  // board, and on the blueprint the notes turned into ghosts with the grid showing through the
  // words. A running commentary you cannot read is not a commentary.
  const skin = tone === 'rule'
    ? 'border-amber-300 bg-amber-50/95 dark:border-amber-700/60 dark:bg-amber-950/95'
    : tone === 'team'
      ? 'border-primary/40 bg-background/95 backdrop-blur'
      : 'border-border bg-background/95 backdrop-blur';
  return (
    <div className={cn('pointer-events-auto max-h-[42vh] overflow-y-auto rounded-lg border p-3 text-xs shadow-lg', skin)}>
      {title && <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>}
      <div className="leading-snug">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="mt-1.5 text-[11px] underline text-muted-foreground hover:text-foreground">
          {dismissLabel}
        </button>
      )}
    </div>
  );
}
