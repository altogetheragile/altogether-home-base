import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HexiFloatingToolbar } from './HexiFloatingToolbar';
import { hexPoints, wrapLines, ensureOpaqueFill } from '../hex-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRole } from '@/hooks/useUserRole';

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
  isMultiSelected?: boolean;
  isMarqueeSelecting?: boolean;
  onSelect?: (e?: React.PointerEvent | React.MouseEvent, preserveIfSelected?: boolean) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  artifactId?: string;
  projectId?: string;
}

export const KnowledgeItemHexiElement: React.FC<KnowledgeItemHexiElementProps> = ({
  id,
  position,
  size,
  knowledgeItemId,
  data,
  isSelected,
  isMultiSelected,
  isMarqueeSelecting,
  onSelect,
  onMove,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onDelete,
  onDuplicate,
  artifactId,
  projectId,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  const handleView = () => {
    const params = new URLSearchParams({ from: 'project-model' });
    if (artifactId) params.set('artifactId', artifactId);
    if (projectId) params.set('projectId', projectId);
    navigate(`/knowledge/${data.slug}?${params.toString()}`);
  };

  const handleEdit = () => {
    const params = new URLSearchParams({ from: 'project-model' });
    if (artifactId) params.set('artifactId', artifactId);
    if (projectId) params.set('projectId', projectId);
    navigate(`/admin/knowledge/items/${knowledgeItemId}/edit?${params.toString()}`);
  };

  const stroke = data.domain_color ?? "#8B5CF6";
  const fill = ensureOpaqueFill(data.domain_color, "#8B5CF6");
  console.log('KnowledgeItemHexi fill debug:', { name: data.name, inputDomainColor: data.domain_color, outputFill: fill });
  const categoryColor = data.category_color ?? "#6B7280";

  const lines = wrapLines(data.name);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    // Pass true to preserve selection if this element is already selected (for group drag)
    onSelect?.(e, true);
    // Notify canvas that group drag is starting
    if (isMultiSelected) {
      onGroupDragStart?.();
    }
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    
    if (isMultiSelected) {
      // During group drag, notify canvas to update all elements visually
      onGroupDragProgress?.({ dx, dy });
    } else {
      // Single element drag - clamp to prevent off-screen movement
      const newX = Math.max(0, drag.current.x + dx);
      const newY = Math.max(0, drag.current.y + dy);
      ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= 5) {
      if (isMultiSelected && onMoveGroup) {
        // Move all selected elements together
        onMoveGroup({ dx, dy });
      } else {
        const nx = Math.round(drag.current.x + dx);
        const ny = Math.round(drag.current.y + dy);
        onMove?.({ x: nx, y: ny });
      }
    }
    
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div
        ref={ref}
        className="absolute select-none cursor-move"
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h, zIndex: isSelected ? 1000 : 1, willChange: 'transform', backfaceVisibility: 'hidden', outline: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        {/* Floating toolbar when selected (hide during multi-select) */}
        {isSelected && !isMultiSelected && (
          <HexiFloatingToolbar
            onView={handleView}
            onEdit={isAdmin ? handleEdit : undefined}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            showView={true}
            showEdit={isAdmin}
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
            filter: (isSelected && !isMarqueeSelecting)
              ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 4px rgba(59, 130, 246, 1))' 
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
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
          

          {/* Category indicator - small circle centered above label */}
          <circle 
            cx={w/2}
            cy={h/2 - 23}
            r={8}
            fill={categoryColor}
            className="drop-shadow-sm"
          />

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

        {/* Category tooltip trigger overlay */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="absolute cursor-pointer"
                style={{ 
                  left: w/2 - 12, 
                  top: h/2 - 35, 
                  width: 24, 
                  height: 24,
                  zIndex: 10
                }}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium z-[9999]">
              {data.category_name || 'Uncategorized'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
