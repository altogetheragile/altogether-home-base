
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstructors } from '@/hooks/useInstructors';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import EventFormFields from '@/components/admin/events/EventFormFields';
import { auditLogger } from '@/utils/auditLogger';

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: instructors } = useInstructors();
  const { data: locations } = useLocations();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    instructor_id: '',
    location_id: '',
    price_cents: 0,
    currency: 'usd',
    is_published: false,
    capacity: '',
    registration_deadline: '',
    time_zone: '',
    meeting_link: '',
    venue_details: '',
    daily_schedule: '',
    banner_image_url: '',
    seo_slug: '',
    tags: '',
    internal_notes: '',
    course_code: '',
    status: 'draft',
    expected_revenue_cents: 0,
    lead_source: '',
    event_type_id: '',
    category_id: '',
    level_id: '',
    format_id: '',
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('No event ID provided');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Log that admin viewed this event
      if (data) {
        auditLogger.view('events', data.id, {
          event_title: data.title,
          context: 'edit_page'
        }).catch(console.error);
      }
      
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: event.start_date || '',
        end_date: event.end_date || '',
        instructor_id: event.instructor_id || '',
        location_id: event.location_id || '',
        price_cents: event.price_cents || 0,
        currency: event.currency || 'usd',
        is_published: event.is_published || false,
        capacity: event.capacity || '',
        registration_deadline: event.registration_deadline || '',
        time_zone: event.time_zone || '',
        meeting_link: event.meeting_link || '',
        venue_details: event.venue_details || '',
        daily_schedule: event.daily_schedule || '',
        banner_image_url: event.banner_image_url || '',
        seo_slug: event.seo_slug || '',
        tags: event.tags ? event.tags.join(', ') : '',
        internal_notes: event.internal_notes || '',
        course_code: event.course_code || '',
        status: event.status || 'draft',
        expected_revenue_cents: event.expected_revenue_cents || 0,
        lead_source: event.lead_source || '',
        event_type_id: event.event_type_id || 'none',
        category_id: event.category_id || 'none',
        level_id: event.level_id || 'none',
        format_id: event.format_id || 'none',
      });
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: typeof formData) => {
      if (!id) throw new Error('No event ID provided');
      
      // Convert tags from comma-separated string to array and handle null conversions
      const processedData = {
        ...eventData,
        tags: eventData.tags ? eventData.tags.split(',').map(tag => tag.trim()) : [],
        capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
        event_type_id: eventData.event_type_id === 'none' ? null : eventData.event_type_id,
        category_id: eventData.category_id === 'none' ? null : eventData.category_id,
        level_id: eventData.level_id === 'none' ? null : eventData.level_id,
        format_id: eventData.format_id === 'none' ? null : eventData.format_id,
      };
      
      const { data, error } = await supabase
        .from('events')
        .update(processedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] }); // Main events list
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      
      // Log event update
      if (id) {
        auditLogger.update('events', id, {
          event_title: data.title,
          is_published: data.is_published
        }).catch(console.error);
      }
      
      toast({
        title: "Event updated successfully",
        description: "Your changes have been saved.",
      });
      navigate('/admin/events');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({
        title: "Error updating event",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Event not found</p>
        <Button onClick={() => navigate('/admin/events')} className="mt-4">
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/admin/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600">Update event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <EventFormFields
          formData={formData}
          selectedTemplate={null}
          instructors={instructors || []}
          locations={locations || []}
          handleInputChange={handleInputChange}
        />

        <div className="flex space-x-4">
          <Button type="submit" disabled={updateEventMutation.isPending}>
            {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;
