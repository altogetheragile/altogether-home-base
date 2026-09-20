import { Suspense, lazy, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { exampleZoo, type ExampleLabel } from './exampleZoo';
import { ParkPlan } from './ParkPlan';
import { union } from './frameTheWork';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

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

/** The numeral on a numbered mark.
 *
 *  Dark, and a literal rather than a token, which is the one case where that is right: the mark's
 *  ground is the primary in BOTH themes, so its text has to be fixed too - a `text-foreground` here
 *  would be near-white on orange in dark mode and near-black on orange in light, from one colour
 *  that is supposed to mean one thing.
 *
 *  It was white on the orange: 2.85:1, measured, in both themes. Below the 4.5 that small bold text
 *  needs and below even the 3 that large text does. Dark takes it to about 7. */
const ON_THE_MARK = 'text-[#2a1405]';

/** How far in each picture is walked, beyond the shot the example framed for itself.
 *
 *  Stops rather than a slider: a press should always land somewhere worth looking at, and the two
 *  pictures should be able to agree about what "twice as close" means. */
const STEPS = [1, 1.5, 2, 3];

/** A zoom, in the shape the game's own park controls already use. */
function Closer({ at, onZoom }: { at: number; onZoom: (z: number) => void }) {
  const i = STEPS.indexOf(at);
  const step = (dir: -1 | 1) => onZoom(STEPS[Math.max(0, Math.min(STEPS.length - 1, (i < 0 ? 0 : i) + dir))]);
  const btn = 'flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:opacity-40';
  return (
    <div className="absolute right-2 top-2 z-20 flex items-center gap-1" data-part="example-zoom">
      {at !== 1 && (
        <button type="button" onClick={() => onZoom(1)} title="Back to the whole example"
          aria-label="Back to the whole example" className={cn(FOCUS, btn)}>
          <Maximize2 className="h-3 w-3" />
        </button>
      )}
      <button type="button" onClick={() => step(-1)} disabled={at <= STEPS[0]}
        title="Further out" aria-label="Further out" className={cn(FOCUS, btn)}>
        <Minus className="h-3 w-3" />
      </button>
      <button type="button" onClick={() => step(1)} disabled={at >= STEPS[STEPS.length - 1]}
        title="Closer" aria-label="Closer" className={cn(FOCUS, btn)}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

/** The corner the zoom sits in, as a share of the picture. A pin that lands inside it is moved
 *  straight down to the edge of it: still over its own thing, and visible. */
const CORNER = { x: 72, y: 21 };
/** How far a pin is kept from the edge of its picture, as a share of it. Half a pin is not a pin. */
const EDGE = 5;

interface Pin { n: number; x: number; y: number }

/** A drawing, with numbered pins on the things the key names.
 *
 *  Measured off whatever was drawn rather than worked out from the model, so a pin cannot land
 *  somewhere the thing is not: whatever the renderer did with its camera, its frame and the size of
 *  the box it was handed, the pin followed it there. Which is also why one component can do this
 *  for two different renderers without knowing anything about either. */
function Pinned({ title, note, labels, zoom, children }: {
  title: string; note: string; labels: ExampleLabel[]; children: ReactNode;
  /** Walking closer into this one picture. The pins follow, because they are measured off whatever
   *  was drawn rather than worked out from the model. */
  zoom?: { at: number; onZoom: (z: number) => void };
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
      // ...and out from under the zoom, which sits in the corner the game puts its park controls
      // in. Walk into the example far enough and the thing in the top right is behind the buttons:
      // the pin is still in the right place and you cannot see it, which is worse than either.
      //
      // ...and inside the picture at all. A pin marks the top of the VISIBLE part of its thing, so
      // a thing running off the top of a zoomed-in frame puts its pin exactly on the edge, where
      // the picture's own overflow cuts it in half.
      for (const pin of found) {
        if (pin.x > CORNER.x && pin.y < CORNER.y) pin.y = CORNER.y;
        pin.y = Math.max(EDGE, Math.min(100 - EDGE, pin.y));
        pin.x = Math.max(EDGE, Math.min(100 - EDGE, pin.x));
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
        {zoom && <Closer at={zoom.at} onZoom={zoom.onZoom} />}
        {pins.map((p) => (
          <span key={p.n} data-part={`pin-${p.n}`} aria-hidden
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className={cn(ON_THE_MARK, 'pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary px-1.5 text-[11px] font-bold leading-5 shadow')}>
            {p.n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LabelledPark({ className }: { className?: string }) {
  const { state, labels, camera, box } = exampleZoo();
  // One each, not one for both. Looking closer at the plan and looking closer at the Increment are
  // two different things somebody wants at two different moments.
  const [planAt, setPlanAt] = useState(1);
  const [isoAt, setIsoAt] = useState(1);
  // The plan is pointed at a BOX, so walking in shrinks the box about its own middle. The Increment
  // is pointed by a camera, so walking in multiplies its zoom. Same word, two mechanisms, because
  // the two drawings are aimed in two different ways.
  const closer = (b: typeof box, z: number) => {
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const w = (b.x1 - b.x0) / z / 2, h = (b.y1 - b.y0) / z / 2;
    return { x0: cx - w, y0: cy - h, x1: cx + w, y1: cy + h };
  };

  return (
    <figure className={cn('m-0 space-y-2', className)}>
      {/* Side by side where there is room, one above the other where there is not. Stacked it still
          says the thing: the same numbers, twice, on two drawings of one zoo. */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* No handlers, so nothing here can be dragged: it is the studio, shown, not lent out. */}
        <Pinned title="The plan" note="where the Developers build" labels={labels}
          zoom={{ at: planAt, onZoom: setPlanAt }}>
          <ParkPlan state={state} height={280} frame={closer(box, planAt)} still />
        </Pinned>
        <Pinned title="The Increment" note="what a visitor walks into" labels={labels}
          zoom={{ at: isoAt, onZoom: setIsoAt }}>
          <Suspense fallback={<div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">Drawing the zoo...</div>}>
            <IsoZoo state={state} height={280} camera={{ ...camera, zoom: camera.zoom * isoAt }} />
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
              <span className={cn(ON_THE_MARK, 'mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold')}>
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
