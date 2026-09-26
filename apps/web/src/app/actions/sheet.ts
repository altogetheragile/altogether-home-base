'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { REGISTRIES } from '@/lib/copy';
import { loadPage, saveDraft } from '@altogether/ui/editor/store';
import { moduleIsOn } from '@altogether/ui/modules';
import { toCsv, rowsFor, readSheet, byPage, isWords, whyNothing, type SheetReading } from '@/lib/copy/sheet';

// ============= The words, out and back =============
//
// Everything here is the same three promises the drawer makes, kept in one place so a file cannot
// be a way around them: an administrator only, words only, and nothing published without being
// looked at. An import lands as drafts, so a returned file is a proposal rather than a change.

/** Which module a page needs, read from its own visibility switch rather than listed here. */
function moduleForPage(page: string): string | null {
  const entry = REGISTRIES.find((r) => r.page === page)?.entries[`${page}.visible`];
  return entry?.path?.replace(/^show_/, '') ?? null;
}

/** The whole site's words, as one file. */
export async function exportCopySheet(): Promise<
  { ok: true; csv: string; rows: number; pages: number } | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const db = await createClient();

  const { data } = await db.from('site_settings').select('*').limit(1).maybeSingle();
  const settings = (data ?? {}) as Record<string, unknown>;

  const rows = [];
  let pages = 0;
  for (const registry of REGISTRIES) {
    // A page that is switched off is left out entirely, rather than being asked for and then
    // never shown.
    const needs = moduleForPage(registry.page);
    if (needs && !moduleIsOn(needs, settings)) continue;
    const fields = await loadPage(db, REGISTRIES, registry.page);
    const forPage = rowsFor(registry.page, registry.label, fields);
    if (forPage.length) pages++;
    rows.push(...forPage);
  }
  return { ok: true, csv: toCsv(rows), rows: rows.length, pages };
}

/** What every field currently holds, for comparing a returned file against. */
async function whatIsThereNow(): Promise<Map<string, { page: string; value: string }>> {
  const db = await createClient();
  const known = new Map<string, { page: string; value: string }>();
  for (const registry of REGISTRIES) {
    for (const field of await loadPage(db, REGISTRIES, registry.page)) {
      // Only what could have gone out in the file, so a returned row naming a switch is unknown
      // rather than a way to flip it.
      if (isWords(field)) known.set(field.key, { page: registry.page, value: field.value ?? '' });
    }
  }
  return known;
}

/** What a returned file would change, without changing anything. */
export async function reviewCopySheet(csv: string): Promise<
  { ok: true; reading: SheetReading } | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  try {
    return { ok: true, reading: readSheet(csv, await whatIsThereNow()) };
  } catch {
    return { ok: false, error: 'That file could not be read as a spreadsheet.' };
  }
}

/** Takes a returned file in, as drafts.
 *
 *  Drafts rather than a publish, because two hundred rows arriving at once is exactly the change
 *  nobody can check after the fact. The site carries on showing what it showed, the drawer shows
 *  what is waiting on each page, and publishing stays a decision. */
export async function applyCopySheet(csv: string): Promise<
  { ok: true; written: number; pages: string[]; unknown: string[] } | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const reading = readSheet(csv, await whatIsThereNow());
  if (!reading.changes.length) return { ok: false, error: whyNothing(reading) ?? 'Nothing to save.' };

  const db = await createClient();
  const user = await getCurrentUser();
  const pages = byPage(reading.changes);
  const done: string[] = [];

  for (const [page, changes] of Object.entries(pages)) {
    const result = await saveDraft(db, REGISTRIES, page, changes, user?.id ?? null);
    // Said with what did land, rather than as a bare failure: knowing three pages went in and the
    // fourth did not is the difference between finishing and starting again.
    if (!result.ok) {
      return { ok: false, error: `${done.length} page${done.length === 1 ? '' : 's'} saved, then ${page} failed: ${result.error}` };
    }
    done.push(page);
  }
  return { ok: true, written: reading.changes.length, pages: done, unknown: reading.unknown };
}
