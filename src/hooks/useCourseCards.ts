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

export const useCourseCards = () => {
  return useQuery({
    queryKey: ['course-cards'],
    queryFn: async () => {
      const { data: templates, error: tErr } = await supabase
        .from('event_templates')
        .select(`
          id,
          title,
          description,
          difficulty_rating,
          event_categories!category_id(name),
          levels!level_id(name)
        `);

      if (tErr) throw tErr;

      // Find template_ids that have at least one future published event
      const { data: futureEvents, error: eErr } = await supabase
        .from('events')
        .select('template_id')
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString());

      if (eErr) throw eErr;

      const templatesWithDates = new Set(
        (futureEvents || []).map((e) => e.template_id).filter(Boolean)
      );

      const cards: CourseCard[] = (templates || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: (t.event_categories as any)?.name || null,
        difficulty: (t.levels as any)?.name || t.difficulty_rating || null,
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
