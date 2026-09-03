import { Suspense, lazy, useState } from 'react';
import type { ZooGameState, BacklogItem, ZooConnector } from './types';
/** The isometric view of the park - and, since the blueprint was retired, the only one. Lazily
 *  imported: it carries the isometric artwork, which is more than half of what the game weighs,
 *  and nobody needs it until they ask to look. */
const IsoZoo = lazy(() => import('./IsoZoo').then((m) => ({ default: m.IsoZoo })));
import type { ItemDesign } from './design';
import type { CopySource } from './ItemToolbar';
import { PATH_STYLES, pathStyleFor, type PathStyle } from './pathStyles';
import type { SegmentId } from './simulation/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zoneSlices, zooIsOpen } from './engine';
import { Users, Smile, LayoutGrid, PawPrint, Store, Move, Check, X, ChevronDown, Sparkles, Spline, Trash2, Minus, Plus, RotateCw, Lock, Eye } from 'lucide-react';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';

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

/** Designing in place. The park owns the surface; the game owns what a change means, so the toolbar
 *  hands every edit straight back rather than keeping a copy of the design to reconcile later. */
export interface EditApi {
  onDesign: (id: string, design: ItemDesign) => void;
  /** Give it a name of its own. A zoo of "Enclosure 3"s is a zoo nobody has thought about, and
   *  naming a thing is the cheapest way a team says what it is for. */
  onRename: (id: string, name: string) => void;
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

// ---- Features: the positionable things in the park (enclosures + amenities + planting) ----

// The park is one of three columns now - Product Backlog, Sprint Backlog, product - so it is taller
// than it is wide. A landscape park squeezed into a third of the screen is a postage stamp; a
// portrait one uses the height it has. These are design pixels, scaled to whatever room it gets.
// A river is cut long enough to cross the park from any angle (past the corners on the diagonal)
// and is clipped by the park's edges, so turning it never leaves a gap at the ends.

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
  /** Touching a part of the thing on the bench, so the bench opens that part's controls. */
  onPart?: (p: { id: string; key: string } | null) => void;
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
  /** Turn a landscape feature on the park (degrees clockwise). */
  onSetRot?: (id: string, rot: number) => void;
  /** Extra placements of the same scenery - signposts at the junctions, trees along a path. */
  onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void;
  onRemoveCopy?: (id: string, index: number) => void;
}

/** The park as it stands: built enclosures with their animals, amenities and planting,
 *  a HUD at a glance, and visitors on the promenade. `large` = the full-width, draggable
 *  Park tab; `compact`/`fill` = small read-only live views. */
export function ParkView({ state, compact = false, large = false, building, onOpenBuild, edit, onStartHere, onPlaceItem, onSetPathStyle, onImprove, onSetSpot, onSetMemberSpot, onSetRot, onMoveCopy, onRemoveCopy, onNest, onUnnest, onAddConnector, onUpdateConnector, onDeleteConnector, deployMode, deployStyle, deployAcs, onFinishDeploy, onSetSize, onPart, drawRoute, drawing, onDrawing }: ParkViewProps) {
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
  // One drawing of the park: the zoo itself, as a visitor would see it. There used to be a second -
  // a blueprint, drawn from overhead - and everything you could do to the park you could only do
  // there. It is gone, and everything it could do is done here.
  const [turn, setTurn] = useState(0); // quarter-turns of the park
  // While a pathway is on the bench the bench holds the pen; otherwise it is the park's own toggle.
  const effectiveTool: 'none' | 'connect' = !canConnect ? 'none' : (drawRoute ? (drawing ? 'connect' : 'none') : (tool ?? 'none'));
  const stopDrawing = () => { setTool('none'); onDrawing?.(false); };
  // Style applied to a NEW connector; when deploying a Pathway it's the width/colour designed for
  // it, otherwise a sensible default. The toolbar still edits the selected one.
  const newConn = deployStyle ?? drawRoute?.style ?? { thickness: 8, color: '#c9a86a' };
  const selected = canConnect ? (connectors.find((c) => c.id === selectedConn) ?? null) : null;
  const open = state.backlog.filter((it) => it.status === 'open' && !it.enhancesId);
  // Ids of live features that already have an improvement in flight (so we don't stack PBIs).
  // "Improving…" shows only while an improvement is actively being built this Sprint (committed or
  // done) - a transient state - not while it merely sits in the Backlog waiting to be pulled.
  const improving = new Set(state.backlog.filter((it) => it.enhancesId && (it.status === 'committed' || it.status === 'done')).map((it) => it.enhancesId!));
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
            {/* One instruction at a time. With the pen out the amber bar below is saying how, and
                two lines telling you different things about the same drag is how somebody ends up
                clicking twice and wondering why nothing was laid. */}
            {effectiveTool === 'connect' ? <span /> : (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {onPlaceItem
                  ? <><Move className="h-3.5 w-3.5" /> The zoo as a visitor would see it. Drag a habitat, building or planting to arrange it.</>
                  : <><Eye className="h-3.5 w-3.5" /> A view of the zoo as it stands.</>}
              </p>
            )}
            <div className="flex items-center gap-3">
              <ZoomControl zoom={zoom} onZoom={setZoom} />
              {/* Walk round it. A quarter at a time, because every prop is drawn from one angle. */}
              {(
                <button type="button" onClick={() => setTurn((t) => (t + 1) % 4)}
                  title="Turn the park a quarter, to see behind something"
                  className={cn(FOCUS, 'flex h-6 items-center gap-1 rounded-md border border-border px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground')}>
                  <RotateCw className="h-3.5 w-3.5" /> Turn
                </button>
              )}
              {onSetPathStyle && <SurfacePicker current={style} onPick={onSetPathStyle} />}
              {canConnect && onAddConnector && !drawRoute && (
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
              <span className="font-medium text-primary">Press where the path starts and drag to where it goes. It joins on if you finish on a habitat or a building.</span>
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
          <Suspense fallback={<div className="h-[440px] animate-pulse rounded-md bg-black/5" aria-label="Drawing the zoo" />}>
            {/* Zoomed in, the drawing grows past its window and the window is scrolled - the same
                as walking up to it. At 100% it fits, and there is nothing to scroll. */}
            <div className="overflow-auto rounded-lg" style={{ maxHeight: 560 }}>
              <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
                <IsoZoo state={state} height={520 * zoom} turn={turn}
                  onPlaceItem={onPlaceItem} selected={building} onSelect={onOpenBuild}
                  tool={effectiveTool} newConn={newConn}
                  building={edit ? building : null} onPart={edit ? onPart : undefined}
                  onSetSpot={onSetSpot} onSetMemberSpot={onSetMemberSpot} onNest={onNest} onUnnest={onUnnest}
                  onSetSize={onSetSize} onSetRot={onSetRot} onMoveCopy={onMoveCopy} onRemoveCopy={onRemoveCopy}
                  selectedConn={selectedConn} onSelectConn={canConnect ? setSelectedConn : undefined}
                  onStartHere={onStartHere} onImprove={onImprove} improving={improving}
                  onAddConnector={(c) => { onAddConnector?.({ ...c, itemId: drawRoute?.id }); if (!drawRoute) setTool('none'); }} />
              </div>
            </div>
          </Suspense>
        </>
      ) : (
        // The small read-only park: the same drawing, smaller. It was a row of plots on the
        // blueprint's own sheet, which is a second park again.
        <Suspense fallback={<div style={{ minHeight: compact ? 140 : 230 }} className="animate-pulse rounded-lg bg-black/5" aria-label="Drawing the zoo" />}>
          <IsoZoo state={state} height={compact ? 140 : 230} />
        </Suspense>
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
