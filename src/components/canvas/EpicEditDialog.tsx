import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EpicData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  theme?: string;
  storyNumber?: string;
}

interface EpicEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: EpicData;
  onSave: (data: EpicData) => void;
}

const defaultData: EpicData = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'New',
  theme: '',
  storyNumber: '',
};

export function EpicEditDialog({ open, onOpenChange, data, onSave }: EpicEditDialogProps) {
  const [formData, setFormData] = useState<EpicData>({ ...defaultData, ...data });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data?.title ? 'Edit Epic' : 'New Epic'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Story Number */}
          <div className="space-y-2">
            <Label htmlFor="storyNumber">Story Number</Label>
            <Input
              id="storyNumber"
              value={formData.storyNumber || ''}
              onChange={(e) => setFormData({ ...formData, storyNumber: e.target.value })}
              placeholder="e.g., 1.0"
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
              placeholder="Enter epic title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the epic scope and objectives..."
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

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Input
              id="theme"
              value={formData.theme || ''}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g., User Experience, Security, Performance"
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
