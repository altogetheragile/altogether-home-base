import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations, type UserStory, type Epic } from '@/hooks/useUserStories';

interface StoryEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  story: UserStory | Epic | null;
  type: 'story' | 'epic';
}

type StoryStatus = 'draft' | 'ready' | 'in_progress' | 'testing' | 'done';
type EpicStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export function StoryEditDialog({ isOpen, onClose, story, type }: StoryEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StoryStatus | EpicStatus>('draft');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [storyPoints, setStoryPoints] = useState<number | undefined>();
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
  const [theme, setTheme] = useState('');

  const { toast } = useToast();
  const { updateStory, updateEpic } = useStoryMutations();

  useEffect(() => {
    if (story && isOpen) {
      setTitle(story.title);
      setDescription(story.description || '');
      setStatus(story.status);
      
      if (type === 'story' && 'priority' in story) {
        setPriority(story.priority);
        setStoryPoints(story.story_points);
        setAcceptanceCriteria(story.acceptance_criteria || []);
      }
      
      if (type === 'epic' && 'theme' in story) {
        setTheme(story.theme || '');
      }
    }
  }, [story, isOpen, type]);

  const handleSave = async () => {
    if (!story || !title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (type === 'epic') {
        await updateEpic.mutateAsync({
          id: story.id,
          title,
          description,
          status: status as EpicStatus,
          theme,
        });
      } else {
        await updateStory.mutateAsync({
          id: story.id,
          title,
          description,
          status: status as StoryStatus,
          priority,
          story_points: storyPoints,
          acceptance_criteria: acceptanceCriteria.filter(criteria => criteria.trim()),
        });
      }

      toast({
        title: "Success!",
        description: `${type === 'epic' ? 'Epic' : 'Story'} updated successfully.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating:', error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addAcceptanceCriteria = () => {
    setAcceptanceCriteria([...acceptanceCriteria, '']);
  };

  const updateAcceptanceCriteria = (index: number, value: string) => {
    const updated = [...acceptanceCriteria];
    updated[index] = value;
    setAcceptanceCriteria(updated);
  };

  const removeAcceptanceCriteria = (index: number) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type === 'epic' ? 'Epic' : 'User Story'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'story' ? (
                    <>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {type === 'story' && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === 'epic' && (
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Enter theme..."
                />
              </div>
            )}

            {type === 'story' && (
              <div className="space-y-2">
                <Label htmlFor="storyPoints">Story Points</Label>
                <Select 
                  value={storyPoints?.toString() || 'none'} 
                  onValueChange={(value) => setStoryPoints(value === 'none' ? undefined : parseInt(value))}
                >
                  <SelectTrigger id="storyPoints">
                    <SelectValue placeholder="Select points" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="13">13</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {type === 'story' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Acceptance Criteria</Label>
                <Button size="sm" variant="outline" onClick={addAcceptanceCriteria}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {acceptanceCriteria.map((criteria, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={criteria}
                      onChange={(e) => updateAcceptanceCriteria(index, e.target.value)}
                      placeholder="Given... When... Then..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAcceptanceCriteria(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {acceptanceCriteria.length === 0 && (
                  <p className="text-sm text-muted-foreground">No acceptance criteria added yet.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateStory.isPending || updateEpic.isPending}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}