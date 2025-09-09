import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TemplateSection, TemplateField } from '@/types/template';
import { Settings, X, Lock, Unlock } from 'lucide-react';

interface TemplatePropertiesPanelProps {
  selectedSection?: TemplateSection | null;
  selectedField?: TemplateField | null;
  onUpdateSection?: (updates: Partial<TemplateSection>) => void;
  onUpdateField?: (updates: Partial<TemplateField>) => void;
  onClose: () => void;
}

export const TemplatePropertiesPanel: React.FC<TemplatePropertiesPanelProps> = ({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onClose,
}) => {
  // Number input component with validation and increment/decrement buttons
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  }> = ({ value, onChange, label, min = 0, max = 10000, step = 1, suffix }) => {
    const handleIncrement = () => {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseInt(e.target.value) || 0;
      if (numValue >= min && numValue <= max) {
        onChange(numValue);
      }
    };

    return (
      <div>
        <Label className="text-xs font-medium">{label}</Label>
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDecrement}
            disabled={value <= min}
          >
            -
          </Button>
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="h-7 text-center text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleIncrement}
            disabled={value >= max}
          >
            +
          </Button>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
    );
  };

  if (!selectedSection && !selectedField) {
    return (
      <Card className="w-80 h-fit">
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select a section or field to edit its properties</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="text-sm font-medium">
              {selectedField ? 'Field Properties' : 'Section Properties'}
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Section Properties */}
          {selectedSection && !selectedField && (
            <>
              <div>
                <Label className="text-xs font-medium">Section Title</Label>
                <Input
                  value={selectedSection.title}
                  onChange={(e) => onUpdateSection?.({ title: e.target.value })}
                  className="h-7 text-xs mt-1"
                  placeholder="Enter section title"
                />
              </div>

              <Separator />

              {/* Position and Size */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">Position & Size</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    value={selectedSection.x}
                    onChange={(value) => onUpdateSection?.({ x: value })}
                    label="X Position"
                    suffix="px"
                  />
                  <NumberInput
                    value={selectedSection.y}
                    onChange={(value) => onUpdateSection?.({ y: value })}
                    label="Y Position"
                    suffix="px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    value={selectedSection.width}
                    onChange={(value) => onUpdateSection?.({ width: value })}
                    label="Width"
                    min={100}
                    max={2000}
                    step={10}
                    suffix="px"
                  />
                  <NumberInput
                    value={selectedSection.height}
                    onChange={(value) => onUpdateSection?.({ height: value })}
                    label="Height"
                    min={80}
                    max={2000}
                    step={10}
                    suffix="px"
                  />
                </div>
              </div>

              <Separator />

              {/* Appearance */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">Appearance</h4>
                
                <div>
                  <Label className="text-xs font-medium">Background Color</Label>
                  <Input
                    type="color"
                    value={selectedSection.backgroundColor}
                    onChange={(e) => onUpdateSection?.({ backgroundColor: e.target.value })}
                    className="h-7 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium">Border Color</Label>
                  <Input
                    type="color"
                    value={selectedSection.borderColor}
                    onChange={(e) => onUpdateSection?.({ borderColor: e.target.value })}
                    className="h-7 mt-1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedSection.fields.length} field{selectedSection.fields.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </>
          )}

          {/* Field Properties */}
          {selectedField && (
            <>
              <div>
                <Label className="text-xs font-medium">Field Label</Label>
                <Input
                  value={selectedField.label}
                  onChange={(e) => onUpdateField?.({ label: e.target.value })}
                  className="h-7 text-xs mt-1"
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Field Type</Label>
                <Select 
                  value={selectedField.type} 
                  onValueChange={(value) => onUpdateField?.({ type: value as any })}
                >
                  <SelectTrigger className="h-7 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="radio">Radio Button</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Position and Size */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">Position & Size</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    value={selectedField.x || 0}
                    onChange={(value) => onUpdateField?.({ x: value })}
                    label="X Position"
                    suffix="px"
                  />
                  <NumberInput
                    value={selectedField.y || 0}
                    onChange={(value) => onUpdateField?.({ y: value })}
                    label="Y Position"
                    suffix="px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    value={selectedField.width || 200}
                    onChange={(value) => onUpdateField?.({ width: value })}
                    label="Width"
                    min={50}
                    max={1000}
                    step={10}
                    suffix="px"
                  />
                  <NumberInput
                    value={selectedField.height || 40}
                    onChange={(value) => onUpdateField?.({ height: value })}
                    label="Height"
                    min={20}
                    max={500}
                    step={5}
                    suffix="px"
                  />
                </div>
              </div>

              <Separator />

              {/* Field Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">Field Options</h4>
                
                {selectedField.placeholder !== undefined && (
                  <div>
                    <Label className="text-xs font-medium">Placeholder</Label>
                    <Input
                      value={selectedField.placeholder || ''}
                      onChange={(e) => onUpdateField?.({ placeholder: e.target.value })}
                      className="h-7 text-xs mt-1"
                      placeholder="Enter placeholder text"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onUpdateField?.({ required: !selectedField.required })}
                  >
                    {selectedField.required ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                    {selectedField.required ? 'Required' : 'Optional'}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedField.type}
                </Badge>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};