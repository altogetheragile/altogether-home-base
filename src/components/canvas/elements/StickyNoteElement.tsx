import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StickyNote, Move3D } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export const StickyNoteElement: React.FC<StickyNoteElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();

    if (!onMove) return;

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      onMove({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const stickyColors = {
    yellow: 'bg-yellow-100 border-yellow-200',
    blue: 'bg-blue-100 border-blue-200',
    green: 'bg-green-100 border-green-200',
    pink: 'bg-pink-100 border-pink-200',
    purple: 'bg-purple-100 border-purple-200',
  };

  const colorClass = stickyColors[data.color as keyof typeof stickyColors] || stickyColors.yellow;

  return (
    <div
      className={cn(
        "absolute select-none cursor-move border-2 rounded-lg",
        isSelected ? "border-primary" : "border-transparent",
        "hover:border-primary/50 transition-colors"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 120,
        minHeight: 80,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={cn("w-full h-full shadow-md", colorClass)}>
        <CardContent className="p-3 h-full">
          <div className="flex items-start gap-2 h-full">
            <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 h-full">
              <p className="text-sm text-foreground break-words overflow-auto">
                {data.text || 'Click to edit...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isSelected && (
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize flex items-center justify-center">
          <Move3D className="w-2 h-2 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};