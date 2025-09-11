import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { TemplateSection, TemplateField } from '@/types/template';
import { 
  Settings, 
  Move3D, 
  Palette,
  Plus, 
  Minus,
  Type,
  Hash,
  Calendar,
  Mail,
  CheckSquare
} from 'lucide-react';

interface FloatingPropertiesControlsProps {
  selectedSection?: TemplateSection | null;
  selectedField?: TemplateField | null;
  onUpdateSection?: (updates: Partial<TemplateSection>) => void;
  onUpdateField?: (updates: Partial<TemplateField>) => void;
  onOpenPanel: () => void;
}

export const FloatingPropertiesControls: React.FC<FloatingPropertiesControlsProps> = ({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
  onOpenPanel,
}) => {
  if (!selectedSection && !selectedField) {
    return null;
  }

  const QuickNumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }> = ({ value, onChange, min = 0, max = 9999, step = 1 }) => {
    const increment = () => onChange(Math.min(max, value + step));
    const decrement = () => onChange(Math.max(min, value - step));
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseInt(e.target.value) || min;
      onChange(Math.max(min, Math.min(max, numValue)));
    };

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={decrement}
          disabled={value <= min}
        >
          <Minus className="h-2 w-2" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          className="h-6 w-12 text-center text-xs border-0 bg-transparent focus-visible:ring-0 px-1"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={increment}
          disabled={value >= max}
        >
          <Plus className="h-2 w-2" />
        </Button>
      </div>
    );
  };

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

  return (
    <div className="fixed top-20 right-4 bg-background/95 backdrop-blur-sm border shadow-lg rounded-lg p-3 z-50 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
            {selectedField ? getFieldIcon(selectedField.type) : <Settings className="h-3 w-3 text-primary" />}
          </div>
          <span className="text-xs font-medium">
            {selectedField ? 'Field' : 'Section'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onOpenPanel}
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Quick Transform Controls */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <Move3D className="h-3 w-3 mr-1" />
            Transform
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="left">
          <div className="space-y-3">
            <div className="text-xs font-medium mb-2">Position & Size</div>
            
            {selectedSection && !selectedField && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">X</div>
                    <QuickNumberInput
                      value={selectedSection.x}
                      onChange={(value) => onUpdateSection?.({ x: value })}
                      max={2000}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Y</div>
                    <QuickNumberInput
                      value={selectedSection.y}
                      onChange={(value) => onUpdateSection?.({ y: value })}
                      max={2000}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Width</div>
                    <QuickNumberInput
                      value={selectedSection.width}
                      onChange={(value) => onUpdateSection?.({ width: value })}
                      min={100}
                      max={2000}
                      step={10}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Height</div>
                    <QuickNumberInput
                      value={selectedSection.height}
                      onChange={(value) => onUpdateSection?.({ height: value })}
                      min={80}
                      max={2000}
                      step={10}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedField && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">X</div>
                    <QuickNumberInput
                      value={selectedField.x || 0}
                      onChange={(value) => onUpdateField?.({ x: value })}
                      max={1000}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Y</div>
                    <QuickNumberInput
                      value={selectedField.y || 0}
                      onChange={(value) => onUpdateField?.({ y: value })}
                      max={1000}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Width</div>
                    <QuickNumberInput
                      value={selectedField.width || 200}
                      onChange={(value) => onUpdateField?.({ width: value })}
                      min={50}
                      max={1000}
                      step={5}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Height</div>
                    <QuickNumberInput
                      value={selectedField.height || 40}
                      onChange={(value) => onUpdateField?.({ height: value })}
                      min={20}
                      max={500}
                      step={5}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Color Controls - Only for sections */}
      {selectedSection && !selectedField && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-7 text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Colors
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" side="left">
            <div className="space-y-3">
              <div className="text-xs font-medium mb-2">Quick Colors</div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Background</div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border cursor-pointer"
                    style={{ backgroundColor: selectedSection.backgroundColor }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = selectedSection.backgroundColor;
                      input.onchange = (e) => onUpdateSection?.({ backgroundColor: (e.target as HTMLInputElement).value });
                      input.click();
                    }}
                  />
                  <Input
                    value={selectedSection.backgroundColor}
                    onChange={(e) => onUpdateSection?.({ backgroundColor: e.target.value })}
                    className="h-6 text-xs flex-1"
                  />
                </div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground mb-1">Border</div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border cursor-pointer"
                    style={{ backgroundColor: selectedSection.borderColor }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = selectedSection.borderColor;
                      input.onchange = (e) => onUpdateSection?.({ borderColor: (e.target as HTMLInputElement).value });
                      input.click();
                    }}
                  />
                  <Input
                    value={selectedSection.borderColor}
                    onChange={(e) => onUpdateSection?.({ borderColor: e.target.value })}
                    className="h-6 text-xs flex-1"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="text-xs text-muted-foreground text-center pt-1">
        {selectedField ? selectedField.label : selectedSection?.title}
      </div>
    </div>
  );
};