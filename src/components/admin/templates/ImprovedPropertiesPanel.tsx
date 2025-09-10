import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TemplateSection, TemplateField } from '@/types/template';
import { 
  Settings, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus, 
  Minus,
  Hash,
  Type,
  Calendar,
  Mail,
  CheckSquare
} from 'lucide-react';

interface ImprovedPropertiesPanelProps {
  selectedSection?: TemplateSection | null;
  selectedField?: TemplateField | null;
  onUpdateSection?: (updates: Partial<TemplateSection>) => void;
  onUpdateField?: (updates: Partial<TemplateField>) => void;
  onDeleteSection?: () => void;
  onDeleteField?: () => void;
}

export const ImprovedPropertiesPanel: React.FC<ImprovedPropertiesPanelProps> = ({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onDeleteSection,
  onDeleteField,
}) => {
  // Number input component with working increment/decrement
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }> = ({ value, onChange, label, min = 0, max = 9999, step = 1, unit = 'px' }) => {
    const increment = () => onChange(Math.min(max, value + step));
    const decrement = () => onChange(Math.max(min, value - step));
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseInt(e.target.value) || min;
      onChange(Math.max(min, Math.min(max, numValue)));
    };

    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={decrement}
            disabled={value <= min}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="h-8 text-center text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={increment}
            disabled={value >= max}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[20px]">{unit}</span>
        </div>
      </div>
    );
  };

  const ColorInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-12 rounded border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-3 w-3" />;
      case 'number': return <Hash className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'date': return <Calendar className="h-3 w-3" />;
      case 'checkbox': return <CheckSquare className="h-3 w-3" />;
      default: return <Type className="h-3 w-3" />;
    }
  };

  if (!selectedSection && !selectedField) {
    return (
      <div className="text-center py-8">
        <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-2">No Selection</p>
        <p className="text-xs text-muted-foreground/70">
          Select a section or field to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Properties */}
      {selectedSection && !selectedField && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Section</h3>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
            {onDeleteSection && (
              <Button variant="ghost" size="sm" onClick={onDeleteSection}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Section Title */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Section Title</Label>
            <Input
              value={selectedSection.title}
              onChange={(e) => onUpdateSection?.({ title: e.target.value })}
              className="h-9"
              placeholder="Enter section title"
            />
          </div>

          <Separator />

          {/* Transform */}
          <div className="space-y-4">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Transform</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                value={selectedSection.x}
                onChange={(value) => onUpdateSection?.({ x: value })}
                label="X Position"
                max={2000}
              />
              <NumberInput
                value={selectedSection.y}
                onChange={(value) => onUpdateSection?.({ y: value })}
                label="Y Position"
                max={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                value={selectedSection.width}
                onChange={(value) => onUpdateSection?.({ width: value })}
                label="Width"
                min={100}
                max={2000}
                step={10}
              />
              <NumberInput
                value={selectedSection.height}
                onChange={(value) => onUpdateSection?.({ height: value })}
                label="Height"
                min={80}
                max={2000}
                step={10}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance */}
          <div className="space-y-4">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Appearance</h4>
            
            <ColorInput
              value={selectedSection.backgroundColor}
              onChange={(value) => onUpdateSection?.({ backgroundColor: value })}
              label="Background"
            />
            
            <ColorInput
              value={selectedSection.borderColor}
              onChange={(value) => onUpdateSection?.({ borderColor: value })}
              label="Border"
            />
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedSection.fields.length} field{selectedSection.fields.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </>
      )}

      {/* Field Properties */}
      {selectedField && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                {getFieldIcon(selectedField.type)}
              </div>
              <div>
                <h3 className="font-medium text-sm">Field</h3>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
            {onDeleteField && (
              <Button variant="ghost" size="sm" onClick={onDeleteField}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Field Details */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={selectedField.label}
                onChange={(e) => onUpdateField?.({ label: e.target.value })}
                className="h-9"
                placeholder="Field label"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select 
                value={selectedField.type} 
                onValueChange={(value) => onUpdateField?.({ type: value as any })}
              >
                <SelectTrigger className="h-9">
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

            {selectedField.placeholder !== undefined && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Placeholder</Label>
                <Input
                  value={selectedField.placeholder || ''}
                  onChange={(e) => onUpdateField?.({ placeholder: e.target.value })}
                  className="h-9"
                  placeholder="Placeholder text"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Transform */}
          <div className="space-y-4">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Transform</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                value={selectedField.x || 0}
                onChange={(value) => onUpdateField?.({ x: value })}
                label="X Position"
                max={1000}
              />
              <NumberInput
                value={selectedField.y || 0}
                onChange={(value) => onUpdateField?.({ y: value })}
                label="Y Position"
                max={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                value={selectedField.width || 200}
                onChange={(value) => onUpdateField?.({ width: value })}
                label="Width"
                min={50}
                max={1000}
                step={5}
              />
              <NumberInput
                value={selectedField.height || 40}
                onChange={(value) => onUpdateField?.({ height: value })}
                label="Height"
                min={20}
                max={500}
                step={5}
              />
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedField.required ? 
                  <Lock className="h-4 w-4 text-destructive" /> : 
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                }
                <Label className="text-sm">Required field</Label>
              </div>
              <Switch
                checked={selectedField.required || false}
                onCheckedChange={(checked) => onUpdateField?.({ required: checked })}
              />
            </div>
          </div>

          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {selectedField.type}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};