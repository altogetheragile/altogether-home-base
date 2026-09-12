import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { standingOnPark, parkPositions, restingPlace, apronRing, APRON_WIDTH, quarterOf } from './parkModel';
import { zonePlots, plotOrder, plotFor, insidePlot, plotSize } from './parkZones';
import { themeFor } from './zoneTheme';
import { riverOutline, inWater, acrossTheWater } from './parkWater';
import { insidePark, CANVAS_W, PLAY_H, PROMENADE_Y, PROMENADE_H, FRONT_Y, parkOutline, outlinePath, edgeNoise, hedgePoints, HEDGE_STEP, HEDGE_R } from './parkLayout';

import { answerable, checkCriterion } from './parkChecks';
import { groupMembers, currentDesign, enclosureWater, enclosureFlora, isTank, tankWater } from './design';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

/** How much of the car park to show at the foot of the plan. Not ground you build on - it is there
 *  so the front of the park reads as the front of the park, and so a run drawn to meet the way in
 *  lands where the isometric view will draw it. */
const APRON_H = 60;
/** Countryside drawn round the plot, so the park's own boundary has something to be a boundary
 *  AGAINST. It is margin, not ground: nothing may be put there, and `worldAt` reads the pointer
 *  through the picture's box, so widening the box does not move anything standing on the park. */
const VERGE = 30;
/** The whole plot, countryside and car park included: where the camera starts and what "Whole zoo"
 *  comes back to. */
const WHOLE_PARK = { x: -VERGE, y: -VERGE, w: CANVAS_W + VERGE * 2, h: PLAY_H + APRON_H + VERGE };


// The park, seen from above, for building on.
//
// The isometric view is the payoff - it is the zoo as a visitor meets it, and it belongs at the
// Review and on the Increment tab. It is a poor drawing board: reported from playing it, "building
// on the park in an isometric view is impossible - I need to zoom in and it is awkward, moving an
// enclosure is really hard, seeing and moving animals is really hard."
//
// So building happens here instead. Straight down, one square metre is one square metre wherever it
// is on the screen, nothing is hidden behind anything else, and a thing is where you drop it. Not a
// blueprint: it is still the zoo, in its own colours, with its animals inside their fences.

/** Colours by what a thing is. Enough to read the park at a glance without a legend. */
const FILL: Record<string, { fill: string; stroke: string }> = {
  enclosure: { fill: '#d8c39a', stroke: '#8a6a3b' },
  amenity: { fill: '#cfd8e3', stroke: '#6b7c93' },
  flora: { fill: '#a8cf8f', stroke: '#5d8a4a' },
  path: { fill: '#e0d2b4', stroke: '#b7a37c' },
  exhibit: { fill: '#e8b76a', stroke: '#a97a2e' },
  default: { fill: '#cfe0c2', stroke: '#7f9a72' },
};

/** What colour a thing is drawn in. Scenery is not one colour: a river is water, a bridge is a
 *  deck, rocks are stone. Drawn as one flat green they all read as "some planting", which is why a
 *  river on the plan looked like a lawn and a bridge over it looked like nothing at all. */
function fillFor(item: { category: string; template?: string; design?: { parts?: Record<string, string> }; draftDesign?: { parts?: Record<string, string> } }) {
  if (item.category !== 'flora') return FILL[item.category] ?? FILL.default;
  const kind = item.draftDesign?.parts?.type ?? item.design?.parts?.type ?? item.template ?? 'tree';
  if (kind === 'river' || kind === 'pond') return { fill: '#7cc0e8', stroke: '#4a90b8' };
  if (kind === 'bridge') return { fill: '#c8965a', stroke: '#7a5230' };
  if (kind === 'rocks') return { fill: '#9aa1a8', stroke: '#6f757b' };
  if (kind === 'fountain') return { fill: '#bcd9e8', stroke: '#7a8f9b' };
  // The way in and the way from the car park to it. Drawn as planting, the first thing a visitor
  // meets was a green patch on a green park - the same fault the river and the bridge had.
  if (kind === 'entrance') return { fill: '#d9d3c7', stroke: '#e6842a' };
  if (kind === 'carpark') return { fill: '#9aa0a6', stroke: '#6f757b' };
  return FILL.flora;
}

export function ParkPlan({ state, height = 520, selected, onSelect, onPlaceItem, onSetSize, onTurn,
  placing, onPlace, tool = 'none', pathStyle, runFor, onAddConnector, onAskToCheck, onSetMemberSpot, onMoveInside, inside, frame, className }: {
  state: ZooGameState;
  height?: number;
  /** What is in hand: drawn with a ring, and the thing the palette is acting on. */
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Dragging something to a new spot on the park. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  /** Dragging a corner to change a habitat's footprint. */
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  /** Turn a thing a quarter. Both drawings and the visitors' routing already read `rot`; nothing
   *  had offered it since the object editor's Turn control was cut. */
  onTurn?: (id: string, rot: number) => void;
  /** Zoom to one habitat, to work on what is inside it. The same renderer and the same coordinates,
   *  closer in - not a window over the park. */
  inside?: string | null;
  /** Move one animal of a family about inside its habitat. */
  onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void;
  /** Move a pool or a plant about inside a habitat. */
  onMoveInside?: (id: string, kind: 'water' | 'flora', index: number, spot: { x: number; y: number }) => void;
  /** Something is being put down for the first time: it follows the cursor with a verdict on it. */
  placing?: { id: string; w: number; h: number } | null;
  /** Somewhere to point the camera - an area of the zoo, a habitat. A request, not a mode: the
   *  camera moves there and the player is free to go elsewhere from it. */
  frame?: { x0: number; y0: number; x1: number; y1: number } | null;
  onPlace?: (id: string, pos: { x: number; y: number }, drawn?: { w: number; h: number }, into?: string) => void;
  /** The park's own tool. A path is drawn point to point: click where it starts, click where it
   *  ends, and it runs between them. Nothing else on the park needs a tool. */
  tool?: 'none' | 'path';
  pathStyle?: { thickness: number; color: string };
  /** The pathway item the run being drawn belongs to. */
  runFor?: string;
  onAddConnector?: (c: ZooConnector) => void;
  /** Ask the Product Owner to look at something that meets all of its criteria. */
  onAskToCheck?: (id: string) => void;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number; ok: boolean; why?: string } | null>(null);
  // Where a run was started, while it is being drawn.
  const [runFrom, setRunFrom] = useState<{ x: number; y: number } | null>(null);
  const [runTo, setRunTo] = useState<{ x: number; y: number } | null>(null);

  const standing = standingOnPark(state);
  // The ground each area of the zoo owns. Everything that asks where a thing stands reads the
  // same plots, so the plan, the Increment and the visitors cannot disagree about the layout.
  const plots = zonePlots(state);
  const order = plotOrder(state);
  const auto = parkPositions(standing, plots);
  const boxes = standing.map((s) => ({
    item: s.item,
    animals: s.animals,
    underWay: s.underWay,
    size: s.size,
    at: restingPlace(s.item, s.size, auto),
  }))
    // Biggest first, so what sits ON something is drawn on top of it and can be picked up. A river
    // runs the width of the park and a bridge stands on the river: drawn in Backlog order the river
    // covered the bridge, so every press near it selected the river. Reported from playing it - "I
    // cannot move the bridge, it thinks it is a river".
    .sort((a, z) => (z.size.w * z.size.h) - (a.size.w * a.size.h));

  /** Whether a thing is water somebody could put a bridge across. */
  const overWater = (it: { category: string; template?: string; design?: { parts?: Record<string, string> }; draftDesign?: { parts?: Record<string, string> } }) => {
    const kind = it.draftDesign?.parts?.type ?? it.design?.parts?.type ?? it.template;
    return it.category === 'flora' && (kind === 'river' || kind === 'pond');
  };

  // ============= The camera =============
  //
  // One mechanism instead of a set of named levels. The park does not have a "zone screen" and a
  // "whole zoo screen": it has a box it is looking at, and everything that used to be a level is now
  // something that moves the box - framing an area, looking inside a habitat, or the player's own
  // wheel and drag. That is why it is here rather than in whatever is rendering the park: a level
  // you can be in or out of cannot show a path that runs from one area into the next, and every new
  // level would be another state for everything else to reason about.
  //
  // The box IS the viewBox, which is what keeps the pointer honest: `worldAt` reads the same box the
  // picture is drawn from, so a thing lands where it was dropped at any magnification.
  const whole = WHOLE_PARK;
  const [cam, setCam] = useState(whole);
  const camNow = useRef(cam);
  camNow.current = cam;
  const box = cam;

  /** The tightest the park can be looked at, and the widest. */
  const CLOSEST = 260;
  const held = (c: { x: number; y: number; w: number; h: number }) => {
    const w = Math.max(CLOSEST, Math.min(whole.w, c.w));
    const h = (w / c.w) * c.h;
    // Kept over the park, with a hand's breadth of slack so the edge of the plot can be worked on
    // comfortably. Panned further than that there is nothing to see and nothing to come back to.
    const slackX = w * 0.12, slackY = h * 0.12;
    return {
      w, h,
      x: Math.max(whole.x - slackX, Math.min(whole.x + whole.w - w + slackX, c.x)),
      y: Math.max(whole.y - slackY, Math.min(whole.y + whole.h - h + slackY, c.y)),
    };
  };

  // Framing something - an area, a habitat - is an ACTION rather than a mode: it moves the camera
  // there, and from there the player can zoom and pan wherever they like.
  const aim = frame ? `${frame.x0},${frame.y0},${frame.x1},${frame.y1}` : '';
  useEffect(() => {
    if (!frame) return;
    const pad = Math.max(30, (frame.x1 - frame.x0) * 0.06);
    const to = held({ x: frame.x0 - pad, y: frame.y0 - pad,
      w: frame.x1 - frame.x0 + pad * 2, h: frame.y1 - frame.y0 + pad * 2 });
    const from = camNow.current;
    // Moved rather than jumped: the picture changing under you without anything appearing to move is
    // the thing that makes a zoom disorienting.
    let raf = 0;
    // Timed against the frames themselves rather than against a clock read before them. Those are
    // not guaranteed to be the same clock, and when they are not the elapsed time comes out
    // negative - which reads as "before the start", and the camera flies off backwards.
    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const t = Math.max(0, Math.min(1, (now - t0) / 220));
      const e = t * t * (3 - 2 * t);
      setCam({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aim]);

  const panning = useRef(false);

  /** Closer in or further out, about a point that stays put under the pointer. */
  const zoomAbout = (at: { x: number; y: number } | null, by: number) => setCam((c) => {
    const w = Math.max(CLOSEST, Math.min(whole.w, c.w * by));
    const h = (w / c.w) * c.h;
    const p = at ?? { x: c.x + c.w / 2, y: c.y + c.h / 2 };
    const tx = (p.x - c.x) / c.w, ty = (p.y - c.y) / c.h;
    return held({ x: p.x - tx * w, y: p.y - ty * h, w, h });
  });

  const view = `${box.x} ${box.y} ${box.w} ${box.h}`;
  // Zoomed in, a label written in park units comes out enormous. Everything that is chrome rather
  // than park - names, pills, grips - is scaled by how much the picture is magnified, so it stays
  // the size it looks on the whole park.
  // How much the picture is magnified, so that anything which is chrome rather than park - names,
  // pills, grips - comes out the same size on the screen at every level.
  //
  // Written in park units, which is why the second number is here: a label sized for a park 820
  // across is half the size it should be on a park 1760 across, because the whole thing is drawn
  // into the same pane. So chrome is sized as a FRACTION of the park rather than in pixels somebody
  // measured once.
  const k = box.w / CANVAS_W;
  const ch = (px: number) => (px * CANVAS_W * k) / 820;

  /** Pointer to park coordinates, whatever the picture is covering. */
  const worldAt = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    // The picture is FITTED to the room it is given, so it may be letterboxed inside its own box -
    // and a pointer read as though the viewBox filled the element lands somewhere else entirely.
    // One scale, both axes, and the bars split evenly: the same arithmetic the browser just did.
    const scale = Math.min(r.width / box.w, r.height / box.h);
    const padX = (r.width - box.w * scale) / 2;
    const padY = (r.height - box.h * scale) / 2;
    return {
      x: box.x + (e.clientX - r.left - padX) / scale,
      y: box.y + (e.clientY - r.top - padY) / scale,
    };
  };

  /** Can this go here, and if not, why not. The same question the ghost answers on the isometric. */
  const verdict = (id: string, box: { w: number; h: number }, w: { x: number; y: number }) => {
    // A bridge snaps to the water. Which part of the river to cross is a real decision and stays
    // yours; how squarely it sits on the water is not a decision anybody makes well by eye, and a
    // bridge that misses by six pixels is a bridge nobody can cross for a reason nobody can see.
    const crossing = (state.backlog.find((it) => it.id === id)?.template ?? '') === 'bridge';
    const at = insidePark(box, crossing ? acrossTheWater(box, w) : w);
    // Snapped is not strayed: a bridge lands on the water rather than under the pointer, on purpose.
    const aim = crossing ? acrossTheWater(box, w) : w;
    const off = Math.abs(at.x - aim.x) > 1 || Math.abs(at.y - aim.y) > 1;
    // Everything belongs to an area of the zoo, and every area owns its ground. Refused rather than
    // slid quietly into place: where the Savanna is is worth learning, and a thing that lands
    // somewhere other than where you let go of it teaches nothing.
    const zone = state.backlog.find((it) => it.id === id)?.zone;
    const plot = plotFor(state, zone);
    const strayed = !off && plot && !insidePlot(plot, box, at);
    // Nothing is built in the river. The exception is the one thing whose whole job is to cross it.
    const wet = !off && !crossing && inWater(box, at);
    // Water is the exception, and it is the whole point of a bridge: a bridge over a river has to
    // overlap it or it is not a bridge. Reported from playing it - "I can't place it over the
    // river". Everything else keeps its ground to itself.
    const over = boxes.find((b) => b.item.id !== id && !overWater(b.item)
      && Math.abs(at.x - b.at.x) < (b.size.w + box.w) / 2 && Math.abs(at.y - b.at.y) < (b.size.h + box.h) / 2);
    return { x: at.x, y: at.y, w: box.w, h: box.h, ok: !off && !strayed && !wet && !over,
      why: off ? 'off the park' : wet ? 'in the river' : strayed ? `outside the ${zone} area`
        : over ? `on top of ${over.item.name}` : undefined };
  };

  /** Drag something that is already standing: it follows the pointer and lands where you let go. */
  const dragFrom = (e: ReactPointerEvent, b: typeof boxes[number]) => {
    e.preventDefault();
    e.stopPropagation();
    const start = worldAt(e);
    if (!start) return;
    const grabX = start.x - b.at.x, grabY = start.y - b.at.y;
    const from = { x: e.clientX, y: e.clientY };
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - from.x, ev.clientY - from.y) > 5) moved = true;
      if (!moved || !onPlaceItem) return;
      const p = worldAt(ev);
      if (p) setGhost(verdict(b.item.id, b.size, { x: p.x - grabX, y: p.y - grabY }));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setGhost(null);
      // A press that did not move is a press: it picks the thing up and opens it, the way its card
      // does. Opening on the way DOWN swallowed every drag - the editor came up over the park
      // halfway through moving something.
      if (!moved) { onSelect?.(b.item.id); return; }
      if (!onPlaceItem) return;
      const p = worldAt(ev);
      if (!p) return;
      const v = verdict(b.item.id, b.size, { x: p.x - grabX, y: p.y - grabY });
      if (v.ok) onPlaceItem(b.item.id, { x: v.x, y: v.y });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag a pool or a plant about inside its habitat, in the habitat's own coordinates. */
  const movePiece = (e: ReactPointerEvent, b: typeof boxes[number], kind: 'water' | 'flora', index: number) => {
    if (!onMoveInside) return;
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (!p) return;
      onMoveInside(b.item.id, kind, index, {
        x: Math.max(0.05, Math.min(0.95, (p.x - (b.at.x - b.size.w / 2)) / b.size.w)),
        y: Math.max(0.06, Math.min(0.94, (p.y - (b.at.y - b.size.h / 2)) / b.size.h)),
      });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag one animal about inside its habitat. Held in the habitat's own coordinates, so it means
   *  the same thing here, in the isometric view and wherever the park is drawn next. */
  const moveAnimal = (e: ReactPointerEvent, id: string, member: number, pen: { x: number; y: number; w: number; h: number }) => {
    if (!onSetMemberSpot) return;
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (!p) return;
      onSetMemberSpot(id, member, {
        x: Math.max(0.08, Math.min(0.92, (p.x - pen.x) / pen.w)),
        y: Math.max(0.1, Math.min(0.9, (p.y - pen.y) / pen.h)),
      });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag a corner: the fence follows, and the footprint is what you drew. */
  const sizeFrom = (e: ReactPointerEvent, b: typeof boxes[number]) => {
    if (!onSetSize) return;
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (!p) return;
      const w = Math.max(40, Math.abs(p.x - b.at.x) * 2), h = Math.max(30, Math.abs(p.y - b.at.y) * 2);
      setGhost({ x: b.at.x, y: b.at.y, w, h, ok: true });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const p = worldAt(ev);
      setGhost(null);
      if (!p) return;
      onSetSize(b.item.id, { w: Math.max(40, Math.abs(p.x - b.at.x) * 2), h: Math.max(30, Math.abs(p.y - b.at.y) * 2) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // The wheel zooms about the pointer. Listened for directly rather than through React so it can be
  // taken non-passively: left passive, the browser scrolls the page behind the park instead.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAbout(worldAt(e), e.deltaY > 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const stepper = 'flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 text-sm font-bold shadow-sm hover:bg-background';

  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* The camera's own controls. The park is bigger than the pane it is drawn in, so moving
          about it is an ordinary thing to want rather than a mode to be in. */}
      <div data-part="park-camera" className="absolute right-2 top-2 z-20 flex items-center gap-1">
        <button type="button" aria-label="Zoom out" className={cn(FOCUS, stepper)}
          onClick={() => zoomAbout(null, 1.3)}>&minus;</button>
        <button type="button" aria-label="Zoom in" className={cn(FOCUS, stepper)}
          onClick={() => zoomAbout(null, 1 / 1.3)}>+</button>
        <button type="button" data-part="park-fit" aria-label="See the whole zoo"
          className={cn(FOCUS, 'rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm hover:bg-background')}
          onClick={() => setCam(whole)}>Whole zoo</button>
      </div>
      {/* No selecting. Dragging across the park was painting the browser's own selection highlight
          over the labels and the boxes - pale blue rectangles that pile up as you drag and stay
          there. Reported from playing it: "blue squares appear as trails." */}
      <svg ref={svgRef} data-part="park-plan" className="select-none" viewBox={view} role="img"
        aria-label={`The zoo from above: ${boxes.length} things standing on it`}
        // Fitted to the room it is given rather than sized off its width, so the whole picture - the
        // promenade and the way in included - is always above the day's dock in the corner. Sized by
        // width, the park grew taller than its pane and the last band of it sat under the button:
        // "the navigation button obscures the park and cannot draw a path properly".
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: '100%', maxHeight: height, touchAction: 'none',
          cursor: tool === 'path' ? 'crosshair' : placing ? 'copy' : 'default' }}
        onPointerMove={(e) => {
          const w = worldAt(e);
          if (!w) return;
          if (placing) { setGhost(verdict(placing.id, placing, w)); return; }
          if (tool === 'path' && runFrom) setRunTo(w);
        }}
        onPointerLeave={() => { setGhost(null); setRunTo(null); }}
        onPointerDown={(e) => {
          const w = worldAt(e);
          if (!w) return;
          // Dragging the ground moves the picture. Started on every press and only TAKEN as a pan
          // once the pointer has travelled: a press that does not move is still the click it was, so
          // placing, path-drawing and clearing the selection all behave exactly as they did.
          if (!placing && tool !== 'path') {
            const r = svgRef.current?.getBoundingClientRect();
            const from = { x: e.clientX, y: e.clientY }, start = camNow.current;
            const scale = r ? Math.min(r.width / start.w, r.height / start.h) : 1;
            let travelled = false;
            const move = (ev: PointerEvent) => {
              const dx = ev.clientX - from.x, dy = ev.clientY - from.y;
              if (!travelled && Math.hypot(dx, dy) < 5) return;
              travelled = true;
              panning.current = true;
              setCam(held({ ...start, x: start.x - dx / scale, y: start.y - dy / scale }));
            };
            const up = () => {
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', up);
              // Cleared after this press has been handled, so the click that ENDS a pan does not
              // also clear the selection.
              setTimeout(() => { panning.current = false; }, 0);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          }
          // The pen wins while it is out. A thing waiting to be put down ALSO wants this press, and
          // it used to take it: somebody with the pen in their hand pressed the park where the path
          // should start, the habitat was set down there instead, and the run they were drawing was
          // never begun. Reported from playing it as "how can I get the Product Owner to review?" -
          // the criterion could not be met because the first press never drew anything.
          if (placing && tool !== 'path') {
            // An animal goes IN somewhere: dropped on a habitat that is standing, it moves in.
            const item = state.backlog.find((it) => it.id === placing.id);
            if (item?.category === 'exhibit') {
              const home = boxes.find((b) => b.item.category === 'enclosure'
                && Math.abs(w.x - b.at.x) < b.size.w / 2 && Math.abs(w.y - b.at.y) < b.size.h / 2);
              if (home && onPlace) { onPlace(placing.id, { x: w.x, y: w.y }, undefined, home.item.id); setGhost(null); }
              return;
            }
            const v = verdict(placing.id, placing, w);
            if (v.ok && onPlace) { onPlace(placing.id, { x: v.x, y: v.y }); setGhost(null); }
            return;
          }
          if (tool === 'path') {
            // Two clicks, and the run is drawn between them. A drag on an isometric grid is where
            // path drawing went wrong; two points is a thing you can aim at.
            //
            // A run stops at the front of the park: the tarmac beyond it is the car park, which is
            // where visitors arrive, not somewhere the Developers lay paths.
            w.y = Math.min(w.y, FRONT_Y);
            if (!runFrom) { setRunFrom(w); setRunTo(w); return; }
            onAddConnector?.({
              id: `run-${runFrom.x.toFixed(0)}-${w.x.toFixed(0)}-${w.y.toFixed(0)}`,
              // Whose run it is. Without this a drawn path belonged to no Backlog item: the pathway
              // you were building never counted the run you had just drawn for it, so it could not
              // be built, accepted or finished - "I added the main paths and cannot move it to Done".
              itemId: runFor,
              a: { x: runFrom.x, y: runFrom.y }, b: { x: w.x, y: w.y }, bends: [],
              thickness: pathStyle?.thickness ?? 14, color: pathStyle?.color ?? '#c9a86a',
            });
            // The pen stays down. Laying a path is laying SEVERAL runs - round a habitat, along
            // the front, up to the kiosk - and putting the tool away after every one meant pressing
            // "Draw a run" between each of them. Reported from playing it: "drawing paths is clunky.
            // Can the draw tool stay active so multiple paths can be drawn at once?" It stops when
            // you say so, on the same chip that started it.
            setRunFrom(null); setRunTo(null);
            return;
          }
          if (!panning.current) onSelect?.(null);
        }}>
        {/* The ground, the promenade along the front, and a grid you can judge a footprint against. */}
        {/* Grass, then the promenade along the front, then the car park BEYOND the park's edge -
            the same three bands, in the same places, as the isometric view draws them. The car park
            used to be painted over the bottom 90 of the play area here, so a run drawn onto what
            looked like tarmac was, in the model, still out on the grass. */}
        {/* Countryside first, then the park's own ground on top of it. The park is a plot of land
            with a boundary that wanders, not a green rectangle: the shape comes from `parkOutline`,
            which the isometric view draws from as well. */}
        <rect x={-VERGE} y={-VERGE} width={CANVAS_W + VERGE * 2} height={PLAY_H + APRON_H + VERGE} fill="#bcc98e" />
        <path d={outlinePath(parkOutline())} fill="#8cc063" stroke="#5c7a3e" strokeWidth={2} opacity={0.98} />
        <clipPath id="park-edge"><path d={outlinePath(parkOutline())} /></clipPath>
        {/* The treeline along the boundary, from the same points, and open along the front where
            the way in is - so the plan and the Increment agree about where the park stops. Seen
            from straight above, a tree is its canopy. */}
        <g>
          {hedgePoints(HEDGE_STEP).map(({ x, y, n }) => {
            const r = HEDGE_R * (1 + 0.6 * edgeNoise(n));
            return (
              <g key={`tree-${n}`}>
                <circle cx={x} cy={y} r={r} fill="#3f6a31" />
                <circle cx={x - r * 0.22} cy={y - r * 0.22} r={r * 0.6} fill="#68a04c" />
              </g>
            );
          })}
        </g>
        <rect x={0} y={PROMENADE_Y} width={CANVAS_W} height={PROMENADE_H} fill="#e7d6a8" />
        <rect x={0} y={PLAY_H} width={CANVAS_W} height={APRON_H} fill="#9aa0a6" />
        <g opacity={0.16} stroke="#2f4f2f" strokeWidth={1} clipPath="url(#park-edge)">
          {Array.from({ length: Math.floor(CANVAS_W / 40) }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 40} y1={0} x2={(i + 1) * 40} y2={PLAY_H} />
          ))}
          {Array.from({ length: Math.floor(PROMENADE_Y / 40) }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={(i + 1) * 40} x2={CANVAS_W} y2={(i + 1) * 40} />
          ))}
        </g>

        {/* The river, which was here before the zoo was. Drawn under the areas and everything in
            them, because it is the ground rather than something standing on it. */}
        <path data-part="river" d={outlinePath(riverOutline())} fill="#6db6d8" stroke="#4f9cbf" strokeWidth={2} />

        {/* The ground each area of the zoo owns, marked out from the day the brief was agreed.
            An area nobody has opened yet is drawn as ground with a name on it - which is the rest
            of the Product Backlog, to scale, in the place it is going to be. */}
        {[...plots.values()].map((p) => {
          const theme = themeFor(p.zone, order.indexOf(p.zone));
          const open = boxes.some((b) => b.item.zone === p.zone);
          const size = plotSize(p);
          return (
            <g key={p.zone} data-part="zone-plot" data-zone={p.zone} data-open={open ? 'yes' : 'no'}>
              <rect x={p.x0} y={p.y0} width={size.w} height={size.h} rx={16}
                fill={theme.plot} opacity={open ? 0.3 : 0.14}
                stroke={theme.plotBorder} strokeWidth={2} strokeDasharray={open ? undefined : '11 9'} />
              <text x={p.x0 + 14} y={p.y0 + 24} fontSize={ch(15)} fontWeight={700} fill="#3f4a2f"
                opacity={open ? 0.85 : 0.6}>{p.zone}</text>
            </g>
          );
        })}

        {/* The apron round each habitat, which every habitat has whether anybody drew it or not:
            a pen you cannot walk round is an object in a field, not an exhibit. The pathway items
            are the runs BETWEEN things, and they join onto these. */}
        {boxes.filter((b) => b.item.category === 'enclosure').map((b) => {
          const ring = apronRing(b.at, b.size);
          return (
            <polyline key={`apron-${b.item.id}`} data-part="apron" points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none" stroke="#c9a86a" strokeWidth={APRON_WIDTH} strokeLinejoin="round" opacity={0.9} />
          );
        })}

        {/* Paths, drawn as the runs they are. */}
        {(state.connectors ?? []).map((c) => (
          <line key={c.id} data-conn={c.id} x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y}
            stroke={c.color ?? '#c9a86a'} strokeWidth={Math.max(6, c.thickness ?? 14)} strokeLinecap="round" />
        ))}

        {/* Everything standing on the park, straight down, nothing behind anything else. */}
        {boxes.map((b) => {
          const c = fillFor(b.item);
          const on = selected === b.item.id;
          const x = b.at.x - b.size.w / 2, y = b.at.y - b.size.h / 2;
          return (
            <g key={b.item.id} data-plan-item={b.item.id}
              // While something is being put down, the things already standing keep out of the way:
              // the click that places a bridge over a river used to select the river first and open
              // it instead of the thing you had just placed.
              // With the pen out, the park is a drawing surface and nothing on it is a handle. Every
              // standing thing stopped the press reaching the park, so a run could not START or END
              // on a habitat - which is exactly where the way in has to reach. Reported from playing
              // it: pressing Draw, clicking twice, and nothing being drawn.
              onPointerDown={placing || tool === 'path' ? undefined : (e) => dragFrom(e, b)}
              style={{ cursor: onPlaceItem ? 'grab' : 'pointer' }}>
              <rect x={x} y={y} width={b.size.w} height={b.size.h} rx={6}
                // Landscape is cut to the land it lies on. A river is as long as the park is wide,
                // and the park's edge wanders, so an uncut one hangs over the countryside at both
                // ends - water with no bank.
                clipPath={b.item.category === 'flora' ? 'url(#park-edge)' : undefined}
                fill={b.item.category === 'amenity' ? (currentDesign(b.item).colors?.roof ?? c.fill)
                  : b.item.category === 'enclosure' && isTank(currentDesign(b.item), state.backlog.filter((it) => it.enclosureId === b.item.id), b.item)
                    ? tankWater(currentDesign(b.item))
                    : c.fill}
                fillOpacity={b.underWay ? 0.45 : 1}
                stroke={on ? '#e6842a' : c.stroke} strokeWidth={on ? 4 : 2}
                strokeDasharray={b.underWay ? '8 6' : undefined} />
              {/* A building, in the colours somebody is choosing for it.
                  It was a flat blue-grey box, the same one for a cafe and a lavatory block, so every
                  colour you picked landed somewhere you could not see until the Increment tab.
                  Reported from playing it: "when creating a building we do not see the colours being
                  applied". From straight above a building IS its roof, with the walls showing at the
                  edge - so that is what this draws, with the door and the sign board on the front. */}
              {b.item.category === 'amenity' && (() => {
                const d = currentDesign(b.item);
                const walls = d.colors?.walls ?? '#e6ddcf';
                const sign = d.colors?.sign;
                const door = d.colors?.door ?? '#7a5230';
                // Which wall is the front. The same walk round the corners the isometric view does,
                // from the same `quarterOf`, so the two drawings cannot disagree about where the
                // door is - and turning it on the plan shows you which way it will face.
                const side = ((quarterOf(b.item) % 4) + 4) % 4;
                const corner = [{ x, y: y + b.size.h }, { x: x + b.size.w, y: y + b.size.h },
                  { x: x + b.size.w, y }, { x, y }];
                const a = corner[side], z = corner[(side + 1) % 4];
                const at = (t: number) => ({ x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t });
                // Inward, so the door and the board sit ON the building rather than beside it.
                const inx = (z.y - a.y) === 0 ? 0 : (a.x === x ? 1 : -1);
                const iny = (z.x - a.x) === 0 ? 0 : (a.y === y ? 1 : -1);
                const d0 = at(0.38), d1 = at(0.62);
                const s0 = at(0.18), s1 = at(0.82);
                return (
                  <>
                    {/* The walls, seen as the band round the roof. */}
                    <rect x={x + 3} y={y + 3} width={Math.max(0, b.size.w - 6)} height={Math.max(0, b.size.h - 6)}
                      rx={4} fill="none" stroke={walls} strokeWidth={5} strokeOpacity={b.underWay ? 0.5 : 0.95} />
                    {/* The name board over the front, where there is one. */}
                    {sign && d.parts?.sign !== 'off' && (
                      <line x1={s0.x + inx * 4} y1={s0.y + iny * 4} x2={s1.x + inx * 4} y2={s1.y + iny * 4}
                        stroke={sign} strokeWidth={4} strokeLinecap="round" />
                    )}
                    {/* The way in. "When turning it would be useful to know where the front door is
                        so we can point at a path." */}
                    <line data-part="front-door" x1={d0.x} y1={d0.y} x2={d1.x} y2={d1.y}
                      stroke={door} strokeWidth={6} strokeLinecap="round" />
                  </>
                );
              })()}
              {/* What is inside the fence: the pool, the rocks, the planting. Drawn here because
                  this is where a habitat is built now - there is no window over the park with a
                  picture of the pen in it - and each piece can be taken hold of and moved. */}
              {b.item.category === 'enclosure' && (() => {
                const d = currentDesign(b.item);
                return (
                  <>
                    {enclosureWater(d).map((wf, i) => (
                      <ellipse key={`w-${b.item.id}-${i}`} data-piece={`water-${i}`} data-of={b.item.id}
                        cx={x + b.size.w * (wf.x + wf.w / 2)} cy={y + b.size.h * (wf.y + wf.h / 2)}
                        rx={(b.size.w * wf.w) / 2} ry={(b.size.h * wf.h) / 2} fill="#7cc0e8"
                        style={{ cursor: onMoveInside ? 'grab' : 'default' }}
                        onPointerDown={onMoveInside && tool !== 'path' ? (e) => movePiece(e, b, 'water', i) : undefined} />
                    ))}
                    {enclosureFlora(d).map((f, i) => (
                      <g key={`f-${b.item.id}-${i}`} data-piece={`flora-${i}`} data-of={b.item.id}
                        style={{ cursor: onMoveInside ? 'grab' : 'default' }}
                        onPointerDown={onMoveInside && tool !== 'path' ? (e) => movePiece(e, b, 'flora', i) : undefined}>
                        {/rock|shelter/i.test(f.type)
                          ? <rect x={x + b.size.w * f.x - 12} y={y + b.size.h * f.y - 9} width={24} height={18} rx={4}
                              fill={f.foliage ?? '#8a5a2b'} />
                          : <circle cx={x + b.size.w * f.x} cy={y + b.size.h * f.y} r={10} fill={f.foliage ?? '#3f8f43'} />}
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* The animals inside their fence, big enough to see and to take hold of. */}
              {b.animals.map((a, i) => {
                const members = Math.max(1, groupMembers(a.design?.group).length);
                // Twelve, not six. A family is six at most, so this only ever bit a shoal - and a
                // shoal of forty drawn as six dots is a picture that disagrees with the card beside
                // it about how many there are.
                const shown = Math.min(members, 12);
                return Array.from({ length: shown }, (_, k) => {
                  const cols = Math.ceil(Math.sqrt(shown));
                  // Where somebody put this one, or the tidy grid it starts on. A pride is not a
                  // blob: the lioness by the water and the cubs under the tree is a thing you
                  // arrange, and it was drawn on a grid that ignored the arranging entirely.
                  const own = a.spots?.[k];
                  const gx = own ? x + b.size.w * own.x : x + b.size.w * ((k % cols) + 1) / (cols + 1);
                  const gy = own ? y + b.size.h * own.y
                    : y + b.size.h * (Math.floor(k / cols) + 1) / (Math.ceil(shown / cols) + 1);
                  return (
                    <circle key={`${a.id}-${i}-${k}`} data-animal={`${a.id}-${k}`} cx={gx} cy={gy} r={9}
                      // The colour it is being GIVEN, not the colour it was last delivered in. This
                      // read `a.design` while the Increment reads the draft as well, so the whole
                      // time an animal was in hand the two views disagreed about what colour it was:
                      // you chose Black, the Increment went black, and the plan stayed tawny.
                      fill={currentDesign(a).colors?.coat ?? '#c8761f'} stroke="#7a4712" strokeWidth={2}
                      style={{ cursor: onSetMemberSpot ? 'grab' : 'default' }}
                      onPointerDown={onSetMemberSpot && tool !== 'path' ? (e) => moveAnimal(e, a.id, k, { x, y, w: b.size.w, h: b.size.h }) : undefined} />
                  );
                });
              })}
              {/* The name, and only out on the whole park: inside a habitat the picture IS the
                  habitat, and the inspector's pill already says which. */}
              {!inside && (
                <text x={b.at.x} y={y - 6} textAnchor="middle" fontSize={ch(13)} fontWeight={700} fill="#20351f">
                  {b.item.name}{b.underWay ? ' · built, not Done' : ''}
                </text>
              )}
              {/* One pill per object that is built and not Done: how far off it is, and the one
                  thing that would finish it. Green when there is nothing left to say. */}
              {b.underWay && !inside && (() => {
                const criteria = b.item.acceptance.filter(Boolean);
                const verdicts = criteria.map((c) => ({ c, v: checkCriterion(state, b.item, c) }));
                // Ready means every criterion the park can answer is answered. The rest are
                // judgement - "can I walk right round it?" is somebody's eyes, not a measurement -
                // and waiting for the park to tick those was a dead end: they never went green, so
                // a finished habitat could never be offered for acceptance at all.
                const facts = verdicts.filter((x) => answerable(x.c));
                const met = facts.filter((x) => x.v?.met).length;
                const next = facts.find((x) => !x.v?.met);
                const ready = criteria.length > 0 && facts.every((x) => x.v?.met);
                const judged = criteria.length - facts.length;
                const po = state.team.productOwner.name.replace(/\s*\(PO\)$/i, '');
                const text = ready
                  ? `${met} of ${facts.length} checked · ${judged ? `${po} judges the rest` : `ready for ${po}`}`
                  : `${met} of ${facts.length} checked · ${next?.v?.evidence ?? 'still being built'}`;
                return (
                  <g data-part="built-pill" data-ready={ready ? 'yes' : 'no'}
                    // Not while the pen is out: this pill sits directly under the habitat, which is
                    // where a run from the way in has to finish, and it is 180px of press that never
                    // reached the park.
                    onPointerDown={tool === 'path' ? undefined : (e) => { e.stopPropagation(); if (ready) onAskToCheck?.(b.item.id); else onSelect?.(b.item.id); }}
                    style={{ cursor: tool === 'path' ? 'crosshair' : 'pointer', pointerEvents: tool === 'path' ? 'none' : undefined }}>
                    <rect x={b.at.x - Math.max(90, text.length * 3.4)} y={y + b.size.h + 6}
                      width={Math.max(180, text.length * 6.8)} height={24} rx={12}
                      fill={ready ? '#dcfce7' : '#fff7ed'} stroke={ready ? '#16a34a' : '#f59e0b'} strokeWidth={2} />
                    <text x={b.at.x} y={y + b.size.h + 22} textAnchor="middle" fontSize={ch(12)} fontWeight={600}
                      fill={ready ? '#166534' : '#9a3412'}>{text}</text>
                  </g>
                );
              })()}
              {/* A quarter turn, where the way a thing faces matters: a kiosk facing the path
                  instead of away from it, a habitat that fits better lying the other way. Here
                  rather than in the takeover, because which way it faces is placement, and
                  placement is the park's. */}
              {on && onTurn && b.item.category !== 'path' && (
                <g data-part="turn-grip" style={{ cursor: 'pointer' }}
                  onPointerDown={(e) => { e.stopPropagation(); onTurn(b.item.id, ((b.item.rot ?? 0) + 90) % 360); }}>
                  <title>Turn it a quarter</title>
                  <circle cx={x + b.size.w - ch(9)} cy={y + ch(9)} r={ch(11)} fill="#fff" stroke="#e6842a" strokeWidth={ch(3)} />
                  <path d="M -5 -1 A 5 5 0 1 1 -1 5" fill="none" stroke="#e6842a" strokeWidth={2.4}
                    strokeLinecap="round" transform={`translate(${x + b.size.w - ch(9)} ${y + ch(9)}) scale(${ch(1)})`} />
                </g>
              )}

              {/* A corner to drag, where the footprint is yours to change. */}
              {/* Scenery is sized here too - a river as wide as you want it, a bridge as long as
                  it needs to be - which is what the takeover promises when it says its size is set
                  on the park. */}
              {on && onSetSize && (b.item.category === 'enclosure' || b.item.category === 'flora') && (
                <rect data-part="size-grip" x={x + b.size.w - ch(9)} y={y + b.size.h - ch(9)} width={ch(18)} height={ch(18)} rx={ch(4)}
                  fill="#fff" stroke="#e6842a" strokeWidth={ch(3)}
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={tool === 'path' ? undefined : (e) => sizeFrom(e, b)} />
              )}
            </g>
          );
        })}

        {/* The run as it is being drawn: the width it will actually be laid at. */}
        {runFrom && runTo && (
          <line data-part="drawing-run" x1={runFrom.x} y1={runFrom.y} x2={runTo.x} y2={runTo.y}
            stroke={pathStyle?.color ?? '#c9a86a'} strokeWidth={Math.max(6, pathStyle?.thickness ?? 14)}
            strokeLinecap="round" opacity={0.75} pointerEvents="none" />
        )}

        {/* What is being placed or moved, with the park's verdict on it. */}
        {ghost && (
          <g data-part="ghost" pointerEvents="none">
            <rect x={ghost.x - ghost.w / 2} y={ghost.y - ghost.h / 2} width={ghost.w} height={ghost.h} rx={6}
              fill={ghost.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}
              stroke={ghost.ok ? '#059669' : '#dc2626'} strokeWidth={3} />
            {!ghost.ok && ghost.why && (
              <text x={ghost.x} y={ghost.y} textAnchor="middle" fontSize={ch(14)} fontWeight={700} fill="#b91c1c">{ghost.why}</text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
