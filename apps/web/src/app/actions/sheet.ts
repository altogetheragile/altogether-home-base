'use server';

import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { REGISTRIES } from '@/lib/copy';
import { loadPage, saveDraft } from '@altogether/ui/editor/store';
import { moduleIsOn } from '@altogether/ui/modules';
import { toCsv, rowsFor, readSheet, byPage, whyNothing, type Known, type SheetReading, type SheetRow } from '@/lib/copy/sheet';

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

/** Every row the site has, page by page, each saying whether it is in use. */
async function allRows(): Promise<{ rows: SheetRow[]; pages: number }> {
  const db = await createClient();
  const { data } = await db.from('site_settings').select('*').limit(1).maybeSingle();
  const settings = (data ?? {}) as Record<string, unknown>;

  const rows: SheetRow[] = [];
  let pages = 0;
  for (const registry of REGISTRIES) {
    // A page that is switched off is listed and says so, rather than being left out: "not in the
    // file" and "not on the site" were otherwise impossible to tell apart.
    const needs = moduleForPage(registry.page);
    const pageOn = !needs || moduleIsOn(needs, settings);
    const fields = await loadPage(db, REGISTRIES, registry.page);
    const forPage = rowsFor(registry.page, registry.label, fields, pageOn);
    if (forPage.length) pages++;
    rows.push(...forPage);
  }
  return { rows, pages };
}

/** The whole site's words, as one file. */
export async function exportCopySheet(): Promise<
  { ok: true; csv: string; rows: number; pages: number } | { ok: false; error: string }
> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const { rows, pages } = await allRows();
  return { ok: true, csv: toCsv(rows), rows: rows.length, pages };
}

/** What every row currently holds, for comparing a returned file against.
 *
 *  Built from the same rows the file is, so an ID means the same thing on the way back as on the
 *  way out. Only what could have gone out in the file: a returned row naming a switch is unknown
 *  rather than a way to flip it. */
async function whatIsThereNow(): Promise<Map<string, Known>> {
  const { rows } = await allRows();
  return new Map(rows.map((r) => [r.key, { page: r.page, value: r.current, kind: r.kind, list: r.list }]));
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
  { ok: true; written: number; pages: string[]; unknown: string[]; skipped: number } | { ok: false; error: string }
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
  return {
    ok: true, written: reading.changes.length, pages: done, unknown: reading.unknown,
    skipped: reading.pictures.length + reading.refused.length,
  };
}
