import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { KnowledgeItemDetailsDialog } from './KnowledgeItemDetailsDialog';

interface KnowledgeItemHexiElementProps {
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
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onDelete?: () => void;
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
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
    if (!isDragging) {
      setShowDetails(true);
    }
    e.stopPropagation();
  };

  const domainColor = data.domain_color || '#8B5CF6';
  const categoryColor = data.category_color || domainColor;
  const planningFocusColor = data.planning_focus_color;

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
        {/* Planning Focus Corner Dot */}
        {planningFocusColor && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background shadow-sm z-10"
            style={{
              backgroundColor: planningFocusColor,
            }}
          />
        )}

        {/* Hexagon */}
        <div
          className="relative w-full h-full transition-all duration-200 group-hover:scale-105"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          {/* Background with solid color and thick border */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `${domainColor}30`,
              border: `4px solid ${domainColor}`,
            }}
          />

          {/* Content - Text and Icon inside hexagon */}
          <div className="relative h-full flex flex-col items-center justify-center p-3 px-4">
            <Layers
              className="w-6 h-6 mb-1.5"
              style={{ color: categoryColor }}
            />
            <p className="text-sm font-medium text-foreground text-center line-clamp-3 leading-tight">
              {data.name}
            </p>
          </div>
        </div>
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
