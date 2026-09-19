import { Suspense, lazy, useLayoutEffect, useRef, useState } from 'react';
import { exampleZoo } from './exampleZoo';
import { union } from './frameTheWork';
import { cn } from '@/lib/utils';

const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));

// A zoo somebody built, with the parts named.
//
// Asked for after reading the orientation screen: "can we show an example of a built zoo using a
// labelled isometric view?" The screen described the park in words, which is a strange way to
// introduce the one thing the whole game is looking at.
//
// The picture is the REAL renderer over a state the engine really built, not a drawing of one. A
// second drawing of the park would drift from the first the week somebody changes a fence, and then
// the screen that teaches you what the game looks like would be the one screen that lies about it.
//
// The labels are numbered pins on the drawing and a numbered key beneath, rather than callouts with
// leader lines. Callouts have to be placed so they miss each other and miss the thing they point
// at, which is a solved problem on a poster and an unsolved one at 390px wide. A pin is always in
// the right place, and the key reads as a list on any width.

interface Pin { n: number; x: number; y: number }

export function LabelledPark({ className }: { className?: string }) {
  const { state, labels, camera } = exampleZoo();
  const box = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<Pin[]>([]);

  // Measured from the drawing rather than worked out from the model, so a pin cannot land somewhere
  // the thing is not: whatever the renderer did with the turn, the camera and the size of the box,
  // the pin followed it there.
  //
  // On a timer rather than an animation frame, and the same lesson as the zoom: the browser does not
  // run animation frames in a tab nobody is looking at, and the park is lazily loaded, so the first
  // few attempts find nothing at all. It stops as soon as two goes agree.
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
        // the whole run is a point out in the car park: the pin sat outside the picture, pointing
        // at the thing from off the edge of it. A pin marks the visible part of its thing.
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
      if (found.length < labels.length) return retry();
      // Pushed apart where they landed on each other. An animal lives INSIDE its habitat and the
      // toilets are next door to it, so three of these four are genuinely within a few pixels - and
      // three pins on the same spot name nothing. They keep their own x, so each one still points
      // at its own thing; only the height is borrowed.
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
    // against the wide shot, the camera then walked in, and four numbers were left standing in a
    // field. It is an animation, so it also does not start at all until somebody is looking at the
    // tab - which is exactly how this was found.
    const mo = new MutationObserver(again);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['viewBox'] });
    return () => { window.clearTimeout(timer); ro.disconnect(); mo.disconnect(); };
  }, [labels]);

  return (
    <figure className={cn('m-0 space-y-2', className)}>
      <div ref={box} data-part="labelled-park"
        className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
        <Suspense fallback={<div className="flex h-[260px] items-center justify-center text-xs text-muted-foreground sm:h-[320px]">Drawing the zoo...</div>}>
          <IsoZoo state={state} height={320} camera={camera} />
        </Suspense>
        {pins.map((p) => (
          <span key={p.n} data-part={`pin-${p.n}`} aria-hidden
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground shadow">
            {p.n}
          </span>
        ))}
      </div>
      {/* The key. Numbered because the picture is numbered - the numbers are doing a job here, which
          is the only reason to number anything. */}
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
