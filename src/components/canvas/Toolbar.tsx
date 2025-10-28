import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  ZoomIn,
  ZoomOut,
  Download,
  StickyNote
} from 'lucide-react';
import { HexiSelector } from './elements/HexiSelector';

interface ToolbarProps {
  onAddElement: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
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
  onExport,
  zoom,
  onAddKnowledgeItem,
  onAddPlanningFocus,
  existingKnowledgeItemIds = [],
}) => {
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
          
          <span className="text-xs font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
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
