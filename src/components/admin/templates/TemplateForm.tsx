
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventTemplate {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  created_at: string;
}

interface TemplateFormProps {
  template: EventTemplate | null;
  locations: any[];
  instructors: any[];
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ 
  template, 
  locations, 
  instructors, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    duration_days: template?.duration_days || 1,
    default_location_id: template?.default_location_id || '',
    default_instructor_id: template?.default_instructor_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would call mutation
    console.log('Template data:', formData);
    onClose();
  };

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
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
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
          />
        </div>

        <div>
          <Label htmlFor="location">Default Location</Label>
          <Select 
            value={formData.default_location_id} 
            onValueChange={(value) => setFormData({ ...formData, default_location_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No default location</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="instructor">Default Instructor</Label>
          <Select 
            value={formData.default_instructor_id} 
            onValueChange={(value) => setFormData({ ...formData, default_instructor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No default instructor</SelectItem>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateForm;
