type FieldType = 'text' | 'textarea' | 'lines' | 'items' | 'image' | 'icon' | 'colour' | 'switch' | 'sections';
/** What a single box inside an item can be. No 'items' or 'lines': a list inside a list inside a
 *  drawer is a place people get lost. */
type ItemFieldType = 'text' | 'textarea' | 'image' | 'icon';
/** One named box within an item.
 *
 *  A box is not always a short string. A philosophy card carries a paragraph and its own list of
 *  principles; a statistic carries an icon; a service carries a photograph. Without a type per
 *  box these would have to become separate keys again, which is the shape this is getting away
 *  from. */
interface ItemField {
    key: string;
    label: string;
    placeholder?: string;
    type?: ItemFieldType;
    /** The page will not render a row without this. Declared here so the editor can say so, rather
     *  than the row being accepted, saved, and silently dropped. */
    required?: boolean;
}
interface CopyEntry {
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
interface CopyRegistry {
    page: string;
    label: string;
    entries: Record<string, CopyEntry>;
}
declare const lines: (text: string) => string[];
/** A list kept as one entry, one item per line, so items can be added and removed by editing it.
 *  A key-value editor cannot grow a list of separate keys; it can grow a textarea. */
declare const list: (text: string) => string[];
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
type Picture = {
    src: string;
    alt: string;
};
declare function picture(text: string): Picture | null;
declare function items<T extends Record<string, string>>(text: string, required?: string[]): T[];

export { type CopyEntry, type CopyRegistry, type FieldType, type ItemField, type ItemFieldType, type Picture, items, lines, list, picture };
