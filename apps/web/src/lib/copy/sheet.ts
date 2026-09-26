import type { CopyField } from '@altogether/ui/editor/store';

// ============= The words, as one file =============
//
// Filling a site in the drawer is 204 boxes behind three tabs, reached one page at a time, by
// somebody signed in as an administrator. That is the right tool for changing a heading and the
// wrong one for writing a site from nothing.
//
// So: one file out, one file back. You see everything at once, write in any order, and hand it to
// the person whose words they actually are, who does not need an account or a laptop.
//
// Three rules it holds to:
//
//   Words only. Not switches, not colours, not pictures. A spreadsheet that can turn a module off
//   is a spreadsheet that can take a site down by accident, and the mistake would arrive as two
//   hundred quiet rows.
//
//   Only what is on. A page that is switched off, and a section whose module is off, are left out
//   entirely: asking somebody to write the knowledge base copy for a site with no knowledge base
//   is asking for work with no purpose.
//
//   Nothing is lost by coming back. A blank "new words" cell means "leave it alone", never "make
//   it empty", because a spreadsheet full of blanks is the normal state of a half-finished one.

export type SheetRow = {
  key: string;
  page: string;
  /** Where this field is in the editor, so a row can be found again by hand. */
  where: string;
  label: string;
  hint: string;
  current: string;
  /** What somebody typed. Empty on the way out, and on the way back it means "unchanged". */
  fresh: string;
};

export const COLUMNS = ['key', 'page', 'where', 'label', 'hint', 'current words', 'new words'] as const;

/** Is this a field whose value is words somebody writes? */
export const isWords = (field: { type?: string; key: string }): boolean =>
  !field.type || field.type === 'text' || field.type === 'textarea' || field.type === 'lines';

/** The rows for one page's fields.
 *
 *  `notShown` does the section filtering, because the loader has already worked out which
 *  sections this site does not render and there is no reason to decide it twice. */
export function rowsFor(page: string, label: string, fields: CopyField[]): SheetRow[] {
  return fields
    .filter((f) => isWords(f) && !f.notShown)
    .map((f) => ({
      key: f.key,
      page,
      where: f.group ? `${label} / ${f.group}` : label,
      label: f.label,
      hint: f.hint,
      current: f.value ?? '',
      fresh: '',
    }));
}

const quote = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** Every cell quoted, not just the ones that need it.
 *
 *  Copy has commas in it, and quotes, and newlines: a two-line heading is one cell containing a
 *  line break, which is legal in CSV and is the thing naive writers get wrong. Quoting everything
 *  costs a few bytes and removes the question. */
export function toCsv(rows: SheetRow[]): string {
  const head = COLUMNS.map(quote).join(',');
  const body = rows.map((r) =>
    [r.key, r.page, r.where, r.label, r.hint, r.current, r.fresh].map(quote).join(','),
  );
  // A leading BOM, because Excel opens a plain UTF-8 CSV as Latin-1 and turns every apostrophe
  // in the copy into three characters of mojibake.
  return '﻿' + [head, ...body].join('\r\n') + '\r\n';
}

/** Read a CSV back, including quoted cells with commas and line breaks inside them. */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); out.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((v) => v.trim() !== ''));
}

export type SheetChange = { key: string; page: string; from: string; to: string };
export type SheetReading = {
  changes: SheetChange[];
  /** Rows naming a field this site does not have. Reported rather than ignored: a key that has
   *  been renamed, or a row somebody typed by hand, should be said out loud. */
  unknown: string[];
  /** Rows whose new words are the same as the current ones. Counted, not listed. */
  unchanged: number;
};

/** What a returned file would actually change, against what the site holds now. */
export function readSheet(text: string, known: Map<string, { page: string; value: string }>): SheetReading {
  const rows = parseCsv(text);
  const changes: SheetChange[] = [];
  const unknown: string[] = [];
  let unchanged = 0;

  for (const row of rows) {
    const [key, , , , , , fresh] = row;
    if (!key || key === COLUMNS[0]) continue; // the header
    const field = known.get(key.trim());
    if (!field) { unknown.push(key.trim()); continue; }
    // Blank means "leave it alone". It cannot mean "empty this", or a half-filled sheet would
    // wipe every field somebody had not got to yet.
    if (fresh === undefined || fresh.trim() === '') continue;
    if (fresh === field.value) { unchanged++; continue; }
    changes.push({ key: key.trim(), page: field.page, from: field.value, to: fresh });
  }
  return { changes, unknown, unchanged };
}

/** The changes grouped the way they are saved: one draft write per page. */
export function byPage(changes: SheetChange[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const c of changes) (out[c.page] ??= {})[c.key] = c.to;
  return out;
}
