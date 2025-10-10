import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  StickyNote,
  ZoomIn,
  ZoomOut,
  Download,
  Hexagon
} from 'lucide-react';
import { KnowledgeItemSelector } from './elements/KnowledgeItemSelector';

interface ToolbarProps {
  onAddElement: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  zoom: number;
  projectId?: string;
  onBMCGenerated?: (bmcData: any) => void;
  onStoryGenerated?: (storyData: any) => void;
  onAddKnowledgeItem?: (itemId: string, itemData: any) => void;
  onAddCustomHexi?: () => void;
  existingKnowledgeItemIds?: string[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement,
  onZoomIn,
  onZoomOut,
  onExport,
  zoom,
  projectId,
  onBMCGenerated,
  onStoryGenerated,
  onAddKnowledgeItem,
  onAddCustomHexi,
  existingKnowledgeItemIds = [],
}) => {
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
        {/* Add Knowledge Item */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowKnowledgeSelector(true)}
          title="Add Knowledge Item"
        >
          <Hexagon className="h-4 w-4 mr-2" />
          Add Knowledge Item
        </Button>

        {/* Custom Hexi */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddCustomHexi?.()}
          title="Custom Hexi"
        >
          <Hexagon className="h-4 w-4 mr-2" />
          Custom Hexi
        </Button>

        {/* Sticky Note */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddElement('sticky')}
          title="Sticky Note"
        >
          <StickyNote className="h-4 w-4 mr-2" />
          Sticky Note
        </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Export */}
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <KnowledgeItemSelector
        isOpen={showKnowledgeSelector}
        onClose={() => setShowKnowledgeSelector(false)}
        onAdd={(itemId, itemData) => {
          onAddKnowledgeItem?.(itemId, itemData);
          setShowKnowledgeSelector(false);
        }}
        existingItemIds={existingKnowledgeItemIds}
      />
    </>
  );
};