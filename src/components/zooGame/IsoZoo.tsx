import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { BacklogItem, ZooGameState, ZooConnector, ConnectorEnd } from './types';
import { shade, barrierOf, speciesBody, speciesColors, landscapePalette, floraDefaultColors, isLandscapeType, enclosureFlora, enclosureWater, enclosureShapePoints, pieceByKey, isTank, tankWater } from './design';
import { standsOnPark } from './engine';
import { buildNav, routeAcross } from './parkNav';
import { zonePlots } from './parkZones';
import { riverOutline } from './parkWater';
import { insidePark, CANVAS_W, PLAY_H, PROMENADE_Y, parkOutline, outlinePath, hedgePoints, edgeNoise, HEDGE_STEP, HEDGE_R } from './parkLayout';
import { TRAVEL_MS } from './walkThrough';
import { standingOnPark, parkPositions, restingPlace, groundSize, habitatSpot, quarterOf, apronRing, APRON_GAP, APRON_WIDTH, viewingSpot, workingDesign as working, parkType as landType } from './parkModel';
import { FACILITY } from './facilities';
import { themeFor } from './zoneTheme';
import { cn } from '@/lib/utils';
import { carParkLayout, carCapacity, CAR_HW, CAR_HH, BUS_HW, BUS_HH, type CarSpot } from './carPark';
import { animalArtFor } from './art/animalArt';
import { coatTint, foliageTint, tintKey, tintRef, type Tint } from './art/tint';
import { TintDefs } from './art/TintDefs';
import { KIND_SCALE, groupMembers } from './design';
import {
  project, unproject, depth as depthOf, screenBounds, groundPoints, boxFaces as boxFacesOf, boxTones,
  roofFaces as roofFacesOf, wallPanel as wallPanelOf, prop, tint, jitter, COS, type Pt,
} from './art/iso';
import { VEHICLE_ART } from './art/vehicleArt.generated';

/** The zoo, seen from the corner.
 *
 *  This draws exactly what the park view draws - the same items, in the same places, from the same
 *  state. In the Sprint Review it gives "inspect the Increment" something to inspect, in the shape a
 *  visitor would actually see.
 *
 *  It used to be read-only, on the reasoning that the plan is where a zoo is built and this is where
 *  it is looked at. That reasoning did not survive contact: this is the view carrying the drawn
 *  artwork, so it is the view people want to be in, and being unable to move anything in it read as
 *  the game being broken rather than as a deliberate line. Given `onPlaceItem` it is somewhere you
 *  build. The pointer is answered by running the projection backwards - see `unproject`.
 *
 *  Everything is sorted back to front before it is drawn, which is the whole trick of a view like
 *  this: get the order wrong and a lion stands in front of the fence that is meant to be holding it.
 */

/** What each kind of building is, before anybody has chosen anything about it.
 *
 *  `shape` is the part that matters and the part the player cannot change: it is how you tell a
 *  cafe from a gift shop across a park. The colours are only starting points - every one of them
 *  is a control in the studio. */

const VISITOR_PROPS = ['visitor01', 'visitor02', 'visitor03', 'visitor04', 'visitor05', 'visitor06', 'visitor07', 'visitor09'];
const CHILD_PROPS = ['child01', 'child02', 'child03'];

/** Anything with a place in the scene, carrying how far back it stands. */
interface Piece { z: number; el: React.ReactNode }

/** Colour a drawing to the foliage somebody chose.
 *
 *  The tree artwork arrives with no tint slot - unlike the fences, there is no marked colour in it
 *  to swap - so an oak, a pine and a blossom were all drawn as the same green tree however they were
 *  designed on the Plan. Turning the whole drawing by the difference between its own green and the
 *  chosen colour is not the same as repainting it leaf by leaf, but it is honest: choose a pink
 *  blossom on the Plan and a pink tree is what stands in the Increment. */
// ...and how it is carried to the screen is `art/tint`: an SVG filter, referenced by attribute,
// because the CSS shorthand this used to build is ignored by WebKit on a nested drawing. It worked
// in every test and every driver here, all of which are Chromium, and did nothing at all in Safari.

/** The outline of a habitat, as points round its own box.
 *
 *  The plan can draw a round habitat with a border-radius and a pill with one rule; from the corner
 *  there is no such shortcut, so the shape has to become points before it can be projected. Every
 *  habitat here was drawn as a rectangle whatever shape it had been given - pick Round in the studio
 *  and the Increment showed you a box.
 *
 *  Sampled coarsely on purpose: the fence is built of panels along each segment, and a segment too
 *  short to hold one is a gap in the fence.
 */

function outlineOf(shape: string, w: number, h: number): [number, number][] {
  if (shape === 'circle') {
    return Array.from({ length: 12 }, (_, i) => {
      const t = Math.PI * 0.25 + (i / 12) * Math.PI * 2;
      return [w / 2 + (w / 2) * Math.cos(t), h / 2 + (h / 2) * Math.sin(t)] as [number, number];
    });
  }
  if (shape === 'pill') {
    // A stadium: two straight sides and two rounded ends, each end a few segments.
    const r = h / 2, n = 4;
    const end = (cx: number, from: number) => Array.from({ length: n + 1 }, (_, i) => {
      const t = from + (i / n) * Math.PI;
      return [cx + r * Math.cos(t), h / 2 + r * Math.sin(t)] as [number, number];
    });
    return [...end(w - r, -Math.PI / 2), ...end(r, Math.PI / 2)];
  }
  const pts = enclosureShapePoints(shape, w, h, 0);
  if (pts) return pts.split(' ').map((q) => q.split(',').map(Number) as [number, number]);
  return [[0, 0], [w, 0], [w, h], [0, h]];
}

/** A patch of the park, in world coordinates. */
interface Rect { x0: number; y0: number; x1: number; y1: number; rot?: number }

/** Is a point inside a patch of ground - a river, a bridge deck?
 *
 *  A turned patch is tested by turning the POINT back, which is the same question asked the easy
 *  way round. Without it a river laid at an angle stopped visitors in an upright rectangle they
 *  could not see, and let them paddle across the part of it they could. */
const within = (r: Rect, p: Pt) => {
  let { x, y } = p;
  if (r.rot) {
    const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, a = (-r.rot * Math.PI) / 180;
    const dx = x - cx, dy = y - cy;
    x = cx + dx * Math.cos(a) - dy * Math.sin(a);
    y = cy + dx * Math.sin(a) + dy * Math.cos(a);
  }
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
};

/** A point some fraction of the way along a chain of points. */
function along(route: Pt[], t: number): Pt {
  const legs = route.length - 1;
  if (legs < 1) return route[0] ?? { x: 0, y: 0 };
  const at = Math.min(legs - 0.0001, Math.max(0, t) * legs);
  const i = Math.floor(at), f = at - i;
  const a = route[i], b = route[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

export function IsoZoo({ state, height = 460, width, className, turn = 0, onPlaceItem, placing, onPlace, selected, onSelect,
  tool = 'none', onAddConnector, newConn, building, onPart,
  onSetSpot, onSetMemberSpot, onNest, onUnnest, onSetSize, onSetRot, onMoveCopy, onRemoveCopy,
  selectedConn, onSelectConn, onStartHere, onImprove, improving, incrementOnly = false, camera = null }: {
  state: ZooGameState;
  height?: number;
  className?: string;
  /** Quarter-turns clockwise: 0, 1, 2 or 3. Walk round the park to see behind something. */
  turn?: number;
  /** Where to look, in the park's own coordinates, and how far in. Given, the picture moves to put
   *  that point in the middle - which is what walking up to something is. It is one transform over
   *  the drawing rather than a second renderer, so what the camera shows can never be a different
   *  zoo from the one that is drawn. */
  camera?: { x: number; y: number; zoom: number } | null;
  /** Move something. Given, this view stops being a picture and becomes somewhere you build. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  /** Something is being placed from the palette: its footprint follows the cursor with a verdict on
   *  it, and a press puts it down where the verdict is green. */
  placing?: { id: string; w: number; h: number } | null;
  /** Where it lands, and the footprint drawn for it where one was drawn. */
  onPlace?: (id: string, pos: { x: number; y: number }, drawn?: { w: number; h: number }) => void;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** 'connect' lays a run of path: press where it starts, drag to where it goes, let go.
   *
   *  It needs no new geometry: the pointer is already answered by running the projection
   *  backwards, and laying a path is that same question asked twice. */
  tool?: 'none' | 'connect';
  onAddConnector?: (c: ZooConnector) => void;
  /** The width and colour the run is laid with - the pathway's own, while one is on the bench. */
  newConn?: { thickness: number; color: string };
  /** How wide the room is, when whatever is drawing the park knows. Without it the park has to
   *  guess the shape of its pane, and a guess leaves either empty ground or a cropped zoo. */
  width?: number;
  /** Which item is open on the design bench. Only its own parts answer to a touch: a park where
   *  every fence in sight opens somebody else's controls is a park you cannot build in. */
  building?: string | null;
  /** Touching a part of the thing on the bench, so the bench opens that part's controls, which is
   *  what the bench has always said to do. */
  onPart?: (p: { id: string; key: string } | null) => void;
  /** Where one animal of a family stands inside its habitat, as a fraction of the habitat's box.
   *  A pride is not a blob, and arranging them is most of what a habitat is. */
  onSetSpot?: (id: string, spot: { x: number; y: number }) => void;
  onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void;
  /** Planting dragged into a habitat, and dragged back out of it. */
  onNest?: (id: string, enclosureId: string, spot: { x: number; y: number }) => void;
  onUnnest?: (id: string) => void;
  /** How long and how wide a landscape feature is. A river has to be able to reach both banks, and
   *  a bridge has to be able to cross it, which is a size and not a design. */
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  /** Which way it faces. */
  onSetRot?: (id: string, rot: number) => void;
  /** One planting is several trees. Each of them stands somewhere of its own, and can be moved
   *  there or taken out without touching the rest. */
  onMoveCopy?: (id: string, index: number, pos: { x: number; y: number }) => void;
  onRemoveCopy?: (id: string, index: number) => void;
  /** Which run of path is picked, so its width, its colour and taking it back up are offered for
   *  the run you touched. The controls for that already sit above both drawings. */
  selectedConn?: string | null;
  onSelectConn?: (id: string | null) => void;
  /** A card from the Sprint Backlog dropped on the park: the patch it lands on becomes its
   *  construction site. Whether it may start at all is the engine's business, not the drawing's. */
  onStartHere?: (id: string, pos: { x: number; y: number }) => void;
  /** Raise an Improve item for something already live. Feedback about a thing that exists is the
   *  Product Backlog's business, so the park is where you say it. */
  onImprove?: (id: string) => void;
  improving?: Set<string>;
  /** Show what has been delivered and nothing else - no building sites. The Review turns it on:
   *  the Increment is the thing being inspected, and a site is not part of it. */
  incrementOnly?: boolean;
}) {
  // This drawing's own id for the shape landscape is cut to. Two parks on one page - the Increment
  // tab and the Review - would otherwise share one clip path, and share whichever was drawn last.
  const grassClip = `grass-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const scene = useMemo(() => build(state, height, turn, incrementOnly, grassClip, width ?? 0),
    [state, height, turn, incrementOnly, grassClip, width]);
  const svgRef = useRef<SVGSVGElement>(null);
  const editable = !!onPlaceItem;
  const laying = tool === 'connect' && !!onAddConnector;
  // Placing something with the palette: the footprint follows the cursor as a translucent copy,
  // green where it can go and red where it cannot, with the reason in a word. No dialog - you can
  // see the answer before you commit to the question.
  // This drawing's own id for the shape landscape is cut to. Two parks on one page - the Increment
  // tab and the Review - would otherwise share one clip path, and share whichever was rendered last.
  const [ghost, setGhost] = useState<{ x: number; y: number; ok: boolean; why?: string } | null>(null);
  // Drawing the boundary: a habitat is a rectangle you drag on the grid, and the fence follows the
  // drag. The park builds three footprints, so what you draw is answered with the nearest of them -
  // said out loud on the ghost rather than silently rounded.
  const [drawn, setDrawn] = useState<{ a: { x: number; y: number }; b: { x: number; y: number } } | null>(null);
  const verdictAt = (w: { x: number; y: number }) => {
    if (!placing) return null;
    const box = { w: placing.w, h: placing.h };
    const at = insidePark(box, w);
    const off = Math.abs(at.x - w.x) > 1 || Math.abs(at.y - w.y) > 1;
    const over = scene.movable.find((m) => m.id !== placing.id
      && Math.abs(at.x - m.x) < (m.w + box.w) / 2 && Math.abs(at.y - m.y) < (m.h + box.h) / 2);
    return {
      x: at.x, y: at.y,
      ok: !off && !over,
      why: off ? 'off the park' : over ? `on top of ${over.name ?? 'something'}` : undefined,
    };
  };
  // The run being laid, while the pointer is down. Local, because it is not a run until it is let
  // go of - a half-drawn path is a gesture, not a decision.
  const [run, setRun] = useState<{ a: ConnectorEnd; b: { x: number; y: number } } | null>(null);
  const runs = useRef(0);

  /** Where the pointer is, in the world the zoo is laid out in.
   *
   *  Three coordinate spaces, in order: the pointer arrives in the browser's, the drawing is scaled
   *  to whatever width it was given, and the scene is inset by its own margin. Undo all three and
   *  the projection can be run backwards. */
  const worldAt = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    // ...through the window the picture is currently showing, which is not always the whole scene.
    const k = view.w / r.width;
    const p = unproject(view.x + (e.clientX - r.left) * k - scene.ox, view.y + (e.clientY - r.top) * k - scene.oy, scene.u);
    return scene.unturn(p.x, p.y);
  };

  /** What is under that point. Nearest first: where two things overlap, the pointer means the one
   *  in front, which is the one you can see. */
  const pick = (w: { x: number; y: number }) => [...scene.movable].sort((a, b) => b.z - a.z)
    .find((m) => Math.abs(w.x - m.x) <= m.w / 2 && Math.abs(w.y - m.y) <= m.h / 2);

  /** One animal or one plant standing inside a habitat, under that point. Nearest first, as with
   *  everything else: the pointer means the one you can see. */
  const spotAt = (w: { x: number; y: number }) => [...scene.spots].sort((a, b) => b.z - a.z)
    .find((sp) => Math.abs(w.x - sp.x) <= sp.w / 2 && Math.abs(w.y - sp.y) <= sp.h / 2);

  /** Where a run's end is anchored: to the thing under the pointer, or to the ground it landed on.
   *  Snapping to the feature matters - the park asks whether a run REACHES something, and a run
   *  that stops two pixels short of a habitat reaches nothing. */
  const endAt = (w: { x: number; y: number }): ConnectorEnd => {
    const hit = pick(w);
    return hit ? { featureId: hit.id, x: hit.x, y: hit.y } : { x: w.x, y: w.y };
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (laying) {
      const w = worldAt(e);
      if (!w) return;
      e.preventDefault();
      const a = endAt(w);
      setRun({ a, b: { x: w.x, y: w.y } });
      const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) setRun((r) => (r ? { ...r, b: p } : r)); };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const p = worldAt(ev);
        setRun(null);
        // A press with no drag is somebody clicking the park, not laying a path across it.
        if (p && Math.hypot(p.x - w.x, p.y - w.y) > 12) {
          onAddConnector?.({ id: `iso-run-${state.connectors?.length ?? 0}-${runs.current++}`,
            a, b: endAt(p), bends: [],
            thickness: newConn?.thickness ?? 14, color: newConn?.color ?? '#c9a86a' });
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }
    // A run of path, picked by touching it. What is offered for it then - its width, its colour,
    // taking it back up - is the panel above the drawing.
    if (onSelectConn) {
      const conn = (e.target as Element | null)?.closest?.('[data-conn]')?.getAttribute('data-conn');
      if (conn) { onSelectConn(conn); e.preventDefault(); return; }
      if (selectedConn) onSelectConn(null);
    }

    // Touching a part of the thing on the bench. Read off what was actually drawn under the
    // pointer rather than worked out from the box, so the part you get is the part you can see -
    // the water in the corner of a habitat is water, not the ground it lies on.
    let touched: { id: string; key: string } | null = null;
    if (onPart && building) {
      const tag = (e.target as Element | null)?.closest?.('[data-part]');
      const id = tag?.getAttribute('data-item');
      if (id === building) {
        touched = { id, key: tag!.getAttribute('data-part') ?? 'ground' };
        onPart(touched);
      }
    }
    const w = worldAt(e);
    if (!w) return;

    // One animal of a family, or a plant standing in with them: picked up on its own, and put
    // where it is dropped as a fraction of its own habitat. Checked before the habitat itself,
    // because the pointer means the thing you can see and the animal is the thing on top.
    const spotTag = (e.target as Element | null)?.closest?.('[data-spot]')?.getAttribute('data-spot');
    const sp = onSetSpot ? (spotTag ? scene.spots.find((q) => `${q.id}:${q.member}` === spotTag) : spotAt(w)) : undefined;
    if (sp) {
      e.preventDefault();
      // Where in its habitat the pointer is, whatever size that habitat is or how far the park is
      // zoomed. Outside 0..1 means it has been taken off the habitat altogether.
      const frac = (p: { x: number; y: number }) => ({ x: (p.x - sp.box.x) / sp.box.w, y: (p.y - sp.box.y) / sp.box.h });
      const put = (f: { x: number; y: number }) => {
        const c = { x: Math.min(0.92, Math.max(0.08, f.x)), y: Math.min(0.94, Math.max(0.1, f.y)) };
        // An animal goes to its OWN place in the family; a plant has no family, so the whole thing
        // is what is being put somewhere.
        if (sp.member > 0 || (!sp.unnestable && onSetMemberSpot)) onSetMemberSpot?.(sp.id, sp.member, c);
        else onSetSpot?.(sp.id, c);
      };
      const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) put(frac(p)); };
      const up = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        const p = worldAt(ev);
        if (!p) return;
        const f = frac(p);
        // Dragged well clear of the fence: taking it back out, which is how planting leaves a
        // habitat. An animal has no way out - it is stocked, and it is stocked until it is not.
        if (sp.unnestable && onUnnest && (f.x < -0.05 || f.x > 1.05 || f.y < -0.05 || f.y > 1.05)) onUnnest(sp.id);
        else put(f);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }

    // One of an item's other plantings, moved on its own. Same drag as anything else; it writes
    // back to that tree rather than to the item's own position.
    const copyTag = (e.target as Element | null)?.closest?.('[data-copy]')?.getAttribute('data-copy');
    if (copyTag && onMoveCopy) {
      const [id, ix] = [copyTag.slice(0, copyTag.lastIndexOf(':')), Number(copyTag.slice(copyTag.lastIndexOf(':') + 1))];
      e.preventDefault();
      const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) onMoveCopy(id, ix, insidePark({ w: 8, h: 8 }, p)); };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }

    if (!onPlaceItem) return;
    // What the pointer landed ON beats what its footprint says. A prop is drawn ABOVE the ground it
    // stands on, so grabbing a tree by its canopy read as a press on the grass behind the tree.
    // Only drawings that stand up count: the habitat's own ground and fence lie flat, and are found
    // by where they are.
    const prop = (e.target as Element | null)?.closest?.('[data-item]:not([data-part])')?.getAttribute('data-item');
    const grabbed = prop ? scene.movable.find((m) => m.id === prop) : undefined;
    const hit = grabbed ?? pick(w);
    if (!hit) { onSelect?.(null); return; }
    onSelect?.(hit.id);
    e.preventDefault();
    // Held where it was grabbed, so it does not jump its own centre under the pointer. A prop
    // grabbed by its canopy is the exception: the pointer is nowhere near its feet, and keeping
    // that offset walks the tree along a stride behind wherever it was let go.
    const grabX = grabbed ? 0 : w.x - hit.x, grabY = grabbed ? 0 : w.y - hit.y;
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (!p) return;
      // A press that turned into a drag was moving the thing, not choosing a part of it.
      if (touched && Math.hypot(p.x - w.x, p.y - w.y) > 4) { onPart?.(null); touched = null; }
      onPlaceItem(hit.id, insidePark({ w: hit.w, h: hit.h }, { x: p.x - grabX, y: p.y - grabY }));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // Planting dropped on a habitat is planting IN that habitat, standing where it was let go.
      // Anything else dropped on one is just standing on top of it: an animal arrives by being
      // stocked, which is a decision about the exhibit and not a place to drop something.
      const p = worldAt(ev);
      const item = state.backlog.find((it) => it.id === hit.id);
      if (!onNest || !p || item?.category !== 'flora') return;
      const enc = [...scene.rooms].sort((a, b) => b.z - a.z)
        .find((r) => Math.abs(p.x - r.x) <= r.w / 2 && Math.abs(p.y - r.y) <= r.h / 2);
      if (!enc || enc.id === item.enclosureId) return;
      onNest(hit.id, enc.id, {
        x: Math.min(0.92, Math.max(0.08, (p.x - (enc.x - enc.w / 2)) / enc.w)),
        y: Math.min(0.94, Math.max(0.1, (p.y - (enc.y - enc.h / 2)) / enc.h)),
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // A ring round what is picked up, drawn on the ground in the same projection as everything else,
  // so it lies flat on the grass instead of floating over it as a browser rectangle would.
  const held = selected ? scene.movable.find((m) => m.id === selected) : undefined;
  const ring = held && scene.ground(held.x - held.w / 2, held.y - held.h / 2, held.x + held.w / 2, held.y + held.h / 2);

  // ---- grips: how long a thing is, how wide, and which way it faces ------------------------
  //
  // A river has to reach both banks and a bridge has to cross it, which is a size and not a design.
  // The grips lie on the ground in the same projection as everything else,
  // because a browser handle floating over an isometric park belongs to neither.
  const heldItem = held ? state.backlog.find((it) => it.id === held.id) : undefined;
  const isLand = !!heldItem && heldItem.category === 'flora' && isLandscapeType(landType(heldItem));
  const canSize = isLand && !!onSetSize && !laying;
  const canTurn = !!onSetRot && !laying && !!heldItem
    && (isLand || heldItem.category === 'enclosure' || heldItem.category === 'amenity');

  /** Drag a grip, in the world the zoo is laid out in. What it does with the point it is given is
   *  the only thing that differs between them. */
  const grip = (e: ReactPointerEvent<SVGCircleElement>, apply: (p: { x: number; y: number }, ev: PointerEvent) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) apply(p, ev); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /** The dragged edge moves and the opposite edge stays put, so lengthening a river grows it
   *  towards the far bank rather than from its middle. The same rule the blueprint uses. */
  const resize = (axis: 'len' | 'wid') => (p: { x: number; y: number }) => {
    if (!held || !onSetSize) return;
    const left = held.x - held.w / 2, top = held.y - held.h / 2;
    if (axis === 'len') {
      const w = Math.round(Math.min(Math.max(p.x - left, 40), Math.max(40, CANVAS_W - 8 - left)));
      onSetSize(held.id, { w, h: held.h });
      onPlaceItem?.(held.id, { x: left + w / 2, y: held.y });
    } else {
      const h = Math.round(Math.min(Math.max(p.y - top, 24), Math.max(24, PLAY_H - 8 - top)));
      onSetSize(held.id, { w: held.w, h });
      onPlaceItem?.(held.id, { x: held.x, y: top + h / 2 });
    }
  };

  /** Landscape is an organic shape, so it swings to any angle and settles on fifteens. A habitat or
   *  a building is a box, and every box in an isometric park shares the same two axes - so those go
   *  round in quarters, which is the turn anybody actually wants anyway. */
  const turn3 = (p: { x: number; y: number }, ev: PointerEvent) => {
    if (!held || !onSetRot) return;
    const deg = (Math.atan2(p.y - held.y, p.x - held.x) * 180) / Math.PI;
    const step = isLand ? 15 : 90;
    onSetRot(held.id, ev.shiftKey && isLand ? deg : (((Math.round(deg / step) * step) % 360) + 360) % 360);
  };

  const [dropping, setDropping] = useState(false);

  // Walking up to something: the camera is a WINDOW on the drawing, not a magnifying glass over it.
  //
  // It was a CSS transform, and a scaled-up picture of a picture is what that gets you: the browser
  // draws the scene at the size it is laid out, then stretches the result, and everything you walked
  // up to arrived soft. Reported from playing it: "the zoomed image is out of focus." Moving the
  // viewBox instead re-draws the scene at the size it is being looked at, so walking closer makes
  // things sharper, the way walking closer does.
  //
  // It is still one camera over one drawing - everything the picture knows how to draw, the walk
  // walks past - and now the fences are lines again rather than a photograph of lines.
  const framed = (c: { x: number; y: number; zoom: number }) => {
    const eye = scene.at(c.x, c.y);
    const z = Math.max(1, c.zoom);
    const w = scene.w / z, h = scene.h / z;
    // Held inside the picture, so a thing near the edge is walked up to rather than walked past.
    return {
      x: Math.max(0, Math.min(scene.w - w, eye.x - w / 2)),
      y: Math.max(0, Math.min(scene.h - h, eye.y - h / 2)),
      w, h,
    };
  };
  const whole = { x: 0, y: 0, w: scene.w, h: scene.h };
  const [view, setView] = useState(whole);
  const viewNow = useRef(whole);
  // Only the numbers, so the walk is not restarted by every render the game's clock causes.
  const aim = camera ? `${camera.x.toFixed(1)},${camera.y.toFixed(1)},${camera.zoom}` : '';
  useEffect(() => {
    const to = camera ? framed(camera) : { x: 0, y: 0, w: scene.w, h: scene.h };
    const from = viewNow.current;
    const land = (box: typeof to) => { viewNow.current = box; setView(box); };
    const still = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still || (from.w === to.w && from.x === to.x && from.y === to.y)) { land(to); return; }
    let raf = 0;
    let t0 = 0;
    const step = (now: number) => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / TRAVEL_MS);
      // Ease in and out: a camera that starts and stops abruptly reads as a cut, not a walk.
      const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
      land({
        x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e,
      });
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aim, scene]);

  return (
    <div className={cn(className, dropping && 'rounded-lg ring-4 ring-primary/40')}
      onDragOver={onStartHere ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropping(true); } : undefined}
      onDragLeave={onStartHere ? () => setDropping(false) : undefined}
      onDrop={onStartHere ? (e) => {
        e.preventDefault();
        setDropping(false);
        const id = e.dataTransfer.getData('text/plain');
        const w = worldAt(e);
        // Inside the park, and inside it by enough that the site is not half off the grass. A drop
        // that landed nowhere in particular starts nothing: a site at no coordinates is a site
        // nobody can find, and it would be drawn as one.
        if (id && w && Number.isFinite(w.x) && Number.isFinite(w.y)) onStartHere(id, insidePark({ w: 80, h: 80 }, w));
      } : undefined}>
      {/* The scene keeps its own proportions and takes the width it is given: a park drawn to fit a
          fixed height sits letterboxed in the middle of a wide panel, half the size it could be. */}
      <svg ref={svgRef} viewBox={`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`}
        role="img" aria-label={scene.label}
        data-camera={camera ? aim : undefined}
        onPointerMove={placing ? (e) => {
          const w = worldAt(e);
          if (!w) return;
          if (drawn) { setDrawn({ ...drawn, b: w }); setGhost(verdictAt(w)); return; }
          setGhost(verdictAt(w));
        } : undefined}
        onPointerLeave={placing ? () => { setGhost(null); setDrawn(null); } : undefined}
        onPointerDown={placing
          ? (e) => {
            const w = worldAt(e);
            if (!w) return;
            e.preventDefault();
            setDrawn({ a: w, b: w });
            const move = (ev: PointerEvent) => { const p = worldAt(ev); if (p) setDrawn((d) => (d ? { ...d, b: p } : d)); };
            const up = (ev: PointerEvent) => {
              window.removeEventListener('pointermove', move);
              window.removeEventListener('pointerup', up);
              const p = worldAt(ev) ?? w;
              const box = { w: Math.abs(p.x - w.x), h: Math.abs(p.y - w.y) };
              const at = { x: (w.x + p.x) / 2, y: (w.y + p.y) / 2 };
              setDrawn(null);
              // A press with no drag is placing it where it stands; a drag is drawing its footprint.
              const drew = box.w > 20 && box.h > 14;
              const v = verdictAt(drew ? at : p);
              if (v?.ok && onPlace) onPlace(placing.id, { x: v.x, y: v.y }, drew ? box : undefined);
              setGhost(null);
            };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
          }
          : editable || laying ? onPointerDown : undefined}
        // Clipped. A prop is drawn ABOVE the point it stands on, so a tall tree at the back of the
        // park reaches past the top of the scene - and with the picture uncropped it was painted
        // over the page instead: a tree in the corner of the screen, cars and people off the park.
        // The scene keeps headroom for the tallest thing in it, and then holds its edges.
        style={{ display: 'block', width: '100%', height: 'auto', maxHeight: height,
          touchAction: editable || laying ? 'none' : undefined,
          // A pen when there is one, a hand when there is not.
          cursor: laying ? 'crosshair' : editable ? 'grab' : undefined }}>
        {scene.nodes}
        {/* The ghost: a translucent copy of what is being placed, with the park's verdict on it. */}
        {placing && ghost && (() => {
          const box = drawn
            ? { w: Math.abs(drawn.b.x - drawn.a.x), h: Math.abs(drawn.b.y - drawn.a.y) }
            : { w: placing.w, h: placing.h };
          const centre = drawn
            ? { x: (drawn.a.x + drawn.b.x) / 2, y: (drawn.a.y + drawn.b.y) / 2 }
            : { x: ghost.x, y: ghost.y };
          const hw = Math.max(12, box.w) / 2, hh = Math.max(9, box.h) / 2;
          const corners = [
            scene.at(centre.x - hw, centre.y - hh), scene.at(centre.x + hw, centre.y - hh),
            scene.at(centre.x + hw, centre.y + hh), scene.at(centre.x - hw, centre.y + hh),
          ];
          const middle = scene.at(centre.x, centre.y);
          return (
            <g data-part="ghost" pointerEvents="none">
              <polygon points={corners.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
                fill={ghost.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}
                stroke={ghost.ok ? '#059669' : '#dc2626'} strokeWidth={2} />
              {!ghost.ok && ghost.why && (
                <text x={middle.x} y={middle.y - 10} textAnchor="middle" fontSize={13} fontWeight={700} fill="#dc2626">
                  {ghost.why}
                </text>
              )}
            </g>
          );
        })()}
        {/* The run as it is being laid. Drawn over the scene rather than in it, because it is not
            part of the zoo until the pointer is let go. */}
        {run && (() => {
          // The run as it will actually be laid: the same quad the finished path is drawn as, at
          // the same width and colour. A hairline preview lies about the width, and a path's width
          // is the whole of "can two people walk it side by side?".
          const wdt = Math.max(4, (newConn?.thickness ?? 14) * 1.15);
          const dx = run.b.x - run.a.x, dy = run.b.y - run.a.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = (-dy / len) * wdt, ny = (dx / len) * wdt;
          const ex = (dx / len) * wdt, ey = (dy / len) * wdt;
          const a2 = { x: run.a.x - ex, y: run.a.y - ey }, b2 = { x: run.b.x + ex, y: run.b.y + ey };
          const corners = [scene.at(a2.x + nx, a2.y + ny), scene.at(b2.x + nx, b2.y + ny),
            scene.at(b2.x - nx, b2.y - ny), scene.at(a2.x - nx, a2.y - ny)];
          const start = scene.at(run.a.x, run.a.y);
          return (
            <g pointerEvents="none">
              <polygon points={corners.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
                fill={newConn?.color ?? '#c9a86a'} fillOpacity={0.85} stroke="#f97316"
                strokeWidth={Math.max(1, scene.u * 1.5)} strokeLinejoin="round" />
              {/* Where you put the pen down, so a run that has gone the wrong way is obvious. */}
              <circle cx={start.x} cy={start.y} r={Math.max(3, scene.u * 4)} fill="#f97316" />
            </g>
          );
        })()}
        {ring && <polygon points={ring} fill="none" stroke="#f97316" strokeWidth={Math.max(1.2, scene.u * 2)} strokeLinejoin="round" pointerEvents="none" />}
        {/* Improve. Only for something LIVE: there is nothing to improve about a construction
            site, and nothing to improve about work that has not been released - you are still
            building that one. Over the thing itself, since that is what the feedback is about. */}
        {held && heldItem?.status === 'open' && !laying && onImprove && (() => {
          const q = scene.at(held.x, held.y - held.h / 2);
          const queued = improving?.has(held.id);
          const h = Math.max(11, scene.u * 13), w = h * (queued ? 5.2 : 4.4);
          const y = q.y - h * 1.8;
          return (
            <g style={{ cursor: queued ? 'default' : 'pointer' }}
              onPointerDown={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
              onClick={queued ? undefined : (ev) => { ev.stopPropagation(); onImprove(held.id); }}>
              <title>{queued ? 'An Improve item is already waiting' : `Raise an Improve item for ${held.name}`}</title>
              <rect x={q.x - w / 2} y={y} width={w} height={h} rx={h / 2}
                fill={queued ? '#f59e0b' : '#fff'} stroke={queued ? '#f59e0b' : '#d97706'} strokeWidth={Math.max(0.8, scene.u * 1.1)} />
              <text x={q.x} y={y + h * 0.72} textAnchor="middle" fontSize={h * 0.62} fontWeight={600}
                fill={queued ? '#fff' : '#b45309'}>{queued ? 'Improving' : 'Improve'}</text>
            </g>
          );
        })()}
        {/* Taking one of the other plantings out. Shown on whatever is open on the bench rather
            than on hover: the machine this game is mostly played on has no hover, and an X you can
            only find by guessing it is there is one nobody finds. */}
        {onRemoveCopy && !laying && building && scene.copies.filter((c) => c.id === building).map((c) => {
          const g = scene.at(c.x, c.y);
          const q = c.over ?? { x: g.x, y: g.y - Math.max(10, scene.u * 13) };
          const r = Math.max(5, scene.u * 6);
          const arm = r * 0.45;
          const line = Math.max(0.9, scene.u * 1.4);
          return (
            <g key={`rm-${c.id}-${c.index}`} style={{ cursor: 'pointer' }}
              onPointerDown={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
              onClick={(ev) => { ev.stopPropagation(); onRemoveCopy(c.id, c.index); }}>
              <title>Take this one out</title>
              <circle cx={q.x} cy={q.y} r={r} fill="#fff" stroke="#b91c1c" strokeWidth={line} />
              <path d={`M${q.x - arm},${q.y - arm} L${q.x + arm},${q.y + arm} M${q.x + arm},${q.y - arm} L${q.x - arm},${q.y + arm}`}
                stroke="#b91c1c" strokeWidth={line} strokeLinecap="round" />
            </g>
          );
        })}
        {/* The grips themselves: one to lengthen, one to widen, one to turn. On the ground where
            the thing is, not floating over the picture in browser coordinates. */}
        {held && (canSize || canTurn) && (() => {
          const r = Math.max(4, scene.u * 6);
          const dot = (key: string, wx: number, wy: number, hint: string, fill: string,
            apply: (p: { x: number; y: number }, ev: PointerEvent) => void) => {
            // Held inside the park. A river runs the full width of it, so its end grip sat past the
            // edge of the picture and off the side of the screen - a grip nobody can reach is a
            // grip that is not there. Found by dragging one in a browser.
            const q = scene.at(Math.min(Math.max(wx, 8), CANVAS_W - 8), Math.min(Math.max(wy, 8), PLAY_H - 8));
            return (
              <circle key={key} cx={q.x} cy={q.y} r={r} fill={fill} stroke="#fff" strokeWidth={Math.max(0.8, scene.u * 1.2)}
                style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={(ev) => grip(ev, apply)}>
                <title>{hint}</title>
              </circle>
            );
          };
          return (
            <g>
              {canSize && dot('len', held.x + held.w / 2, held.y, 'Drag to make it longer or shorter', '#0ea5e9', resize('len'))}
              {canSize && dot('wid', held.x, held.y + held.h / 2, 'Drag to make it wider or narrower', '#0ea5e9', resize('wid'))}
              {canTurn && dot('rot', held.x, held.y - held.h / 2 - 18, 'Drag to turn it (hold Shift on landscape for any angle)', '#10b981', turn3)}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function build(state: ZooGameState, targetH: number, turn = 0, incrementOnly = false, grassClip = 'park-grass', targetW = 0) {
  // WHAT is on the park, how big it is and where it stands are decided in one place, shared with
  // the plan view - see parkModel. This file's job is to draw it from the corner, nothing else.
  // "Show the Increment only" takes the sites away: what is left is what has actually been
  // delivered, which is what the Sprint Review inspects. A site is a promise, and a promise is not
  // part of an Increment.
  const standing = standingOnPark(state).filter((s) => !incrementOnly || !s.underWay);
  const underWay = new Set(standing.filter((s) => s.underWay).map((s) => s.item.id));
  // Delivered work, for the counts: an animal living in a habitat is nested inside it rather than
  // standing on its own patch of ground, so it is not in `standing` and has to be counted from the
  // Backlog. The zoo has exhibits whether or not they take up room.
  const live = state.backlog.filter(standsOnPark);
  const encs = standing.filter((s) => s.item.category === 'enclosure').map((s) => s.item);
  const loose = standing.filter((s) => s.item.category !== 'enclosure').map((s) => s.item);
  const roomFor = new Map(standing.map((s) => [s.item.id, s]));

  // How busy the zoo is, on the same terms the park view uses: the lot fills with what is open to
  // visit, so the two views never disagree about how many cars turned up.
  const visitors = Math.round((Object.values(state.attendance) as number[]).reduce((a, b) => a + b, 0));
  const built = live.filter((i) => i.category === 'exhibit' || i.category === 'amenity').length;
  const carCount = Math.min(carCapacity(CANVAS_W), built * 3);
  const busCount = built >= 5 ? 2 : built >= 3 ? 1 : 0;
  const lot = carParkLayout(CANVAS_W, PLAY_H, carCount, busCount);
  const worldH = PLAY_H + lot.height;

  // ---- which way round the park is being looked at ---------------------------------------
  //
  // A quarter-turn is a coordinate swap, not a second projection: turn the world before projecting
  // it and everything follows, the back-to-front drawing order included. Quarter-turns only, on
  // purpose - every prop is drawn from one fixed angle, so at 37 degrees the trees, the cars and
  // the animals would all be facing the wrong way.
  //
  // Everything below still works in the park's own coordinates. The turn is applied here, in the
  // handful of places that convert a place in the park into a place in the picture.
  const q = ((turn % 4) + 4) % 4;
  const T = (x: number, y: number): Pt =>
    q === 1 ? { x: worldH - y, y: x }
      : q === 2 ? { x: CANVAS_W - x, y: worldH - y }
        : q === 3 ? { x: y, y: CANVAS_W - x }
          : { x, y };
  /** ...and back again, for a pointer arriving on a park that has been turned. */
  const unturn = (x: number, y: number): Pt =>
    q === 1 ? { x: y, y: worldH - x }
      : q === 2 ? { x: CANVAS_W - x, y: worldH - y }
        : q === 3 ? { x: CANVAS_W - y, y: x }
          : { x, y };
  /** A turned box is still a box - it is the corners that swap. */
  const Tbox = (x0: number, y0: number, x1: number, y1: number) => {
    const a = T(x0, y0), z = T(x1, y1);
    return [Math.min(a.x, z.x), Math.min(a.y, z.y), Math.max(a.x, z.x), Math.max(a.y, z.y)] as const;
  };
  // Turned a quarter, the park is as wide as it was tall.
  const RW = q % 2 ? worldH : CANVAS_W, RH = q % 2 ? CANVAS_W : worldH;

  // Fit the whole thing, car park included, into the space we have been given.
  const fit = screenBounds(RW, RH, 1);
  // Fitted to the pane it is actually in, when the pane has said how wide it is. Left to guess, it
  // assumed the room was 1.9 times as wide as it is tall - which was true of the pane it was written
  // for and of nothing else: in a narrower one the zoo is drawn small with a band of empty ground
  // above it, and the reading beside it gets pushed off the bottom of the screen. Reported from
  // playing it: "why do I need to scroll when there is lots of white space on the page above?"
  const u = Math.min((targetW || targetH * 1.9) / fit.w, targetH / fit.h) * 0.94;
  const b = screenBounds(RW, RH, u);
  const MARGIN = 26;
  // Room above the park for the tallest prop standing at the very back of it.
  const HEAD = (prop('tree')?.h ?? 0) * u * 1.9;
  const ox = b.ox + MARGIN, oy = b.oy + MARGIN + HEAD;

  const P = (wx: number, wy: number): Pt => { const t = T(wx, wy); const p = project(t.x, t.y, u); return { x: p.x + ox, y: p.y + oy }; };
  /** How far back something stands, on the park as it is being looked at. */
  const depth = (wx: number, wy: number): number => { const t = T(wx, wy); return depthOf(t.x, t.y); };
  const boxFaces = (x0: number, y0: number, x1: number, y1: number, h: number, k: number) => boxFacesOf(...Tbox(x0, y0, x1, y1), h, k);
  /** Fencing runs the way the park is turned, and a panel drawn up-slope becomes one drawn down. */
  /** Everything is drawn inset by the scene's margin, but `boxFaces` and `roofFaces` hand back raw
   *  projected points. Anything built from those has to be shifted, or it is drawn off the edge of
   *  the picture - which is silent, because a polygon at the wrong coordinates is still a polygon. */
  const shift = (s: string) => s.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${(x + ox).toFixed(1)},${(y + oy).toFixed(1)}`; }).join(' ');
  /** A patch of ground swung round its own middle, and then cut to the grass it lies on.
   *
   *  The order matters and it took a report to see it. Cutting first and turning afterwards gives a
   *  river that no longer reaches the banks - "it does not span the whole park area" - and whose
   *  corners swing out over the tarmac as you turn it: "it can cut across the car park if I turn it
   *  enough". Turning first and cutting afterwards gives what a river actually is: as long as it
   *  needs to be, stopping exactly at the edge of the grass, at any angle.
   *
   *  The cut is Sutherland-Hodgman against the four edges of the park - the standard way to trim a
   *  polygon to a rectangle, and the only way that stays right for a shape that is no longer
   *  aligned to anything. */
  const clipTo = (poly: Pt[], bx0: number, by0: number, bx1: number, by1: number): Pt[] => {
    const edges: [(p: Pt) => boolean, (a: Pt, z: Pt) => Pt][] = [
      [(p) => p.x >= bx0, (a, z) => ({ x: bx0, y: a.y + ((z.y - a.y) * (bx0 - a.x)) / (z.x - a.x) })],
      [(p) => p.x <= bx1, (a, z) => ({ x: bx1, y: a.y + ((z.y - a.y) * (bx1 - a.x)) / (z.x - a.x) })],
      [(p) => p.y >= by0, (a, z) => ({ x: a.x + ((z.x - a.x) * (by0 - a.y)) / (z.y - a.y), y: by0 })],
      [(p) => p.y <= by1, (a, z) => ({ x: a.x + ((z.x - a.x) * (by1 - a.y)) / (z.y - a.y), y: by1 })],
    ];
    let out = poly;
    for (const [keep, cross] of edges) {
      const src = out; out = [];
      for (let i = 0; i < src.length; i += 1) {
        const a = src[(i + src.length - 1) % src.length], z = src[i];
        const ain = keep(a), zin = keep(z);
        if (zin) { if (!ain) out.push(cross(a, z)); out.push(z); } else if (ain) out.push(cross(a, z));
      }
      if (!out.length) return [];
    }
    return out;
  };

  /** The four corners of a rectangle swung round its own middle. */
  const swing = (cx: number, cy: number, w: number, h: number, deg: number): Pt[] => {
    const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
      .map(([dx, dy]) => ({ x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }));
  };

  const drawPoly = (poly: Pt[]) => poly.map((q2) => { const p = P(q2.x, q2.y); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');

  const ground = (x0: number, y0: number, x1: number, y1: number) => shift(groundPoints(...Tbox(x0, y0, x1, y1), u));

  const zones = Array.from(new Set([...state.zones, ...state.backlog.map((i) => i.zone)]));
  const themeOf = (zone: string) => themeFor(zone, Math.max(0, zones.indexOf(zone)));

  // Positions: the item's own spot if it has one, otherwise the same automatic layout the park uses,
  // so the two views never disagree about where anything is.
  const sizeOf = (it: BacklogItem): { w: number; h: number } => roomFor.get(it.id)?.size ?? groundSize(it);
  const plots = zonePlots(state);
  const auto = parkPositions(standing, plots);
  const posOf = (it: BacklogItem): Pt => restingPlace(it, sizeOf(it), auto);

  const pieces: Piece[] = [];
  const push = (z: number, el: React.ReactNode) => pieces.push({ z, el });
  // Every distinct tint the scene wears, so each gets one `<filter>` and no more.
  const tints = new Map<string, Tint>();

  /** A licensed prop, standing on a world point. `k` scales it; props are drawn feet-down, so the
   *  drawing hangs above the point it stands on. */
  /** Stand a drawing from the artwork sheet on the park.
   *
   *  Held to the land, and that is the point of it being one function. "There are random objects off
   *  the park" has been reported four times, and it has been a different caller every time: plants
   *  marching off in a line, a bridge deck drawn from unshifted points, guests and cars sharing a
   *  React key so one was drawn where another belonged. Each was fixed where it happened, and the
   *  next one arrived by a route nobody had thought of.
   *
   *  Every prop in the scene - trees, people, cars, benches - comes through here, so here is where
   *  the rule belongs: nothing is drawn off the land. The land is the whole world, grass AND tarmac,
   *  because a visitor on the promenade and a car in the lot are both standing somewhere real; it is
   *  only outside THAT that there is nothing to stand on.
   *
   *  It does not make the arithmetic right - a tree held at the edge is still a tree in the wrong
   *  place. It makes it stay in the picture, where it can be seen to be wrong, instead of floating
   *  in the white beside the park looking like the game has come apart. */
  // A pace inside the edge, not exactly on it: held to the boundary, a prop's feet land on the line
  // itself, which is as much off the park as on it - and reads as a tree growing out of thin air at
  // the corner of the land.
  const onLand = (v: number, hi: number) => Math.max(1, Math.min(hi - 1, v));
  const place = (name: string, rawX: number, rawY: number, k: number, key: string, tintTo?: string, paint?: Tint,
    /** What this drawing IS, so a pointer that lands on it can say what it touched. A prop is drawn
     *  above the ground it stands on - you grab a tree by its canopy, and its canopy is nowhere
     *  near its footprint - so what was touched cannot be worked out from where its feet are. */
    tag?: Record<string, string>) => {
    const p = prop(name);
    if (!p) return;
    const wx = onLand(rawX, CANVAS_W), wy = onLand(rawY, worldH);
    const at = P(wx, wy);
    const w = p.w * k, h = p.h * k;
    const body = p.tint && tintTo ? tint(p.body, tintTo, p.tint) : p.body;
    const top = at.y - h + w * 0.29;
    // Tinted by a filter hung on a wrapper, not by a style on the drawing: the drawing is a nested
    // `<svg>`, and that is precisely where WebKit drops a CSS filter on the floor.
    if (paint) tints.set(tintKey(paint), paint);
    const drawing = (
      <svg key={key} x={at.x - w / 2} y={top} width={w} height={h} viewBox={p.viewBox} overflow="visible"
        {...tag} dangerouslySetInnerHTML={{ __html: body }} />
    );
    push(depth(wx, wy), paint
      ? <g key={key} filter={tintRef(grassClip, paint)}>{drawing}</g>
      : drawing);
    // Where the top of the drawing came out, for anything that has to sit clear of it.
    return { x: at.x, top };
  };

  // ---- the land itself -------------------------------------------------------------------
  // Park and car park are one piece of ground, so the ground is drawn once, with one edge around
  // the outside of the lot. Giving the park its own edge put a cliff between the fence and the
  // tarmac that visitors were then seen to walk off.
  const nodes: React.ReactNode[] = [];
  /** Everything standing INSIDE a habitat that can be picked up on its own: each animal of a
   *  family, and any planting nested in with them. Held as a world box and the habitat box it
   *  belongs to, because a spot is a fraction of its own habitat and nothing else. */
  const spots: { id: string; member: number; enc: string; x: number; y: number; w: number; h: number;
    z: number; box: { x: number; y: number; w: number; h: number }; unnestable: boolean }[] = [];
  /** The extra plantings one item puts in the park, each standing somewhere of its own. */
  const copies: { id: string; index: number; x: number; y: number; z: number;
    over: { x: number; y: number } | null }[] = [];
  const EDGE = 13;
  const grass = '#8cc063';
  const tarmac = '#9a9ea3';
  // The same front the plan paints and the routing walks - one definition, in parkLayout.
  const promY = PROMENADE_Y;
  const meadow = '#bcc98e';
  const grassPath = outlinePath(parkOutline().map((pt) => P(pt.x, pt.y)));
  const cFL = P(0, worldH), cFR = P(CANVAS_W, worldH), cR = P(CANVAS_W, 0);
  nodes.push(
    <polygon key="edge-l" points={`${P(0, worldH).x},${P(0, worldH).y} ${cFR.x},${cFR.y} ${cFR.x},${cFR.y + EDGE} ${cFL.x},${cFL.y + EDGE}`} fill={shade(tarmac, -40)} />,
    <polygon key="edge-r" points={`${cR.x},${cR.y} ${cFR.x},${cFR.y} ${cFR.x},${cFR.y + EDGE} ${cR.x},${cR.y + EDGE}`} fill={shade(meadow, -52)} />,
    // The countryside the park sits in, and then the park's own ground on top of it - the same
    // wandering boundary the plan draws, put through the same projection as everything else, so the
    // two views are one park seen twice rather than two parks that nearly agree.
    <polygon key="field" data-land="field" points={ground(0, 0, CANVAS_W, PLAY_H)} fill={meadow} />,
    <path key="grass" data-land="grass" d={grassPath}
      fill={grass} stroke={shade(grass, -34)} strokeWidth={2} />,
    // Landscape is cut to this, so a river stops at its bank instead of hanging over the meadow.
    <clipPath key="grass-clip" id={grassClip}><path d={grassPath} /></clipPath>,
    <polygon key="prom" points={ground(0, promY, CANVAS_W, PLAY_H)} fill="#e7d6a8" />,
    <polygon key="apron" data-land="apron" points={ground(0, PLAY_H, CANVAS_W, worldH)} fill={tarmac} />,
  );

  // The river, drawn on the land rather than standing on it - terrain, the same course the plan
  // draws, put through this view's own projection.
  nodes.push(
    <path key="river" data-part="river" d={outlinePath(riverOutline().map((pt) => P(pt.x, pt.y)))}
      fill="#6db6d8" stroke="#4f9cbf" strokeWidth={1.5} clipPath={`url(#${grassClip})`} />,
  );

  // The ground each area of the zoo owns, tinted on the grass. The same plots the plan marks out:
  // an Increment that showed no areas, beside a plan laid out in them, would be two zoos.
  [...plots.values()].forEach((p) => {
    const theme = themeOf(p.zone);
    const open = standing.some((s) => s.item.zone === p.zone);
    nodes.push(
      <polygon key={`plot-${p.zone}`} data-plot={p.zone} points={ground(p.x0, p.y0, p.x1, p.y1)}
        fill={theme.plot} opacity={open ? 0.34 : 0.16} stroke={theme.plotBorder} strokeWidth={1.5}
        strokeDasharray={open ? undefined : '10 8'} />,
    );
  });

  // A line of trees along the boundary, standing on the same points the boundary is drawn through.
  // Not decoration for its own sake: a green edge fading into a green middle reads as a blob, and
  // the trees are what say "the park stops here". None along the front - that is the way in.
  hedgePoints(HEDGE_STEP * 2.5).forEach(({ x, y, n }) => {
    place(n % 4 ? 'tree' : 'treeTall', x, y, u * HEDGE_R * (0.04 + 0.018 * edgeNoise(n)), `hedge-${n}`,
      undefined, undefined, { 'data-prop': 'hedge' });
  });

  // A bay's x,y is its CENTRE, the same as a parked car's - so the markings line up with what is
  // parked in them instead of sitting half a bay down the tarmac.
  for (const bay of lot.empties ?? []) {
    nodes.push(<polygon key={`bay-${bay.x}-${bay.y}`}
      points={ground(bay.x - bay.w / 2, bay.y - bay.h / 2, bay.x + bay.w / 2, bay.y + bay.h / 2)}
      fill="none" stroke="#f2f4f5" strokeWidth={Math.max(0.6, u * 1.4)} strokeLinejoin="round" />);
  }
  // The footway from the lay-by up to the gate, which is where the guests actually walk in.
  nodes.push(<polygon key="walkway" points={ground(lot.walkway.x, lot.walkway.y, lot.walkway.x + lot.walkway.w, lot.walkway.y + lot.walkway.h)} fill="#c9cdd1" />);

  // Where a guest may put their feet. Collected as the park is drawn, because the park is what
  // decides it: the paths are the ones actually laid, and the water is the water actually there.
  const walks: [Pt, Pt][] = [];
  const water: Rect[] = [];
  const dry: Rect[] = [];

  // ---- paths the player drew -------------------------------------------------------------
  for (const c of state.connectors ?? []) {
    const a = c.a.featureId ? posOf(state.backlog.find((i) => i.id === c.a.featureId) ?? ({} as BacklogItem)) : { x: c.a.x, y: c.a.y };
    const z = c.b.featureId ? posOf(state.backlog.find((i) => i.id === c.b.featureId) ?? ({} as BacklogItem)) : { x: c.b.x, y: c.b.y };
    if (!Number.isFinite(a.x) || !Number.isFinite(z.x)) continue;
    // The width and the colour the path was actually laid with. This drew every route sixteen wide
    // in one fixed tan, so changing a pathway's width or its surface on the bench changed the plan
    // and nothing here - and the Increment is where a path is meant to look like a path.
    const wdt = Math.max(4, (c.thickness || 14) * 1.15);
    const dx = z.x - a.x, dy = z.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * wdt, ny = (dx / len) * wdt;
    // Run each path half its own width past both ends, so where two meet they overlap into the
    // corner instead of leaving a notch. They are all one colour, so the overlap cannot be seen -
    // which is the whole trick: a junction should look like a junction, not like two paths.
    const ex = (dx / len) * wdt, ey = (dy / len) * wdt;
    const a2 = { x: a.x - ex, y: a.y - ey }, z2 = { x: z.x + ex, y: z.y + ey };
    const corners = [P(a2.x + nx, a2.y + ny), P(z2.x + nx, z2.y + ny), P(z2.x - nx, z2.y - ny), P(a2.x - nx, a2.y - ny)];
    nodes.push(<polygon key={`path-${c.id}`} data-conn={c.id}
      points={corners.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill={c.color || '#ddc79a'} />);
    walks.push([{ x: a.x, y: a.y }, { x: z.x, y: z.y }]);
  }

  // ---- the apron round each habitat ------------------------------------------------------
  //
  // Every habitat has a walkway round it whether anybody drew one or not: a pen you cannot walk
  // round is an object in a field, not an exhibit. Reported from playing it - the drawn pathways
  // only ever connected two points, so nothing went round anything. Drawn as four bands of ground
  // rather than an outline, because in this view a path is a surface people stand on.
  for (const st of standing) {
    if (st.item.category !== 'enclosure') continue;
    const at = posOf(st.item);
    if (!Number.isFinite(at.x)) continue;
    const hx = st.size.w / 2 + APRON_GAP, hy = st.size.h / 2 + APRON_GAP;
    const ox = hx + APRON_WIDTH, oy = hy + APRON_WIDTH;
    const band = (x0: number, y0: number, x1: number, y1: number, key: string) => {
      nodes.push(<polygon key={`apron-${st.item.id}-${key}`} data-apron={st.item.id}
        points={ground(at.x + x0, at.y + y0, at.x + x1, at.y + y1)} fill="#d8bf8f" />);
    };
    band(-ox, -oy, ox, -hy, 'n');
    band(-ox, hy, ox, oy, 's');
    band(-ox, -hy, -hx, hy, 'w');
    band(hx, -hy, ox, hy, 'e');
    // ...and the visitors may walk it, which is the point of it.
    const ring = apronRing(at, st.size);
    for (let i = 0; i < ring.length - 1; i += 1) walks.push([ring[i], ring[i + 1]]);
  }

  /** The hoardings round work that is under way.
   *
   *  The same language the plan view uses - amber hatching, a dashed line and hazard posts at the
   *  corners - so that "this is a building site" reads the same in both views. They come down when
   *  the item is Done and released, which is the Definition of Done made into something you watch.
   */
  const hoard = (id: string, x0: number, y0: number, x1: number, y1: number) => {
    const pad = 9;
    const a = x0 - pad, b = y0 - pad, c = x1 + pad, d = y1 + pad;
    const dash = Math.max(2.5, u * 7);
    nodes.push(
      <polygon key={`site-${id}`} points={ground(a, b, c, d)} fill="#f59e0b" opacity={0.16}
        clipPath={`url(#${grassClip})`} />,
      <polygon key={`site-edge-${id}`} points={ground(a, b, c, d)} fill="none" stroke="#f59e0b"
        clipPath={`url(#${grassClip})`}
        strokeWidth={Math.max(0.7, u * 1.6)} strokeDasharray={`${dash} ${dash * 0.7}`} strokeLinejoin="round" />,
    );
    // Named, and said. Orange hoardings read as "something is happening here"; the name and the
    // words say WHAT is happening and that it is not Done yet, which is the difference the whole
    // Increment tab is about.
    const label = state.backlog.find((it) => it.id === id)?.name;
    if (label) {
      const at = P((a + c) / 2, b);
      // Two lines, spaced by what they actually measure rather than by a guess: at the size a park
      // is drawn, both sizes clamp to their minimums and a fixed gap put one line through the other.
      const name = Math.max(9, u * 10);
      const note = Math.max(7, u * 7.5);
      const noteY = at.y - Math.max(5, u * 6);
      push(depth((a + c) / 2, b) + 0.5, (
        <g key={`site-name-${id}`} pointerEvents="none">
          <text x={at.x} y={noteY - note * 1.25} textAnchor="middle" fontSize={name}
            fontWeight={700} fill="#b45309" stroke="#fff" strokeWidth={Math.max(1.6, u * 2.2)} paintOrder="stroke">
            {label}
          </text>
          <text x={at.x} y={noteY} textAnchor="middle" fontSize={note}
            fontWeight={600} fill="#b45309" stroke="#fff" strokeWidth={Math.max(1.3, u * 1.8)} paintOrder="stroke">
            built, not Done
          </text>
        </g>
      ));
    }
    const posts: [number, number][] = [[a, b], [c, b], [c, d], [a, d]];
    for (const [i, [px, py]] of posts.entries()) {
      const f = boxFaces(px - 3, py - 3, px + 3, py + 3, Math.max(2.5, u * 9), u);
      push(depth(px, py), (
        <g key={`post-${id}-${i}`}>
          <polygon points={shift(f.left)} fill="#b45309" />
          <polygon points={shift(f.right)} fill="#d97706" />
          <polygon points={shift(f.top)} fill="#fbbf24" />
        </g>
      ));
    }
  };

  // ---- enclosures ------------------------------------------------------------------------
  // ---- rock ----------------------------------------------------------------------------------
  //
  // A rocky outcrop, drawn rather than found. There is no rock on the artwork sheet, and rocks were
  // getting whatever the sheet handed back for a name it did not know - which was a tree. So a
  // boulder in a big cat enclosure came out as a white tree, and out on the grounds a Boulders item
  // was a flat grey rectangle lying on the grass.
  //
  // Each boulder is a ring of points at a height, its facets dropped to the ground and shaded by
  // which way they turn, with a paler cap on top. The ring is wobbled by `jitter`, which is a hash
  // rather than a random number, so a rock has its own shape and keeps it - the same rock every
  // time the park is drawn, which matters when the park is redrawn on every tick.
  const boulder = (key: string, cx: number, cy: number, r: number, h: number, hex: string, seed: number) => {
    const N = 6;
    const ring = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 + 0.35;
      const wob = 0.74 + jitter(seed + i, 5) * 0.5;
      return { x: cx + Math.cos(a) * r * wob, y: cy + Math.sin(a) * r * wob };
    });
    const cap = ring.map((q2) => { const s2 = P(q2.x, q2.y); return { x: s2.x, y: s2.y - h }; });
    const foot = ring.map((q2) => P(q2.x, q2.y));
    const pts = (ps: Pt[]) => ps.map((q2) => `${q2.x.toFixed(1)},${q2.y.toFixed(1)}`).join(' ');
    return (
      <g key={key}>
        {ring.map((_, i) => {
          const j = (i + 1) % N;
          const face = Math.sin((i / N) * Math.PI * 2 + 0.35);
          return <polygon key={i} points={pts([cap[i], cap[j], foot[j], foot[i]])}
            fill={shade(hex, -14 - Math.round(20 * (0.5 + 0.5 * face)))} />;
        })}
        <polygon points={pts(cap)} fill={shade(hex, 16)} />
      </g>
    );
  };

  /** An outcrop: a big one with two or three smaller ones tumbled round it. One boulder alone reads
   *  as a pebble somebody dropped; a group reads as rock. */
  const outcrop = (key: string, cx: number, cy: number, w: number, hex: string, seed: number) => {
    const r = Math.max(2.5, w * 0.3);
    const round = [[0, 0, 1], [-0.85, 0.34, 0.6], [0.78, 0.42, 0.52], [0.1, -0.66, 0.44]];
    return (
      <g key={key}>
        {round.map(([dx, dy, k], i) => boulder(`${key}-${i}`,
          cx + dx * r * 1.15, cy + dy * r * 1.15, r * k, Math.max(1.5, u * 15 * k), hex, seed + i * 7))}
      </g>
    );
  };

  for (const e of encs) {
    const c = posOf(e), size = sizeOf(e);
    const x0 = c.x - size.w / 2, y0 = c.y - size.h / 2, x1 = c.x + size.w / 2, y1 = c.y + size.h / 2;
    const theme = themeOf(e.zone);
    if (underWay.has(e.id)) hoard(e.id, x0, y0, x1, y1);

    // What has been designed so far - including the draft, because a habitat being built is exactly
    // the one whose ground and fence you are choosing right now. This view painted from the zone's
    // theme and ignored the design altogether, so picking a ground or a fence changed nothing here
    // and adding water added nothing. There is no preview: the thing itself is what you look at.
    const d = working(e);
    // A tank, or a paddock. A reef is not kept in a field with a pond in the corner: it is kept
    // behind glass with water to the top, and the visitors look through it.
    const living = state.backlog.filter((it) => it.enclosureId === e.id);
    const tank = isTank(d, living, e);
    const floor = tank ? shade(tankWater(d), -22) : (d?.colors.ground ?? theme.plot);
    const fence = tank ? (d?.colors.fence ?? '#cfe6f2') : (d?.colors.fence ?? theme.plotBorder);

    // The habitat floor, laid flat, in the shape it was given.
    const outline = outlineOf(d?.parts.shape ?? 'rounded', size.w, size.h)
      .map(([px, py]: [number, number]) => ({ x: x0 + px, y: y0 + py }));
    // Tagged with what it is, so a touch on the park can say which part was touched. The bench has
    // always told you to touch a part of it; in this view there was nothing to touch.
    nodes.push(<polygon key={`floor-${e.id}`} fill={floor} data-item={e.id} data-part="ground"
      points={outline.map((q) => { const p = P(q.x, q.y); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')} />);

    // Water lies on the floor, in its own corner of the habitat - held as fractions of the box, so
    // it stays where it was put whatever size the habitat is.
    for (const [i, wf] of enclosureWater(d).entries()) {
      nodes.push(<polygon key={`water-${e.id}-${i}`} data-item={e.id} data-part="water"
        points={ground(x0 + wf.x * size.w, y0 + wf.y * size.h, x0 + (wf.x + wf.w) * size.w, y0 + (wf.y + wf.h) * size.h)}
        fill={d?.colors.water ?? '#5aa9c8'} />);
    }

    // Fencing, following the outline round.
    //
    // The panels are drawings, and there are two of them: one for a side running one way across the
    // park and one for the other. That is fine for a rectangle, whose four sides run exactly those
    // two ways, and impossible for a hexagon - a slanted side has no panel to stand along it, which
    // is why the first attempt at this scattered broken fencing round the shaped habitats.
    //
    // So a habitat whose sides all run true gets its pickets, and any other shape gets a low wall
    // built the same way the bridge deck is: one drawing per habitat, never half of each.
    // The fence a lion is actually kept behind.
    //
    // It was a picket: panels off the artwork sheet, knee-high, the sort of thing round a cottage
    // garden. Reported from playing it: "the fence around the lion enclosure is not really
    // appropriate - can it be a higher wire fence or similar?" So it is drawn rather than stamped:
    // posts, a top rail and mesh between them, tall enough to read as an enclosure from across the
    // park. Every side is its own piece, sorted with everything else, so the near ones stand in
    // front of what is inside.
    // ...and how tall, and how much you see through it, is the choice somebody made about what holds
    // the animals in. A hedge is low and solid green; a wall is high and you see nothing; a high
    // fence is tall and still mesh. A choice the park does not draw is a choice nobody can check.
    const held = barrierOf(d, living);
    const tall = (({ hedge: 0.45, fence: 1, high: 1.7, wall: 1.35, glass: 1 } as Record<string, number>)[held.key]) ?? 1;
    const fenceH = Math.max(6, u * 22) * tall;
    const solid = held.key === 'wall' || held.key === 'hedge';
    const barrierPaint = held.key === 'hedge' ? '#4e7a3c' : fence;
    const lift = (q: Pt, k: number): Pt => ({ x: q.x, y: q.y - k });
    outline.forEach((from, i) => {
      const to = outline[(i + 1) % outline.length];
      const a = P(from.x, from.y), b = P(to.x, to.y);
      const topA = lift(a, fenceH), topB = lift(b, fenceH);
      const wire = Math.max(0.5, u * 0.7);
      // The mesh: uprights every so often across the run, thin and pale, so you see the animals
      // through it. Capped, because a habitat the width of the park does not need three hundred.
      const span = Math.hypot(b.x - a.x, b.y - a.y);
      const wires = Math.max(2, Math.min(28, Math.round(span / Math.max(6, u * 7))));
      const mesh: React.ReactNode[] = [];
      for (let k = 1; k < wires; k += 1) {
        const t = k / wires;
        const g = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        mesh.push(<line key={`m${k}`} x1={g.x} y1={g.y} x2={g.x} y2={g.y - fenceH} stroke={fence} strokeWidth={wire} opacity={0.5} />);
      }
      push(depth((from.x + to.x) / 2, (from.y + to.y) / 2), (
        <g key={`fence-${e.id}-${i}`} data-item={e.id} data-part="fence" data-holds={held.key}>
          {/* What you see through - a wash, not a wall. A tank's is glass: one pane, no mesh, with
              the water behind it and a bright edge where the light catches the top. */}
          <polygon points={[a, b, topB, topA].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
            fill={tank ? tankWater(d) : barrierPaint}
            fillOpacity={tank ? 0.5 : solid ? 0.92 : held.key === 'glass' ? 0.22 : 0.14} />
          {tank || held.key === 'glass'
            ? <polygon points={[a, b, topB, topA].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')}
                fill="#eaf6fb" fillOpacity={0.16} />
            : solid ? null : mesh}
          {/* Posts at the corners of every run, and a rail along the top and the middle. */}
          <line x1={a.x} y1={a.y} x2={topA.x} y2={topA.y} stroke={shade(fence, -20)} strokeWidth={Math.max(1.2, u * 1.8)} strokeLinecap="round" />
          <line x1={b.x} y1={b.y} x2={topB.x} y2={topB.y} stroke={shade(fence, -20)} strokeWidth={Math.max(1.2, u * 1.8)} strokeLinecap="round" />
          <line x1={topA.x} y1={topA.y} x2={topB.x} y2={topB.y} stroke={shade(fence, -20)} strokeWidth={Math.max(1, u * 1.4)} strokeLinecap="round" />
          {!solid && held.key !== 'glass' && (
            <line x1={a.x} y1={a.y - fenceH * 0.55} x2={b.x} y2={b.y - fenceH * 0.55} stroke={fence} strokeWidth={wire} opacity={0.6} />
          )}
        </g>
      ));
    });

    // Water to the top, drawn over everything in the tank.
    //
    // This is what makes it read as an aquarium rather than a glass-walled paddock: the surface sits
    // near the top of the panes, and the fish are UNDER it. It goes in at the depth of the tank's
    // front edge so it is sorted in front of what it covers - one sheet over the whole habitat
    // rather than a pane at a time, because water has one surface however many sides it is held in.
    if (tank) {
      const surfaceH = fenceH * 0.82;
      push(depth(c.x, y1), (
        <g key={`tank-${e.id}`} data-item={e.id} data-part="water">
          <polygon points={outline.map((q) => { const p = P(q.x, q.y); return `${(p.x).toFixed(1)},${(p.y - surfaceH).toFixed(1)}`; }).join(' ')}
            fill={tankWater(d)} fillOpacity={0.42} />
          {/* The light on it. A flat wash of blue is a lid; a paler edge is a surface. */}
          <polygon points={outline.map((q) => { const p = P(q.x, q.y); return `${(p.x).toFixed(1)},${(p.y - surfaceH).toFixed(1)}`; }).join(' ')}
            fill="none" stroke="#eaf6fb" strokeOpacity={0.55} strokeWidth={Math.max(1, u * 1.6)} />
        </g>
      ));
    }

    // A band round the edge that answers for the fence.
    //
    // A picket is a few pixels of drawing, and a pointer that misses one by a hair lands on the
    // grass behind it - so touching the fence to colour it was a game of its own. Invisible, and
    // laid over the ground: near the edge means the fence, inside means the ground.
    nodes.push(<polygon key={`fence-hit-${e.id}`} fill="none" stroke="transparent"
      strokeWidth={Math.max(3, u * 11)} strokeLinejoin="round" data-item={e.id} data-part="fence"
      points={outline.map((q) => { const p = P(q.x, q.y); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')} />);

    // Planting inside the habitat: both the enclosure's own greenery, which is part of its design
    // and holds its own spot in the box, and any planting item dragged in on top of it.
    for (const [i, f] of enclosureFlora(d).entries()) {
      // In the colours it was given. A habitat's own planting is coloured plant by plant in the
      // studio and arrived here in the artwork's green whatever anybody chose - so the control was
      // there, and doing nothing.
      const fx = x0 + f.x * size.w, fy = y0 + f.y * size.h;
      if (f.type === 'rocks') {
        push(depth(fx, fy), outcrop(`ef-${e.id}-${i}`, fx, fy, 26 * (f.s || 1),
          f.foliage ?? floraDefaultColors('rocks').foliage, i * 11 + e.id.length));
        continue;
      }
      place(treeProp(f.type), fx, fy, u * 1.2 * (f.s || 1),
        `ef-${e.id}-${i}`, undefined, foliageTint(f.foliage ?? floraDefaultColors(f.type).foliage));
    }
    const plants = roomFor.get(e.id)?.plants ?? [];
    plants.forEach((pl, i) => {
      const t = jitter(i + 1, e.id.length);
      const wx = x0 + 16 + t * Math.max(4, size.w - 32);
      const wy = y0 + 12 + jitter(i + 2, e.id.length + 7) * Math.max(4, size.h - 24);
      place(treeProp(landType(pl)), wx, wy, u * 1.2, `pl-${e.id}-${pl.id}-${i}`,
        undefined, foliageTint(working(pl).colors.foliage), { 'data-spot': `${pl.id}:0` });
      // Planting can be dragged back out of a habitat; an animal cannot walk itself out.
      spots.push({ id: pl.id, member: 0, enc: e.id, x: wx, y: wy, w: 24, h: 24,
        z: depth(wx, wy), box: { x: x0, y: y0, w: size.w, h: size.h }, unnestable: true });
    });

    // The animals themselves, in the side view they were drawn in.
    // Including the one being stocked right now, so you watch the lion arrive rather than having it
    // appear the instant somebody presses Done.
    const stock = roomFor.get(e.id)?.animals ?? [];
    // Flattened the same way the Plan flattens it, so the two views number the herd alike and an
    // animal dragged there is the animal that moves here.
    const herd = stock.flatMap((a) => {
      const members = groupMembers(working(a).group);
      const list = members.length ? members : [{ kind: 'males' as const, scale: KIND_SCALE.males }];
      return list.map((m, mi) => ({ a, m, mi }));
    });
    herd.forEach(({ a, m, mi }, hi) => {
      {
        const f = habitatSpot(a, hi, herd.length, mi, size);
        const wx = x0 + f.x * size.w;
        const wy = y0 + f.y * size.h;
        const species = a.template ?? a.id;
        // A lioness has no mane, and a cub is a small lion that has not grown one.
        const art = animalArtFor(species, m.kind);
        // ...and a coat is a decision about what the zoo is for, so it has to be visible. It was
        // drawn on the plan view's animals, and the plan view stopped drawing animals.
        const coat = coatTint(working(a).colors.coat, speciesBody(a));
        if (coat) tints.set(tintKey(coat), coat);
        const at = P(wx, wy);
        const key = `a-${e.id}-${a.id}-${mi}`;
        // Each animal of the family, on its own. A pride is not a blob, and arranging them is the
        // point - so each one is something the pointer can find, at about its own size.
        spots.push({ id: a.id, member: mi, enc: e.id, x: wx, y: wy, w: 22 * m.scale, h: 22 * m.scale,
          z: depth(wx, wy), box: { x: x0, y: y0, w: size.w, h: size.h }, unnestable: false });
        if (art) {
          const h = art.h * u * 0.30 * m.scale;
          const w = h * (art.w / art.h);
          // An animal looks at the fence it is nearest. Standing by the rail with your back to the
          // people watching you is what a drawing does and an animal does not, and it is the tell
          // that a habitat is a box with pictures in it rather than somewhere something lives.
          //
          // The drawings face sideways, so the four fences come down to two answers: the near edge
          // is either off to the left of the picture or off to the right. `flip` is the sheet's own
          // facing, so the two are combined rather than one overriding the other - which is also
          // what fixes the species that were marked flipped and were being SHIFTED sideways instead
          // of turned round, because the old transform moved them and never mirrored them.
          const toLeft = Math.min(wx - x0, y1 - wy);
          const toRight = Math.min(x1 - wx, wy - y0);
          const facesLeft = toLeft <= toRight;
          const mirror = facesLeft !== !!art.flip;
          push(depth(wx, wy), (
            // Mirrored with an SVG transform on a wrapper, about the line the animal stands on:
            // `scale(-1,1)` alone reflects through the origin and sends it off the far side, so the
            // translate brings it back. A CSS transform with transform-box: fill-box looked like the
            // tidier way to say this and put two lions in four somewhere off the picture entirely.
            <g key={key} data-spot={`${a.id}:${mi}`} filter={coat ? tintRef(grassClip, coat) : undefined}
              transform={mirror ? `translate(${(at.x * 2).toFixed(1)},0) scale(-1,1)` : undefined}>
              <svg x={at.x - w / 2} y={at.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
                dangerouslySetInnerHTML={{ __html: art.body }} />
            </g>
          ));
        } else {
          // No drawing for this species yet: a coloured marker, so it is still visibly here.
          const cols = speciesColors(a);
          const r = Math.max(2, u * 7 * m.scale);
          push(depth(wx, wy), (
            <g key={key} data-spot={`${a.id}:${mi}`}>
              <ellipse cx={at.x} cy={at.y} rx={r * 1.1} ry={r * 0.5} fill="rgba(0,0,0,.16)" />
              <ellipse cx={at.x} cy={at.y - r * 0.8} rx={r} ry={r * 0.8} fill={cols.body} />
            </g>
          ));
        }
      }
    });
  }

  /** A bridge, built rather than painted on.
   *
   *  Every landscape feature was one flat coloured diamond lying on the grass, which is fine for a
   *  pond and wrong for a bridge: a bridge is the one piece of landscape that is above the ground,
   *  and drawing it flat left a brown rectangle in the water with nothing to walk on. This gives it
   *  the three things that read as a bridge from the corner - a deck you can see the top of, the
   *  side of that deck, and a handrail along both edges.
   */
  const bridge = (id: string, x0: number, y0: number, x1: number, y1: number, wood: string, trim: string) => {
    const deckH = Math.max(2.5, u * 7);
    const railH = Math.max(4, u * 10);
    const f = boxFaces(x0, y0, x1, y1, deckH, u);
    const up = (p: Pt, h: number): Pt => ({ x: p.x, y: p.y - h });
    // The handrails run along the two long sides - the way you walk over it.
    const along = (x1 - x0) >= (y1 - y0);
    const sides: [Pt, Pt][] = along
      ? [[{ x: x0, y: y0 }, { x: x1, y: y0 }], [{ x: x0, y: y1 }, { x: x1, y: y1 }]]
      : [[{ x: x0, y: y0 }, { x: x0, y: y1 }], [{ x: x1, y: y0 }, { x: x1, y: y1 }]];
    // Planks across the way you walk, so the deck reads as a deck and not a slab of colour.
    const span = along ? x1 - x0 : y1 - y0;
    const n = Math.max(3, Math.min(14, Math.round(span / 14)));
    const planks = Array.from({ length: n - 1 }, (_, i) => {
      const t = (i + 1) / n;
      const a = along ? { x: x0 + (x1 - x0) * t, y: y0 } : { x: x0, y: y0 + (y1 - y0) * t };
      const z = along ? { x: x0 + (x1 - x0) * t, y: y1 } : { x: x1, y: y0 + (y1 - y0) * t };
      const A = up(P(a.x, a.y), deckH), B = up(P(z.x, z.y), deckH);
      return <line key={`k${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={shade(wood, -14)} strokeWidth={Math.max(0.35, u * 0.5)} />;
    });
    const post = Math.max(0.7, u * 1.1);
    const rails = sides.map(([a, z], s) => {
      const A = up(P(a.x, a.y), deckH), B = up(P(z.x, z.y), deckH);
      const posts = Array.from({ length: 6 }, (_, i) => {
        const t = i / 5, px = A.x + (B.x - A.x) * t, py = A.y + (B.y - A.y) * t;
        return <line key={`p${i}`} x1={px} y1={py} x2={px} y2={py - railH} stroke={shade(trim, -18)} strokeWidth={post} strokeLinecap="round" />;
      });
      return (
        <g key={`rail-${s}`}>
          {posts}
          <line x1={A.x} y1={A.y - railH} x2={B.x} y2={B.y - railH} stroke={trim} strokeWidth={Math.max(0.9, u * 1.5)} strokeLinecap="round" />
        </g>
      );
    });
    push(depth((x0 + x1) / 2, (y0 + y1) / 2), (
      <g key={`bridge-${id}`}>
        <polygon points={shift(f.left)} fill={shade(wood, -34)} />
        <polygon points={shift(f.right)} fill={shade(wood, -18)} />
        <polygon points={shift(f.top)} fill={wood} />
        {planks}
        {rails}
      </g>
    ));
  };

  /** The way in, built rather than painted on.
   *
   *  Reported from playing it: "the entrance structure is not right." It was not a structure at all -
   *  it fell through to the flat coloured diamond every other piece of landscape gets, which is right
   *  for a pond and says nothing here. An entrance is the first thing a visitor meets and the thing
   *  the car park points at, and a green patch of grass with a label on it is neither.
   *
   *  What reads as a way in from the corner of a park: a paved forecourt, two piers with a gap
   *  between them you can see through, and a banner across the top on the side people arrive from.
   *  The gap runs the way people walk - up from the car park into the park - so the drawing says
   *  which way to go without a word on it.
   */
  const gateway = (id: string, x0: number, y0: number, x1: number, y1: number, banner: string, post: string) => {
    const w = x1 - x0, h = y1 - y0;
    const pier = Math.max(8, w * 0.22);          // how wide each side of the gate is
    const depthOf = Math.max(8, h * 0.34);        // how deep the piers are
    const my0 = y0 + (h - depthOf) / 2, my1 = my0 + depthOf;
    const pierH = Math.max(10, u * 26);
    const beamH = Math.max(5, u * 11);
    // Paving, not a lighter shade of the posts: lightened brown is a patch of mud, and the forecourt
    // is the one part of this that says "you are expected here".
    const stone = '#cfc9bd';
    const lift = (s: string, by: number) => s.split(' ')
      .map((q) => { const [px, py] = q.split(',').map(Number); return `${px},${(py - by).toFixed(1)}`; }).join(' ');
    const face = (f: { left: string; right: string; top: string }, fill: string, by = 0) => (
      <>
        <polygon points={shift(lift(f.left, by))} fill={shade(fill, -32)} />
        <polygon points={shift(lift(f.right, by))} fill={shade(fill, -16)} />
        <polygon points={shift(lift(f.top, by))} fill={fill} />
      </>
    );
    const left = boxFaces(x0, my0, x0 + pier, my1, pierH, u);
    const right = boxFaces(x1 - pier, my0, x1, my1, pierH, u);
    // The banner spans pier to pier, standing on top of them.
    const beam = boxFaces(x0 + pier * 0.35, my0 + depthOf * 0.22, x1 - pier * 0.35, my0 + depthOf * 0.62, beamH, u);
    // `P` already lays the margin in, so these are drawn straight - adding it again puts the
    // forecourt in the next field along, which is exactly what it did.
    const court = drawPoly([{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]);
    // Lettering, as blocks: at this size a word is a smudge, and three even marks on a banner is
    // what a sign looks like from across a car park.
    const marks = Array.from({ length: 3 }, (_, i) => {
      const t = 0.3 + i * 0.2;
      const mx = x0 + pier * 0.4 + (x1 - x0 - pier * 0.8) * t;
      const a = P(mx, my0 + depthOf * 0.25), b = P(mx, my0 + depthOf * 0.6);
      return <line key={`m${i}`} x1={a.x} y1={a.y - pierH - beamH * 0.5} x2={b.x} y2={b.y - pierH - beamH * 0.5}
        stroke={shade(banner, -34)} strokeWidth={Math.max(0.8, u * 1.4)} strokeLinecap="round" />;
    });
    push(depth((x0 + x1) / 2, (y0 + y1) / 2), (
      <g key={`gate-${id}`} data-part="gateway" data-item={id}>
        <polygon points={court} fill={stone} opacity={0.95} />
        {face(left, post)}
        {face(right, post)}
        {face(beam, banner, pierH)}
        {marks}
      </g>
    ));
  };

  // ---- facilities --------------------------------------------------------------------------
  //
  // Drawn, not photographed. These were tiles out of a city set - four flat-roofed boxes - and a
  // cafe looked like a gift shop looked like an office block. In a game whose whole subject is
  // showing somebody the thing they built, a building that cannot be told from its neighbour is
  // the one thing it must not be: "a gift shop or cafe do not have a sign. Nor do they look like a
  // cafe or a gift shop."
  //
  // So a building says what it is by its SHAPE, which survives being small and being turned:
  // an awning and parasols is a cafe, a hatch over a counter is a kiosk, a glazed front is a shop,
  // two doors in a plain block is a lavatory, a canopy on posts is a stall. Colour is what the
  // player chooses on top of that, and the sign colour is used where a sign would actually be -
  // the board over the door, the stripes of the awning - so choosing it does something visible.
  //
  // Everything below works in TURNED space: Tbox hands back corners already turned, so "the front"
  // is whichever wall faces the viewer. That is why it uses the raw iso helpers rather than the
  // turn-applying wrappers further up - turning twice puts the door round the back.
  const facility = (it: BacklogItem, c: Pt, size: { w: number; h: number }) => {
    const wd = working(it);
    const look = FACILITY[wd.parts.type ?? it.template ?? ''] ?? FACILITY.shop;
    const walls = wd.colors.walls ?? look.walls;
    const roof = wd.colors.roof ?? look.roof;
    const door = wd.colors.door ?? '#7a5230';
    const sign = wd.colors.sign ?? look.sign;
    const signed = wd.parts.sign !== 'off';

    const fw = size.w * 0.66, fh = size.h * 0.66;
    const [x0, y0, x1, y1] = Tbox(c.x - fw / 2, c.y - fh / 2, c.x + fw / 2, c.y + fh / 2);
    const wallH = Math.max(5, u * look.height);
    const tone = boxTones(walls), rt = boxTones(roof);
    const GLASS = '#a8cadd';

    /** A point on the park at a height above it, ready to draw. */
    const at = (wx: number, wy: number, h = 0): Pt => {
      const q2 = project(wx, wy, u); return { x: q2.x + ox, y: q2.y + oy - h };
    };
    const quad = (ps: Pt[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    /** Which wall is the front.
     *
     *  A building can be turned a quarter at a time, so its door does not have to face the way the
     *  illustrator happened to draw it - you turn the shop until its front faces the path. The turn
     *  is applied HERE, by walking the four walls round, rather than by rotating the drawing: an
     *  isometric box rotated by an arbitrary transform stops agreeing with its own roof.
     *
     *  The park's own Turn button rotates the whole zoo, and this rides on top of it - if the park
     *  is turned a quarter and the shop is turned a quarter, the shop's front comes back round to
     *  where it was, which is what anybody would expect of two quarter turns. */
    const corner = [{ x: x0, y: y1 }, { x: x1, y: y1 }, { x: x1, y: y0 }, { x: x0, y: y0 }];
    const side = ((quarterOf(it) + q) % 4 + 4) % 4;
    const wall = (n: number) => [corner[(side + n) % 4], corner[(side + n + 1) % 4]] as const;
    /** A panel let into the wall facing the viewer, as fractions along it and up it. */
    const face = (t0: number, t1: number, h0: number, h1: number) => {
      const [a, z] = wall(0);
      return shift(wallPanelOf(a, z, t0, t1, h0, h1, u));
    };
    /** ...and into the one running away to the right. */
    const flank = (t0: number, t1: number, h0: number, h1: number) => {
      const [a, z] = wall(1);
      return shift(wallPanelOf(a, z, t0, t1, h0, h1, u));
    };
    /** A point along the front wall, and a step out in front of it - which way that is depends on
     *  which wall the front has become. */
    const front = (t: number, out = 0) => {
      const [a, z] = wall(0);
      const nx = -(z.y - a.y), ny = z.x - a.x, len = Math.hypot(nx, ny) || 1;
      return { x: a.x + (z.x - a.x) * t + (nx / len) * out, y: a.y + (z.y - a.y) * t + (ny / len) * out };
    };

    /** A flat slab lying over the walls - a canopy, or a roof with no pitch to it. */
    const slab = (key: string, over: number, base: number, thick: number, hex: string) => {
      const t = boxTones(hex);
      const X0 = x0 - over, X1 = x1 + over, Y0 = y0 - over, Y1 = y1 + over, top = base + thick;
      return (
        <g key={key}>
          <polygon points={quad([at(X0, Y1, top), at(X1, Y1, top), at(X1, Y1, base), at(X0, Y1, base)])} fill={t.left} />
          <polygon points={quad([at(X1, Y1, top), at(X1, Y0, top), at(X1, Y0, base), at(X1, Y1, base)])} fill={t.right} />
          <polygon points={quad([at(X0, Y0, top), at(X1, Y0, top), at(X1, Y1, top), at(X0, Y1, top)])} fill={t.top} />
        </g>
      );
    };

    /** A striped awning sloping out over the front. The stripes are the sign colour, so the one
     *  thing you choose about how a cafe looks is the thing you see first. */
    const awning = (key: string, h: number, out: number, drop: number, bands: number) => (
      <g key={key}>
        {Array.from({ length: bands }, (_, i) => {
          const a = front(i / bands), z = front((i + 1) / bands);
          const ao = front(i / bands, out), zo = front((i + 1) / bands, out);
          return <polygon key={i} fill={i % 2 ? '#f7f4ee' : sign}
            points={quad([at(a.x, a.y, h), at(z.x, z.y, h), at(zo.x, zo.y, h - drop), at(ao.x, ao.y, h - drop)])} />;
        })}
      </g>
    );

    /** The name board: a fascia hung on the front, just under the eaves.
     *
     *  It has been in the wrong place twice. Free-standing above the ridge it read as a stray beam
     *  driven through the tiles; flush with the wall it disappeared behind the roof overhang, which
     *  is what an overhang is for. So it stands a hair proud of the wall and is painted after the
     *  roof - a board screwed to the front of a building, which is what a shop sign is.
     *
     *  Not lettered: at the size a park is drawn, type turns to mud. */
    const board = (t0 = 0.14, t1 = 0.86, lift = 0) => {
      const lo = wallH * 0.72 + lift, hi = wallH * 0.98 + lift;
      const p0 = t0, p1 = t1, i0 = t0 + (t1 - t0) * 0.07, i1 = t1 - (t1 - t0) * 0.07;
      const band = (ta: number, tb: number, h0: number, h1: number) => {
        const a = front(ta, 0.9), b = front(tb, 0.9);
        return quad([at(a.x, a.y, h1), at(b.x, b.y, h1), at(b.x, b.y, h0), at(a.x, a.y, h0)]);
      };
      return (
        <g key="sb">
          {/* Edged, so it separates from whatever is behind it. A cafe's board sat against a roof
              of nearly its own colour and vanished, which is a hard thing to see in a screenshot
              and an easy one to see in a game. */}
          <polygon points={band(p0, p1, lo, hi)} fill={shade(sign, -34)} />
          <polygon points={band(t0 + 0.012, t1 - 0.012, lo + (hi - lo) * 0.1, hi - (hi - lo) * 0.1)} fill={sign} />
          <polygon points={band(i0, i1, lo + (hi - lo) * 0.26, hi - (hi - lo) * 0.26)} fill={shade(sign, 28)} />
        </g>
      );
    };

    /** A parasol: a post and a disc. Two of these outside settle any argument about which building
     *  is the cafe. */
    const parasol = (key: string, wx: number, wy: number) => {
      const foot = at(wx, wy, 0), top = at(wx, wy, u * 22), r = Math.max(3, u * 12);
      return (
        <g key={key}>
          <ellipse cx={foot.x} cy={foot.y} rx={r * 0.5} ry={r * 0.25} fill="rgba(0,0,0,0.13)" />
          <line x1={foot.x} y1={foot.y} x2={top.x} y2={top.y} stroke="#8a8078" strokeWidth={Math.max(0.6, u * 1.1)} />
          <ellipse cx={top.x} cy={top.y} rx={r} ry={r * 0.5} fill={sign} />
          <ellipse cx={top.x} cy={top.y - r * 0.16} rx={r * 0.62} ry={r * 0.31} fill={shade(sign, 22)} />
        </g>
      );
    };

    const box = boxFacesOf(x0, y0, x1, y1, wallH, u);
    const walled = [
      <polygon key="wl" points={shift(box.left)} fill={tone.left} />,
      <polygon key="wr" points={shift(box.right)} fill={tone.right} />,
    ];
    const pitched = (rise: number) => {
      const r = roofFacesOf(x0, y0, x1, y1, wallH, Math.max(3, u * rise), Math.min(fw, fh) * 0.1, u);
      return [
        <polygon key="rf" points={shift(r.far)} fill={rt.left} />,
        <polygon key="rn" points={shift(r.near)} fill={rt.right} />,
        <polygon key="rg" points={shift(r.gable)} fill={rt.top} />,
      ];
    };

    let parts: React.ReactNode[];
    switch (look.shape) {
      case 'awning':
        // A cafe: its name board under the eaves, a striped awning below that, and tables out in
        // front under parasols. Sign above, awning below - the way a cafe front is actually stacked.
        parts = [
          ...walled,
          <polygon key="w1" points={face(0.08, 0.32, wallH * 0.24, wallH * 0.56)} fill={GLASS} />,
          <polygon key="dr" points={face(0.42, 0.60, 0, wallH * 0.56)} fill={shade(door, -6)} />,
          <polygon key="w2" points={face(0.70, 0.94, wallH * 0.24, wallH * 0.56)} fill={GLASS} />,
          <polygon key="fk" points={flank(0.24, 0.70, wallH * 0.28, wallH * 0.62)} fill={shade(GLASS, -12)} />,
          ...pitched(17),
          ...(signed ? [board()] : []),
          awning('aw', wallH * 0.68, Math.min(fh * 0.40, 13), Math.max(1.5, u * 5), 6),
          ...[[0.2, Math.min(fh * 0.9, 26)], [0.74, Math.min(fh * 0.7, 20)]].map(([t, out], i) => {
            const at2 = front(t, out);
            return parasol(`p${i}`, at2.x, at2.y);
          }),
        ];
        break;
      case 'hatch':
        // A kiosk: no door at all - a serving hatch with goods on the counter, under a canopy that
        // overhangs just enough to shade it. It swallowed the whole building at 30%.
        parts = [
          ...walled,
          <polygon key="ht" points={face(0.14, 0.86, wallH * 0.26, wallH * 0.62)} fill="#3b3a36" />,
          <polygon key="gd" points={face(0.20, 0.80, wallH * 0.30, wallH * 0.44)} fill={shade(sign, 12)} />,
          <polygon key="cs" points={face(0.10, 0.90, wallH * 0.22, wallH * 0.28)} fill={shade(walls, -10)} />,
          slab('rf', Math.min(fw, fh) * 0.13, wallH, Math.max(1.5, u * 4), roof),
          ...(signed ? [board(0.12, 0.88)] : []),
        ];
        break;
      case 'glazed':
        // A gift shop: a glazed shopfront with a mullion down it, a door at one end, its name board
        // across the top. Which is what a shop is, from the pavement.
        parts = [
          ...walled,
          <polygon key="gl" points={face(0.06, 0.66, wallH * 0.10, wallH * 0.66)} fill={GLASS} />,
          <polygon key="ml" points={face(0.35, 0.375, wallH * 0.10, wallH * 0.66)} fill={shade(walls, -22)} />,
          <polygon key="dr" points={face(0.72, 0.92, 0, wallH * 0.62)} fill={shade(door, -6)} />,
          <polygon key="fk" points={flank(0.24, 0.74, wallH * 0.28, wallH * 0.62)} fill={shade(GLASS, -14)} />,
          ...pitched(16),
          ...(signed ? [board(0.06, 0.94)] : []),
        ];
        break;
      case 'stall':
        // A stall has no walls: a counter, four posts, and a striped canopy over it. It was being
        // drawn as a park bench, which is a different thing to sit on entirely.
        parts = [
          <polygon key="ct" points={shift(boxFacesOf(x0, y1 - Math.max(3, fh * 0.3), x1, y1, wallH * 0.46, u).left)} fill={tone.left} />,
          <polygon key="cr" points={shift(boxFacesOf(x0, y1 - Math.max(3, fh * 0.3), x1, y1, wallH * 0.46, u).right)} fill={tone.right} />,
          <polygon key="cw" points={face(0.06, 0.94, wallH * 0.46, wallH * 0.52)} fill={shade(walls, 14)} />,
          ...[[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([px, py], i) => (
            <line key={`ps${i}`} x1={at(px, py, 0).x} y1={at(px, py, 0).y} x2={at(px, py, wallH).x} y2={at(px, py, wallH).y}
              stroke={shade(walls, -34)} strokeWidth={Math.max(0.7, u * 1.3)} />
          )),
          slab('rf', Math.min(fw, fh) * 0.08, wallH, Math.max(1, u * 2.5), roof),
          awning('cp', wallH, Math.min(fh * 0.34, 11), Math.max(1, u * 3), 6),
          ...(signed ? [board(0.2, 0.8, Math.max(1.5, u * 5))] : []),
        ];
        break;
      default:
        // A lavatory block: plain, flat-roofed, two doors and a vent over each. It is meant to be
        // the dullest building in the zoo, because that is what it is.
        parts = [
          ...walled,
          <polygon key="d1" points={face(0.12, 0.40, 0, wallH * 0.64)} fill={shade(door, -6)} />,
          <polygon key="d2" points={face(0.60, 0.88, 0, wallH * 0.64)} fill={shade(door, -6)} />,
          slab('rf', Math.min(fw, fh) * 0.1, wallH, Math.max(1.5, u * 4), roof),
          ...(signed ? [board(0.3, 0.7)] : []),
        ];
    }
    push(depth(c.x, c.y), <g key={`b-${it.id}`} data-facility={look.shape}>{parts}</g>);
  };

  // ---- amenities and loose planting -------------------------------------------------------
  for (const it of loose) {
    const c = posOf(it), size = sizeOf(it);
    if (underWay.has(it.id)) hoard(it.id, c.x - size.w / 2, c.y - size.h / 2, c.x + size.w / 2, c.y + size.h / 2);
    if (it.category === 'flora') {
      const type = landType(it);
      if (isLandscapeType(type)) {
        // The colours somebody CHOSE for it, not the ones its kind starts with. This read the
        // defaults for the type and ignored the design entirely, so a bridge given red railings and
        // a light brown deck arrived here in the brown it started as - and so did every river and
        // pond. A landscape feature has two colours: what it is made of, and its trim.
        const { primary, secondary } = landscapePalette(type, working(it).colors);
        // Held to the park. A river is longer than the park is wide, on purpose - that is what makes
        // it reach both banks - and painted at its full length it ran out over the edge of the grass
        // and hung in the air.
        const x0 = Math.max(0, c.x - size.w / 2), x1 = Math.min(CANVAS_W, c.x + size.w / 2);
        const y0 = Math.max(0, c.y - size.h / 2), y1 = Math.min(PLAY_H, c.y + size.h / 2);
        // ...and the angle it was turned to on the Plan. A river could be swung round there since
        // the day landscape was resizable, and this view had never heard of it: you turned the
        // river, looked at the Increment, and it was still lying flat across the park. The seventh
        // time these two drawings have disagreed about the same piece of state.
        const spin = it.rot ?? 0;
        if (type === 'entrance') {
          gateway(it.id, x0, y0, x1, y1, primary, secondary);
          // People walk THROUGH it, from the car park into the park, so the routing has a door here
          // rather than a wall: the drawing and the walking agree about where the way in is.
          walks.push([{ x: (x0 + x1) / 2, y: y1 + 10 }, { x: (x0 + x1) / 2, y: y0 - 10 }]);
          continue;
        }
        if (type === 'bridge') {
          bridge(it.id, x0, y0, x1, y1, primary, secondary);
          // A bridge is the one door through the water, and it is walked across bank to bank.
          dry.push({ x0, y0, x1, y1, rot: spin });
          walks.push([{ x: (x0 + x1) / 2, y: y0 - 10 }, { x: (x0 + x1) / 2, y: y1 + 10 }]);
          continue;
        }
        // Water is impassable where it is DRAWN, so the rectangle the routing uses is the one the
        // feature actually has - full length, turned - not the one that was cut to the park.
        if (type === 'river' || type === 'pond') {
          water.push({ x0: c.x - size.w / 2, y0: c.y - size.h / 2, x1: c.x + size.w / 2, y1: c.y + size.h / 2, rot: spin });
        }
        if (type === 'rocks') {
          push(depth(c.x, c.y), outcrop(`land-${it.id}`, c.x, c.y, Math.min(x1 - x0, y1 - y0), primary, it.id.length * 3));
          continue;
        }
        // Turned at its full length and THEN cut to the grass, which is the only order that gives a
        // river reaching both banks at any angle without swinging out over the car park.
        const lie = clipTo(swing(c.x, c.y, size.w, size.h, spin), 0, 0, CANVAS_W, PLAY_H);
        if (!lie.length) continue;
        nodes.push(<polygon key={`land-${it.id}`} points={drawPoly(lie)} fill={primary} opacity={0.92}
          clipPath={`url(#${grassClip})`} />);
      } else {
        const plant = (name: string, wx: number, wy: number, key: string, foliage?: string, copy?: number) =>
          place(name, wx, wy, u * 1.9 * (FLORA_SCALE[name] ?? 1), key, undefined, foliageTint(foliage),
            // One planting is several trees, and each of them stands somewhere of its own. Tagged
            // as which one it is, or dragging the third tree walked the whole planting across the
            // park - they are all drawn from the same item.
            copy === undefined ? { 'data-item': it.id } : { 'data-copy': `${it.id}:${copy}` });
        plant(treeProp(type), c.x, c.y, `t-${it.id}`, working(it).colors.foliage);
        // The rest of what this item plants. One planting PBI is several trees, and it has to be
        // several here too - otherwise switching to this view loses everything but the first.
        for (const [i, k] of (it.copies ?? []).entries()) {
          const at = insidePark({ w: 8, h: 8 }, { x: k.x, y: k.y });
          const piece = pieceByKey(k.piece);
          const drawn = plant(treeProp(piece?.type ?? type, k.piece), at.x, at.y, `t-${it.id}-${i}`,
            piece?.colors.foliage ?? working(it).colors.foliage, i);
          copies.push({ id: it.id, index: i, x: at.x, y: at.y, z: depth(at.x, at.y),
            // Above the tree, not on its trunk: a mark the same colour as the bark behind it is a
            // mark nobody sees. Screen coordinates, because that is where the drawing ended up.
            over: drawn ? { x: drawn.x, y: drawn.top - Math.max(5, u * 6) } : null });
        }
      }
      continue;
    }
    // A facility, drawn as the kind of building it is.
    const special = amenityProp(it);
    if (special) { place(special, c.x, c.y, u * 0.85, `am-${it.id}`, undefined, undefined, { 'data-item': it.id }); continue; }
    facility(it, c, size);
  }

  // ---- the car park ------------------------------------------------------------------------
  for (const [i, spot] of (lot.spots ?? []).entries()) push(...vehicle(spot, i, u, P, depth, q));

  // ---- visitors ----------------------------------------------------------------------------
  //
  // Everything drawn goes into ONE list, so every key in this file has to be unique across the whole
  // scene and not just within its own loop. The guests and the parked cars were both numbering
  // themselves `v-0`, `v-1`, ... - React's answer to a duplicate key is that children "may be
  // duplicated and/or omitted", and it was both: a tree drawn out on the page beside the park, and
  // cars that kept their old angle when the park was turned under them.
  //
  // People arrive. They were scattered at random over the whole park instead, which put them in the
  // river and gave no sense of anyone going anywhere. A visit has a shape: you park, you walk up
  // from the lot, and you head for something worth seeing.
  //
  // So everyone stands somewhere on a route from the car park to an exhibit - along the paths the
  // player laid where there are any, and never in the water. Some come on their own and some come
  // as a family, because a zoo on a good day is mostly families.
  const wet = (p: Pt) => water.some((r) => within(r, p)) && !dry.some((r) => within(r, p));
  const gate = { x: lot.walkway.x + lot.walkway.w / 2, y: lot.walkway.y };
  const arrival = { x: gate.x, y: lot.walkway.y + lot.walkway.h - 6 };  // stepping off the tarmac
  const entry = { x: gate.x, y: promY + 18 };                            // on the promenade

  /** The way to one exhibit: up from the lot, onto the promenade, then along whatever the player
   *  has actually laid - the same path network the guests in the plan view used to walk, which is
   *  where this routing comes from. Water is a wall with one door in it, and the door is a bridge. */
  // A habitat is something you walk AROUND. Reported from playing it: "visitors in the lion
  // enclosure is not a good idea." They were walking to the middle of the pen, because that is
  // where the exhibit is - so the fence has to be solid to the routing, and what they walk to has
  // to be the apron outside it.
  const pens = standing.filter((st) => st.item.category === 'enclosure').map((st) => {
    const c = posOf(st.item);
    return { x0: c.x - st.size.w / 2, y0: c.y - st.size.h / 2, x1: c.x + st.size.w / 2, y1: c.y + st.size.h / 2 };
  }).filter((r) => Number.isFinite(r.x0));
  const insidePen = (p: Pt) => pens.some((r) => p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y1);
  const nav = buildNav({ paths: walks.map(([a, z]) => [a, z]), water, crossings: dry, solid: pens });
  const routeTo = (target: Pt): Pt[] => [arrival, entry, ...(routeAcross(nav, entry, target) ?? [target])];
  // Somewhere worth walking to: the habitats, or the middle of the park if none are open yet.
  // Where somebody stands to look at a habitat: on the walkway outside it, on the side they arrive
  // from. Not the middle of the pen, which is where the lions are.
  const draws = encs.length
    ? encs.map((e) => viewingSpot(posOf(e), groundSize(e)))
    : [{ x: CANVAS_W / 2, y: promY - 120 }];
  const routes = draws.map(routeTo);

  /** A visitor prop drawn about the ORIGIN rather than at a place on the park, so a `<g>` can carry
   *  it along a route. `place` anchors to a spot, which is right for a tree and wrong for somebody
   *  on their way somewhere. */
  const walker = (name: string, k: number, key: string) => {
    const pr = prop(name);
    if (!pr) return null;
    const w = pr.w * k, h = pr.h * k;
    return <svg key={key} x={-w / 2} y={-h + w * 0.29} width={w} height={h} viewBox={pr.viewBox}
      overflow="visible" dangerouslySetInnerHTML={{ __html: pr.body }} />;
  };

  // People WALK. They were placed at a fixed point along their route - a hash, so the same point
  // every time the park was drawn - which made a still photograph of a walk: everybody frozen
  // mid-stride on the way to the lions. A zoo with nobody moving in it does not look open.
  //
  // The walking is SMIL, not React: one <animateMotion> per party, following a path laid down once.
  // A ticker in the component would redraw the entire park sixty times a second to move eight
  // people, and the park is a thousand polygons.
  const stroll = !(typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  /** How fast somebody walks, in scene px per second. Slow enough to read as strolling round a zoo
   *  rather than late for a train. */
  const PACE = 26;
  const paths: React.ReactNode[] = [];

  const parties = Math.max(1, Math.min(14, Math.round(visitors / 80)));
  let n = 0;
  for (let i = 0; i < parties; i++) {
    const route = routes[i % routes.length];
    // Where along the route this party is. Still a hash, so a party keeps its place in the queue -
    // and when they walk it becomes WHEN they set off rather than where they are stuck.
    const t = 0.08 + jitter(i + 1, 7) * 0.88;
    const at = along(route, t);
    const spot = { x: at.x + (jitter(i + 3, 5) - 0.5) * 16, y: at.y + (jitter(i + 4, 11) - 0.5) * 14 };
    if (spot.x < 14 || spot.x > CANVAS_W - 14 || spot.y < 14 || spot.y > worldH - 14) continue;
    if (wet(spot)) continue;
    if (insidePen(spot)) continue;      // nobody is in with the lions

    // The route in the picture, and how long it takes to walk it.
    const screen = route.map((q2) => P(q2.x, q2.y));
    const len = screen.reduce((sum, q2, k) => (k ? sum + Math.hypot(q2.x - screen[k - 1].x, q2.y - screen[k - 1].y) : 0), 0);
    const secs = Math.max(14, Math.min(70, len / PACE));
    const id = `walk-${i}`;
    if (stroll) {
      paths.push(<path key={id} id={id} fill="none" stroke="none"
        d={screen.map((q2, k) => `${k ? 'L' : 'M'}${q2.x.toFixed(1)},${q2.y.toFixed(1)}`).join(' ')} />);
    }
    /** Everybody in this party, walking together or standing together. */
    const party: React.ReactNode[] = [];
    party.push(walker(VISITOR_PROPS[n % VISITOR_PROPS.length], u * 0.92, `guest-${n}`));
    n += 1;
    // Every third party is a family: another grown-up and a child or two, at their elbow.
    if (i % 3 === 2) {
      const withThem = 1 + (i % 2);
      for (let k = 0; k <= withThem; k += 1) {
        const kid = k > 0;
        const pool = kid ? CHILD_PROPS : VISITOR_PROPS;
        party.push(<g key={`guest-${n}-${k}`} transform={`translate(${(9 + k * 8) * 0.6},${(k % 2 ? 7 : -5) * 0.6})`}>
          {walker(pool[(n + k) % pool.length], u * (kid ? 0.72 : 0.9), `p-${n}-${k}`)}
        </g>);
      }
      n += 1;
    }
    // Drawn as far back as the point they are passing, so they go behind a habitat and in front of
    // the path. It is one depth for the whole walk rather than a moving one, which is what SMIL
    // buys: the alternative is re-sorting the scene on every frame.
    push(depth(spot.x, spot.y), stroll ? (
      <g key={`party-${i}`}>
        <animateMotion dur={`${secs.toFixed(1)}s`} repeatCount="indefinite"
          begin={`${(-t * secs).toFixed(1)}s`}><mpath href={`#${id}`} /></animateMotion>
        {party}
      </g>
    ) : (
      // Motion turned down: they stand where they had got to, which is what this used to be.
      <g key={`party-${i}`} transform={`translate(${P(spot.x, spot.y).x.toFixed(1)},${P(spot.x, spot.y).y.toFixed(1)})`}>{party}</g>
    ));
  }

  pieces.sort((a, z) => a.z - z.z);
  const total = screenBounds(RW, RH, u);
  return {
    w: total.w + MARGIN * 2,
    h: total.h + MARGIN * 2 + EDGE + HEAD,
    nodes: [
      ...(paths.length ? [<defs key="walks">{paths}</defs>] : []),
      <TintDefs key="tints" where={grassClip} tints={tints.values()} />,
      ...nodes.filter(Boolean), ...pieces.map((p) => p.el),
    ],
    label: `The zoo from above: ${encs.length} habitat${encs.length === 1 ? '' : 's'}, ${live.filter((i) => i.category === 'exhibit').length} exhibits, ${visitors} visitors`,
    // What a pointer can take hold of, and the frame needed to work out where it is pointing. The
    // hit area is the thing's own footprint on the ground - not its drawing, which for a habitat
    // includes fences and animals standing well above it, and for a tree is mostly sky.
    u,
    ox,
    oy,
    /** A pointer arrives on the park as it is being LOOKED at; the zoo is laid out on the park as it
     *  IS. One of these undoes the turn, the other draws a box in the picture. */
    unturn,
    /** ...and the other way, for anything drawn over the scene rather than in it - the run being
     *  laid, while the pointer is still down. */
    at: P,
    ground,
    spots,
    copies,
    /** The habitats, as boxes something can be dropped into. The same list as `movable` filtered,
     *  but naming it says what it is for: a plant let go over one is planted in it. */
    rooms: encs.map((it) => {
      const c = posOf(it), sz = sizeOf(it);
      return { id: it.id, x: c.x, y: c.y, w: sz.w, h: sz.h, z: depth(c.x, c.y) };
    }),
    movable: [...encs, ...loose].map((it) => {
      const c = posOf(it), s = sizeOf(it);
      return { id: it.id, name: it.name, x: c.x, y: c.y, w: s.w, h: s.h, z: depth(c.x, c.y) };
    }),
  };
}

/** Which tree drawing a planting gets. Two shapes is enough to stop an avenue looking stamped. */
/** How big a piece of planting is drawn, against a tree.
 *
 *  Everything was drawn at a tree's size, which made a signpost as tall as the oak behind it and
 *  wider than the giraffe - and four of them a thicket of crossed arms. A signpost is a post with a
 *  sign on it: it is smaller than a kiosk, and much smaller than a tree. */
const FLORA_SCALE: Record<string, number> = { signpost: 0.42, hedge: 0.8, fountain: 0.9 };

function treeProp(type?: string, piece?: string): string {
  // What it is beats what it is called. This used to pick between the two trees on whether the
  // type's name had an even number of letters, which drew a signpost as a sapling.
  switch (type) {
    case 'signpost': return 'signpost';
    case 'fountain': return 'fountain';
    case 'hedge': case 'shrub': case 'bush': case 'flowers': return 'hedge';
    default: break;
  }
  // Two trees and several kinds of tree, so a mixed planting is visibly mixed rather than a row of
  // the same drawing: the taller one for the taller pieces.
  return piece === 'pine' || piece === 'palm' ? 'treeTall' : 'tree';
}

/** Some amenities are a thing the sheet already has a drawing of, and a drawn bench beats a box. */
function amenityProp(it: BacklogItem): string | undefined {
  const t = working(it).parts.type ?? it.template;
  if (t === 'signpost') return 'signpost';
  if (t === 'bench' || t === 'seating') return 'bench';
  if (t === 'fountain') return 'fountain';
  return undefined;
}

/** The vehicles in the lot, from the illustration sheet.
 *
 *  They are all drawn facing one way, along the sheet's own axis. Mirroring an isometric drawing
 *  horizontally gives you the other axis, which is exactly the pair the car park needs: cars nose up
 *  to the curb along one, coaches lie along their lay-by on the other.
 *
 *  Both rows of cars therefore face the same way, where a real lot would have them nose to nose.
 *  At the size a car is drawn here that is not a thing anyone can see, and the alternative is a
 *  drawing that does not exist. */
const CARS = ['suv', 'saloonRed', 'saloonBlue', 'saloonGrey', 'estateRed', 'estate4x4', 'vanYellow', 'pickup', 'cityCar'];
const LARGE = ['coach', 'boxVan'];

function vehicle(spot: CarSpot, i: number, u: number, P: (x: number, y: number) => Pt,
  depth: (x: number, y: number) => number,
  /** Quarter-turns of the park: a bay that ran across it now runs up it, so a car that nosed into
   *  its bay is lying along it. The same swap the fencing needs. */
  q: number): [number, React.ReactNode] {
  const name = spot.bus ? LARGE[i % LARGE.length] : CARS[i % CARS.length];
  const art = VEHICLE_ART[name];
  const [hw, hh] = spot.bus ? [BUS_HW, BUS_HH] : [CAR_HW, CAR_HH];
  // A coach lies along its lay-by; a car noses into its bay. `rot` is radians, not degrees.
  const across = (Math.abs(Math.sin(spot.rot)) > 0.5) !== (q % 2 === 1);
  const fw = (across ? hw : hh) * 2, fh = (across ? hh : hw) * 2;
  // Fit the drawing's width to the width its footprint projects to, so a coach takes a coach's
  // room - less a margin, because a drawing carries its own shadow and a car sized to the outside
  // of that parks on top of its neighbour.
  const k = (((fw + fh) * COS * u) / art.w) * 0.8;
  const w = art.w * k, h = art.h * k;
  const at = P(spot.x, spot.y);
  // The drawing stands on the ground, so its foot goes at the near corner of the footprint.
  const foot = P(spot.x + (across ? hw : hh), spot.y + (across ? hh : hw));
  return [depth(spot.x, spot.y), (
    <g key={`car-${i}`} transform={across ? undefined : `translate(${(at.x * 2).toFixed(1)},0) scale(-1,1)`}>
      <svg x={at.x - w / 2} y={foot.y - h} width={w} height={h} viewBox={art.viewBox} overflow="visible"
        dangerouslySetInnerHTML={{ __html: art.body }} />
    </g>
  )];
}
