import React from 'react';
import { cn } from '@/lib/utils';

interface FormattedTextDisplayProps {
  content: string;
  placeholder?: string;
  className?: string;
  sectionType?: 'partners' | 'activities' | 'resources' | 'value' | 'relationships' | 'channels' | 'segments' | 'costs' | 'revenue';
}

const FormattedTextDisplay: React.FC<FormattedTextDisplayProps> = ({
  content,
  placeholder,
  className,
  sectionType
}) => {
  if (!content || content.trim() === '') {
    return (
      <div className={cn('text-muted-foreground/60 italic text-xs', className)}>
        {placeholder}
      </div>
    );
  }

  // Parse content to identify bullet points
  const parseContent = (text: string) => {
    // Split by bullet points or periods, then clean up
    const lines = text
      .split(/[•·‣▪▫]/) // Split on various bullet symbols
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // If no bullet points found, split by periods and create bullet points
    if (lines.length <= 1) {
      return text
        .split(/\.(?=\s[A-Z])/) // Split on periods followed by space and capital letter
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.endsWith('.') ? line : line + '.');
    }

    return lines.map(line => line.endsWith('.') ? line : line + '.');
  };

  const parsedLines = parseContent(content);
  
  // Section-specific styling
  const getSectionStyles = (type?: string) => {
    switch (type) {
      case 'partners':
        return 'border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20';
      case 'activities':
      case 'resources':
        return 'border-l-4 border-l-green-400 bg-green-50/50 dark:bg-green-950/20';
      case 'value':
        return 'border-l-4 border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20';
      case 'relationships':
      case 'channels':
        return 'border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20';
      case 'segments':
        return 'border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20';
      case 'costs':
        return 'border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-purple-950/20';
      case 'revenue':
        return 'border-l-4 border-l-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20';
      default:
        return 'border-l-4 border-l-gray-300 bg-gray-50/50 dark:bg-gray-950/20';
    }
  };

  const getBulletColor = (type?: string) => {
    switch (type) {
      case 'partners': return 'text-blue-500';
      case 'activities':
      case 'resources': return 'text-green-500';
      case 'value': return 'text-yellow-600';
      case 'relationships':
      case 'channels': return 'text-orange-500';
      case 'segments': return 'text-red-500';
      case 'costs': return 'text-purple-500';
      case 'revenue': return 'text-indigo-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn(
      'rounded-lg p-3 space-y-2 transition-all duration-200',
      getSectionStyles(sectionType),
      className
    )}>
      {parsedLines.map((line, index) => (
        <div key={index} className="flex items-start gap-2 text-xs leading-relaxed">
          <span className={cn('mt-1 font-bold text-sm flex-shrink-0', getBulletColor(sectionType))}>
            •
          </span>
          <span className="text-foreground/90 flex-1">
            {line}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FormattedTextDisplay;