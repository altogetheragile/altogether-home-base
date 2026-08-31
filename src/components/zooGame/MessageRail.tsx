import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Everything the game wants to say to you, in the margins rather than in the way.
//
// These all used to sit above the board and push the whole page down as each one arrived,
// which on a screen with wide empty margins was the wrong place for them: the thing you were
// reading moved while you were reading it.
//
// Two rails, split by who is talking, because they are not the same kind of message and
// answering them is not the same act:
//
//   left   things to read - a coach nudge, a refusal naming whose call something was, or
//          the Product Owner's account of what they changed in a refinement.
//   right  your team - what a seat just did and why. Running commentary: short, and it
//          keeps arriving, so it is kept apart from the things you stop and read.
//
// Below xl there are no margins to put them in, so they become a stack at the bottom.

export function MessageRail({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  return (
    <div className={cn(
      'pointer-events-none fixed z-40 flex flex-col gap-2',
      // Narrow: no margin to put them in, so they stack at the bottom.
      'bottom-2 left-2 right-2',
      // Wide: a rail in the empty margin. Only left/right utilities here, never the inset-x
      // shorthand - Tailwind orders utilities by kind rather than by the order they appear
      // in the class string, so inset-x-auto won the cascade and both rails landed left.
      // Capped and scrollable, so a rail holding a coach nudge, a refusal and a long
      // refinement note at once cannot run off the bottom of the screen.
      'max-h-[45vh] overflow-y-auto xl:max-h-[calc(100vh-11rem)]',
      'xl:bottom-auto xl:top-36 xl:w-72',
      side === 'left' ? 'xl:left-3 xl:right-auto' : 'xl:right-3 xl:left-auto',
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
