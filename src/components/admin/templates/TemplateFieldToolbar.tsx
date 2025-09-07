import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TemplateField, TemplateFieldType } from '@/types/template';
import { 
  Type, 
  AlignLeft, 
  Hash, 
  Calendar, 
  CheckSquare, 
  Circle, 
  Calendar as CalendarIcon, 
  Sliders as SliderIcon,
  List
} from 'lucide-react';

interface TemplateFieldToolbarProps {
  onAddField: (field: Omit<TemplateField, 'id'>) => void;
  disabled?: boolean;
}

const FIELD_TYPES: Array<{
  type: TemplateFieldType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  defaultProps: Partial<TemplateField>;
}> = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    description: 'Single line text input',
    defaultProps: {
      placeholder: 'Enter text...',
      required: false
    }
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: AlignLeft,
    description: 'Multi-line text input',
    defaultProps: {
      placeholder: 'Enter description...',
      required: false
    }
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input field',
    defaultProps: {
      placeholder: '0',
      min: 0,
      max: 100,
      required: false
    }
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: List,
    description: 'Select from options',
    defaultProps: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      required: false
    }
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Yes/No checkbox',
    defaultProps: {
      defaultValue: false
    }
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: Circle,
    description: 'Select one option',
    defaultProps: {
      options: ['Option A', 'Option B', 'Option C'],
      required: false
    }
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: CalendarIcon,
    description: 'Date selection field',
    defaultProps: {
      required: false
    }
  },
  {
    type: 'slider',
    label: 'Slider',
    icon: SliderIcon,
    description: 'Range slider input',
    defaultProps: {
      min: 0,
      max: 100,
      defaultValue: 50
    }
  }
];

export const TemplateFieldToolbar: React.FC<TemplateFieldToolbarProps> = ({
  onAddField,
  disabled = false
}) => {
  const handleAddField = (fieldType: typeof FIELD_TYPES[0]) => {
    const baseField: Omit<TemplateField, 'id'> = {
      type: fieldType.type,
      label: fieldType.label,
      ...fieldType.defaultProps
    };
    
    onAddField(baseField);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-3">Field Types</h4>
        {disabled && (
          <div className="mb-3 p-2 bg-muted rounded text-sm text-muted-foreground">
            Add a section first to start adding fields
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {FIELD_TYPES.map((fieldType) => {
          const IconComponent = fieldType.icon;
          
          return (
            <Card
              key={fieldType.type}
              className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => !disabled && handleAddField(fieldType)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <IconComponent className="h-4 w-4 text-primary mt-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{fieldType.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {fieldType.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fieldType.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Drag and drop fields to reposition them within sections
        </p>
      </div>
    </div>
  );
};