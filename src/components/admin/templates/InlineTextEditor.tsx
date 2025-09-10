import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  multiline = false,
  className = '',
  placeholder = 'Enter text...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
    onBlur?.();
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`${className} resize-none`}
          placeholder={placeholder}
          rows={3}
        />
      );
    }

    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={`${className} cursor-text hover:bg-accent/50 rounded px-2 py-1 min-h-[2rem] flex items-center ${
        !value ? 'text-muted-foreground italic' : ''
      }`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value || placeholder}
    </div>
  );
};