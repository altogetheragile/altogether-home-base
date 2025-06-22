import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstructors } from '@/hooks/useInstructors';
import { useLocations } from '@/hooks/useLocations';
import { useTemplates } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  
  const { data: instructors } = useInstructors();
  const { data: locations } = useLocations();
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
        if (selectedTemplate.duration_days && prev.start_date) {
          const startDate = new Date(prev.start_date);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + selectedTemplate.duration_days - 1);
          setFormData(current => ({
            ...current,
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
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
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

      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Using Template: {selectedTemplate.title}</h3>
          <p className="text-sm text-blue-700">
            Duration: {selectedTemplate.duration_days} day(s)
            {selectedTemplate.description && ` • ${selectedTemplate.description}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold mb-4">Event Details</h2>
          
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
              {selectedTemplate?.duration_days && (
                <p className="text-sm text-gray-500 mt-1">
                  Auto-calculated based on template duration ({selectedTemplate.duration_days} days)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Instructor</Label>
              <Select value={formData.instructor_id} onValueChange={(value) => handleInputChange('instructor_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={formData.location_id} onValueChange={(value) => handleInputChange('location_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (in cents)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price_cents}
                onChange={(e) => handleInputChange('price_cents', parseInt(e.target.value) || 0)}
                placeholder="0 for free"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter price in cents (e.g., 2500 for $25.00)
              </p>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => handleInputChange('is_published', checked)}
            />
            <Label htmlFor="is_published">Publish event immediately</Label>
          </div>
        </div>

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
