// src/modules.ts
var MODULE_DEFAULTS = {
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
  scrum_game: false
};
function moduleIsOn(name, settings) {
  const saved = settings?.[`show_${name}`];
  if (typeof saved === "boolean") return saved;
  return MODULE_DEFAULTS[name] ?? false;
}

export { MODULE_DEFAULTS, moduleIsOn };
