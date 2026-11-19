import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Person } from './board/Person';
import { personSize } from './board/personShape';
import { SEAT } from './seats';
import { SAM_SAYS, readQuiet, writeQuiet, wasClosed, markClosed, type SamScreen } from './samLines';

// Sam, saying what to do on the screen you have just reached.
//
// Drawn the way the mock-up drew Priya: the page dimmed behind, the speaker's figure and name, and
// one large inked speech bubble, which is how the game's chat already marks something said aloud.
// It opens the first time you reach each screen in a visit, and not again until the next visit, or
// never once you tick "Don't show this again" for that screen. Every arrival was too many: the board
// is reached every day and the Daily Scrum every morning, and Sam said the same thing each time. A
// real dialog, so the focus goes into it, Escape closes it, and a screen reader hears it.
//
// Except at the Daily Scrum, which is a dialog of its own. Two modal dialogs each hide everything
// outside themselves from assistive technology, so with Sam opened over the Daily Scrum each hid the
// other and a screen reader was left with nothing at all - not "Got it", not the stand-up answers.
// The scrum-master playtest (sm7) spent 24 steps there with nothing it could press. So at the Daily
// Scrum Sam speaks inside its dialog (`SamInline`), and the page-level dialog stays out of it.

/** Whether Sam has something to say on this screen: not silenced for good, not closed this visit. */
function useSam(screen: SamScreen | null) {
  const [quiet, setQuiet] = useState<SamScreen[]>(() => readQuiet());
  const [, setClosedCount] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  // A different screen starts with the tick box clear. Done while rendering, which is React's way to
  // reset state when a prop changes.
  const [lastScreen, setLastScreen] = useState(screen);
  if (screen !== lastScreen) {
    setLastScreen(screen);
    setDontShow(false);
  }
  const open = !!screen && !quiet.includes(screen) && !wasClosed(screen);
  const close = () => {
    if (!screen) return;
    if (dontShow) {
      const next = [...new Set([...quiet, screen])];
      setQuiet(next);
      writeQuiet(next);
    }
    markClosed(screen);
    setClosedCount((n) => n + 1);
  };
  return { open, close, dontShow, setDontShow };
}

/** The figure, the bubble, the tick box and "Got it": the same wherever Sam speaks. */
function SamBubble({ screen, dontShow, setDontShow, close, big = true, Text = 'p' }: {
  screen: SamScreen; dontShow: boolean; setDontShow: (v: boolean) => void; close: () => void;
  big?: boolean; Text?: React.ElementType;
}) {
  return (
    <div className="mt-1 flex items-end gap-3">
      <Person hex={SEAT.scrumMaster.hex} initials="SM" style={personSize(big ? 52 : 40)} className="mb-1 shrink-0" />
      <div className={cn('relative min-w-0 flex-1 rounded-3xl rounded-bl-md border-[3px] border-[hsl(var(--zoo-ink))] bg-white',
        big ? 'px-6 py-5 shadow-[5px_5px_0_hsl(var(--zoo-ink))]' : 'px-4 py-3 shadow-[3px_3px_0_hsl(var(--zoo-ink))]')}>
        <Text className={cn('font-medium leading-snug text-[hsl(var(--zoo-ink))]', big ? 'text-lg sm:text-xl' : 'text-base')}>
          {SAM_SAYS[screen].text}
        </Text>
        <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-border', big ? 'mt-4 pt-3' : 'mt-3 pt-2')}>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input type="checkbox" data-part="sam-quiet" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--zoo-ink))]" />
            Don&rsquo;t show this again
          </label>
          <Button data-part="sam-ok" size={big ? 'default' : 'sm'} onClick={close}>Got it</Button>
        </div>
      </div>
    </div>
  );
}

const nameOf = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '');

export function SamSays({ screen, name = 'Sam', onReading }: {
  screen: SamScreen | null;
  name?: string;
  /** Reading is not building: a solo game holds the day's clock while Sam is being read, as it does
   *  for the Learn drawer. */
  onReading?: (reading: boolean) => void;
}) {
  // The Daily Scrum's line is said inside the Daily Scrum (above).
  const here = screen === 'daily-scrum' ? null : screen;
  const { open, close, dontShow, setDontShow } = useSam(here);
  useEffect(() => {
    if (!open) return;
    onReading?.(true);
    return () => onReading?.(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!here) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[hsl(45_60%_97%/0.72)] backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content data-part="sam-says" data-screen={here}
          className="zoo-theme fixed left-1/2 top-1/2 z-[61] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => {
            // To "Got it", not the tick box: the one thing nearly everybody does next.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-part="sam-ok"]')?.focus();
          }}>
          <DialogPrimitive.Title className="pl-[4.25rem] text-sm font-bold uppercase tracking-wide" style={{ color: SEAT.scrumMaster.ink }}>
            {/* The seat's name, without the "(SM)" some seats carry: the role is said in full here. */}
            {nameOf(name)} (Scrum Master)
          </DialogPrimitive.Title>
          <SamBubble screen={here} dontShow={dontShow} setDontShow={setDontShow} close={close} Text={DialogPrimitive.Description} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Sam inside a dialog that is already open - the Daily Scrum's - as part of it rather than over it.
 *  A labelled region at the top, read with the rest of the event, closed with "Got it". */
export function SamInline({ screen, name = 'Sam' }: { screen: SamScreen; name?: string }) {
  const { open, close, dontShow, setDontShow } = useSam(screen);
  if (!open) return null;
  return (
    <section data-part="sam-says" data-screen={screen} aria-label={`${nameOf(name)} (Scrum Master) says`}
      className="mb-3 rounded-xl bg-[hsl(45_60%_97%)] p-3">
      <p className="pl-[3.25rem] text-xs font-bold uppercase tracking-wide" style={{ color: SEAT.scrumMaster.ink }}>
        {nameOf(name)} (Scrum Master)
      </p>
      <SamBubble screen={screen} dontShow={dontShow} setDontShow={setDontShow} close={close} big={false} />
    </section>
  );
}
