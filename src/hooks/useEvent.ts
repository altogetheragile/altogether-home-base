
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
          event_type:event_types(name),
          category:event_categories(name),
          level:levels(name),
          format:formats(name),
          instructor:instructors(name, bio),
          location:locations(name, address, virtual_url),
          event_templates(
            duration_days,
            event_types(name),
            formats(name),
            levels(name)
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
        event_type: data.event_type?.[0] || null,
        category: data.category?.[0] || null,
        level: data.level?.[0] || null,
        format: data.format?.[0] || null,
        instructor: data.instructor?.[0] || null,
        location: data.location?.[0] || null,
        event_template: data.event_templates?.[0] ? {
          duration_days: data.event_templates[0].duration_days,
          event_types: data.event_templates[0].event_types?.[0] || null,
          formats: data.event_templates[0].formats?.[0] || null,
          levels: data.event_templates[0].levels?.[0] || null,
        } : null,
      };

      return mappedData;
    },
    enabled: !!id,
  });
};
