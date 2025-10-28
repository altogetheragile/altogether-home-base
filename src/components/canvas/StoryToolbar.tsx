import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn,
  ZoomOut,
  Download,
  Sparkles,
  Plus,
  Layers,
  FileText,
  Target,
  CheckSquare,
  Maximize2,
} from 'lucide-react';

interface StoryToolbarProps {
  onAddStory: (level: 'epic' | 'feature' | 'story' | 'task') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShowAll: () => void;
  onExport: () => void;
  onGenerateAI: () => void;
  zoom: number;
}

export const StoryToolbar: React.FC<StoryToolbarProps> = ({
  onAddStory,
  onZoomIn,
  onZoomOut,
  onShowAll,
  onExport,
  onGenerateAI,
  zoom,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm flex-wrap">
      {/* AI Generation */}
      <Button 
        variant="default" 
        size="sm"
        onClick={onGenerateAI}
        title="Generate with AI"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate with AI
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Add Elements */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddStory('epic')}
        title="Add Epic"
      >
        <Layers className="h-4 w-4 mr-2" />
        Epic
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddStory('feature')}
        title="Add Feature"
      >
        <Target className="h-4 w-4 mr-2" />
        Feature
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddStory('story')}
        title="Add Story"
      >
        <FileText className="h-4 w-4 mr-2" />
        Story
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddStory('task')}
        title="Add Task"
      >
        <CheckSquare className="h-4 w-4 mr-2" />
        Task
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
        <Button variant="ghost" size="sm" onClick={onShowAll} title="Show All Elements">
          <Maximize2 className="h-4 w-4" />
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
