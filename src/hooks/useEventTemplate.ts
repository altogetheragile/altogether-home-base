import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapEventData, RawEvent } from '@/utils/mapEventData';

export const useEventTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['event-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select(`
          id,
          title,
          description,
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
        `)
        .eq('id', templateId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Course not found');

      // Map to EventData shape (unscheduled — no start_date, no instructor, no location)
      return mapEventData({
        id: data.id,
        title: data.title,
        description: data.description,
        start_date: '',
        end_date: null,
        is_published: true,
        price_cents: 0,
        currency: 'gbp',
        event_types: data.event_types,
        event_categories: data.event_categories,
        levels: data.levels,
        formats: data.formats,
        instructors: null,
        locations: null,
        event_templates: {
          id: data.id,
          title: data.title,
          created_at: '',
          duration_days: data.duration_days,
          brand_color: data.brand_color,
          icon_name: data.icon_name,
          hero_image_url: data.hero_image_url,
          banner_template: data.banner_template,
          learning_outcomes: data.learning_outcomes,
          prerequisites: data.prerequisites,
          target_audience: data.target_audience,
          key_benefits: data.key_benefits,
          template_tags: data.template_tags,
          difficulty_rating: data.difficulty_rating,
          popularity_score: data.popularity_score,
          event_types: data.event_types,
          formats: data.formats,
          levels: data.levels,
          event_categories: data.event_categories,
        },
      } as RawEvent);
    },
    enabled: !!templateId,
  });
};
