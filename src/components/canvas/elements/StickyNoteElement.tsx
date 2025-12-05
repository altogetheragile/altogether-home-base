import React, { useState, useRef } from 'react';
import { Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hexPoints, wrapLines } from '../hex-utils';

interface StickyNoteElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    text: string;
    color?: string;
  };
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (e?: React.PointerEvent | React.MouseEvent, preserveIfSelected?: boolean) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onContentChange?: (data: { text: string; color?: string }) => void;
  onDelete?: () => void;
}

export const StickyNoteElement: React.FC<StickyNoteElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  isMultiSelected,
  onSelect,
  onMove,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onContentChange,
  onDelete,
}) => {
  const { x, y } = position;
  const { width: w = 140, height: h = 121 } = size;
  
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stickyColors: Record<string, { fill: string; stroke: string }> = {
    yellow: { fill: '#FEF9C3', stroke: '#EAB308' },
    blue: { fill: '#DBEAFE', stroke: '#3B82F6' },
    green: { fill: '#D1FAE5', stroke: '#10B981' },
    pink: { fill: '#FCE7F3', stroke: '#EC4899' },
    purple: { fill: '#E9D5FF', stroke: '#A855F7' },
  };

  const colors = stickyColors[data.color || 'yellow'] || stickyColors.yellow;
  const labelLines = wrapLines(data.text || "New note", 15, 5);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isEditing) return;
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
    
    if (distance < 5) {
      setIsEditing(true);
      setEditText(data.text);
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      if (isMultiSelected && onMoveGroup) {
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

  const handleSave = () => {
    onContentChange?.({ ...data, text: editText });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditText(data.text);
      setIsEditing(false);
    }
  };

  return (
    <>

      <div
        ref={ref}
        className="absolute select-none cursor-move"
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h, willChange: 'transform', backfaceVisibility: 'hidden', outline: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        {isSelected && !isMultiSelected && onDelete && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-card border rounded-md p-1 shadow-lg z-10 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Move"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Move className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        <svg 
          width={w} 
          height={h} 
          viewBox={`0 0 ${w} ${h}`} 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ 
            overflow: 'visible',
          filter: (isSelected && !isMultiSelected)
            ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 4px rgba(59, 130, 246, 1))' 
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          }}
        >

          {/* Hex shape */}
          <polygon 
            points={hexPoints(w,h)} 
            fill={colors.fill} 
            stroke="none"
          />
          

          {/* Text content */}
          {!isEditing && (
            <g fontFamily="Inter, ui-sans-serif, system-ui" fontWeight={500} fill="#111827" textAnchor="middle">
              {labelLines.map((ln, i) => (
                <text
                  key={i}
                  x={w/2}
                  y={h/2 - (labelLines.length * 8) + (i * 16)}
                  fontSize={12}
                  dominantBaseline="middle"
                >
                  {ln}
                </text>
              ))}
            </g>
          )}
        </svg>

        {/* Editing overlay */}
        {isEditing && (
          <div 
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{ pointerEvents: 'all' }}
          >
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-full h-full text-xs resize-none border-none outline-none bg-transparent text-foreground text-center"
              placeholder="Enter your note..."
              style={{ 
                background: 'transparent',
                maxWidth: '110px',
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};