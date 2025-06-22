
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useInstructors } from '@/hooks/useInstructors';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { useEventForm } from '@/hooks/useEventForm';
import TemplateInfo from '@/components/admin/events/TemplateInfo';
import EventFormFields from '@/components/admin/events/EventFormFields';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { data: instructors } = useInstructors();
  const { data: locations } = useLocations();
  
  const {
    formData,
    selectedTemplate,
    createEventMutation,
    handleSubmit,
    handleInputChange,
  } = useEventForm();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/admin/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedTemplate ? `Create Event from "${selectedTemplate.title}"` : 'Create New Event'}
          </h1>
          <p className="text-gray-600">
            {selectedTemplate ? 'Event details have been pre-filled from the template' : 'Add a new event to your catalog'}
          </p>
        </div>
      </div>

      {selectedTemplate && <TemplateInfo template={selectedTemplate} />}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <EventFormFields
          formData={formData}
          selectedTemplate={selectedTemplate}
          instructors={instructors || []}
          locations={locations || []}
          handleInputChange={handleInputChange}
        />

        <div className="flex space-x-4">
          <Button type="submit" disabled={createEventMutation.isPending}>
            {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
