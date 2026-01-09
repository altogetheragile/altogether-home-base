import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface EditableListFieldProps {
  label: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export const EditableListField: React.FC<EditableListFieldProps> = ({
  label,
  description,
  items,
  onChange,
  placeholder = 'Enter item...',
  maxItems = 10,
}) => {
  const handleAdd = () => {
    if (items.length < maxItems) {
      onChange([...items, '']);
    }
  };

  const handleUpdate = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
            <Input
              value={item}
              onChange={(e) => handleUpdate(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      )}
    </div>
  );
};
