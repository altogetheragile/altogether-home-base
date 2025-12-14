import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn,
  ZoomOut,
  Download,
  StickyNote,
  FileText,
  Undo2,
  Redo2,
  Loader2,
  Check,
  AlertCircle,
  FolderInput,
} from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AIToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  zoom: number;
  onStoryGenerated?: (storyData: any) => void;
  onAddElement: (type: string) => void;
  // Undo/Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // Save status
  saveStatus?: SaveStatus;
  // Selection info
  selectedCount?: number;
  // Assign to parent
  onAssignToParent?: () => void;
  canAssignToParent?: boolean;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onExport,
  zoom,
  onStoryGenerated,
  onAddElement,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  saveStatus = 'idle',
  selectedCount = 0,
  onAssignToParent,
  canAssignToParent = false,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
      {/* Undo/Redo */}
      {onUndo && onRedo && (
        <>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Add Elements */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddElement('epic')}
        title="Add Epic"
      >
        <FileText className="h-4 w-4 mr-2 text-purple-500" />
        Epic
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddElement('feature')}
        title="Add Feature"
      >
        <FileText className="h-4 w-4 mr-2 text-blue-500" />
        Feature
      </Button>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onAddElement('story')}
        title="Add User Story"
      >
        <FileText className="h-4 w-4 mr-2 text-green-500" />
        Story
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
        Note
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

      {/* Selection count and assign button */}
      {selectedCount > 1 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          {onAssignToParent && canAssignToParent && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAssignToParent}
              title="Assign selected items to a parent Epic or Feature"
            >
              <FolderInput className="h-4 w-4 mr-2" />
              Assign to Parent
            </Button>
          )}
        </>
      )}

      {/* Save status indicator */}
      {saveStatus !== 'idle' && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <span>Save failed</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
