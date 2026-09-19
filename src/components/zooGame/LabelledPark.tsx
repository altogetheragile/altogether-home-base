import { Suspense, lazy, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { exampleZoo, type ExampleLabel } from './exampleZoo';
import { ParkPlan } from './ParkPlan';
import { union } from './frameTheWork';
import { cn } from '@/lib/utils';

const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));

// One zoo, drawn twice.
//
// Asked after the labelled example went in: "can we show an example of the studio park view and the
// isometric increment side by side on the orientation view?"
//
// It is the thing this screen most needed to say and had not said. A learner meets a top-down plan
// they build on and an isometric park they look at, and nothing anywhere told them those were the
// same zoo. Side by side with the same numbers on both, it is said in one glance and needs no
// sentence: this is where you work, that is what a visitor walks into, and 1 is the same enclosure
// in each.
//
// Both are the REAL renderers over a state the engine really built - a recording of somebody
// playing, replayed - so neither can drift from what the game does. The two drawings have disagreed
// about the same piece of state more than once, and this screen is where that would show.

interface Pin { n: number; x: number; y: number }

/** A drawing, with numbered pins on the things the key names.
 *
 *  Measured off whatever was drawn rather than worked out from the model, so a pin cannot land
 *  somewhere the thing is not: whatever the renderer did with its camera, its frame and the size of
 *  the box it was handed, the pin followed it there. Which is also why one component can do this
 *  for two different renderers without knowing anything about either. */
function Pinned({ title, note, labels, children }: {
  title: string; note: string; labels: ExampleLabel[]; children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let timer = 0;
    let tries = 0;
    let was = '';

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return retry();
      const found: Pin[] = [];
      labels.forEach((l, i) => {
        // Only the parts of it that are ON SCREEN. A path runs off to the way in, and the middle of
        // the whole run is a point out in the car park: the pin sat outside the picture, pointing at
        // the thing from off the edge of it. A pin marks the visible part of its thing.
        const parts = [...el.querySelectorAll(l.find)]
          .map((n) => n.getBoundingClientRect())
          .filter((r) => r.right > rect.left && r.left < rect.right && r.bottom > rect.top && r.top < rect.bottom)
          .map((r) => ({
            left: Math.max(r.left, rect.left), right: Math.min(r.right, rect.right),
            top: Math.max(r.top, rect.top), bottom: Math.min(r.bottom, rect.bottom),
          }));
        const at = union(parts);
        if (!at) return;
        found.push({
          n: i + 1,
          x: ((at.left + at.right) / 2 - rect.left) / rect.width * 100,
          // Above the thing rather than on it: a pin in the middle of a lion hides the lion.
          y: (at.top - rect.top) / rect.height * 100,
        });
      });
      // What it can find, rather than all of them. The two drawings do not show the same things: an
      // animal is drawn in one and implied by its habitat in the other, so waiting for a full set
      // would mean waiting forever in whichever view is short of one.
      if (!found.length) return retry();
      // Pushed apart where they landed on each other. An animal lives INSIDE its habitat, so two of
      // these are genuinely within a few pixels, and two pins on one spot name nothing. They keep
      // their own x, so each still points at its own thing; only the height is borrowed.
      found.sort((a, b) => a.y - b.y);
      for (let i = 1; i < found.length; i++) {
        const gap = found[i].y - found[i - 1].y;
        if (Math.abs(found[i].x - found[i - 1].x) < 9 && gap < 7) found[i].y = found[i - 1].y + 7;
      }
      const now = JSON.stringify(found.map((p) => [p.n, Math.round(p.x), Math.round(p.y)]));
      setPins(found);
      if (now === was) return;
      was = now;
      retry();
    };
    const retry = () => { if (tries++ < 40) timer = window.setTimeout(measure, 40); };
    const again = () => { tries = 0; was = ''; measure(); };

    measure();
    // ...again whenever the box changes size, because every pin is a percentage of it.
    const ro = new ResizeObserver(again);
    ro.observe(el);
    // ...and again when the picture itself moves under them. Walking up to the zoo is a change of
    // viewBox rather than a change of size, so nothing about the BOX changes: the pins were measured
    // against the wide shot, the camera then walked in, and the numbers were left standing in a
    // field. It is an animation, so it also does not start at all until somebody is looking at the
    // tab - which is exactly how this was found.
    const mo = new MutationObserver(again);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['viewBox'] });
    return () => { window.clearTimeout(timer); ro.disconnect(); mo.disconnect(); };
  }, [labels]);

  return (
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-[11px] text-muted-foreground">{note}</span>
      </div>
      <div ref={box} data-part="labelled-park"
        className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
        {children}
        {pins.map((p) => (
          <span key={p.n} data-part={`pin-${p.n}`} aria-hidden
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground shadow">
            {p.n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LabelledPark({ className }: { className?: string }) {
  const { state, labels, camera, box } = exampleZoo();

  return (
    <figure className={cn('m-0 space-y-2', className)}>
      {/* Side by side where there is room, one above the other where there is not. Stacked it still
          says the thing: the same numbers, twice, on two drawings of one zoo. */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* No handlers, so nothing here can be dragged: it is the studio, shown, not lent out. */}
        <Pinned title="The plan" note="where the Developers build" labels={labels}>
          <ParkPlan state={state} height={280} frame={box} still />
        </Pinned>
        <Pinned title="The Increment" note="what a visitor walks into" labels={labels}>
          <Suspense fallback={<div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">Drawing the zoo...</div>}>
            <IsoZoo state={state} height={280} camera={camera} />
          </Suspense>
        </Pinned>
      </div>
      {/* The key. Numbered because both pictures are numbered - the numbers are doing a job here,
          which is the only reason to number anything, and the job is saying that 1 in one drawing is
          1 in the other. */}
      <figcaption>
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {labels.map((l, i) => (
            <li key={l.id} className="flex gap-2 text-xs leading-snug">
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="font-semibold text-foreground">{l.title}</span>
                <span className="text-muted-foreground"> - {l.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
