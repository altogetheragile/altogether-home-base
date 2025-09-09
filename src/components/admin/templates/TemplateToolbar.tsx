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
    <div className="flex flex-wrap items-center gap-2 p-2 bg-card border-b min-w-0">
      {/* Grid Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={snapToGrid ? "default" : "outline"}
          size="sm"
          onClick={onToggleSnapToGrid}
          className="whitespace-nowrap"
        >
          <Grid3X3 className="h-4 w-4 mr-1" />
          Grid
        </Button>
        
        {snapToGrid && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
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
      <Button
        variant={showSectionTitles ? "default" : "outline"}
        size="sm"
        onClick={onToggleSectionTitles}
        className="whitespace-nowrap"
      >
        {showSectionTitles ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
        Titles
      </Button>

      {/* Alignment Controls */}
      {selectedItemsCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          
          <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
            <Layers className="h-3 w-3" />
            {selectedItemsCount}
          </Badge>

          {/* Horizontal Alignment */}
          <div className="flex items-center">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('left')}
              title="Align Left"
              className="p-1"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('center')}
              title="Align Center"
              className="p-1"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignHorizontal('right')}
              title="Align Right"
              className="p-1"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Vertical Alignment */}
          <div className="flex items-center">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('top')}
              title="Align Top"
              className="p-1"
            >
              <AlignStartVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('middle')}
              title="Align Middle"
              className="p-1"
            >
              <AlignCenterVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => onAlignVertical('bottom')}
              title="Align Bottom"
              className="p-1"
            >
              <AlignEndVertical className="h-4 w-4" />
            </Button>
          </div>

          {selectedItemsCount > 1 && (
            <>
              {/* Distribution */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDistribute('horizontal')}
                  title="Distribute Horizontally"
                  className="p-1"
                >
                  <AlignHorizontalSpaceAround className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDistribute('vertical')}
                  title="Distribute Vertically"
                  className="p-1"
                >
                  <AlignVerticalSpaceAround className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Align to Canvas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
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
  );
};