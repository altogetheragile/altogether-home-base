
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplateMutations } from '@/hooks/useTemplateMutations';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useLevels } from '@/hooks/useLevels';
import { useFormats } from '@/hooks/useFormats';
import { EventTemplate, Location, Instructor, TemplateFormData } from '@/types/template';

interface TemplateFormProps {
  template: EventTemplate | null;
  locations: Location[];
  instructors: Instructor[];
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ 
  template, 
  locations, 
  instructors, 
  onClose 
}) => {
  const { createTemplate, updateTemplate } = useTemplateMutations();
  const { data: eventTypes } = useEventTypes();
  const { data: categories } = useEventCategories();
  const { data: levels } = useLevels();
  const { data: formats } = useFormats();
  const [formData, setFormData] = useState<TemplateFormData>({
    title: template?.title || '',
    description: template?.description || '',
    duration_days: template?.duration_days || 1,
    default_location_id: template?.default_location_id || 'none',
    default_instructor_id: template?.default_instructor_id || 'none',
    event_type_id: template?.event_type_id || 'none',
    category_id: template?.category_id || 'none',
    level_id: template?.level_id || 'none',
    format_id: template?.format_id || 'none',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert "none" values back to null for submission
    const submitData = {
      ...formData,
      default_location_id: formData.default_location_id === 'none' ? null : formData.default_location_id,
      default_instructor_id: formData.default_instructor_id === 'none' ? null : formData.default_instructor_id,
      event_type_id: formData.event_type_id === 'none' ? null : formData.event_type_id,
      category_id: formData.category_id === 'none' ? null : formData.category_id,
      level_id: formData.level_id === 'none' ? null : formData.level_id,
      format_id: formData.format_id === 'none' ? null : formData.format_id,
    };
    
    try {
      if (template) {
        await updateTemplate.mutateAsync({ 
          id: template.id, 
          data: submitData 
        });
      } else {
        await createTemplate.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Form submission error:', error);
    }
  };

  const isLoading = createTemplate.isPending || updateTemplate.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">Template Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.duration_days}
            onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="location">Default Location</Label>
          <Select 
            value={formData.default_location_id} 
            onValueChange={(value) => setFormData({ ...formData, default_location_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No default location</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="instructor">Default Instructor</Label>
          <Select 
            value={formData.default_instructor_id} 
            onValueChange={(value) => setFormData({ ...formData, default_instructor_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No default instructor</SelectItem>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Event Type</Label>
          <Select 
            value={formData.event_type_id} 
            onValueChange={(value) => setFormData({ ...formData, event_type_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No event type</SelectItem>
              {eventTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Level</Label>
          <Select 
            value={formData.level_id} 
            onValueChange={(value) => setFormData({ ...formData, level_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No level</SelectItem>
              {levels?.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Format</Label>
          <Select 
            value={formData.format_id} 
            onValueChange={(value) => setFormData({ ...formData, format_id: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No format</SelectItem>
              {formats?.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
