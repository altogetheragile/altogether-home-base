
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapEventData, RawEvent } from '@/utils/mapEventData';

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
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
            id,
            title,
            created_at,
            duration_days,
            brand_color,
            icon_name,
            hero_image_url,
            banner_template,
            learning_outcomes,
            prerequisites,
            target_audience,
            key_benefits,
            template_tags,
            difficulty_rating,
            popularity_score,
            event_types!event_type_id(name),
            formats!format_id(name),
            levels!level_id(name),
            event_categories!category_id(name)
          )
        `)
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error('Event not found');
      }

      return mapEventData(data as unknown as RawEvent);
    },
    enabled: !!id,
  });
};
