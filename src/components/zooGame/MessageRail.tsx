import { Children, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

// Everything the game wants to say to you, in one line at the foot of the screen.
//
// It has been three things and all three were wrong. Two rails in the margins, until the board
// filled the width and there were no margins. Then one stack in the corner - which on a Sprint with
// seats played by the game became four cards over the park, reported as "blocking out the park view
// and too much to follow".
//
// So: one line, the newest thing said, with a count of what came before it. It never covers the
// work, because it is a strip and not a stack. Open it to read the rest; it closes itself when you
// take the next thing off it. What a seat did is commentary - the decision log at the Retrospective
// is the record, and that is where a team inspects what happened.

export function MessageRail({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const newest = items[0];
  const rest = items.length - 1;
  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-2 z-40 flex justify-center sm:bottom-3">
      <div className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur">
        {open ? (
          <div className="max-h-[40vh] space-y-1.5 overflow-y-auto p-1.5">{items}</div>
        ) : (
          <div className="p-1.5">{newest}</div>
        )}
        {rest > 0 && (
          <button type="button" onClick={() => setOpen((o) => !o)}
            className={cn(FOCUS, 'flex w-full items-center justify-center gap-1 border-t border-border/60 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground')}>
            {open ? 'show less' : `and ${rest} more`}
          </button>
        )}
      </div>
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
