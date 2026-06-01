#!/usr/bin/env node
// Regenerate the committed src/data/isa_o3_master.json snapshot from the live
// Supabase knowledge_items table. This file is a reference/offline fallback;
// the app reads live from Supabase at runtime.
//
// Usage: node scripts/export-kb-json.mjs
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(name) {
  const env = readFileSync(join(root, '.env'), 'utf8');
  const line = env.split('\n').find((l) => l.startsWith(name + '='));
  return line ? line.slice(name.length + 1).replace(/^['"]|['"]$/g, '').trim() : '';
}

const URL = readEnv('VITE_SUPABASE_URL');
const KEY = readEnv('VITE_SUPABASE_ANON_KEY');
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const res = await fetch(
  `${URL}/rest/v1/knowledge_items?select=slug,name,item_type,description,background,source,horizon,isa,layer,facet,kind,inheritable,why_it_exists,produces,counterparts,techniques,components&is_published=eq.true&order=slug`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
);
if (!res.ok) {
  console.error('Fetch failed:', res.status, await res.text());
  process.exit(1);
}
const rows = await res.json();

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
console.log(`Wrote ${out}: ${artifacts.length} artifacts, ${techniques.length} techniques`);
