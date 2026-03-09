
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapEventData, RawEvent } from '@/utils/mapEventData';

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
    id: string;
    title: string;
    created_at: string;
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
    brand_color?: string;
    icon_name?: string;
    hero_image_url?: string;
    banner_template?: string;
    learning_outcomes?: string[];
    prerequisites?: string[];
    target_audience?: string;
    key_benefits?: string[];
    template_tags?: string[];
    difficulty_rating?: 'beginner' | 'intermediate' | 'advanced';
    popularity_score?: number;
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
        .eq('is_published', true)
        .order('start_date', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(event => mapEventData(event as unknown as RawEvent));
    },
  });
};
