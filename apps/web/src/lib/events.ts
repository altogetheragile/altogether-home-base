import { createClient } from '@/lib/supabase/server';
import type { EventTemplate, CourseFeedback } from '@/lib/events-types';

export * from '@/lib/events-types';

const TEMPLATE_FIELDS = `
  id, title, description, short_description, seo_title, seo_description,
  duration_days, target_audience, learning_outcomes, key_benefits, prerequisites,
  template_tags, difficulty_rating, is_published, display_order,
  event_types:event_types!event_type_id(name),
  event_categories:event_categories!category_id(name),
  levels:levels!level_id(name),
  formats:formats!format_id(name),
  certification_bodies:certification_bodies!certification_body_id(name),
  events:events!template_id(id, start_date, end_date, is_published, price_cents, currency, capacity, status)
`;

/** Published course catalogue, ordered as the site orders it. */
export async function getEventTemplates(): Promise<EventTemplate[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('event_templates')
      .select(TEMPLATE_FIELDS)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('title', { ascending: true });
    return (data as unknown as EventTemplate[]) ?? [];
  } catch {
    return [];
  }
}

/** A single published course template by id (the SEO course page). */
export async function getCourse(id: string): Promise<EventTemplate | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('event_templates')
      .select(TEMPLATE_FIELDS)
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();
    return (data as unknown as EventTemplate) ?? null;
  } catch {
    return null;
  }
}

/** All approved course testimonials (small table); matched to courses by name. */
export async function getApprovedFeedback(): Promise<CourseFeedback[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('course_feedback')
      .select('first_name, last_name, job_title, comment, rating, source, submitted_at, course_name')
      .eq('is_approved', true)
      .order('submitted_at', { ascending: false });
    return (data as unknown as CourseFeedback[]) ?? [];
  } catch {
    return [];
  }
}
