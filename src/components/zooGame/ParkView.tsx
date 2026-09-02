import { Suspense, lazy, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref, useLayoutEffect, useRef, useState } from 'react';
import type { ZooGameState, BacklogItem, ZooConnector, ConnectorEnd } from './types';
/** The isometric view of the same park. Lazily imported: it carries the isometric artwork, which
 *  is more than half of what the game weighs, and nobody needs it until they ask to look. */
const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));
import { ENCLOSURE_SIZE, footprintFor, applyPiece, pieceByKey  } from './design';
import { presetFor, pathWidthPx, GRID_W, GRID_H, enclosureShapePoints, enclosureWater, enclosureFlora, isLandscapeType, floraDefaultColors, shade, type ItemDesign, type WaterFeature, type EnclosureFlora } from './design';
import { ItemToolbar, type CopySource } from './ItemToolbar';
import { PATH_STYLES, pathStyleFor, type PathStyle } from './pathStyles';
import type { SegmentId } from './simulation/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { themeFor, type ZoneTheme } from './zoneTheme';
import { zoneSlices, zooIsOpen } from './engine';
import { autoLayout, parkBounds, shapeEdge, CANVAS_W, PLAY_H } from './parkLayout';
import { groupMembers } from './design';
import { standingOnPark, restingPlace, habitatSpot, workingDesign as workingFor } from './parkModel';
import { Users, Smile, LayoutGrid, PawPrint, Store, Move, Check, X, ChevronDown, Sparkles, Spline, Trash2, Minus, Plus, RotateCw, TrafficCone, Lock, Map, Box, Eye } from 'lucide-react';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';
import * as BP from './blueprint';

// ============= The Park View =============
//
// The visual payoff and the Product Goal surface: one top-down park scene. Each SPECIES
// lives in its own built enclosure (a habitat), with the animals you have delivered drawn
// to scale inside it; amenities and planting sit on the grounds; visitors keep to the
// promenade. On the big Park tab the layout is FREE: drag any enclosure, building or
// planting to arrange your zoo (an animal moves with its enclosure). Positions are saved
// on the items, so the park is both a picture of delivered work and something you compose.


// Quick colours for connectors (path tan, plus a few clear signposting hues).
const CONNECTOR_COLORS = ['#c9a86a', '#8a5a2b', '#c9cdd2', '#e6842a', '#4a90d9', '#43a047', '#e5484d'];

/** A small swatch of a path surface (a gradient dot), reused in the picker trigger and list. */
function SurfaceSwatch({ style, size = 14 }: { style: PathStyle; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full border border-black/10" style={{ width: size, height: size, background: `linear-gradient(135deg, ${style.road}, ${style.edge})` }} aria-hidden />;
}

/** The path surface picker: a labelled dropdown (current surface named + swatch) rather than a
 *  row of anonymous colour dots, so it reads as "Surface: Gravel" and stays compact. */
function SurfacePicker({ current, onPick }: { current: PathStyle; onPick: (key: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Path surface"
          className={cn(FOCUS, "flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground")}>
          <span className="text-muted-foreground/80">Surface</span>
          <SurfaceSwatch style={current} />
          <span className="text-foreground">{current.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {PATH_STYLES.map((s) => (
          <button key={s.key} type="button" onClick={() => onPick(s.key)}
            className={cn(FOCUS, 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs', s.key === current.key ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted/50')}>
            <SurfaceSwatch style={s} />
            <span className="flex-1 text-left">{s.label}</span>
            {s.key === current.key && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Render one design (a creature or building) at a small scale.
 *
 *  A species we have a drawing for is drawn; the rest are still built out of coloured squares. The
 *  two live side by side on purpose - a zoo can hold a lion and a toucan long before every animal
 *  in the toolbox has been illustrated. */
function Sprite({ item, design, cell, cellH }: { item: BacklogItem; design: ItemDesign; cell: number;
  /** Cell height, where it differs from the width. Defaults to square. */
  cellH?: number }) {
  const w = Math.max(9, cell * GRID_W), h = Math.max(9, (cellH ?? cell) * GRID_H);
  const tone = BP.zoneInk(design.colors.foliage ?? design.colors.walls ?? BP.INK);
  if (item.category === 'exhibit') return <AnimalMark w={w} h={h} initial={item.name.trim()[0] ?? '?'} />;
  if (item.category === 'flora') return <PlantMark w={w} h={h} tone={tone} />;
  return <BuiltMark w={w} h={h} tone={tone} />;
}

/** An animal, marked rather than drawn: a ring where it stands, with the first letter of its name.
 *
 *  A plan does not draw a lion. It says there is a lion, and where. The drawn lion - the one worth
 *  looking at - is in the isometric view, which is the whole reason this view stopped trying. */
function AnimalMark({ w, h, initial }: { w: number; h: number; initial: string }) {
  const d = Math.max(9, Math.min(w, h));
  return (
    <svg width={d} height={d} viewBox="0 0 24 24" aria-hidden style={{ overflow: 'visible' }}>
      <circle cx="12" cy="12" r="10" fill="rgba(12,44,71,0.75)" stroke={BP.INK} strokeWidth="1.6" />
      <text x="12" y="16.5" textAnchor="middle" fill={BP.INK} fontSize="12" fontWeight="600"
        fontFamily="ui-sans-serif, system-ui">{initial.toUpperCase()}</text>
    </svg>
  );
}

/** Planting: the symbol a plan uses for a tree - a circle with its centre marked. */
function PlantMark({ w, h, tone }: { w: number; h: number; tone: string }) {
  const d = Math.max(8, Math.min(w, h));
  return (
    <svg width={d} height={d} viewBox="0 0 24 24" aria-hidden style={{ overflow: 'visible' }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={tone} strokeWidth="1.4" strokeDasharray="3 2" />
      <circle cx="12" cy="12" r="1.8" fill={tone} />
    </svg>
  );
}

/** Rock, on a plan: an angular outline, because that is what tells it from a shrub at a glance.
 *  A circle is a plant; a broken polygon is stone. */
function RockMark({ w, h, tone }: { w: number; h: number; tone: string }) {
  const d = Math.max(8, Math.min(w, h));
  return (
    <svg width={d} height={d} viewBox="0 0 24 24" aria-hidden style={{ overflow: 'visible' }}>
      <polygon points="4,17 8,7 15,5 20,11 18,18" fill="none" stroke={tone} strokeWidth="1.4" strokeLinejoin="round" />
      <polyline points="8,7 12,13 18,18" fill="none" stroke={tone} strokeWidth="1" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

/** Anything built: a box with its corner cut, which is how a plan says "structure". */
function BuiltMark({ w, h, tone }: { w: number; h: number; tone: string }) {
  const cut = Math.min(w, h) * 0.28;
  return (
    <svg width={w} height={h} aria-hidden style={{ overflow: 'visible' }}>
      <polygon points={`0,0 ${w - cut},0 ${w},${cut} ${w},${h} 0,${h}`}
        fill="rgba(207,230,255,0.07)" stroke={tone} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1={w - cut} y1="0" x2={w} y2={cut} stroke={tone} strokeWidth="1.2" />
    </svg>
  );
}

/** A symbol for one thing planted or placed inside a habitat.
 *
 *  It used to ignore `type` altogether and mark everything as planting, so rocks in a lion
 *  enclosure were drawn on the plan as a shrub - the same fault the Increment had, in its own
 *  idiom. A plan marks what a thing IS; that is the whole of what a plan does. */
export function FloraSprite({ type, foliage, cell }: { type: string; foliage?: string; trunk?: string; cell: number }) {
  const d = Math.max(8, cell * GRID_W);
  const tone = BP.zoneInk(foliage ?? BP.INK);
  return type === 'rocks' ? <RockMark w={d} h={d} tone={tone} /> : <PlantMark w={d} h={d} tone={tone} />;
}

/** The type of a flora/scenery item (from its built design, or its toolbox template before build). */
const landType = (item: BacklogItem): string | undefined => item.design?.parts.type ?? item.template;
/** A landscape feature's footprint on the park: its saved size, or the default for its type. A
 *  river always spans the full width of the park - it flows across the land, fence to fence, with
 *  no gap at either end - so only its thickness is taken from a saved size. */
// The river rule now lives with the footprints, because the Sprint Review draws rivers too.
/** A smooth (vector) wavy line: `n` samples of `yAt` across the width, as an SVG points string.
 *  Drawing scenery as vectors instead of a stretched pixel grid keeps it smooth at any size. */
function wavePoints(w: number, n: number, yAt: (t: number) => number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => [(w * i) / n, yAt(i / n)] as [number, number]);
}
const ptsStr = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** The smooth vector shape for a landscape feature at a given footprint. Scenery is drawn as SVG
 *  (curves, ellipses) rather than a blown-up pixel grid, so a river's banks stay smooth however
 *  wide it is stretched. Colours come from the player's design (primary fill, secondary trim). */
export function LandscapeShape({ type, w, h, primary, secondary }: { type: string; w: number; h: number; primary: string; secondary: string }) {
  const common = { width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: { display: 'block' as const }, shapeRendering: 'geometricPrecision' as const };
  if (type === 'river') {
    // Read as water, not a road: a body of water with soft (bluish, not black) edges and a few
    // lighter ripple lines drifting along the current - no hard shoulders, no single centre line.
    const mid = h / 2, amp = Math.min(h * 0.07, 6), band = h * 0.4;
    const n = Math.max(20, Math.min(240, Math.round(w / 12)));
    const wave = (t: number, ph = 0) => amp * Math.sin(t * Math.PI * 6 + ph);
    const top = wavePoints(w, n, (t) => mid - band + wave(t));
    const bot = wavePoints(w, n, (t) => mid + band + wave(t));
    const ripple = (frac: number, ph: number) => wavePoints(w, n, (t) => mid + band * frac + wave(t, ph));
    return (
      <svg {...common} aria-hidden>
        <defs>
          <linearGradient id={`riv-${w}-${h}-${primary.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shade(primary, -14)} />
            <stop offset="45%" stopColor={shade(primary, 8)} />
            <stop offset="100%" stopColor={shade(primary, -14)} />
          </linearGradient>
        </defs>
        <polygon points={ptsStr([...top, ...[...bot].reverse()])} fill={`url(#riv-${w}-${h}-${primary.replace('#','')})`} />
        <polyline points={ptsStr(ripple(-0.45, 0.6))} fill="none" stroke={shade(primary, 30)} strokeWidth={Math.max(1.2, h * 0.045)} strokeLinecap="round" opacity={0.5} />
        <polyline points={ptsStr(ripple(0.1, 2.2))} fill="none" stroke={shade(primary, 24)} strokeWidth={Math.max(1, h * 0.04)} strokeLinecap="round" opacity={0.45} />
        <polyline points={ptsStr(ripple(0.5, 3.6))} fill="none" stroke={shade(primary, 18)} strokeWidth={Math.max(1, h * 0.035)} strokeLinecap="round" opacity={0.4} />
      </svg>
    );
  }
  if (type === 'pond' || type === 'fountain') {
    const cx = w / 2, cy = h / 2, rx = (w / 2) * 0.94, ry = (h / 2) * 0.94;
    return (
      <svg {...common} aria-hidden>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={secondary} />
        <ellipse cx={cx} cy={cy} rx={rx * 0.8} ry={ry * 0.8} fill={primary} />
        {type === 'fountain' && <ellipse cx={cx} cy={cy} rx={rx * 0.28} ry={ry * 0.28} fill={secondary} />}
        <ellipse cx={cx - rx * 0.32} cy={cy - ry * 0.36} rx={rx * 0.22} ry={ry * 0.14} fill={shade(primary, 26)} opacity={0.85} />
      </svg>
    );
  }
  if (type === 'rocks') {
    return (
      <svg {...common} aria-hidden>
        <ellipse cx={w * 0.34} cy={h * 0.62} rx={w * 0.28} ry={h * 0.3} fill={shade(primary, -10)} />
        <ellipse cx={w * 0.66} cy={h * 0.52} rx={w * 0.32} ry={h * 0.38} fill={primary} />
        <ellipse cx={w * 0.5} cy={h * 0.76} rx={w * 0.24} ry={h * 0.2} fill={shade(primary, 10)} />
        <ellipse cx={w * 0.62} cy={h * 0.4} rx={w * 0.12} ry={h * 0.1} fill={shade(primary, 22)} opacity={0.8} />
      </svg>
    );
  }
  if (type === 'hedge') {
    const r = Math.min(w, h) * 0.14;
    const bumps = Math.max(3, Math.round(w / (h * 0.7)));
    return (
      <svg {...common} aria-hidden>
        <rect x={w * 0.02} y={h * 0.3} width={w * 0.96} height={h * 0.66} rx={r} fill={primary} />
        {Array.from({ length: bumps }, (_, i) => (
          <circle key={i} cx={w * ((i + 0.5) / bumps)} cy={h * 0.34} r={h * 0.24} fill={shade(primary, 12)} />
        ))}
        <rect x={w * 0.02} y={h * 0.82} width={w * 0.96} height={h * 0.14} rx={r * 0.6} fill={shade(primary, -16)} opacity={0.6} />
      </svg>
    );
  }
  if (type === 'entrance') {
    const postW = Math.max(4, w * 0.1);
    return (
      <svg {...common} aria-hidden>
        <rect x={w * 0.08} y={h * 0.22} width={postW} height={h * 0.72} rx={postW * 0.4} fill={secondary} />
        <rect x={w * 0.92 - postW} y={h * 0.22} width={postW} height={h * 0.72} rx={postW * 0.4} fill={secondary} />
        <rect x={w * 0.06} y={h * 0.08} width={w * 0.88} height={h * 0.28} rx={h * 0.1} fill={primary} />
        <rect x={w * 0.06} y={h * 0.28} width={w * 0.88} height={h * 0.06} fill={shade(primary, -18)} opacity={0.7} />
      </svg>
    );
  }
  // carpark
  const r = Math.min(w, h) * 0.06;
  const bays = Math.max(3, Math.round(w / (h * 0.55)));
  return (
    <svg {...common} aria-hidden>
      <rect x={w * 0.02} y={h * 0.06} width={w * 0.96} height={h * 0.88} rx={r} fill={primary} />
      {Array.from({ length: bays - 1 }, (_, i) => (
        <rect key={i} x={w * ((i + 1) / bays) - Math.max(1, w * 0.004)} y={h * 0.16} width={Math.max(2, w * 0.008)} height={h * 0.68} fill={secondary} opacity={0.85} />
      ))}
      <rect x={w * 0.14} y={h * 0.34} width={w * 0.16} height={h * 0.3} rx={h * 0.08} fill="#c0533b" />
    </svg>
  );
}

/** A landscape feature (river, pond, rocks, hedge...) drawn to fill a resizable box as smooth
 *  vector scenery, so it can be stretched right across the park without going blocky. */
function LandscapePlot({ item, w, h, rot = 0 }: { item: BacklogItem; w: number; h: number; rot?: number }) {
  const type = landType(item) ?? 'river';
  // Landscape keeps its real shape - a river still bends, a bridge is still a bridge - but it is
  // drawn in the sheet's own two colours rather than painted. Water is the one thing a plan does
  // colour in, because "there is water here" is a fact about the site.
  const wet = type === 'river' || type === 'pond' || type === 'fountain';
  const primary = wet ? BP.WATER_LINE : BP.INK;
  const secondary = wet ? BP.WATER_LINE : BP.INK_DIM;
  return (
    <div className="relative flex flex-col items-center">
      {/* Only the scenery turns - its name stays the right way up and under it, still readable. */}
      <div style={{ ...(rot ? { transform: `rotate(${rot}deg)` } : {}), opacity: wet ? 0.5 : 0.62 }}>
        <LandscapeShape type={type} w={w} h={h} primary={primary} secondary={secondary} />
      </div>
      <FeatureName name={item.name} />
    </div>
  );
}

/** Plan or Increment. Two ways of drawing one zoo, not two zoos.
 *
 *  The Plan is the drawing you build from. The Increment is what you have actually delivered - what
 *  a visitor would see - and it is the thing Scrum asks you to INSPECT. Naming it that is not
 *  decoration: "switch to isometric" is a rendering choice, "inspect the Increment" is the event. */
function ViewSwitch({ view, onView }: { view: 'plan' | 'iso'; onView: (v: 'plan' | 'iso') => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border" role="group" aria-label="How to draw the park">
      {([['plan', 'Plan', Map], ['iso', 'Increment', Box]] as const).map(([key, label, Icon]) => (
        <button key={key} type="button" onClick={() => onView(key)} aria-pressed={view === key}
          title={key === 'plan' ? 'The drawing, for laying out a route by hand' : 'The zoo as a visitor sees it'}
          className={cn(FOCUS, 'flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium transition-colors',
            view === key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

/** What one plant of an item looks like: the item's own design, or the piece this plant was given.
 *  A planting PBI is some planting, not one tree repeated, so each may be its own kind. */
function plantDesign(item: BacklogItem, piece?: string): ItemDesign {
  const base = item.design ?? item.draftDesign ?? presetFor(item);
  const p = pieceByKey(piece);
  return p ? applyPiece(base, p) : base;
}

/** A single feature on the grounds. Amenities (buildings) sit on a plot tile; planting (flora)
 *  is drawn as just the plant - a tree or bush needs no surround. */
export function Plot({ item, scale = 1, named = true, design }: { item: BacklogItem;
  /** Screen pixels per design pixel. The park draws at 1; the small overview draws smaller. */
  scale?: number;
  /** The design to draw it in. Given, it wins over the item's committed one - so a second tree put
   *  down while the first is still being built wears the colours you are choosing right now, rather
   *  than sitting there in the preset greys waiting for the item to be Done. */
  design?: ItemDesign;
  /** Extra placements of the same item say the name once, on the first one. Three trees from one
   *  PBI wearing three copies of "Big Cats Planting" is a label overlapping a label. */
  named?: boolean }) {
  // A feature is drawn at the size of the ground it stands on, surround included - so a cafe is
  // plainly a bigger thing than a kiosk, and a signpost is plainly a post.
  const fp = footprintFor(item);
  const pad = Math.max(1, Math.round(2 * scale));
  const cw = Math.max(0.5, (fp.w * scale - pad * 2) / GRID_W);
  const ch = Math.max(0.5, (fp.h * scale - pad * 2) / GRID_H);
  return (
    <div className="relative flex flex-col items-center">
      {/* The mark is the drawing - there is no plinth under it, because a plan does not build one. */}
      <div className="flex items-center justify-center" style={{ padding: pad }}>
        <Sprite item={item} design={design ?? item.design ?? presetFor(item)} cell={cw} cellH={ch} />
      </div>
      {named && <FeatureName name={item.name} />}
    </div>
  );
}

/** A feature's name, inside its own footprint and out of the pointer's way. */
function FeatureName({ name }: { name: string }) {
  return (
    <span className={cn(BP.LABEL, 'pointer-events-none absolute bottom-0 left-1/2 z-10 max-w-[140px] -translate-x-1/2 translate-y-[120%] truncate whitespace-nowrap')}
      style={{ color: BP.INK }}>{name}</span>
  );
}

const ENCLOSURE = ENCLOSURE_SIZE;
// A feature's name is drawn INSIDE its own footprint and ignores the pointer, so it never blocks
// dragging, a resize handle or a path being drawn - and it adds nothing to the feature's box.
const LABEL_H = 0;

/** A built enclosure (habitat) with the animals that live in it rendered to scale
 *  inside - one sprite per animal the team has actually built and opened, so you see
 *  "lions in a space", not one huge lion, and never more animals than were built. */
/** The habitat box in its chosen shape (rounded rectangle, pill, round, hexagon, octagon), with
 *  the ground fill and fence outline. Rounded keeps the crisp bordered div; the other shapes are
 *  drawn as an SVG outline so the fence follows the shape. Contents (animals, water) overlay it. */
export function EnclosureBox({ shape, w, h, ground, fence, border = 2, children, boxRef }:
  { shape: string; w: number; h: number; ground: string; fence: string; border?: number; children?: ReactNode; boxRef?: Ref<HTMLDivElement> }) {
  const points = enclosureShapePoints(shape, w, h, border);
  // On a plan the ground and the fence are not paint - they are a wash and a line. The colours
  // chosen on the bench still decide them, so what you picked is still what you see; it is drawn
  // the way a drawing draws it. What it really looks like is the other view's job.
  const line = BP.zoneInk(fence);
  const wash = BP.zoneWash(ground);
  return (
    <div ref={boxRef} className="relative" style={{ width: w, height: h }}>
      {shape === 'rounded' || !shape ? (
        <div className="absolute inset-0 overflow-hidden rounded-sm"
          style={{ background: wash, border: `${border}px solid ${line}` }} />
      ) : (
        <svg className="absolute inset-0" width={w} height={h} aria-hidden>
          {shape === 'circle'
            ? <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - border} ry={h / 2 - border} fill={wash} stroke={line} strokeWidth={border} />
            : shape === 'pill'
              ? <rect x={border} y={border} width={w - 2 * border} height={h - 2 * border} rx={(h - 2 * border) / 2} fill={wash} stroke={line} strokeWidth={border} />
              : <polygon points={points ?? ''} fill={wash} stroke={line} strokeWidth={border} strokeLinejoin="round" />}
        </svg>
      )}
      {/* Corner ticks, the way a dimensioned box is marked up on a drawing. They also say which
          shape a habitat is when the shape itself is a faint line. */}
      <svg className="absolute inset-0 overflow-visible" width={w} height={h} aria-hidden>
        {([[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]] as const).map(([x, y, sx, sy], i) => (
          <path key={i} d={`M ${x} ${y + sy * 7} L ${x} ${y} L ${x + sx * 7} ${y}`}
            fill="none" stroke={line} strokeWidth={1.5} />
        ))}
      </svg>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/** The enclosure's name shown as a little sign at the top of the habitat. Click it (on the big
 *  Park tab) to rename the enclosure inline. Read-only in the small live views. */
function EnclosureSign({ name, onRename }: { name: string; onRename?: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const stop = (e: ReactPointerEvent) => e.stopPropagation(); // don't start dragging the enclosure
  const commit = () => { setEditing(false); onRename?.(val); };
  // A name on a drawing is written on the drawing, not nailed to a post.
  const cls = cn(BP.LABEL, 'max-w-[140px] truncate bg-transparent px-1 text-center leading-tight text-[#eaf4ff]');
  return (
    // Below the habitat, not on it. Sitting at the top-centre it covered the fence exactly where
    // you would reach for it, and on a construction site it fought the BUILDING badge. Absolutely
    // positioned so it stays out of the flow - the habitat box still centres on the feature's
    // position, which is what the perimeter paths and connector anchors are measured from.
    <div className="absolute left-1/2 top-full z-20 mt-0.5 -translate-x-1/2">
      {editing ? (
        <input autoFocus value={val} onPointerDown={stop}
          onChange={(e) => setVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(name); setEditing(false); } }}
          className={cn(cls, 'w-[120px] outline-none ring-2 ring-amber-500')} />
      ) : onRename ? (
        <button type="button" title="Rename this enclosure" onPointerDown={stop}
          onClick={() => { setVal(name); setEditing(true); }}
          className={cn(FOCUS, cls, 'cursor-text hover:bg-amber-100')}>{name}</button>
      ) : (
        <span className={cls}>{name}</span>
      )}
    </div>
  );
}

/** A small editable name under an animal, so you can name your lion "Leo" - naming builds
 *  attachment. Reveals on hover; click to rename. */
function AnimalName({ name, onRename }: { name: string; onRename?: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);
  const stop = (e: ReactPointerEvent) => e.stopPropagation(); // don't drag the animal
  const commit = () => { setEditing(false); const t = val.trim(); if (t) onRename?.(t); };
  const cls = cn(BP.LABEL, 'max-w-[84px] truncate bg-transparent px-1 text-[9px] leading-[1.6] text-[#eaf4ff]');
  return (
    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-0.5 flex -translate-x-1/2 justify-center">
      {editing ? (
        <input autoFocus value={val} onPointerDown={stop}
          onChange={(e) => setVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(name); setEditing(false); } }}
          className={cn(cls, 'pointer-events-auto w-[64px] outline-none ring-1 ring-emerald-500')} />
      ) : onRename ? (
        <button type="button" title="Name this animal" onPointerDown={stop}
          onClick={() => { setVal(name); setEditing(true); }}
          className={cn(FOCUS, cls, 'pointer-events-auto cursor-text opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white')}>{name}</button>
      ) : (
        <span className={cls}>{name}</span>
      )}
    </div>
  );
}

function Enclosure({ enc, animals, plants = [], theme, design, onSetDesign, onSelectPart, building, onSetSpot, onSetMemberSpot, onUnnest, onRename }: { enc: BacklogItem; animals: BacklogItem[]; plants?: BacklogItem[]; theme: ZoneTheme; design?: ItemDesign; onSetDesign?: (d: ItemDesign) => void; onSelectPart?: (key: string) => void; building?: boolean; onSetSpot?: (id: string, spot: { x: number; y: number }) => void; onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void; onUnnest?: (id: string) => void; onRename?: (id: string, name: string) => void }) {
  const cfg = ENCLOSURE[enc.enclosureSize ?? 'medium'];
  const d = design ?? enc.design;
  const ground = d?.colors.ground ?? theme.plot;
  const fence = d?.colors.fence ?? theme.plotBorder;
  // One exhibit item can hold a whole group, so the count is the animals in it rather than the
  // number of Backlog items standing here.
  const stock = animals.flatMap((a) => groupMembers((a.design ?? a.draftDesign)?.group).map((m, k) => ({ a, ...m, k })));
  const n = stock.length;
  const cell = n >= 6 ? 1 : 2; // more animals share the space, so each is drawn smaller
  const boxRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; member: number; x: number; y: number } | null>(null);
  // A content item keeps its dragged spot; an animal without one auto-arranges along the floor.
  // Where an animal stands is decided in one place, shared with the Increment view - see parkModel.
  const spotOf = (a: BacklogItem, i: number, member = 0) => {
    // Rounded where it becomes a percentage rather than where it is worked out: the model deals in
    // fractions of a habitat, and 0.62 - 0.06 lands a hair off 0.56 in binary, which is invisible on
    // the park and very visible in a diff.
    const f = habitatSpot(a, i, n, member, cfg);
    return { left: Math.round(f.x * 1000) / 10, top: Math.round(f.y * 1000) / 10 };
  };
  const clampSpot = (p: { x: number; y: number }) => ({ x: clamp(p.x, 0.08, 0.92), y: clamp(p.y, 0.1, 0.94) });

  // Drag a content item (animal or planted flora) to a spot inside its enclosure. Coordinates come
  // from the habitat box, so it works regardless of the park's zoom; stopPropagation keeps the
  // whole enclosure from moving. A plant released well outside the box is taken back out (un-nested).
  const startSpotDrag = (e: ReactPointerEvent, id: string, unnestable: boolean, member?: number) => {
    if (!onSetSpot) return;
    e.stopPropagation();
    e.preventDefault();
    const raw = (ev: { clientX: number; clientY: number }) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r) return null;
      return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height };
    };
    const move = (ev: globalThis.PointerEvent) => { const p = raw(ev); if (p) { const c = clampSpot(p); setDrag({ id, member: member ?? -1, x: c.x, y: c.y }); } };
    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const p = raw(ev);
      if (p) {
        const outside = p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05;
        if (unnestable && outside && onUnnest) onUnnest(id);
        // An ANIMAL goes to its own spot - one of a family is one of a family, and arranging them is
        // the point. A plant has no family, so it is the whole thing being put somewhere.
        else if (member !== undefined && onSetMemberSpot) onSetMemberSpot(id, member, clampSpot(p));
        else onSetSpot(id, clampSpot(p));
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="relative flex flex-col items-center">
      <EnclosureBox shape={d?.parts.shape ?? 'rounded'} w={cfg.w} h={cfg.h} ground={ground} fence={fence} boxRef={boxRef}>
        {/* Pick a part by touching it. The rim is the fence, the middle is the ground - both sit
            behind the animals and the planting, so they only catch what nothing else wanted.
            These deliberately do NOT stop the event: it has to carry on up to the enclosure, which
            is what starts a drag. Swallowing it here made the whole habitat undraggable - every
            pointer landing inside the fence chose a part instead of picking the thing up, so an
            enclosure could only be moved by the few pixels of its own label. */}
        {onSelectPart && <>
          <div className="absolute inset-0 z-0" title="Fence" onPointerDown={() => onSelectPart('fence')} />
          <div className="absolute inset-[11px] z-0" title="Ground" onPointerDown={() => onSelectPart('ground')} />
        </>}
        {/* Water and planting are arranged HERE, in the habitat, at the size they will really be -
            drag to move, drag the corner to resize, hover for the ×. While the item is being built
            they are editable; once it is live they are just part of the park. */}
        {d && enclosureWater(d).map((wf, i) => {
          const water = enclosureWater(d);
          const set = (next: WaterFeature[]) => onSetDesign?.({ ...d, water: next });
          return (
            <div key={i} className={cn('group absolute', onSetDesign && 'z-[2]')}
              style={{ left: `${wf.x * 100}%`, top: `${wf.y * 100}%`, width: `${wf.w * 100}%`, height: `${wf.h * 100}%`, touchAction: onSetDesign ? 'none' : undefined }}>
              <div onPointerDown={onSetDesign ? dragFraction(cfg, (dx, dy) => set(water.map((w2, j) => j !== i ? w2 : { ...w2, x: clampF(wf.x + dx, 0, 1 - wf.w), y: clampF(wf.y + dy, 0, 1 - wf.h) })), () => onSelectPart?.('water')) : undefined}
                className={cn('h-full w-full rounded-full', onSetDesign && 'cursor-grab active:cursor-grabbing')}
                style={{ background: BP.WATER_FILL, border: `1.5px solid ${BP.WATER_LINE}` }} />
              {onSetDesign && <>
                <button type="button" aria-label="Remove water feature" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); set(water.filter((_, j) => j !== i)); }}
                  className={cn(FOCUS, "absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold leading-none text-red-600 shadow group-hover:flex")}>&times;</button>
                <div onPointerDown={dragFraction(cfg, (dx, dy) => set(water.map((w2, j) => j !== i ? w2 : { ...w2, w: clampF(wf.w + dx, 0.08, 1 - wf.x), h: clampF(wf.h + dy, 0.08, 1 - wf.y) })))}
                  className="absolute -bottom-0.5 -right-0.5 hidden h-3 w-3 cursor-nwse-resize rounded-full border-2 border-sky-600 bg-white group-hover:block" />
              </>}
            </div>
          );
        })}
        {/* Planting and habitat features that are part of the enclosure's own design. */}
        {d && enclosureFlora(d).map((fl, i) => {
          const flora = enclosureFlora(d);
          const set = (next: EnclosureFlora[]) => onSetDesign?.({ ...d, flora: next });
          return (
            <div key={`fl-${i}`} className="group absolute" style={{ left: `${fl.x * 100}%`, top: `${fl.y * 100}%`, transform: 'translate(-50%,-50%)', zIndex: onSetDesign ? 2 : 0, touchAction: onSetDesign ? 'none' : undefined }}>
              <div onPointerDown={onSetDesign ? dragFraction(cfg, (dx, dy) => set(flora.map((f2, j) => j !== i ? f2 : { ...f2, x: clampF(fl.x + dx, 0.05, 0.95), y: clampF(fl.y + dy, 0.08, 0.95) })), () => onSelectPart?.(`flora:${i}:foliage`)) : undefined}
                className={cn(onSetDesign && 'cursor-grab active:cursor-grabbing')} style={{ transform: `scale(${fl.s})`, transformOrigin: 'center' }}>
                <FloraSprite type={fl.type} foliage={fl.foliage ?? floraDefaultColors(fl.type).foliage} trunk={fl.trunk ?? floraDefaultColors(fl.type).trunk} cell={cell} />
              </div>
              {onSetDesign && <>
                <button type="button" aria-label="Remove planting" onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); set(flora.filter((_, j) => j !== i)); }}
                  className={cn(FOCUS, "absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-white text-[11px] font-bold leading-none text-red-600 shadow group-hover:flex")}>&times;</button>
                <div onPointerDown={dragFraction(cfg, (dx, dy) => set(flora.map((f2, j) => j !== i ? f2 : { ...f2, s: clampF(fl.s + (dx + dy) * 1.5, 0.5, 2.6) })))}
                  className="absolute -bottom-1 -right-1 hidden h-3 w-3 cursor-nwse-resize rounded-full border-2 border-emerald-600 bg-white group-hover:block" />
              </>}
            </div>
          );
        })}
        {!building && n === 0 && plants.length === 0 && (!d || enclosureFlora(d).length === 0) && <div className={cn(BP.LABEL, 'absolute inset-0 flex items-center justify-center')} style={{ color: BP.INK_DIM }}>empty</div>}
        {/* Planting sits behind the animals; drag it within, or out of the fence to remove it. */}
        {plants.map((pl) => {
          const p = drag?.id === pl.id ? { left: drag.x * 100, top: drag.y * 100 } : { left: (pl.spot?.x ?? 0.5) * 100, top: (pl.spot?.y ?? 0.4) * 100 };
          return (
            <div key={pl.id} title={onSetSpot ? `${pl.name} - drag within, or out of the fence to remove` : undefined}
              className={cn('absolute', onSetSpot && 'cursor-grab active:cursor-grabbing')}
              onPointerDown={(e) => startSpotDrag(e, pl.id, true)}
              style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: drag?.id === pl.id ? 3 : 0, touchAction: onSetSpot ? 'none' : undefined }}>
              <Sprite item={pl} design={pl.design ?? presetFor(pl)} cell={cell} />
            </div>
          );
        })}
        {stock.map(({ a, kind, scale, k }, i) => {
          // The first of a group keeps the item's dragged spot and wears the name; the rest of the
          // family arrange themselves around it. Dragging the lion moves the pride.
          // Every animal of a family can be put somewhere itself - the lioness by the water and the
          // cubs under the tree is a thing somebody arranges on purpose. Only the first of them
          // wears the name, or a pride is a label on top of a label.
          const lead = k === 0;
          const held = drag?.id === a.id && drag.member === k;
          const p = held ? { left: drag.x * 100, top: drag.y * 100 } : spotOf(a, i, k);
          return (
            <div key={`${a.id}-${k}`} className={cn('group absolute', onSetSpot && 'cursor-grab active:cursor-grabbing')}
              onPointerDown={(e) => startSpotDrag(e, a.id, false, k)}
              style={{ left: `${p.left}%`, top: `${p.top}%`, transform: 'translate(-50%,-50%)', zIndex: held ? 3 : 1, touchAction: onSetSpot ? 'none' : undefined }}>
              {/* Gentle idle bob so the animals feel alive; each desynced by a stable per-animal delay. */}
              <div>
                <Sprite item={a} design={a.design ?? a.draftDesign ?? presetFor(a)} cell={Math.max(1, Math.round(cell * scale * 10) / 10)} />
              </div>
              {lead && <AnimalName name={a.name} onRename={onRename ? (nm) => onRename(a.id, nm) : undefined} />}
              <span className="sr-only">{kind}</span>
            </div>
          );
        })}
      </EnclosureBox>
      <EnclosureSign name={enc.name} onRename={onRename ? (name) => onRename(enc.id, name) : undefined} />
    </div>
  );
}

/** Designing in place. The park owns the surface; the game owns what a change means, so the toolbar
 *  hands every edit straight back rather than keeping a copy of the design to reconcile later. */
export interface EditApi {
  onDesign: (id: string, design: ItemDesign) => void;
  onSetEnclosure: (id: string, size: 'small' | 'medium' | 'large') => void;
  onToggleTask: (id: string, taskId: string) => void;
  onConfirmAc: (id: string, index: number, value: boolean) => void;
  onFinishBuild: (id: string) => void;
  onRelease: (id: string) => void;
  /** Turn the park to the Increment, with this item picked out.
   *
   *  Inspect and adapt, made into a button. The Increment is the thing Scrum asks you to inspect,
   *  and until now you could only reach it by noticing a toggle above the park - so the acceptance
   *  criteria were being judged from the drawing rather than from the thing that was built. */
  onInspect: (id: string) => void;
  copySources: (item: BacklogItem) => CopySource[];
  /** Planting is a set, and the set is chosen in the studio rather than by clicking a plus on a
   *  forty-pixel tree. Adding, changing and removing what an item plants. */
  onAddPlant: (id: string, piece?: string) => void;
  onSetPlantPiece: (id: string, index: number, piece: string) => void;
  onRemovePlant: (id: string, index: number) => void;
}

const clampF = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Drag a thing that lives INSIDE a habitat, where its position is a fraction of the box. Reports
 *  the movement as fractions of the habitat's own width and height, so it behaves the same whatever
 *  footprint the habitat has. stopPropagation keeps the whole enclosure from moving with it. */
function dragFraction(cfg: { w: number; h: number }, apply: (dx: number, dy: number) => void, onPick?: () => void) {
  return (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPick?.();
    const sx = e.clientX, sy = e.clientY;
    const move = (ev: globalThis.PointerEvent) => apply((ev.clientX - sx) / cfg.w, (ev.clientY - sy) / cfg.h);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
}

// ---- Features: the positionable things in the park (enclosures + amenities + planting) ----

interface Feature { item: BacklogItem; kind: 'enclosure' | 'plot' | 'site'; w: number; h: number; animals: BacklogItem[]; plants: BacklogItem[]; theme: ZoneTheme }

/** Work under way, on the ground it will occupy: hoardings round a plot, with the item's name on
 *  the board. Visitors never see inside - the Definition of Done is what takes the hoardings down. */
function ConstructionSite({ item, w, h, selected, children }: { item: BacklogItem; w: number; h: number; selected?: boolean; children?: ReactNode }) {
  // What has been made so far, drawn full size inside the hoardings: change a colour on the toolbar
  // and it lands here, on the ground it will occupy. That is the whole point of building in place -
  // there is no preview, because the thing itself is what you are looking at.
  return (
    <div className="relative" style={{ width: w, height: h }}>
      {/* The hoardings: they stand AROUND the work rather than over it, and they come down when it
          is Done and released. Visitors never see inside. */}
      <div className={cn('absolute -inset-1.5 rounded-lg border-2 border-dashed', selected ? 'border-primary' : 'border-amber-500/70')}
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(245,158,11,0.14) 0 8px, rgba(245,158,11,0.04) 8px 16px)' }} aria-hidden />
      {/* The kit that says "site" without a word on it: hazard posts at the corners and a cone at
          the gate. It all comes down when the item is released, which is the point - you can see
          from across the park what is finished and what is still being worked on. */}
      {[['-left-2.5 -top-2.5'], ['-right-2.5 -top-2.5'], ['-left-2.5 -bottom-2.5'], ['-right-2.5 -bottom-2.5']].map(([at]) => (
        <span key={at} className={cn('absolute h-2.5 w-2.5 rounded-[2px]', at)} aria-hidden
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#f59e0b 0 3px,#fff 3px 6px)', boxShadow: '0 1px 0 rgba(0,0,0,.2)' }} />
      ))}
      <TrafficCone className="absolute -bottom-3 left-1/2 h-4 w-4 -translate-x-1/2 text-amber-500 drop-shadow-sm" aria-hidden />
      <div className="relative flex h-full w-full items-center justify-center">
        {children ?? (
          <div className="pointer-events-none max-w-full px-1 text-center">
            <div className={cn(TONE.attention.text, "truncate text-[11px] font-semibold")}>{item.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Everything currently shown in the park, as positionable features. An enclosure appears
 *  once BUILT (Done or Open) - the habitat is there before its animals are released - with
 *  its open animals inside; amenities and planting appear when open. */
function buildFeatures(state: ZooGameState): Feature[] {
  // Show live items (open) plus any built item currently being placed on the park (done + placed) -
  // so you can position it and confirm its placement before marking it Deploy complete.
  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((it) => it.zone)]));
  const theme = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));
  // WHAT is on the park is decided in one place, shared with the isometric view - see parkModel.
  // All this has to do is say how the plan draws it.
  const feats: Feature[] = standingOnPark(state).map((s) => ({
    item: s.item,
    kind: s.underWay ? 'site' : s.item.category === 'enclosure' ? 'enclosure' : 'plot',
    w: s.size.w,
    h: s.size.h + LABEL_H,
    animals: s.animals,
    plants: s.plants,
    theme: theme(s.item.zone),
  }));
  return feats;
}

// The park is one of three columns now - Product Backlog, Sprint Backlog, product - so it is taller
// than it is wide. A landscape park squeezed into a third of the screen is a postage stamp; a
// portrait one uses the height it has. These are design pixels, scaled to whatever room it gets.
// A river is cut long enough to cross the park from any angle (past the corners on the diagonal)
// and is clipped by the park's edges, so turning it never leaves a gap at the ends.

const PATH_H = 40; // promenade band along the foot, where visitors stroll
// The park's own height, and it does not change. It used to be measured from wherever the lowest
// thing had ended up, which meant the park grew when you added a gift shop and the whole scene
// rescaled to fit the new height - so laying down one more thing resized everything you had already
// laid down. A zoo does not get bigger because you built a kiosk in it. Big enough for a full zoo
// laid out in rows, and everything is kept inside it.
const PERIM = 8;        // how far a perimeter path sits outside a feature's body
const PERIM_W = 7;      // perimeter / park-boundary path thickness
// On a plan a path is a line of a stated width, not a surface. Two thin rules and the ground
// showing between them says "footpath, this wide" more clearly than any amount of gravel.
const PATH_TAN = BP.FIELD; // a route is not filled: the sheet shows between its two edges
const PATH_EDGE = 'rgba(234,244,255,0.65)'; // the ruled line down each side of it

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The free-placement park canvas: a fixed design-sized scene scaled to fit, with each
 *  feature absolutely positioned and draggable. Dragging updates a live local position and
 *  commits to the item on release (so the layout persists). */
/** A grip you take hold of on the park. Out of the way until you want it - and "until you want it"
 *  cannot mean hover alone, because a tablet has no hover and this game is largely played on one. */
const HANDLE = 'absolute z-40 rounded-full border-2 border-emerald-600 bg-white opacity-0 shadow transition-opacity group-hover:opacity-100';

function FreeScene({ features, tool, editable, connectors, selectedConn, newConn, runStyle, justOpened, zoom = 1, building, onOpenBuild, edit, part: partProp, onPart, benched, onStartHere, onPlaceItem, onImprove, improving, onSetSpot, onSetMemberSpot, onSetSize, onSetRot, onMoveCopy, onRemoveCopy, onNest, onUnnest, onRename, onAddConnector, onUpdateConnector, onSelectConn }: {
  features: Feature[];
  justOpened?: string | null;
  tool: 'none' | 'connect';
  editable: boolean;
  zoom?: number;
  connectors: ZooConnector[];
  selectedConn: string | null;
  newConn: { thickness: number; color: string };
  /** The width and colour a run is laid at now - its pathway's, rather than whatever it was drawn
   *  with. Resolved by the caller, which is the one that has the Backlog. */
  runStyle: (c: ZooConnector) => { thickness: number; color: string };
  /** The item whose build inspector is open, so its site can show it is selected. */
  building?: string | null;
  /** Select an item on the park - its toolbar appears above it. */
  onOpenBuild?: (id: string | null) => void;
  /** Designing in place: what the toolbar for the selected item commits back to the game. */
  edit?: EditApi;
  /** Start a Sprint Backlog item by dropping its card here. */
  onStartHere?: (id: string, pos: { x: number; y: number }) => void;
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  onImprove?: (id: string) => void;
  improving?: Set<string>;
  onSetSpot?: (id: string, spot: { x: number; y: number }) => void;
  onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void;
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  onSetRot?: (id: string, rot: number) => void;
  onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void;
  onRemoveCopy?: (id: string, index: number) => void;
  onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void;
  onUnnest?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onAddConnector?: (c: ZooConnector) => void;
  onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void;
  onSelectConn?: (id: string | null) => void;
  /** Which part of the selected thing is picked out. Lifted out of here when the controls live off
   *  the park, so touching the ground out here still opens the ground's swatches over there. */
  part?: { id: string; key: string } | null;
  onPart?: (p: { id: string; key: string } | null) => void;
  /** The design controls live in a bench beside the park, so do not float them over it as well. */
  benched?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  // `fit` scales the park to the width it has to sit in; `zoom` is what the player asked for on top.
  const [fit, setFit] = useState(1);
  const scale = fit * zoom;
  const [drag, setDrag] = useState<{ id: string; pos: { x: number; y: number } } | null>(null);
  // Connector drawing: the first end that has been placed, plus any bends and the live cursor.
  const [draftA, setDraftA] = useState<ConnectorEnd | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const idc = useRef(0);
  const newId = () => `conn-${connectors.length}-${idc.current++}`;
  // What can be picked up and worked on: something under construction, or something built and
  // placed but not yet released. Once it is live it is the product, not the work.
  // Set by a feature's own pointerdown so the park underneath knows the press was already handled.
  // It has to be a flag rather than stopPropagation: Radix listens on the DOCUMENT for the click
  // that dismisses a popover, so swallowing the event left every colour palette stuck open.
  const handled = useRef(false);
  // Which part of the selected thing is picked out - kept with the item's id so it does not carry
  // over to the next thing you select.
  const [ownPart, setOwnPart] = useState<{ id: string; key: string } | null>(null);
  const part = onPart ? partProp ?? null : ownPart;
  const setPart = onPart ?? setOwnPart;
  const selectable = (f: Feature) => !!onOpenBuild && !!edit && (f.kind === 'site' || f.item.status === 'done');
  // The design as it stands: what was built, or the draft so far, or the shape it starts from - so
  // a site shows the real thing from the moment it is started rather than an empty plot. Shared
  // with the isometric view, which used to read the finished design only and so showed none of the
  // choices being made while a habitat was being built.
  const workingDesign = workingFor;

  const auto = autoLayout(features.map((f) => ({ id: f.item.id, w: f.w, h: f.h })));
  /** Where a feature sits when nothing is being dragged - its committed spot. The rule is shared
   *  with the isometric view, so the two drawings cannot disagree about where the zoo is. */
  const restPos = (f: Feature) => restingPlace(f.item, { w: f.w, h: f.h - LABEL_H }, auto);
  const posOf = (f: Feature) => (drag?.id === f.item.id ? drag.pos : restPos(f));
  const canvasH = PLAY_H + PATH_H;
  /** Where one of an item's plants is drawn. Its own place on the park - one planting item is
   *  several trees and they are not a formation, so moving the first does not move the rest. Held
   *  inside the park, which is clipped: a plant past the edge is not half on the grass, it is gone. */
  const copyPos = (c: { x: number; y: number }) => ({
    x: clamp(c.x, 10, CANVAS_W - 10),
    y: clamp(c.y, 10, canvasH - PATH_H - 10),
  });

  // The visible body box of a feature (the enclosure box / building tile, excluding the name label),
  // used for both its perimeter path and where connectors attach.
  const coreBox = (f: Feature) => { const c = posOf(f); const bh = f.h - LABEL_H; const cy = f.kind === 'enclosure' ? c.y : c.y - LABEL_H / 2; return { cx: c.x, cy, hw: f.w / 2, hh: bh / 2 }; };
  // --- Connector geometry: resolve each end (its feature's perimeter edge, or a free point) + the polyline.
  const boxOf = (id: string) => { const f = features.find((x) => x.item.id === id); return f ? coreBox(f) : null; };
  const anchor = (end: ConnectorEnd) => { const b = end.featureId ? boxOf(end.featureId) : null; return b ? { x: b.cx, y: b.cy } : { x: end.x, y: end.y }; };
  /** Only an enclosure or a building has a perimeter loop for a path to meet. Everything else - a
   *  bridge, a pond, a plot - is met flush, because a path that stops eight pixels short of the
   *  bridge it crosses to is a path with a gap in it. */
  const hasPerimeter = (id: string) => {
    const f = features.find((x) => x.item.id === id);
    return !!f && (f.kind === 'enclosure' || f.item.category === 'amenity');
  };
  /** The shape the perimeter loop round this feature is drawn in. */
  const shapeOf = (id: string) => {
    const f = features.find((x) => x.item.id === id);
    if (!f) return 'rounded';
    return f.kind === 'enclosure' ? (f.item.design?.parts.shape ?? f.item.draftDesign?.parts.shape ?? 'rounded') : 'rounded';
  };
  const resolveEnd = (end: ConnectorEnd, toward: { x: number; y: number }) => {
    const b = end.featureId ? boxOf(end.featureId) : null;
    if (!b) return { x: end.x, y: end.y };
    const out = end.featureId && hasPerimeter(end.featureId) ? PERIM : 0;
    return shapeEdge(shapeOf(end.featureId!), b.cx, b.cy, b.hw + out, b.hh + out, toward.x, toward.y);
  };
  // A feature's perimeter path (a loop just outside its body), following its shape. Enclosures use
  // their chosen shape; buildings use a rounded rectangle. Only enclosures and buildings get one.
  const perimeters = features.filter((f) => f.kind === 'enclosure' || f.item.category === 'amenity').map((f) => {
    const b = coreBox(f);
    const shape = f.kind === 'enclosure' ? (f.item.design?.parts.shape ?? 'rounded') : 'rounded';
    return { id: f.item.id, shape, x: b.cx - b.hw - PERIM, y: b.cy - b.hh - PERIM, w: b.hw * 2 + PERIM * 2, h: b.hh * 2 + PERIM * 2 };
  });
  const perimEl = (p: { id: string; shape: string; x: number; y: number; w: number; h: number }, stroke: string, width: number, key: string) => {
    const common = { fill: 'none' as const, stroke, strokeWidth: width, strokeLinejoin: 'round' as const };
    if (p.shape === 'circle') return <ellipse key={key} cx={p.x + p.w / 2} cy={p.y + p.h / 2} rx={p.w / 2} ry={p.h / 2} {...common} />;
    if (p.shape === 'pill') return <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.h / 2} {...common} />;
    if (p.shape === 'hexagon' || p.shape === 'octagon') return <polygon key={key} points={enclosureShapePoints(p.shape, p.w, p.h, 0) ?? ''} transform={`translate(${p.x},${p.y})`} {...common} />;
    return <rect key={key} x={p.x} y={p.y} width={p.w} height={p.h} rx={14} {...common} />;
  };
  // The park boundary: a rounded loop just inside the canvas, above the promenade.
  const boundary = { x: 10, y: 10, w: CANVAS_W - 20, h: canvasH - PATH_H - 16 };
  const boundaryEl = (stroke: string, width: number, key: string) => (
    <rect key={key} x={boundary.x} y={boundary.y} width={boundary.w} height={boundary.h} rx={22} fill="none" stroke={stroke} strokeWidth={width} />
  );
  const connPoints = (c: { a: ConnectorEnd; b: ConnectorEnd; bends: { x: number; y: number }[] }) => {
    const aToward = c.bends[0] ?? anchor(c.b);
    const bToward = c.bends[c.bends.length - 1] ?? anchor(c.a);
    return [resolveEnd(c.a, aToward), ...c.bends, resolveEnd(c.b, bToward)];
  };
  const toD = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Point (design px) from a pointer event, and the top-most feature under a point.
  const ptOf = (ev: { clientX: number; clientY: number }) => {
    const rect = inner.current!.getBoundingClientRect();
    const s = rect.width / CANVAS_W || 1;
    return { x: clamp((ev.clientX - rect.left) / s, 0, CANVAS_W), y: clamp((ev.clientY - rect.top) / s, 0, canvasH) };
  };
  const featureAt = (pt: { x: number; y: number }) => {
    for (let i = features.length - 1; i >= 0; i--) { const f = features[i]; const c = posOf(f); if (Math.abs(pt.x - c.x) <= f.w / 2 && Math.abs(pt.y - c.y) <= f.h / 2) return f; }
    return null;
  };
  const endAt = (pt: { x: number; y: number }): ConnectorEnd => { const f = featureAt(pt); return f ? { featureId: f.item.id, x: posOf(f).x, y: posOf(f).y } : { x: pt.x, y: pt.y }; };

  // Connect tool: click to place the first end, click a feature (or empty) to finish, empty clicks
  // in between drop a bend so you can route it by hand.
  const connectClick = (e: ReactPointerEvent) => {
    if (tool !== 'connect' || !onAddConnector) return;
    const pt = ptOf(e); const f = featureAt(pt);
    if (!draftA) { setDraftA(endAt(pt)); return; }
    if (f) { onAddConnector({ id: newId(), a: draftA, b: endAt(pt), bends: [], thickness: newConn.thickness, color: newConn.color }); setDraftA(null); setCursor(null); }
    else { onAddConnector({ id: newId(), a: draftA, b: endAt(pt), bends: [], thickness: newConn.thickness, color: newConn.color }); setDraftA(null); setCursor(null); }
  };

  // Drag a connector end or bend. Ends re-attach to a feature if released over one, else go free.
  const dragHandle = (id: string, part: 'a' | 'b' | number) => (e: ReactPointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const conn = connectors.find((c) => c.id === id); if (!conn || !onUpdateConnector) return;
    const move = (ev: PointerEvent) => {
      const pt = ptOf(ev);
      if (part === 'a' || part === 'b') onUpdateConnector(id, { [part]: { x: pt.x, y: pt.y } });
      else { const bends = conn.bends.slice(); bends[part] = pt; onUpdateConnector(id, { bends }); }
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      if (part === 'a' || part === 'b') onUpdateConnector(id, { [part]: endAt(ptOf(ev)) });
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  // Insert a bend by dragging a segment's midpoint.
  const dragNewBend = (id: string, segIndex: number, start: { x: number; y: number }) => (e: ReactPointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const conn = connectors.find((c) => c.id === id); if (!conn || !onUpdateConnector) return;
    const bends = conn.bends.slice(); bends.splice(segIndex, 0, start);
    onUpdateConnector(id, { bends });
    const move = (ev: PointerEvent) => { const b2 = bends.slice(); b2[segIndex] = ptOf(ev); onUpdateConnector(id, { bends: b2 }); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };


  // Scenery that is naturally a set. A river spans the park, so one is all there is.
  // A set can be put down more than once, and that includes WHILE it is being built - a PBI called
  // "Trees" is plural, and waiting until it is live to plant the second one is a rule nobody asked
  // for. Only a river is the exception: there is one, and it spans the park.
  const canCopy = (f: Feature) => (f.kind === 'plot' || f.kind === 'site') && f.item.category === 'flora' && landType(f.item) !== 'river';
  const [dropping, setDropping] = useState(false);
  // The toolbar's real width, so it can be kept inside the park. It changes with what is selected -
  // picking a plant adds that plant's colours - so a guessed half-width sent it off the left edge.
  const toolbar = useRef<HTMLDivElement>(null);
  const [tbW, setTbW] = useState(0);
  // And its height, so it can flip below the thing it belongs to when there is no room above.
  // Safe to measure and act on, unlike the width: the height follows from the width, and the width
  // is the park's, not the toolbar's position.
  const [tbH, setTbH] = useState(0);
  useLayoutEffect(() => {
    const el = toolbar.current;
    if (!el) return;
    // Ignore sub-pixel churn: a measurement that feeds a position must not react to noise.
    const measure = () => {
      setTbW((w) => (Math.abs(el.offsetWidth - w) > 1 ? el.offsetWidth : w));
      setTbH((h) => (Math.abs(el.offsetHeight - h) > 1 ? el.offsetHeight : h));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [building, part]);

  const startDrag = (e: ReactPointerEvent, f: Feature) => {
    // Touching something you can work on selects it, and it STAYS selected while you move it.
    // Without stopping the event here it reached the park behind, which cleared the selection - so
    // nudging an enclosure an inch to the left put the whole board back up over the park.
    // While a route is being drawn, a click on a habitat means "attach the path here" - it must not
    // also pick the habitat up onto the design bench, because that knocks the pathway off it and
    // stops the drawing. Attaching a path to anything was impossible for exactly this reason: every
    // attempt swapped the bench over and left you with a run floating in the grass.
    if (tool !== 'none') return;
    if (selectable(f)) {
      handled.current = true;
      if (building !== f.item.id) onOpenBuild?.(f.item.id);
    }
    if (!onPlaceItem) return;
    e.preventDefault();
    handled.current = true;
    const s = inner.current ? inner.current.getBoundingClientRect().width / CANVAS_W : scale || 1;
    const startX = e.clientX, startY = e.clientY;
    const origin = posOf(f);
    // Keep a feature inside the park - except one cut longer than the park itself (a river), which
    // is meant to run off the edges, so it is only held by its centre.
    const { minX, maxX, minY, maxY } = parkBounds(f);
    const at = (ev: PointerEvent) => ({
      x: clamp(origin.x + (ev.clientX - startX) / s, minX, maxX),
      y: clamp(origin.y + (ev.clientY - startY) / s, minY, maxY),
    });
    const move = (ev: PointerEvent) => {
      // Touching the ground to pick a habitat up chooses the ground as a part, which is right for a
      // tap and wrong the moment you start moving: nobody drags an enclosure across the park in
      // order to recolour its floor. Once it is genuinely moving, put the swatches away.
      if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) setPart(null);
      setDrag({ id: f.item.id, pos: at(ev) });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const drop = at(ev);
      // A plant dropped onto a built enclosure is planted inside it; otherwise it just moves.
      if (onNest && f.kind === 'plot' && f.item.category === 'flora') {
        const enc = features.find((g) => {
          if (g.kind !== 'enclosure') return false;
          const c = posOf(g);
          const left = c.x - g.w / 2, top = c.y - g.h / 2;
          return drop.x >= left && drop.x <= left + g.w && drop.y >= top && drop.y <= top + (g.h - LABEL_H);
        });
        if (enc) {
          const c = posOf(enc);
          const left = c.x - enc.w / 2, top = c.y - enc.h / 2;
          onNest(f.item.id, enc.item.id, { x: clamp((drop.x - left) / enc.w, 0.08, 0.92), y: clamp((drop.y - top) / (enc.h - LABEL_H), 0.1, 0.94) });
          setDrag(null);
          return;
        }
      }
      onPlaceItem(f.item.id, drop);
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    setDrag({ id: f.item.id, pos: origin });
  };

  // Resize a landscape feature's footprint by dragging an edge handle - length (how far it runs)
  // and width (how wide it is) are separate controls, so a river can run right across the park and
  // stay a slim band, or a car park spread out square. The dragged edge moves while the opposite
  // edge stays put (so lengthening a river grows it towards the far side, not from its middle);
  // the feature's centre shifts to hold that anchor. Free arranging, not a design change.
  const startResize = (e: ReactPointerEvent, f: Feature, axis: 'len' | 'wid') => {
    if (!onSetSize) return;
    e.preventDefault(); e.stopPropagation();
    const s = inner.current ? inner.current.getBoundingClientRect().width / CANVAS_W : scale || 1;
    const sx = e.clientX, sy = e.clientY, w0 = f.w, bandH0 = f.h - LABEL_H;
    const c0 = posOf(f);
    const leftEdge = c0.x - w0 / 2, topEdge = c0.y - f.h / 2;
    const move = (ev: PointerEvent) => {
      if (axis === 'len') {
        const w = Math.round(clamp(w0 + (ev.clientX - sx) / s, 40, Math.max(40, CANVAS_W - 8 - leftEdge)));
        onSetSize(f.item.id, { w, h: bandH0 });
        onPlaceItem?.(f.item.id, { x: leftEdge + w / 2, y: c0.y });
      } else {
        const h = Math.round(clamp(bandH0 + (ev.clientY - sy) / s, 24, Math.max(24, canvasH - PATH_H - 8 - topEdge - LABEL_H)));
        onSetSize(f.item.id, { w: w0, h });
        onPlaceItem?.(f.item.id, { x: c0.x, y: topEdge + (h + LABEL_H) / 2 });
      }
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // Turn a thing by dragging its handle round its centre.
  //
  // How freely depends on what it is, and that is not fussiness. Landscape is an organic shape - a
  // river at 37 degrees looks like a river - so it snaps to 15 degrees, with Shift for any angle at
  // all. A habitat or a building is a BOX, and everything in an isometric park shares two axes: that
  // shared grid is the look, and a cafe at 37 degrees stops agreeing with its own roof ridge, its
  // awning and the fence next door. So boxes go round in quarters, which is the turn anybody
  // actually wants anyway - the shop facing the path instead of away from it.
  const startRotate = (e: ReactPointerEvent, f: Feature) => {
    if (!onSetRot) return;
    e.preventDefault(); e.stopPropagation();
    const rect = inner.current?.getBoundingClientRect();
    const sc = rect ? rect.width / CANVAS_W : scale || 1;
    const c = posOf(f);
    const cx = (rect?.left ?? 0) + c.x * sc, cy = (rect?.top ?? 0) + c.y * sc;
    const move = (ev: PointerEvent) => {
      const deg = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      const boxy = f.item.category !== 'flora' || !isLandscapeType(landType(f.item));
      const step = boxy ? 90 : 15;
      onSetRot(f.item.id, ev.shiftKey && !boxy ? deg : ((Math.round(deg / step) * step) % 360 + 360) % 360);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  // Dragging one of an item's extra placements. Same maths as dragging the feature, but it writes
  // back to that copy rather than to the item's own position.
  const startCopyDrag = (e: ReactPointerEvent, f: Feature, index: number, from: { x: number; y: number }) => {
    if (!onMoveCopy || tool !== 'none') return;
    e.preventDefault(); e.stopPropagation();
    const sc = inner.current ? inner.current.getBoundingClientRect().width / CANVAS_W : scale || 1;
    const sx = e.clientX, sy = e.clientY;
    const move = (ev: PointerEvent) => onMoveCopy(f.item.id, index, {
      x: clamp(from.x + (ev.clientX - sx) / sc, 8, CANVAS_W - 8),
      y: clamp(from.y + (ev.clientY - sy) / sc, 8, canvasH - PATH_H - 8),
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const selected = connectors.find((c) => c.id === selectedConn) ?? null;

  // The plan draws the park. The car park is outside the fence and full of cars, which is a thing to
  // look at rather than a thing to lay out - it is in the isometric view, with the people who came
  // in them. The gate is marked on here, which is what a plan needs to say about arriving.
  const sceneH = canvasH;

  // Fit the WHOLE park, not just its width. Fitting to width alone meant a portrait park in a tall
  // column ran off the bottom, so you were scrolling to see your own zoo. The scale is whichever of
  // the two dimensions runs out first; zoom is what the player asks for on top of that.
  useLayoutEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const update = () => {
      const byWidth = v.clientWidth / CANVAS_W;
      // The room left below the park's own toolbar, in the pane it lives in.
      const pane = v.closest('.overflow-y-auto') as HTMLElement | null;
      const room = pane ? pane.getBoundingClientRect().bottom - v.getBoundingClientRect().top - 12 : 0;
      const byHeight = room > 140 ? room / sceneH : Infinity;
      setFit(Math.min(byWidth, byHeight));
    };
    const ro = new ResizeObserver(update);
    ro.observe(v);
    const pane = v.closest('.overflow-y-auto');
    if (pane) ro.observe(pane);
    update();
    return () => ro.disconnect();
  }, [sceneH]);

  // The guests walk in the isometric view now, on the same path network this used to build - it
  // moved with them, to parkNav's buildNav there. A plan does not need to know where people can
  // walk; it needs to show where the paths are, which it does by drawing them.

  return (
    // Zoomed in, the park is bigger than the space it has, so the viewport scrolls over it and the
    // panel keeps its height; zoomed out, the panel shrinks with the park rather than leaving a gap.
    <div ref={viewport} className="relative w-full overflow-auto" style={{ height: sceneH * fit * Math.min(zoom, 1) }}>
    <div ref={outer} className="relative" style={{ width: CANVAS_W * scale, height: sceneH * scale, margin: '0 auto' }}>
      <div ref={inner}
        onPointerDown={tool === 'connect' ? connectClick : (tool === 'none' ? () => { if (handled.current) { handled.current = false; return; } onSelectConn?.(null); onOpenBuild?.(null); } : undefined)}
        onPointerMove={tool === 'connect' ? (e) => setCursor(ptOf(e)) : undefined}
        // Dropping a card from the Sprint Backlog starts it here: the plot it lands on becomes its
        // construction site. The engine decides whether it may start at all.
        onDragOver={onStartHere ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropping(true); } : undefined}
        onDragLeave={onStartHere ? () => setDropping(false) : undefined}
        onDrop={onStartHere ? (e) => {
          e.preventDefault();
          setDropping(false);
          const id = e.dataTransfer.getData('text/plain');
          const box = inner.current?.getBoundingClientRect();
          if (!id || !box) return;
          const s2 = box.width / CANVAS_W;
          onStartHere(id, {
            x: clamp((e.clientX - box.left) / s2, 40, CANVAS_W - 40),
            y: clamp((e.clientY - box.top) / s2, 40, canvasH - PATH_H - 40),
          });
        } : undefined}
        className={cn('absolute left-0 top-0 overflow-hidden rounded-lg border', dropping && 'ring-4 ring-primary/40')}
        style={{ width: CANVAS_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: 'top left', cursor: tool === 'connect' ? 'crosshair' : undefined,
          borderColor: BP.INK_DIM, ...BP.gridPaint() }}>

        {/* The promenade, as a plan draws it: a band ruled off at the foot, not a paved surface. */}
        <div className="absolute inset-x-0 bottom-0" aria-hidden
          style={{ height: PATH_H, background: BP.FIELD_EDGE, borderTop: `1px dashed ${BP.INK_DIM}` }} />

        {/* Path layer: the park boundary, a perimeter walkway around each enclosure/building, and the
            manual connectors that join them. Attached connector ends follow their feature (posOf
            recomputes each render). Everything is drawn in two passes - all dark outlines first, then
            all tan bodies - so where paths meet, the bodies merge cleanly instead of one outline
            cutting through another. */}
        {(() => {
          // A run wears its pathway's width and colour as they are NOW, not as they were when it
          // was drawn. Changing the width on the bench and watching the path you already laid stay
          // stubbornly thin is the sort of thing that makes a control feel broken.
          const drawn = connectors.map((c) => ({ c: { ...c, ...runStyle(c) }, d: toD(connPoints(c)) }));
          return (
            <svg className="absolute inset-0 z-[5]" width={CANVAS_W} height={canvasH} style={{ pointerEvents: 'none' }}>
              {/* Outlines */}
              {boundaryEl(PATH_EDGE, PERIM_W + 2, 'bo')}
              {perimeters.map((p) => perimEl(p, PATH_EDGE, PERIM_W + 2, `po-${p.id}`))}
              {drawn.map(({ c, d }) => (
                <polyline key={`o-${c.id}`} points={d} fill="none" stroke={BP.zoneInk(c.color)} strokeWidth={c.thickness + 2} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {/* Bodies */}
              {boundaryEl(PATH_TAN, PERIM_W, 'bb')}
              {perimeters.map((p) => perimEl(p, PATH_TAN, PERIM_W, `pb-${p.id}`))}
              {/* The sheet, drawn back over the middle - so a route is two ruled lines with the
                  ground between them, at the width it was actually laid. */}
              {drawn.map(({ c, d }) => (
                <polyline key={`b-${c.id}`} points={d} fill="none" stroke={BP.FIELD} strokeWidth={c.thickness} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {selected && selectedConn && (
                <polyline points={toD(connPoints(selected))} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* Selection hit-lines (only while deploying, i.e. editable). */}
              {/* Selectable whether or not anything is being drawn: picking a path up to look at it
                  is not editing it, and a delivered route you cannot even point at is one you have
                  no way to ask about. */}
              {tool === 'none' && onSelectConn && drawn.map(({ c, d }) => (
                <polyline key={`h-${c.id}`} points={d} fill="none" stroke="transparent" strokeWidth={Math.max(20, c.thickness + 12)} strokeLinecap="round" strokeLinejoin="round"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onSelectConn(c.id); }} />
              ))}
              {/* Live preview while drawing a connector. */}
              {tool === 'connect' && draftA && cursor && (
                <polyline points={toD([resolveEnd(draftA, cursor), cursor])} fill="none" stroke={newConn.color} strokeWidth={newConn.thickness}
                  strokeLinecap="round" strokeLinejoin="round" opacity={0.65} strokeDasharray="7 6" />
              )}
            </svg>
          );
        })()}

        {/* Handles for the selected connector: drag the ends (re-attach or free), drag a bend to move
            it (double-click to remove), or drag a segment's midpoint dot to add a bend. */}
        {editable && tool === 'none' && selected && (() => {
          const pts = connPoints(selected);
          const mids = pts.slice(0, -1).map((p, i) => ({ x: (p.x + pts[i + 1].x) / 2, y: (p.y + pts[i + 1].y) / 2, seg: i }));
          return (
            <div className="absolute inset-0 z-[25]" style={{ pointerEvents: 'none' }}>
              {mids.map((m) => (
                <div key={`mid-${m.seg}`} onPointerDown={dragNewBend(selected.id, m.seg, { x: m.x, y: m.y })}
                  title="Drag to add a bend" className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-crosshair rounded-full border border-blue-400 bg-white/70"
                  style={{ left: m.x, top: m.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ))}
              {selected.bends.map((bd, i) => (
                <div key={`bend-${i}`} onPointerDown={dragHandle(selected.id, i)}
                  onDoubleClick={(e) => { e.stopPropagation(); onUpdateConnector?.(selected.id, { bends: selected.bends.filter((_, j) => j !== i) }); }}
                  title="Drag to move, double-click to remove" className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-blue-500 bg-white active:cursor-grabbing"
                  style={{ left: bd.x, top: bd.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ))}
              {(['a', 'b'] as const).map((k) => { const p = k === 'a' ? pts[0] : pts[pts.length - 1]; return (
                <div key={k} onPointerDown={dragHandle(selected.id, k)} title="Drag onto a feature to attach, or anywhere to free it"
                  className={cn('absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 bg-white active:cursor-grabbing', selected[k].featureId ? 'border-emerald-500' : 'border-blue-500')}
                  style={{ left: p.x, top: p.y, pointerEvents: 'auto', touchAction: 'none' }} />
              ); })}
            </div>
          );
        })()}

        {/* The gate, marked on the drawing. The decorative trees that used to stand either side of
            it are gone: they were scenery, and scenery is the other view's job. */}
        <div className={cn(BP.LABEL, 'absolute left-1/2 -translate-x-1/2')} style={{ bottom: 4, color: BP.INK_DIM }} aria-hidden>Entrance</div>

        {features.length === 0 && (
          <div className={cn(BP.LABEL, 'absolute inset-x-0 top-1/2 -translate-y-1/2 text-center')} style={{ color: BP.INK_DIM }}>Nothing drawn yet - build and open an enclosure and its animals</div>
        )}

        {/* Features - each absolutely positioned at its centre and draggable. */}
        {features.map((f) => {
          const p = posOf(f);
          const rest = restPos(f);
          const dragging = drag?.id === f.item.id;
          const queued = improving?.has(f.item.id);
          // A site as well as a plot: the handles that size and turn a landscape feature were only
          // drawn once it was live, so a bridge could not be made long enough to cross the river
          // while you were building the bridge. The footprint was always there - it is the same
          // measurement either way - only the grips for it were missing.
          const isLand = (f.kind === 'plot' || f.kind === 'site') && f.item.category === 'flora' && isLandscapeType(landType(f.item));
          /** The thing you are working on right now - its handles stay out, hover or no hover. */
          const working = building === f.item.id;
          /** Anything you can turn. Landscape swings to any angle; a habitat or a building goes
           *  round in quarters, and both want the same grip in the same place. */
          const turnable = isLand
            || (f.item.category === 'enclosure' || f.item.category === 'amenity');
          return (
            <div key={f.item.id}
              onPointerDown={(e) => startDrag(e, f)}
              // A tap selects it, and the toolbar for it appears above - the controls come to the
              // thing, rather than the thing being taken to a panel. Except while a route is being
              // drawn, when a tap means "attach the path here": there are two handlers on this box
              // and both had to be told, which is why guarding only the pointerdown was not enough.
              onClick={selectable(f) && tool === 'none' ? (e) => { e.stopPropagation(); onOpenBuild?.(f.item.id); } : undefined}
              className={cn('group absolute z-10 select-none', onPlaceItem ? 'cursor-grab active:cursor-grabbing' : '', dragging && 'z-30', justOpened === f.item.id && 'zoo-pop-in')}
              // A drag MOVES the element rather than re-laying it out. Setting left/top every frame
              // made the browser re-lay-out and repaint the whole park sixty times a second, and
              // Safari left the old paint behind as trails. Translating a promoted layer is one
              // composite step and leaves nothing behind.
              style={dragging
                ? { left: rest.x, top: rest.y, transform: `translate(-50%,-50%) translate3d(${p.x - rest.x}px,${p.y - rest.y}px,0)`, touchAction: 'none', willChange: 'transform', backfaceVisibility: 'hidden', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.25))' }
                : { left: p.x, top: p.y, transform: 'translate(-50%,-50%)', touchAction: 'none' }}>
              {/* Selected: the same blue frame a drawing tool puts round the thing you are working on. */}
              {building === f.item.id && f.kind !== 'site' && (
                <div className="pointer-events-none absolute -inset-1.5 z-20 rounded-lg border-2 border-sky-500" aria-hidden />
              )}
              {f.kind === 'site'
                ? (
                  <ConstructionSite item={f.item} w={f.w} h={f.h - LABEL_H} selected={building === f.item.id}>
                    {f.item.category === 'enclosure'
                      ? <Enclosure enc={f.item} animals={[]} plants={[]} theme={f.theme} design={workingDesign(f.item)} building
                        onSetDesign={edit && building === f.item.id ? (d) => edit.onDesign(f.item.id, d) : undefined}
                        onSelectPart={edit && building === f.item.id ? (key) => setPart({ id: f.item.id, key }) : undefined} onRename={onRename} />
                      : isLandscapeType(landType(f.item))
                      ? <LandscapePlot item={{ ...f.item, design: workingDesign(f.item) }} w={f.w} h={f.h - LABEL_H} rot={f.item.rot ?? 0} />
                      : <Plot item={{ ...f.item, design: workingDesign(f.item) }} />}
                  </ConstructionSite>
                )
                : f.kind === 'enclosure'
                ? <Enclosure enc={f.item} animals={f.animals} plants={f.plants} theme={f.theme}
                  onSetDesign={edit && building === f.item.id && f.item.status === 'done' ? (d) => edit.onDesign(f.item.id, d) : undefined}
                  onSelectPart={edit && building === f.item.id && f.item.status === 'done' ? (key) => setPart({ id: f.item.id, key }) : undefined}
                  onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onUnnest={onUnnest} onRename={onRename} />
                : isLand ? <LandscapePlot item={f.item} w={f.w} h={f.h - LABEL_H} rot={f.item.rot ?? 0} />
                : <Plot item={f.item} />}
              {/* The handles for arranging a landscape feature: length across, width down, and the
                  turn above it.

                  They used to appear on hover alone, which failed two ways. On a tablet there is no
                  hover at all, so on the machine this game is mostly played on they could not be
                  reached; and on a desktop you had to guess they were there before you could find
                  out they were there - "how do I turn the river? where is the control?". So they
                  also show whenever the thing is the one you are working on, which is exactly when
                  you want them and never when you do not. */}
              {turnable && tool === 'none' && !dragging && (
                <>
                  {isLand && onSetSize && (
                    <>
                      <div onPointerDown={(e) => startResize(e, f, 'len')} title="Drag to make it longer or shorter"
                        className={cn(HANDLE, 'h-4 w-4 -translate-y-1/2 cursor-ew-resize', working && 'opacity-100')}
                        style={{ right: -8, top: (f.h - LABEL_H) / 2, touchAction: 'none' }} />
                      <div onPointerDown={(e) => startResize(e, f, 'wid')} title="Drag to make it wider or narrower"
                        className={cn(HANDLE, 'h-4 w-4 -translate-x-1/2 cursor-ns-resize', working && 'opacity-100')}
                        style={{ left: '50%', top: (f.h - LABEL_H) - 8, touchAction: 'none' }} />
                    </>
                  )}
                  {onSetRot && (
                    <div onPointerDown={(e) => startRotate(e, f)} title="Drag to turn it - across, up and down, or diagonally (hold Shift for any angle)"
                      className={cn(HANDLE, 'flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center active:cursor-grabbing', working && 'opacity-100')}
                      style={{ left: '50%', top: -16, touchAction: 'none' }}>
                      <RotateCw className="h-3.5 w-3.5 text-emerald-700" />
                    </div>
                  )}
                </>
              )}
              {/* Feedback-driven improvement: raise an "Improve" PBI for this LIVE item (self as PO).
                  Nothing to improve about a construction site, and nothing to improve about work
                  that has not been released yet - you are still building that one. */}
              {onImprove && f.kind !== 'site' && f.item.status === 'open' && tool === 'none' && !dragging && (
                queued ? (
                  <span className="pointer-events-none absolute -top-2 -right-1 z-40 whitespace-nowrap rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow">Improving…</span>
                ) : (
                  <button type="button" title={`Raise an Improve PBI for ${f.item.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onImprove(f.item.id); }}
                    className={cn(FOCUS, "absolute -top-2 -right-1 z-40 flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-sky-700")}>
                    <Sparkles className="h-3 w-3" /> Improve
                  </button>
                )
              )}
            </div>
          );
        })}

        {/* Every extra placement of a piece of scenery: the same sprite, its own spot on the park. */}
        {features.flatMap((f) => (canCopy(f) ? (f.item.copies ?? []).map((c, i) => (
          <div key={`${f.item.id}-copy-${i}`}
            onPointerDown={(e) => startCopyDrag(e, f, i, c)}
            className={cn('group absolute z-10 select-none', onMoveCopy ? 'cursor-grab active:cursor-grabbing' : '')}
            style={{ left: copyPos(c).x, top: copyPos(c).y, transform: 'translate(-50%,-50%)', touchAction: 'none' }}>
            {f.item.category === 'flora' && isLandscapeType(landType(f.item))
              ? <LandscapePlot item={f.item} w={f.w} h={f.h - LABEL_H} rot={f.item.rot ?? 0} />
              : <Plot item={f.item} named={false} design={plantDesign(f.item, c.piece)} />}
            {onRemoveCopy && tool === 'none' && (
              <button type="button" title={`Remove this ${f.item.name}`} aria-label={`Remove this ${f.item.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onRemoveCopy(f.item.id, i); }}
                className={cn(FOCUS, "absolute -right-2 -top-2 z-40 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-white text-muted-foreground opacity-0 shadow transition-opacity hover:text-foreground group-hover:opacity-100")}>
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        )) : []))}

      </div>
      {/* No visitors here. A plan is not somewhere people walk about - it is the drawing they will
          walk about IN. The crowds, the cars and the families are in the isometric view, which is
          where they are worth looking at, and where they only had to be written once. */}

      {/* The toolbar for whatever is selected, floating just above it. It lives in the OUTER box,
          which is not transformed, so it stays its natural size however far the park is zoomed -
          controls that shrink with the drawing are not controls. */}
      {edit && building && onOpenBuild && !benched && (() => {
        const f = features.find((x) => x.item.id === building);
        if (!f || !selectable(f)) return null;
        const p = posOf(f);
        const rest = restPos(f);
        const moving = drag?.id === f.item.id;
        // The toolbar sits in a band the full width of the park and is nudged sideways by a
        // TRANSFORM, never by `left`.
        //
        // It used to be positioned with `left`, clamped by its own measured width. Near the park's
        // edge that is a feedback loop with nothing to damp it: `left` limits how much room an
        // absolutely positioned box has, so the toolbar wraps, so it measures narrower, so the clamp
        // lets it move outward, so it has room again, so it unwraps - and it shivers, several times a
        // second, but only ever at the boundary. A transform moves a box without changing the space
        // it was laid out in, so the width it measures no longer depends on where it ended up.
        const band = CANVAS_W * scale - 16;
        const shift = (at: { x: number; y: number }) => clamp((at.x - CANVAS_W / 2) * scale, -(band - tbW) / 2, (band - tbW) / 2);
        // Above the item by preference, below it when the top wall is in the way. Sitting above and
        // being clipped by the park's own edge is the one thing it must not do: a habitat pushed
        // against the top wall took its toolbar off the top of the park with it, and all you could
        // see was the last row of a menu you could no longer reach.
        const above = (at: { x: number; y: number }) => (at.y - f.h / 2) * scale - 12; // its bottom edge
        // Further below than above, because the thing's name tag hangs off its bottom edge.
        const below = (at: { x: number; y: number }) => (at.y + f.h / 2) * scale + 32; // its top edge
        const flip = (at: { x: number; y: number }) => above(at) - tbH < 4;
        const at = moving ? p : rest;
        const dx = shift(at);
        const down = flip(at);
        const top = down ? below(at) : above(at);
        return (
          <div className="pointer-events-none absolute inset-x-2 z-40 flex justify-center" style={{ top }}>
          <div ref={toolbar} className="pointer-events-auto flex justify-center"
            style={{ maxWidth: band, transform: `translate(${dx}px,${down ? '0' : '-100%'})`, ...(moving ? { willChange: 'transform' } : {}) }}
            onPointerDown={(e) => e.stopPropagation()}>
            <ItemToolbar
              item={f.item}
              design={f.item.category === 'enclosure'
                // Until a colour is chosen the habitat is drawn in its zone's colours, so that is
                // what the swatch has to show - a grey square for a tan fence is a lie.
                ? { ...workingDesign(f.item), colors: { ground: f.theme.plot, fence: f.theme.plotBorder, ...workingDesign(f.item).colors } }
                : workingDesign(f.item)}
              copySources={edit.copySources(f.item)}
              onDesign={(d) => edit.onDesign(f.item.id, d)}
              onSetEnclosure={f.item.category === 'enclosure' ? (size) => edit.onSetEnclosure(f.item.id, size) : undefined}
              onToggleTask={(taskId) => edit.onToggleTask(f.item.id, taskId)}
              onConfirmAc={(i, v) => edit.onConfirmAc(f.item.id, i, v)}
              focus={part?.id === f.item.id ? part.key : null}
              onFocus={(key) => setPart(key ? { id: f.item.id, key } : null)}
              onClose={() => { setPart(null); onOpenBuild(null); }}
            />
          </div>
          </div>
        );
      })()}
    </div>
    </div>
  );
}

/** Zoom the park in and out. The stops are fixed so a click always lands somewhere sensible, and
 *  the percentage doubles as the "back to fitting the width" button. */
const ZOOM_STOPS = [0.5, 0.75, 1, 1.5, 2, 3];
function ZoomControl({ zoom, onZoom }: { zoom: number; onZoom: (z: number) => void }) {
  const step = (dir: -1 | 1) => {
    const i = ZOOM_STOPS.indexOf(zoom);
    const from = i >= 0 ? i : ZOOM_STOPS.findIndex((z) => z >= zoom);
    onZoom(ZOOM_STOPS[clamp(from + dir, 0, ZOOM_STOPS.length - 1)]);
  };
  const btn = 'flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40';
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Zoom the park">
      <button  type="button" className={cn(FOCUS, btn)} onClick={() => step(-1)} disabled={zoom <= ZOOM_STOPS[0]} title="Zoom out" aria-label="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => onZoom(1)} disabled={zoom === 1} title="Fit the park to the width" aria-label="Fit the park to the width"
        className={cn(FOCUS, "min-w-[3rem] rounded-md border border-border px-1 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60")}>
        {Math.round(zoom * 100)}%
      </button>
      <button  type="button" className={cn(FOCUS, btn)} onClick={() => step(1)} disabled={zoom >= ZOOM_STOPS[ZOOM_STOPS.length - 1]} title="Zoom in" aria-label="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** A simple read-only flow of features, for the small live views (no drag). */
function FlowScene({ features, minHeight }: { features: Feature[]; minHeight: number }) {
  // The small overview is the same drawing, smaller: what has been delivered, in a row. It is on the
  // same sheet as the big plan, because two greens and a blue would be three different parks.
  return (
    <div className="relative overflow-hidden rounded-lg border"
      style={{ minHeight, borderColor: BP.INK_FAINT, ...BP.gridPaint() }}>
      <div className="relative z-10 flex flex-wrap items-end gap-3 p-3 pb-8">
        {features.map((f) => (
          <div key={f.item.id}>
            {f.kind === 'enclosure' ? <Enclosure enc={f.item} animals={f.animals} theme={f.theme} /> : <Plot item={f.item} scale={0.75} />}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0" aria-hidden
        style={{ height: 22, background: BP.FIELD_EDGE, borderTop: `1px dashed ${BP.INK_FAINT}` }} />
    </div>
  );
}

interface ParkViewProps {
  state: ZooGameState;
  /** The item whose build inspector is open. */
  building?: string | null;
  /** Select an item on the park - its toolbar appears above it. */
  onOpenBuild?: (id: string | null) => void;
  /** Designing in place: what the toolbar for the selected item commits back to the game. */
  edit?: EditApi;
  /** Start a Sprint Backlog item by dropping its card on the park. */
  onStartHere?: (id: string, pos: { x: number; y: number }) => void;
  compact?: boolean;
  fill?: boolean;
  large?: boolean;
  /** On the big Park tab, called when a feature is dragged to a new position. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  /** On the big Park tab, called when the promenade surface is changed. */
  onSetPathStyle?: (key: string) => void;
  /** On the big Park tab, manual connectors: add a new one, edit its ends/bends/style, or delete.
   *  Paths are only editable while DEPLOYING an item (see deployMode). */
  onAddConnector?: (c: ZooConnector) => void;
  onUpdateConnector?: (id: string, patch: Partial<ZooConnector>) => void;
  onDeleteConnector?: (id: string) => void;
  /** Non-null while an item is being deployed (its name) - drawing/editing paths is part of that
   *  placement step. Outside deploy mode connectors are read-only; changes then go through PBIs. */
  deployMode?: string | null;
  /** When deploying a Pathway, the width and colour it was designed at - new connectors use it. */
  deployStyle?: { thickness: number; color: string } | null;
  /** A pathway on the design bench. A path is a route between things rather than a thing that sits
   *  somewhere, so this is how you lay one out: the pen comes out, at the width and colour it was
   *  designed at, for as long as that item is the one being built. */
  drawRoute?: { id: string; name: string; style: { thickness: number; color: string } } | null;
  /** Whether the pen is out. Owned by the design bench for a pathway - the controls for a thing
   *  being built belong with the rest of that thing's controls, not scattered over the product. */
  drawing?: boolean;
  onDrawing?: (on: boolean) => void;
  /** Deploy-time acceptance criteria (sizing/placement) for the item being deployed - confirmed here
   *  on the park, as you place & size it, since they can't be judged before it is placed. */
  deployAcs?: { index: number; label: string; confirmed: boolean; placement: boolean }[];
  onFinishDeploy?: () => void;
  /** The id of a just-delivered feature, so it can pop in celebratorily. */
  justOpened?: string | null;
  /** Which part of the selected thing is picked out, when the design controls live off the park. */
  part?: { id: string; key: string } | null;
  onPart?: (p: { id: string; key: string } | null) => void;
  /** The design controls are docked in a bench beside the park - do not float them over it too. */
  benched?: boolean;
  /** On the big Park tab, raise a feedback-driven "Improve X" PBI for a delivered feature. */
  onImprove?: (id: string) => void;
  /** On the big Park tab, position an animal within its enclosure (drag inside the habitat). */
  onSetSpot?: (id: string, spot: { x: number; y: number }) => void;
  /** ...and position ONE animal of a family, so a pride can be arranged rather than clumped. */
  onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void;
  /** On the big Park tab, resize a landscape feature's footprint (drag its corner). */
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  /** On the big Park tab, plant flora inside an enclosure (drag onto it) or take it back out. */
  onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void;
  onUnnest?: (id: string) => void;
  /** On the big Park tab, rename an enclosure by editing its sign. */
  onRename?: (id: string, name: string) => void;
  /** Turn a landscape feature on the park (degrees clockwise). */
  onSetRot?: (id: string, rot: number) => void;
  /** Which drawing is showing, when something outside decides it - Inspect, on the bench. */
  view?: 'plan' | 'iso';
  onView?: (v: 'plan' | 'iso') => void;
  /** Extra placements of the same scenery - signposts at the junctions, trees along a path. */
  onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void;
  onRemoveCopy?: (id: string, index: number) => void;
}

/** The park as it stands: built enclosures with their animals, amenities and planting,
 *  a HUD at a glance, and visitors on the promenade. `large` = the full-width, draggable
 *  Park tab; `compact`/`fill` = small read-only live views. */
export function ParkView({ state, compact = false, large = false, view: viewProp, onView, building, onOpenBuild, edit, onStartHere, onPlaceItem, onSetPathStyle, onImprove, onSetSpot, onSetMemberSpot, onSetRot, onMoveCopy, onRemoveCopy, onNest, onUnnest, onRename, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, deployAcs, onFinishDeploy, justOpened, onSetSize, part, onPart, benched, drawRoute, drawing, onDrawing }: ParkViewProps) {
  const style = pathStyleFor(state.pathStyle);
  const connectors = state.connectors ?? [];
  // The park tool: 'connect' draws connectors, 'none' = arrange & select. Paths are only editable
  // while DEPLOYING an item; after it's open, connectors are read-only (changes go through PBIs).
  const canConnect = !!deployMode || !!drawRoute;
  // null means "not chosen": a pathway arrives with the pen already in your hand, because drawing
  // the route is the whole of laying a path out, while everything else starts in arrange mode.
  const [tool, setTool] = useState<'none' | 'connect' | null>(null);
  const [selectedConn, setSelectedConn] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1); // 1 = the park fits the width it is given
  // Plan to build in, Increment to inspect. The same zoo either way - this switches how it is
  // drawn, not what it is.
  //
  // Held OUTSIDE when somebody else needs to move it: pressing "Inspect" on the bench has to be able
  // to turn the park to the Increment, which is the whole point of the button. It keeps its own
  // state when nobody is holding it, so the small read-only views still work on their own.
  // The park opens as the zoo, not as the drawing of it. The blueprint is on its way out: it is
  // the surface a route is still drawn on, which is the one thing the Increment view cannot do
  // yet, so it stays reachable rather than default.
  const [ownView, setOwnView] = useState<'plan' | 'iso'>('iso');
  const [turn, setTurn] = useState(0); // quarter-turns of the Increment view
  const view = viewProp ?? ownView;
  const setView = onView ?? setOwnView;
  const isoView = large && view === 'iso';
  // While a pathway is on the bench the bench holds the pen; otherwise it is the park's own toggle.
  const effectiveTool: 'none' | 'connect' = !canConnect ? 'none' : (drawRoute ? (drawing ? 'connect' : 'none') : (tool ?? 'none'));
  const stopDrawing = () => { setTool('none'); onDrawing?.(false); };
  // Style applied to a NEW connector; when deploying a Pathway it's the width/colour designed for
  // it, otherwise a sensible default. The toolbar still edits the selected one.
  const newConn = deployStyle ?? drawRoute?.style ?? { thickness: 8, color: '#c9a86a' };
  /** A run wears its pathway's width and colour as they stand, not as they were when it was drawn.
   *  Changing the width on the bench and watching the path you already laid stay stubbornly thin is
   *  the sort of thing that makes a control feel broken. A run that belongs to nothing keeps what
   *  it was drawn with. */
  const runStyle = (c: ZooConnector): { thickness: number; color: string } => {
    const owner = c.itemId ? state.backlog.find((it) => it.id === c.itemId) : undefined;
    const d = owner ? owner.design ?? owner.draftDesign : undefined;
    return d ? { thickness: pathWidthPx(d.parts.thickness), color: d.colors.path ?? c.color } : { thickness: c.thickness, color: c.color };
  };
  const selected = canConnect ? (connectors.find((c) => c.id === selectedConn) ?? null) : null;
  const open = state.backlog.filter((it) => it.status === 'open' && !it.enhancesId);
  // Ids of live features that already have an improvement in flight (so we don't stack PBIs).
  // "Improving…" shows only while an improvement is actively being built this Sprint (committed or
  // done) - a transient state - not while it merely sits in the Backlog waiting to be pulled.
  const improving = new Set(state.backlog.filter((it) => it.enhancesId && (it.status === 'committed' || it.status === 'done')).map((it) => it.enhancesId!));
  const features = buildFeatures(state);
  // Zones a visitor could actually walk into, not zones with something standing in them. A habitat
  // with an animal in it and no path to it is work delivered and value not: that is the difference
  // between a slice of the cake and a layer of it, and the number ought to say which you have.
  const slices = zoneSlices(state);
  const openSlices = slices.filter((z) => z.open);
  const started = slices.filter((z) => !z.open && z.delivered > 0);
  const exhibits = open.filter((it) => it.category === 'exhibit').length;
  const amenities = open.filter((it) => it.category === 'amenity').length;
  // People come whatever is here. Whether there is anything worth their trip is a different
  // question, and the honest place to answer it is the badge beside the count.
  const gatesOpen = zooIsOpen(state);
  const total = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const happiness = state.lastReview?.overallHappiness ?? null;

  // Little visitors stroll once there is an exhibit to see.
  const dots: SegmentId[] = [];
  if (open.some((it) => it.category === 'exhibit')) {
    const cap = compact ? 8 : 34;
    for (const seg of ['families', 'enthusiasts', 'comfortSeekers'] as SegmentId[]) {
      const n = Math.min(cap, Math.round(((state.attendance[seg] ?? 0) / Math.max(1, total)) * Math.min(cap, Math.max(3, Math.round(total / 60)))));
      for (let i = 0; i < n; i++) dots.push(seg);
    }
  }

  const statsBar = (
    <div className={cn(SURFACE.card, PADDING.tight, 'flex flex-wrap items-center gap-x-5 gap-y-1.5')}>
      <Stat icon={LayoutGrid} value={`${openSlices.length}/${slices.length}`} label="zones open"
        title={openSlices.length || started.length
          ? [
            openSlices.length ? `Open: ${openSlices.map((z) => z.zone).join(', ')}.` : '',
            started.length ? `Started but nobody can visit: ${started.map((z) => `${z.zone} (needs ${z.missing.join(' and ')})`).join('; ')}.` : '',
          ].filter(Boolean).join(' ')
          : 'A zone opens when it has an animal to see and a path to walk in on.'} />
      <Stat icon={PawPrint} value={`${exhibits}`} label={exhibits === 1 ? 'exhibit' : 'exhibits'} />
      <Stat icon={Store} value={`${amenities}`} label={amenities === 1 ? 'amenity' : 'amenities'} />
      <Stat icon={Users} value={total ? total.toLocaleString() : '—'} label="visitors"
        title={gatesOpen ? undefined : 'They come anyway. Whether they enjoy it is measured at the Review.'} />
      <Stat icon={Smile} value={happiness === null ? '—' : `${happiness}`} label="happiness" title={happiness === null ? 'Measured at the Sprint Review' : undefined} />
      {!gatesOpen && (
        <span className={cn(TONE.attention.text, "flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium")}
          title="Visitors still turn up - and go home disappointed. Paths and grass are a park; a zoo needs an animal.">
          <Lock className="h-3 w-3 shrink-0" /> Nothing on show
        </span>
      )}
    </div>
  );

  return (
    <section className={cn('space-y-3', compact && 'space-y-2')}>
      <style>{`
        @keyframes zooStroll { 0%{transform:translate(0,0)} 25%{transform:translate(10px,-7px)} 50%{transform:translate(-6px,8px)} 75%{transform:translate(7px,5px)} 100%{transform:translate(0,0)} }
        @media (prefers-reduced-motion: reduce) { .zoo-visitor { animation: none !important } }
      `}</style>

      {!compact && !large && statsBar}

      {large ? (
        <>
          {/* Everything above the park image stays pinned to the top of the scroll area, so the
              stats, the description and the toolbar are always visible while you scroll the park. */}
          <div className="sticky top-0 z-30 -mx-2 -mt-3 space-y-2 border-b border-border bg-background/95 px-2 pb-2 pt-3 backdrop-blur-sm sm:-mx-3 sm:px-3">
          <p className="max-w-prose text-left text-[11px] text-muted-foreground">
            <strong className="text-foreground">The park is your product.</strong> Everything live here is the sum of the
            Increments you have delivered - each Sprint adds to it. Drag an enclosure, building or planting to lay out your
            zoo; animals move with their enclosure.
          </p>
          {statsBar}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {isoView ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {onPlaceItem
                  ? <><Move className="h-3.5 w-3.5" /> The zoo as a visitor would see it. Drag a habitat, building or planting to arrange it, the same as in Plan.</>
                  : <><Eye className="h-3.5 w-3.5" /> A view of the zoo as it stands.</>}
              </p>
            ) : features.length > 0 && onPlaceItem ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Move className="h-3.5 w-3.5" /> Drag an enclosure, building or planting to arrange your zoo.</p>
            ) : <span />}
            <div className="flex items-center gap-3">
              <ViewSwitch view={view} onView={setView} />
              {/* Zoom belongs to both views. The isometric side is the one carrying the drawn
                  artwork - the animals, the buildings, the people - and it was the one view you
                  could not lean into. */}
              <ZoomControl zoom={zoom} onZoom={setZoom} />
              {/* Walk round it. A quarter at a time, because every prop is drawn from one angle. */}
              {isoView && (
                <button type="button" onClick={() => setTurn((t) => (t + 1) % 4)}
                  title="Turn the park a quarter, to see behind something"
                  className={cn(FOCUS, 'flex h-6 items-center gap-1 rounded-md border border-border px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground')}>
                  <RotateCw className="h-3.5 w-3.5" /> Turn
                </button>
              )}
              {onSetPathStyle && <SurfacePicker current={style} onPick={onSetPathStyle} />}
              {!isoView && canConnect && onAddConnector && !drawRoute && (
                <button type="button" onClick={() => { setSelectedConn(null); setTool(effectiveTool === 'connect' ? 'none' : 'connect'); }} title="Draw a path" aria-pressed={effectiveTool === 'connect'}
                  className={cn(FOCUS, 'flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                    effectiveTool === 'connect' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
                  <Spline className="h-3.5 w-3.5" /> Connect
                </button>
              )}
            </div>
          </div>
          {/* Laying out a pathway: no plot, no hoardings - the route IS the thing. */}
          {!deployMode && drawRoute && effectiveTool !== 'connect' && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/50 bg-primary/[0.06] px-2 py-1.5 text-[11px]">
              <Spline className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-medium">Laying <b>{drawRoute.name}</b>. Pick up the pen on the design bench and draw its route here.</span>
            </div>
          )}
          {/* Deploy mode: placing an item is when you position it AND lay the paths that link it in. */}
          {deployMode && (() => {
            const acs = deployAcs ?? [];
            return (
            <div className="flex flex-col gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-500/5 px-2 py-1.5 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(TONE.done.text, "font-medium")}>Deploying <b>{deployMode}</b>: drag it into place, and use <b>Connect</b> to lay the paths that link it in. Paths are set at deployment - later changes go through the Backlog.</span>
                {onFinishDeploy && (
                  <button type="button"
                    onClick={() => { stopDrawing(); setSelectedConn(null); onFinishDeploy(); }}
                    className={cn(FOCUS, "ml-auto flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white hover:bg-emerald-700")}>
                    <Check className="h-3 w-3" /> Back to the board</button>
                )}
              </div>
              {acs.length > 0 && (
                <div className="rounded border border-emerald-500/30 bg-background/60 px-2 py-1">
                  {/* Shown, not ticked. Accepting a criterion belongs on the item's own card - the
                      park is where you put the thing, not where you judge it. */}
                  <div className={cn(TONE.done.text, "mb-0.5 font-semibold uppercase tracking-wide")}>
                    Acceptance criteria &middot; ticked on its card
                  </div>
                  <ul className="space-y-0.5">
                    {acs.map((a) => (
                      <li key={a.index} className="flex items-center gap-2">
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                          a.confirmed ? 'bg-emerald-500 text-white' : 'border border-emerald-500/60')}>{a.confirmed && <Check className="h-3 w-3" />}</span>
                        <span className={cn(a.confirmed ? 'text-muted-foreground line-through' : a.placement ? 'font-medium text-foreground' : 'text-muted-foreground')}>{a.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}
          {/* Connect-tool guidance. */}
          {canConnect && effectiveTool === 'connect' && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-primary">Click a start (an enclosure to attach, or empty grass to free-place), then click where it ends. It attaches if you finish on a feature.</span>
              <button type="button" onClick={stopDrawing} className={cn(FOCUS, "ml-auto flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-medium text-muted-foreground hover:text-foreground")}><X className="h-3 w-3" /> Done</button>
            </div>
          )}
          {/* Selected-connector toolbar: thickness, colour, delete. While a pathway is on the bench
              its width and colour are the ITEM's, chosen once over there and applied to every run -
              two sets of the same two controls, one per run and one per item, is how you end up with
              a zoo of paths that do not match each other. Deleting a wrong run stays. */}
          {effectiveTool === 'none' && selected && (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-blue-400/50 bg-blue-500/5 px-2 py-1.5 text-[11px]">
              {(() => {
                // Three cases, and they are genuinely different. A run of the pathway on the bench
                // is yours to change. A run of a DELIVERED pathway is part of the Increment, so it
                // changes the way anything else delivered changes - through the Backlog. And a run
                // nobody owns is a leftover from the old free-draw step, which anyone may tidy away.
                const owner = state.backlog.find((it) => it.id === selected.itemId);
                const onBench = !!drawRoute && drawRoute.id === selected.itemId;
                if (onBench) return <span className="font-medium text-muted-foreground">This run of <b className="text-foreground">{drawRoute.name}</b>. Its width and colour come from the design bench.</span>;
                if (owner) return (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-muted-foreground">A run of <b className="text-foreground">{owner.name}</b>, delivered.
                      Re-routing it is a change to the product, so it goes through the Backlog.</span>
                    {onImprove && !improving?.has(owner.id) && (
                      <button type="button" onClick={() => { onImprove(owner.id); setSelectedConn(null); }}
                        className={cn(FOCUS, "flex items-center gap-1 rounded border border-primary/60 bg-background px-1.5 py-0.5 font-semibold text-primary hover:bg-primary/10")}>
                        <Sparkles className="h-3 w-3" /> Improve {owner.name}
                      </button>
                    )}
                    {improving?.has(owner.id) && <span className={cn(TONE.attention.text, "rounded bg-amber-500/10 px-1.5 py-0.5 font-medium")}>Already on the Backlog to improve</span>}
                  </span>
                );
                return <span className="font-medium text-muted-foreground">A run left over from an earlier way of drawing paths. Nothing owns it.</span>;
              })()}
              {!drawRoute && onUpdateConnector && !selected.itemId && <span className="flex items-center gap-1.5">
                <span className="font-medium text-muted-foreground">Thickness</span>
                {[4, 8, 14].map((t) => (
                  <button key={t} type="button" onClick={() => onUpdateConnector(selected.id, { thickness: t })} title={`${t}px`} aria-pressed={selected.thickness === t}
                    className={cn(FOCUS, 'flex h-6 w-7 items-center justify-center rounded border', selected.thickness === t ? 'border-primary bg-primary/10' : 'border-border')}>
                    <span className="rounded-full bg-foreground" style={{ width: 16, height: Math.max(2, t / 2) }} />
                  </button>
                ))}
              </span>}
              {!drawRoute && onUpdateConnector && !selected.itemId && <span className="flex items-center gap-1.5">
                <span className="font-medium text-muted-foreground">Colour</span>
                {CONNECTOR_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => onUpdateConnector(selected.id, { color: c })} title={c}
                    className={cn(FOCUS, 'h-5 w-5 rounded-full border', selected.color.toLowerCase() === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border/60')} style={{ background: c }} />
                ))}
              </span>}
              {onDeleteConnector && (!selected.itemId || drawRoute?.id === selected.itemId) && (
                <button type="button" onClick={() => { onDeleteConnector(selected.id); setSelectedConn(null); }} title="Take this run back up"
                  className={cn(FOCUS, "ml-auto flex items-center gap-1 rounded border border-destructive/50 bg-background px-1.5 py-0.5 font-medium text-destructive hover:bg-destructive/10")}><Trash2 className="h-3 w-3" /> Take it up</button>
              )}
            </div>
          )}
          </div>
          {isoView ? (
            <Suspense fallback={<div className="h-[440px] animate-pulse rounded-md bg-black/5" aria-label="Drawing the zoo" />}>
              {/* Zoomed in, the drawing grows past its window and the window is scrolled - the same
                  as walking up to it. At 100% it fits, and there is nothing to scroll. */}
              <div className="overflow-auto rounded-lg" style={{ maxHeight: 560 }}>
                <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
                  {/* The same handlers the plan uses. One zoo, two ways of drawing it, and either
                      one is somewhere you can arrange it. */}
                  <IsoZoo state={state} height={520 * zoom} turn={turn}
                    onPlaceItem={onPlaceItem} selected={building} onSelect={onOpenBuild} />
                </div>
              </div>
            </Suspense>
          ) : (
          <FreeScene building={building} onOpenBuild={onOpenBuild} edit={edit} part={part} onPart={onPart} benched={benched} onStartHere={onStartHere} features={features} tool={effectiveTool} editable={canConnect} connectors={connectors} selectedConn={selectedConn} newConn={newConn} runStyle={runStyle} justOpened={justOpened} zoom={zoom}
            onPlaceItem={onPlaceItem} onImprove={onImprove} improving={improving} onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onSetSize={onSetSize} onSetRot={onSetRot} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy} onNest={onNest} onUnnest={onUnnest} onRename={onRename}
            // Every run drawn for a pathway carries that pathway's id, so the item can list its own
            // runs and take one back off. A route you cannot edit is a route you have to get right
            // first time, which is not how anyone draws anything.
            onAddConnector={(c) => { onAddConnector?.({ ...c, itemId: drawRoute?.id }); if (!drawRoute) setTool('none'); setSelectedConn(c.id); }} onUpdateConnector={onUpdateConnector} onSelectConn={setSelectedConn} />
          )}
        </>
      ) : (
        <FlowScene features={features} minHeight={compact ? 140 : 230} />
      )}
    </section>
  );
}


/** One inline park stat: icon + bold value + label, on a single slim row. */
function Stat({ icon: Icon, label, value, title }: { icon: typeof Users; label: string; value: string; title?: string }) {
  return (
    <span className="flex items-center gap-1.5" title={title}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-sm font-bold leading-none tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </span>
  );
}
