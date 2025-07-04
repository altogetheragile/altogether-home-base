
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';

export const useEventForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  
  const { data: templates } = useTemplates();

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
    template_id: templateId || '',
    // New enhanced fields
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

  // Pre-populate form with template data when template is selected
  useEffect(() => {
    if (templateId && templates) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setFormData(prev => ({
          ...prev,
          title: selectedTemplate.title,
          description: selectedTemplate.description || '',
          instructor_id: selectedTemplate.default_instructor_id || '',
          location_id: selectedTemplate.default_location_id || '',
          template_id: selectedTemplate.id,
        }));
        
        // Calculate end date based on duration_days
        if (selectedTemplate.duration_days && formData.start_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + selectedTemplate.duration_days - 1);
          setFormData(prev => ({
            ...prev,
            end_date: endDate.toISOString().split('T')[0]
          }));
        }
      }
    }
  }, [templateId, templates]);

  // Update end date when start date changes and template has duration
  useEffect(() => {
    if (templateId && templates && formData.start_date) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate?.duration_days) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + selectedTemplate.duration_days - 1);
        setFormData(prev => ({
          ...prev,
          end_date: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.start_date, templateId, templates]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: typeof formData) => {
      // Convert tags from comma-separated string to array
      const processedData = {
        ...eventData,
        tags: eventData.tags ? eventData.tags.split(',').map(tag => tag.trim()) : [],
        capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
      };
      
      const { data, error } = await supabase
        .from('events')
        .insert([processedData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({
        title: "Event created successfully",
        description: templateId ? "The event has been created from the template." : "The event has been added to your catalog.",
      });
      navigate('/admin/events');
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({
        title: "Error creating event",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedTemplate = templateId && templates ? templates.find(t => t.id === templateId) : null;

  return {
    formData,
    selectedTemplate,
    createEventMutation,
    handleSubmit,
    handleInputChange,
  };
};
