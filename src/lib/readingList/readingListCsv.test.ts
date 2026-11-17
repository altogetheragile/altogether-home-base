import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  parseCsv, readReadingListCsv, planImport, writeReadingListCsv, slugify,
  type ExistingBook, type ExistingCategory, type ImportPlan,
} from '@altogether/ui/reading-list-csv';

// The real list stays out of git: the repository is public and the file carries internal notes.
// So the tests run on a small made-up file in the same shape, and the checks against the real one
// run only where it exists, which is on the machine it was exported to.
const REAL = 'data/reading-list.csv';
const hasReal = existsSync(REAL);

const SEED = [
  '\uFEFFShow,Section,Title,Author,Owned,Agile Centre List,Amazon Link',
  'TRUE,Scrum,Scrum Mastery,Geoff Watts,Kindle + Audible,Yes,',
  'TRUE,Scrum,Mastering Professional Scrum,"Stephanie Ockerman, Simon Reindl",Kindle,,',
  'FALSE,Scrum,A Hidden Book,Someone Else,Not found,,',
  'TRUE,"Kanban, Lean And Flow",Kanban,"Marcus Hammarberg, Joakim Sund\u00e9n",Audible,Yes,',
  'TRUE,Coaching,Coaching Agile Teams,Lyssa Adkins,Kindle,,',
  '',
].join('\r\n');
const ROWS = 5;

/** Applies a plan to in-memory tables, the way the seed and Admin apply it to the database. */
function apply(plan: ImportPlan, cats: ExistingCategory[], books: ExistingBook[]) {
  const c = [...cats, ...plan.newCategories.map((n, i) => ({ ...n, id: `c${cats.length + i}` }))];
  const id = (name: string) => c.find((x) => x.name.toLowerCase() === name.toLowerCase())!.id;
  const b: ExistingBook[] = books.map((x) => {
    const u = plan.updates.find((w) => w.id === x.id);
    if (!u) return x;
    const { category, id: _id, ...rest } = u;
    const said = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    return { ...x, ...said, category_id: id(category) };
  });
  plan.inserts.forEach((w, i) => {
    const { category, ...rest } = w;
    b.push({
      asin: null, blurb: null, is_featured: false, ...rest,
      id: `b${books.length + i}`, category_id: id(category),
    } as ExistingBook);
  });
  return { cats: c, books: b };
}

describe('reading the CSV', () => {
  it('handles quotes, commas in quotes, doubled quotes, CRLF and a byte-order mark', () => {
    expect(parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
  });

  it('reads a file: quoted authors, a quoted section, a hidden row, nothing skipped', () => {
    const { books, problems } = readReadingListCsv(SEED);
    expect(problems).toEqual([]);
    expect(books).toHaveLength(ROWS);
    expect(books.filter((b) => b.show)).toHaveLength(ROWS - 1);
    expect(books.find((b) => b.title === 'Mastering Professional Scrum')!.author).toBe('Stephanie Ockerman, Simon Reindl');
    expect(books.some((b) => b.section === 'Kanban, Lean And Flow')).toBe(true);
  });

  it.skipIf(!hasReal)('reads the real list: 152 books, 132 shown, 12 sections, nothing skipped', () => {
    const { books, problems } = readReadingListCsv(readFileSync(REAL, 'utf8'));
    expect(problems).toEqual([]);
    expect(books).toHaveLength(152);
    expect(books.filter((b) => b.show)).toHaveLength(132);
    expect(new Set(books.map((b) => b.section)).size).toBe(12);
    const again = planImport(books, [], []);
    expect(again.inserts).toHaveLength(152);
  });

  it('keeps the internal notes, and leaves the extra columns unsaid when the file has none', () => {
    const [first] = readReadingListCsv(SEED).books;
    expect(first).toMatchObject({ owned: 'Kindle + Audible', sourceNote: 'Yes', amazonUrl: null });
    expect('asin' in first).toBe(false);
  });

  it('skips a row with no title, and says which line', () => {
    const { books, problems } = readReadingListCsv('Show,Section,Title,Author\nTRUE,Scrum,,Nobody\nTRUE,Scrum,A Book,Someone\n');
    expect(books).toHaveLength(1);
    expect(problems).toEqual([{ line: 2, reason: 'No title.' }]);
  });
});

describe('importing', () => {
  const file = readReadingListCsv(SEED).books;

  it('turns a file into its categories and books on an empty list', () => {
    const plan = planImport(file, [], []);
    expect(plan.newCategories.map((c) => c.slug)).toEqual(['scrum', 'kanban-lean-and-flow', 'coaching']);
    expect(plan.inserts).toHaveLength(ROWS);
    expect(plan.updates).toHaveLength(0);
  });

  it('changes nothing the second time: matched on title and author, never duplicated', () => {
    const once = apply(planImport(file, [], []), [], []);
    expect(planImport(file, once.cats, once.books)).toMatchObject({ newCategories: [], inserts: [], updates: [], unchanged: ROWS });
  });

  it('matches whatever the case, and does not wipe an ASIN or link the file leaves empty', () => {
    const once = apply(planImport(file, [], []), [], []);
    const edited = once.books.map((b) => (b.title === 'Scrum Mastery'
      ? { ...b, title: 'SCRUM MASTERY', asin: 'B00ESDUYKA', amazon_url: 'https://www.amazon.co.uk/dp/0957587402' }
      : b));
    const plan = planImport(file, once.cats, edited);
    expect(plan.inserts).toHaveLength(0);
    const update = plan.updates.find((u) => u.title === 'Scrum Mastery')!;
    expect(update.asin).toBeUndefined();
    expect(update.amazon_url).toBe('https://www.amazon.co.uk/dp/0957587402');
  });

  it('round-trips an export', () => {
    const once = apply(planImport(file, [], []), [], []);
    const name = new Map(once.cats.map((c) => [c.id, c.name]));
    const csv = writeReadingListCsv(once.books.map((b) => ({ ...b, category: name.get(b.category_id)! })));
    expect(planImport(readReadingListCsv(csv).books, once.cats, once.books)).toMatchObject({ inserts: [], updates: [], unchanged: ROWS });
  });

  it('makes an address from a category name', () => {
    expect(slugify('Kanban, Lean And Flow')).toBe('kanban-lean-and-flow');
    expect(slugify('Strategy And Decision-Making')).toBe('strategy-and-decision-making');
    expect(slugify('AI & Work')).toBe('ai-and-work');
  });
});
