#!/usr/bin/env node
// Snapshot the current knowledge_items rows (and edges between them) for every
// slug referenced by a seed file, before an import. Writes a timestamped JSON so
// an import is reversible. Read-only.
//
//   node scripts/backup-knowledge.mjs <seed.json> <out-dir>

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const seedArg = process.argv[2];
const outDir = process.argv[3] || '.';
if (!seedArg) {
  console.error('Usage: node scripts/backup-knowledge.mjs <seed.json> <out-dir>');
  process.exit(1);
}

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

const seed = JSON.parse(readFileSync(seedArg, 'utf8'));
const slugs = [
  ...(seed.artifacts || []),
  ...(seed.techniques || []),
  ...(seed.constituents || []),
].map((x) => x.id).filter(Boolean);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const { data: items, error: iErr } = await supabase
  .from('knowledge_items')
  .select('*')
  .in('slug', slugs);
if (iErr) { console.error('items read failed:', iErr.message); process.exit(1); }

const ids = (items || []).map((r) => r.id);
const { data: edgesOut } = await supabase.from('knowledge_edges').select('*').in('source_id', ids);
const { data: edgesIn } = await supabase.from('knowledge_edges').select('*').in('target_id', ids);
const edgeMap = new Map();
[...(edgesOut || []), ...(edgesIn || [])].forEach((e) => edgeMap.set(e.id, e));
const edges = [...edgeMap.values()];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = `${outDir}/kb_backup_${stamp}.json`;
writeFileSync(outPath, JSON.stringify({ takenAt: new Date().toISOString(), seedFile: seedArg, slugs, items, edges }, null, 2));
console.log(`Backed up ${items?.length || 0} items and ${edges.length} edges to ${outPath}`);
