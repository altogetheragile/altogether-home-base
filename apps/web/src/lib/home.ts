import { createClient } from '@/lib/supabase/server';

export type HomeCourseCard = {
  id: string;
  /** The course's address. Null only for a row written before the column existed. */
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  hasDatesAvailable: boolean;
};

export type HomeTestimonial = {
  first_name: string;
  last_name: string;
  rating: number;
  comment: string;
  company: string | null;
  job_title: string | null;
  source: string;
};

type Named = { name: string } | null;

/** Course cards for the home carousel: templates + which have future published dates.
 *
 *  Null means the query failed; an empty array means this site has no published courses. They used
 *  to be the same value, so a brand new site with nothing in it yet was told "Unable to load
 *  courses. Please try refreshing the page." Refreshing was never going to help. */
export async function getHomeCourseCards(): Promise<HomeCourseCard[] | null> {
  try {
    const supabase = await createClient();
    const [templatesRes, eventsRes] = await Promise.all([
      supabase
        .from('event_templates')
        .select('id, slug, title, description, difficulty_rating, event_categories!category_id(name), levels!level_id(name)')
        .eq('is_published', true),
      supabase.from('events').select('template_id').eq('is_published', true).gte('start_date', new Date().toISOString()),
    ]);
    if (templatesRes.error || eventsRes.error) return null;

    const withDates = new Set((eventsRes.data || []).map((e) => (e as { template_id: string | null }).template_id).filter(Boolean));
    const rows = (templatesRes.data || []) as unknown as Array<{
      id: string; slug: string | null; title: string; description: string | null; difficulty_rating: string | null;
      event_categories: Named; levels: Named;
    }>;
    const cards: HomeCourseCard[] = rows.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      category: t.event_categories?.name || null,
      difficulty: t.levels?.name || t.difficulty_rating || null,
      hasDatesAvailable: withDates.has(t.id),
    }));
    cards.sort((a, b) => {
      if (a.hasDatesAvailable !== b.hasDatesAvailable) return a.hasDatesAvailable ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
    return cards;
  } catch {
    return null;
  }
}

/** Approved testimonials for the home strip: top 9 by rating. */
export async function getHomeTestimonials(): Promise<HomeTestimonial[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('course_feedback')
      .select('first_name, last_name, rating, comment, company, job_title, source')
      .eq('is_approved', true)
      .order('submitted_at', { ascending: false });
    const rows = (data as unknown as HomeTestimonial[]) ?? [];
    return [...rows].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 9);
  } catch {
    return [];
  }
}
