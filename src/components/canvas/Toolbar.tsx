import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  ZoomIn,
  ZoomOut,
  Download,
  StickyNote,
  Maximize2,
  AlignStartVertical
} from 'lucide-react';
import { HexiSelector } from './elements/HexiSelector';

interface ToolbarProps {
  onAddElement: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onNormalizePositions: () => void;
  onSetZoom: (zoom: number) => void;
  onExport: () => void;
  zoom: number;
  onAddKnowledgeItem: (itemId: string, itemData: any) => void;
  onAddPlanningFocus: (focusId: string, focusData: any) => void;
  existingKnowledgeItemIds?: string[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement,
  onZoomIn,
  onZoomOut,
  onResetView,
  onNormalizePositions,
  onSetZoom,
  onExport,
  zoom,
  onAddKnowledgeItem,
  onAddPlanningFocus,
  existingKnowledgeItemIds = [],
}) => {
  const zoomPresets = [0.5, 0.75, 1.0, 1.5, 2.0];
  const [showHexiSelector, setShowHexiSelector] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
        {/* Add Hexi Button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowHexiSelector(true)}
          title="Add Hexi"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Hexi
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddElement('stickyNote')}
          title="Add Sticky Note"
        >
          <StickyNote className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {zoomPresets.map((preset) => (
              <Button
                key={preset}
                variant={Math.abs(zoom - preset) < 0.01 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSetZoom(preset)}
                className="text-xs px-2 h-7"
                title={`Zoom to ${preset * 100}%`}
              >
                {preset * 100}%
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetView}
            title="Reset View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNormalizePositions}
            title="Fix Element Positions"
          >
            <AlignStartVertical className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Export */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          title="Export Canvas"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <HexiSelector
        isOpen={showHexiSelector}
        onClose={() => setShowHexiSelector(false)}
        onAddKnowledgeItem={onAddKnowledgeItem}
        onAddPlanningFocus={onAddPlanningFocus}
        onAddCustomHexi={() => onAddElement('customHexi')}
        existingItemIds={existingKnowledgeItemIds}
      />
    </>
  );
};
