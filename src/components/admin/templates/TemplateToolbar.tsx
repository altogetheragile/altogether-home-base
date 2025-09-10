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
import { TextEditingToolbar } from './TextEditingToolbar';
import { TemplateField } from '@/types/template';

interface TemplateToolbarProps {
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showSectionTitles: boolean;
  onToggleSectionTitles: () => void;
  selectedItemsCount: number;
  selectedField?: TemplateField | null;
  onAlignHorizontal: (alignment: 'left' | 'center' | 'right') => void;
  onAlignVertical: (alignment: 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onAlignToCanvas: (alignment: 'center' | 'left' | 'right' | 'top' | 'bottom') => void;
  onTextFormat?: (format: string) => void;
  onTextAlign?: (alignment: 'left' | 'center' | 'right') => void;
  onInsertList?: (type: 'bullet' | 'numbered') => void;
}

export const TemplateToolbar: React.FC<TemplateToolbarProps> = ({
  snapToGrid,
  onToggleSnapToGrid,
  gridSize,
  onGridSizeChange,
  showSectionTitles,
  onToggleSectionTitles,
  selectedItemsCount,
  selectedField,
  onAlignHorizontal,
  onAlignVertical,
  onDistribute,
  onAlignToCanvas,
  onTextFormat,
  onTextAlign,
  onInsertList,
}) => {
  const gridSizes = [10, 20, 25, 50];
  const isTextFieldSelected = selectedField && (selectedField.type === 'text' || selectedField.type === 'textarea');

  return (
    <div className="bg-card border-b">
      <div className="p-2 overflow-x-auto">
        {/* Single compact row with responsive design */}
        <div className="flex items-center gap-1.5 min-w-max">
          {/* Grid Controls - Compact */}
          <div className="flex items-center">
            <Button
              variant={snapToGrid ? "default" : "outline"}
              size="sm"
              onClick={onToggleSnapToGrid}
              className="h-7 px-2 text-xs"
              title={snapToGrid ? "Hide grid (currently visible)" : "Show grid for precise alignment"}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            
            {snapToGrid && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 ml-1 text-xs">
                    {gridSize}px
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 bg-popover border shadow-md min-w-[120px]">
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

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* View Controls */}
          <Button
            variant={showSectionTitles ? "default" : "outline"}
            size="sm"
            onClick={onToggleSectionTitles}
            className="h-7 px-2 text-xs"
            title={showSectionTitles ? "Hide section titles" : "Show section titles"}
          >
            {showSectionTitles ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>

          {/* Text editing toolbar for selected text fields */}
          {isTextFieldSelected && onTextFormat && onTextAlign && onInsertList && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <TextEditingToolbar
                onFormatText={onTextFormat}
                onAlign={onTextAlign}
                onInsertList={onInsertList}
              />
            </>
          )}

          {/* Show selection info and alignment controls when items are selected */}
          {selectedItemsCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1" />
              
              <Badge variant="secondary" className="flex items-center gap-1 h-6 px-2 text-xs">
                <Layers className="h-3 w-3" />
                {selectedItemsCount}
              </Badge>

              {/* Compact Alignment Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 z-50 bg-popover border shadow-md">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">Horizontal Alignment</div>
                  <DropdownMenuItem onClick={() => onAlignHorizontal('left')} className="py-2">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Align Left
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignHorizontal('center')} className="py-2">
                    <AlignCenter className="h-4 w-4 mr-2" />
                    Align Center
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignHorizontal('right')} className="py-2">
                    <AlignRight className="h-4 w-4 mr-2" />
                    Align Right
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">Vertical Alignment</div>
                  <DropdownMenuItem onClick={() => onAlignVertical('top')} className="py-2">
                    <AlignStartVertical className="h-4 w-4 mr-2" />
                    Align Top
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignVertical('middle')} className="py-2">
                    <AlignCenterVertical className="h-4 w-4 mr-2" />
                    Align Middle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignVertical('bottom')} className="py-2">
                    <AlignEndVertical className="h-4 w-4 mr-2" />
                    Align Bottom
                  </DropdownMenuItem>
                  {selectedItemsCount > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">Distribution</div>
                      <DropdownMenuItem onClick={() => onDistribute('horizontal')} className="py-2">
                        <AlignHorizontalSpaceAround className="h-4 w-4 mr-2" />
                        Distribute Horizontally
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDistribute('vertical')} className="py-2">
                        <AlignVerticalSpaceAround className="h-4 w-4 mr-2" />
                        Distribute Vertically
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Canvas Align to Edges Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 text-xs" 
                    title="Align selected items to canvas edges or center"
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44 z-50 bg-popover border shadow-md">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">Canvas Alignment</div>
                  <DropdownMenuItem onClick={() => onAlignToCanvas('center')} className="py-2">
                    <AlignCenter className="h-4 w-4 mr-2" />
                    Center in Canvas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAlignToCanvas('left')} className="py-2">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    Align to Left Edge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignToCanvas('right')} className="py-2">
                    <AlignRight className="h-4 w-4 mr-2" />
                    Align to Right Edge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignToCanvas('top')} className="py-2">
                    <AlignStartVertical className="h-4 w-4 mr-2" />
                    Align to Top Edge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAlignToCanvas('bottom')} className="py-2">
                    <AlignEndVertical className="h-4 w-4 mr-2" />
                    Align to Bottom Edge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
};