import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { 
  UnifiedStoryData, 
  UnifiedStoryMode, 
  BACKLOG_STATUSES, 
  STORY_STATUSES, 
  EPIC_STATUSES, 
  SOURCES 
} from '@/types/story';

interface TrackingTabProps {
  data: UnifiedStoryData;
  onChange: (updates: Partial<UnifiedStoryData>) => void;
  mode: UnifiedStoryMode;
}

export function TrackingTab({ data, onChange, mode }: TrackingTabProps) {
  const statuses = mode === 'epic' 
    ? EPIC_STATUSES 
    : mode === 'backlog' 
      ? BACKLOG_STATUSES 
      : STORY_STATUSES;

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      if (value) {
        const currentTags = data.tags || [];
        if (!currentTags.includes(value)) {
          onChange({ tags: [...currentTags, value] });
        }
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = data.tags || [];
    onChange({ tags: currentTags.filter(tag => tag !== tagToRemove) });
  };

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={data.status || (mode === 'backlog' ? 'idea' : 'draft')}
          onValueChange={(value) => onChange({ status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source (backlog/story only) */}
      {mode !== 'epic' && (
        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={data.source || 'enhancement'}
            onValueChange={(value) => onChange({ source: value })}
          >
            <SelectTrigger>
              <SelectValue />
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
      )}

      {/* Sprint & Target Release */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sprint">Sprint</Label>
          <Input
            id="sprint"
            value={data.sprint || ''}
            onChange={(e) => onChange({ sprint: e.target.value || null })}
            placeholder="e.g., Sprint 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_release">Target Release</Label>
          <Input
            id="target_release"
            value={data.target_release || ''}
            onChange={(e) => onChange({ target_release: e.target.value || null })}
            placeholder="e.g., v1.2.0"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Type and press Enter to add tags..."
          onKeyDown={handleTagInput}
        />
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add a tag. Click a tag to remove it.
        </p>
      </div>

      {/* Epic Link (story/backlog only) */}
      {mode !== 'epic' && data.epic_id && (
        <div className="space-y-2">
          <Label>Linked Epic</Label>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm font-mono text-muted-foreground">
              {data.epic_id}
            </p>
          </div>
        </div>
      )}

      {/* User Story Link (backlog only) */}
      {mode === 'backlog' && data.user_story_id && (
        <div className="space-y-2">
          <Label>Linked User Story</Label>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-sm font-mono text-muted-foreground">
              {data.user_story_id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
