import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';
import { DOCK_PILL, DOCK_POSITION, NotesContext, type GameNote, type NotesCtx } from './notesDock';

// Everything the game says to you, in the same pill as the button that moves you on.
//
// It has been four things and the first three were wrong. Two rails in the margins, until the board
// filled the width and there were no margins. Then a stack in the corner, which on a Sprint with
// seats played by the game became four cards over the park. Then a strip of its own at the foot -
// which sat half off the bottom of the window, a second floating thing competing with the action
// bar for the same corner.
//
// So: one dock, bottom right, always. The primary action lives in it, and what the game has to say
// rides in the same pill beside that action. One floating thing on the screen, in one place, and
// nothing of the work is ever underneath a second one.

/** Holds what the game is saying, and knows whether an action bar is on screen to say it in.
 *
 *  When a screen has a primary action - almost all of them do - the notes ride in its pill. When one
 *  does not, this puts the same pill in the same corner with just the notes in it, so a note never
 *  moves depending on which screen you happen to be on. */
export function GameNotesProvider({ notes, children }: { notes: GameNote[]; children: ReactNode }) {
  const [bars, setBars] = useState(0);
  // Stable, deliberately: an action bar registers in an effect keyed on these, and a pair of
  // functions rebuilt on every render would tear the bar down and put it back up forever.
  const mount = useCallback(() => setBars((n) => n + 1), []);
  const unmount = useCallback(() => setBars((n) => n - 1), []);
  const value = useMemo<NotesCtx>(() => ({ notes, mount, unmount }), [notes, mount, unmount]);
  return (
    <NotesContext.Provider value={value}>
      {children}
      {bars === 0 && notes.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className={cn(DOCK_POSITION, 'pointer-events-none')}>
          <div className={DOCK_PILL}><NoteStrip notes={notes} /></div>
        </div>,
        document.body,
      )}
    </NotesContext.Provider>
  );
}

/** What the game is saying, in one line, with the rest a click away.
 *
 *  One line because it sits in the pill beside the button: the newest thing said, who said it, and a
 *  way to be rid of it. Anything longer than the line - the Product Owner's account of a refinement
 *  is several paragraphs - opens upwards over the corner it came from, and closes again. */
export function NoteStrip({ notes }: { notes: GameNote[] }) {
  const [open, setOpen] = useState(false);
  if (!notes.length) return null;
  const newest = notes[0];
  const rest = notes.length - 1;
  const dot = newest.tone === 'rule' ? 'bg-amber-500' : newest.tone === 'team' ? 'bg-primary' : 'bg-muted-foreground';
  return (
    <div className="relative flex min-w-0 items-center gap-2">
      <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-full', dot)} />
      <button type="button" onClick={() => setOpen((o) => !o)}
        title={typeof newest.body === 'string' ? newest.body : newest.title}
        className={cn(FOCUS, 'flex min-w-0 items-center gap-1.5 rounded-md text-left text-xs')}>
        <span className="shrink-0 font-semibold uppercase tracking-wide text-muted-foreground">{newest.title}</span>
        <span className="min-w-0 max-w-[42ch] truncate text-foreground">
          {typeof newest.body === 'string' ? newest.body : 'read it'}
        </span>
        <span className="shrink-0 text-[11px] font-medium text-muted-foreground underline">
          {open ? 'close' : rest > 0 ? `and ${rest} more` : 'open'}
        </span>
      </button>
      {newest.onDismiss && (
        <button type="button" onClick={() => { newest.onDismiss?.(); setOpen(false); }}
          className={cn(FOCUS, 'shrink-0 rounded-md px-1 text-[11px] font-medium text-muted-foreground underline hover:text-foreground')}>
          {newest.dismissLabel ?? 'dismiss'}
        </button>
      )}
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-3 max-h-[50vh] w-[min(92vw,30rem)] space-y-1.5 overflow-y-auto rounded-lg border border-border bg-background p-2 shadow-xl">
          {notes.map((n) => (
            <div key={n.id} className={cn('rounded-md border p-2.5 text-xs',
              n.tone === 'rule' ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/40'
                : n.tone === 'team' ? 'border-primary/40 bg-card' : 'border-border bg-card')}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{n.title}</div>
              <div className="leading-snug text-foreground">{n.body}</div>
              {n.onDismiss && (
                <button type="button" onClick={() => { n.onDismiss?.(); setOpen(false); }}
                  className="mt-1.5 text-[11px] text-muted-foreground underline hover:text-foreground">
                  {n.dismissLabel ?? 'dismiss'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
