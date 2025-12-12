import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Layers, Puzzle, FileText } from 'lucide-react';
import { ItemType, ITEM_TYPES } from '@/types/story';
import { cn } from '@/lib/utils';

interface StoryTypeSelectorProps {
  value: ItemType;
  onChange: (value: ItemType) => void;
  disabled?: boolean;
  className?: string;
}

const iconMap = {
  Layers: Layers,
  Puzzle: Puzzle,
  FileText: FileText,
};

export const StoryTypeSelector: React.FC<StoryTypeSelectorProps> = ({
  value,
  onChange,
  disabled,
  className,
}) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ItemType)} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {ITEM_TYPES.map((type) => {
          const Icon = iconMap[type.icon as keyof typeof iconMap];
          return (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{type.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export const StoryTypeBadge: React.FC<{ type: ItemType; className?: string }> = ({ type, className }) => {
  const typeConfig = ITEM_TYPES.find(t => t.value === type);
  const Icon = typeConfig ? iconMap[typeConfig.icon as keyof typeof iconMap] : FileText;
  
  return (
    <Badge className={cn("text-xs", typeConfig?.color, className)}>
      <Icon className="h-3 w-3 mr-1" />
      {typeConfig?.label || type}
    </Badge>
  );
};
