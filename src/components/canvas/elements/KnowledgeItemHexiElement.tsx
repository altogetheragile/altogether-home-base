import React, { useState, useRef } from 'react';
import { Layers } from 'lucide-react';
import { KnowledgeItemDetailsDialog } from './KnowledgeItemDetailsDialog';
import { cn } from '@/lib/utils';

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
  const elementRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const domainColor = data.domain_color || '#8B5CF6';
  const categoryColor = data.category_color || domainColor;
  const planningFocusColor = data.planning_focus_color;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
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
    
    if (distance < 5) {
      setShowDetails(true);
    } else {
      onMove?.({
        x: Math.round(dragState.current.initialX + dx),
        y: Math.round(dragState.current.initialY + dy),
      });
    }
    
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
          {/* Planning Focus Corner Indicator */}
          {planningFocusColor && (
            <span
              className="absolute z-10"
              style={{
                right: '8px',
                top: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: planningFocusColor,
                border: '2px solid white',
              }}
            />
          )}
          
          {/* Hexagon border layer */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-200 group-hover:scale-105",
              isSelected && "scale-105"
            )}
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: domainColor,
              opacity: 0.15,
            }}
          />
          
          {/* Hexagon stroke layer */}
          <div
            className="absolute inset-[2px] transition-all duration-200 group-hover:scale-105"
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              border: `2px solid ${domainColor}`,
              background: 'transparent',
            }}
          />
          
          {/* Content layer */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center px-3 cursor-pointer"
            role="button"
            aria-label={data.name}
          >
            <Layers style={{ color: categoryColor, width: 20, height: 20 }} />
            <p 
              className="text-xs font-semibold text-center leading-tight mt-1"
              style={{ color: 'var(--foreground)' }}
            >
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
