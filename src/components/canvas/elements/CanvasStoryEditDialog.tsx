import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface StoryEditData {
  title?: string;
  story?: string;
  description?: string;
  acceptanceCriteria?: string[];
  priority?: string;
  storyPoints?: number;
}

interface CanvasStoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: StoryEditData;
  onSave: (data: StoryEditData) => void;
}

export const CanvasStoryEditDialog: React.FC<CanvasStoryEditDialogProps> = ({
  open,
  onOpenChange,
  data,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [priority, setPriority] = useState('medium');
  const [storyPoints, setStoryPoints] = useState(0);

  useEffect(() => {
    if (data && open) {
      setTitle(data.title || '');
      setStory(data.story || data.description || '');
      setAcceptanceCriteria(
        Array.isArray(data.acceptanceCriteria)
          ? data.acceptanceCriteria.join('\n')
          : ''
      );
      setPriority(data.priority || 'medium');
      setStoryPoints(data.storyPoints || 0);
    }
  }, [data, open]);

  const handleSave = () => {
    onSave({
      title,
      story,
      description: story,
      acceptanceCriteria: acceptanceCriteria
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean),
      priority,
      storyPoints,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Story</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="User story title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="story">Story / Description</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="As a user, I want to..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="acceptanceCriteria">
              Acceptance Criteria (one per line)
            </Label>
            <Textarea
              id="acceptanceCriteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="Given... When... Then..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min={0}
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
