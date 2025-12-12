import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemType, getChildItemTypes, ITEM_TYPES } from '@/types/story';
import { LocalBacklogItem, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { StoryTypeBadge } from './StoryTypeSelector';
import { Layers, Puzzle, FileText, Plus } from 'lucide-react';

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent: LocalBacklogItem;
  onAddChild: (item: LocalBacklogItemInput) => void;
}

const iconMap = {
  Layers: Layers,
  Puzzle: Puzzle,
  FileText: FileText,
};

export const AddChildDialog: React.FC<AddChildDialogProps> = ({
  open,
  onOpenChange,
  parent,
  onAddChild,
}) => {
  const allowedTypes = getChildItemTypes(parent.item_type);
  const [childType, setChildType] = useState<ItemType>(allowedTypes[0] || 'story');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddChild({
      title: title.trim(),
      description: description.trim() || null,
      acceptance_criteria: null,
      priority: parent.priority, // Inherit parent priority
      source: parent.source,
      status: 'idea',
      estimated_value: null,
      estimated_effort: null,
      tags: parent.tags, // Inherit tags
      target_release: parent.target_release,
      item_type: childType,
      parent_item_id: parent.id,
    });

    setTitle('');
    setDescription('');
    setChildType(allowedTypes[0] || 'story');
    onOpenChange(false);
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  if (allowedTypes.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Child to {parent.item_type}
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2 mt-1">
              Parent: <StoryTypeBadge type={parent.item_type} /> 
              <span className="truncate">{parent.title}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {allowedTypes.length > 1 && (
            <div className="space-y-2">
              <Label>Child Type</Label>
              <Select value={childType} onValueChange={(v) => setChildType(v as ItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((type) => {
                    const config = ITEM_TYPES.find(t => t.value === type);
                    const Icon = config ? iconMap[config.icon as keyof typeof iconMap] : FileText;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{config?.label || type}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="child-title">Title *</Label>
            <Input
              id="child-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${childType} title`}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-description">Description</Label>
            <Textarea
              id="child-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add {ITEM_TYPES.find(t => t.value === childType)?.label || childType}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
