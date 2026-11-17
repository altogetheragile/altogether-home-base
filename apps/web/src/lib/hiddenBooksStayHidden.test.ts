import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
import { arrangeShelves, type ShelfBook, type ShelfCategory } from './readingList';
import { filterShelves, arrangeForView, type ListedShelf } from '@/app/resources/reading-list/filterShelves';

// Hidden books and hidden categories never reach a visitor's browser. Three locks, tested here
// from the outside in: the database policy, the page's own query, and the page's arranging.

const cat = (id: string, sort_order: number, is_visible = true): ShelfCategory =>
  ({ id, name: id.toUpperCase(), slug: id, description: null, sort_order, is_visible });
const book = (id: string, category_id: string, extra: Partial<ShelfBook> = {}): ShelfBook => ({
  id, title: id, author: 'A. Author', category_id, asin: null, amazon_url: null, blurb: null,
  is_featured: false, sort_order: 0, is_visible: true, ...extra,
});

describe('the database', () => {
  const dir = resolve(__dirname, '../../../../supabase/migrations');
  const sql = readFileSync(resolve(dir, readdirSync(dir).find((f) => f.endsWith('_a_reading_list.sql'))!), 'utf8');
  const policy = (table: string) => [...sql.matchAll(new RegExp(`create policy "[^"]+" on public\\.${table}\\s+for (\\w+)([^;]*);`, 'g'))];

  it('lets the public read a book only when it and its category are both visible', () => {
    const select = policy('reading_books').filter((p) => p[1] === 'select');
    expect(select).toHaveLength(1);
    expect(select[0][2]).toMatch(/is_visible and exists/);
    expect(select[0][2]).toMatch(/c\.is_visible/);
  });

  it('lets the public read only visible categories', () => {
    const select = policy('reading_categories').filter((p) => p[1] === 'select');
    expect(select).toHaveLength(1);
    expect(select[0][2]).toMatch(/using \(is_visible\)/);
  });

  it('gives the internal notes no public policy and no anonymous grant', () => {
    expect(policy('reading_book_notes').map((p) => p[1])).toEqual(['all']);
    expect(policy('reading_book_notes')[0][2]).toMatch(/is_admin\(\)/);
    expect(sql).not.toMatch(/grant[^;]*on public\.reading_book_notes to anon/);
  });

  it('keeps every write to admins', () => {
    for (const t of ['reading_categories', 'reading_books', 'reading_book_notes']) {
      const writes = policy(t).filter((p) => p[1] !== 'select');
      expect(writes.length, t).toBeGreaterThan(0);
      for (const w of writes) expect(w[2], t).toMatch(/to authenticated using \(public\.is_admin\(\)\) with check \(public\.is_admin\(\)\)/);
    }
  });
});

describe("the page's query", () => {
  const src = readFileSync(resolve(__dirname, 'readingList.ts'), 'utf8');

  it('asks for hidden books only when told to, and the page tells it to only for an admin view', () => {
    const page = readFileSync(resolve(__dirname, '../app/resources/reading-list/page.tsx'), 'utf8');
    expect(page).toMatch(/const admin = await showsAdminView\(\);/);
    expect(page).toMatch(/getReadingList\(\{ includeHidden: admin \}\)/);
    expect(src).toMatch(/includeHidden \? q : q\.eq\('is_visible', true\)/);
  });

  it('keeps hidden books out of the structured data, even on an admin page', () => {
    const page = readFileSync(resolve(__dirname, '../app/resources/reading-list/page.tsx'), 'utf8');
    expect(page).toMatch(/s\.books\.filter\(\(b\) => !b\.hidden\)/);
  });

  it('asks for visible rows itself, because an admin session would otherwise get the hidden ones', () => {
    // One for the categories, one for the books (used for both the cover query and its fallback).
    expect(src.match(/\.eq\('is_visible', true\)/g)).toHaveLength(2);
    expect(src).toMatch(/visibleBooks\(BOOK_COLUMNS\)/);
  });

  it('never reads the internal notes', () => {
    expect(src).not.toMatch(/reading_book_notes|owned_format|source_note/);
    expect(src).not.toMatch(/select\('\*'\)/);
  });
});

describe('arranging the shelves', () => {
  it('drops hidden books, hidden categories, and books whose category is not shown', () => {
    const shelves = arrangeShelves(
      [cat('a', 1), cat('b', 2, false)],
      [book('shown', 'a'), book('hidden', 'a', { is_visible: false }), book('in-hidden-cat', 'b'), book('orphan', 'gone')],
    );
    expect(shelves.map((s) => s.category.id)).toEqual(['a']);
    expect(shelves.flatMap((s) => s.books.map((b) => b.id))).toEqual(['shown']);
  });

  it('keeps hidden books only when an admin page asks, and still drops hidden categories', () => {
    const shelves = arrangeShelves(
      [cat('a', 1), cat('b', 2, false)],
      [book('shown', 'a'), book('hidden', 'a', { is_visible: false }), book('in-hidden-cat', 'b')],
      { includeHidden: true },
    );
    // Same sort order, so by title.
    expect(shelves.flatMap((s) => s.books.map((b) => b.id))).toEqual(['hidden', 'shown']);
  });

  it('orders categories by sort order, then books by sort order and title; favourites are not lifted here', () => {
    const shelves = arrangeShelves(
      [cat('second', 20), cat('first', 10)],
      [
        book('Zed', 'first', { sort_order: 1 }),
        book('Alpha', 'first', { sort_order: 1 }),
        book('Early', 'first', { sort_order: 0 }),
        book('Starred', 'first', { sort_order: 99, is_featured: true }),
        book('Other', 'second'),
      ],
    );
    expect(shelves.map((s) => s.category.id)).toEqual(['first', 'second']);
    expect(shelves[0].books.map((b) => b.id)).toEqual(['Early', 'Alpha', 'Zed', 'Starred']);
  });

  it('leaves out a category with nothing to show', () => {
    expect(arrangeShelves([cat('empty', 1)], [])).toEqual([]);
  });
});

describe('the topic buttons and the search box', () => {
  const shelves: ListedShelf[] = [
    { category: { id: '1', name: 'Scrum', slug: 'scrum', description: null }, books: [
      { id: 'a', title: 'Scrum Mastery', author: 'Geoff Watts', blurb: null, featured: false, href: '#' },
      { id: 'b', title: 'Scrum: A Pocket Guide', author: 'Gunther Verheyen', blurb: null, featured: false, href: '#' },
    ] },
    { category: { id: '2', name: 'Coaching', slug: 'coaching', description: null }, books: [
      { id: 'c', title: 'Coaching Agile Teams', author: 'Lyssa Adkins', blurb: null, featured: false, href: '#' },
      { id: 'd', title: 'Kanban', author: 'Marcus Hammarberg, Joakim Sundén', blurb: null, featured: false, href: '#' },
    ] },
  ];
  const ids = (s: ListedShelf[]) => s.flatMap((x) => x.books.map((b) => b.id));

  it('shows every topic when none is picked', () => {
    expect(ids(filterShelves(shelves, { category: '', query: '' }))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('narrows to one topic', () => {
    expect(ids(filterShelves(shelves, { category: 'coaching', query: '' }))).toEqual(['c', 'd']);
  });

  it('finds by title or author, every word in any order, ignoring case and accents', () => {
    expect(ids(filterShelves(shelves, { category: '', query: 'watts SCRUM' }))).toEqual(['a']);
    expect(ids(filterShelves(shelves, { category: '', query: 'sunden' }))).toEqual(['d']);
  });

  it('combines the two, and drops a topic with no match', () => {
    const out = filterShelves(shelves, { category: 'scrum', query: 'adkins' });
    expect(out).toEqual([]);
  });
});

describe('favourites', () => {
  const fav = (id: string, featured = false) => ({ id, title: id, author: 'Someone', blurb: null, featured, href: '#' });
  const shelves: ListedShelf[] = [
    { category: { id: '1', name: 'Scrum', slug: 'scrum', description: null }, books: [fav('s1'), fav('s2', true)] },
    { category: { id: '2', name: 'Coaching', slug: 'coaching', description: null }, books: [fav('c1', true), fav('c2')] },
  ];

  it('are collected at the top in topic order, and stay in their own topic too', () => {
    const v = arrangeForView(shelves, { category: '', query: '' });
    expect(v.favourites.map((b) => b.id)).toEqual(['s2', 'c1']);
    expect(v.shelves.flatMap((s) => s.books.map((b) => b.id))).toEqual(['s1', 's2', 'c1', 'c2']);
  });

  it('are counted once, though they appear twice', () => {
    expect(arrangeForView(shelves, { category: '', query: '' }).shown).toBe(4);
  });

  it('follow the topic and the search like everything else', () => {
    expect(arrangeForView(shelves, { category: 'coaching', query: '' }).favourites.map((b) => b.id)).toEqual(['c1']);
    expect(arrangeForView(shelves, { category: '', query: 's1' }).favourites).toEqual([]);
  });

  it('keep a topic whose books are all favourites', () => {
    const allFav: ListedShelf[] = [{ category: shelves[0].category, books: [fav('x', true)] }];
    expect(arrangeForView(allFav, { category: '', query: '' }).shelves.map((s) => s.category.slug)).toEqual(['scrum']);
  });
});

describe('the heart and the eye', () => {
  const action = readFileSync(resolve(__dirname, '../app/actions/readingList.ts'), 'utf8');

  it('re-check that the person pressing is an admin, whatever rendered the button', () => {
    expect(action).toMatch(/if \(!\(await isAdmin\(\)\)\) return \{ ok: false/);
  });

  it('can change only the two flags', () => {
    expect(action).toMatch(/const clean: \{ is_featured\?: boolean; is_visible\?: boolean \}/);
    expect(action).not.toMatch(/update\(patch\)/);
  });
});

