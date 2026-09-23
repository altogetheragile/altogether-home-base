import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type SiteSettings = {
  company_name?: string | null;
  company_description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_location?: string | null;
  social_linkedin?: string | null;
  social_twitter?: string | null;
  social_facebook?: string | null;
  social_youtube?: string | null;
  social_github?: string | null;
  copyright_text?: string | null;
  show_events?: boolean | null;
  show_coaching?: boolean | null;
  show_about?: boolean | null;
  show_contact?: boolean | null;
  show_testimonials?: boolean | null;
  show_resources?: boolean | null;
  show_knowledge?: boolean | null;
  show_blog?: boolean | null;
  show_exams?: boolean | null;
  show_ai_tools?: boolean | null;
  show_flow_game?: boolean | null;
  show_bookings?: boolean | null;
  show_testimonial_first_name_only?: boolean | null;
  show_testimonial_name?: boolean | null;
  show_testimonial_company?: boolean | null;
  /** Whether this site has a founder section at all. Some will not. */
  show_founder?: boolean | null;
  /** Whether the Terms, Privacy and Cookie pages are published. */
  show_legal?: boolean | null;
  /** The person named in Person structured data and image alt text. */
  founder_name?: string | null;
  /** The founder's job title, and what they are an authority on (one per line), for the
   *  Organization structured data. Both were hardcoded and described one person. */
  founder_role?: string | null;
  founder_expertise?: string | null;
  /** Per-site brand overrides. See @altogether/ui/brand resolveColors. */
  brand?: { colors?: Record<string, unknown> | null; images?: Record<string, unknown> | null } | null;
};

/** Single-row site settings (feature flags, contact, social, brand). Anon-readable.
 *
 *  Cached per request. The layout reads it, every page's generateMetadata reads it, and several
 *  JSON-LD builders read it; without this each of those was a separate round trip for the same
 *  row. `cache` is React's, so the deduplication lasts exactly one request and never leaks one
 *  visitor's view of the settings into another's. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    return (data as SiteSettings) ?? {};
  } catch {
    return {};
  }
});
