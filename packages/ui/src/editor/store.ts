import type { CopyEntry, CopyRegistry } from './fields';
import { moduleIsOn } from '../modules';

// ============= Reading and writing the site, once =============
//
// The rules here were arrived at by getting them wrong: a revision written before the save that
// then failed, a revision deleted before the value was safely back, a brand change that lost every
// other brand change in the same save. Each is a test.
//
// So both apps use this, rather than the Site having it in server actions and the App writing its
// own version in the browser. The only thing that differs between them is the client, which comes
// in as an argument, and authorisation, which is row level security either way.

/** The slice of a Supabase client this needs. Typed structurally so both apps' clients fit
 *  without either of them having to agree on a version. */
export type DataClient = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type CopyField = {
  key: string; label: string; hint: string; value: string; shipped: string;
  type?: CopyEntry['type']; fields?: CopyEntry['fields']; says?: CopyEntry['says'];
  group?: CopyEntry['group']; options?: CopyEntry['options'];
  /** True when this field's section is switched off, so the page it belongs to does not render
   *  it. The words are still editable: somebody may be writing them before turning it on. */
  notShown?: boolean;
  undo?: { value: string; at: string };
  /** A value saved but not published. `value` above is still what the site shows. */
  draft?: { value: string; at: string };
};
export type SaveResult = { ok: true } | { ok: false; error: string };

const SETTINGS_ROW = '00000000-0000-0000-0000-000000000001';

const dig = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>(
    (at, key) => (at && typeof at === 'object' ? (at as Record<string, unknown>)[key] : undefined),
    obj,
  );

/** The current value of a field that lives on site_settings rather than in a copy row. */
export function readField(entry: CopyEntry, settings: Record<string, unknown>): string {
  if (entry.store === 'brand') {
    const v = dig(settings.brand, entry.path ?? '');
    return typeof v === 'string' ? v : '';
  }
  const v = settings[entry.path ?? ''];
  if (entry.type === 'switch') return v === false ? '' : v === true ? 'on' : '';
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

/** The patch for a set of settings changes.
 *
 *  Brand is one jsonb column, so every brand change in a save folds into a single new object.
 *  Writing them one at a time would have the last win and the rest vanish, with no error. */
export function buildPatch(
  changes: { entry: CopyEntry; value: string }[],
  currentBrand: unknown,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  let brand: Record<string, unknown> | null = null;

  for (const { entry, value } of changes) {
    if (entry.store === 'brand') {
      brand ??= JSON.parse(JSON.stringify(currentBrand ?? {}));
      const parts = (entry.path ?? '').split('.');
      let at = brand as Record<string, unknown>;
      for (const key of parts.slice(0, -1)) {
        if (typeof at[key] !== 'object' || at[key] === null) at[key] = {};
        at = at[key] as Record<string, unknown>;
      }
      const leaf = parts[parts.length - 1];
      // Emptied means removed, so the shipped default takes over again rather than the page
      // rendering an empty string where a picture should be.
      if (value.trim()) at[leaf] = value.trim();
      else delete at[leaf];
    } else if (entry.store === 'column') {
      patch[entry.path ?? ''] =
        entry.type === 'switch' ? value === 'on' : value.trim() === '' ? null : value.trim();
    }
  }
  if (brand) patch.brand = brand;
  return patch;
}

const registryFor = (registries: CopyRegistry[], page: string) => registries.find((r) => r.page === page);

/** Everything the drawer shows for one page. */
export async function loadPage(db: DataClient, registries: CopyRegistry[], page: string): Promise<CopyField[]> {
  const registry = registryFor(registries, page);
  if (!registry) return [];

  let saved: Record<string, string> = {};
  const undo: Record<string, { value: string; at: string }> = {};
  let settings: Record<string, unknown> = {};
  // Settings are needed for a field stored outside site_copy, and for one whose section is
  // switched on and off, because that is what decides whether to say it is not on the page.
  const needsSettings = Object.values(registry.entries).some((e) => (e.store && e.store !== 'copy') || e.shownWhen);

  try {
    if (needsSettings) {
      const { data } = await db.from('site_settings').select('*').limit(1).maybeSingle();
      settings = (data ?? {}) as Record<string, unknown>;
    }
    const [current, history] = await Promise.all([
      db.from('site_copy').select('key, value').eq('page', page),
      db.from('site_copy_revisions').select('key, value, replaced_at').eq('page', page)
        .order('replaced_at', { ascending: false }),
    ]);
    saved = Object.fromEntries((current.data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
    for (const r of (history.data ?? []) as { key: string; value: string; replaced_at: string }[]) {
      if (!(r.key in undo)) undo[r.key] = { value: r.value, at: r.replaced_at };
    }
  } catch {
    /* the shipped wording is a fine thing to edit from */
  }

  // Its own read, not part of the block above, because those two are not equally important. If
  // the drafts table is missing - the migration has not run yet on this deployment - the page
  // should lose drafting, not lose every word that has ever been edited. Sharing one try would
  // have made an unapplied migration look like a site that had reverted to its shipped wording.
  const drafts = await loadDrafts(db, page);

  return Object.entries(registry.entries).map(([key, e]) => ({
    key,
    label: e.label,
    hint: e.hint,
    // A settings field never set shows the shipped value, so a colour box shows the colour in use
    // rather than black, and "Original" has somewhere to go back to.
    value: e.store && e.store !== 'copy' ? readField(e, settings) || e.value : saved[key] ?? e.value,
    shipped: e.value,
    ...(e.type ? { type: e.type } : {}),
    ...(e.fields ? { fields: e.fields } : {}),
    ...(e.says ? { says: e.says } : {}),
    ...(e.group ? { group: e.group } : {}),
    ...(e.options ? { options: e.options } : {}),
    ...(e.shownWhen && !moduleIsOn(e.shownWhen, settings) ? { notShown: true } : {}),
    ...(undo[key] ? { undo: undo[key] } : {}),
    ...(drafts[key] ? { draft: drafts[key] } : {}),
  }));
}

/** Writes the changed fields, in whichever store each of them lives in. */
export async function savePage(
  db: DataClient,
  registries: CopyRegistry[],
  page: string,
  changes: Record<string, string>,
  userId: string | null,
): Promise<SaveResult> {
  const registry = registryFor(registries, page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };

  // A key not in the registry is a key nothing renders.
  const unknown = Object.keys(changes).filter((k) => !(k in registry.entries));
  if (unknown.length) return { ok: false, error: `Not part of this page: ${unknown.join(', ')}` };

  const settingsChanges = Object.entries(changes)
    .map(([key, value]) => ({ key, value, entry: registry.entries[key] }))
    .filter((c) => c.entry.store && c.entry.store !== 'copy');

  if (settingsChanges.length) {
    const { data: before } = await db.from('site_settings').select('*').limit(1).maybeSingle();
    const current = (before ?? {}) as Record<string, unknown>;
    const { error } = await db.from('site_settings').update(buildPatch(settingsChanges, current.brand)).eq('id', SETTINGS_ROW);
    if (error) return { ok: false, error: error.message };

    const rows = settingsChanges
      .map((c) => ({ key: c.key, page, value: readField(c.entry, current), replaced_by: userId }))
      .filter((r, i) => r.value !== settingsChanges[i].value);
    if (rows.length) await db.from('site_copy_revisions').insert(rows);
  }

  const keys = Object.keys(changes).filter((k) => {
    const e = registry.entries[k];
    return !e.store || e.store === 'copy';
  });
  if (!keys.length) return { ok: true };

  const { data: before } = await db.from('site_copy').select('key, value').in('key', keys);
  const current = Object.fromEntries((before ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const rows = keys.map((key) => ({
    page, key,
    value: changes[key].trim(),
    label: registry.entries[key].label,
    hint: registry.entries[key].hint,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }));

  const tooLong = rows.find((r) => r.value.length > 20_000);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };

  const { error } = await db.from('site_copy').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };

  // After the write, not before: a revision recorded for a save that then failed would offer to
  // undo something that never happened.
  const replaced = rows
    .filter((r) => (current[r.key] ?? registry.entries[r.key].value) !== r.value)
    .map((r) => ({ key: r.key, page, value: current[r.key] ?? registry.entries[r.key].value, replaced_by: userId }));
  if (replaced.length) await db.from('site_copy_revisions').insert(replaced);

  return { ok: true };
}

/** Back to the wording the site shipped with. Recorded, because it still throws something away. */
export async function resetField(
  db: DataClient, page: string, key: string, userId: string | null,
): Promise<SaveResult> {
  const { data: before } = await db.from('site_copy').select('value').eq('key', key).maybeSingle();
  const { error } = await db.from('site_copy').delete().eq('page', page).eq('key', key);
  if (error) return { ok: false, error: error.message };
  if (before?.value) {
    await db.from('site_copy_revisions').insert({ key, page, value: before.value, replaced_by: userId });
  }
  return { ok: true };
}

/** One step back: restore the newest previous value and forget it, so undoing again goes further.
 *  A pop, not another edit; recording it would make undo and redo the same button. */
export async function undoField(
  db: DataClient, registries: CopyRegistry[], page: string, key: string, userId: string | null,
): Promise<SaveResult> {
  const registry = registryFor(registries, page);
  if (!registry || !(key in registry.entries)) return { ok: false, error: `Not part of this page: ${key}` };

  const { data: last } = await db.from('site_copy_revisions')
    .select('id, value').eq('key', key).order('replaced_at', { ascending: false }).limit(1).maybeSingle();
  if (!last) return { ok: false, error: 'There is nothing to undo here.' };

  const entry = registry.entries[key];
  if (entry.store && entry.store !== 'copy') {
    const { data: before } = await db.from('site_settings').select('brand').limit(1).maybeSingle();
    const { error } = await db.from('site_settings')
      .update(buildPatch([{ entry, value: last.value }], (before ?? {}).brand)).eq('id', SETTINGS_ROW);
    if (error) return { ok: false, error: error.message };
    await db.from('site_copy_revisions').delete().eq('id', last.id);
    return { ok: true };
  }

  const { error } = await db.from('site_copy').upsert(
    { page, key, value: last.value, label: entry.label, hint: entry.hint,
      updated_at: new Date().toISOString(), updated_by: userId },
    { onConflict: 'key' },
  );
  if (error) return { ok: false, error: error.message };
  // Only once the value is safely back; deleting first would lose the only copy of it.
  await db.from('site_copy_revisions').delete().eq('id', last.id);
  return { ok: true };
}

// ============= An edit that is not ready to be seen =============
//
// Saving publishes, as it always did. These are the other path: the value goes to
// site_copy_drafts, the site carries on showing what it showed, and publishing later hands the
// draft to savePage, which already knows where each kind of field belongs.
//
// That indirection is the point. A draft is "this key should become this value" and nothing more,
// so a drafted colour, a drafted logo and a drafted sentence all take the same route even though
// they end up in three different places. Nothing here knows about site_settings or the brand
// object, and it does not need to.

/** What is waiting to be published on one page, as key to value and when it was written.
 *
 *  Answers {} rather than throwing if the table is not there. A deployment whose migration has
 *  not run yet should lose drafting and nothing else. */
export async function loadDrafts(
  db: DataClient, page: string,
): Promise<Record<string, { value: string; at: string }>> {
  try {
    const { data } = await db.from('site_copy_drafts').select('key, value, updated_at').eq('page', page);
    return Object.fromEntries(
      ((data ?? []) as { key: string; value: string; updated_at: string }[])
        .map((r) => [r.key, { value: r.value, at: r.updated_at }]),
    );
  } catch {
    return {};
  }
}

/** Holds changes back instead of publishing them. Same validation as a save, because a draft that
 *  cannot be published is worse than a refused save: you find out later, having written more. */
export async function saveDraft(
  db: DataClient,
  registries: CopyRegistry[],
  page: string,
  changes: Record<string, string>,
  userId: string | null,
): Promise<SaveResult> {
  const registry = registryFor(registries, page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };

  const unknown = Object.keys(changes).filter((k) => !(k in registry.entries));
  if (unknown.length) return { ok: false, error: `Not part of this page: ${unknown.join(', ')}` };

  const rows = Object.entries(changes).map(([key, value]) => ({
    key, page,
    value: value.trim(),
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }));
  if (!rows.length) return { ok: true };

  const tooLong = rows.find((r) => r.value.length > 20_000);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };

  const { error } = await db.from('site_copy_drafts').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Publishes everything waiting on one page, then forgets the drafts.
 *
 *  Through savePage, so publishing a draft and saving directly are the same write: the same
 *  validation, the same revision recorded, the same undo afterwards. A draft is never a second
 *  way to change the site, only a delay before the one way. */
export async function publishDrafts(
  db: DataClient, registries: CopyRegistry[], page: string, userId: string | null,
): Promise<SaveResult> {
  const drafts = await loadDrafts(db, page);
  const keys = Object.keys(drafts);
  if (!keys.length) return { ok: false, error: 'There is nothing waiting to be published here.' };

  const result = await savePage(
    db, registries, page,
    Object.fromEntries(keys.map((k) => [k, drafts[k].value])),
    userId,
  );
  // Only once it is published. Clearing first would lose the draft and leave the site unchanged,
  // which is the one outcome with nothing to recover from: the live value is still the old one
  // and the new one is gone.
  if (!result.ok) return result;

  const { error } = await db.from('site_copy_drafts').delete().eq('page', page).in('key', keys);
  if (error) return { ok: false, error: `Published, but the drafts did not clear: ${error.message}` };
  return { ok: true };
}

/** Throws away what is waiting, changing nothing on the site. One key, or the whole page. */
export async function discardDrafts(
  db: DataClient, page: string, key?: string,
): Promise<SaveResult> {
  const query = db.from('site_copy_drafts').delete().eq('page', page);
  const { error } = await (key ? query.eq('key', key) : query);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
