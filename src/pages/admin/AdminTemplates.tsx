
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useInstructors } from '@/hooks/useInstructors';
import { useToast } from '@/hooks/use-toast';
import SearchAndFilter from '@/components/admin/SearchAndFilter';
import BulkOperations from '@/components/admin/BulkOperations';

interface EventTemplate {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  created_at: string;
}

const AdminTemplates = () => {
  const { toast } = useToast();
  const { data: locations = [] } = useLocations();
  const { data: instructors = [] } = useInstructors();
  
  // Mock data for now - in real app this would come from useQuery
  const [templates] = useState<EventTemplate[]>([
    {
      id: '1',
      title: 'Leadership Workshop',
      description: 'A comprehensive leadership development workshop',
      duration_days: 2,
      default_location_id: locations[0]?.id,
      default_instructor_id: instructors[0]?.id,
      created_at: new Date().toISOString(),
    },
    {
      id: '2', 
      title: 'Team Building Session',
      description: 'Interactive team building activities',
      duration_days: 1,
      created_at: new Date().toISOString(),
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEvent = (template: EventTemplate) => {
    // Navigate to create event with template data pre-filled
    window.location.href = `/admin/events/new?template=${template.id}`;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? templates.map(t => t.id) : []);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Templates</h1>
          <p className="text-gray-600">Manage reusable event templates</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm 
              template={editingTemplate}
              locations={locations}
              instructors={instructors}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={handleClearFilters}
      />

      <BulkOperations
        selectedItems={selectedItems}
        allItems={templates}
        onSelectAll={handleSelectAll}
        type="events"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {template.title}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCreateEvent(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Duration: {template.duration_days} day(s)</p>
                {template.default_location_id && (
                  <p>Default Location: {locations.find(l => l.id === template.default_location_id)?.name}</p>
                )}
                {template.default_instructor_id && (
                  <p>Default Instructor: {instructors.find(i => i.id === template.default_instructor_id)?.name}</p>
                )}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => handleCreateEvent(template)}
              >
                Create Event from Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found matching your search.</p>
        </div>
      )}
    </div>
  );
};

// Template Form Component
const TemplateForm: React.FC<{
  template: EventTemplate | null;
  locations: any[];
  instructors: any[];
  onClose: () => void;
}> = ({ template, locations, instructors, onClose }) => {
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

export default AdminTemplates;
