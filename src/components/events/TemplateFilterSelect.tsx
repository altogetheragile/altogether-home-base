import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateIcon from './TemplateIcon';

interface TemplateFilterSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const TemplateFilterSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "All Templates" 
}: TemplateFilterSelectProps) => {
  const { data: templates = [], isLoading } = useTemplates();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading templates..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Templates</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <TemplateIcon 
                iconName={template.icon_name} 
                size={16}
                className="text-muted-foreground"
              />
              <span>{template.title}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TemplateFilterSelect;