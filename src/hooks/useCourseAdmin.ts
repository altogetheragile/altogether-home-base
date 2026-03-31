import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTemplateMutations } from '@/hooks/useTemplateMutations';
import { useEventMutations } from '@/hooks/useEventMutations';

export interface CourseEvent {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  is_published: boolean;
  price_cents: number | null;
  currency: string | null;
  capacity: number | null;
  status: string | null;
  instructor_id: string | null;
  location_id: string | null;
  instructors: { name: string } | null;
  locations: { name: string } | null;
}

export interface CourseAdminItem {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  is_published: boolean;
  duration_days: number;
  event_type_id: string | null;
  category_id: string | null;
  level_id: string | null;
  format_id: string | null;
  learning_outcomes: string[] | null;
  prerequisites: string[] | null;
  target_audience: string | null;
  key_benefits: string[] | null;
  template_tags: string[] | null;
  certification_body_id: string | null;
  difficulty_rating: string | null;
  default_location_id: string | null;
  default_instructor_id: string | null;
  event_types: { name: string } | null;
  event_categories: { name: string } | null;
  levels: { name: string } | null;
  formats: { name: string } | null;
  events: CourseEvent[];
  event_count: number;
  next_date: string | null;
  status: 'draft' | 'published' | 'scheduled';
}

function computeStatus(isPublished: boolean, events: CourseEvent[]): 'draft' | 'published' | 'scheduled' {
  if (!isPublished) return 'draft';

  const now = new Date();
  const hasFuturePublished = events.some(
    e => e.is_published && e.start_date && new Date(e.start_date) > now
  );

  if (hasFuturePublished) return 'scheduled';
  return 'published';
}

function computeNextDate(events: CourseEvent[]): string | null {
  const now = new Date();
  const futureDates = events
    .filter(e => e.start_date && new Date(e.start_date) > now)
    .map(e => e.start_date!)
    .sort();
  return futureDates[0] || null;
}

export const useCourseAdmin = () => {
  return useQuery({
    queryKey: ['course-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select(`
          *,
          event_types:event_types!event_type_id(name),
          event_categories:event_categories!category_id(name),
          levels:levels!level_id(name),
          formats:formats!format_id(name),
          events:events!template_id(
            id, title, start_date, end_date, is_published,
            price_cents, currency, capacity, status,
            instructor_id, location_id,
            instructors:instructors!instructor_id(name),
            locations:locations!location_id(name)
          )
        `)
        .order('display_order', { ascending: true })
        .order('title');

      if (error) throw error;

      return (data || []).map((template: any): CourseAdminItem => {
        const events: CourseEvent[] = Array.isArray(template.events) ? template.events : [];
        return {
          ...template,
          events,
          event_count: events.length,
          next_date: computeNextDate(events),
          status: computeStatus(!!template.is_published, events),
        };
      });
    },
  });
};

export const useCourseAdminMutations = () => {
  const queryClient = useQueryClient();
  const templateMutations = useTemplateMutations();
  const eventMutations = useEventMutations();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course-admin'] });
  };

  return {
    createTemplate: templateMutations.createTemplate,
    updateTemplate: templateMutations.updateTemplate,
    deleteTemplate: templateMutations.deleteTemplate,
    createEvent: eventMutations.createEvent,
    updateEvent: eventMutations.updateEvent,
    deleteEvent: eventMutations.deleteEvent,
    invalidate,
  };
};
