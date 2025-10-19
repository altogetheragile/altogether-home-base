import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn,
  ZoomOut,
  Download,
  StickyNote,
  FileText
} from 'lucide-react';

interface AIToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  zoom: number;
  onStoryGenerated?: (storyData: any) => void;
  onAddElement: (type: string) => void;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onExport,
  zoom,
  onStoryGenerated,
  onAddElement,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
      {/* Generate User Story */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddElement('story')}
        title="Generate User Story"
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
  );
};
