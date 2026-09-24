// ============= Which sections a page has, in which order =============
//
// Stored as one JSON value in site_copy rather than a table of its own. It is not content: the
// words still live in the copy registry and the sections are still coded components. All that is
// stored here is which of them appear and in what order, which is small, and which means no
// migration, no second store, and the same editor, revisions and undo as everything else.
//
// Deliberately not content_blocks. That table belongs to the App's dynamic pages, its type column
// is constrained to a fixed list that means nothing here, and the four rows in it keep Tailwind
// classes inside the content. Reusing the table would tangle two different jobs together to save
// writing twenty lines.

export type SectionChoice = { key: string; label: string; hint?: string };
export type SectionState = { section: string; visible: boolean };

/** What a page should render, given what was saved and what the code offers.
 *
 *  The merge is the point. A section added in code later has no entry saved against it, and must
 *  still appear rather than silently going missing; a section removed from the code must drop out
 *  rather than leaving a gap the editor offers to reorder. Saved order wins for anything the code
 *  still has, and anything new lands at the end where it is noticed. */
export function orderedSections(stored: string | undefined, declared: SectionChoice[]): SectionState[] {
  const known = new Map(declared.map((d) => [d.key, d]));
  let saved: SectionState[] = [];

  if (stored?.trim()) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        saved = parsed
          .filter((s): s is SectionState => !!s && typeof s === 'object' && typeof s.section === 'string')
          .filter((s) => known.has(s.section))
          .map((s) => ({ section: s.section, visible: s.visible !== false }));
      }
    } catch {
      // A hand-mangled value falls back to the page as the code has it, which is always safe.
    }
  }

  const seen = new Set(saved.map((s) => s.section));
  for (const d of declared) if (!seen.has(d.key)) saved.push({ section: d.key, visible: true });
  return saved;
}

/** The sections of the home page, top to bottom as the code has them. */
export const HOME_SECTIONS: SectionChoice[] = [
  { key: 'hero', label: 'Hero', hint: 'The headline and the two buttons. Hiding this leaves the page starting abruptly.' },
  { key: 'stats', label: 'Statistics bar', hint: 'The figures under the hero.' },
  { key: 'personas', label: 'Who is this for', hint: 'The cards naming who you work with.' },
  { key: 'testimonials', label: 'Testimonials', hint: 'The strip of quotes. Empty until somebody has left one.' },
  { key: 'courses', label: 'Courses', hint: 'The carousel of what you teach.' },
  { key: 'founder', label: 'Founder', hint: 'The photograph and the words beside it.' },
  { key: 'knowledge', label: 'Knowledge base', hint: 'Only appears when the knowledge base is switched on.' },
  { key: 'cta', label: 'Closing call to action', hint: 'The orange band at the bottom.' },
];

/** The sections of the about page. */
export const ABOUT_SECTIONS: SectionChoice[] = [
  { key: 'hero', label: 'Hero', hint: 'The teal band with the heading and the photograph.' },
  { key: 'story', label: 'Story and credentials', hint: 'The written story, the qualifications and the badges.' },
  { key: 'testimonials', label: 'Testimonials', hint: 'The quotes. Empty until somebody has left one.' },
  { key: 'mission', label: 'Mission', hint: 'The centred paragraphs on teal.' },
  { key: 'philosophy', label: 'Philosophy cards', hint: 'The two-up cards.' },
  { key: 'timeline', label: 'Timeline', hint: 'The dated list of how it unfolded.' },
  { key: 'cta', label: 'Closing call to action', hint: 'The band at the bottom.' },
];

export const SECTIONS_FOR_PAGE: Record<string, SectionChoice[]> = {
  home: HOME_SECTIONS,
  about: ABOUT_SECTIONS,
};
