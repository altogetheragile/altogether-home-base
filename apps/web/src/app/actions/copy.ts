'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { REGISTRIES, type CopyEntry, type FieldType, type ItemField } from '@/lib/copy';
import { readField, buildPatch } from '@/lib/settings-store';
import { loadDrafts, saveDraft, publishDrafts, discardDrafts } from '@altogether/ui/editor/store';

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

export type CopyField = {
  key: string; label: string; hint: string; value: string; shipped: string;
  /** What kind of control the editor should draw. Defaults to a textarea, as everything was. */
  type?: FieldType;
  fields?: ItemField[];
  /** What this field would go back to, and when it was changed. Absent when it never has been. */
  undo?: { value: string; at: string };
  /** A value saved but held back. `value` above is still what the site shows. */
  draft?: { value: string; at: string };
};
export type SaveResult = { ok: true } | { ok: false; error: string };

/** Everything the drawer shows for one page: the shipped wording, with any edit laid over it. */
export async function loadPageCopy(page: string): Promise<CopyField[]> {
  if (!(await isAdmin())) return [];

  const registry = REGISTRIES.find((r) => r.page === page);
  if (!registry) return [];

  let saved: Record<string, string> = {};
  let undo: Record<string, { value: string; at: string }> = {};
  // Fields that live on site_settings rather than in a copy row read from there instead.
  const needsSettings = Object.values(registry.entries).some((e) => e.store && e.store !== 'copy');
  let settings: Record<string, unknown> = {};
  try {
    const supabase = await createClient();
    if (needsSettings) {
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      settings = (data ?? {}) as Record<string, unknown>;
    }
    const [current, history] = await Promise.all([
      supabase.from('site_copy').select('key, value').eq('page', page),
      // Newest first, so the first row seen for a key is the one undo would restore.
      supabase.from('site_copy_revisions').select('key, value, replaced_at')
        .eq('page', page).order('replaced_at', { ascending: false }),
    ]);
    saved = Object.fromEntries((current.data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
    for (const r of (history.data ?? []) as { key: string; value: string; replaced_at: string }[]) {
      if (!(r.key in undo)) undo[r.key] = { value: r.value, at: r.replaced_at };
    }
  } catch {
    /* the shipped wording is a fine thing to edit from */
  }

  // Deliberately not inside the block above. If site_copy_drafts is missing because the migration
  // has not run on this deployment yet, that must cost drafting alone, not every edited word on
  // the page.
  let drafts: Record<string, { value: string; at: string }> = {};
  try {
    drafts = await loadDrafts(await createClient(), page);
  } catch {
    /* no drafting here, then */
  }

  return Object.entries(registry.entries).map(([key, e]) => ({
    key,
    label: e.label,
    hint: e.hint,
    // A settings field that has never been set shows the shipped value, so a colour box shows
    // the colour actually in use rather than black, and "Original" has somewhere to go back to.
    value: e.store && e.store !== 'copy' ? readField(e, settings) || e.value : saved[key] ?? e.value,
    shipped: e.value,
    ...(e.type ? { type: e.type } : {}),
    ...(e.fields ? { fields: e.fields } : {}),
    ...(undo[key] ? { undo: undo[key] } : {}),
    ...(drafts[key] ? { draft: drafts[key] } : {}),
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
  const supabase = await createClient();

  // Fields that live on site_settings take a different route: one patch, built so that several
  // brand changes in one save fold into a single object rather than the last one winning.
  const settingsChanges = Object.entries(changes)
    .map(([key, value]) => ({ key, value, entry: registry.entries[key] as CopyEntry }))
    .filter((c) => c.entry.store && c.entry.store !== 'copy');

  if (settingsChanges.length) {
    const supabase = await createClient();
    const { data: before } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    const current = (before ?? {}) as Record<string, unknown>;
    const patch = buildPatch(settingsChanges, current.brand);

    const { error: settingsErr } = await supabase
      .from('site_settings')
      .update(patch)
      .eq('id', '00000000-0000-0000-0000-000000000001');
    if (settingsErr) return { ok: false, error: settingsErr.message };

    // Recorded the same way as a word, so undo works the same way too.
    const user0 = await getCurrentUser();
    const rows = settingsChanges
      .map((c) => ({ key: c.key, page, value: readField(c.entry, current), replaced_by: user0?.id ?? null }))
      .filter((r, i) => r.value !== settingsChanges[i].value);
    if (rows.length) await supabase.from('site_copy_revisions').insert(rows);
  }

  // What each key says right now, read before writing. A key with no row is showing its shipped
  // default, so that is what the change is replacing and that is what undo has to return to.
  const keys = Object.keys(changes).filter((k) => {
    const e = registry.entries[k] as CopyEntry;
    return !e.store || e.store === 'copy';
  });
  if (!keys.length) {
    revalidatePath('/', 'layout');
    return { ok: true };
  }
  const { data: before } = await supabase.from('site_copy').select('key, value').in('key', keys);
  const current = Object.fromEntries((before ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const rows = keys.map((key) => ({
    page,
    key,
    value: changes[key].trim(),
    label: registry.entries[key].label,
    hint: registry.entries[key].hint,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  }));
  if (!rows.length) return { ok: true };

  const tooLong = rows.find((r) => r.value.length > 20_000);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };

  const { error } = await supabase.from('site_copy').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };

  // After the write, not before: a revision recorded for a save that then failed would offer to
  // undo something that never happened. A revision that fails to record costs the undo, not the
  // edit, so it must not fail the save either.
  const replaced = rows
    .filter((r) => (current[r.key] ?? registry.entries[r.key].value) !== r.value)
    .map((r) => ({
      key: r.key,
      page,
      value: current[r.key] ?? registry.entries[r.key].value,
      replaced_by: user?.id ?? null,
    }));
  if (replaced.length) await supabase.from('site_copy_revisions').insert(replaced);

  // Every page, because the navigation registry appears on all of them.
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Puts one field back to the wording the site shipped with. Recorded, like any other change:
 *  restoring the shipped wording still throws away whatever was there. */
export async function resetCopy(page: string, key: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: before } = await supabase.from('site_copy').select('value').eq('key', key).maybeSingle();

  const { error } = await supabase.from('site_copy').delete().eq('page', page).eq('key', key);
  if (error) return { ok: false, error: error.message };

  if (before?.value) {
    await supabase.from('site_copy_revisions').insert({ key, page, value: before.value, replaced_by: user?.id ?? null });
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Steps one change backwards: restores the most recent previous value and forgets it, so undoing
 *  again goes back further.
 *
 *  A pop rather than another edit. Recording the undo as a change of its own would make undo and
 *  redo the same button, and pressing it twice would land you where you started. */
export async function undoCopy(page: string, key: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const registry = REGISTRIES.find((r) => r.page === page);
  if (!registry || !(key in registry.entries)) return { ok: false, error: `Not part of this page: ${key}` };

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: last } = await supabase
    .from('site_copy_revisions')
    .select('id, value')
    .eq('key', key)
    .order('replaced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) return { ok: false, error: 'There is nothing to undo here.' };

  const entry = registry.entries[key] as CopyEntry;

  // A field that lives on site_settings is put back there, not into a copy row that nothing
  // reads. Undo has to follow the value home.
  if (entry.store && entry.store !== 'copy') {
    const { data: before } = await supabase.from('site_settings').select('brand').limit(1).maybeSingle();
    const patch = buildPatch([{ entry, value: last.value }], (before ?? {}).brand);
    const { error: sErr } = await supabase
      .from('site_settings')
      .update(patch)
      .eq('id', '00000000-0000-0000-0000-000000000001');
    if (sErr) return { ok: false, error: sErr.message };
    await supabase.from('site_copy_revisions').delete().eq('id', last.id);
    revalidatePath('/', 'layout');
    return { ok: true };
  }

  const { error } = await supabase.from('site_copy').upsert(
    {
      page, key, value: last.value,
      label: registry.entries[key].label,
      hint: registry.entries[key].hint,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    },
    { onConflict: 'key' },
  );
  if (error) return { ok: false, error: error.message };

  // Only once the value is safely back. Deleting first would lose the value if the write failed.
  await supabase.from('site_copy_revisions').delete().eq('id', last.id);

  revalidatePath('/', 'layout');
  return { ok: true };
}

// ============= Holding a change back =============
//
// The same three layers as every other action here: the editor only renders for an admin, this
// file checks again because a Server Action is a public endpoint, and the write runs on the
// caller's own session so the drafts policy decides. Only the third is load-bearing.
//
// The work itself is the shared editor store, the same module the App calls. Publishing a draft
// goes through the ordinary save, so a published draft and a direct save are the same write, with
// the same revision recorded behind them and the same undo afterwards.

/** Saves without publishing. The live site carries on showing what it showed. */
export async function saveDraftCopy(page: string, changes: Record<string, string>): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const user = await getCurrentUser();
  return saveDraft(await createClient(), REGISTRIES, page, changes, user?.id ?? null);
}

/** Puts everything waiting on one page live. */
export async function publishPageDrafts(page: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const user = await getCurrentUser();
  const result = await publishDrafts(await createClient(), REGISTRIES, page, user?.id ?? null);
  // Every page, because the navigation registry appears on all of them.
  if (result.ok) revalidatePath('/', 'layout');
  return result;
}

/** Throws away what is waiting. Changes nothing on the site, so there is nothing to revalidate,
 *  except that a preview is showing these and should stop. */
export async function discardPageDrafts(page: string, key?: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const result = await discardDrafts(await createClient(), page, key);
  if (result.ok) revalidatePath('/', 'layout');
  return result;
}
