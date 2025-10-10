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
        {/* Planning Focus Badge */}
        {data.planning_focus_name && data.planning_focus_color && (
          <div
            className="absolute -top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white font-medium z-10 shadow-sm"
            style={{
              backgroundColor: data.planning_focus_color,
            }}
          >
            {data.planning_focus_name}
          </div>
        )}

        {/* Hexagon */}
        <div
          className="relative w-full h-full transition-all duration-200 group-hover:scale-105 group-hover:brightness-110"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          }}
        >
          {/* Background with gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${domainColor}33, ${domainColor}0D)`,
              border: isSelected ? `3px solid ${domainColor}` : `2px solid ${domainColor}66`,
            }}
          />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-4">
            <Layers
              className="w-8 h-8 mb-2"
              style={{ color: domainColor }}
            />
          </div>
        </div>

        {/* Label */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <p className="text-xs font-medium text-foreground line-clamp-2 px-1">
            {data.name}
          </p>
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
