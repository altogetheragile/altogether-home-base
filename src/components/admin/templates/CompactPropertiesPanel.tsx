import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  CheckSquare,
  ChevronDown,
  Move3D,
  Palette
} from 'lucide-react';

interface CompactPropertiesPanelProps {
  selectedSection?: TemplateSection | null;
  selectedField?: TemplateField | null;
  onUpdateSection?: (updates: Partial<TemplateSection>) => void;
  onUpdateField?: (updates: Partial<TemplateField>) => void;
  onDeleteSection?: () => void;
  onDeleteField?: () => void;
}

export const CompactPropertiesPanel: React.FC<CompactPropertiesPanelProps> = ({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onDeleteSection,
  onDeleteField,
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    transform: true,
    appearance: false,
    options: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Compact number input with better styling
  const CompactNumberInput: React.FC<{
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
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1 bg-background border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-muted"
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
            className="h-7 text-center text-xs border-0 bg-transparent focus-visible:ring-0 px-1 w-12"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-muted"
            onClick={increment}
            disabled={value >= max}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground pr-2 min-w-[20px]">{unit}</span>
        </div>
      </div>
    );
  };

  const CompactColorInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded border cursor-pointer shadow-inner"
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
          className="h-7 text-xs flex-1"
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
      <div className="text-center py-6">
        <Settings className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground mb-1">No Selection</p>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Select an element to edit properties
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Properties */}
      {selectedSection && !selectedField && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                <Settings className="h-3 w-3 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-xs">Section</h3>
                <p className="text-xs text-muted-foreground/70">Properties</p>
              </div>
            </div>
            {onDeleteSection && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDeleteSection}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>

          {/* Section Title */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Title</Label>
            <Input
              value={selectedSection.title}
              onChange={(e) => onUpdateSection?.({ title: e.target.value })}
              className="h-7 text-xs"
              placeholder="Section title"
            />
          </div>

          <Separator className="my-3" />

          {/* Transform Section */}
          <Collapsible open={expandedSections.transform} onOpenChange={() => toggleSection('transform')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-6">
                <div className="flex items-center gap-2">
                  <Move3D className="h-3 w-3" />
                  <span className="text-xs font-medium">Transform</span>
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.transform ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <CompactNumberInput
                  value={selectedSection.x}
                  onChange={(value) => onUpdateSection?.({ x: value })}
                  label="X"
                  max={2000}
                />
                <CompactNumberInput
                  value={selectedSection.y}
                  onChange={(value) => onUpdateSection?.({ y: value })}
                  label="Y"
                  max={2000}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CompactNumberInput
                  value={selectedSection.width}
                  onChange={(value) => onUpdateSection?.({ width: value })}
                  label="W"
                  min={100}
                  max={2000}
                  step={10}
                />
                <CompactNumberInput
                  value={selectedSection.height}
                  onChange={(value) => onUpdateSection?.({ height: value })}
                  label="H"
                  min={80}
                  max={2000}
                  step={10}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Appearance Section */}
          <Collapsible open={expandedSections.appearance} onOpenChange={() => toggleSection('appearance')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-6">
                <div className="flex items-center gap-2">
                  <Palette className="h-3 w-3" />
                  <span className="text-xs font-medium">Appearance</span>
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.appearance ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <CompactColorInput
                value={selectedSection.backgroundColor}
                onChange={(value) => onUpdateSection?.({ backgroundColor: value })}
                label="Background"
              />
              <CompactColorInput
                value={selectedSection.borderColor}
                onChange={(value) => onUpdateSection?.({ borderColor: value })}
                label="Border"
              />
            </CollapsibleContent>
          </Collapsible>

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
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-accent flex items-center justify-center">
                {getFieldIcon(selectedField.type)}
              </div>
              <div>
                <h3 className="font-medium text-xs">Field</h3>
                <p className="text-xs text-muted-foreground/70">Properties</p>
              </div>
            </div>
            {onDeleteField && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDeleteField}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>

          {/* Field Details */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Label</Label>
              <Input
                value={selectedField.label}
                onChange={(e) => onUpdateField?.({ label: e.target.value })}
                className="h-7 text-xs"
                placeholder="Field label"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Type</Label>
              <Select 
                value={selectedField.type} 
                onValueChange={(value) => onUpdateField?.({ type: value as any })}
              >
                <SelectTrigger className="h-7 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
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
                <Label className="text-xs font-medium text-muted-foreground">Placeholder</Label>
                <Input
                  value={selectedField.placeholder || ''}
                  onChange={(e) => onUpdateField?.({ placeholder: e.target.value })}
                  className="h-7 text-xs"
                  placeholder="Placeholder text"
                />
              </div>
            )}
          </div>

          <Separator className="my-3" />

          {/* Transform Section */}
          <Collapsible open={expandedSections.transform} onOpenChange={() => toggleSection('transform')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-6">
                <div className="flex items-center gap-2">
                  <Move3D className="h-3 w-3" />
                  <span className="text-xs font-medium">Transform</span>
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.transform ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <CompactNumberInput
                  value={selectedField.x || 0}
                  onChange={(value) => onUpdateField?.({ x: value })}
                  label="X"
                  max={1000}
                />
                <CompactNumberInput
                  value={selectedField.y || 0}
                  onChange={(value) => onUpdateField?.({ y: value })}
                  label="Y"
                  max={1000}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CompactNumberInput
                  value={selectedField.width || 200}
                  onChange={(value) => onUpdateField?.({ width: value })}
                  label="W"
                  min={50}
                  max={1000}
                  step={5}
                />
                <CompactNumberInput
                  value={selectedField.height || 40}
                  onChange={(value) => onUpdateField?.({ height: value })}
                  label="H"
                  min={20}
                  max={500}
                  step={5}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Options Section */}
          <Collapsible open={expandedSections.options} onOpenChange={() => toggleSection('options')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center justify-between w-full p-0 h-6">
                <div className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  <span className="text-xs font-medium">Options</span>
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.options ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedField.required ? 
                    <Lock className="h-3 w-3 text-destructive" /> : 
                    <Unlock className="h-3 w-3 text-muted-foreground" />
                  }
                  <Label className="text-xs">Required</Label>
                </div>
                <Switch
                  checked={selectedField.required || false}
                  onCheckedChange={(checked) => onUpdateField?.({ required: checked })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

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