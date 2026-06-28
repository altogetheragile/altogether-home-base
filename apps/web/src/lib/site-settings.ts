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
};

/** Single-row site settings (feature flags, contact, social). Anon-readable. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    return (data as SiteSettings) ?? {};
  } catch {
    return {};
  }
}
