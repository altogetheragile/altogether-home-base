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

export type SectionChoice = {
  key: string;
  label: string;
  hint?: string;
  /** Which shape controls this section can actually honour. A control offered where nothing
   *  moves reads as broken, so a section says what it can do rather than being offered
   *  everything. */
  shape?: ShapeName[];
};

export type SectionState = {
  section: string;
  visible: boolean;
  band?: BandName;
  space?: SpaceName;
  across?: AcrossName;
  side?: SideName;
};

// ============= What colour a band is =============
//
// A named ground rather than a colour picker, and the difference is the whole point. A picker
// lets somebody put deep teal text on a deep teal band, or 2.17:1 orange on white, and the page
// that results is not a design choice, it is unreadable. This site has already shipped that bug
// once, in the hero eyebrow.
//
// So a band chooses a ground, and the text colours that go with it come with it. These four are
// the combinations the site already uses, which is why they are the four: each one is in front of
// somebody today and reads.
//
// A section with no band chosen renders exactly as it did before, because every rule falls back
// to the colour it already had. Nothing moves until somebody moves it.

export type BandName = 'white' | 'pale' | 'deep' | 'accent';

export const BANDS: { key: BandName; label: string; note: string }[] = [
  { key: 'white', label: 'White', note: 'The page colour. Dark text.' },
  { key: 'pale', label: 'Pale', note: 'Your palest colour. Dark text.' },
  { key: 'deep', label: 'Deep', note: 'Your deep colour. Light text.' },
  { key: 'accent', label: 'Accent', note: 'Your accent colour. Dark text.' },
];

const isBand = (v: unknown): v is BandName => BANDS.some((b) => b.key === v);

// ============= What shape a section is =============
//
// Not a layout editor, and not a drag handle. Three questions with a handful of answers each, in
// the same place the order and the ground already live.
//
// The line is the same one the bands draw. A named answer cannot produce something broken: no
// choice here can overlap two columns, leave text four characters wide, or put a card grid at a
// width nothing fits in. A free number could do all three.

export type ShapeName = 'space' | 'across' | 'side';

/** How much air a section has above and below it. A multiplier on whatever it already had, so
 *  every section keeps its own proportions instead of being flattened to one padding. */
export type SpaceName = 'tight' | 'roomy';
export const SPACES: { key: SpaceName; label: string }[] = [
  { key: 'tight', label: 'Tight' },
  { key: 'roomy', label: 'Roomy' },
];

/** How many cards sit across a row.
 *
 *  A real number of columns, not a smallest card width. The width was the first attempt and it
 *  cannot promise a number: a row fits as many as it can, so at 1280px a 260px minimum fitted
 *  four and the control labelled "3 across" produced four. The stylesheet narrows the number on
 *  smaller screens rather than squeezing the cards. */
export type AcrossName = 'two' | 'three' | 'four';
export const ACROSS: { key: AcrossName; label: string }[] = [
  { key: 'two', label: '2 across' },
  { key: 'three', label: '3 across' },
  { key: 'four', label: '4 across' },
];

/** Which side the picture sits on, in the sections built from a picture and some words. */
export type SideName = 'right';
export const SIDES: { key: SideName; label: string }[] = [
  { key: 'right', label: 'Picture on the right' },
];

const isSpace = (v: unknown): v is SpaceName => SPACES.some((x) => x.key === v);
const isAcross = (v: unknown): v is AcrossName => ACROSS.some((x) => x.key === v);
const isSide = (v: unknown): v is SideName => SIDES.some((x) => x.key === v);

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
          // A band that is not one of the four is dropped rather than carried: an unknown name
          // would render a class nothing defines, which is a section with no ground at all.
          .map((s) => {
            const raw = s as Record<string, unknown>;
            return {
              section: s.section,
              visible: s.visible !== false,
              ...(isBand(raw.band) ? { band: raw.band } : {}),
              ...(isSpace(raw.space) ? { space: raw.space } : {}),
              ...(isAcross(raw.across) ? { across: raw.across } : {}),
              ...(isSide(raw.side) ? { side: raw.side } : {}),
            };
          });
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
  { key: 'hero', label: 'Hero', hint: 'The headline and the two buttons. Hiding this leaves the page starting abruptly.', shape: ['space'] },
  { key: 'stats', label: 'Statistics bar', hint: 'The figures under the hero.', shape: ['space'] },
  { key: 'personas', label: 'Who is this for', hint: 'The cards naming who you work with.', shape: ['space', 'across'] },
  { key: 'testimonials', label: 'Testimonials', hint: 'The strip of quotes. Empty until somebody has left one.', shape: ['space'] },
  { key: 'courses', label: 'Courses', hint: 'The carousel of what you teach.', shape: ['space'] },
  { key: 'founder', label: 'Founder', hint: 'The photograph and the words beside it.', shape: ['space', 'side'] },
  { key: 'knowledge', label: 'Knowledge base', hint: 'Only appears when the knowledge base is switched on.', shape: ['space'] },
  { key: 'cta', label: 'Closing call to action', hint: 'The orange band at the bottom.', shape: ['space'] },
];

/** The sections of the about page. */
export const ABOUT_SECTIONS: SectionChoice[] = [
  { key: 'hero', label: 'Hero', hint: 'The teal band with the heading and the photograph.', shape: ['space'] },
  { key: 'story', label: 'Story and credentials', hint: 'The written story, the qualifications and the badges.', shape: ['space'] },
  { key: 'testimonials', label: 'Testimonials', hint: 'The quotes. Empty until somebody has left one.', shape: ['space'] },
  { key: 'mission', label: 'Mission', hint: 'The centred paragraphs on teal.', shape: ['space'] },
  { key: 'philosophy', label: 'Philosophy cards', hint: 'The two-up cards.', shape: ['space', 'across'] },
  { key: 'timeline', label: 'Timeline', hint: 'The dated list of how it unfolded.', shape: ['space'] },
  { key: 'cta', label: 'Closing call to action', hint: 'The band at the bottom.', shape: ['space'] },
];

export const SECTIONS_FOR_PAGE: Record<string, SectionChoice[]> = {
  home: HOME_SECTIONS,
  about: ABOUT_SECTIONS,
};
