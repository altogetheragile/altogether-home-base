
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useInstructors } from '@/hooks/useInstructors';
import SearchAndFilter from '@/components/admin/SearchAndFilter';
import BulkOperations from '@/components/admin/BulkOperations';
import TemplatesList from '@/components/admin/templates/TemplatesList';
import TemplateForm from '@/components/admin/templates/TemplateForm';

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

  const handleEditTemplate = (template: EventTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
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

      <TemplatesList
        templates={filteredTemplates}
        locations={locations}
        instructors={instructors}
        onEditTemplate={handleEditTemplate}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
};

export default AdminTemplates;
