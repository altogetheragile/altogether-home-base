import { useSiteSettings } from '@/hooks/useSiteSettings';

/** What this site calls itself, for the handful of places in the App that say it out loud.
 *
 *  The App is mostly behind a login, so its hardcoded names matter less than the Site's. These
 *  four pages are the exception: a 404, the sign-in form, and the legal pages are all reachable
 *  by a stranger, and all four said Altogether Agile on a site that was not. */
export function useCompanyName(): string {
  const { settings } = useSiteSettings();
  return (settings as { company_name?: string | null } | undefined)?.company_name?.trim() || 'Altogether Agile';
}
