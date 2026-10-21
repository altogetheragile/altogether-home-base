'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { REGISTRIES, getCopy } from '@/lib/copy';
import { siteName } from '@/lib/seo';
import { starterFields, acceptStarter, type StarterField } from '@/lib/copy/starter';
import { loadDrafts, saveDraft } from '@altogether/ui/editor/store';

// ============= Starter wording, one page at a time =============
//
// One page per call rather than the whole site in one, so the setup page can say how far it has
// got, and so one page that fails costs that page and not the other nine.
//
// Everything lands as a draft. The writer is never trusted to publish: every value goes through
// acceptStarter, and then waits for the owner to read it in the preview.

export type StarterResult =
  | { ok: true; drafted: number; offered: number }
  | { ok: false; error: string };

/** Few enough boxes per request that the reply comes back whole. */
const PER_REQUEST = 25;

export async function draftStarterPage(page: string): Promise<StarterResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };
  const registry = REGISTRIES.find((r) => r.page === page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };

  const brief = (await getCopy('site'))('site.brief').trim();
  if (!brief) return { ok: false, error: 'Describe the website first, and save it.' };

  const db = await createClient();
  const { data: rows } = await db.from('site_copy').select('key').eq('page', page);
  const written = new Set(((rows ?? []) as { key: string }[]).map((r) => r.key));
  const drafted = new Set(Object.keys(await loadDrafts(db, page)));
  const fields = starterFields(registry, written, drafted);
  if (!fields.length) return { ok: true, drafted: 0, offered: 0 };

  const name = await siteName();
  const changes: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += PER_REQUEST) {
    const batch = fields.slice(i, i + PER_REQUEST);
    const { data, error } = await db.functions.invoke('draft-site-copy', {
      body: { brief, siteName: name, page: registry.label, fields: batch },
    });
    if (error || !data?.success) {
      // The function's own words where it gave some: "not set on this project" is the one people
      // need to see, because it is fixed somewhere other than here.
      const said = (await readError(error)) ?? data?.error;
      return { ok: false, error: said ?? 'The starter wording could not be written.' };
    }
    Object.assign(changes, accepted(batch, data.values ?? {}));
  }

  if (!Object.keys(changes).length) return { ok: true, drafted: 0, offered: fields.length };
  const user = await getCurrentUser();
  const saved = await saveDraft(db, REGISTRIES, page, changes, user?.id ?? null);
  if (!saved.ok) return saved;
  revalidatePath('/', 'layout');
  return { ok: true, drafted: Object.keys(changes).length, offered: fields.length };
}

function accepted(fields: StarterField[], values: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    fields.flatMap((f) => {
      const value = acceptStarter(f, values[f.key]);
      return value === null ? [] : [[f.key, value]];
    }),
  );
}

/** supabase-js wraps a non-2xx reply in an error whose message is only the status. The body,
 *  where the function says what went wrong, is on its context. */
async function readError(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== 'function') return error ? String((error as Error).message ?? error) : null;
  try {
    const body = await context.json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}
