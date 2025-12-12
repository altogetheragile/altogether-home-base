import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';
import { ItemType } from '@/types/story';
import { StoryTypeBadge } from './StoryTypeSelector';

interface ParentSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  potentialParents: LocalBacklogItem[];
  childType: ItemType;
  disabled?: boolean;
  className?: string;
}

export const ParentSelector: React.FC<ParentSelectorProps> = ({
  value,
  onChange,
  potentialParents,
  childType,
  disabled,
  className,
}) => {
  if (childType === 'epic') {
    return null; // Epics can't have parents
  }

  const filteredParents = potentialParents.filter(p => {
    if (childType === 'feature') return p.item_type === 'epic';
    if (childType === 'story') return p.item_type === 'epic' || p.item_type === 'feature';
    return false;
  });

  if (filteredParents.length === 0) {
    return null;
  }

  return (
    <Select 
      value={value || 'none'} 
      onValueChange={(v) => onChange(v === 'none' ? null : v)} 
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select parent (optional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No parent</span>
        </SelectItem>
        {filteredParents.map((parent) => (
          <SelectItem key={parent.id} value={parent.id}>
            <div className="flex items-center gap-2">
              <StoryTypeBadge type={parent.item_type} className="scale-90" />
              <span className="truncate max-w-[200px]">{parent.title}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
