/** Server-free types and formatting helpers for events/courses.
 *  Safe to import from Client Components (no server-only dependencies). */

type Named = { name: string } | null;

export type ScheduledEvent = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  is_published: boolean | null;
  price_cents: number | null;
  currency: string | null;
  capacity: number | null;
  status: string | null;
};

export type EventTemplate = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  duration_days: number | null;
  target_audience: string | null;
  learning_outcomes: string[] | null;
  key_benefits: string[] | null;
  prerequisites: string[] | null;
  template_tags: string[] | null;
  difficulty_rating: 'beginner' | 'intermediate' | 'advanced' | null;
  is_published: boolean | null;
  display_order: number | null;
  event_types: Named;
  event_categories: Named;
  levels: Named;
  formats: Named;
  certification_bodies: Named;
  events: ScheduledEvent[] | null;
};

export type CourseFeedback = {
  first_name: string;
  last_name: string;
  job_title: string | null;
  comment: string;
  rating: number | null;
  source: string;
  submitted_at: string;
  course_name: string;
};

export type CourseCardModel = {
  id: string;
  type: string;
  title: string;
  cert: string | null;
  forWho: string;
  duration: string;
  format: string;
  groupSize: string;
  objectives: string[];
  description: string;
  scheduledDates: { date: string; eventId: string }[];
  href: string;
  testimonial: CourseFeedback | null;
};

/** Highest-rated approved testimonial whose course_name matches a course title. */
export function topFeedbackFor(title: string, all: CourseFeedback[]): CourseFeedback | null {
  const needle = title.toLowerCase();
  const matches = all.filter((f) => (f.course_name || '').toLowerCase().includes(needle));
  if (!matches.length) return null;
  return [...matches].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )[0];
}

/** Map a template to the listing card model (mirrors the live Events page). */
export function toCardModel(t: EventTemplate, feedback: CourseFeedback[], now: number): CourseCardModel {
  const type = t.event_types?.name || 'Course';
  const format = t.formats?.name || 'Both';
  const cert = t.certification_bodies?.name || null;
  const scheduledDates = (t.events || [])
    .filter((e) => e.is_published && e.start_date && new Date(e.start_date).getTime() > now)
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
    .map((e) => ({ date: formatShortDate(e.start_date!), eventId: e.id }));
  const first = scheduledDates[0];
  const description =
    t.short_description ||
    (t.description ? (t.description.length > 160 ? t.description.slice(0, 160) + '...' : t.description) : '');
  return {
    id: t.id,
    type,
    title: t.title,
    cert,
    forWho: t.target_audience || '',
    duration: durationLabel(t.duration_days),
    format,
    groupSize: 'Up to 12',
    objectives: t.learning_outcomes || [],
    description,
    scheduledDates,
    // Scheduled courses link to the SPA registration page; unscheduled to the Next course page.
    href: first ? `/events/${first.eventId}` : `/courses/${t.id}`,
    testimonial: topFeedbackFor(t.title, feedback),
  };
}

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateRange(start: string, end: string | null): string {
  const s = formatShortDate(start);
  if (!end || end === start) return s;
  return `${s} – ${formatShortDate(end)}`;
}

export function durationLabel(days: number | null): string {
  if (!days) return '-';
  if (days < 1) return 'Half day';
  return `${days} day${days > 1 ? 's' : ''}`;
}

export function durationLong(days: number | null | undefined): string | null {
  if (!days) return null;
  return days === 1 ? '1 Day' : `${days} Days`;
}

const CURRENCY_CODES: Record<string, string> = {
  usd: 'USD', eur: 'EUR', gbp: 'GBP', cad: 'CAD', aud: 'AUD',
};

export function formatPrice(priceCents: number | null, currency: string | null = 'gbp'): string {
  if (!priceCents || isNaN(priceCents) || priceCents === 0) return 'Free';
  const code = CURRENCY_CODES[(currency || 'gbp').toLowerCase()] || (currency || 'GBP').toUpperCase();
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(priceCents / 100);
}

export function displayFeedbackName(f: CourseFeedback, firstNameOnly: boolean): string {
  return firstNameOnly ? f.first_name : `${f.first_name} ${f.last_name}`.trim();
}
