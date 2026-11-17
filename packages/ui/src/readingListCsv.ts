// ============= The reading list as a spreadsheet =============
//
// One shape in and out, so a file exported from Admin can be edited and imported again, and the
// seed script and Admin's import read a file the same way. Shared because they are two programs:
// the seed is a Node script, the import is the App.
//
// Columns, as data/reading-list.csv has them:
//   Show, Section, Title, Author, Owned, Agile Centre List, Amazon Link
// Export adds ASIN, Blurb, Featured and Sort Order after them. Import reads those when present and
// leaves the book's value alone when the column is absent, so the original seven-column file can
// still be imported without wiping ASINs that were added in Admin since.

export const CSV_COLUMNS = ['Show', 'Section', 'Title', 'Author', 'Owned', 'Agile Centre List', 'Amazon Link'] as const;
export const CSV_EXTRA_COLUMNS = ['ASIN', 'Blurb', 'Featured', 'Sort Order'] as const;

/** Parses CSV text into rows of cells. Handles quoted cells, doubled quotes, commas and line breaks
 *  inside quotes, CRLF, and the byte-order mark Excel writes at the start of a UTF-8 file. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const quote = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return `${rows.map((r) => r.map((v) => quote(v == null ? '' : String(v))).join(',')).join('\r\n')}\r\n`;
}

/** One book as the spreadsheet describes it. `undefined` means "the file did not say", which an
 *  import must leave alone; `null` means "the file says empty". */
export interface CsvBook {
  show: boolean;
  section: string;
  title: string;
  author: string;
  owned: string | null;
  sourceNote: string | null;
  amazonUrl: string | null;
  asin?: string | null;
  blurb?: string | null;
  featured?: boolean;
  sortOrder?: number;
}

export interface CsvReadResult {
  books: CsvBook[];
  /** Rows that could not be read, with the line number a person would see in a spreadsheet. */
  problems: { line: number; reason: string }[];
}

const yes = (v: string) => /^(true|yes|y|1)$/i.test(v.trim());
const orNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export function readReadingListCsv(text: string): CsvReadResult {
  const [header, ...body] = parseCsv(text);
  if (!header) return { books: [], problems: [{ line: 1, reason: 'The file is empty.' }] };
  const at = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const col = Object.fromEntries([...CSV_COLUMNS, ...CSV_EXTRA_COLUMNS].map((n) => [n, at(n)])) as Record<string, number>;
  const missing = ['Section', 'Title'].filter((n) => col[n] < 0);
  if (missing.length) return { books: [], problems: [{ line: 1, reason: `No ${missing.join(' or ')} column.` }] };

  const books: CsvBook[] = [];
  const problems: CsvReadResult['problems'] = [];
  body.forEach((r, i) => {
    const line = i + 2;
    const get = (n: string) => (col[n] >= 0 ? r[col[n]] ?? '' : undefined);
    const title = (get('Title') ?? '').trim();
    const section = (get('Section') ?? '').trim();
    if (!title) { problems.push({ line, reason: 'No title.' }); return; }
    if (!section) { problems.push({ line, reason: `"${title}" has no section.` }); return; }
    const book: CsvBook = {
      // No Show column at all means every row is shown.
      show: get('Show') === undefined ? true : yes(get('Show')!),
      section,
      title,
      author: (get('Author') ?? '').trim(),
      owned: orNull(get('Owned')),
      sourceNote: orNull(get('Agile Centre List')),
      amazonUrl: orNull(get('Amazon Link')),
    };
    if (get('ASIN') !== undefined) book.asin = orNull(get('ASIN'))?.toUpperCase() ?? null;
    if (get('Blurb') !== undefined) book.blurb = orNull(get('Blurb'));
    if (get('Featured') !== undefined) book.featured = yes(get('Featured')!);
    if (get('Sort Order') !== undefined && get('Sort Order')!.trim() !== '') {
      const n = Number(get('Sort Order'));
      if (Number.isFinite(n)) book.sortOrder = Math.round(n);
    }
    books.push(book);
  });
  return { books, problems };
}

/** The key a book is matched on: title and author, case and spacing ignored. The database's unique
 *  index is on the same thing, so the two cannot disagree about what a duplicate is. */
export const bookKey = (title: string, author: string) =>
  `${title.trim().toLowerCase()}\u0000${author.trim().toLowerCase()}`;

/** "Kanban, Lean And Flow" -> "kanban-lean-and-flow". */
export function slugify(name: string): string {
  return name
    .normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';
}

export interface ExportBook {
  title: string;
  author: string;
  category: string;
  is_visible: boolean;
  owned_format: string | null;
  source_note: string | null;
  amazon_url: string | null;
  asin: string | null;
  blurb: string | null;
  is_featured: boolean;
  sort_order: number;
}

export function writeReadingListCsv(books: ExportBook[]): string {
  return toCsv([
    [...CSV_COLUMNS, ...CSV_EXTRA_COLUMNS],
    ...books.map((b) => [
      b.is_visible ? 'TRUE' : 'FALSE', b.category, b.title, b.author, b.owned_format, b.source_note, b.amazon_url,
      b.asin, b.blurb, b.is_featured ? 'TRUE' : 'FALSE', b.sort_order,
    ]),
  ]);
}

// ── Importing: what would change ────────────────────────────────────────────────────────────────
//
// Worked out before anything is written, so Admin can say "12 new, 3 updated, 137 unchanged" and
// the seed script can do a dry run. Matching is on title and author; a matched book is updated in
// place, never duplicated, and keeps everything the file does not mention.

export interface ExistingCategory { id: string; name: string; slug: string; sort_order: number }
export interface ExistingBook {
  id: string; title: string; author: string; category_id: string; is_visible: boolean;
  asin: string | null; amazon_url: string | null; blurb: string | null; is_featured: boolean; sort_order: number;
  owned_format: string | null; source_note: string | null;
}

export interface BookWrite {
  title: string; author: string; category: string; is_visible: boolean; amazon_url: string | null;
  asin?: string | null; blurb?: string | null; is_featured?: boolean; sort_order: number;
  owned_format: string | null; source_note: string | null;
}

export interface ImportPlan {
  /** Sections in the file with no category yet, in the order the file first names them. */
  newCategories: { name: string; slug: string; sort_order: number }[];
  inserts: BookWrite[];
  updates: (BookWrite & { id: string })[];
  unchanged: number;
  /** The same title and author twice in one file. The later row wins; this says so. */
  duplicates: string[];
}

const sameText = (a: string | null | undefined, b: string | null | undefined) => (a ?? '') === (b ?? '');

export function planImport(file: CsvBook[], categories: ExistingCategory[], books: ExistingBook[]): ImportPlan {
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
  const usedSlugs = new Set(categories.map((c) => c.slug));
  let nextCatOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
  const newCategories: ImportPlan['newCategories'] = [];
  for (const b of file) {
    const k = b.section.trim().toLowerCase();
    if (byName.has(k) || newCategories.some((n) => n.name.toLowerCase() === k)) continue;
    let slug = slugify(b.section);
    for (let i = 2; usedSlugs.has(slug); i += 1) slug = `${slugify(b.section)}-${i}`;
    usedSlugs.add(slug);
    nextCatOrder += 10;
    newCategories.push({ name: b.section.trim(), slug, sort_order: nextCatOrder });
  }
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name.trim().toLowerCase() ?? '';

  const existing = new Map(books.map((b) => [bookKey(b.title, b.author), b]));
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  // A later row for the same book replaces the earlier one rather than writing twice.
  const rows: CsvBook[] = [];
  for (const b of file) {
    const k = bookKey(b.title, b.author);
    if (seen.has(k)) { duplicates.push(b.title); rows[seen.get(k)!] = b; continue; }
    seen.set(k, rows.length);
    rows.push(b);
  }

  // New books go after the books already in their category, in the order the file lists them.
  const lastOrder = new Map<string, number>();
  for (const b of books) {
    const name = categoryName(b.category_id);
    lastOrder.set(name, Math.max(lastOrder.get(name) ?? 0, b.sort_order));
  }

  const inserts: BookWrite[] = [];
  const updates: ImportPlan['updates'] = [];
  let unchanged = 0;
  for (const b of rows) {
    const cat = b.section.trim().toLowerCase();
    const was = existing.get(bookKey(b.title, b.author));
    if (!was) {
      const order = b.sortOrder ?? (lastOrder.get(cat) ?? 0) + 10;
      lastOrder.set(cat, Math.max(lastOrder.get(cat) ?? 0, order));
      inserts.push({
        title: b.title, author: b.author, category: b.section.trim(), is_visible: b.show, amazon_url: b.amazonUrl,
        asin: b.asin ?? null, blurb: b.blurb ?? null, is_featured: b.featured ?? false, sort_order: order,
        owned_format: b.owned, source_note: b.sourceNote,
      });
      continue;
    }
    const write: BookWrite & { id: string } = {
      id: was.id, title: b.title, author: b.author, category: b.section.trim(), is_visible: b.show,
      // The original file's Amazon Link column is empty. Empty does not wipe a link set in Admin.
      amazon_url: b.amazonUrl ?? was.amazon_url,
      sort_order: b.sortOrder ?? was.sort_order,
      owned_format: b.owned, source_note: b.sourceNote,
    };
    if (b.asin !== undefined) write.asin = b.asin;
    if (b.blurb !== undefined) write.blurb = b.blurb;
    if (b.featured !== undefined) write.is_featured = b.featured;
    const same = categoryName(was.category_id) === cat && was.is_visible === write.is_visible
      && sameText(was.amazon_url, write.amazon_url) && was.sort_order === write.sort_order
      && sameText(was.owned_format, write.owned_format) && sameText(was.source_note, write.source_note)
      && was.title === write.title && was.author === write.author
      && (write.asin === undefined || sameText(was.asin, write.asin))
      && (write.blurb === undefined || sameText(was.blurb, write.blurb))
      && (write.is_featured === undefined || was.is_featured === write.is_featured);
    if (same) unchanged += 1;
    else updates.push(write);
  }
  return { newCategories, inserts, updates, unchanged, duplicates };
}
