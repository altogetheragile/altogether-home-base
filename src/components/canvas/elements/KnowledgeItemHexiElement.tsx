import React, { useState, useRef } from 'react';
import { KnowledgeItemDetailsDialog } from './KnowledgeItemDetailsDialog';
import { HexiFloatingToolbar } from './HexiFloatingToolbar';
import { hexPoints, wrapLines } from '../hex-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
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
  onDuplicate,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const stroke = data.domain_color ?? "#8B5CF6";
  const fill = `${(data.domain_color ?? "#8B5CF6")}30`;
  const categoryColor = data.category_color ?? "#6B7280";

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
    
    // Only select, don't auto-open dialog anymore
    if (distance >= 5) {
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
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h, zIndex: isSelected ? 1000 : 1 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        {/* Floating toolbar when selected */}
        {isSelected && (
          <HexiFloatingToolbar
            onEdit={() => setShowDetails(true)}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            showEdit={true}
            showDuplicate={true}
          />
        )}

        <svg 
          width={w} 
          height={h} 
          viewBox={`0 0 ${w} ${h}`} 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ 
            overflow: 'visible',
            filter: isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }} 
          shapeRendering="geometricPrecision"
        >
          {/* hex shape */}
          <polygon 
            points={hexPoints(w,h)} 
            fill={fill} 
            stroke={stroke} 
            strokeWidth={3} 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />

          {/* Category indicator with tooltip */}
          <foreignObject x={w/2 - 12} y={h/2 - 37} width={24} height={24} style={{ overflow: 'visible' }}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer"
                    style={{ backgroundColor: categoryColor }}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">
                  {data.category_name || 'Uncategorized'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </foreignObject>

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
      />
    </>
  );
};
