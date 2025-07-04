
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventData {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_published: boolean;
  price_cents: number;
  currency: string;
  // Direct event fields (override template defaults)
  event_type: {
    name: string;
  } | null;
  category: {
    name: string;
  } | null;
  level: {
    name: string;
  } | null;
  format: {
    name: string;
  } | null;
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
    categories: {
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
        price_cents: event.price_cents || 0,
        currency: event.currency || 'usd',
        event_type: (event.event_types as any) || null,
        category: (event.event_categories as any) || null,
        level: (event.levels as any) || null,
        format: (event.formats as any) || null,
        instructor: (event.instructors as any) || null,
        location: (event.locations as any) || null,
        event_template: event.event_templates ? {
          duration_days: (event.event_templates as any).duration_days,
          event_types: (event.event_templates as any).event_types || null,
          formats: (event.event_templates as any).formats || null,
          levels: (event.event_templates as any).levels || null,
          categories: (event.event_templates as any).event_categories || null,
        } : null,
      }));

      return mappedData;
    },
  });
};
