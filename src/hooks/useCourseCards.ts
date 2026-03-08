import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseCard {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  hasDatesAvailable: boolean;
}

interface NameOnly {
  name: string;
}

function asNameOnly(val: unknown): NameOnly | null {
  if (val && typeof val === 'object' && 'name' in val) return val as NameOnly;
  return null;
}

export const useCourseCards = () => {
  return useQuery({
    queryKey: ['course-cards'],
    queryFn: async () => {
      // Run both queries concurrently to avoid waterfall
      const [templatesRes, eventsRes] = await Promise.all([
        supabase
          .from('event_templates')
          .select(`
            id,
            title,
            description,
            difficulty_rating,
            event_categories!category_id(name),
            levels!level_id(name)
          `),
        supabase
          .from('events')
          .select('template_id')
          .eq('is_published', true)
          .gte('start_date', new Date().toISOString()),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const templatesWithDates = new Set(
        (eventsRes.data || []).map((e) => e.template_id).filter(Boolean)
      );

      const cards: CourseCard[] = (templatesRes.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: asNameOnly(t.event_categories)?.name || null,
        difficulty: asNameOnly(t.levels)?.name || t.difficulty_rating || null,
        hasDatesAvailable: templatesWithDates.has(t.id),
      }));

      // Courses with dates first, then alphabetically
      cards.sort((a, b) => {
        if (a.hasDatesAvailable !== b.hasDatesAvailable) return a.hasDatesAvailable ? -1 : 1;
        return a.title.localeCompare(b.title);
      });

      return cards;
    },
  });
};
