#!/usr/bin/env node
// Regenerate the DERIVED src/data/isa_o3_master.json snapshot from the live
// Supabase knowledge_items table. Supabase is the single source of truth; this
// file is a build-time export for reference/diffing and is never read at
// runtime (the app and Pattern Builder read Supabase directly).
//
// Runs automatically on `npm run build` (prebuild) and can be run by hand:
//   node scripts/export-kb-json.mjs
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment first
// (Vercel), then from .env (local). Failures are non-fatal so a transient
// Supabase issue can never break a deploy - the committed file stays as-is.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fromEnvFile(name) {
  try {
    const env = readFileSync(join(root, '.env'), 'utf8');
    const line = env.split('\n').find((l) => l.startsWith(name + '='));
    return line ? line.slice(name.length + 1).replace(/^['"]|['"]$/g, '').trim() : '';
  } catch {
    return '';
  }
}
const readEnv = (name) => process.env[name] || fromEnvFile(name);

const BANNER =
  'GENERATED FROM SUPABASE - DO NOT EDIT. Supabase is the single source of truth; ' +
  'edit content via the admin UI. This file is regenerated on each build by ' +
  'scripts/export-kb-json.mjs and is not read at runtime.';

function bail(msg) {
  console.warn(`[export-kb-json] skipped: ${msg} (keeping existing snapshot)`);
  process.exit(0); // non-fatal: never break the build
}

const URL = readEnv('VITE_SUPABASE_URL');
const KEY = readEnv('VITE_SUPABASE_ANON_KEY');
if (!URL || !KEY) bail('missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

let rows;
try {
  const res = await fetch(
    `${URL}/rest/v1/knowledge_items?select=slug,name,item_type,description,background,source,horizon,isa,layer,facet,kind,inheritable,why_it_exists,produces,counterparts,techniques,components&is_published=eq.true&order=slug`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  );
  if (!res.ok) bail(`fetch failed ${res.status}`);
  rows = await res.json();
} catch (e) {
  bail(`fetch error ${e.message}`);
}

const artifacts = rows
  .filter((r) => r.item_type === 'artifact')
  .map((r) => ({
    id: r.slug,
    name: r.name,
    horizon: r.horizon ?? null,
    isa: r.isa ?? null,
    layer: r.layer ?? null,
    kind: r.kind ?? 'Artifact',
    facet: r.facet ?? null,
    oneLiner: r.description ?? '',
    description: r.background || r.description || '',
    question: r.why_it_exists ?? null,
    inheritable: !!r.inheritable,
    counterparts: r.counterparts ?? [],
    techniques: r.techniques ?? [],
    components: r.components ?? [],
  }))
  .sort((a, b) => (a.horizon || 'zz').localeCompare(b.horizon || 'zz') || a.id.localeCompare(b.id));

const techniques = rows
  .filter((r) => r.item_type === 'technique')
  .map((r) => ({
    id: r.slug,
    name: r.name,
    description: r.description ?? '',
    source: r.source ?? '',
    produces: r.produces ?? [],
  }))
  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

const master = {
  _README: BANNER,
  meta: {
    generated: new Date().toISOString().split('T')[0],
    source: 'Exported from Altogether Agile knowledge_items (Supabase, is_published=true)',
    artifacts: artifacts.length,
    techniques: techniques.length,
  },
  artifacts,
  techniques,
};

const out = join(root, 'src/data/isa_o3_master.json');
writeFileSync(out, JSON.stringify(master, null, 2) + '\n');
console.log(`[export-kb-json] wrote ${out}: ${artifacts.length} artifacts, ${techniques.length} techniques`);
