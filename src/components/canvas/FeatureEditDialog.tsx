import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Puzzle, FileText } from 'lucide-react';

type ElementType = 'epic' | 'feature' | 'story';

interface FeatureData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  user_value?: string;
  storyNumber?: string;
}

interface FeatureEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: FeatureData;
  onSave: (data: FeatureData) => void;
  currentType?: ElementType;
  onChangeType?: (newType: ElementType) => void;
}

const defaultData: FeatureData = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'New',
  user_value: '',
  storyNumber: '',
};

export function FeatureEditDialog({ open, onOpenChange, data, onSave, currentType = 'feature', onChangeType }: FeatureEditDialogProps) {
  const [formData, setFormData] = useState<FeatureData>({ ...defaultData, ...data });

  useEffect(() => {
    if (open) {
      setFormData({ ...defaultData, ...data });
    }
  }, [open, data]);

  const handleSave = () => {
    if (!formData.title?.trim()) return;
    onSave({
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
    });
  };

  const isValid = formData.title?.trim();

  const typeOptions: { value: ElementType; label: string; icon: React.ReactNode }[] = [
    { value: 'epic', label: 'Epic', icon: <Layers className="h-4 w-4" /> },
    { value: 'feature', label: 'Feature', icon: <Puzzle className="h-4 w-4" /> },
    { value: 'story', label: 'Story', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.title ? 'Edit Feature' : 'New Feature'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selector */}
          {onChangeType && (
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={currentType}
                onValueChange={(value) => onChangeType(value as ElementType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(({ value, label, icon }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        {icon}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Story Number */}
          <div className="space-y-2">
            <Label htmlFor="storyNumber">Story Number</Label>
            <Input
              id="storyNumber"
              value={formData.storyNumber || ''}
              onChange={(e) => setFormData({ ...formData, storyNumber: e.target.value })}
              placeholder="e.g., 1.1"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Hierarchical number (e.g., 1.0 for epic, 1.1 for feature, 1.1.1 for story)
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter feature title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the feature and its purpose..."
              rows={3}
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'New'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Value */}
          <div className="space-y-2">
            <Label htmlFor="user_value">User Value</Label>
            <Textarea
              id="user_value"
              value={formData.user_value || ''}
              onChange={(e) => setFormData({ ...formData, user_value: e.target.value })}
              placeholder="What value does this feature provide to users?"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
