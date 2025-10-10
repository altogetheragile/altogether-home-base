import React, { useState, useRef } from 'react';
import { Circle, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CustomHexiEditorDialog } from './CustomHexiEditorDialog';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEditor, setShowEditor] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditingLabel) return;
    setIsDragging(true);
    setHasDragged(false);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onSelect?.();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.current.x, 2) + 
      Math.pow(e.clientY - dragStartPos.current.y, 2)
    );
    
    if (distance > 5) {
      setHasDragged(true);
    }
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    onMove?.({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditingLabel || hasDragged) return;
    setShowEditor(true);
    e.stopPropagation();
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
    }
  };

  const IconComponent = data.icon ? (Icons[data.icon as keyof typeof Icons] as LucideIcon) || Circle : Circle;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="group"
      >
        {/* Regular Hexagon SVG */}
        <svg 
          width={size.width} 
          height={size.height} 
          viewBox="0 0 100 87"
          className="transition-all duration-200 group-hover:scale-105"
        >
          {/* Regular hexagon path */}
          <path
            d="M 25,0 L 75,0 L 100,43.5 L 75,87 L 25,87 L 0,43.5 Z"
            fill={`${data.color}15`}
            stroke={data.color}
            strokeWidth="6"
          />
          
          {/* Content using foreignObject */}
          <foreignObject x="10" y="20" width="80" height="47">
            <div className="flex flex-col items-center justify-center h-full">
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
                  onDoubleClick={handleLabelDoubleClick}
                  className="text-xs font-semibold text-center bg-background/80 border rounded px-2 py-1 leading-tight"
                  style={{
                    maxWidth: '90%',
                    outline: 'none',
                    color: 'var(--foreground)',
                  }}
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
          </foreignObject>
        </svg>
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
