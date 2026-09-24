// Move the coaching services and the credentials into lists.
//
// Same shape as cards-become-lists.sql and stats-become-a-list.sql: additive, inert while the
// deployed code still reads the numbered keys, so it runs BEFORE the merge. Expand, migrate,
// contract. The old numbered rows are left in place, so this is undone by not deploying.
//
// WHY THIS ONE IS A SCRIPT AND NOT SQL, unlike its two predecessors: it builds the new value out
// of what production actually holds rather than out of what somebody transcribed into a file.
// There are fifty-two rows here, every one of them edited away from the shipped wording, and a
// hand-written INSERT is fifty-two chances to drop a sentence with nothing to notice it. Being a
// script also means it can be run without writing anything, which is the only way to see what it
// would do before it does it. SQL run in the dashboard has no dry run.
//
//   node scripts/one-off/services-become-a-list.mjs            # prints what it would write
//   node scripts/one-off/services-become-a-list.mjs --apply    # writes it
//
// Needs SUPABASE_SERVICE_ROLE_KEY, because site_copy is admin-only for writes.

import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);

const URL_BASE = env.VITE_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');

const APPLY = process.argv.includes('--apply');

// What the page held in code rather than in copy: the accent colour, the badge icon, and the
// illustration. These were fixed to the two services by position; they become part of the row.
const STYLE = {
  1: {
    icon: 'User', colour: '#1A9090',
    src: '/images/coaching-one-to-one.webp',
    alt: 'One-to-one coaching session in comfortable chairs',
  },
  2: {
    icon: 'Users', colour: '#6B5FCC',
    src: '/images/coaching-team.webp',
    alt: 'Team coaching session at a desk with laptop',
  },
};

const rest = async (path, init) => {
  const response = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  // `return=minimal` answers 201 with an empty body, and .json() on that throws after the write
  // has already succeeded, which reads as a failed run that in fact worked.
  const body = await response.text();
  return body ? JSON.parse(body) : null;
};

const rows = await rest('site_copy?page=eq.coaching&select=key,value');

/** The numbered keys for one prefix, grouped by their number, in numeric order. */
function numbered(prefix) {
  const found = new Map();
  for (const { key, value } of rows) {
    const m = key.match(new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`));
    if (!m) continue;
    const [, n, field] = m;
    if (!found.has(+n)) found.set(+n, {});
    found.get(+n)[field] = value;
  }
  return [...found.entries()].sort(([a], [b]) => a - b);
}

const services = numbered('coaching.service').map(([n, fields]) => ({
  title: fields.title ?? '',
  // The page used to render the badge as "{label} Coaching", with the word bolted on in code.
  // It renders the label alone now, so the word moves into the value and the badge reads the
  // same as it does today.
  label: fields.label?.trim() ? `${fields.label.trim()} Coaching` : '',
  tagline: fields.tagline ?? '',
  description: fields.description ?? '',
  detail: fields.detail ?? '',
  includes: fields.includes ?? '',
  price: fields.price ?? '',
  packageNote: fields.packageNote ?? '',
  cta: fields.cta ?? '',
  icon: STYLE[n]?.icon ?? '',
  colour: STYLE[n]?.colour ?? '',
  // An image box holds the picture and its alt text together, as one value.
  image: STYLE[n] ? JSON.stringify({ src: STYLE[n].src, alt: STYLE[n].alt }) : '',
}));

const credentials = numbered('coaching.why').map(([, fields]) => ({
  label: fields.label ?? '',
  desc: fields.desc ?? '',
}));

const WRITE = [
  {
    key: 'coaching.services', page: 'coaching',
    value: JSON.stringify(services, null, 2),
    label: 'Services',
    hint: 'One block per service you offer. Add or remove as many as you like; leave it empty and the services section disappears. Each one alternates side and background down the page automatically.',
  },
  {
    key: 'coaching.why.items', page: 'coaching',
    value: JSON.stringify(credentials, null, 2),
    label: 'Credentials',
    hint: 'One per credential or reason to work with you. Leave it empty and the whole section disappears. These are checkable claims about a real person, so a new site starts with none.',
  },
];

// ---- What it found, before anything is written ----
console.log(`Read ${rows.length} coaching rows from production.\n`);
console.log(`Services: ${services.length}`);
for (const s of services) {
  const missing = Object.entries(s).filter(([, v]) => !String(v).trim()).map(([k]) => k);
  console.log(`  - ${s.title || '(NO TITLE, would be dropped by the page)'}`);
  console.log(`      badge: ${s.label}   includes: ${s.includes.split('\n').filter(Boolean).length} lines`);
  if (missing.length) console.log(`      empty: ${missing.join(', ')}`);
}
console.log(`\nCredentials: ${credentials.length}`);
for (const c of credentials) console.log(`  - ${c.label}${c.desc.trim() ? '' : '   (no description)'}`);

// Nothing may be lost in the move. Every numbered value that had words in it has to appear in
// the JSON that replaces it, or this refuses to write.
const lost = [];
for (const { key, value } of rows) {
  if (!/^coaching\.(service|why)\.\d+\./.test(key)) continue;
  const text = (value ?? '').trim();
  if (!text) continue;
  const written = WRITE.map((w) => w.value).join('\n');
  if (!written.includes(JSON.stringify(text).slice(1, -1))) lost.push(key);
}
if (lost.length) {
  console.error(`\nREFUSING TO WRITE. These values did not survive the move:\n  ${lost.join('\n  ')}`);
  process.exit(1);
}
console.log(`\nEvery numbered value with words in it appears in the new JSON.`);

if (!APPLY) {
  console.log('\nDry run. Nothing written. Re-run with --apply to write these two rows.');
  console.log('\n--- coaching.services ---');
  console.log(WRITE[0].value);
  console.log('\n--- coaching.why.items ---');
  console.log(WRITE[1].value);
} else {
  await rest('site_copy?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(WRITE),
  });
  console.log('\nWritten. The old numbered rows are untouched and still readable by the live code.');
}
