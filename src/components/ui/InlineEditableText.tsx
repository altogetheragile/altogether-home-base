import React, { useState, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface InlineEditableTextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  isLoading?: boolean;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onSave,
  placeholder = 'Click to edit...',
  className,
  multiline = false,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const debouncedSave = useDebouncedCallback((newValue: string) => {
    if (newValue !== value) {
      setIsSaving(true);
      onSave(newValue);
      setTimeout(() => setIsSaving(false), 300);
    }
  }, 500);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    debouncedSave.cancel();
    if (editValue !== value) {
      setIsSaving(true);
      onSave(editValue);
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    debouncedSave(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const showSaving = isSaving || isLoading;

  if (isEditing) {
    const inputProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: handleChange,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn(
        "w-full bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
        multiline && "min-h-[60px] resize-none",
        className
      ),
    };

    return multiline ? (
      <textarea {...inputProps} rows={3} />
    ) : (
      <input type="text" {...inputProps} />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-text rounded px-1 -mx-1 hover:bg-muted/50 transition-colors relative group",
        !value && "text-muted-foreground italic",
        className
      )}
      title="Double-click to edit"
    >
      <span className={cn(multiline ? "line-clamp-2" : "line-clamp-1")}>
        {value || placeholder}
      </span>
      {showSaving && (
        <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};
