// ============= What a new site switches on =============
//
// These defaults existed in three places: MODULES in the App, DEFAULTS in the Site's module gate,
// and `def:` on each link in the Site's Navigation. They disagreed. Navigation said Events and
// Blog were on while the gate said they were off, so a site with no settings row showed two links
// in its own header that both answered 404. Found by standing one up and clicking them.
//
// One list, read by all three.
//
// The values are what a *new* site should be, not what altogetheragile.com happens to have. A
// freelancer's site is About, Services, Contact, Testimonials, Events and Blog. Practice exams,
// canvas tools, games, a knowledge base and a CMS are this practice's, and a new site turns on
// whichever of them it actually wants.

export const MODULE_DEFAULTS = {
  // The site a freelancer starts with.
  about: true,
  coaching: true,
  contact: true,
  testimonials: true,
  events: true,
  blog: true,

  // Everything else is off until a site asks for it.
  bookings: false,
  exams: false,
  knowledge: false,
  ai_tools: false,
  dynamic_pages: false,
  protected_projects: false,
  dashboard: false,
  flow_game: false,
  zoo_game: false,
  scrum_game: false,
} as const;

export type ModuleName = keyof typeof MODULE_DEFAULTS;

/** Whether a module is on, given what the site has saved. Unset means the default. */
export function moduleIsOn(name: string, settings?: Record<string, unknown> | null): boolean {
  const saved = settings?.[`show_${name}`];
  if (typeof saved === 'boolean') return saved;
  return MODULE_DEFAULTS[name as ModuleName] ?? false;
}
