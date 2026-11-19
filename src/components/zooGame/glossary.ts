import { SCRUM_CARDS, GLOSSARY_WORDS } from './scrumContent';

// ============= The glossary =============
//
// Every Teaching Card is an entry: its title is the term (without "The") and its summary the
// definition, read live so the copy editor's wording is the glossary's. The words with no card come
// from `GLOSSARY_WORDS`. Asked for on 19 Nov 2026: "Can we add a glossary of terms. For terms, such
// as product goal, on guidance dialogs a pop definition could be clicked to orientate the user."

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  /** When the word is not the Scrum Guide's, what it is instead. */
  notScrum?: string;
  /** The ways it is written in running text, matched whole and ignoring case. */
  forms: string[];
}

/** Cards that are practices rather than Scrum, which carry no `notScrum` of their own. */
const NOT_THE_GUIDES: Record<string, string> = {
  slices: 'A way of splitting work that teams bring to Scrum, not a term in the Guide.',
};

/** Other ways a card's term is written. */
const CARD_FORMS: Record<string, string[]> = {
  pbi: ['Product Backlog Item', 'Product Backlog Items', 'PBI', 'PBIs'],
  refinement: ['refinement', 'refining'],
  'sprint-retrospective': ['Retrospective', 'Sprint Retrospective'],
  'sprint-review': ['Sprint Review'],
  developers: ['Developers', 'Developer'],
  'definition-of-done': ['Definition of Done', 'DoD'],
  'product-owner': ['Product Owner', 'PO'],
  'scrum-master': ['Scrum Master'],
  slices: ['slices', 'slice'],
};

const bare = (title: string) => title.replace(/^(The|A|An) /, '');

export function glossary(): GlossaryEntry[] {
  const fromCards: GlossaryEntry[] = SCRUM_CARDS.map((c) => {
    const term = c.id === 'slices' ? 'Slices' : bare(c.title);
    const notScrum = ['swarming', 'definition-of-ready', 'velocity'].includes(c.id) ? c.notScrum : NOT_THE_GUIDES[c.id];
    return { id: c.id, term, definition: c.summary, notScrum, forms: CARD_FORMS[c.id] ?? [term] };
  });
  const words: GlossaryEntry[] = GLOSSARY_WORDS.map((w) => ({
    id: w.id, term: w.term, definition: w.definition, notScrum: w.notScrum, forms: [w.term, ...(w.also ?? [])],
  }));
  return [...fromCards, ...words].sort((a, b) => a.term.localeCompare(b.term));
}

export type Piece = string | { id: string; text: string };

/** Running text, with the first mention of each glossary term marked. Longest forms first, so
 *  "Sprint Goal" is one term rather than "Sprint" and then nothing. Whole words only; a term is
 *  marked once, which is enough to orientate and leaves the sentence readable. */
export function markTerms(text: string, entries: GlossaryEntry[] = glossary()): Piece[] {
  const forms = entries.flatMap((e) => e.forms.map((f) => ({ f, id: e.id })))
    // Two-letter forms ("PO") only in capitals, so "po" in a word never matches.
    .sort((a, b) => b.f.length - a.f.length);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b(${forms.map((x) => esc(x.f)).join('|')})\\b`, 'gi');
  const seen = new Set<string>();
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const hit = forms.find((x) => x.f.toLowerCase() === m[0].toLowerCase());
    if (!hit || seen.has(hit.id)) continue;
    // Short capital forms are matched as written, so a lower-case "dod" in a word is left alone.
    if (hit.f.length <= 3 && m[0] !== hit.f) continue;
    seen.add(hit.id);
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push({ id: hit.id, text: m[0] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
