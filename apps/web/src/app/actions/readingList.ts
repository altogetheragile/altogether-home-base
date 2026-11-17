'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';

// The heart and the eye on the reading list, pressed by an admin standing on the page.
//
// Three locks, as everywhere on the Site: the buttons only render for an admin, this re-checks,
// and row level security refuses the write to anybody else whatever this does. Only two flags can
// be changed from here; everything else about a book is Admin's.

export type FlagResult = { ok: true } | { ok: false; error: string };

export async function setBookFlags(
  id: string,
  patch: { is_featured?: boolean; is_visible?: boolean },
): Promise<FlagResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'No such book.' };

  const clean: { is_featured?: boolean; is_visible?: boolean } = {};
  if (typeof patch?.is_featured === 'boolean') clean.is_featured = patch.is_featured;
  if (typeof patch?.is_visible === 'boolean') clean.is_visible = patch.is_visible;
  if (!Object.keys(clean).length) return { ok: false, error: 'Nothing to change.' };

  const supabase = await createClient();
  const { data, error } = await supabase.from('reading_books').update(clean).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  // Row level security answers a refused write with no rows, not an error.
  if (!data?.length) return { ok: false, error: 'That book could not be changed.' };

  revalidatePath('/resources/reading-list');
  return { ok: true };
}

/** Where an uploaded cover may live: this project's own storage, in the reading list's folder. A
 *  cover is shown to every visitor, so the address is checked here rather than trusted from the
 *  browser, which could otherwise point a tile at any picture anywhere. */
function coverFolder(): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/assets/reading-covers/`;
}

/** Sets a book's cover to one an admin has just uploaded from the page. Marked as chosen by hand,
 *  so the Open Library script never replaces it. */
export async function setBookCover(id: string, url: string): Promise<FlagResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'No such book.' };
  const folder = coverFolder();
  if (typeof url !== 'string' || !url.startsWith(folder) || !/^[\w.-]+$/.test(url.slice(folder.length))) {
    return { ok: false, error: 'That picture is not in the reading list covers folder.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('reading_books')
    .update({ cover_url: url, cover_source: 'upload' }).eq('id', id).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data?.length) return { ok: false, error: 'That book could not be changed.' };

  revalidatePath('/resources/reading-list');
  return { ok: true };
}

export type AddResult = { ok: true; id: string } | { ok: false; error: string };

/** Adds a book from the page itself. Shown to visitors at once, at the end of its topic. The cover,
 *  if any, must already be in the covers folder: the lookup put it there, or it was uploaded. */
export async function addBook(input: {
  title: string;
  author: string;
  category_id: string;
  asin: string | null;
  cover_url: string | null;
}): Promise<AddResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const title = String(input?.title ?? '').trim().slice(0, 300);
  const author = String(input?.author ?? '').trim().slice(0, 300);
  if (!title) return { ok: false, error: 'A book needs a title.' };
  if (!/^[0-9a-f-]{36}$/i.test(String(input?.category_id ?? ''))) return { ok: false, error: 'Choose a topic.' };
  const asin = input?.asin ? String(input.asin).trim().toUpperCase() : null;
  if (asin && !/^[A-Z0-9]{10}$/.test(asin)) return { ok: false, error: 'That ASIN is not ten letters and numbers.' };
  const folder = coverFolder();
  const cover = input?.cover_url ? String(input.cover_url) : null;
  if (cover && (!cover.startsWith(folder) || !/^[\w.-]+$/.test(cover.slice(folder.length)))) {
    return { ok: false, error: 'That cover is not in the reading list covers folder.' };
  }

  const supabase = await createClient();
  const { data: last } = await supabase.from('reading_books').select('sort_order')
    .eq('category_id', input.category_id).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from('reading_books').insert({
    title, author, category_id: input.category_id, asin,
    cover_url: cover, cover_source: cover ? (cover.includes('/reading-covers/ol-') ? 'openlibrary' : 'upload') : null,
    is_visible: true, sort_order: (last?.sort_order ?? 0) + 10,
  }).select('id').single();
  if (error) {
    return { ok: false, error: /duplicate|unique/i.test(error.message) ? 'That book is already on the list.' : error.message };
  }
  revalidatePath('/resources/reading-list');
  return { ok: true, id: data.id };
}
