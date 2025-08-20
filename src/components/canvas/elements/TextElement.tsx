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
          'w-full h-full p-2 whitespace-pre-wrap break-words',
          fontSizeClasses[fontSize],
          alignClasses[align],
          'text-foreground',
          className
        )}
      >
        {content || placeholder}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'w-full h-full resize-none border-0 bg-transparent p-2',
          'focus:ring-0 focus:border-transparent',
          fontSizeClasses[fontSize],
          alignClasses[align],
          autoResize && 'overflow-hidden'
        )}
        style={{
          minHeight: autoResize ? 'auto' : '100%',
        }}
      />
      {maxLength && (
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default TextElement;