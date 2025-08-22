import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Move3D } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryCardElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    title: string;
    story: string;
    priority?: string;
    storyPoints?: number;
    epic?: string;
    status?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const StoryCardElement: React.FC<StoryCardElementProps> = ({
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

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

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
        minWidth: 240,
        minHeight: 120,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Story</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {data.priority && (
                <Badge variant="outline" className={cn("text-xs", getPriorityColor(data.priority))}>
                  {data.priority}
                </Badge>
              )}
              {data.storyPoints && (
                <Badge variant="secondary" className="text-xs">
                  {data.storyPoints} pts
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-sm line-clamp-2">{data.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {data.story}
            </p>
            {data.epic && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  Epic: {data.epic}
                </Badge>
              </div>
            )}
            {data.status && (
              <div className="flex justify-end">
                <Badge variant="secondary" className="text-xs">
                  {data.status}
                </Badge>
              </div>
            )}
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