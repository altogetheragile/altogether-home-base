#!/usr/bin/env node
// Remove duplicate / stub technique rows from the KB. Each removal slug is the
// redundant variant of a kept canonical slug. SAFETY: refuses to delete a slug
// that is referenced by any artifact's techniques[] array or any knowledge_edge.
// Defaults to a dry run; pass --apply to delete.
//
//   node scripts/dedupe-knowledge.mjs [--apply]

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined;
}
const db = createClient(
  readEnv('VITE_SUPABASE_URL') || readEnv('SUPABASE_URL'),
  readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } },
);

// remove slug -> kept canonical slug (kept is informational only).
const REMOVALS = {
  'cumulative-flow-diagrams': 'cumulative-flow-diagram',
  'design-studio-workshops': 'design-studio-workshop',
  'feature-toggles-flags': 'feature-toggles',
  'flow-metrics-cycle-time-lead-time': 'flow-metrics',
  'opportunity-solution-tree-ost': 'opportunity-solution-tree',
  'rice-reach-impact-confidence-effort': 'rice',
  'service-blueprinting': 'service-blueprint',
  'team-working-agreements': 'working-agreements',
  'estimation-story-points': '(unpublished stub)',
  'test': '(junk stub)',
};
const removeSlugs = Object.keys(REMOVALS);

const { data: items } = await db.from('knowledge_items').select('id, slug, item_type, techniques');
const bySlug = new Map(items.map((i) => [i.slug, i]));
const idToSlug = new Map(items.map((i) => [i.id, i.slug]));

// Reference safety: artifacts.techniques[] and knowledge_edges.
const { data: edges } = await db.from('knowledge_edges').select('source_id, target_id');
const blocked = {};
for (const slug of removeSlugs) {
  if (!bySlug.has(slug)) { blocked[slug] = 'NOT FOUND (already gone)'; continue; }
  const id = bySlug.get(slug).id;
  const refArtifacts = items.filter((a) => a.item_type === 'artifact' && (a.techniques || []).includes(slug)).map((a) => a.slug);
  const refEdges = (edges || []).filter((e) => e.source_id === id || e.target_id === id)
    .map((e) => `${idToSlug.get(e.source_id)}->${idToSlug.get(e.target_id)}`);
  if (refArtifacts.length || refEdges.length) {
    blocked[slug] = `referenced by artifacts[${refArtifacts.join(',')}] edges[${refEdges.join(',')}]`;
  }
}

console.log(`Mode: ${apply ? 'APPLY (deleting)' : 'DRY RUN (no writes)'}`);
const deletable = removeSlugs.filter((s) => bySlug.has(s) && !blocked[s]);
for (const s of removeSlugs) {
  if (blocked[s]) console.log(`  SKIP ${s} -> ${blocked[s]}`);
  else console.log(`  delete ${s}  (keep: ${REMOVALS[s]})`);
}
console.log(`Deletable: ${deletable.length} / ${removeSlugs.length}`);

if (!apply) { console.log('\nDry run only. Re-run with --apply to delete.'); process.exit(0); }

let deleted = 0; const errors = [];
for (const slug of deletable) {
  const { error } = await db.from('knowledge_items').delete().eq('slug', slug);
  if (error) errors.push(`${slug}: ${error.message}`); else deleted += 1;
}
console.log(`\nApplied: deleted ${deleted}, ${errors.length} errors`);
if (errors.length) { errors.forEach((e) => console.log('  ERROR', e)); process.exit(1); }
