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
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move3D,
  Magnet
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

interface BottomToolbarProps {
  snapToGrid: boolean;
  onToggleSnapToGrid: (enabled: boolean) => void;
  gridSize: number;
  showGrid: boolean;
  onToggleShowGrid: (show: boolean) => void;
  onGridSizeChange: (size: number) => void;
  showSectionTitles: boolean;
  onToggleSectionTitles: (show: boolean) => void;
  selectedItemsCount: number;
  selectedField?: TemplateField | null;
  onAlignHorizontal: (alignment: 'left' | 'center' | 'right') => void;
  onAlignVertical: (alignment: 'top' | 'middle' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onAlignToCanvas: (alignment: 'center' | 'left' | 'right' | 'top' | 'bottom') => void;
  onTextFormat?: (format: string) => void;
  onTextAlign?: (alignment: 'left' | 'center' | 'right') => void;
  onInsertList?: (type: 'bullet' | 'numbered') => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  snapToGrid,
  onToggleSnapToGrid,
  gridSize,
  showGrid,
  onToggleShowGrid,
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
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
}) => {
  const gridSizes = [10, 20, 25, 50];
  const isTextFieldSelected = selectedField && (selectedField.type === 'text' || selectedField.type === 'textarea');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-full">
          {/* Left side - Grid and View controls */}
          <div className="flex items-center gap-2">
            {/* Grid Controls */}
            <div className="flex items-center bg-background rounded-lg p-1">
              <Button
                variant={showGrid ? "default" : "ghost"}
                size="sm"
                onClick={() => onToggleShowGrid(!showGrid)}
                className="h-8 px-3"
                title={showGrid ? "Hide grid" : "Show grid"}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              
              <Button
                variant={snapToGrid ? "default" : "ghost"}
                size="sm"
                onClick={() => onToggleSnapToGrid(!snapToGrid)}
                className="h-8 px-3"
                title={snapToGrid ? "Disable snap" : "Enable snap"}
              >
                <Magnet className="h-4 w-4" />
              </Button>
              
              {(showGrid || snapToGrid) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      {gridSize}px
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-32">
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

            <Separator orientation="vertical" className="h-8" />

            {/* View Controls */}
            <div className="flex items-center bg-background rounded-lg p-1">
              <Button
                variant={showSectionTitles ? "default" : "ghost"}
                size="sm"
                onClick={onToggleSectionTitles}
                className="h-8 px-3"
                title={showSectionTitles ? "Hide titles" : "Show titles"}
              >
                {showSectionTitles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Center - Text editing and alignment tools */}
          <div className="flex items-center gap-2">
            {/* Text editing toolbar */}
            {isTextFieldSelected && onTextFormat && onTextAlign && onInsertList && (
              <>
                <div className="flex items-center bg-background rounded-lg p-1">
                  <TextEditingToolbar
                    onFormatText={onTextFormat}
                    onAlign={onTextAlign}
                    onInsertList={onInsertList}
                  />
                </div>
                <Separator orientation="vertical" className="h-8" />
              </>
            )}

            {/* Alignment controls when items are selected */}
            {selectedItemsCount > 0 && (
              <div className="flex items-center gap-2 bg-background rounded-lg p-1">
                <Badge variant="secondary" className="flex items-center gap-1 h-8 px-3">
                  <Layers className="h-3 w-3" />
                  {selectedItemsCount} selected
                </Badge>

                <Separator orientation="vertical" className="h-6" />

                {/* Alignment Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3" title="Align objects">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Horizontal
                    </div>
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
                    
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Vertical
                    </div>
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
                    
                    {selectedItemsCount > 2 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                          Distribution
                        </div>
                        <DropdownMenuItem onClick={() => onDistribute('horizontal')}>
                          <AlignHorizontalSpaceAround className="h-4 w-4 mr-2" />
                          Distribute H
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDistribute('vertical')}>
                          <AlignVerticalSpaceAround className="h-4 w-4 mr-2" />
                          Distribute V
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Canvas alignment */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-3" title="Align to canvas">
                      <Layers className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48 p-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b mb-1">
                      Canvas Alignment
                    </div>
                    <DropdownMenuItem onClick={() => onAlignToCanvas('center')} className="py-2 px-3 rounded-sm hover:bg-accent">
                      <AlignCenter className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Center Canvas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAlignToCanvas('left')} className="py-2 px-3 rounded-sm hover:bg-accent">
                      <AlignLeft className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Left Edge</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAlignToCanvas('right')} className="py-2 px-3 rounded-sm hover:bg-accent">
                      <AlignRight className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Right Edge</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAlignToCanvas('top')} className="py-2 px-3 rounded-sm hover:bg-accent">
                      <AlignStartVertical className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Top Edge</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAlignToCanvas('bottom')} className="py-2 px-3 rounded-sm hover:bg-accent">
                      <AlignEndVertical className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-medium">Bottom Edge</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Right side - Zoom controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-background rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                disabled={zoom <= 25}
                className="h-8 px-2"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomReset}
                className="h-8 px-3 text-xs font-mono"
                title="Reset zoom"
              >
                {zoom}%
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                disabled={zoom >= 200}
                className="h-8 px-2"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomFit}
                className="h-8 px-2"
                title="Fit to screen"
              >
                <Move3D className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};