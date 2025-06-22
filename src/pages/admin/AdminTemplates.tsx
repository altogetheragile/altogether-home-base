
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useInstructors } from '@/hooks/useInstructors';
import { useTemplates, EventTemplate } from '@/hooks/useTemplates';
import SearchAndFilter from '@/components/admin/SearchAndFilter';
import BulkOperations from '@/components/admin/BulkOperations';
import TemplatesList from '@/components/admin/templates/TemplatesList';
import TemplateForm from '@/components/admin/templates/TemplateForm';

const AdminTemplates = () => {
  const { data: locations = [] } = useLocations();
  const { data: instructors = [] } = useInstructors();
  const { data: templates = [], isLoading, error } = useTemplates();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading templates: {error.message}</p>
        </div>
      </div>
    );
  }

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
              onClose={handleCloseDialog}
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
        type="templates"
      />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading templates...</p>
        </div>
      ) : (
        <TemplatesList
          templates={filteredTemplates}
          locations={locations}
          instructors={instructors}
          onEditTemplate={handleEditTemplate}
          onCreateEvent={handleCreateEvent}
        />
      )}
    </div>
  );
};

export default AdminTemplates;
