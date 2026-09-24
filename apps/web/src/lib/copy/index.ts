import { createClient } from '@/lib/supabase/server';
import homeJson from './home.json';
import aboutJson from './about.json';
import coachingJson from './coaching.json';
import contactJson from './contact.json';
import testimonialsJson from './testimonials.json';
import blogJson from './blog.json';
import eventsJson from './events.json';
import examsJson from './exams.json';
import navigationJson from './navigation.json';

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
  navigationJson,
] as CopyRegistry[];

/** Reads a page's copy, with anything saved in `site_copy` laid over the shipped wording. */
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

  return (key: string) => saved[key] ?? shipped[key]?.value ?? '';
}

/** Split on the newlines the registry uses for a deliberate line break in a heading. */

