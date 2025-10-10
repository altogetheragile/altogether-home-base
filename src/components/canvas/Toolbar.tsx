import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Building2, 
  FileText, 
  StickyNote,
  ZoomIn,
  ZoomOut,
  Download,
  Sparkles,
  Hexagon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BMCGeneratorDialog from '@/components/bmc/BMCGeneratorDialog';
import { UserStoryClarifierDialog } from '@/components/stories/UserStoryClarifierDialog';
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
  const [showBMCDialog, setShowBMCDialog] = useState(false);
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
        {/* AI Tools */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBMCDialog(true)}
            className="border-bmc-orange/30 hover:bg-bmc-orange/10 text-bmc-orange-dark"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI BMC Generator
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowStoryDialog(true)}
            className="border-primary/30 hover:bg-primary/10 text-primary"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Story Generator
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Manual Add Elements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Manual Elements
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAddElement('story')}>
              <FileText className="h-4 w-4 mr-2" />
              Blank User Story
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddElement('sticky')}>
              <StickyNote className="h-4 w-4 mr-2" />
              Sticky Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Hexagon Elements */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowKnowledgeSelector(true)}
            title="Add Knowledge Technique"
          >
            <Hexagon className="h-4 w-4 mr-2" />
            Add Technique
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onAddCustomHexi?.()}
            title="Add Custom Hexagon"
          >
            <Plus className="h-4 w-4 mr-2" />
            Custom Hexi
          </Button>
        </div>

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

      {/* AI Dialog Components */}
      <BMCGeneratorDialog 
        isOpen={showBMCDialog}
        onClose={() => setShowBMCDialog(false)}
        projectId={projectId}
        saveToCanvas={true}
        onBMCGenerated={onBMCGenerated}
      />

      <UserStoryClarifierDialog
          isOpen={showStoryDialog}
          onClose={() => setShowStoryDialog(false)}
          projectId={projectId}
          onStoryGenerated={onStoryGenerated}
        />

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