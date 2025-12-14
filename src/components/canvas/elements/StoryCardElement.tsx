import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { StoryFloatingToolbar } from './StoryFloatingToolbar';

interface StoryData {
  title: string;
  story?: string;
  description?: string;
  acceptanceCriteria?: string[];
  priority: string;
  storyPoints: number;
  storyNumber?: string;
  epic?: string;
  status?: string;
  user_persona?: string;
  tags?: string[];
  source?: string;
}

interface StoryCardElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: StoryData;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  isMarqueeSelecting?: boolean;
  isCompact?: boolean;
  onSelect?: (e?: React.PointerEvent, preserveIfSelected?: boolean) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onAddToBacklog?: () => void;
  onSplit?: () => void;
  onChangeType?: (newType: 'epic' | 'feature' | 'story') => void;
}

export const StoryCardElement: React.FC<StoryCardElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  isMultiSelected,
  isMarqueeSelecting,
  isCompact = false,
  onSelect,
  onMove,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onDelete,
  onDuplicate,
  onEdit,
  onAddToBacklog,
  onSplit,
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
        <StoryFloatingToolbar
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onAddToBacklog={onAddToBacklog}
          onSplit={onSplit}
          canSplit={(data?.acceptanceCriteria?.length || 0) >= 2}
          onChangeType={onChangeType}
        />
      )}

      <div 
        className={`h-full bg-card border-2 border-l-4 border-l-green-500 rounded-lg p-3 transition-all flex flex-col ${
          isCompact ? 'min-h-0' : 'min-h-[160px]'
        } ${
          isSelected && !isMarqueeSelecting
            ? 'border-primary border-l-green-500 shadow-lg shadow-primary/20' 
            : 'border-border hover:border-primary/50'
        }`}
      >
        {data ? (
          isCompact ? (
            // Compact view - just story number and title
            <div className="flex flex-col h-full justify-center">
              {data.storyNumber && (
                <Badge variant="secondary" className="font-mono text-xs mb-1 self-start">
                  {data.storyNumber}
                </Badge>
              )}
              <h4 className="text-sm font-semibold line-clamp-2 leading-tight">
                {data.title}
              </h4>
            </div>
          ) : (
            // Expanded view - full details
            <div className="flex flex-col h-full">
              {/* Header row - fixed height */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Story</span>
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
                {(data.story || data.description) && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {data.story || data.description}
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
                  {data.storyPoints > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {data.storyPoints} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6 mb-1 opacity-50" />
            <p className="text-xs">Double-click to edit</p>
          </div>
        )}
      </div>
    </div>
  );
};
