import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Grid3X3, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalSpaceAround, 
  AlignHorizontalSpaceAround,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateToolbarProps {
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showSectionTitles: boolean;
  onToggleSectionTitles: () => void;
  selectedItemsCount: number;
  onAlignHorizontal: (alignment: 'left' | 'center' | 'right') => void;
  onAlignVertical: (alignment: 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onAlignToCanvas: (alignment: 'center' | 'left' | 'right' | 'top' | 'bottom') => void;
}

export const TemplateToolbar: React.FC<TemplateToolbarProps> = ({
  snapToGrid,
  onToggleSnapToGrid,
  gridSize,
  onGridSizeChange,
  showSectionTitles,
  onToggleSectionTitles,
  selectedItemsCount,
  onAlignHorizontal,
  onAlignVertical,
  onDistribute,
  onAlignToCanvas,
}) => {
  const gridSizes = [10, 20, 25, 50];

  return (
    <div className="flex items-center gap-2 p-2 bg-card border-b">
      {/* Grid Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={snapToGrid ? "default" : "outline"}
          size="sm"
          onClick={onToggleSnapToGrid}
          className="flex items-center gap-2"
        >
          <Grid3X3 className="h-4 w-4" />
          Snap to Grid
        </Button>
        
        {snapToGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {gridSize}px
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {gridSizes.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onGridSizeChange(size)}
                  className={gridSize === size ? "bg-accent" : ""}
                >
                  {size}px Grid
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* View Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={showSectionTitles ? "default" : "outline"}
          size="sm"
          onClick={onToggleSectionTitles}
          className="flex items-center gap-2"
        >
          {showSectionTitles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Section Titles
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Alignment Controls */}
      {selectedItemsCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {selectedItemsCount} selected
          </Badge>

          {/* Horizontal Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('left')}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('center')}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('right')}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Vertical Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('top')}
              title="Align Top"
            >
              <AlignStartVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('middle')}
              title="Align Middle"
            >
              <AlignCenterVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('bottom')}
              title="Align Bottom"
            >
              <AlignEndVertical className="h-4 w-4" />
            </Button>
          </div>

          {selectedItemsCount > 1 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              
              {/* Distribution */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDistribute('horizontal')}
                  title="Distribute Horizontally"
                >
                  <AlignHorizontalSpaceAround className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDistribute('vertical')}
                  title="Distribute Vertically"
                >
                  <AlignVerticalSpaceAround className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Align to Canvas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Align to Canvas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAlignToCanvas('center')}>
                Center in Canvas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAlignToCanvas('left')}>
                Align to Left Edge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAlignToCanvas('right')}>
                Align to Right Edge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAlignToCanvas('top')}>
                Align to Top Edge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAlignToCanvas('bottom')}>
                Align to Bottom Edge
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};