import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { standingOnPark, parkPositions, restingPlace, apronRing, APRON_WIDTH } from './parkModel';
import { insidePark, CANVAS_W, PLAY_H } from './parkLayout';
import { answerable, checkCriterion } from './parkChecks';
import { groupMembers } from './design';
import { cn } from '@/lib/utils';

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
  return FILL.flora;
}

export function ParkPlan({ state, height = 520, selected, onSelect, onPlaceItem, onSetSize, onTurn,
  placing, onPlace, tool = 'none', pathStyle, runFor, onAddConnector, onSetTool, onAskToCheck, onSetMemberSpot, className }: {
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
  /** Move one animal of a family about inside its habitat. */
  onSetMemberSpot?: (id: string, member: number, spot: { x: number; y: number }) => void;
  /** Something is being put down for the first time: it follows the cursor with a verdict on it. */
  placing?: { id: string; w: number; h: number } | null;
  onPlace?: (id: string, pos: { x: number; y: number }, drawn?: { w: number; h: number }) => void;
  /** The park's own tool. A path is drawn point to point: click where it starts, click where it
   *  ends, and it runs between them. Nothing else on the park needs a tool. */
  tool?: 'none' | 'path';
  pathStyle?: { thickness: number; color: string };
  /** The pathway item the run being drawn belongs to. */
  runFor?: string;
  onAddConnector?: (c: ZooConnector) => void;
  onSetTool?: (tool: 'none' | 'path') => void;
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
  const auto = parkPositions(standing);
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

  /** Pointer to park coordinates. The plan is drawn at 1:1 in its own viewBox, so this is only the
   *  scale between the box on the screen and the box in the park. */
  const worldAt = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * PLAY_H };
  };

  /** Can this go here, and if not, why not. The same question the ghost answers on the isometric. */
  const verdict = (id: string, box: { w: number; h: number }, w: { x: number; y: number }) => {
    const at = insidePark(box, w);
    const off = Math.abs(at.x - w.x) > 1 || Math.abs(at.y - w.y) > 1;
    // Water is the exception, and it is the whole point of a bridge: a bridge over a river has to
    // overlap it or it is not a bridge. Reported from playing it - "I can't place it over the
    // river". Everything else keeps its ground to itself.
    const over = boxes.find((b) => b.item.id !== id && !overWater(b.item)
      && Math.abs(at.x - b.at.x) < (b.size.w + box.w) / 2 && Math.abs(at.y - b.at.y) < (b.size.h + box.h) / 2);
    return { x: at.x, y: at.y, w: box.w, h: box.h, ok: !off && !over, why: off ? 'off the park' : over ? `on top of ${over.item.name}` : undefined };
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

  return (
    <div className={cn('w-full', className)}>
      {/* No selecting. Dragging across the park was painting the browser's own selection highlight
          over the labels and the boxes - pale blue rectangles that pile up as you drag and stay
          there. Reported from playing it: "blue squares appear as trails." */}
      <svg ref={svgRef} data-part="park-plan" className="select-none" viewBox={`0 0 ${CANVAS_W} ${PLAY_H}`} role="img"
        aria-label={`The zoo from above: ${boxes.length} things standing on it`}
        style={{ display: 'block', width: '100%', height: 'auto', maxHeight: height, touchAction: 'none',
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
          if (placing) {
            const v = verdict(placing.id, placing, w);
            if (v.ok && onPlace) { onPlace(placing.id, { x: v.x, y: v.y }); setGhost(null); }
            return;
          }
          if (tool === 'path') {
            // Two clicks, and the run is drawn between them. A drag on an isometric grid is where
            // path drawing went wrong; two points is a thing you can aim at.
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
            setRunFrom(null); setRunTo(null); onSetTool?.('none');
            return;
          }
          onSelect?.(null);
        }}>
        {/* The ground, the promenade along the front, and a grid you can judge a footprint against. */}
        <rect x={0} y={0} width={CANVAS_W} height={PLAY_H} fill="#8cc063" />
        <rect x={0} y={PLAY_H - 90} width={CANVAS_W} height={90} fill="#9aa0a6" />
        <rect x={0} y={PLAY_H - 100} width={CANVAS_W} height={12} fill="#d9c9a3" />
        <g opacity={0.16} stroke="#2f4f2f" strokeWidth={1}>
          {Array.from({ length: Math.floor(CANVAS_W / 40) }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 40} y1={0} x2={(i + 1) * 40} y2={PLAY_H} />
          ))}
          {Array.from({ length: Math.floor(PLAY_H / 40) }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={(i + 1) * 40} x2={CANVAS_W} y2={(i + 1) * 40} />
          ))}
        </g>

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
          <line key={c.id} x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y}
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
              onPointerDown={placing ? undefined : (e) => dragFrom(e, b)}
              style={{ cursor: onPlaceItem ? 'grab' : 'pointer' }}>
              <rect x={x} y={y} width={b.size.w} height={b.size.h} rx={6}
                fill={c.fill} fillOpacity={b.underWay ? 0.45 : 1}
                stroke={on ? '#e6842a' : c.stroke} strokeWidth={on ? 4 : 2}
                strokeDasharray={b.underWay ? '8 6' : undefined} />
              {/* The animals inside their fence, big enough to see and to take hold of. */}
              {b.animals.map((a, i) => {
                const members = Math.max(1, groupMembers(a.design?.group).length);
                return Array.from({ length: Math.min(members, 6) }, (_, k) => {
                  const cols = Math.ceil(Math.sqrt(Math.min(members, 6)));
                  // Where somebody put this one, or the tidy grid it starts on. A pride is not a
                  // blob: the lioness by the water and the cubs under the tree is a thing you
                  // arrange, and it was drawn on a grid that ignored the arranging entirely.
                  const own = a.spots?.[k];
                  const gx = own ? x + b.size.w * own.x : x + b.size.w * ((k % cols) + 1) / (cols + 1);
                  const gy = own ? y + b.size.h * own.y
                    : y + b.size.h * (Math.floor(k / cols) + 1) / (Math.ceil(Math.min(members, 6) / cols) + 1);
                  return (
                    <circle key={`${a.id}-${i}-${k}`} data-animal={`${a.id}-${k}`} cx={gx} cy={gy} r={9}
                      fill={a.design?.colors?.coat ?? '#c8761f'} stroke="#7a4712" strokeWidth={2}
                      style={{ cursor: onSetMemberSpot ? 'grab' : 'default' }}
                      onPointerDown={onSetMemberSpot ? (e) => moveAnimal(e, a.id, k, { x, y, w: b.size.w, h: b.size.h }) : undefined} />
                  );
                });
              })}
              <text x={b.at.x} y={y - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill="#20351f">
                {b.item.name}{b.underWay ? ' · built, not Done' : ''}
              </text>
              {/* One pill per object that is built and not Done: how far off it is, and the one
                  thing that would finish it. Green when there is nothing left to say. */}
              {b.underWay && (() => {
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
                    onPointerDown={(e) => { e.stopPropagation(); if (ready) onAskToCheck?.(b.item.id); else onSelect?.(b.item.id); }}
                    style={{ cursor: 'pointer' }}>
                    <rect x={b.at.x - Math.max(90, text.length * 3.4)} y={y + b.size.h + 6}
                      width={Math.max(180, text.length * 6.8)} height={24} rx={12}
                      fill={ready ? '#dcfce7' : '#fff7ed'} stroke={ready ? '#16a34a' : '#f59e0b'} strokeWidth={2} />
                    <text x={b.at.x} y={y + b.size.h + 22} textAnchor="middle" fontSize={12} fontWeight={600}
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
                  <circle cx={x + b.size.w - 9} cy={y + 9} r={11} fill="#fff" stroke="#e6842a" strokeWidth={3} />
                  <path d="M -5 -1 A 5 5 0 1 1 -1 5" fill="none" stroke="#e6842a" strokeWidth={2.4}
                    strokeLinecap="round" transform={`translate(${x + b.size.w - 9} ${y + 9})`} />
                  <path d={`M ${x + b.size.w - 14} ${y + 5} l 0 -5 l 5 0`} fill="none" stroke="#e6842a" strokeWidth={2.4} strokeLinecap="round" />
                </g>
              )}

              {/* A corner to drag, where the footprint is yours to change. */}
              {/* Scenery is sized here too - a river as wide as you want it, a bridge as long as
                  it needs to be - which is what the takeover promises when it says its size is set
                  on the park. */}
              {on && onSetSize && (b.item.category === 'enclosure' || b.item.category === 'flora') && (
                <rect data-part="size-grip" x={x + b.size.w - 9} y={y + b.size.h - 9} width={18} height={18} rx={4}
                  fill="#fff" stroke="#e6842a" strokeWidth={3}
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={(e) => sizeFrom(e, b)} />
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
              <text x={ghost.x} y={ghost.y} textAnchor="middle" fontSize={14} fontWeight={700} fill="#b91c1c">{ghost.why}</text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
