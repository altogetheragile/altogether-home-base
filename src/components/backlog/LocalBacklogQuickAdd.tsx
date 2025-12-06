import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';
import { LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddItem({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      source,
      status: 'idea',
      estimated_value: null,
      estimated_effort: null,
      tags: null,
      target_release: null,
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setSource('enhancement');
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="font-medium"
          />
          
          <Textarea
            placeholder="Add more details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          
          <div className="flex gap-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[130px]">
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
            
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[160px]">
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
          
          <div className="flex justify-end gap-2">
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
