import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { ZooGameState, ZooConnector } from './types';
import { standingOnPark, parkPositions, restingPlace } from './parkModel';
import { insidePark, CANVAS_W, PLAY_H } from './parkLayout';
import { checkCriterion } from './parkChecks';
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

export function ParkPlan({ state, height = 520, selected, onSelect, onPlaceItem, onSetSize,
  placing, onPlace, tool = 'none', pathStyle, onAddConnector, onSetTool, onAskToCheck, className }: {
  state: ZooGameState;
  height?: number;
  /** What is in hand: drawn with a ring, and the thing the palette is acting on. */
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Dragging something to a new spot on the park. */
  onPlaceItem?: (id: string, pos: { x: number; y: number }) => void;
  /** Dragging a corner to change a habitat's footprint. */
  onSetSize?: (id: string, size: { w: number; h: number }) => void;
  /** Something is being put down for the first time: it follows the cursor with a verdict on it. */
  placing?: { id: string; w: number; h: number } | null;
  onPlace?: (id: string, pos: { x: number; y: number }, drawn?: { w: number; h: number }) => void;
  /** The park's own tool. A path is drawn point to point: click where it starts, click where it
   *  ends, and it runs between them. Nothing else on the park needs a tool. */
  tool?: 'none' | 'path';
  pathStyle?: { thickness: number; color: string };
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
  }));

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
    const over = boxes.find((b) => b.item.id !== id
      && Math.abs(at.x - b.at.x) < (b.size.w + box.w) / 2 && Math.abs(at.y - b.at.y) < (b.size.h + box.h) / 2);
    return { x: at.x, y: at.y, w: box.w, h: box.h, ok: !off && !over, why: off ? 'off the park' : over ? `on top of ${over.item.name}` : undefined };
  };

  /** Drag something that is already standing: it follows the pointer and lands where you let go. */
  const dragFrom = (e: ReactPointerEvent, b: typeof boxes[number]) => {
    if (!onPlaceItem) return;
    e.preventDefault();
    e.stopPropagation();
    const start = worldAt(e);
    if (!start) return;
    const grabX = start.x - b.at.x, grabY = start.y - b.at.y;
    const move = (ev: PointerEvent) => {
      const p = worldAt(ev);
      if (p) setGhost(verdict(b.item.id, b.size, { x: p.x - grabX, y: p.y - grabY }));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const p = worldAt(ev);
      setGhost(null);
      if (!p) return;
      const v = verdict(b.item.id, b.size, { x: p.x - grabX, y: p.y - grabY });
      if (v.ok) onPlaceItem(b.item.id, { x: v.x, y: v.y });
    };
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
      <svg ref={svgRef} data-part="park-plan" viewBox={`0 0 ${CANVAS_W} ${PLAY_H}`} role="img"
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

        {/* Paths, drawn as the runs they are. */}
        {(state.connectors ?? []).map((c) => (
          <line key={c.id} x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y}
            stroke={c.color ?? '#c9a86a'} strokeWidth={Math.max(6, c.thickness ?? 14)} strokeLinecap="round" />
        ))}

        {/* Everything standing on the park, straight down, nothing behind anything else. */}
        {boxes.map((b) => {
          const c = FILL[b.item.category] ?? FILL.default;
          const on = selected === b.item.id;
          const x = b.at.x - b.size.w / 2, y = b.at.y - b.size.h / 2;
          return (
            <g key={b.item.id} data-plan-item={b.item.id}
              onPointerDown={(e) => { onSelect?.(b.item.id); dragFrom(e, b); }}
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
                  const gx = x + b.size.w * ((k % cols) + 1) / (cols + 1);
                  const gy = y + b.size.h * (Math.floor(k / cols) + 1) / (Math.ceil(Math.min(members, 6) / cols) + 1);
                  return <circle key={`${a.id}-${i}-${k}`} cx={gx} cy={gy} r={9} fill="#c8761f" stroke="#7a4712" strokeWidth={2} />;
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
                const met = verdicts.filter((x) => x.v?.met).length;
                const next = verdicts.find((x) => !x.v?.met);
                const ready = met === criteria.length && criteria.length > 0;
                const text = ready
                  ? `${met} of ${criteria.length} · ready for ${state.team.productOwner.name.replace(/\s*\(PO\)$/i, '')}`
                  : `${met} of ${criteria.length} · ${next?.v?.evidence ?? 'still being built'}`;
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
              {/* A corner to drag, where the footprint is yours to change. */}
              {on && onSetSize && b.item.category === 'enclosure' && (
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
