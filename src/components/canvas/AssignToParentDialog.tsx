import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Puzzle, FolderInput } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CanvasElement {
  id: string;
  type: 'bmc' | 'story' | 'sticky' | 'epic' | 'feature';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
}

interface AssignToParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  onAssign: (parentId: string, parentType: 'epic' | 'feature', renumberChildren: boolean) => void;
}

export const AssignToParentDialog: React.FC<AssignToParentDialogProps> = ({
  open,
  onOpenChange,
  selectedElements,
  allElements,
  onAssign,
}) => {
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [renumberChildren, setRenumberChildren] = useState<boolean>(true);

  // Determine what types of parents are valid based on selection
  const selectedTypes = useMemo(() => {
    const types = new Set(selectedElements.map(el => el.type));
    return types;
  }, [selectedElements]);

  // Get valid parent options
  const parentOptions = useMemo(() => {
    const selectedIds = new Set(selectedElements.map(el => el.id));
    
    // Stories can be assigned to Features or Epics
    // Features can be assigned to Epics only
    // Epics cannot be assigned to anything
    
    const hasStories = selectedTypes.has('story');
    const hasFeatures = selectedTypes.has('feature');
    const hasEpics = selectedTypes.has('epic');
    
    // If epics are selected, can't assign to any parent
    if (hasEpics) {
      return [];
    }
    
    const options: { id: string; type: 'epic' | 'feature'; number: string; title: string }[] = [];
    
    // Add epics as options (for both stories and features)
    allElements
      .filter(el => el.type === 'epic' && !selectedIds.has(el.id))
      .forEach(el => {
        options.push({
          id: el.id,
          type: 'epic',
          number: el.content?.storyNumber || '',
          title: el.content?.title || 'Untitled Epic',
        });
      });
    
    // Add features as options only if selection contains only stories
    if (hasStories && !hasFeatures) {
      allElements
        .filter(el => el.type === 'feature' && !selectedIds.has(el.id))
        .forEach(el => {
          options.push({
            id: el.id,
            type: 'feature',
            number: el.content?.storyNumber || '',
            title: el.content?.title || 'Untitled Feature',
          });
        });
    }
    
    // Sort by number
    options.sort((a, b) => {
      const numA = a.number || '999';
      const numB = b.number || '999';
      return numA.localeCompare(numB, undefined, { numeric: true });
    });
    
    return options;
  }, [allElements, selectedElements, selectedTypes]);

  const selectedParent = parentOptions.find(p => p.id === selectedParentId);

  const handleAssign = () => {
    if (selectedParent) {
      onAssign(selectedParent.id, selectedParent.type, renumberChildren);
      setSelectedParentId('');
      setRenumberChildren(true);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedParentId('');
      setRenumberChildren(true);
    }
    onOpenChange(newOpen);
  };

  // Count by type
  const storyCount = selectedElements.filter(el => el.type === 'story').length;
  const featureCount = selectedElements.filter(el => el.type === 'feature').length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="h-5 w-5" />
            Assign to Parent
          </DialogTitle>
          <DialogDescription>
            Select a parent Epic or Feature for the selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show what's being assigned */}
          <div className="text-sm text-muted-foreground">
            Assigning:{' '}
            {storyCount > 0 && (
              <Badge variant="secondary" className="mr-1">
                {storyCount} {storyCount === 1 ? 'Story' : 'Stories'}
              </Badge>
            )}
            {featureCount > 0 && (
              <Badge variant="secondary">
                {featureCount} {featureCount === 1 ? 'Feature' : 'Features'}
              </Badge>
            )}
          </div>

          {/* Renumber checkbox */}
          <div className="flex items-center space-x-2 pb-2 border-b border-border">
            <Checkbox
              id="renumber-children"
              checked={renumberChildren}
              onCheckedChange={(checked) => setRenumberChildren(checked === true)}
            />
            <Label
              htmlFor="renumber-children"
              className="text-sm cursor-pointer"
            >
              Renumber all children (start from .1)
            </Label>
          </div>

          {parentOptions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No valid parents available.</p>
              <p className="text-xs mt-1">
                {selectedTypes.has('epic') 
                  ? 'Epics cannot be assigned to a parent.'
                  : 'Add an Epic or Feature to the canvas first.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <RadioGroup
                value={selectedParentId}
                onValueChange={setSelectedParentId}
                className="space-y-2"
              >
                {parentOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedParentId(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer flex items-center gap-2"
                    >
                      {option.type === 'epic' ? (
                        <Layers className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Puzzle className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        {option.number}
                      </span>
                      <span className="truncate">{option.title}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedParentId}
          >
            {selectedParent 
              ? `Assign to ${selectedParent.number}`
              : 'Select a Parent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
