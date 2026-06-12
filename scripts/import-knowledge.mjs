#!/usr/bin/env node
// Server-side Knowledge Base importer. Mirrors the logic of the
// supabase/functions/import-knowledge-json edge function (update existing slugs
// only, never insert; upsert typed edges) but runs locally with the service role
// key, so seed and enrichment imports can be applied from the CLI without an
// admin browser session. The edge function keeps its admin gate for the app UI.
//
// Credentials come from .env (SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL).
// Defaults to a dry run; pass --apply to write.
//
//   node scripts/import-knowledge.mjs <file.json> [--apply]

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const fileArg = process.argv[2];
const apply = process.argv.includes('--apply');
if (!fileArg) {
  console.error('Usage: node scripts/import-knowledge.mjs <file.json> [--apply]');
  process.exit(1);
}

// Minimal .env reader (no dependency): only the two keys we need.
function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name}=`));
    if (!line) return undefined;
    return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
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
const VALID_EDGE_TYPES = new Set([
  'convene', 'generate', 'decompose', 'populate', 'formalise',
  'produce_or_shape', 'advance', 'anchors_to', 'cascades_to',
]);

const oneOf = (v, allowed) => (typeof v === 'string' && allowed.includes(v) ? v : null);
const strArr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

const artifactToRow = (a) => ({
  slug: a.id,
  name: a.name,
  item_type: 'artifact',
  description: a.oneLiner ?? a.description ?? null,
  background: a.description ?? null,
  horizon: oneOf(a.horizon, HORIZONS),
  isa: oneOf(a.isa, ISA),
  layer: oneOf(a.layer, LAYERS),
  facet: typeof a.facet === 'string' ? a.facet : null,
  kind: typeof a.kind === 'string' ? a.kind : 'Artifact',
  shape: a.shape === 'anchor' || a.shape === 'container' ? a.shape : null,
  inheritable: !!a.inheritable,
  why_it_exists: typeof a.question === 'string' ? a.question : null,
  counterparts: strArr(a.counterparts),
  techniques: strArr(a.techniques),
  components: Array.isArray(a.components) ? a.components : [],
});

const techniqueToRow = (t) => ({
  slug: t.id,
  name: t.name,
  item_type: 'technique',
  description: t.description ?? null,
  source: typeof t.source === 'string' ? t.source : null,
  produces: strArr(t.produces),
});

const constituentToRow = (c) => ({
  slug: c.id,
  name: c.name,
  item_type: 'constituent',
  description: c.description ?? null,
  family: c.family === 'queue_item' || c.family === 'field_content' ? c.family : null,
  level: ['epic', 'feature', 'story', 'task'].includes(c.level) ? c.level : null,
  components: Array.isArray(c.components) ? c.components : [],
});

const master = JSON.parse(readFileSync(fileArg, 'utf8'));
const artifacts = Array.isArray(master?.artifacts) ? master.artifacts : [];
const techniques = Array.isArray(master?.techniques) ? master.techniques : [];
const constituents = Array.isArray(master?.constituents) ? master.constituents : [];
const edges = Array.isArray(master?.edges) ? master.edges : [];

const rows = [
  ...artifacts.filter((a) => a?.id && a?.name).map(artifactToRow),
  ...techniques.filter((t) => t?.id && t?.name).map(techniqueToRow),
  ...constituents.filter((c) => c?.id && c?.name).map(constituentToRow),
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const { data: existing, error: exErr } = await supabase.from('knowledge_items').select('id, slug');
if (exErr) { console.error('Failed to read knowledge_items:', exErr.message); process.exit(1); }
const idBySlug = new Map((existing || []).map((r) => [r.slug, r.id]));
const known = new Set(idBySlug.keys());

const willUpdate = rows.filter((r) => known.has(r.slug)).map((r) => r.slug);
const willSkip = rows.filter((r) => !known.has(r.slug)).map((r) => r.slug);
const edgeResolvable = edges.filter((e) => idBySlug.has(e.source) && idBySlug.has(e.target) && VALID_EDGE_TYPES.has(e.edge_type));
const edgeUnresolvable = edges.filter((e) => !(idBySlug.has(e.source) && idBySlug.has(e.target) && VALID_EDGE_TYPES.has(e.edge_type)))
  .map((e) => `${e.source}->${e.target}:${e.edge_type}`);

console.log(`File: ${fileArg}`);
console.log(`Mode: ${apply ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);
console.log(`Items to update: ${willUpdate.length}  | skipped (unknown slug): ${willSkip.length}`);
if (willSkip.length) console.log('  skipped:', willSkip.join(', '));
console.log(`Edges resolvable: ${edgeResolvable.length}/${edges.length}`);
if (edgeUnresolvable.length) console.log('  unresolvable:', edgeUnresolvable.join(', '));

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to write.');
  process.exit(0);
}

let updated = 0;
const errors = [];
for (const row of rows) {
  if (!known.has(row.slug)) continue;
  const { error } = await supabase.from('knowledge_items').update(row).eq('slug', row.slug);
  if (error) errors.push(`${row.slug}: ${error.message}`);
  else updated += 1;
}

let edgesUpserted = 0;
for (const e of edgeResolvable) {
  const { error } = await supabase.from('knowledge_edges').upsert(
    {
      source_id: idBySlug.get(e.source),
      target_id: idBySlug.get(e.target),
      edge_type: e.edge_type,
      from_level: e.from_level ?? null,
      to_level: e.to_level ?? null,
    },
    { onConflict: 'source_id,target_id,edge_type' },
  );
  if (error) errors.push(`edge ${e.source}->${e.target}: ${error.message}`);
  else edgesUpserted += 1;
}

console.log(`\nApplied: updated ${updated} items, upserted ${edgesUpserted} edges, ${errors.length} errors`);
if (errors.length) { errors.forEach((e) => console.log('  ERROR', e)); process.exit(1); }
