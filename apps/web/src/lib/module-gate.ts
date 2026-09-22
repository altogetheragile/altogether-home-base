import { notFound } from 'next/navigation';
import { getSiteSettings, type SiteSettings } from '@/lib/site-settings';

// ============= A module that is off is not reachable here either =============
//
// The App gates its routes on `site_settings` (src/components/SiteSettingsRouteGuard.tsx). The
// Site did not, and the Site is what actually answers /about, /coaching, /events, /blog, /exams
// and /courses. So switching About off removed the menu entry and blocked a route nobody is
// served, while altogetheragile.com/about carried on rendering.
//
// The defaults match src/config/modules.ts. They are repeated rather than imported because the two
// apps cannot import each other's source; modulesAreReal.test.ts compares the two lists and fails
// if they drift.
//
// No admin preview here. The App's guard lets an admin through with ?preview=true, which it can do
// because it knows who you are. The Site deliberately does not (see src/utils/authPresence.ts), so
// off means off for everyone, including you.

export type GatedModule =
  | 'about' | 'coaching' | 'contact' | 'testimonials'
  | 'events' | 'blog' | 'exams';

const DEFAULTS: Record<GatedModule, boolean> = {
  about: true,
  coaching: true,
  contact: true,
  testimonials: true,
  events: false,
  blog: false,
  exams: true,
};

/** 404s the page when its module is switched off. Call it before fetching anything else. */
export async function requireModule(module: GatedModule, settings?: SiteSettings): Promise<void> {
  const s = settings ?? (await getSiteSettings());
  const value = s[`show_${module}` as keyof SiteSettings];
  const on = typeof value === 'boolean' ? value : DEFAULTS[module];
  if (!on) notFound();
}
