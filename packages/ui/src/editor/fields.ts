// ============= The shape of the site's words =============
//
// Pure: no request, no server client, no framework. That started as a fix for a client component
// dragging next/headers into the browser bundle, and it is now what lets both apps share the
// editor at all. Nothing here may import anything that touches a request or a router.

// ============= What kind of thing a field is =============
//
// Everything used to be a string, which is why a list of badges ended up stored as
// "name | image | link" with one per line. Structure had nowhere to go, so it got smuggled into
// punctuation, and the person editing had to know the field order and never type a pipe.
//
// A field now says what it is, and the editor draws the right control. "items" is the one that
// earns its keep: a list of objects, stored as JSON, which the editor shows as rows with named
// boxes and Add and Remove buttons. Adding a fourth statistic stops being a code change.
// `picture` and `Picture` live in brand.ts now, beside the code that reads a stored image back.
// They were here, next to the box that writes them, and the readers on the other side of the
// application never saw them: every uploaded brand image was written as {src, alt} and read as
// though it were a bare URL, so it was dropped.
export { picture, type Picture } from '../brand';

export type FieldType =
  | 'text' | 'textarea' | 'lines' | 'items' | 'image' | 'icon' | 'colour' | 'switch' | 'sections'
  // A named choice. Deliberately not a free-form value: a site holds together because its
  // decisions are few and made once, and a box that accepts any font or any colour is how a
  // page ends up with four type scales and nine oranges.
  | 'choice';

/** What a single box inside an item can be. No 'items' or 'lines': a list inside a list inside a
 *  drawer is a place people get lost. */
export type ItemFieldType = 'text' | 'textarea' | 'image' | 'icon' | 'colour';

/** One named box within an item.
 *
 *  A box is not always a short string. A philosophy card carries a paragraph and its own list of
 *  principles; a statistic carries an icon; a service carries a photograph. Without a type per
 *  box these would have to become separate keys again, which is the shape this is getting away
 *  from. */
export interface ItemField {
  key: string;
  label: string;
  placeholder?: string;
  type?: ItemFieldType;
  /** The page will not render a row without this. Declared here so the editor can say so, rather
   *  than the row being accepted, saved, and silently dropped. */
  required?: boolean;
}

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
  /** Required for 'choice', ignored otherwise. The `note` is shown under the chosen option,
   *  because most people cannot pick a typeface from its name alone. */
  options?: { value: string; label: string; note?: string }[];
  /** Which part of the page this belongs to, for the drawer's headings.
   *
   *  Normally read from the middle of the key, so there is nothing to keep in step. Said here
   *  only where that reading would be wrong: a key with no middle part, or one whose middle is
   *  the field rather than the section it sits in. */
  group?: string;
  /** For 'switch': what on and off actually mean here.
   *
   *  Every switch was a visibility switch once, so the control says "Visible to everyone" and
   *  "Hidden from visitors". On a switch that chooses a style those words describe nothing, and a
   *  status that describes nothing is worse than no status at all. */
  says?: { on: string; off: string };
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
