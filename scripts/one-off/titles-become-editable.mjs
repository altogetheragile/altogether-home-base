// Keep this site's two search-tuned page titles when they become editable fields.
//
// The registry ships the plain name of a page, because a new site should not start by advertising
// London agile training. This site's titles were written for its search terms, so they move into
// the database rather than being lost.
//
// Additive and inert until the code that reads them is deployed. Same order as its predecessors:
// run first, merge second.
//
//   node scripts/one-off/titles-become-editable.mjs            # prints what it would write
//   node scripts/one-off/titles-become-editable.mjs --apply
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const URL_BASE = env.VITE_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
const APPLY = process.argv.includes('--apply');

const WRITE = [
  {
    key: 'events.meta.titlePrefix', page: 'events',
    value: 'Agile Training Courses in London & the UK',
    label: 'Browser tab and search result title',
    hint: 'What comes before the business name in the browser tab and in a search result. The page name on its own is fine; something a person would search for is better.',
  },
  {
    key: 'exams.meta.titlePrefix', page: 'exams',
    value: 'AgilePM & Scrum Practice Exam Questions',
    label: 'Browser tab and search result title',
    hint: 'What comes before the business name in the browser tab and in a search result. The page name on its own is fine; something a person would search for is better.',
  },
];

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// What the live pages say today, so this can be checked rather than trusted.
for (const row of WRITE) {
  const page = await (await fetch(`https://altogetheragile.com/${row.page}`)).text();
  const title = page.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const keeps = title.startsWith(row.value.replace(/&/g, '&amp;'));
  console.log(`  ${row.page}: live title is ${JSON.stringify(title)}`);
  console.log(`      ${keeps ? 'matches' : 'DOES NOT MATCH'} what this would write`);
  if (!keeps) { console.error('\nREFUSING: the value here is not what the site currently shows.'); process.exit(1); }
}

if (!APPLY) {
  console.log('\nDry run. Nothing written. Re-run with --apply.');
} else {
  const res = await fetch(`${URL_BASE}/rest/v1/site_copy?on_conflict=key`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(WRITE),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  console.log('\nWritten. These titles are now editable and unchanged.');
}
