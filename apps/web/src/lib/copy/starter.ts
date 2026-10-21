import type { CopyEntry, CopyRegistry } from './fields';
import { UNEARNED } from './claims';

// ============= Starter wording, from a brief =============
//
// A new site starts empty on purpose: a shipped default is the same words on every site, and the
// ones it shipped with were this repository's own. Empty is honest and it is also a lot of blank
// boxes. So the site owner describes the business in a few sentences, and every page gets wording
// written for that business, saved as drafts. Nothing reaches a visitor until somebody has read it
// in the preview and published it.
//
// This file decides which boxes get a starter and whether what came back is fit to save. It does
// not call anything, so all of it can be tested.

/** One box offered to the writer, described the way the editor describes it to a person. */
export type StarterField = {
  key: string;
  label: string;
  hint: string;
  kind: 'text' | 'lines' | 'items';
  /** Roughly how long, so a button label does not come back as a paragraph. */
  words: number;
  /** For a list of rows: the boxes in each row that are words. */
  fields?: { key: string; label: string; required: boolean }[];
};

/** Field types with words in them. A picture, a colour or a switch is a decision, not a sentence. */
const WORDS = new Set<CopyEntry['type'] | undefined>([undefined, 'text', 'textarea', 'lines', 'items']);
const ROW_WORDS = new Set([undefined, 'text', 'textarea']);

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** How long a box should be. The shipped wording says it best where there is some; a box that
 *  ships empty is usually a paragraph, since the short ones all have defaults. */
function lengthOf(entry: CopyEntry): number {
  const shipped = wordCount(entry.value);
  if (shipped) return Math.min(120, Math.max(2, shipped));
  return entry.type === 'text' ? 8 : 45;
}

/** The boxes on one page that a starter should be written for.
 *
 *  Not a claim, not a picture or a setting, not an address, and not anything the site has already
 *  written or drafted for itself: a starter fills gaps, it never replaces somebody's own words. */
export function starterFields(
  registry: CopyRegistry,
  written: Set<string>,
  drafted: Set<string>,
): StarterField[] {
  return Object.entries(registry.entries)
    .filter(([key, e]) =>
      !e.claim
      && (!e.store || e.store === 'copy')
      && WORDS.has(e.type)
      && !key.endsWith('.href')
      && !written.has(key)
      && !drafted.has(key))
    .flatMap(([key, e]): StarterField[] => {
      const base = { key, label: e.label, hint: e.hint, words: lengthOf(e) };
      if (e.type !== 'items') return [{ ...base, kind: e.type === 'lines' ? 'lines' : 'text' }];
      const fields = (e.fields ?? [])
        .filter((f) => ROW_WORDS.has(f.type))
        .map((f) => ({ key: f.key, label: f.label, required: !!f.required }));
      // A list whose rows need a picture to appear would be drafted into rows nobody sees.
      const needsMore = (e.fields ?? []).some((f) => f.required && !ROW_WORDS.has(f.type));
      return fields.length && !needsMore ? [{ ...base, kind: 'items', fields }] : [];
    });
}

/** The house rule on dashes, applied rather than requested. The writer is asked for none and
 *  still produces the odd one. */
const noLongDashes = (s: string) => s.replace(/\s*—\s*/g, ', ').replace(/ – /g, ', ').replace(/–/g, '-');

const MAX = 2_000;

/** What came back for one box, made ready to save as a draft, or null to leave the box alone.
 *
 *  Refused rather than repaired when it makes a claim: a starter that says "15 years of
 *  experience" for somebody who has five is worse than an empty box. */
export function acceptStarter(field: StarterField, raw: unknown): string | null {
  const clean = (v: unknown) => (typeof v === 'string' ? noLongDashes(v).trim() : '');
  let value: string;

  if (field.kind === 'items') {
    if (!Array.isArray(raw)) return null;
    const allowed = field.fields ?? [];
    const rows = raw
      .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && !Array.isArray(r))
      .map((r) => Object.fromEntries(allowed.map((f) => [f.key, clean(r[f.key])])))
      .filter((r) => allowed.every((f) => !f.required || r[f.key]))
      .slice(0, 8);
    if (!rows.length) return null;
    if (rows.some((r) => Object.values(r).some((v) => UNEARNED.test(v)))) return null;
    value = JSON.stringify(rows, null, 2);
  } else if (field.kind === 'lines') {
    const lines = (Array.isArray(raw) ? raw : clean(raw).split('\n')).map(clean).filter(Boolean);
    value = lines.join('\n');
  } else {
    value = clean(raw);
  }

  if (!value || value.length > MAX) return null;
  if (field.kind !== 'items' && UNEARNED.test(value)) return null;
  return value;
}
