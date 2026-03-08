import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventData } from './useEvents';

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
      const mapped: EventData = {
        id: data.id,
        title: data.title,
        description: (data as any).description || null,
        start_date: '',
        end_date: null,
        is_published: true,
        price_cents: 0,
        currency: 'gbp',
        event_type: (data.event_types as any) || null,
        category: (data.event_categories as any) || null,
        level: (data.levels as any) || null,
        format: (data.formats as any) || null,
        instructor: null,
        location: null,
        event_template: {
          id: data.id,
          title: data.title,
          created_at: '',
          duration_days: data.duration_days,
          brand_color: (data as any).brand_color,
          icon_name: (data as any).icon_name,
          hero_image_url: (data as any).hero_image_url,
          banner_template: (data as any).banner_template,
          learning_outcomes: (data as any).learning_outcomes,
          prerequisites: (data as any).prerequisites,
          target_audience: (data as any).target_audience,
          key_benefits: (data as any).key_benefits,
          template_tags: (data as any).template_tags,
          difficulty_rating: (data as any).difficulty_rating,
          popularity_score: (data as any).popularity_score,
          event_types: (data.event_types as any) || null,
          formats: (data.formats as any) || null,
          levels: (data.levels as any) || null,
          categories: (data.event_categories as any) || null,
        },
      };

      return mapped;
    },
    enabled: !!templateId,
  });
};
