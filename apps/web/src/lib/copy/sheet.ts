import type { CopyField } from '@altogether/ui/editor/store';
import { itemId, parseItems, writeItems } from '@altogether/ui/editor/ids';

// ============= The words, as one file =============
//
// Filling a site in the drawer is 204 boxes behind three tabs, reached one page at a time, by
// somebody signed in as an administrator. That is the right tool for changing a heading and the
// wrong one for writing a site from nothing.
//
// So: one file out, one file back. You see everything at once, write in any order, and hand it to
// the person whose words they actually are, who does not need an account or a laptop.
//
// The rules it holds to:
//
//   Words are the only thing it writes. Not switches, not colours, not pictures. A spreadsheet
//   that can turn a module off is a spreadsheet that can take a site down by accident, and the
//   mistake would arrive as two hundred quiet rows.
//
//   Pictures are listed, read-only. Every row has its ID, so the file accounts for everything on
//   the site, and a picture can be named in it. Changing one stays in the drawer, where it can be
//   uploaded; an address edited in the file is reported and left alone.
//
//   Everything is listed, and says whether it is in use. This used to leave out whatever was
//   switched off, which made the file tidy and also made it impossible to tell "not in the file"
//   from "not on the site". Now each row says, in the status column, and switched-off rows can be
//   sorted to the bottom and ignored. Words written for them still land, as drafts, because
//   writing a section before switching it on is a reasonable way to work.
//
//   The words inside a list - each service, each statistic - are rows too, named by position
//   (ids.ts). Before one is written its "current words" must still be what the site says, so a
//   list reordered since the file went out is refused rather than written into the wrong card.
//
//   Nothing is lost by coming back. A blank "new words" cell means "leave it alone", never "make
//   it empty", because a spreadsheet full of blanks is the normal state of a half-finished one.

export type SheetKind = 'words' | 'picture';

export const STATUS = {
  on: 'On the site',
  pageOff: 'Page switched off',
  sectionOff: 'Section switched off',
} as const;
export type SheetStatus = (typeof STATUS)[keyof typeof STATUS];

/** Where a row sits inside a list, for the words that are one value in a list's JSON. */
export type ListPlace = {
  /** The list's own key. */
  key: string;
  /** Which row, counting from 1. */
  n: number;
  /** Which box in that row. */
  sub: string;
  /** The whole list as the site holds it now, which a change is written into. */
  value: string;
  /** Whether the list has unpublished changes waiting in the drawer. */
  drafted: boolean;
};

export type SheetRow = {
  /** The row's ID: the field's key, or for a box inside a list, its place (see ids.ts). */
  key: string;
  page: string;
  /** Where this field is in the editor, so a row can be found again by hand. */
  where: string;
  label: string;
  kind: SheetKind;
  status: SheetStatus;
  hint: string;
  current: string;
  /** What somebody typed. Empty on the way out, and on the way back it means "unchanged". */
  fresh: string;
  /** Not written to the file. */
  list?: ListPlace;
};

export const COLUMNS = ['id', 'page', 'where', 'label', 'kind', 'status', 'hint', 'current words', 'new words'] as const;

/** Is this a field whose value is words somebody writes? */
export const isWords = (field: { type?: string; key: string }): boolean =>
  !field.type || field.type === 'text' || field.type === 'textarea' || field.type === 'lines';

const isWordsBox = (type?: string) => !type || type === 'text' || type === 'textarea';

/** The rows for one page's fields.
 *
 *  `notShown` comes from the loader, which has already worked out which sections this site does
 *  not render; `pageOn` from the caller, which knows whether the whole page is switched off. */
export function rowsFor(page: string, label: string, fields: CopyField[], pageOn = true): SheetRow[] {
  const out: SheetRow[] = [];
  for (const f of fields) {
    const status: SheetStatus = !pageOn ? STATUS.pageOff : f.notShown ? STATUS.sectionOff : STATUS.on;
    const where = f.group ? `${label} / ${f.group}` : label;
    const base = { page, status, fresh: '' };

    if (isWords(f) || f.type === 'image') {
      out.push({
        ...base, key: f.key, where, label: f.label, hint: f.hint,
        kind: f.type === 'image' ? 'picture' : 'words', current: f.value ?? '',
      });
      continue;
    }
    // A list: one row per box that is words or a picture, in every row it has. An empty list has
    // no rows to write into; adding a card is done in the drawer.
    if (f.type === 'items' && f.fields) {
      parseItems(f.value ?? '').forEach((row, i) => {
        for (const sub of f.fields!) {
          if (!isWordsBox(sub.type) && sub.type !== 'image') continue;
          out.push({
            ...base,
            key: itemId(f.key, i + 1, sub.key),
            where: `${where} / ${f.label} ${i + 1}`,
            label: sub.label,
            hint: '',
            kind: sub.type === 'image' ? 'picture' : 'words',
            current: row[sub.key] ?? '',
            list: { key: f.key, n: i + 1, sub: sub.key, value: f.value ?? '', drafted: Boolean(f.draft) },
          });
        }
      });
    }
  }
  return out;
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
    [r.key, r.page, r.where, r.label, r.kind, r.status, r.hint, r.current, r.fresh].map(quote).join(','),
  );
  // A leading BOM, because Excel opens a plain UTF-8 CSV as Latin-1 and turns every apostrophe
  // in the copy into three characters of mojibake.
  return '﻿' + [head, ...body].join('\r\n') + '\r\n';
}

/** Which character separates the cells.
 *
 *  Excel writes semicolons wherever the system list separator is one, which is most of continental
 *  Europe and any machine whose region has been changed. The file still says .csv and still opens
 *  correctly for the person who saved it, and arrives here as one enormous cell per line. Sniffed
 *  from the first line rather than assumed, because assuming is what makes it look like an empty
 *  file rather than a readable one. */
export function separatorOf(text: string): ',' | ';' | '\t' {
  const first = text.replace(/^\ufeff/, '').split(/\r?\n/)[0] ?? '';
  const outside = first.replace(/"[^"]*"/g, '');
  const counts = { ',': 0, ';': 0, '\t': 0 };
  for (const c of outside) if (c in counts) counts[c as keyof typeof counts]++;
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ',' | ';' | '\t');
}

/** Read a CSV back, including quoted cells with commas and line breaks inside them. */
export function parseCsv(text: string, separator = separatorOf(text)): string[][] {
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
    if (c === separator) { row.push(cell); cell = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); out.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((v) => v.trim() !== ''));
}

export type SheetChange = { key: string; page: string; from: string; to: string; list?: ListPlace };

/** What the site holds for one ID now, for comparing a returned file against. */
export type Known = { page: string; value: string; kind?: SheetKind; list?: ListPlace };

export type SheetReading = {
  changes: SheetChange[];
  /** Rows naming a field this site does not have. Reported rather than ignored: a key that has
   *  been renamed, or a row somebody typed by hand, should be said out loud. */
  unknown: string[];
  /** Picture rows with a new address in them. Pictures are changed in the drawer, so these are
   *  left alone, and said so. */
  pictures: string[];
  /** Rows inside a list that cannot be written safely, and why: the list has changed since the
   *  file went out, so the row may now be a different card. */
  refused: { key: string; why: string }[];
  /** Rows whose new words are the same as the current ones. Counted, not listed. */
  unchanged: number;
  /** Enough to tell four different nothings apart: a file that did not parse, one whose rows name
   *  nothing here, one nobody filled in, and one filled in with what was already there. Without
   *  these they all arrive as "nothing is different", which is true and useless. */
  rows: number;
  matched: number;
  blank: number;
  columns: number;
  /** How many columns a row needs for its new words to be read. */
  expected: number;
  separator: string;
};

/** Which column holds what. By name, from the header, so a column moved or added in a spreadsheet
 *  does not shift every read by one. A file from before the header had names that could be relied
 *  on - seven columns, the ID first, the new words last - is read by position. */
function columnsOf(header: string[] | undefined): { id: number; current: number; fresh: number; named: boolean } {
  const names = (header ?? []).map((h) => h.trim().toLowerCase());
  const at = (name: string) => names.indexOf(name);
  const fresh = at('new words');
  if (fresh === -1) return { id: 0, current: 5, fresh: 6, named: false };
  const id = at('id') !== -1 ? at('id') : at('key') !== -1 ? at('key') : 0;
  return { id, current: at('current words'), fresh, named: true };
}

/** What a returned file would actually change, against what the site holds now. */
export function readSheet(text: string, known: Map<string, Known>): SheetReading {
  const separator = separatorOf(text);
  const parsed = parseCsv(text, separator);
  const col = columnsOf(parsed[0]);
  const changes: SheetChange[] = [];
  const unknown: string[] = [];
  const pictures: string[] = [];
  const refused: { key: string; why: string }[] = [];
  let unchanged = 0;
  let matched = 0;
  let blank = 0;
  let rows = 0;

  parsed.forEach((row, i) => {
    const key = row[col.id]?.trim();
    if (!key || (i === 0 && (col.named || key === 'key' || key === 'id'))) return; // the header
    rows++;
    const field = known.get(key);
    if (!field) { unknown.push(key); return; }
    matched++;
    const fresh = row[col.fresh];
    // Blank means "leave it alone". It cannot mean "empty this", or a half-filled sheet would
    // wipe every field somebody had not got to yet.
    if (fresh === undefined || fresh.trim() === '') { blank++; return; }
    if (fresh === field.value) { unchanged++; return; }
    if (field.kind === 'picture') { pictures.push(key); return; }
    if (field.list) {
      // A list row is named by its position, and a position means a different card once the
      // list is reordered. The file says what the box held when it went out; if the site says
      // something else now, this row is not safe to write.
      const then = col.current >= 0 ? row[col.current] : undefined;
      if (then === undefined || then.replace(/\r/g, '').trim() !== field.value.trim()) {
        refused.push({ key, why: 'that list has changed since the file was downloaded' });
        return;
      }
      if (field.list.drafted) {
        refused.push({ key, why: 'that list has unpublished changes in the editor' });
        return;
      }
    }
    changes.push({ key, page: field.page, from: field.value, to: fresh, ...(field.list ? { list: field.list } : {}) });
  });
  const columns = parsed.reduce((n, r) => Math.max(n, r.length), 0);
  return { changes, unknown, pictures, refused, unchanged, rows, matched, blank, columns, expected: col.fresh + 1, separator };
}

/** Why a file changed nothing, said in the terms the person is looking at.
 *
 *  "Nothing in that file is different from what the site already says" was the only answer for
 *  four different situations, three of which are a file that did not work rather than a file with
 *  no edits in it. Somebody who has just spent ten minutes typing deserves better than that. */
export function whyNothing(reading: SheetReading): string | null {
  if (reading.changes.length) return null;
  const sep = reading.separator === ';' ? 'semicolons' : reading.separator === '\t' ? 'tabs' : 'commas';

  if (reading.rows === 0) {
    return 'No rows could be read from that file. It may have been saved in another format: it needs to be a CSV, not a spreadsheet workbook.';
  }
  if (reading.columns < reading.expected) {
    return `Each row came back with ${reading.columns} column${reading.columns === 1 ? '' : 's'} rather than ${reading.expected}, and the cells are separated by ${sep}. The last column is the one that is read, so nothing could be. Saving again as CSV usually settles it.`;
  }
  if (reading.matched === 0) {
    return `None of the ${reading.rows} rows names anything this site has. That usually means the first column was moved or edited: it holds the ID each row is matched on and has to be left alone.`;
  }
  if (reading.refused.length) {
    return `${reading.refused.length} row${reading.refused.length === 1 ? '' : 's'} inside a list could not be written: ${reading.refused[0].why}. Download a fresh file and copy the new words across.`;
  }
  if (reading.pictures.length) {
    return `The only changes were to ${reading.pictures.length === 1 ? 'a picture' : `${reading.pictures.length} pictures`}, and pictures are changed on the page itself, in the editor, where they can be uploaded.`;
  }
  if (reading.blank === reading.matched) {
    return `All ${reading.matched} rows were read, and every one of them has an empty last column. New words go in the final column, "new words". The one before it, "current words", is what the site says now and is ignored.`;
  }
  return `${reading.matched} rows were read and ${reading.unchanged} came back with the same words the site already has, so there is nothing to save.`;
}

/** The changes grouped the way they are saved: one draft write per page.
 *
 *  A change inside a list is written into the whole list, because the list is one value. Every
 *  change to the same list goes into one copy of it, or the second would undo the first. */
export function byPage(changes: SheetChange[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const lists = new Map<string, { page: string; rows: ReturnType<typeof parseItems> }>();
  for (const c of changes) {
    if (!c.list) { (out[c.page] ??= {})[c.key] = c.to; continue; }
    let list = lists.get(c.list.key);
    if (!list) { list = { page: c.page, rows: parseItems(c.list.value) }; lists.set(c.list.key, list); }
    const row = list.rows[c.list.n - 1];
    if (row) list.rows[c.list.n - 1] = { ...row, [c.list.sub]: c.to };
  }
  for (const [key, list] of lists) (out[list.page] ??= {})[key] = writeItems(list.rows);
  return out;
}
