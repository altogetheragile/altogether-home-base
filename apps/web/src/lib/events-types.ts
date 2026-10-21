/** Server-free types and formatting helpers for events/courses.
 *  Safe to import from Client Components (no server-only dependencies). */

import eventsRegistry from '@/lib/copy/events.json';
import trainingRegistry from '@/lib/copy/training.json';

/** The words a course card is built from. The page passes this site's; a caller that passes
 *  nothing gets the shipped ones, read from the registry rather than written here a second time. */
export type CardWords = { groupSize: string; halfDay: string; day: string; days: string };

const shippedEntries = eventsRegistry.entries as Record<string, { value: string }>;
export const SHIPPED_CARD_WORDS: CardWords = {
  groupSize: shippedEntries['events.card.groupSize'].value,
  halfDay: shippedEntries['events.card.halfDay'].value,
  day: shippedEntries['events.card.day'].value,
  days: shippedEntries['events.card.days'].value,
};
const SHIPPED_LONG_DAYS = {
  day: trainingRegistry.entries['training.facts.day'].value,
  days: trainingRegistry.entries['training.facts.days'].value,
};

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
  /** The course's address. Null only for a row written before the column existed. */
  slug: string | null;
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
export function toCardModel(
  t: EventTemplate, feedback: CourseFeedback[], now: number, words: CardWords = SHIPPED_CARD_WORDS,
): CourseCardModel {
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
    duration: durationLabel(t.duration_days, words),
    format,
    // Was 'Up to 12' on every card of every site: a promise about somebody else's courses.
    groupSize: words.groupSize.trim(),
    objectives: t.learning_outcomes || [],
    description,
    scheduledDates,
    // Scheduled courses link to the SPA registration page; unscheduled to the Next course page.
    // By slug, falling back to the uuid: a row with no slug still has to be reachable, and the
    // page resolves either.
    href: first ? `/events/${first.eventId}` : `/training/${t.slug || t.id}`,
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

/** Empty when the course has no length recorded, so the card leaves the line out rather than
 *  showing a lone dash. */
export function durationLabel(days: number | null, words: CardWords = SHIPPED_CARD_WORDS): string {
  if (!days) return '';
  if (days < 1) return words.halfDay;
  return `${days} ${days > 1 ? words.days : words.day}`;
}

export function durationLong(
  days: number | null | undefined, words: { day: string; days: string } = SHIPPED_LONG_DAYS,
): string | null {
  if (!days) return null;
  return days === 1 ? `1 ${words.day}` : `${days} ${words.days}`;
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
