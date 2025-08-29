import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaUpload, type MediaItem } from '@/components/ui/media-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleFormProps {
  title: string;
  onSubmit: (data: any) => Promise<void>;
  editingItem?: any;
  onCancel: () => void;
  showActions?: boolean;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'image' | 'media' | 'array' | 'number' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    existingValues?: string[];
  }>;
}

const SimpleForm = ({ title, onSubmit, editingItem, onCancel, showActions = true, fields }: SimpleFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(() => {
    const initial: any = {};
    fields.forEach(field => {
      if (field.type === 'media') {
        // Handle media fields with existing data
        initial[field.key] = editingItem?.knowledge_media?.map((media: any, index: number) => ({
          id: media.id,
          type: media.type,
          title: media.title,
          description: media.description,
          url: media.url,
          thumbnail_url: media.thumbnail_url,
          position: index
        })) || [];
      } else if (field.type === 'multiselect') {
        // Handle multiselect fields with existing values
        initial[field.key] = field.existingValues || [];
      } else {
        initial[field.key] = editingItem?.[field.key] || '';
      }
    });
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: `${title} ${editingItem ? 'updated' : 'created'} successfully.`,
      });
      
      // Reset form if creating new item
      if (!editingItem) {
        const resetData: any = {};
        fields.forEach(field => {
          resetData[field.key] = '';
        });
        setFormData(resetData);
      }
      
      onCancel();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingItem ? 'update' : 'create'} ${title.toLowerCase()}.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectToggle = (fieldKey: string, optionValue: string) => {
    setFormData(prev => {
      const currentValues = prev[fieldKey] || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      return { ...prev, [fieldKey]: newValues };
    });
  };

  const removeMultiSelectItem = (fieldKey: string, optionValue: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || []).filter((v: string) => v !== optionValue)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          {editingItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span>{editingItem ? `Edit ${title}` : `Create ${title}`}</span>
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.key}
                value={formData[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
              />
            ) : field.type === 'select' ? (
              <Select value={formData[field.key]} onValueChange={(value) => handleChange(field.key, value)}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'multiselect' ? (
              <div className="space-y-3">
                {/* Selected items display */}
                {formData[field.key] && formData[field.key].length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData[field.key].map((selectedValue: string) => {
                      const option = field.options?.find(opt => opt.value === selectedValue);
                      return option ? (
                        <Badge key={selectedValue} variant="secondary" className="flex items-center gap-1">
                          {option.label}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeMultiSelectItem(field.key, selectedValue)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                
                {/* Available options */}
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {field.options?.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.key}-${option.value}`}
                          checked={formData[field.key]?.includes(option.value) || false}
                          onCheckedChange={() => handleMultiSelectToggle(field.key, option.value)}
                        />
                        <Label htmlFor={`${field.key}-${option.value}`} className="text-sm cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : field.type === 'image' ? (
              <ImageUpload
                value={formData[field.key]}
                onChange={(url) => handleChange(field.key, url)}
              />
            ) : field.type === 'media' ? (
              <MediaUpload
                value={formData[field.key] || []}
                onChange={(media) => setFormData(prev => ({ ...prev, [field.key]: media }))}
              />
            ) : (
              <Input
                id={field.key}
                type="text"
                value={formData[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}

        <div className="flex space-x-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimpleForm;