import React from 'react';
import { Badge } from '@/components/ui/badge';
import TemplateIcon from './TemplateIcon';
import { EventTemplate } from '@/types/template';

interface TemplateBadgeProps {
  template: EventTemplate;
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  className?: string;
}

const TemplateBadge = ({ 
  template, 
  variant = 'outline', 
  showIcon = true, 
  className = '' 
}: TemplateBadgeProps) => {
  const brandColor = template.brand_color || '#3B82F6';
  
  return (
    <Badge 
      variant={variant}
      className={`inline-flex items-center gap-1.5 ${className}`}
      style={{
        borderColor: variant === 'outline' ? brandColor : undefined,
        backgroundColor: variant === 'default' ? `${brandColor}20` : undefined,
        color: variant === 'outline' ? brandColor : undefined,
      }}
    >
      {showIcon && (
        <TemplateIcon 
          iconName={template.icon_name} 
          size={14}
          className="text-current"
        />
      )}
      {template.title}
    </Badge>
  );
};

export default TemplateBadge;