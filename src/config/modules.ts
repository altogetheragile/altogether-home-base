import type { GatedFeature } from '@/components/SiteSettingsRouteGuard';

// ============= The parts this site is made of =============
//
// One entry per module that can be switched off, and the only list of them. The admin settings
// page renders from it, and modulesAreReal.test.ts checks it against the route guard and the
// settings type, so a module cannot be half-added: a switch with no route behind it, or a route
// with no switch in front of it, fails the build.
//
// This is also the answer to "which parts can be sold or spun up separately". A module is off when
// its flag is false, and off means the routes 404 for non-admins, not merely that the menu entry
// is hidden.
//
// Deliberately not switchable: auth, the legal pages, the account page and the admin area. A
// switch that can hide the way back in is a footgun rather than a feature.

export type ModuleGroup = 'Content' | 'Training' | 'Tools' | 'Games' | 'Platform';

export interface SiteModule {
  /** The `site_settings` column, without its `show_` prefix. Also the route guard's feature name. */
  feature: GatedFeature;
  label: string;
  blurb: string;
  group: ModuleGroup;
  /** What the site does when the column is null, which is also what a fresh site starts as. */
  defaultOn: boolean;
  /** False where the column is not on `site_settings` yet, so the UI can say so instead of
   *  silently saving into nothing. */
  hasColumn?: boolean;
}

export const MODULES: SiteModule[] = [
  { feature: 'about', label: 'About', blurb: 'The page about you.', defaultOn: true, group: 'Content' },
  { feature: 'coaching', label: 'Coaching', blurb: 'The coaching service page.', defaultOn: true, group: 'Content' },
  { feature: 'contact', label: 'Contact', blurb: 'The contact page and its form.', defaultOn: true, group: 'Content' },
  { feature: 'testimonials', label: 'Testimonials', blurb: 'Client quotes, as a page and a carousel.', defaultOn: true, group: 'Content' },
  { feature: 'blog', label: 'Blog', blurb: 'Posts, tags and authors.', defaultOn: false, group: 'Content' },
  { feature: 'dynamic_pages', label: 'CMS Pages', blurb: 'Pages built from content blocks, served at their own slugs.', defaultOn: true, group: 'Content' },

  { feature: 'events', label: 'Events & Courses', blurb: 'The schedule, course pages, instructors and locations.', defaultOn: false, group: 'Training' },
  { feature: 'bookings', label: 'Bookings', blurb: 'Taking appointments against your availability.', defaultOn: false, group: 'Training' },
  { feature: 'exams', label: 'Practice Exams', blurb: 'Practice papers, their questions and attempts.', defaultOn: true, group: 'Training' },
  { feature: 'knowledge', label: 'Knowledge Base', blurb: 'Techniques, the lattice and the pattern builder.', defaultOn: false, group: 'Training' },

  { feature: 'ai_tools', label: 'Canvases & AI Tools', blurb: 'Business Model Canvas, story mapping, personas, impact maps.', defaultOn: true, group: 'Tools' },
  { feature: 'protected_projects', label: 'Projects', blurb: 'Projects, artifacts, the backlog and the coaching pipeline.', defaultOn: true, group: 'Tools' },

  { feature: 'flow_game', label: 'Flow Game', blurb: 'The Kanban flow simulation.', defaultOn: true, group: 'Games' },
  { feature: 'zoo_game', label: 'Zoo Game', blurb: 'The Scrum teaching game.', defaultOn: false, group: 'Games', hasColumn: false },
  { feature: 'scrum_game', label: 'Scrum Game', blurb: 'The earlier Scrum simulation.', defaultOn: false, group: 'Games', hasColumn: false },

  { feature: 'dashboard', label: 'Dashboard', blurb: 'The signed-in landing page.', defaultOn: true, group: 'Platform' },
];

export const MODULE_GROUPS: ModuleGroup[] = ['Content', 'Training', 'Tools', 'Games', 'Platform'];

/** The `site_settings` column a module is switched by. */
export const flagOf = (m: SiteModule) => `show_${m.feature}` as const;

// ============= Flags that shape menus, not reachability =============
//
// These are not modules. They change what is offered, while everything behind them stays reachable
// by its own URL, so they do not belong in MODULES and must not be route guards. Kept here so the
// settings page still offers them and nobody has to guess which kind of flag they are looking at.

export interface NavFlag {
  flag: string;
  label: string;
  blurb: string;
  defaultOn: boolean;
}

export const NAV_FLAGS: NavFlag[] = [
  {
    flag: 'show_resources', label: 'Resources Menu', defaultOn: true,
    blurb: 'The Resources dropdown. Off hides the menu; its pages stay reachable, each behind its own switch above.',
  },
  {
    flag: 'show_recommendations', label: 'Recommendations', defaultOn: false,
    blurb: 'The "you might also like" panel under blog posts and techniques.',
  },
];
