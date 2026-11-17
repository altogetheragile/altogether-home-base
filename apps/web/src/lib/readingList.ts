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
}

export interface Shelf {
  category: ShelfCategory;
  books: ShelfBook[];
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'en-GB');

/** Categories in their order, each with its books: featured first, then by sort order, then by
 *  title so two books with the same number do not swap places between requests.
 *
 *  Drops anything marked hidden, and any book whose category is not on the list. The database has
 *  already done both for a visitor; this is the second lock, and the one the tests can reach. */
export function arrangeShelves(categories: ShelfCategory[], books: ShelfBook[]): Shelf[] {
  const shown = categories
    .filter((c) => c.is_visible !== false)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'en-GB'));
  return shown
    .map((category) => ({
      category,
      books: books
        .filter((b) => b.category_id === category.id && b.is_visible !== false)
        .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order || byTitle(a, b)),
    }))
    .filter((s) => s.books.length > 0);
}

export async function getReadingList(): Promise<Shelf[]> {
  try {
    const supabase = await createClient();
    const [cats, books] = await Promise.all([
      supabase
        .from('reading_categories')
        .select('id, name, slug, description, sort_order, is_visible')
        .eq('is_visible', true),
      supabase
        .from('reading_books')
        .select('id, title, author, category_id, asin, amazon_url, blurb, is_featured, sort_order, is_visible')
        .eq('is_visible', true),
    ]);
    return arrangeShelves((cats.data ?? []) as ShelfCategory[], (books.data ?? []) as ShelfBook[]);
  } catch {
    return [];
  }
}
