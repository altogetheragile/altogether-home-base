import React, { useState, useRef } from 'react';
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
  const [hasDragged, setHasDragged] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
    if (!hasDragged) {
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
            fill={`${domainColor}15`}
            stroke={domainColor}
            strokeWidth="3"
          />
          
          {/* Content using foreignObject */}
          <foreignObject x="10" y="20" width="80" height="47">
            <div className="flex flex-col items-center justify-center h-full">
              <Layers style={{ color: categoryColor, width: 20, height: 20 }} />
              <p className="text-xs font-semibold text-center leading-tight mt-1 px-1" style={{ color: 'var(--foreground)' }}>
                {data.name}
              </p>
            </div>
          </foreignObject>
        </svg>
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
