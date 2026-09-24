// ============= The shape of the site's words, without the server =============
//
// Split out of index.ts, which reaches for the Supabase server client and therefore next/headers.
// The editor's controls are client components and need these types and helpers; importing them
// from index.ts pulled the server client into the browser bundle and the whole app returned 500
// with "You're importing a component that needs next/headers".
//
// Nothing in this file may import anything that touches a request. index.ts re-exports all of it,
// so callers that are already on the server need not know the split exists.

// ============= What kind of thing a field is =============
//
// Everything used to be a string, which is why a list of badges ended up stored as
// "name | image | link" with one per line. Structure had nowhere to go, so it got smuggled into
// punctuation, and the person editing had to know the field order and never type a pipe.
//
// A field now says what it is, and the editor draws the right control. "items" is the one that
// earns its keep: a list of objects, stored as JSON, which the editor shows as rows with named
// boxes and Add and Remove buttons. Adding a fourth statistic stops being a code change.
export type FieldType =
  | 'text' | 'textarea' | 'lines' | 'items' | 'image' | 'icon' | 'colour' | 'switch' | 'sections';

/** What a single box inside an item can be. No 'items' or 'lines': a list inside a list inside a
 *  drawer is a place people get lost. */
export type ItemFieldType = 'text' | 'textarea' | 'image' | 'icon';

/** One named box within an item.
 *
 *  A box is not always a short string. A philosophy card carries a paragraph and its own list of
 *  principles; a statistic carries an icon; a service carries a photograph. Without a type per
 *  box these would have to become separate keys again, which is the shape this is getting away
 *  from. */
export interface ItemField { key: string; label: string; placeholder?: string; type?: ItemFieldType }

export interface CopyEntry {
  value: string;
  label: string;
  hint: string;
  /** Where this field's value actually lives.
   *
   *  The editor used to be the site_copy editor. It is the site editor now, and the words, the
   *  brand and the founder live in different places: rows in site_copy, columns on site_settings,
   *  keys inside the brand JSON. A field says which, and one code path handles all three, so
   *  there is one thing to learn rather than an admin page per store. */
  store?: 'copy' | 'column' | 'brand';
  /** For 'column' and 'brand': where in that store. A brand path is dotted, e.g. images.logo. */
  path?: string;
  /** Defaults to 'textarea', which is what every field was before this existed. */
  type?: FieldType;
  /** Required for 'items', ignored otherwise. */
  fields?: ItemField[];
}
export interface CopyRegistry { page: string; label: string; entries: Record<string, CopyEntry> }

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
/** A picture and the words that stand in for it.
 *
 *  Stored together, as one value, deliberately. Alt text kept in a separate key beside the image
 *  is alt text that goes stale the first time somebody changes the picture and not the sentence,
 *  and nobody notices because the only people who read it cannot see the picture. */
export type Picture = { src: string; alt: string };

export function picture(text: string): Picture | null {
  if (!text?.trim()) return null;
  try {
    const p = JSON.parse(text);
    if (p && typeof p === 'object' && typeof p.src === 'string' && p.src.trim()) {
      return { src: p.src.trim(), alt: typeof p.alt === 'string' ? p.alt : '' };
    }
  } catch {
    // A bare URL, which is what a hand-edited value tends to be.
    if (/^(https?:\/\/|\/)\S+$/.test(text.trim())) return { src: text.trim(), alt: '' };
  }
  return null;
}

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
