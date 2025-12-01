import React, { useRef, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextElementProps {
  content: string;
  isEditable?: boolean;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  autoResize?: boolean;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';
}

function normalizeForExport(text: string) {
  // Ensure bullets are "• " (bullet + space) but don't touch normal spaces
  return text.replace(/•\s?/g, "• ");
}

const TextElement: React.FC<TextElementProps> = ({
  content,
  isEditable = false,
  onChange,
  className,
  placeholder = 'Enter text...',
  maxLength,
  autoResize = true,
  fontSize = 'sm',
  align = 'left',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(content);

  const fontSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  useEffect(() => {
    setValue(content);
  }, [content]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent certain keys from bubbling up to canvas shortcuts
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.stopPropagation();
    }
  };

  if (!isEditable) {
    return (
      <div 
        className={cn(
          'w-full h-full p-1 whitespace-pre-wrap break-words',
          fontSizeClasses[fontSize],
          alignClasses[align],
          content ? 'text-foreground' : 'text-muted-foreground/60',
          className
        )}
      >
        {content || placeholder}
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0">
      {/* Live editor (on-screen only) */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'w-full h-full resize-none p-1',
          'bg-white/50 border border-dashed border-primary/30 cursor-text',
          'focus:ring-2 focus:ring-primary focus:border-primary',
          'placeholder:text-muted-foreground/50',
          fontSizeClasses[fontSize],
          alignClasses[align],
          autoResize && 'overflow-hidden',
          className
        )}
        style={{
          minHeight: autoResize ? 'auto' : '100%',
        }}
      />

      {/* Export-only mirror (hidden normally; shown in .exporting) */}
      <div
        className={cn(
          'text-export-overlay hidden h-full w-full p-1',
          'whitespace-break-spaces break-words overflow-hidden',
          fontSizeClasses[fontSize],
          alignClasses[align]
        )}
        aria-hidden
      >
        {normalizeForExport(value)}
      </div>

      {maxLength && (
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default TextElement;