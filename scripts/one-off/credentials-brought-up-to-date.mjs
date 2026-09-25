// Five corrections to what this site claims about its founder.
//
// Asked for on 2026-09-25. Two of them were a choice between removing a credential and marking it
// as past; both were answered "mark as past", which the credentials list already has a convention
// for: "(elapsed)".
//
// Three of the claims appeared somewhere they were not asked about - ABC Assessor on Coaching,
// 1,500+ on Events, Management 3.0 on Coaching and on the About timeline - and changing only the
// pages named would have left the site contradicting itself.
//
//   node scripts/one-off/credentials-brought-up-to-date.mjs            # shows every change
//   node scripts/one-off/credentials-brought-up-to-date.mjs --apply
//
// Every edit is recorded in site_copy_revisions by the ordinary save path, so any of it can be
// undone from the editor.

import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const URL_BASE = env.VITE_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
const APPLY = process.argv.includes('--apply');
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

/** Each edit names the exact text it expects to find. A claim that has already been reworded by
 *  hand should stop this rather than be silently overwritten. */
const EDITS = [
  // 1. ABC Assessor, marked as past.
  { key: 'home.founder.credentials', from: 'ABC Assessor', to: 'ABC Assessor (elapsed)', why: 'no longer assessing' },
  { key: 'about.hero.tags', from: 'ABC Assessor', to: 'ABC Assessor (elapsed)', why: 'no longer assessing' },
  { key: 'about.credentials.list',
    from: 'ABC Assessor - interviews professional membership candidates',
    to: 'ABC Assessor (elapsed) - interviewed professional membership candidates',
    why: 'present tense made it a current role' },
  { key: 'coaching.why.items', from: '"label": "ABC Assessor"', to: '"label": "ABC Assessor (elapsed)"', why: 'the same claim, on a page nobody mentioned' },
  { key: 'coaching.why.items',
    from: '"desc": "Interviews professional membership candidates for the Agile Business Consortium"',
    to: '"desc": "Interviewed professional membership candidates for the Agile Business Consortium"',
    why: 'present tense' },

  // 2. What the SAP work actually was.
  { key: 'about.story.p1',
    from: 'leading a global SAP deployment across six countries',
    to: 'managing deployment projects in a global SAP programme',
    why: 'overstated the role' },

  // 3. The number trained.
  { key: 'about.hero.tags', from: '1,500+ trained', to: '2,000+ trained', why: 'out of date' },
  { key: 'home.stats.items', from: '"number": "1,500+"', to: '"number": "2,000+"', why: 'out of date' },
  { key: 'events.stats.trained.number', from: '1,500+', to: '2,000+', why: 'the same figure, on a page nobody mentioned' },

  // 4. The AgileBA credit, stated properly.
  { key: 'home.founder.credentials', from: 'AgileBA Module Author', to: 'Co-author, AgileBA v3', why: 'understated the credit' },
  { key: 'about.credentials.list', from: 'AgileBA module author', to: 'Co-author, AgileBA v3', why: 'understated the credit' },

  // 5. Management 3.0, marked as past. The 2020 timeline entry is left alone: it says the
  //    licence was gained that year, which remains true.
  { key: 'about.credentials.list', from: 'Management 3.0 Facilitator', to: 'Management 3.0 Facilitator (elapsed)', why: 'licence ended' },
  { key: 'coaching.why.items', from: '"label": "Management 3.0"', to: '"label": "Management 3.0 (elapsed)"', why: 'the same claim, on a page nobody mentioned' },
  { key: 'coaching.why.items',
    from: '"desc": "Licensed Facilitator - energising people, teams, and organisations"',
    to: '"desc": "Trained as a licensed facilitator - energising people, teams, and organisations"',
    why: '"Licensed" in the present tense is the claim that ended' },
];

// page, label and hint come back too: an upsert is an insert as far as the not-null constraints
// are concerned, so sending only the key and the value fails on `page` and writes nothing.
const rows = await (await fetch(`${URL_BASE}/rest/v1/site_copy?select=key,page,value,label,hint`, { headers })).json();
const before = Object.fromEntries(rows.map((r) => [r.key, r.value]));
const meta = Object.fromEntries(rows.map((r) => [r.key, { page: r.page, label: r.label ?? '', hint: r.hint ?? '' }]));

// Apply in memory first, so a key edited twice sees the first edit.
const after = { ...before };
const problems = [];
for (const edit of EDITS) {
  const current = after[edit.key];
  if (current === undefined) { problems.push(`${edit.key} is not in the database`); continue; }
  if (!current.includes(edit.from)) {
    problems.push(`${edit.key} does not contain ${JSON.stringify(edit.from)} - it may already have been changed`);
    continue;
  }
  after[edit.key] = current.split(edit.from).join(edit.to);
}

const changed = Object.keys(after).filter((k) => after[k] !== before[k]);

console.log(`\n=== ${EDITS.length} corrections across ${changed.length} entries ===\n`);
for (const edit of EDITS) {
  console.log(`  ${edit.key}`);
  console.log(`    - ${edit.from}`);
  console.log(`    + ${edit.to}`);
  console.log(`      (${edit.why})\n`);
}

if (problems.length) {
  console.error('REFUSING TO WRITE. Nothing matched for:\n  ' + problems.join('\n  '));
  process.exit(1);
}

// Nothing may disappear that was not meant to. Every entry should be the same length give or
// take the deliberate edits, so a value replaced wholesale by accident is caught.
for (const key of changed) {
  const drift = Math.abs(after[key].length - before[key].length);
  if (drift > 200) { console.error(`REFUSING: ${key} changed by ${drift} characters, which is more than these edits account for.`); process.exit(1); }
}

if (!APPLY) {
  console.log('Dry run. Nothing written. Re-run with --apply.\n');
  console.log('Left alone on purpose:');
  console.log('  about.timeline.list          the 2020 entry says the licence was gained that year, which is still true');
  console.log('  coaching.services            "Management 3.0 practices woven throughout" is a method, not a credential');
  console.log('  home.stats.1.number          an old numbered key nothing reads since the statistics became a list');
  console.log('  coaching.why.4/5.label       likewise, replaced by coaching.why.items\n');
} else {
  const body = changed.map((key) => ({ key, ...meta[key], value: after[key] }));
  const res = await fetch(`${URL_BASE}/rest/v1/site_copy?on_conflict=key`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  console.log(`Written. ${changed.length} entries updated, every one undoable from the editor.\n`);
}
