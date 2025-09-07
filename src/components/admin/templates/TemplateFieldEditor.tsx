import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { TemplateField } from '@/types/template';
import { Plus, X } from 'lucide-react';

interface TemplateFieldEditorProps {
  field: TemplateField;
  onUpdate: (updates: Partial<TemplateField>) => void;
}

export const TemplateFieldEditor: React.FC<TemplateFieldEditorProps> = ({
  field,
  onUpdate
}) => {
  const handleAddOption = () => {
    const currentOptions = field.options || [];
    const newOption = `Option ${currentOptions.length + 1}`;
    onUpdate({
      options: [...currentOptions, newOption]
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const currentOptions = field.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    onUpdate({
      options: newOptions
    });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = field.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    onUpdate({
      options: newOptions
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{field.type}</Badge>
          <span className="text-sm font-medium">Field Properties</span>
        </div>

        <div className="space-y-4">
          {/* Basic Properties */}
          <div>
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>

          {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Placeholder text"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required Field</Label>
            <Switch
              id="field-required"
              checked={field.required || false}
              onCheckedChange={(required) => onUpdate({ required })}
            />
          </div>

          {/* Type-specific properties */}
          {field.type === 'number' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="field-min">Min Value</Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={field.min || ''}
                    onChange={(e) => onUpdate({ 
                      min: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="field-max">Max Value</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={field.max || ''}
                    onChange={(e) => onUpdate({ 
                      max: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </>
          )}

          {field.type === 'slider' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="slider-min">Min Value</Label>
                  <Input
                    id="slider-min"
                    type="number"
                    value={field.min || 0}
                    onChange={(e) => onUpdate({ min: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="slider-max">Max Value</Label>
                  <Input
                    id="slider-max"
                    type="number"
                    value={field.max || 100}
                    onChange={(e) => onUpdate({ max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slider-default">Default Value</Label>
                <Input
                  id="slider-default"
                  type="number"
                  value={field.defaultValue || 0}
                  onChange={(e) => onUpdate({ defaultValue: Number(e.target.value) })}
                />
              </div>
            </>
          )}

          {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Options</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!field.options || field.options.length === 0) && (
                  <p className="text-sm text-muted-foreground">No options added yet</p>
                )}
              </div>
            </div>
          )}

          {/* Validation */}
          {(field.type === 'text' || field.type === 'textarea') && (
            <div>
              <Label htmlFor="field-pattern">Validation Pattern (RegEx)</Label>
              <Input
                id="field-pattern"
                value={field.validation?.pattern || ''}
                onChange={(e) => onUpdate({ 
                  validation: { 
                    ...field.validation, 
                    pattern: e.target.value 
                  } 
                })}
                placeholder="^[A-Za-z0-9]+$"
              />
              {field.validation?.pattern && (
                <div className="mt-1">
                  <Label htmlFor="field-validation-message">Error Message</Label>
                  <Input
                    id="field-validation-message"
                    value={field.validation?.message || ''}
                    onChange={(e) => onUpdate({ 
                      validation: { 
                        ...field.validation, 
                        message: e.target.value 
                      } 
                    })}
                    placeholder="Please enter a valid value"
                  />
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Position & Size */}
          <div>
            <Label className="text-sm font-medium">Position & Size</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label htmlFor="field-x">X Position</Label>
                <Input
                  id="field-x"
                  type="number"
                  value={field.x || 0}
                  onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="field-y">Y Position</Label>
                <Input
                  id="field-y"
                  type="number"
                  value={field.y || 0}
                  onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label htmlFor="field-width">Width</Label>
                <Input
                  id="field-width"
                  type="number"
                  value={field.width || 200}
                  onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="field-height">Height</Label>
                <Input
                  id="field-height"
                  type="number"
                  value={field.height || 40}
                  onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};