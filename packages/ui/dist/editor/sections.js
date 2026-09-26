// src/editor/sections.ts
function orderedSections(stored, declared) {
  const known = new Map(declared.map((d) => [d.key, d]));
  let saved = [];
  if (stored?.trim()) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        saved = parsed.filter((s) => !!s && typeof s === "object" && typeof s.section === "string").filter((s) => known.has(s.section)).map((s) => ({ section: s.section, visible: s.visible !== false }));
      }
    } catch {
    }
  }
  const seen = new Set(saved.map((s) => s.section));
  for (const d of declared) if (!seen.has(d.key)) saved.push({ section: d.key, visible: true });
  return saved;
}
var HOME_SECTIONS = [
  { key: "hero", label: "Hero", hint: "The headline and the two buttons. Hiding this leaves the page starting abruptly." },
  { key: "stats", label: "Statistics bar", hint: "The figures under the hero." },
  { key: "personas", label: "Who is this for", hint: "The cards naming who you work with." },
  { key: "testimonials", label: "Testimonials", hint: "The strip of quotes. Empty until somebody has left one." },
  { key: "courses", label: "Courses", hint: "The carousel of what you teach." },
  { key: "founder", label: "Founder", hint: "The photograph and the words beside it." },
  { key: "knowledge", label: "Knowledge base", hint: "Only appears when the knowledge base is switched on." },
  { key: "cta", label: "Closing call to action", hint: "The orange band at the bottom." }
];
var ABOUT_SECTIONS = [
  { key: "hero", label: "Hero", hint: "The teal band with the heading and the photograph." },
  { key: "story", label: "Story and credentials", hint: "The written story, the qualifications and the badges." },
  { key: "testimonials", label: "Testimonials", hint: "The quotes. Empty until somebody has left one." },
  { key: "mission", label: "Mission", hint: "The centred paragraphs on teal." },
  { key: "philosophy", label: "Philosophy cards", hint: "The two-up cards." },
  { key: "timeline", label: "Timeline", hint: "The dated list of how it unfolded." },
  { key: "cta", label: "Closing call to action", hint: "The band at the bottom." }
];
var SECTIONS_FOR_PAGE = {
  home: HOME_SECTIONS,
  about: ABOUT_SECTIONS
};

export { ABOUT_SECTIONS, HOME_SECTIONS, SECTIONS_FOR_PAGE, orderedSections };
