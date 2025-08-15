
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
        event_type: (data.event_types as any) || null,
        category: (data.event_categories as any) || null,
        level: (data.levels as any) || null,
        format: (data.formats as any) || null,
        instructor: (data.instructors as any) || null,
        location: (data.locations as any) || null,
        event_template: data.event_templates ? {
          id: (data.event_templates as any).id,
          title: (data.event_templates as any).title,
          created_at: (data.event_templates as any).created_at,
          duration_days: (data.event_templates as any).duration_days,
          brand_color: (data.event_templates as any).brand_color,
          icon_name: (data.event_templates as any).icon_name,
          hero_image_url: (data.event_templates as any).hero_image_url,
          banner_template: (data.event_templates as any).banner_template,
          learning_outcomes: (data.event_templates as any).learning_outcomes,
          prerequisites: (data.event_templates as any).prerequisites,
          target_audience: (data.event_templates as any).target_audience,
          key_benefits: (data.event_templates as any).key_benefits,
          template_tags: (data.event_templates as any).template_tags,
          difficulty_rating: (data.event_templates as any).difficulty_rating,
          popularity_score: (data.event_templates as any).popularity_score,
          event_types: (data.event_templates as any).event_types || null,
          formats: (data.event_templates as any).formats || null,
          levels: (data.event_templates as any).levels || null,
          categories: (data.event_templates as any).event_categories || null,
        } : null,
      };

      console.log('Mapped event data:', JSON.stringify(mappedData, null, 2));
      return mappedData;
    },
    enabled: !!id,
  });
};
