import React, { useState, useRef, useEffect } from 'react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';

interface RichTextFieldEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  isSelected?: boolean;
}

export const RichTextFieldEditor: React.FC<RichTextFieldEditorProps> = ({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Enter text...',
  isSelected = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

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

  if (isEditing) {
    return (
      <div className={`${className} w-full`}>
        <div className="border rounded-lg overflow-hidden">
          <RichTextEditor
            content={editValue}
            onChange={setEditValue}
            placeholder={placeholder}
          />
          <div className="flex gap-2 p-2 bg-muted/50 border-t">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${className} cursor-text hover:bg-accent/50 rounded px-2 py-1 min-h-[2rem] flex items-center justify-between group ${
        !value ? 'text-muted-foreground italic' : ''
      }`}
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to edit with rich text formatting"
    >
      <div 
        className="flex-1"
        dangerouslySetInnerHTML={{ 
          __html: value || `<span class="text-muted-foreground italic">${placeholder}</span>` 
        }}
      />
      {isSelected && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};