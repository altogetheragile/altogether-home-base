'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { REGISTRIES } from '@/lib/copy';

// ============= Editing the words from the page they appear on =============
//
// Same three layers as saveGuide, and for the same reason. The editor only renders for an admin;
// this file checks again because a Server Action is a public endpoint reachable by anyone who can
// read the page's JavaScript; and the write runs on the caller's own session, so the
// "admins write site copy" policy decides. Only the third is load-bearing.
//
// Why the server at all, when the App writes site_copy straight from the browser: because these
// pages are server-rendered and cached. A write that does not revalidate leaves the admin looking
// at the words they just replaced, concluding it did not save, and doing it again.

export type CopyField = { key: string; label: string; hint: string; value: string; shipped: string };
export type SaveResult = { ok: true } | { ok: false; error: string };

/** Everything the drawer shows for one page: the shipped wording, with any edit laid over it. */
export async function loadPageCopy(page: string): Promise<CopyField[]> {
  if (!(await isAdmin())) return [];

  const registry = REGISTRIES.find((r) => r.page === page);
  if (!registry) return [];

  let saved: Record<string, string> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_copy').select('key, value').eq('page', page);
    saved = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    /* the shipped wording is a fine thing to edit from */
  }

  return Object.entries(registry.entries).map(([key, e]) => ({
    key,
    label: e.label,
    hint: e.hint,
    value: saved[key] ?? e.value,
    shipped: e.value,
  }));
}

/** Writes the changed fields. Sends only what changed, so two admins editing different parts of
 *  the same page do not overwrite each other with values they never looked at. */
export async function savePageCopy(page: string, changes: Record<string, string>): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const registry = REGISTRIES.find((r) => r.page === page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };

  // A key not in the registry is a key nothing renders. Refusing it keeps the table honest: the
  // editor lists what the page reads, and the page reads what the table holds.
  const unknown = Object.keys(changes).filter((k) => !(k in registry.entries));
  if (unknown.length) return { ok: false, error: `Not part of this page: ${unknown.join(', ')}` };

  // The key is the primary key on its own, not (page, key): the keys are already prefixed with
  // their page, so "home.hero.heading" cannot collide with anything. Carrying the label and hint
  // keeps the row self-describing for the Admin editor, which lists rows rather than registries.
  const user = await getCurrentUser();
  const rows = Object.entries(changes).map(([key, value]) => ({
    page,
    key,
    value: value.trim(),
    label: registry.entries[key].label,
    hint: registry.entries[key].hint,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  }));
  if (!rows.length) return { ok: true };

  const tooLong = rows.find((r) => r.value.length > 20_000);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };

  const supabase = await createClient();
  const { error } = await supabase.from('site_copy').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };

  // Every page, because the navigation registry appears on all of them.
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Puts one field back to the wording the site shipped with. */
export async function resetCopy(page: string, key: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const supabase = await createClient();
  const { error } = await supabase.from('site_copy').delete().eq('page', page).eq('key', key);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
