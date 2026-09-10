import { Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ZooGameState } from './types';
import { FlyThrough } from './FlyThrough';
import { TurnControl } from './TurnControl';

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
  const [picture, setPicture] = useState(470);
  // Which side the room is looking from. The Review is where somebody is presenting the zoo to
  // stakeholders, and "can we see behind the enclosure?" is a question a room asks out loud.
  const [turn, setTurn] = useState(0);
  const read = useRef<HTMLDivElement>(null);
  useEffect(() => { if (read.current) read.current.scrollTop = 0; }, [at]);
  const frame = useCallback((el: HTMLDivElement | null) => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setPicture(Math.max(240, Math.round(el.clientHeight - 34)));
    new ResizeObserver(measure).observe(el);
    measure();
  }, []);

  return (
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:overflow-hidden">
      <section ref={frame} data-part="event-park" className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-[#8cc063]/25">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
          <span className="flex items-center gap-2">
            {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
            {/* In the strip above the picture rather than over it: the walk's own controls have the
                corners, and a room watching a presentation does not need two things in one corner. */}
            <TurnControl turn={turn} onTurn={setTurn} />
          </span>
        </div>
        <Suspense fallback={<div className="mx-3 mb-2 flex-1 animate-pulse rounded-md bg-black/5" aria-label="Drawing the zoo" />}>
          {/* At the Review, "here is what we built" is the event. So the park walks the room round
              it, and the same walk is offered on the Increment tab - one component, one walk. */}
          {walk ? (
            <FlyThrough state={state} className="px-3 pb-2">
              {(camera) => <IsoZoo state={state} height={picture} turn={turn} camera={camera} />}
            </FlyThrough>
          ) : (
            <IsoZoo state={state} height={picture} turn={turn} className="px-3 pb-2" />
          )}
        </Suspense>
      </section>

      <div ref={read} data-part="event-read" className="min-h-0 space-y-3 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
