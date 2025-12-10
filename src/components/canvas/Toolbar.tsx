import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn,
  ZoomOut,
  Download,
  Hexagon,
  Layers,
  Save,
  Link2,
  Undo2,
  Redo2,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { KnowledgeItemSelector } from './elements/KnowledgeItemSelector';
import { PlanningFocusSelector } from './elements/PlanningFocusSelector';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
  onAddPlanningFocus?: (focusId: string, focusData: any) => void;
  onAddArtifactLink?: () => void;
  existingKnowledgeItemIds?: string[];
  artifactId?: string;
  onSaveChanges?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  saveStatus?: SaveStatus;
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
  onAddPlanningFocus,
  onAddArtifactLink,
  existingKnowledgeItemIds = [],
  artifactId,
  onSaveChanges,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  saveStatus = 'idle',
}) => {
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [showPlanningFocusSelector, setShowPlanningFocusSelector] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm overflow-x-auto max-w-full">
        {/* Add Knowledge Item */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowKnowledgeSelector(true)}
          title="Add Knowledge Item"
          className="flex-shrink-0"
        >
          <Hexagon className="h-4 w-4 mr-2" />
          Add Knowledge Item
        </Button>

        {/* Planning Focus Hexi */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowPlanningFocusSelector(true)}
          title="Planning Focus Hexi"
          className="flex-shrink-0"
        >
          <Layers className="h-4 w-4 mr-2" />
          Planning Focus
        </Button>

        {/* Custom Hexi */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddCustomHexi?.()}
          title="Custom Hexi"
          className="flex-shrink-0"
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
          className="flex-shrink-0"
        >
          <Hexagon className="h-4 w-4 mr-2" />
          Sticky Note
        </Button>

        {/* Artifact Link */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onAddArtifactLink?.()}
          title="Add Artifact Link"
          className="flex-shrink-0"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Artifact Link
        </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
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
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
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

      {/* Save Status Indicator */}
      {artifactId && (
        <div className="flex items-center gap-1 min-w-[80px]">
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Failed
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {artifactId ? (
        <>
          <Button size="sm" onClick={onSaveChanges} title="Save Changes">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} title="Export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="sm" onClick={onExport} title="Export">
          <Download className="h-4 w-4" />
        </Button>
      )}
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

      <PlanningFocusSelector
        isOpen={showPlanningFocusSelector}
        onClose={() => setShowPlanningFocusSelector(false)}
        onAdd={(focusId, focusData) => {
          onAddPlanningFocus?.(focusId, focusData);
          setShowPlanningFocusSelector(false);
        }}
      />
    </>
  );
};