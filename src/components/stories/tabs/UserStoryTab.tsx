import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { UnifiedStoryData, UnifiedStoryMode } from '@/types/story';

interface UserStoryTabProps {
  data: UnifiedStoryData;
  onChange: (updates: Partial<UnifiedStoryData>) => void;
  mode: UnifiedStoryMode;
}

export function UserStoryTab({ data, onChange, mode }: UserStoryTabProps) {
  const addAcceptanceCriteria = () => {
    const current = data.acceptance_criteria || [];
    onChange({ acceptance_criteria: [...current, ''] });
  };

  const updateAcceptanceCriteria = (index: number, value: string) => {
    const current = [...(data.acceptance_criteria || [])];
    current[index] = value;
    onChange({ acceptance_criteria: current });
  };

  const removeAcceptanceCriteria = (index: number) => {
    const current = data.acceptance_criteria || [];
    onChange({ acceptance_criteria: current.filter((_, i) => i !== index) });
  };

  const autoResize = useCallback((element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={mode === 'epic' ? 'Enter epic title...' : 'As a [user], I want [goal]...'}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={mode === 'epic' 
            ? 'Describe the epic scope and business objective...' 
            : 'Describe the user story in detail...'}
          rows={3}
        />
      </div>

      {/* User Persona (story/backlog only) */}
      {mode !== 'epic' && (
        <div className="space-y-2">
          <Label htmlFor="user_persona">User Persona</Label>
          <Input
            id="user_persona"
            value={data.user_persona || ''}
            onChange={(e) => onChange({ user_persona: e.target.value })}
            placeholder="e.g., Product Manager, End User, Administrator"
          />
        </div>
      )}

      {/* Business Value */}
      <div className="space-y-2">
        <Label htmlFor="business_value">Business Value</Label>
        <Textarea
          id="business_value"
          value={data.business_value || ''}
          onChange={(e) => onChange({ business_value: e.target.value })}
          placeholder="Why is this valuable? What problem does it solve?"
          rows={2}
        />
      </div>

      {/* Acceptance Criteria (story/backlog only) */}
      {mode !== 'epic' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Acceptance Criteria</Label>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={addAcceptanceCriteria}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {(data.acceptance_criteria || []).map((criteria, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  ref={(el) => autoResize(el)}
                  value={criteria}
                  onChange={(e) => {
                    updateAcceptanceCriteria(index, e.target.value);
                    autoResize(e.target as HTMLTextAreaElement);
                  }}
                  placeholder="Given... When... Then..."
                  className="flex-1 resize-none overflow-hidden min-h-[60px]"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => removeAcceptanceCriteria(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!data.acceptance_criteria || data.acceptance_criteria.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No acceptance criteria added yet. Click "Add" to define success criteria.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
