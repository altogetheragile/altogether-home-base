import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn,
  ZoomOut,
  Download,
  Sparkles,
  StickyNote,
  FileText
} from 'lucide-react';
import BMCGeneratorDialog from '@/components/bmc/BMCGeneratorDialog';

interface AIToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  zoom: number;
  onBMCGenerated?: (bmcData: any) => void;
  onStoryGenerated?: (storyData: any) => void;
  onAddElement: (type: string) => void;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onExport,
  zoom,
  onBMCGenerated,
  onStoryGenerated,
  onAddElement,
}) => {
  const [showBMCGenerator, setShowBMCGenerator] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
        {/* Generate BMC */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowBMCGenerator(true)}
          title="Generate Business Model Canvas"
          className="text-bmc-orange-dark hover:bg-bmc-orange/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate BMC
        </Button>

        {/* Generate User Story - Placeholder for future implementation */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            // Future implementation
            console.log('User Story generation coming soon');
          }}
          title="Generate User Story (Coming Soon)"
          disabled
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Story
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Sticky Note */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddElement('sticky')}
          title="Add Sticky Note"
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
        <Button variant="ghost" size="sm" onClick={onExport} title="Export">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <BMCGeneratorDialog
        isOpen={showBMCGenerator}
        onClose={() => setShowBMCGenerator(false)}
        saveToCanvas={true}
        onBMCGenerated={onBMCGenerated}
      />
    </>
  );
};
