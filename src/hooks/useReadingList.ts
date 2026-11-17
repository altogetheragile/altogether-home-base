import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ImportPlan, BookWrite } from '@altogether/ui/reading-list-csv';

// Admin's reading list: every book and category, hidden ones included, and the internal notes.
// Row level security lets only an admin read the notes or a hidden row, so none of this works for
// anybody else however it is called.

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface AdminBook {
  id: string;
  title: string;
  author: string;
  category_id: string;
  asin: string | null;
  amazon_url: string | null;
  blurb: string | null;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  owned_format: string | null;
  source_note: string | null;
}

export type BookInput = Omit<AdminBook, 'id'>;

const KEYS = { categories: ['reading-categories'], books: ['reading-books'], tag: ['reading-tag'] } as const;

export function useReadingCategories() {
  return useQuery({
    queryKey: KEYS.categories,
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data, error } = await supabase
        .from('reading_categories')
        .select('id, name, slug, description, sort_order, is_visible')
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReadingBooks() {
  return useQuery({
    queryKey: KEYS.books,
    queryFn: async (): Promise<AdminBook[]> => {
      const { data, error } = await supabase
        .from('reading_books')
        .select('id, title, author, category_id, asin, amazon_url, blurb, is_visible, is_featured, sort_order, reading_book_notes(owned_format, source_note)')
        .order('sort_order')
        .order('title');
      if (error) throw error;
      return (data ?? []).map(({ reading_book_notes: n, ...b }) => {
        const note = Array.isArray(n) ? n[0] : n;
        return { ...b, owned_format: note?.owned_format ?? null, source_note: note?.source_note ?? null };
      });
    },
  });
}

/** The Associates tag and the module switch, which live on site_settings with everything else. */
export function useReadingSettings() {
  return useQuery({
    queryKey: KEYS.tag,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, amazon_associate_tag, show_reading_list')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** One way to write anything here: do it, then refetch what it touched. Optimistic updates would
 *  make the one-click show/hide feel faster, but a switch that flips back a second later because
 *  the write failed is worse than one that takes a moment. */
function useWrite<T>(fn: (input: T) => Promise<void>, touches: (keyof typeof KEYS)[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(touches.map((k) => qc.invalidateQueries({ queryKey: KEYS[k] }))),
  });
}

const check = ({ error }: { error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
};

const bookRow = (b: BookInput) => {
  const { owned_format: _o, source_note: _s, ...row } = b;
  return row;
};

export function useSaveBook() {
  return useWrite(async ({ id, book }: { id?: string; book: BookInput }) => {
    let bookId = id;
    if (id) check(await supabase.from('reading_books').update(bookRow(book)).eq('id', id));
    else {
      const res = await supabase.from('reading_books').insert(bookRow(book)).select('id').single();
      check(res);
      bookId = res.data!.id;
    }
    check(await supabase.from('reading_book_notes').upsert({
      book_id: bookId!, owned_format: book.owned_format, source_note: book.source_note,
    }));
  }, ['books']);
}

export function useUpdateBooks() {
  return useWrite(async ({ ids, patch }: { ids: string[]; patch: Partial<Pick<AdminBook, 'is_visible' | 'category_id' | 'is_featured'>> }) => {
    if (ids.length) check(await supabase.from('reading_books').update(patch).in('id', ids));
  }, ['books']);
}

export function useDeleteBook() {
  return useWrite(async (id: string) => {
    check(await supabase.from('reading_books').delete().eq('id', id));
  }, ['books']);
}

export function useSaveCategory() {
  return useWrite(async ({ id, patch }: { id?: string; patch: Partial<Omit<AdminCategory, 'id'>> }) => {
    if (id) check(await supabase.from('reading_categories').update(patch).eq('id', id));
    else check(await supabase.from('reading_categories').insert(patch as Omit<AdminCategory, 'id'>));
  }, ['categories']);
}

/** Writes every category's position at once, so two with the same number cannot stay tied. */
export function useOrderCategories() {
  return useWrite(async (ids: string[]) => {
    for (const [i, id] of ids.entries()) {
      check(await supabase.from('reading_categories').update({ sort_order: (i + 1) * 10 }).eq('id', id));
    }
  }, ['categories']);
}

/** Deletes a category, moving its books to another first when asked. The database refuses to
 *  delete a category that still has books, so without a destination this fails rather than
 *  losing anything. */
export function useDeleteCategory() {
  return useWrite(async ({ id, moveTo }: { id: string; moveTo?: string }) => {
    if (moveTo) check(await supabase.from('reading_books').update({ category_id: moveTo }).eq('category_id', id));
    check(await supabase.from('reading_categories').delete().eq('id', id));
  }, ['categories', 'books']);
}

export function useSaveReadingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { amazon_associate_tag?: string | null; show_reading_list?: boolean } }) => {
      check(await supabase.from('site_settings').update(patch).eq('id', id));
    },
    // The menu reads the switch from the site's own settings query, so that is refetched too.
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: KEYS.tag }),
      qc.invalidateQueries({ queryKey: ['site-settings'] }),
    ]),
  });
}

export const READING_KEYS = KEYS;

/** Applies an import plan (from planImport in @altogether/ui/reading-list-csv): new categories
 *  first, so the books have somewhere to go, then new books, then changed ones. */
export function useApplyImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: ImportPlan) => {
      if (plan.newCategories.length) {
        check(await supabase.from('reading_categories').insert(plan.newCategories.map((c) => ({ ...c, is_visible: true }))));
      }
      const cats = await supabase.from('reading_categories').select('id, name');
      check(cats);
      const catId = (name: string) => cats.data!.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())?.id;
      const row = (w: BookWrite) => {
        const category_id = catId(w.category);
        if (!category_id) throw new Error(`No category called ${w.category}.`);
        return {
          title: w.title, author: w.author, category_id, is_visible: w.is_visible, amazon_url: w.amazon_url,
          sort_order: w.sort_order,
          ...(w.asin !== undefined ? { asin: w.asin } : {}),
          ...(w.blurb !== undefined ? { blurb: w.blurb } : {}),
          ...(w.is_featured !== undefined ? { is_featured: w.is_featured } : {}),
        };
      };
      if (plan.inserts.length) {
        const added = await supabase.from('reading_books').insert(plan.inserts.map(row)).select('id, title, author');
        check(added);
        const idOf = new Map(added.data!.map((b) => [`${b.title}\u0000${b.author}`, b.id]));
        check(await supabase.from('reading_book_notes').upsert(plan.inserts.map((w) => ({
          book_id: idOf.get(`${w.title}\u0000${w.author}`)!, owned_format: w.owned_format, source_note: w.source_note,
        }))));
      }
      for (const w of plan.updates) {
        check(await supabase.from('reading_books').update(row(w)).eq('id', w.id));
        check(await supabase.from('reading_book_notes').upsert({ book_id: w.id, owned_format: w.owned_format, source_note: w.source_note }));
      }
    },
    onSettled: () => Promise.all([
      qc.invalidateQueries({ queryKey: KEYS.categories }),
      qc.invalidateQueries({ queryKey: KEYS.books }),
    ]),
  });
}
