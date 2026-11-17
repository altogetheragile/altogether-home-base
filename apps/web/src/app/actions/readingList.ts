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
