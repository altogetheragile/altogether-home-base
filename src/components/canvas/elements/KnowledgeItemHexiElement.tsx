import React, { useState, useRef } from 'react';
import { KnowledgeItemDetailsDialog } from './KnowledgeItemDetailsDialog';
import { hexPoints, wrapLines } from '../hex-utils';
import * as Icons from 'lucide-react';

export interface KnowledgeItemHexiElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  knowledgeItemId: string;
  data: {
    name: string;
    slug: string;
    domain_color?: string;
    domain_name?: string;
    planning_focus_color?: string;
    planning_focus_name?: string;
    category_name?: string;
    category_color?: string;
    icon?: string;
    emoji?: string;
    hasAISupport?: boolean;
    techniqueType?: string;
    openAsTab?: boolean;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onDelete?: () => void;
  onOpenAsTab?: () => void;
}

export const KnowledgeItemHexiElement: React.FC<KnowledgeItemHexiElementProps> = ({
  id,
  position,
  size,
  knowledgeItemId,
  data,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  onOpenAsTab,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const stroke = data.domain_color ?? "#8B5CF6";
  const fill = `${(data.domain_color ?? "#8B5CF6")}30`;
  const dot = data.planning_focus_color;
  const iconColor = data.category_color ?? stroke;

  const lines = wrapLines(data.name);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    onSelect?.();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    ref.current.style.transform = `translate(${drag.current.x+dx}px, ${drag.current.y+dy}px)`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
      setShowDetails(true);
    } else {
      const nx = Math.round(drag.current.x + dx);
      const ny = Math.round(drag.current.y + dy);
      onMove?.({ x: nx, y: ny });
    }
    
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div
        ref={ref}
        className="absolute select-none cursor-move"
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }} shapeRendering="geometricPrecision">
          {/* hex shape */}
          <polygon 
            points={hexPoints(w,h)} 
            fill={fill} 
            stroke={stroke} 
            strokeWidth={3} 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />

          {/* selection ring */}
          {isSelected && (
            <polygon points={hexPoints(w,h)} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* icon (center, simple SVG shapes) */}
          {data.emoji ? (
            <text
              x={w/2}
              y={h/2 - 25}
              fontSize={24}
              textAnchor="middle"
              dominantBaseline="central"
              fill={iconColor}
            >
              {data.emoji}
            </text>
          ) : (() => {
            const IconComponent = data.icon ? Icons[data.icon as keyof typeof Icons] as any : Icons.BookOpen;
            return IconComponent ? (
              <foreignObject x={w/2 - 12} y={h/2 - 37} width={24} height={24}>
                <IconComponent style={{ color: iconColor, width: 24, height: 24 }} />
              </foreignObject>
            ) : null;
          })()}

          {/* label */}
          <g fontFamily="Inter, ui-sans-serif, system-ui" fontWeight={600} fill="#111827" textAnchor="middle">
            {lines.map((ln, i) => (
              <text
                key={i}
                x={w/2}
                y={h/2 + (i * 16) + 5}
                fontSize={13}
                dominantBaseline="middle"
              >
                {ln}
              </text>
            ))}
          </g>

          {/* planning focus dot */}
          {dot && (
            <>
              <circle cx={w-10} cy={10} r={4} fill={dot} />
              <circle cx={w-10} cy={10} r={4} fill="none" stroke="#ffffff" strokeWidth={1.5}/>
            </>
          )}
        </svg>
      </div>

      <KnowledgeItemDetailsDialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        knowledgeItemId={knowledgeItemId}
        knowledgeItemData={data}
        onRemove={() => {
          setShowDetails(false);
          onDelete?.();
        }}
        onOpenAsTab={onOpenAsTab ? () => {
          setShowDetails(false);
          onOpenAsTab();
        } : undefined}
      />
    </>
  );
};
