import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { TemplateConfig, TemplateField } from '@/types/template';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  config: TemplateConfig;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ config }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderField = (field: TemplateField) => {
    // Ensure value has correct type for each field to prevent errors
    const rawValue = formData[field.id] || field.defaultValue;
    
    // Type-specific value handling
    let value;
    switch (field.type) {
      case 'checkbox':
        value = typeof rawValue === 'boolean' ? rawValue : false;
        break;
      case 'number':
      case 'slider':
        value = typeof rawValue === 'number' ? rawValue : (typeof rawValue === 'string' ? Number(rawValue) || 0 : 0);
        break;
      case 'text':
      case 'textarea':
      default:
        value = typeof rawValue === 'string' ? rawValue : typeof rawValue === 'number' ? String(rawValue) : '';
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            pattern={field.validation?.pattern}
            title={field.validation?.message}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-normal cursor-pointer"
            >
              {field.label}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                <Label
                  htmlFor={`${field.id}-${index}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFieldChange(field.id, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <Slider
              value={[value || field.min || 0]}
              onValueChange={([newValue]) => handleFieldChange(field.id, newValue)}
              max={field.max || 100}
              min={field.min || 0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.min || 0}</span>
              <span className="font-medium">{value || field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted rounded border-dashed border-2">
            <p className="text-sm text-muted-foreground">
              Unknown field type: {field.type}
            </p>
          </div>
        );
    }
  };

  const handleExport = () => {
    const exportData = {
      templateConfig: config,
      formData,
      exportedAt: new Date().toISOString()
    };
    
    console.log('Template Preview Data:', exportData);
    // Here you could implement actual export functionality
  };

  return (
    <div className="p-8 h-full overflow-auto bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Template Preview</h2>
          <p className="text-muted-foreground">
            This is how users will see and interact with your template
          </p>
        </div>

        <div
          className="relative bg-background border rounded-lg shadow-lg overflow-hidden"
          style={{
            width: config.dimensions.width,
            height: config.dimensions.height,
            backgroundColor: config.styling.backgroundColor,
            margin: '0 auto'
          }}
        >
          {config.sections.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No sections added yet</p>
                <p className="text-sm">Switch to Design mode to add sections and fields</p>
              </div>
            </div>
          ) : (
            config.sections.map((section) => (
              <div
                key={section.id}
                className="absolute border rounded"
                style={{
                  left: section.x,
                  top: section.y,
                  width: section.width,
                  height: section.height,
                  backgroundColor: section.backgroundColor,
                  borderColor: section.borderColor
                }}
              >
                <div className="p-4 h-full overflow-auto">
                  {section.title && (
                    <h3 className="font-semibold mb-3 text-foreground">
                      {section.title}
                    </h3>
                  )}
                  
                  {section.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {section.description}
                    </p>
                  )}
                  
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {config.sections.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button onClick={handleExport}>
              Export Template Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};