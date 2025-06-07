
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_published: boolean;
  instructor: {
    name: string;
    bio: string | null;
  } | null;
  location: {
    name: string;
    address: string | null;
    virtual_url: string | null;
  } | null;
  event_template: {
    event_types: {
      name: string;
    } | null;
    formats: {
      name: string;
    } | null;
    levels: {
      name: string;
    } | null;
    duration_days: number | null;
  } | null;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          is_published,
          instructor:instructors(name, bio),
          location:locations(name, address, virtual_url),
          event_templates(
            duration_days,
            event_types(name),
            formats(name),
            levels(name)
          )
        `)
        .eq('is_published', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      // Map the data to transform arrays to single objects
      const mappedData: EventData[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        is_published: event.is_published,
        instructor: event.instructor?.[0] || null,
        location: event.location?.[0] || null,
        event_template: event.event_templates?.[0] ? {
          duration_days: event.event_templates[0].duration_days,
          event_types: event.event_templates[0].event_types?.[0] || null,
          formats: event.event_templates[0].formats?.[0] || null,
          levels: event.event_templates[0].levels?.[0] || null,
        } : null,
      }));

      return mappedData;
    },
  });
};
