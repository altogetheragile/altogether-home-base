import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Move3D } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BMCCanvasElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const BMCCanvasElement: React.FC<BMCCanvasElementProps> = ({
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
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Business Model Canvas</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              BMC
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">Key Partners</div>
              <div className="text-[10px] line-clamp-2">
                {data?.keyPartners || 'No key partners defined'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">Value Propositions</div>
              <div className="text-[10px] line-clamp-2">
                {data?.valuePropositions || 'No value propositions defined'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">Key Activities</div>
              <div className="text-[10px] line-clamp-2">
                {data?.keyActivities || 'No key activities defined'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground">Customer Segments</div>
              <div className="text-[10px] line-clamp-2">
                {data?.customerSegments || 'No customer segments defined'}
              </div>
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