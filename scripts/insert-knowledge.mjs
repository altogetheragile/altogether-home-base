#!/usr/bin/env node
// INSERT-only Knowledge Base seeder. Companion to import-knowledge.mjs (which
// updates existing slugs only). This inserts NEW knowledge_items whose slug does
// not yet exist, and skips any slug already present (never overwrites). Use for
// enrichment seeds that add techniques/artifacts/constituents.
//
// Credentials come from .env (SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL).
// Defaults to a dry run; pass --apply to write.
//
//   node scripts/insert-knowledge.mjs <file.json> [--apply]

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const fileArg = process.argv[2];
const apply = process.argv.includes('--apply');
if (!fileArg) {
  console.error('Usage: node scripts/insert-knowledge.mjs <file.json> [--apply]');
  process.exit(1);
}

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n').find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined;
  } catch { return undefined; }
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL');
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const HORIZONS = ['Organisation', 'Coordination', 'Team'];
const ISA = ['Intent', 'Scope', 'Approach'];
const LAYERS = ['Anchoring', 'Iterative', 'Evidence'];
const oneOf = (v, allowed) => (typeof v === 'string' && allowed.includes(v) ? v : null);
const strArr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

const artifactToRow = (a) => ({
  slug: a.id, name: a.name, item_type: 'artifact',
  description: a.oneLiner ?? a.description ?? null,
  background: a.description ?? null,
  horizon: oneOf(a.horizon, HORIZONS), isa: oneOf(a.isa, ISA), layer: oneOf(a.layer, LAYERS),
  kind: typeof a.kind === 'string' ? a.kind : 'Artifact',
  why_it_exists: typeof a.question === 'string' ? a.question : null,
  techniques: strArr(a.techniques),
  is_published: true,
});
const techniqueToRow = (t) => ({
  slug: t.id, name: t.name, item_type: 'technique',
  description: t.description ?? null,
  source: typeof t.source === 'string' ? t.source : null,
  produces: strArr(t.produces),
  is_published: true,
});
const constituentToRow = (c) => ({
  slug: c.id, name: c.name, item_type: 'constituent',
  description: c.description ?? null,
  is_published: true,
});

const master = JSON.parse(readFileSync(fileArg, 'utf8'));
const rows = [
  ...(master?.artifacts ?? []).filter((a) => a?.id && a?.name).map(artifactToRow),
  ...(master?.techniques ?? []).filter((t) => t?.id && t?.name).map(techniqueToRow),
  ...(master?.constituents ?? []).filter((c) => c?.id && c?.name).map(constituentToRow),
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const { data: existing, error } = await supabase.from('knowledge_items').select('slug');
if (error) { console.error('read failed:', error.message); process.exit(1); }
const known = new Set((existing || []).map((r) => r.slug));

const toInsert = rows.filter((r) => !known.has(r.slug));
const alreadyThere = rows.filter((r) => known.has(r.slug)).map((r) => r.slug);

console.log(`File: ${fileArg}`);
console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);
console.log(`New items to insert: ${toInsert.length}`);
toInsert.forEach((r) => console.log(`  + ${r.item_type}: ${r.slug}  (${r.name})`));
if (alreadyThere.length) console.log(`Skipped (slug already exists): ${alreadyThere.length}\n  ${alreadyThere.join(', ')}`);

if (!apply) { console.log('\nDry run only. Re-run with --apply to write.'); process.exit(0); }

let inserted = 0; const errors = [];
for (const row of toInsert) {
  const { error } = await supabase.from('knowledge_items').insert(row);
  if (error) errors.push(`${row.slug}: ${error.message}`); else inserted += 1;
}
console.log(`\nApplied: inserted ${inserted} items, ${errors.length} errors`);
if (errors.length) { errors.forEach((e) => console.log('  ERROR', e)); process.exit(1); }
