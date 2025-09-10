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
  Magnet,
  Settings
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
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
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
  rightSidebarOpen = false,
  onToggleRightSidebar,
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
                onClick={() => onToggleSectionTitles(!showSectionTitles)}
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
                  <DropdownMenuContent align="center" className="w-56 bg-card border shadow-xl">
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">HORIZONTAL</div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignHorizontal('left')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignHorizontal('center')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignHorizontal('right')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">VERTICAL</div>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignVertical('top')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignStartVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignVertical('middle')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignCenterVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignVertical('bottom')}
                          className="h-8 w-full justify-center"
                        >
                          <AlignEndVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {selectedItemsCount > 2 && (
                      <>
                        <Separator className="my-2" />
                        <div className="px-3 py-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">DISTRIBUTE</div>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDistribute('horizontal')}
                              className="h-8 justify-center"
                            >
                              <AlignHorizontalSpaceAround className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDistribute('vertical')}
                              className="h-8 justify-center"
                            >
                              <AlignVerticalSpaceAround className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
                  <DropdownMenuContent align="center" className="w-48 bg-card border shadow-xl">
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">CANVAS</div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignToCanvas('center')}
                          className="w-full justify-start h-8"
                        >
                          <AlignCenter className="h-4 w-4 mr-2" />
                          Center
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignToCanvas('left')}
                          className="w-full justify-start h-8"
                        >
                          <AlignLeft className="h-4 w-4 mr-2" />
                          Left Edge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignToCanvas('right')}
                          className="w-full justify-start h-8"
                        >
                          <AlignRight className="h-4 w-4 mr-2" />
                          Right Edge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignToCanvas('top')}
                          className="w-full justify-start h-8"
                        >
                          <AlignStartVertical className="h-4 w-4 mr-2" />
                          Top Edge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAlignToCanvas('bottom')}
                          className="w-full justify-start h-8"
                        >
                          <AlignEndVertical className="h-4 w-4 mr-2" />
                          Bottom Edge
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Properties Panel Toggle */}
                {onToggleRightSidebar && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      variant={rightSidebarOpen ? "default" : "ghost"}
                      size="sm"
                      onClick={onToggleRightSidebar}
                      className="h-8 px-3"
                      title="Toggle properties panel"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right side - Zoom controls */}
          <div className="flex items-center gap-2">
            <Separator orientation="vertical" className="h-8" />
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