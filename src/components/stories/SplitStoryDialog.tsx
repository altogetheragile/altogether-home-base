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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Scissors, GitBranch, AlertCircle } from 'lucide-react';
import { UserStory } from '@/hooks/useUserStories';
import { BacklogItem } from '@/hooks/useBacklogItems';

interface SplitStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  story?: UserStory | null;
  backlogItem?: BacklogItem | null;
  onSplit: (config: SplitConfig) => Promise<void>;
  isLoading?: boolean;
}

export interface SplitConfig {
  parentId: string;
  selectedCriteria: number[];
  childStories: ChildStoryConfig[];
  removeFromParent: boolean;
  inheritPriority: boolean;
}

interface ChildStoryConfig {
  criteriaIndex: number;
  title: string;
  enabled: boolean;
}

// Generate a title from acceptance criteria text
function generateTitleFromCriteria(criteria: string): string {
  // Remove common prefixes like "Given", "When", "Then", bullet points, numbers
  let title = criteria
    .replace(/^[\s•\-\d.]+/, '')
    .replace(/^(Given|When|Then|And|But)\s+/i, '')
    .trim();
  
  // Truncate if too long
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  return title || criteria.substring(0, 80);
}

export function SplitStoryDialog({
  open,
  onOpenChange,
  story,
  backlogItem,
  onSplit,
  isLoading = false,
}: SplitStoryDialogProps) {
  const [removeFromParent, setRemoveFromParent] = useState(false);
  const [inheritPriority, setInheritPriority] = useState(true);
  const [childStories, setChildStories] = useState<ChildStoryConfig[]>([]);

  // Get the item being split (story or backlog item)
  const item = story || backlogItem;
  const acceptanceCriteria = item?.acceptance_criteria || [];
  const parentTitle = item?.title || '';
  const parentId = item?.id || '';

  // Initialize child stories when dialog opens with new item
  React.useEffect(() => {
    if (open && acceptanceCriteria.length > 0) {
      setChildStories(
        acceptanceCriteria.map((criteria, index) => ({
          criteriaIndex: index,
          title: generateTitleFromCriteria(criteria),
          enabled: false,
        }))
      );
    }
  }, [open, parentId]);

  const selectedCount = childStories.filter(c => c.enabled).length;
  const canSplit = selectedCount > 0;

  const handleToggleCriteria = (index: number) => {
    setChildStories(prev =>
      prev.map((c, i) =>
        i === index ? { ...c, enabled: !c.enabled } : c
      )
    );
  };

  const handleTitleChange = (index: number, title: string) => {
    setChildStories(prev =>
      prev.map((c, i) =>
        i === index ? { ...c, title } : c
      )
    );
  };

  const handleSelectAll = () => {
    setChildStories(prev => prev.map(c => ({ ...c, enabled: true })));
  };

  const handleSelectNone = () => {
    setChildStories(prev => prev.map(c => ({ ...c, enabled: false })));
  };

  const handleSplit = async () => {
    if (!canSplit || !parentId) return;

    const config: SplitConfig = {
      parentId,
      selectedCriteria: childStories
        .filter(c => c.enabled)
        .map(c => c.criteriaIndex),
      childStories: childStories.filter(c => c.enabled),
      removeFromParent,
      inheritPriority,
    };

    await onSplit(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Split Story by Acceptance Criteria
          </DialogTitle>
          <DialogDescription>
            Create child stories from acceptance criteria. Child stories will be linked to the parent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Parent Story Info */}
          <div className="p-3 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Parent Story</span>
            </div>
            <p className="text-sm font-medium">{parentTitle}</p>
          </div>

          {acceptanceCriteria.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>This story has no acceptance criteria to split.</span>
            </div>
          ) : (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  Select criteria to split into child stories
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSelectNone}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Criteria List */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {acceptanceCriteria.map((criteria, index) => {
                    const childConfig = childStories[index];
                    const isEnabled = childConfig?.enabled || false;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          isEnabled 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isEnabled}
                            onCheckedChange={() => handleToggleCriteria(index)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {criteria}
                            </p>
                            {isEnabled && (
                              <div className="space-y-1">
                                <Label className="text-xs">Child Story Title</Label>
                                <Input
                                  value={childConfig?.title || ''}
                                  onChange={(e) => handleTitleChange(index, e.target.value)}
                                  placeholder="Enter story title"
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Options */}
              <div className="mt-4 space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inherit Priority</Label>
                    <p className="text-xs text-muted-foreground">
                      Child stories will have the same priority as parent
                    </p>
                  </div>
                  <Switch
                    checked={inheritPriority}
                    onCheckedChange={setInheritPriority}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Remove from Parent</Label>
                    <p className="text-xs text-muted-foreground">
                      Remove split criteria from the parent story
                    </p>
                  </div>
                  <Switch
                    checked={removeFromParent}
                    onCheckedChange={setRemoveFromParent}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Badge variant="secondary" className="mr-auto">
            {selectedCount} {selectedCount === 1 ? 'story' : 'stories'} to create
          </Badge>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSplit} 
            disabled={!canSplit || isLoading}
          >
            {isLoading ? 'Splitting...' : `Split into ${selectedCount} Stories`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
