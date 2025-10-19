import React from 'react';
import { CanvasElement } from '../BaseCanvas';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIToolElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (element: CanvasElement) => void;
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
}

const AIToolElement: React.FC<AIToolElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  children,
  className,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'BUTTON') {
      return;
    }
    
    if (e.button !== 0) return; // Only handle left click
    
    e.preventDefault(); // Prevent text selection while dragging
    onSelect();
    
    const startX = e.clientX - element.position.x;
    const startY = e.clientY - element.position.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      
      onUpdate({
        ...element,
        position: { x: newX, y: newY },
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        'absolute cursor-move',
        className
      )}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
      }}
      onClick={onSelect}
      onMouseDown={handleMouseDown}
    >
      <Card
        className={cn(
          'relative h-full w-full transition-all',
          isSelected && 'ring-2 ring-primary shadow-lg'
        )}
      >
        {/* Controls */}
        {isSelected && (
          <div className="absolute -top-8 right-0 flex items-center gap-1 z-10">
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 h-full overflow-auto">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default AIToolElement;