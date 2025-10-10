import React, { useState, useRef, useEffect } from 'react';
import { Circle, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CustomHexiEditorDialog } from './CustomHexiEditorDialog';
import { cn } from '@/lib/utils';

interface CustomHexiElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    label: string;
    color: string;
    icon?: string;
    emoji?: string;
    notes?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: any) => void;
  onDelete?: () => void;
}

export const CustomHexiElement: React.FC<CustomHexiElementProps> = ({
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
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const IconComponent = data.icon ? (Icons[data.icon as keyof typeof Icons] as LucideIcon) || Circle : Circle;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isEditingLabel) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    onSelect?.();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !elementRef.current) return;
    
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    
    elementRef.current.style.transform = `translate(${dragState.current.initialX + dx}px, ${dragState.current.initialY + dy}px)`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5 && !isEditingLabel) {
      setShowEditor(true);
    } else {
      onMove?.({
        x: Math.round(dragState.current.initialX + dx),
        y: Math.round(dragState.current.initialY + dy),
      });
    }
    
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (isEditingLabel && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingLabel]);

  return (
    <>
      <div
        ref={elementRef}
        data-element-id={id}
        className="absolute select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: size.width,
          height: size.height,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative w-full h-full group">
          {/* Hexagon border layer */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-200 group-hover:scale-105",
              isSelected && "scale-105"
            )}
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: data.color,
              opacity: 0.15,
            }}
          />
          
          {/* Hexagon stroke layer */}
          <div
            className="absolute inset-[2px] transition-all duration-200 group-hover:scale-105"
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              border: `2px solid ${data.color}`,
              background: 'transparent',
            }}
          />
          
          {/* Content layer */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center px-3 cursor-pointer"
            role="button"
            aria-label={data.label}
          >
            {data.emoji ? (
              <div className="text-xl mb-1">{data.emoji}</div>
            ) : (
              <IconComponent style={{ color: data.color, width: 20, height: 20 }} />
            )}
            {isEditingLabel ? (
              <input
                ref={inputRef}
                value={data.label}
                onChange={(e) => onContentChange?.({ ...data, label: e.target.value })}
                onBlur={handleLabelBlur}
                onKeyDown={handleLabelKeyDown}
                className="text-xs font-semibold text-center bg-background/80 border rounded px-2 py-1 leading-tight"
                style={{
                  maxWidth: '90%',
                  outline: 'none',
                  color: 'var(--foreground)',
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                onDoubleClick={handleLabelDoubleClick}
                className="text-xs font-semibold text-center leading-tight cursor-text px-1 mt-1"
                style={{ color: 'var(--foreground)' }}
              >
                {data.label}
              </p>
            )}
          </div>
        </div>
      </div>

      <CustomHexiEditorDialog
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        data={data}
        onSave={(newData) => {
          onContentChange?.(newData);
          setShowEditor(false);
        }}
        onDelete={() => {
          setShowEditor(false);
          onDelete?.();
        }}
      />
    </>
  );
};
