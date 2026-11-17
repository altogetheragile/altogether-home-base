import { createClient } from '@/lib/supabase/server';

// ============= The reading list, as a visitor may see it =============
//
// Hidden books and hidden categories never leave the server. Row level security already refuses
// them to a visitor; the query asks for visible rows as well, because the server client reads as
// whoever is signed in, and an admin's session can see everything. Without the filter an admin
// would see a page full of books no visitor can, and nothing on it would say which.
//
// Only the public columns are asked for. The internal notes are in a table this page never reads.

export interface ShelfCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_visible?: boolean;
}

export interface ShelfBook {
  id: string;
  title: string;
  author: string;
  category_id: string;
  asin: string | null;
  amazon_url: string | null;
  blurb: string | null;
  is_featured: boolean;
  sort_order: number;
  is_visible?: boolean;
  /** A picture in this project's own storage, or null for a text-only tile. */
  cover_url?: string | null;
}

export interface Shelf {
  category: ShelfCategory;
  books: ShelfBook[];
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'en-GB');

/** Categories in their order, each with its books by sort order, then by title so two books with
 *  the same number do not swap places between requests. Favourites are not sorted first here: the
 *  page lifts them into a group of their own at the top.
 *
 *  Drops hidden categories, and any book whose category is not on the list. Drops hidden books too,
 *  unless `includeHidden` - which only an admin's page asks for, so a hidden book can be shown
 *  again from where it would appear. The database has already refused all of it to a visitor; this
 *  is the second lock, and the one the tests can reach. */
export function arrangeShelves(categories: ShelfCategory[], books: ShelfBook[], { includeHidden = false } = {}): Shelf[] {
  const shown = categories
    .filter((c) => c.is_visible !== false)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'en-GB'));
  return shown
    .map((category) => ({
      category,
      books: books
        .filter((b) => b.category_id === category.id && (includeHidden || b.is_visible !== false))
        .sort((a, b) => a.sort_order - b.sort_order || byTitle(a, b)),
    }))
    .filter((s) => s.books.length > 0);
}

const BOOK_COLUMNS = 'id, title, author, category_id, asin, amazon_url, blurb, is_featured, sort_order, is_visible';

/** `includeHidden` is for an admin's own view of the page, and nothing else. A visitor's session
 *  could not read a hidden book even if this asked; an admin's can, which is the point. */
export async function getReadingList({ includeHidden = false } = {}): Promise<Shelf[]> {
  try {
    const supabase = await createClient();
    const visibleBooks = (columns: string) => {
      const q = supabase.from('reading_books').select(columns);
      return includeHidden ? q : q.eq('is_visible', true);
    };
    const [cats, withCovers] = await Promise.all([
      supabase
        .from('reading_categories')
        .select('id, name, slug, description, sort_order, is_visible')
        .eq('is_visible', true),
      visibleBooks(`${BOOK_COLUMNS}, cover_url`),
    ]);
    // The page and the column that gives books a cover deploy separately. If the column is not
    // there yet, the books are still worth showing without pictures, rather than an empty page.
    const books = withCovers.error ? await visibleBooks(BOOK_COLUMNS) : withCovers;
    return arrangeShelves((cats.data ?? []) as ShelfCategory[], (books.data ?? []) as unknown as ShelfBook[], { includeHidden });
  } catch {
    return [];
  }
}
