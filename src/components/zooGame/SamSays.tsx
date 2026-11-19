import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Person } from './board/Person';
import { personSize } from './board/personShape';
import { SEAT } from './seats';
import { SAM_SAYS, readQuiet, writeQuiet, type SamScreen } from './samLines';

// Sam, saying what to do on the screen you have just reached.
//
// Drawn the way the mock-up drew Priya: the page dimmed behind, the speaker's figure and name, and
// one large inked speech bubble, which is how the game's chat already marks something said aloud.
// It opens the first time you reach each screen in a visit, and not again until the next visit, or
// never once you tick "Don't show this again" for that screen. Every arrival was too many: the board
// is reached every day and the Daily Scrum every morning, and Sam said the same thing each time. A real dialog, so the focus goes into it, Escape closes it, and a screen reader hears it.

export function SamSays({ screen, name = 'Sam', onReading }: {
  screen: SamScreen | null;
  name?: string;
  /** Reading is not building: a solo game holds the day's clock while Sam is being read, as it does
   *  for the Learn drawer. */
  onReading?: (reading: boolean) => void;
}) {
  const [quiet, setQuiet] = useState<SamScreen[]>(() => readQuiet());
  // The screens Sam has been closed on this visit.
  const [closed, setClosed] = useState<SamScreen[]>([]);
  const [dontShow, setDontShow] = useState(false);
  // A different screen starts with the tick box clear. Done while rendering, which is React's way to
  // reset state when a prop changes.
  const [lastScreen, setLastScreen] = useState(screen);
  if (screen !== lastScreen) {
    setLastScreen(screen);
    setDontShow(false);
  }

  const open = !!screen && !quiet.includes(screen) && !closed.includes(screen);
  useEffect(() => {
    if (!open) return;
    onReading?.(true);
    return () => onReading?.(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => {
    if (!screen) return;
    if (dontShow) {
      const next = [...new Set([...quiet, screen])];
      setQuiet(next);
      writeQuiet(next);
    }
    setClosed((c) => [...c, screen]);
  };
  if (!screen) return null;
  const line = SAM_SAYS[screen];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[hsl(45_60%_97%/0.72)] backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content data-part="sam-says" data-screen={screen}
          className="zoo-theme fixed left-1/2 top-1/2 z-[61] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          // The Daily Scrum is a dialog of its own, and it takes the focus back when Sam opens over it -
          // which Radix reads as focus leaving Sam, and closed him before anybody could read him.
          // Closing is "Got it", Escape or a click outside, never focus moving.
          onFocusOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            // To "Got it", not the tick box: the one thing nearly everybody does next.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-part="sam-ok"]')?.focus();
          }}>
          <DialogPrimitive.Title className="pl-[4.25rem] text-sm font-bold uppercase tracking-wide" style={{ color: SEAT.scrumMaster.ink }}>
            {/* The seat's name, without the "(SM)" some seats carry: the role is said in full here. */}
            {name.replace(/\s*\([^)]*\)\s*$/, '')} (Scrum Master)
          </DialogPrimitive.Title>
          <div className="mt-1 flex items-end gap-3">
            <Person hex={SEAT.scrumMaster.hex} initials="SM" style={personSize(52)} className="mb-1 shrink-0" />
            <div className={cn('relative min-w-0 flex-1 rounded-3xl rounded-bl-md border-[3px] border-[hsl(var(--zoo-ink))] bg-white px-6 py-5',
              'shadow-[5px_5px_0_hsl(var(--zoo-ink))]')}>
              <DialogPrimitive.Description className="text-lg font-medium leading-snug text-[hsl(var(--zoo-ink))] sm:text-xl">
                {line.text}
              </DialogPrimitive.Description>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" data-part="sam-quiet" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--zoo-ink))]" />
                  Don&rsquo;t show this again
                </label>
                <Button data-part="sam-ok" onClick={close}>Got it</Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
