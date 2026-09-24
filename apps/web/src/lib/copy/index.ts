import { createClient } from '@/lib/supabase/server';
import homeJson from './home.json';
import aboutJson from './about.json';
import coachingJson from './coaching.json';
import contactJson from './contact.json';
import testimonialsJson from './testimonials.json';
import blogJson from './blog.json';
import eventsJson from './events.json';
import examsJson from './exams.json';
import navigationJson from './navigation.json';

// ============= The site's words, editable without a deploy =============
//
// Each page has a JSON registry: the shipped wording, plus the label and note the admin editor
// shows beside it. The registry is the fallback and the seed; `site_copy` holds whatever has been
// edited since, keyed by the same ids.
//
// JSON rather than TypeScript because two things read it and they cannot import each other's
// source: this app renders the page, and scripts/seed-site-copy.mjs writes the rows the editor
// lists. A shared .json needs no build step and no shared package.
//
// If the fetch fails - offline, table missing, RLS - the page renders its shipped wording and says
// nothing. Nobody should see a site with no words in it because a query timed out.

// ============= What kind of thing a field is =============
//
// Everything used to be a string, which is why a list of badges ended up stored as
// "name | image | link" with one per line. Structure had nowhere to go, so it got smuggled into
// punctuation, and the person editing had to know the field order and never type a pipe.
//
// A field now says what it is, and the editor draws the right control. "items" is the one that
// earns its keep: a list of objects, stored as JSON, which the editor shows as rows with named
// boxes and Add and Remove buttons. Adding a fourth statistic stops being a code change.
export type FieldType = 'text' | 'textarea' | 'lines' | 'items';

/** One named box within an item. */
export interface ItemField { key: string; label: string; placeholder?: string }

export interface CopyEntry {
  value: string;
  label: string;
  hint: string;
  /** Defaults to 'textarea', which is what every field was before this existed. */
  type?: FieldType;
  /** Required for 'items', ignored otherwise. */
  fields?: ItemField[];
}
export interface CopyRegistry { page: string; label: string; entries: Record<string, CopyEntry> }

export const REGISTRIES: CopyRegistry[] = [
  homeJson, aboutJson, coachingJson, contactJson, testimonialsJson, blogJson, eventsJson, examsJson,
  navigationJson,
] as CopyRegistry[];

/** Reads a page's copy, with anything saved in `site_copy` laid over the shipped wording. */
export async function getCopy(page: string): Promise<(key: string) => string> {
  const registry = REGISTRIES.find((r) => r.page === page);
  const shipped = registry?.entries ?? {};
  let saved: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_copy').select('key, value').eq('page', page);
    saved = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    /* shipped wording it is */
  }

  return (key: string) => saved[key] ?? shipped[key]?.value ?? '';
}

/** Split on the newlines the registry uses for a deliberate line break in a heading. */
export const lines = (text: string) => text.split('\n');

/** A list kept as one entry, one item per line, so items can be added and removed by editing it.
 *  A key-value editor cannot grow a list of separate keys; it can grow a textarea. */
export const list = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/** A list of objects, stored as JSON.
 *
 *  Defensive on the way out because this is the one value a page cannot render around being
 *  wrong: a malformed array would throw during the render and take the whole page with it, over
 *  a punctuation mistake in a text box. An unparseable value renders as no items, which is the
 *  same as an empty one, and the editor still shows the raw text so it can be repaired.
 *
 *  Entries missing a required field are dropped rather than rendered half-built, for the same
 *  reason the pipe parser dropped short lines: a row typed by a person is a row mid-typing. */
export function items<T extends Record<string, string>>(text: string, required: string[] = []): T[] {
  if (!text?.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (row): row is T =>
      !!row && typeof row === 'object' && !Array.isArray(row) &&
      required.every((f) => typeof (row as Record<string, unknown>)[f] === 'string' && (row as Record<string, string>)[f].trim()),
  );
}
