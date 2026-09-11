import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ZooGameState } from './types';
import { FlyThrough } from './FlyThrough';
import { TurnControl } from './TurnControl';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));

// Every event, on half a screen of park.
//
// The events are takeovers: they fill the screen they are held on. What they are all about is the
// same thing - the zoo as it actually stands - so it takes the left half throughout, and what the
// event has to say sits beside it rather than under it. Reported from a live game: the picture on
// its own pushed everything said about it below the fold, on the widest screens of all.
//
// The picture is drawn at the height its column actually has. It used to be a fixed 470px, which
// is either too big or too small on every screen except the one it was measured on.

export function EventStage({ state, title, note, at, walk, children }: {
  state: ZooGameState;
  /** Offer the walk round what this Sprint delivered. The Review asks for it; the events held
   *  before a Sprint are looking at a zoo nothing has been delivered into yet. */
  walk?: boolean;
  /** Which step of the event is being shown. Moving between topics starts the reading at the top of
   *  it: an event that opens halfway down its own first list has already lost the room. */
  at?: string;
  /** What this event calls the picture. At the Review it is the Increment; before one it is just
   *  the zoo as it stands, which is the thing being planned against or looked back on. */
  title: string;
  note?: string;
  children: ReactNode;
}) {
  const [picture, setPicture] = useState({ w: 0, h: 470 });
  // Which side the room is looking from. The Review is where somebody is presenting the zoo to
  // stakeholders, and "can we see behind the enclosure?" is a question a room asks out loud.
  const [turn, setTurn] = useState(0);
  // How much of the event the picture takes. At a Review the picture IS the event - somebody is
  // presenting the zoo - so "bigger" gives it the whole width and the reading goes underneath it.
  // Reported from playing it: "given it is a review we should be able to increase the size of the
  // park increment image."
  const [big, setBig] = useState(false);
  const read = useRef<HTMLDivElement>(null);
  // Moving between topics starts the reading at the top of it. Whatever is doing the scrolling now
  // that the event is a page rather than a pane: the nearest ancestor that scrolls.
  useEffect(() => {
    for (let el = read.current?.parentElement; el; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 4 && getComputedStyle(el).overflowY !== 'visible') { el.scrollTop = 0; return; }
    }
  }, [at]);
  const frame = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    // Both dimensions, and no floor under the height. The floor was 240: in a short window the
    // picture insisted on more room than the panel had, so the zoo was drawn over the bottom of its
    // own card and everything beside it went below the fold. A picture takes the room it is given.
    const measure = () => setPicture({
      w: Math.max(120, Math.round(el.clientWidth - 24)),
      h: Math.max(120, Math.round(el.clientHeight - 34)),
    });
    new ResizeObserver(measure).observe(el);
    measure();
  }, []);

  return (
    <div className={cn('grid flex-1 items-start gap-3',
      !big && 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]')}>
      {/* The picture stays where it is while the reading goes past it. At the Review somebody is
          presenting the zoo, and the thing being presented should not scroll away from under the
          conversation about it. */}
      <section ref={frame} data-part="event-park"
        className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-[#8cc063]/25',
          big ? 'h-[min(82vh,52rem)]' : 'h-[min(62vh,34rem)] lg:sticky lg:top-0')}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
          <span className="flex items-center gap-2">
            {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
            {/* In the strip above the picture rather than over it: the walk's own controls have the
                corners, and a room watching a presentation does not need two things in one corner. */}
            <TurnControl turn={turn} onTurn={setTurn} />
            <button type="button" data-part="picture-size" onClick={() => setBig((b) => !b)}
              aria-label={big ? 'Show the zoo smaller' : 'Show the zoo bigger'}
              className={cn(FOCUS, 'inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1 text-[11px] font-semibold hover:bg-background')}>
              {big ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              {big ? 'Smaller' : 'Bigger'}
            </button>
          </span>
        </div>
        <Suspense fallback={<div className="mx-3 mb-2 flex-1 animate-pulse rounded-md bg-black/5" aria-label="Drawing the zoo" />}>
          {/* At the Review, "here is what we built" is the event. So the park walks the room round
              it, and the same walk is offered on the Increment tab - one component, one walk. */}
          {walk ? (
            <FlyThrough state={state} className="px-3 pb-2">
              {(camera) => <IsoZoo state={state} height={picture.h} width={picture.w} turn={turn} camera={camera} />}
            </FlyThrough>
          ) : (
            <IsoZoo state={state} height={picture.h} width={picture.w} turn={turn} className="px-3 pb-2" />
          )}
        </Suspense>
      </section>

      <div ref={read} data-part="event-read" className="space-y-3 pr-1">
        {children}
      </div>
    </div>
  );
}
