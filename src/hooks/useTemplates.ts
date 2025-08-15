
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventTemplate {
  id: string;
  title: string;
  description?: string;
  duration_days: number;
  default_location_id?: string;
  default_instructor_id?: string;
  event_type_id?: string;
  category_id?: string;
  level_id?: string;
  format_id?: string;
  created_at: string;
  created_by?: string;
  updated_by?: string;
  // Enhanced metadata for template branding
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
}

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EventTemplate[];
    },
  });
};
