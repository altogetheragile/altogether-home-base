import { notFound } from 'next/navigation';
import { getSiteSettings, type SiteSettings } from '@/lib/site-settings';
import { isAdmin } from '@/lib/auth';
import { MODULE_DEFAULTS } from '@altogether/ui/modules';

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
// An admin is let through. That used to be impossible: this comment said "off means off for
// everyone, including you", because the Site had no idea who you were. It does now, and the
// consequence is that switching a page off is a decision you make while standing on it rather
// than in a list of names somewhere else.
//
// Admins therefore see something visitors do not, which is a new way to be confused. The banner
// in the layout is the answer to that, and it is deliberately loud rather than tasteful.

export type GatedModule =
  | 'about' | 'coaching' | 'contact' | 'testimonials'
  | 'events' | 'blog' | 'exams';


/** Is this page switched on? The one place that answers it, so the gate, the menu and the banner
 *  cannot disagree about what "off" means. */
export function moduleIsShown(module: GatedModule, settings: SiteSettings): boolean {
  const value = settings[`show_${module}` as keyof SiteSettings];
  return typeof value === 'boolean' ? value : (MODULE_DEFAULTS[module as keyof typeof MODULE_DEFAULTS] ?? false);
}

/** 404s the page when its module is switched off, unless you are the person who switched it off.
 *  Call it before fetching anything else. */
export async function requireModule(module: GatedModule, settings?: SiteSettings): Promise<void> {
  const s = settings ?? (await getSiteSettings());
  if (moduleIsShown(module, s)) return;
  // An admin sees it, with the banner saying so. Anyone else gets the 404 they always got.
  if (await isAdmin()) return;
  notFound();
}
