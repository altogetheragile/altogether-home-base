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
  const labelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditingLabel) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onSelect?.();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
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
    if (!isDragging && !isEditingLabel) {
      setShowEditor(true);
    }
    e.stopPropagation();
  };

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (labelRef.current) {
      const newLabel = labelRef.current.textContent || 'New Hexagon';
      onContentChange?.({ ...data, label: newLabel });
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      labelRef.current?.blur();
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
        {/* Hexagon */}
        <div
          className="relative w-full h-full transition-all duration-200 group-hover:scale-105 group-hover:brightness-110"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          {/* Background with gradient - dashed border effect */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${data.color}33, ${data.color}0D)`,
              border: isSelected ? `3px dashed ${data.color}` : `2px dashed ${data.color}66`,
            }}
          />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4">
            {data.emoji ? (
              <div className="text-3xl mb-2">{data.emoji}</div>
            ) : (
              <IconComponent
                className="w-8 h-8 mb-2"
                style={{ color: data.color }}
              />
            )}
          </div>
        </div>

        {/* Label */}
        <div
          className="absolute -bottom-8 left-0 right-0 text-center"
          onDoubleClick={handleLabelDoubleClick}
        >
          <div
            ref={labelRef}
            contentEditable={isEditingLabel}
            suppressContentEditableWarning
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            className={`text-xs font-medium text-foreground line-clamp-2 px-1 ${
              isEditingLabel ? 'bg-background border rounded px-2 py-1' : ''
            }`}
            style={{
              outline: isEditingLabel ? '2px solid hsl(var(--primary))' : 'none',
            }}
          >
            {data.label}
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
