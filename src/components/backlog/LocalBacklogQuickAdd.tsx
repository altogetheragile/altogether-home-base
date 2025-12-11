import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';
import { LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { Label } from '@/components/ui/label';

interface LocalBacklogQuickAddProps {
  onAddItem: (item: LocalBacklogItemInput) => void;
}

const SOURCES = [
  { value: 'user_feedback', label: 'User Feedback' },
  { value: 'development', label: 'Development' },
  { value: 'bug_fix', label: 'Bug Fix' },
  { value: 'enhancement', label: 'Enhancement' },
  { value: 'ai_suggestion', label: 'AI Suggestion' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const LocalBacklogQuickAdd: React.FC<LocalBacklogQuickAddProps> = ({ onAddItem }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [source, setSource] = useState('enhancement');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState('');
  const [targetRelease, setTargetRelease] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddItem({
      title: title.trim(),
      description: description.trim() || null,
      acceptance_criteria: null,
      priority,
      source,
      status: 'idea',
      estimated_value: estimatedValue ? Number(estimatedValue) : null,
      estimated_effort: estimatedEffort ? Number(estimatedEffort) : null,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      target_release: targetRelease.trim() || null,
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setSource('enhancement');
    setEstimatedValue('');
    setEstimatedEffort('');
    setTargetRelease('');
    setTags('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        className="w-full border-dashed border-2 h-12 hover:border-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add backlog item
      </Button>
    );
  }

  return (
    <Card className="border-primary/50">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRelease">Target Release</Label>
              <Input
                id="targetRelease"
                placeholder="e.g., v1.0, Sprint 5"
                value={targetRelease}
                onChange={(e) => setTargetRelease(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                placeholder="Business value"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedEffort">Estimated Effort</Label>
              <Input
                id="estimatedEffort"
                type="number"
                placeholder="Story points"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated tags (e.g., frontend, urgent)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
