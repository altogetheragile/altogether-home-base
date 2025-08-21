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
    console.log('FormattedTextDisplay parsing content:', text);
    
    // Check if content is already properly formatted with bullets and newlines
    const hasBulletsAndNewlines = text.includes('•') && text.includes('\n');
    
    if (hasBulletsAndNewlines) {
      console.log('Content already has proper bullet formatting, preserving as-is');
      // Content is already properly formatted, just split by newlines and clean up
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      return lines.map(line => {
        // If line already has a bullet, keep it as-is
        if (line.startsWith('•')) {
          return line.substring(1).trim(); // Remove bullet, we'll add it back in display
        }
        return line;
      });
    }
    
    // Legacy parsing for unformatted content
    console.log('Content needs formatting, applying parsing logic');
    let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // If no newlines, try splitting by bullet points
    if (lines.length <= 1) {
      lines = text
        .split(/[•·‣▪▫]/) // Split on various bullet symbols
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    // If still no splits, try splitting by periods (fallback)
    if (lines.length <= 1) {
      lines = text
        .split(/\.(?=\s[A-Z])/) // Split on periods followed by space and capital letter
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    // Clean up the lines and add proper punctuation
    return lines.map(line => {
      // Remove existing bullet symbols from the start
      const cleanLine = line.replace(/^[•·‣▪▫]\s*/, '').trim();
      // Ensure proper punctuation for non-bullet content
      return cleanLine && !cleanLine.endsWith('.') && !cleanLine.endsWith('!') && !cleanLine.endsWith('?') 
        ? cleanLine + '.' 
        : cleanLine;
    }).filter(line => line.length > 0);
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