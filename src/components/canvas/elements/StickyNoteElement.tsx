import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
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
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: { text: string; color?: string }) => void;
  onDelete?: () => void;
}

export const StickyNoteElement: React.FC<StickyNoteElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onMove,
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
      setIsEditing(true);
      setEditText(data.text);
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      const nx = Math.round(drag.current.x + dx);
      const ny = Math.round(drag.current.y + dy);
      onMove?.({ x: nx, y: ny });
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
        style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-element-id={id}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
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

      {/* Delete button when selected - positioned relative to note */}
      {isSelected && onDelete && (
        <div
          className="absolute pointer-events-none"
          style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h }}
        >
          <Button
            size="icon"
            variant="destructive"
            className="no-export absolute h-6 w-6 rounded-full shadow-md pointer-events-auto"
            style={{
              left: w - 12,
              top: -12,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );
};