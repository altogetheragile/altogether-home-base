import { draftMode } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';
import homeJson from './home.json';
import aboutJson from './about.json';
import coachingJson from './coaching.json';
import contactJson from './contact.json';
import testimonialsJson from './testimonials.json';
import blogJson from './blog.json';
import eventsJson from './events.json';
import examsJson from './exams.json';
import { navigationRegistry, siteRegistry } from '@altogether/ui/editor/registries';

// ============= The site's words, editable without a deploy =============
//
// Each page has a JSON registry: the shipped wording, plus the label and note the admin editor
// shows beside it. The registry is the fallback and the seed; `site_copy` holds whatever has been
// edited since, keyed by the same ids.
//
// JSON rather than TypeScript because two things read it and they cannot import each other's
// source: this app renders the page, and scripts/seed-site-copy.mjs writes the rows the editor
// lists. A shared .json needs no build step and no shared package.
//
// If the fetch fails - offline, table missing, RLS - the page renders its shipped wording and says
// nothing. Nobody should see a site with no words in it because a query timed out.

// The pure half lives in ./fields, so client components can have it without dragging the server
// client along. Re-exported here so server callers see one module.
export * from './fields';
import type { CopyRegistry } from './fields';

export const REGISTRIES: CopyRegistry[] = [
  homeJson, aboutJson, coachingJson, contactJson, testimonialsJson, blogJson, eventsJson, examsJson,
  navigationRegistry,
  siteRegistry,
] as CopyRegistry[];

/** Reads a page's copy, with anything saved in `site_copy` laid over the shipped wording, and
 *  anything drafted laid over that when an admin is previewing.
 *
 *  Three layers, each narrower than the last: what the site shipped with, what has been published,
 *  and what one admin is trying out. A visitor only ever sees the first two, because draft mode is
 *  a signed cookie Next will not issue to anyone this app has not let through, and because the
 *  drafts table is not readable without an admin session anyway. Two locks, since the cost of the
 *  first one failing is somebody's half-written page on the live site. */
export async function getCopy(page: string): Promise<(key: string) => string> {
  const registry = REGISTRIES.find((r) => r.page === page);
  const shipped = registry?.entries ?? {};
  let saved: Record<string, string> = {};

  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_copy').select('key, value').eq('page', page);
    saved = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    /* shipped wording it is */
  }

  const drafts = await draftedOver(page);
  return (key: string) => drafts[key] ?? saved[key] ?? shipped[key]?.value ?? '';
}

/** The drafts to lay over this page, which is nothing at all unless an admin asked to see them.
 *
 *  Reading draft mode marks the route dynamic. That costs nothing here: every content route in
 *  this app is already server-rendered on demand, because the Supabase client reads cookies to
 *  find out who is asking. If that ever stops being true, this is the line that would quietly
 *  keep it false. */
async function draftedOver(page: string): Promise<Record<string, string>> {
  try {
    const { isEnabled } = await draftMode();
    if (!isEnabled) return {};
    if (!(await isAdmin())) return {};
    const supabase = await createClient();
    const { data } = await supabase.from('site_copy_drafts').select('key, value').eq('page', page);
    return Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    // A page that cannot work out whether to preview shows the published site, which is the
    // answer that is never wrong for a visitor.
    return {};
  }
}

/** Split on the newlines the registry uses for a deliberate line break in a heading. */

