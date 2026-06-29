import { createClient } from '@/lib/supabase/server';

export type Feedback = {
  id: string;
  course_name: string;
  first_name: string;
  last_name: string;
  rating: number | null;
  comment: string;
  company: string | null;
  job_title: string | null;
  source: string;
  source_url: string | null;
  submitted_at: string;
  is_featured: boolean | null;
};

const FIELDS =
  'id, course_name, first_name, last_name, rating, comment, company, job_title, source, source_url, submitted_at, is_featured';

/** All approved testimonials, newest first. */
export async function getAllApprovedFeedback(): Promise<Feedback[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('course_feedback')
      .select(FIELDS)
      .eq('is_approved', true)
      .order('submitted_at', { ascending: false });
    return (data as unknown as Feedback[]) ?? [];
  } catch {
    return [];
  }
}

export type FeedbackStats = { averageRating: number; totalRatings: number } | null;

/** Average rating (out of 10) and count across approved feedback. */
export function feedbackStats(rows: Feedback[]): FeedbackStats {
  const rated = rows.filter((r) => typeof r.rating === 'number');
  if (!rated.length) return null;
  const avg = rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length;
  return { averageRating: Math.round(avg * 10) / 10, totalRatings: rated.length };
}
