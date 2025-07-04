
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventData } from './useEvents';

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      console.log('Fetching event with ID:', id);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          is_published,
          price_cents,
          currency,
          event_types!event_type_id(name),
          event_categories!category_id(name),
          levels!level_id(name),
          formats!format_id(name),
          instructors!instructor_id(name, bio),
          locations!location_id(name, address, virtual_url),
          event_templates!template_id(
            duration_days,
            event_types!event_type_id(name),
            formats!format_id(name),
            levels!level_id(name),
            event_categories!category_id(name)
          )
        `)
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching event:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Event not found');
      }

      console.log('Raw event data from Supabase:', JSON.stringify(data, null, 2));

      // Map the data to transform arrays to single objects (same as useEvents)
      const mappedData: EventData = {
        id: data.id,
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        is_published: data.is_published,
        price_cents: data.price_cents || 0,
        currency: data.currency || 'usd',
        event_type: data.event_types?.[0] || null,
        category: data.event_categories?.[0] || null,
        level: data.levels?.[0] || null,
        format: data.formats?.[0] || null,
        instructor: data.instructors?.[0] || null,
        location: data.locations?.[0] || null,
        event_template: data.event_templates?.[0] ? {
          duration_days: data.event_templates[0].duration_days,
          event_types: data.event_templates[0].event_types?.[0] || null,
          formats: data.event_templates[0].formats?.[0] || null,
          levels: data.event_templates[0].levels?.[0] || null,
          categories: data.event_templates[0].event_categories?.[0] || null,
        } : null,
      };

      console.log('Mapped event data:', JSON.stringify(mappedData, null, 2));
      return mappedData;
    },
    enabled: !!id,
  });
};
