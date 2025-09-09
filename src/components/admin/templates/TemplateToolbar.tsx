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
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 p-2 bg-card border-b min-w-max">
        {/* Grid Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant={snapToGrid ? "default" : "outline"}
            size="sm"
            onClick={onToggleSnapToGrid}
            className="h-8 px-2"
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Grid
          </Button>
          
          {snapToGrid && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
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

        <Separator orientation="vertical" className="h-6 shrink-0" />

        {/* View Controls */}
        <Button
          variant={showSectionTitles ? "default" : "outline"}
          size="sm"
          onClick={onToggleSectionTitles}
          className="h-8 px-2 shrink-0"
        >
          {showSectionTitles ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
          Titles
        </Button>

        {/* Alignment Controls */}
        {selectedItemsCount > 0 && (
          <>
            <Separator orientation="vertical" className="h-6 shrink-0" />
            
            <Badge variant="secondary" className="flex items-center gap-1 shrink-0 h-6 px-2">
              <Layers className="h-3 w-3" />
              {selectedItemsCount}
            </Badge>

            {/* Alignment Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 shrink-0">
                  Align
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Horizontal</div>
                <DropdownMenuItem onClick={() => onAlignHorizontal('left')}>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  Align Left
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignHorizontal('center')}>
                  <AlignCenter className="h-4 w-4 mr-2" />
                  Align Center
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignHorizontal('right')}>
                  <AlignRight className="h-4 w-4 mr-2" />
                  Align Right
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Vertical</div>
                <DropdownMenuItem onClick={() => onAlignVertical('top')}>
                  <AlignStartVertical className="h-4 w-4 mr-2" />
                  Align Top
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignVertical('middle')}>
                  <AlignCenterVertical className="h-4 w-4 mr-2" />
                  Align Middle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignVertical('bottom')}>
                  <AlignEndVertical className="h-4 w-4 mr-2" />
                  Align Bottom
                </DropdownMenuItem>
                {selectedItemsCount > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Distribute</div>
                    <DropdownMenuItem onClick={() => onDistribute('horizontal')}>
                      <AlignHorizontalSpaceAround className="h-4 w-4 mr-2" />
                      Distribute Horizontally
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDistribute('vertical')}>
                      <AlignVerticalSpaceAround className="h-4 w-4 mr-2" />
                      Distribute Vertically
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Align to Canvas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 shrink-0">
                  Canvas
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
          </>
        )}
      </div>
    </div>
  );
};