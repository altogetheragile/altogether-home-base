import { EventData } from '@/hooks/useEvents';

/**
 * Raw shape returned by Supabase event queries with joined relations.
 * Supabase returns joined tables as objects, but TypeScript sees them
 * as `{ name: string } | { name: string }[]` depending on the relation.
 * We cast through `unknown` once here to avoid `any` across every hook.
 */
interface RawEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_published: boolean | null;
  price_cents: number | null;
  currency: string | null;
  event_types: unknown;
  event_categories: unknown;
  levels: unknown;
  formats: unknown;
  instructors: unknown;
  locations: unknown;
  event_templates: unknown;
}

interface NameOnly {
  name: string;
}

interface InstructorShape {
  name: string;
  bio: string | null;
}

interface LocationShape {
  name: string;
  address: string | null;
  virtual_url: string | null;
}

interface RawTemplate {
  id: string;
  title: string;
  created_at: string;
  duration_days: number | null;
  brand_color: string | null;
  icon_name: string | null;
  hero_image_url: string | null;
  banner_template: string | null;
  learning_outcomes: string[] | null;
  prerequisites: string[] | null;
  target_audience: string | null;
  key_benefits: string[] | null;
  template_tags: string[] | null;
  difficulty_rating: string | null;
  popularity_score: number | null;
  event_types: unknown;
  formats: unknown;
  levels: unknown;
  event_categories: unknown;
}

function asNameOnly(val: unknown): NameOnly | null {
  if (val && typeof val === 'object' && 'name' in val) return val as NameOnly;
  return null;
}

function asInstructor(val: unknown): InstructorShape | null {
  if (val && typeof val === 'object' && 'name' in val) return val as InstructorShape;
  return null;
}

function asLocation(val: unknown): LocationShape | null {
  if (val && typeof val === 'object' && 'name' in val) return val as LocationShape;
  return null;
}

function mapTemplate(raw: unknown): EventData['event_template'] {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as RawTemplate;
  return {
    id: t.id,
    title: t.title,
    created_at: t.created_at,
    duration_days: t.duration_days,
    brand_color: t.brand_color ?? undefined,
    icon_name: t.icon_name ?? undefined,
    hero_image_url: t.hero_image_url ?? undefined,
    banner_template: t.banner_template ?? undefined,
    learning_outcomes: t.learning_outcomes ?? undefined,
    prerequisites: t.prerequisites ?? undefined,
    target_audience: t.target_audience ?? undefined,
    key_benefits: t.key_benefits ?? undefined,
    template_tags: t.template_tags ?? undefined,
    difficulty_rating: (t.difficulty_rating as EventData['event_template'] extends { difficulty_rating?: infer D } ? D : never) ?? undefined,
    popularity_score: t.popularity_score ?? undefined,
    event_types: asNameOnly(t.event_types),
    formats: asNameOnly(t.formats),
    levels: asNameOnly(t.levels),
    categories: asNameOnly(t.event_categories),
  };
}

/** Map a single raw Supabase event row to the app's EventData shape. */
export function mapEventData(raw: RawEvent): EventData {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    start_date: raw.start_date,
    end_date: raw.end_date,
    is_published: raw.is_published ?? false,
    price_cents: raw.price_cents || 0,
    currency: raw.currency || 'usd',
    event_type: asNameOnly(raw.event_types),
    category: asNameOnly(raw.event_categories),
    level: asNameOnly(raw.levels),
    format: asNameOnly(raw.formats),
    instructor: asInstructor(raw.instructors),
    location: asLocation(raw.locations),
    event_template: mapTemplate(raw.event_templates),
  };
}
