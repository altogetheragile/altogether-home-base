import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, ZooConnector, BacklogItem } from './types';
import { standingOnPark, parkPositions, restingPlace, apronRing, APRON_WIDTH, quarterOf, runPoints, runPath, pathTarget } from './parkModel';
import { zonePlots, plotOrder, plotFor, insidePlot, plotSize } from './parkZones';
import { themeFor } from './zoneTheme';
import { riverOutline, inWater, acrossTheWater } from './parkWater';
import { insidePark, CANVAS_W, PLAY_H, PROMENADE_Y, PROMENADE_H, FRONT_Y, parkOutline, outlinePath, hedgePoints, HEDGE_STEP, HEDGE_R } from './parkLayout';
import { ENTRANCE } from './parkNetwork';

import { hasGround, groundPrice, structureChosen } from './engine';
import { pieceByKey, pieceOf, isPlanting, shade, groupMembers, currentDesign, enclosureWater, enclosureFlora, isTank, tankWater, barrierOf } from './design';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

/** How much of the car park to show at the foot of the plan. Not ground you build on - it is there
 *  so the front of the park reads as the front of the park, and so a run drawn to meet the way in
 *  lands where the isometric view will draw it. */
const APRON_H = 60;
/** How wide the gap in the front is. Wide enough to read as a gate at the whole-park zoom, which is
 *  where somebody is when they are trying to find it. */
const WAY_IN_W = 86;
/** Shorter than this and it is a slip of the hand rather than a path. About a pace on the park. */
const MIN_RUN = 26;
/** How far one press of an arrow key moves something, in park pixels. A pace, and ten at once with
 *  Shift.
 *
 *  Sized against the things being moved rather than picked: a medium habitat is 132 across and the
 *  park is 1760, so 16 is an eighth of a habitat - fine enough to slide one off the thing it is
 *  standing on - and a Shift stride of 160 is about one habitat, so crossing the park is eleven of
 *  them. At 8 it took 220 presses to cross, which is a keyboard path in name only. */
const PACE = 16;
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

/** A plant, seen from straight above: its canopy.
 *
 *  ONE drawing of a plant on the plan, because there were three. The wood along the boundary drew
 *  canopies, the planting inside a habitat drew a flat disc, and a planting standing on open ground
 *  drew a RECTANGLE - which is why a park with three plantings on it read as three green slabs, and
 *  why dragging one bigger made a bigger slab rather than a bigger tree.
 *
 *  Flat from above, so shape is all there is to tell one kind from another: a canopy with its light
 *  side towards the sun, scrub as a low huddle, a bed of flowers as a scatter of heads, stone as a
 *  block with corners. */
function Canopy({ x, y, r, kind, piece, foliage, trunk }: {
  x: number; y: number; r: number; kind?: string;
  /** WHICH tree, not just that it is one.
   *
   *  Every call here passed `piece.type`, which is 'tree' for an oak, a pine, a palm, a blossom and
   *  a bare one alike - so the choice was thrown away at the door and all five came out as the same
   *  circle in a slightly different green. Reported from playing it: "the trees are all the same. I
   *  select pine and it looks like an oak."
   *
   *  A plan is a drawing from above, so these are what the crowns actually look like from above: a
   *  conifer is a tight spiky rosette, a palm is a splay of fronds, a bare tree is branches and no
   *  canopy at all. Not decoration - it is the only place the park says which one you planted. */
  piece?: string; foliage?: string; trunk?: string;
}) {
  const leaf = foliage ?? '#3f8f43';
  const bark = trunk ?? '#7a5228';
  if (/rock|shelter|stone/i.test(kind ?? '')) {
    return <rect x={x - r} y={y - r * 0.78} width={r * 2} height={r * 1.56} rx={r * 0.34}
      fill={leaf} stroke={shade(leaf, -28)} strokeWidth={Math.max(1, r * 0.12)} />;
  }
  if (/flower/i.test(kind ?? '')) {
    // A bed is many small heads, not one big one.
    const heads = [[-0.52, -0.3], [0.1, -0.52], [0.56, -0.1], [-0.2, 0.34], [0.38, 0.46], [-0.62, 0.3]];
    return (
      <g>
        <ellipse cx={x} cy={y} rx={r} ry={r * 0.74} fill={shade(leaf, -34)} opacity={0.5} />
        {heads.map(([dx, dy], i) => (
          <circle key={i} cx={x + dx * r} cy={y + dy * r * 0.8} r={r * 0.27} fill={i % 2 ? leaf : shade(leaf, 22)} />
        ))}
      </g>
    );
  }
  if (/bush|hedge|shrub/i.test(kind ?? '')) {
    return (
      <g>
        <circle cx={x - r * 0.42} cy={y + r * 0.12} r={r * 0.62} fill={shade(leaf, -20)} />
        <circle cx={x + r * 0.4} cy={y + r * 0.16} r={r * 0.56} fill={shade(leaf, -26)} />
        <circle cx={x} cy={y - r * 0.18} r={r * 0.68} fill={leaf} />
      </g>
    );
  }
  // A conifer from above: a tight rosette of needled tiers, dark, with the spire at its middle.
  if (piece === 'pine') {
    const points = Array.from({ length: 16 }, (_, i) => {
      const a = (Math.PI * i) / 8 - Math.PI / 2;
      const rad = i % 2 ? r * 0.52 : r;
      return `${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`;
    }).join(' ');
    return (
      <g>
        <polygon points={points} fill={shade(leaf, -18)} />
        <circle cx={x} cy={y} r={r * 0.42} fill={leaf} />
        <circle cx={x} cy={y} r={Math.max(0.8, r * 0.13)} fill={shade(leaf, -40)} />
      </g>
    );
  }
  // A palm from above: fronds off one crown, and daylight between them.
  if (piece === 'palm') {
    return (
      <g>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 7 + 0.3;
          const ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
          const cx = x + Math.cos(a + 0.55) * r * 0.75, cy = y + Math.sin(a + 0.55) * r * 0.75;
          return <path key={i} d={`M${x},${y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`}
            stroke={i % 2 ? leaf : shade(leaf, -20)} strokeWidth={Math.max(1, r * 0.3)} strokeLinecap="round" fill="none" />;
        })}
        <circle cx={x} cy={y} r={Math.max(1, r * 0.2)} fill={shade(bark, 10)} />
      </g>
    );
  }
  // Nothing on it. From above a bare tree is its branches, which is why it is the one you can see
  // the ground through.
  if (piece === 'bare') {
    return (
      <g>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 5 + 0.4;
          return <line key={i} x1={x} y1={y} x2={(x + Math.cos(a) * r).toFixed(1)} y2={(y + Math.sin(a) * r).toFixed(1)}
            stroke={shade(bark, i % 2 ? 0 : -18)} strokeWidth={Math.max(0.8, r * 0.16)} strokeLinecap="round" />;
        })}
        <circle cx={x} cy={y} r={Math.max(1, r * 0.22)} fill={shade(bark, -24)} />
      </g>
    );
  }
  // In flower: a crown with the blossom showing through it.
  if (piece === 'blossom') {
    const buds = [[-0.45, -0.3], [0.32, -0.45], [0.5, 0.18], [-0.12, 0.5], [-0.58, 0.16], [0.05, -0.05]];
    return (
      <g>
        <circle cx={x} cy={y} r={r} fill={shade(leaf, -22)} />
        {buds.map(([dx, dy], i) => (
          <circle key={i} cx={x + dx * r} cy={y + dy * r} r={r * 0.24} fill={shade(leaf, i % 2 ? 26 : 14)} />
        ))}
      </g>
    );
  }
  // An oak, and anything the catalogue has not named: a broad, lumpy crown.
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={shade(leaf, -26)} />
      <circle cx={x - r * 0.22} cy={y - r * 0.22} r={r * 0.6} fill={leaf} />
      {trunk && <circle cx={x + r * 0.28} cy={y + r * 0.3} r={Math.max(1, r * 0.14)} fill={trunk} opacity={0.65} />}
    </g>
  );
}

/** What a habitat looks like from above, in the choices somebody has made about it.
 *
 *  Reported from playing it, twice and five minutes apart: "nothing changes on the enclosure image
 *  to indicate the feature has been set - e.g. the ground colour, or barrier type or colour", and
 *  "I lost the ground setting again". The second was the first: the plan painted every habitat the
 *  same category beige whatever was chosen, so a ground colour that had been set perfectly well
 *  looked exactly like one that had been forgotten - and there was no way to tell a choice from a
 *  loss by looking, which is the whole point of building in place.
 *
 *  The isometric view has painted the chosen ground and fence since the day that was reported there.
 *  This is the eighth time the two drawings have disagreed about the same piece of state.
 *
 *  What is round it reads as what it is: a hedge is a soft green line, a fence is a line, a high
 *  fence is a thicker one, a wall is thick and solid, glass is pale and cold. The colour is whatever
 *  was chosen for it, because that is the choice on the strip.
 */
function penLook(item: BacklogItem, living: BacklogItem[]): { fill: string; stroke: string; width: number } {
  const design = currentDesign(item);
  const barrier = barrierOf(design, living);
  const WEIGHT: Record<string, { width: number; stroke: string }> = {
    hedge: { width: 4, stroke: '#4f7a3a' },
    fence: { width: 2.5, stroke: '#8a6a3b' },
    high: { width: 4.5, stroke: '#6b5b45' },
    wall: { width: 7, stroke: '#8d8d8d' },
    glass: { width: 3, stroke: '#9ec8dd' },
  };
  const look = WEIGHT[barrier.key] ?? WEIGHT.fence;
  return {
    fill: design.colors?.ground ?? FILL.enclosure.fill,
    stroke: design.colors?.fence ?? look.stroke,
    width: look.width,
  };
}

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
  placing, onPlace, tool = 'none', pathStyle, runFor, onAddConnector, onUpdateConnector, onSetMemberSpot, onMoveInside, onMoveCopy, inside, frame, still = false, className }: {
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
  /** Move one of a planting's other plants. A clump is several plants, each on its own spot. */
  onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void;
  /** Move a pool or a plant about inside a habitat. */
  onMoveInside?: (id: string, kind: 'water' | 'flora', index: number, spot: { x: number; y: number }) => void;
  /** Something is being put down for the first time: it follows the cursor with a verdict on it. */
  placing?: { id: string; w: number; h: number } | null;
  /** Somewhere to point the camera - an area of the zoo, a habitat. A request, not a mode: the
   *  camera moves there and the player is free to go elsewhere from it. */
  frame?: { x0: number; y0: number; x1: number; y1: number } | null;
  /** A picture of the park rather than the park: no camera controls. For the orientation screen,
   *  which shows the plan beside the Increment to say they are the same zoo - and where an offer to
   *  zoom is an offer that leads nowhere. */
  still?: boolean;
  onPlace?: (id: string, pos: { x: number; y: number }, drawn?: { w: number; h: number }, into?: string) => void;
  /** The park's own tool. A path is drawn point to point: click where it starts, click where it
   *  ends, and it runs between them. Nothing else on the park needs a tool. */
  tool?: 'none' | 'path';
  pathStyle?: { thickness: number; color: string };
  /** The pathway item the run being drawn belongs to. */
  runFor?: string;
  onAddConnector?: (c: ZooConnector) => void;
  /** Move a joint, or take one out. A run bends where the player put the corner. */
  onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void;
  /** Ask the Product Owner to look at something that meets all of its criteria. */
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  // `into` is where it is going rather than whether it may: an animal is moving INTO a habitat, and
  // a ghost that can only say no had nothing to say about the one gesture that is a yes.
  const [ghost, setGhost] = useState<{ x: number; y: number; w: number; h: number; ok: boolean; why?: string; into?: string } | null>(null);
  // Where a run was started, while it is being drawn.
  const [runFrom, setRunFrom] = useState<{ x: number; y: number } | null>(null);
  const [runTo, setRunTo] = useState<{ x: number; y: number } | null>(null);
  // The run being laid right now, if the last press carried on from where the one before it
  // stopped. A path round a habitat and up to the kiosk is ONE path with corners in it, not four
  // paths that happen to touch: "can the paths have joints like they used to?"
  const [laying, setLaying] = useState<string | null>(null);
  useEffect(() => {
    // Putting the pen away finishes the path. Picking it up again starts a new one rather than
    // carrying on from a corner nobody can see any more.
    if (tool !== 'path') { setRunFrom(null); setRunTo(null); setLaying(null); }
  }, [tool]);

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
  /** The habitat an animal is being dropped into, if it is over one.
   *
   *  An animal does not stand on the park, it lives in a habitat - so the habitat is the TARGET
   *  rather than an obstacle. The drop knew that and the ghost did not: carrying a lion over its own
   *  enclosure showed a red box reading "on top of Lion Enclosure", which tells a player the one
   *  thing they are trying to do is refused. Reported from playing it: "I cannot place the lions in
   *  the enclosure."
   *
   *  One rule, asked by both, so what the ghost promises is what the drop does. */
  const homeUnder = (id: string, box: { w: number; h: number }, at: { x: number; y: number }) => {
    const item = state.backlog.find((it) => it.id === id);
    if (item?.category !== 'exhibit') return undefined;
    // Overlapping, not strictly inside: an animal is smaller than its pen and you are aiming at a
    // pen, so anywhere its box touches the habitat is a place you meant.
    return boxes.find((b) => b.item.category === 'enclosure'
      && Math.abs(at.x - b.at.x) < (b.size.w + box.w) / 2
      && Math.abs(at.y - b.at.y) < (b.size.h + box.h) / 2);
  };

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
    // An animal over a habitat is moving IN. Its own zone still applies - a lion belongs in the Big
    // Cats - but the habitat it is aimed at is the point of the gesture rather than something in
    // the way of it.
    const home = homeUnder(id, box, at);
    if (home) {
      return { x: at.x, y: at.y, w: box.w, h: box.h, ok: !off && !strayed,
        why: off ? 'off the park' : strayed ? `outside the ${zone} area` : undefined,
        into: home.item.name };
    }
    const animal = state.backlog.find((it) => it.id === id)?.category === 'exhibit';
    return { x: at.x, y: at.y, w: box.w, h: box.h, ok: !off && !strayed && !wet && !over && !animal,
      why: off ? 'off the park' : wet ? 'in the river' : strayed ? `outside the ${zone} area`
        : over ? `on top of ${over.item.name}`
        : animal ? 'an animal lives in a habitat - drop it on one' : undefined };
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

  /** Drag one of a planting's other plants about the park. Its own tree on its own spot, which is
   *  what the model has held since the day dragging the item stopped dragging the whole clump. */
  const dragCopy = (e: ReactPointerEvent, id: string, index: number) => {
    if (!onMoveCopy) return;
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) onMoveCopy(id, index, insidePark({ w: 40, h: 40 }, p)); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** Drag a pool or a plant about inside its habitat, in the habitat's own coordinates. */
  /** Where a thing stands and how big it is, for the runs attached to it. */
  const whereIs = (id: string) => {
    const bx = boxes.find((b) => b.item.id === id);
    return bx ? { at: bx.at, size: pathTarget(bx.item, bx.size) } : undefined;
  };

  /** Drag a joint to a new corner. The same gesture as moving a pool or a tree inside a habitat,
   *  because it is the same act: taking hold of a part of something already built. */
  const moveJoint = (e: ReactPointerEvent, c: ZooConnector, index: number) => {
    if (!onUpdateConnector) return;
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => {
      const at = worldAt(ev);
      if (!at) return;
      onUpdateConnector(c.id, { bends: (c.bends ?? []).map((b, i) => (i === index ? at : b)) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

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
          about it is an ordinary thing to want rather than a mode to be in.
          ...unless this is a PICTURE of the park rather than the park: the orientation screen shows
          the plan beside the Increment to say they are the same zoo, and a zoom control on a
          picture is an offer that leads nowhere. */}
      {!still && (
      <div data-part="park-camera" className="absolute right-2 top-2 z-20 flex items-center gap-1">
        <button type="button" aria-label="Zoom out" className={cn(FOCUS, stepper)}
          onClick={() => zoomAbout(null, 1.3)}>&minus;</button>
        <button type="button" aria-label="Zoom in" className={cn(FOCUS, stepper)}
          onClick={() => zoomAbout(null, 1 / 1.3)}>+</button>
        <button type="button" data-part="park-fit" aria-label="See the whole zoo"
          className={cn(FOCUS, 'rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm hover:bg-background')}
          onClick={() => setCam(whole)}>Whole zoo</button>
      </div>
      )}
      {/* No selecting. Dragging across the park was painting the browser's own selection highlight
          over the labels and the boxes - pale blue rectangles that pile up as you drag and stay
          there. Reported from playing it: "blue squares appear as trails." */}
      <svg ref={svgRef} data-part="park-plan" className="select-none" viewBox={view}
        // Something waiting to be put down can be put down without a pointer: the park takes focus,
        // the arrows walk the ghost about, and Enter sets it there. The verdict is the same one a
        // click goes through, so what may stand where is one rule.
        role={placing ? 'application' : 'img'}
        tabIndex={placing ? 0 : undefined}
        aria-label={placing
          ? `Putting down ${state.backlog.find((it) => it.id === placing.id)?.name ?? 'it'}: arrow keys move it, Enter puts it down`
          : `The zoo from above: ${boxes.length} things standing on it`}
        onKeyDown={placing ? (e) => {
          // Where the ghost starts, before any arrow has been pressed. A pointer starts it under
          // the pointer, which is always somewhere the player chose; a keyboard has to be given a
          // spot, and the middle of the item's OWN area is the one place it is certain to be
          // allowed. Started at the item's resting place instead, a first Enter was refused as
          // "outside the Big Cats area" from a corner nobody had aimed at, and there was nothing on
          // screen to say which way to walk.
          const item = state.backlog.find((it) => it.id === placing.id) ?? ({} as BacklogItem);
          const plot = plotFor(state, item.zone);
          const from = item.pos ?? (plot ? { x: (plot.x0 + plot.x1) / 2, y: (plot.y0 + plot.y1) / 2 } : null)
            ?? restingPlace(item, placing, auto) ?? { x: CANVAS_W / 2, y: PLAY_H / 2 };
          const at = ghost ?? verdict(placing.id, placing, from);
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (at.ok && onPlace) { onPlace(placing.id, { x: at.x, y: at.y }); setGhost(null); }
            return;
          }
          const step = e.shiftKey ? PACE * 10 : PACE;
          const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
          if (!by) return;
          e.preventDefault();
          setGhost(verdict(placing.id, placing, { x: at.x + by[0], y: at.y + by[1] }));
        } : undefined}
        // Taking focus shows where it would land. A pointer shows the ghost from the first move;
        // by keyboard, without this, the first thing a player sees is the result of a press.
        onFocus={placing ? () => {
          const item = state.backlog.find((it) => it.id === placing.id) ?? ({} as BacklogItem);
          const plot = plotFor(state, item.zone);
          setGhost((g) => g ?? verdict(placing.id, placing, item.pos
            ?? (plot ? { x: (plot.x0 + plot.x1) / 2, y: (plot.y0 + plot.y1) / 2 } : null)
            ?? restingPlace(item, placing, auto) ?? { x: CANVAS_W / 2, y: PLAY_H / 2 }));
        } : undefined}
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
              // The same rule the ghost showed. It used to be a stricter one - the pointer had to
              // be inside the habitat's own box - so a lion let go where the ghost said "into the
              // Lion Enclosure" landed nowhere at all and nothing said why.
              const home = homeUnder(placing.id, placing, w);
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
            // Pressing the same spot twice finishes the path. It is the ordinary way to end a
            // polyline, and it is the way to start a separate path somewhere else without putting
            // the pen away: while one is being laid, every press carries on from the last corner.
            //
            // It also swallows the stray click it always swallowed. A press a few pixels from the
            // last one used to lay a path a few pixels long, and a session hunting for the way in
            // finished with eight of them fanned across the park: "every stray click creates a junk
            // path run. I finished with eight."
            if (Math.hypot(w.x - runFrom.x, w.y - runFrom.y) < MIN_RUN) {
              setRunFrom(null); setRunTo(null); setLaying(null); return;
            }
            // An end that lands on something is ATTACHED to it, so the run follows when the thing
            // moves. Runs were plain coordinates, so moving an exhibit left its paths behind,
            // fanning across the park - reported from a play-through: "orphaned paths are never
            // cleaned up. Mine looked like a cracked windscreen by Sprint 2." Nothing to clean up
            // if the path goes with the thing it was drawn to.
            const onThing = (p: { x: number; y: number }) => {
              const hit = boxes.find((bx) => Math.abs(p.x - bx.at.x) <= bx.size.w / 2 + APRON_WIDTH
                && Math.abs(p.y - bx.at.y) <= bx.size.h / 2 + APRON_WIDTH);
              return hit ? { featureId: hit.item.id, x: p.x, y: p.y } : { x: p.x, y: p.y };
            };
            const from = onThing(runFrom), to = onThing(w);
            // Carrying on from where the last press stopped bends the run it is carrying on from,
            // rather than starting a second one beside it. The corner is where you stopped, and it
            // is draggable afterwards.
            const carryingOn = !!laying && (state.connectors ?? []).some((c) => c.id === laying);
            if (carryingOn && onUpdateConnector) {
              const c = (state.connectors ?? []).find((x) => x.id === laying)!;
              onUpdateConnector(laying, { bends: [...(c.bends ?? []), { x: runFrom.x, y: runFrom.y }], b: to });
            } else {
              const id = `run-${runFrom.x.toFixed(0)}-${w.x.toFixed(0)}-${w.y.toFixed(0)}`;
              onAddConnector?.({
                id,
                // Whose run it is. Without this a drawn path belonged to no Backlog item: the pathway
                // you were building never counted the run you had just drawn for it, so it could not
                // be built, accepted or finished - "I added the main paths and cannot move it to Done".
                itemId: runFor,
                a: from, b: to, bends: [],
                thickness: pathStyle?.thickness ?? 14, color: pathStyle?.color ?? '#c9a86a',
              });
              setLaying(id);
            }
            // The pen stays down AND it stays where you left it. Laying a path is laying several
            // legs - round a habitat, along the front, up to the kiosk - and each press carries on
            // from the last, so the path grows rather than starting again. Reported from playing
            // it: "drawing paths is clunky. Can the draw tool stay active so multiple paths can be
            // drawn at once?" It stops when you close the menu it lives in.
            //
            // An end that landed ON something finishes the path there: you have arrived.
            if (to.featureId) { setRunFrom(null); setRunTo(null); setLaying(null); return; }
            setRunFrom(w); setRunTo(w);
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
        {/* Rough ground: what an area looks like before the zoo owns it. A tone apart from the mown
            green was not enough to read at a glance - the difference between ground you can build on
            and ground you cannot is the biggest thing on this drawing, and it has to look like it. */}
        <pattern id="rough-ground" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="18" height="18" fill="#93a271" />
          <line x1="0" y1="0" x2="0" y2="18" stroke="#7b8a5c" strokeWidth="6" />
        </pattern>
        {/* The treeline along the boundary, from the same points, and open along the front where
            the way in is - so the plan and the Increment agree about where the park stops. Seen
            from straight above, a tree is its canopy. */}
        <g>
          {hedgePoints(HEDGE_STEP).map(({ x, y, n, piece, size }) => {
            const r = HEDGE_R * 1.3 * size;
            // The kind's own colours, so a pine reads dark beside an oak and a blossom is pink from
            // above. One wood, described once, drawn twice: the Increment stands the same trees up.
            const leaf = pieceByKey(piece)?.colors.foliage ?? '#3f6a31';
            return (
              <g key={`tree-${n}`} data-tree={piece}>
                <Canopy x={x} y={y} r={r} kind={pieceByKey(piece)?.type} piece={piece} foliage={leaf} />
              </g>
            );
          })}
        </g>
        <rect x={0} y={PROMENADE_Y} width={CANVAS_W} height={PROMENADE_H} fill="#e7d6a8" />
        <rect x={0} y={PLAY_H} width={CANVAS_W} height={APRON_H} fill="#9aa0a6" />
        {/* THE WAY IN. Drawn, at last.
            Every habitat has to answer "can I walk to it from the way in?", and the way in was a
            coordinate that nothing on the screen drew: no gate, no arrow, no break in the band, no
            label. So the game asked for a path to a place the park did not show. Reported from a
            play-through, after twenty deliberate attempts: "the entrance is invisible, and the path
            tool costs you twenty minutes because of it."
            It is terrain, like the river - it was there before the zoo was, it is on nobody's
            Product Backlog, and it cannot be moved. The Entrance you can BUILD is the arch and the
            signage over it; this is the gap in the fence the arch goes over. */}
        <g data-part="way-in" pointerEvents="none">
          {/* The gap in the front, the piers either side of it, and the stub of path running up into
              the park - which is the bit of walkable ground a run has to reach. */}
          <rect x={ENTRANCE.x - WAY_IN_W / 2} y={PROMENADE_Y - 4} width={WAY_IN_W} height={PROMENADE_H + APRON_H / 2 + 4} fill="#e7d6a8" />
          <rect x={ENTRANCE.x - WAY_IN_W / 2 - 9} y={PROMENADE_Y - 12} width={9} height={PROMENADE_H + 16} rx={3} fill="#8a5a2b" />
          <rect x={ENTRANCE.x + WAY_IN_W / 2} y={PROMENADE_Y - 12} width={9} height={PROMENADE_H + 16} rx={3} fill="#8a5a2b" />
          <line x1={ENTRANCE.x} y1={FRONT_Y} x2={ENTRANCE.x} y2={FRONT_Y - 56} stroke="#c9a86a"
            strokeWidth={WAY_IN_W * 0.62} strokeLinecap="round" />
          {/* ...and it says what it is. A break in a band is a break in a band until it is named. */}
          <text x={ENTRANCE.x} y={FRONT_Y - 70} textAnchor="middle" fontSize={ch(15)} fontWeight={800}
            fill="#6b4a22" stroke="#f3ead6" strokeWidth={ch(4)} paintOrder="stroke">Way in</text>
          <text x={ENTRANCE.x} y={FRONT_Y - 70} textAnchor="middle" fontSize={ch(15)} fontWeight={800}
            fill="#6b4a22">Way in</text>
        </g>
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
          // Ground the zoo does not have is drawn as ground the zoo does not have: rough, unmown,
          // with what it would cost written on it. It is the rest of the Product Backlog to scale,
          // in the place it is going to be, and now with the price of getting there - which is the
          // Product Owner's argument made into a picture.
          const ours = hasGround(state, p.zone);
          return (
            <g key={p.zone} data-part="zone-plot" data-zone={p.zone} data-open={open ? 'yes' : 'no'}
              data-ours={ours ? 'yes' : 'no'}>
              <rect x={p.x0} y={p.y0} width={size.w} height={size.h} rx={16}
                fill={ours ? theme.plot : 'url(#rough-ground)'} opacity={ours ? (open ? 0.3 : 0.14) : 0.5}
                stroke={ours ? theme.plotBorder : '#6f7d52'} strokeWidth={2}
                strokeDasharray={open && ours ? undefined : '11 9'} />
              <text x={p.x0 + 14} y={p.y0 + 24} fontSize={ch(15)} fontWeight={700} fill="#3f4a2f"
                opacity={open ? 0.85 : 0.6}>{p.zone}</text>
              {!ours && (
                <text x={p.x0 + 14} y={p.y0 + 44} fontSize={ch(12)} fontWeight={600} fill="#4a5238" opacity={0.75}>
                  not the zoo&rsquo;s ground &middot; {groundPrice().toLocaleString()}
                </text>
              )}
            </g>
          );
        })}

        {/* The rest of a planting: one Product Backlog item is a clump, and every plant in it stands
            on its own spot. The isometric view has drawn them since the day they could be dragged;
            this one drew the first plant and nothing else, so a player who planted three trees saw
            one on the surface they were planting them with. The ninth time the two drawings have
            disagreed about the same piece of state. */}
        {boxes.filter((b) => b.item.category === 'flora' && (b.item.copies ?? []).length > 0).map((b) => (
          (b.item.copies ?? []).map((c, i) => {
            const piece = pieceByKey(c.piece);
            const d = currentDesign(b.item);
            const fill = piece?.colors.foliage ?? d.colors?.foliage ?? fillFor(b.item).fill;
            const trunk = piece?.colors.trunk ?? d.colors?.trunk;
            const r = Math.min(b.size.w, b.size.h) * 0.48;
            return (
              <g key={`copy-${b.item.id}-${i}`} data-copy={`${b.item.id}:${i}`}
                opacity={b.underWay ? 0.5 : 1}
                onPointerDown={placing || tool === 'path' ? undefined : (e) => dragCopy(e, b.item.id, i)}
                style={{ cursor: onMoveCopy ? 'grab' : 'default' }}>
                {/* The canopy, and an invisible square round it to take hold of: a circle is a small
                    target on a tablet, and the whole point of drawing these was that each plant can
                    be moved to where somebody wants it. */}
                <rect x={c.x - b.size.w / 2} y={c.y - b.size.h / 2} width={b.size.w} height={b.size.h}
                  fill="transparent" />
                <Canopy x={c.x} y={c.y} r={r} kind={piece?.type ?? d.parts.type} piece={piece?.key ?? d.parts.piece} foliage={fill} trunk={trunk} />
              </g>
            );
          })
        ))}

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

        {/* Paths, drawn as the runs they are - and an end that is attached to something is drawn
            where that thing is NOW. The isometric view has resolved them that way since connectors
            could be attached at all; this one drew the coordinates it was given, so moving an
            exhibit left its paths behind. */}
        {(state.connectors ?? []).map((c) => {
          const pts = runPoints(c, whereIs, true);
          return (
            <polyline key={c.id} data-conn={c.id} points={runPath(pts)} fill="none"
              stroke={c.color ?? '#c9a86a'} strokeWidth={Math.max(6, c.thickness ?? 14)}
              // Round joins and caps, so a corner in a path is a corner and not two paths that
              // happen to end near each other.
              strokeLinecap="round" strokeLinejoin="round" />
          );
        })}

        {/* The joints, as something you can take hold of. They have been in the model since runs
            could bend at all and nothing ever drew one: "we used to have joints on paths too". Only
            with the pen away - with it out, every press on the park is drawing. */}
        {tool !== 'path' && onUpdateConnector && (state.connectors ?? []).map((c) => (
          (c.bends ?? []).map((bend, i) => (
            <circle key={`${c.id}-joint-${i}`} data-joint={`${c.id}-${i}`} cx={bend.x} cy={bend.y} r={9}
              fill="#fff" stroke={c.color ?? '#c9a86a'} strokeWidth={3}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => moveJoint(e, c, i)}>
              <title>Drag to move this corner</title>
            </circle>
          ))
        ))}

        {/* Everything standing on the park, straight down, nothing behind anything else. */}
        {boxes.map((b) => {
          const c = fillFor(b.item);
          const on = selected === b.item.id;
          const x = b.at.x - b.size.w / 2, y = b.at.y - b.size.h / 2;
          // `data-item` is what a thing IS, and it is the name the isometric view uses too, so one
          // question - which item is this? - has one answer in both drawings. `data-plan-item`
          // stays: it is the plan's own handle, and it is also put on things that are not items at
          // all, like the gate and a single piece of a planting.
          return (
            <g key={b.item.id} data-item={b.item.id} data-plan-item={b.item.id}
              // Reachable and movable without a pointer.
              //
              // Everything on the park was pointer-only: a thing could be picked up, dragged and
              // dropped, and there was no other way to do any of it. The board's moves all have a
              // keyboard path through the card - "Start it", "Move it to Done", "Hand it back" -
              // and the park had none at all, which locks a keyboard user out of the half of the
              // game where the building happens.
              //
              // Tab to it, Enter or Space opens it the way a press does, and the arrows move it a
              // pace at a time - ten paces with Shift. It goes through the same verdict a drag
              // does, so the rules about zones, water and standing on things are one rule, not two.
              tabIndex={placing || tool === 'path' ? -1 : 0}
              role="button"
              aria-label={`${b.item.name}${on ? ', picked up' : ''}${onPlaceItem ? ' - arrow keys move it' : ''}`}
              onKeyDown={placing || tool === 'path' ? undefined : (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(b.item.id); return; }
                const step = e.shiftKey ? PACE * 10 : PACE;
                const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
                if (!by || !onPlaceItem) return;
                e.preventDefault();
                const v = verdict(b.item.id, b.size, { x: b.at.x + by[0], y: b.at.y + by[1] });
                // Refused the same way a drag is refused, and for the same reasons: it simply does
                // not go. The ghost says why for as long as the key is down.
                setGhost(v);
                if (v.ok) onPlaceItem(b.item.id, { x: v.x, y: v.y });
              }}
              onBlur={() => setGhost(null)}
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
                // A clump of trees is not a box. Its box is still here - it is what you take hold of
                // to move it, and what carries the ring when it is picked up and the hoarding while
                // it is being built - but nothing is painted in it. The canopies below are the thing.
                fill={isPlanting(b.item) ? 'transparent'
                  : b.item.category === 'amenity' ? (currentDesign(b.item).colors?.roof ?? c.fill)
                  : b.item.category === 'enclosure'
                    ? (isTank(currentDesign(b.item), state.backlog.filter((it) => it.enclosureId === b.item.id), b.item)
                      ? tankWater(currentDesign(b.item))
                      : penLook(b.item, state.backlog.filter((it) => it.enclosureId === b.item.id)).fill)
                    : c.fill}
                fillOpacity={b.underWay ? 0.45 : 1}
                // What is holding them in, as the line round the pen: its kind decides the weight,
                // and its colour is the one that was chosen. Still dashed while it is being built,
                // because "not Done" is a different thing from "made of hedge".
                stroke={on ? '#e6842a'
                  : isPlanting(b.item) ? (b.underWay ? c.stroke : 'none')
                  : b.item.category === 'enclosure'
                    ? penLook(b.item, state.backlog.filter((it) => it.enclosureId === b.item.id)).stroke
                    : c.stroke}
                strokeWidth={on ? 4
                  : b.item.category === 'enclosure'
                    ? penLook(b.item, state.backlog.filter((it) => it.enclosureId === b.item.id)).width
                    : 2}
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
                    {/* ...and which way that is, from above.
                        
                        A door drawn on the wall it is in is a line among lines: the walls are a
                        band, the sign is a line, the door is a line, and from straight above they
                        are all the same thing at different lengths. Reported from playing it: "the
                        front of a building should have an arrow or something pointing forward. It
                        is hard to see the front from above."
                        
                        So the front says which way it faces, standing off the wall where nothing
                        else is drawn. Outlined in the ground's own colour rather than tinted with
                        the building, because a mark in the door's colour on a door-coloured wall is
                        the thing that was already there. */}
                    {(() => {
                      const m = at(0.5);
                      const ox = -inx, oy = -iny;                 // away from the building
                      const px = Math.abs(oy), py = Math.abs(ox); // along its front
                      const pt = (out: number, along: number) =>
                        `${(m.x + ox * out + px * along).toFixed(1)},${(m.y + oy * out + py * along).toFixed(1)}`;
                      // Sized against the building, not in fixed pixels: a kiosk and a restaurant
                      // are very different boxes and a mark that reads on one is a speck on the
                      // other.
                      const reach = Math.max(13, Math.min(b.size.w, b.size.h) * 0.42);
                      const wide = Math.max(7, Math.min(b.size.w, b.size.h) * 0.24);
                      return (
                        <polygon data-part="front-way"
                          points={`${pt(reach, 0)} ${pt(2, wide)} ${pt(2, -wide)}`}
                          fill={door} stroke="#ffffff" strokeWidth={2} strokeLinejoin="round"
                          opacity={b.underWay ? 0.6 : 0.95} />
                      );
                    })()}
                  </>
                );
              })()}
              {/* The plants. A planting item is a clump, and its own plant stands at the middle of
                  its box; the rest of the clump is drawn further down, where each one has a spot of
                  its own on the park. Seen from straight above, a plant is its canopy. */}
              {isPlanting(b.item) && (() => {
                const d = currentDesign(b.item);
                const piece = pieceOf(d, b.item.template);
                return (
                  <Canopy x={x + b.size.w / 2} y={y + b.size.h / 2} r={Math.min(b.size.w, b.size.h) * 0.48}
                    kind={piece?.type ?? d.parts.type} piece={piece?.key ?? d.parts.piece}
                    foliage={d.colors?.foliage} trunk={d.colors?.trunk} />
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
                        <Canopy x={x + b.size.w * f.x} y={y + b.size.h * f.y} r={11 * (f.s || 1)}
                          kind={f.type} foliage={f.foliage} trunk={f.trunk} />
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* The animals inside their fence, big enough to see and to take hold of. */}
              {b.animals.map((a, i) => {
                // The group being CHOSEN, not the one last delivered. Reported from playing it:
                // "when I select Family for Lion should I see multiple dots to indicate a pride?"
                // You should, and the Increment drew them - this read the saved design, so the plan
                // stayed a single lion the whole time the choice was in hand. The same fault the
                // coat had, two lines below, in the same element.
                const members = Math.max(1, groupMembers(currentDesign(a).group).length);
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
                    <circle key={`${a.id}-${i}-${k}`} data-item={a.id} data-animal={`${a.id}-${k}`} cx={gx} cy={gy} r={9}
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
                  {/* "Built, not Done" is a claim about work that has been done. A plot whose
                      Developers have not yet said what they are building is a plot: the ground is
                      taken and nothing else is true yet. */}
                  {b.item.name}{!b.underWay ? '' : structureChosen(b.item) ? ' · built, not Done' : ' · nothing chosen yet'}
                </text>
              )}
              {/* The count and the offer to Priya used to be a pill under every built object out here,
                  180px of text per thing, floating over the park: "2 of 5 checked - no ground or
                  shelter or planting or water yet". It says the same things the build strip's chip
                  says about whatever is selected, at the other end of the screen, over the thing the
                  player is trying to look at. One question, one place: the chip. */}
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
              {/* ...but a clump of trees has no plot to change. The handle wrote a rectangle, which
                  made the plan draw a bigger slab, the Increment ignored, and nothing else ever
                  read: "what's the point of expanding the trees?" How big the plants grew is a
                  choice about the plants, and it is made on the strip. */}
              {on && onSetSize && !isPlanting(b.item) && (b.item.category === 'enclosure' || b.item.category === 'flora') && (
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

        {/* The ground the thing in your hand is allowed to stand on, while you are holding it.
            "Outside the Big Cats area" is a true refusal about a boundary that is drawn faintly and
            named once, in grey, at the other end of it. So while something is in the air its own
            area is outlined and labelled - the refusal has something to point at. Reported from a
            play-through: "it is about the zone boundary, which is also invisible." */}
        {placing && (() => {
          const zone = state.backlog.find((it) => it.id === placing.id)?.zone;
          const plot = plotFor(state, zone);
          if (!plot) return null;
          // Lit the moment something is picked up, not once the pointer has moved: the question
          // "where does this go?" is asked before the first move, not after it.
          const ok = !ghost || ghost.ok;
          return (
            <g data-part="its-ground" pointerEvents="none">
              <rect x={plot.x0} y={plot.y0} width={plot.x1 - plot.x0} height={plot.y1 - plot.y0} rx={8}
                fill="none" stroke={ok ? '#059669' : '#dc2626'} strokeWidth={3} strokeDasharray="12 8" />
              <text x={plot.x0 + 12} y={plot.y0 + 26} fontSize={ch(15)} fontWeight={800}
                fill={ok ? '#047857' : '#b91c1c'}>{zone}</text>
            </g>
          );
        })()}

        {/* What is being placed or moved, with the park's verdict on it. */}
        {ghost && (
          <g data-part="ghost" pointerEvents="none">
            <rect x={ghost.x - ghost.w / 2} y={ghost.y - ghost.h / 2} width={ghost.w} height={ghost.h} rx={6}
              fill={ghost.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}
              stroke={ghost.ok ? '#059669' : '#dc2626'} strokeWidth={3} />
            {/* WHAT is being put down, not only whether it may go here. With two things in Doing it
                is the whole question: reported from playing it, somebody placing the Entrance was
                told "outside the Big Cats area" - which was true, and was about the Lion they were
                still holding. A refusal that does not name what it refused is a puzzle. */}
            {placing && (
              <text x={ghost.x} y={ghost.y - ghost.h / 2 - 8} textAnchor="middle"
                fontSize={ch(13)} fontWeight={700} fill={ghost.ok ? '#047857' : '#b91c1c'}>
                {state.backlog.find((it) => it.id === placing.id)?.name ?? 'Put it down'}
              </text>
            )}
            {!ghost.ok && ghost.why && (
              <text x={ghost.x} y={ghost.y} textAnchor="middle" fontSize={ch(14)} fontWeight={700} fill="#b91c1c">{ghost.why}</text>
            )}
            {/* ...and where it is going, when that is the point of the gesture. An animal is moving
                INTO something, and the thing it is moving into used to be drawn as the reason it
                could not. */}
            {ghost.ok && ghost.into && (
              <text x={ghost.x} y={ghost.y} textAnchor="middle" fontSize={ch(13)} fontWeight={700} fill="#047857">
                into {ghost.into}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
