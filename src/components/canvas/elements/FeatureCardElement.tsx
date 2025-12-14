import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Puzzle } from 'lucide-react';
import { SimpleFloatingToolbar } from './SimpleFloatingToolbar';

interface FeatureData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  user_value?: string;
  storyNumber?: string;
}

interface FeatureCardElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: FeatureData;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  isMarqueeSelecting?: boolean;
  onSelect?: (e?: React.PointerEvent, preserveIfSelected?: boolean) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onChangeType?: (newType: 'epic' | 'feature' | 'story') => void;
}

export const FeatureCardElement: React.FC<FeatureCardElementProps> = ({
  id,
  position,
  size,
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
  onEdit,
  onChangeType,
}) => {
  const { x, y } = position;
  const { width, height } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
    onSelect?.(e, true);
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
      onGroupDragProgress?.({ dx, dy });
    } else {
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
        onMoveGroup({ dx, dy });
      } else {
        const nx = Math.round(Math.max(0, drag.current.x + dx));
        const ny = Math.round(Math.max(0, drag.current.y + dy));
        onMove?.({ x: nx, y: ny });
      }
    }
    
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleDoubleClick = () => {
    onEdit?.();
  };

  return (
    <div
      ref={ref}
      className="absolute select-none cursor-move"
      style={{ 
        transform: `translate(${x}px, ${y}px)`, 
        width, 
        height, 
        zIndex: isSelected ? 1000 : 1,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={handleDoubleClick}
      data-element-id={id}
    >
      {/* Floating toolbar when selected (hide during multi-select) */}
      {isSelected && !isMultiSelected && (
        <SimpleFloatingToolbar
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          currentType="feature"
          onChangeType={onChangeType}
        />
      )}

      <div 
        className={`h-full min-h-[160px] bg-card border-2 rounded-lg p-3 transition-all flex flex-col ${
          isSelected && !isMarqueeSelecting
            ? 'border-primary shadow-lg shadow-primary/20' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        {data ? (
          <div className="flex flex-col h-full">
            {/* Header row - fixed height */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Puzzle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Feature</span>
              </div>
              {data.storyNumber && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {data.storyNumber}
                </Badge>
              )}
            </div>

            {/* Title - allow 2 lines */}
            <h4 className="text-sm font-semibold line-clamp-2 leading-tight mb-2">
              {data.title}
            </h4>

            {/* Description - flex grow */}
            <div className="flex-1 min-h-[32px]">
              {data.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {data.description}
                </p>
              )}
            </div>

            {/* Footer - fixed at bottom */}
            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex items-center gap-2">
                {data.priority && (
                  <Badge 
                    variant={getPriorityColor(data.priority)}
                    className="text-xs px-2 py-0.5"
                  >
                    {data.priority}
                  </Badge>
                )}
                {data.status && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {data.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Puzzle className="h-6 w-6 mb-1 opacity-50" />
            <p className="text-xs">Double-click to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
