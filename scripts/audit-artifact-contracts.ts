#!/usr/bin/env tsx
// Contract-drift audit: validate every project_artifacts row against the Zod contract
// for its artifact_type (the single source of truth in src/types/artifacts/schemas.ts).
//
// Read-only. Reports which stored artifacts no longer match the shape the tools read and
// write, so drift is caught before it breaks a tool-to-tool handoff. Uses the SAME
// validateArtifactData() the app uses at its read/write chokepoints, so the audit and the
// runtime can never disagree.
//
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/audit-artifact-contracts.ts
//   (or: npm run audit:artifacts)
//
// Credentials come from the shell env or .env (VITE_SUPABASE_URL / SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY). Service role is required to read across all projects' rows
// (RLS would otherwise scope it to the caller). Exit code: 0 if clean, 1 if any drift.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { validateArtifactData, ARTIFACT_SCHEMAS } from '../src/types/artifacts/schemas';

function readEnv(name: string): string | undefined {
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
  console.error('Missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (shell env or .env).');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Row = { id: string; project_id: string | null; artifact_type: string; data: unknown; created_at: string | null };

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('project_artifacts')
      .select('id, project_id, artifact_type, data, created_at')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Query failed:', error.message);
      process.exit(2);
    }
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const rows = await fetchAll();
  const knownTypes = new Set(Object.keys(ARTIFACT_SCHEMAS));

  const byType = new Map<string, { total: number; drifted: number }>();
  const drift: { type: string; id: string; project_id: string | null; issues: string[] }[] = [];
  const unaudited = new Set<string>();

  for (const row of rows) {
    const stat = byType.get(row.artifact_type) ?? { total: 0, drifted: 0 };
    stat.total += 1;
    if (!knownTypes.has(row.artifact_type)) unaudited.add(row.artifact_type);
    const result = validateArtifactData(row.artifact_type, row.data);
    if (!result.valid) {
      stat.drifted += 1;
      drift.push({ type: row.artifact_type, id: row.id, project_id: row.project_id, issues: result.issues });
    }
    byType.set(row.artifact_type, stat);
  }

  console.log(`\nContract-drift audit — ${rows.length} artifact(s) across ${byType.size} type(s)\n`);
  console.log('Type                          Total   Drifted   Schema');
  console.log('----------------------------  ------  --------  -------');
  for (const [type, s] of [...byType.entries()].sort()) {
    const schema = knownTypes.has(type) ? 'yes' : 'NONE (passes through)';
    console.log(`${type.padEnd(28)}  ${String(s.total).padStart(6)}  ${String(s.drifted).padStart(8)}  ${schema}`);
  }

  if (unaudited.size) {
    console.log(`\nUnaudited types (no schema in registry, validated as pass-through): ${[...unaudited].sort().join(', ')}`);
  }

  if (drift.length === 0) {
    console.log(`\nNo contract drift. All ${rows.length} artifact(s) match their contracts.\n`);
    process.exit(0);
  }

  console.log(`\n${drift.length} artifact(s) DRIFTED from their contract:\n`);
  for (const d of drift) {
    console.log(`  [${d.type}] artifact ${d.id} (project ${d.project_id ?? 'none'})`);
    for (const issue of d.issues.slice(0, 8)) console.log(`      - ${issue}`);
    if (d.issues.length > 8) console.log(`      ... and ${d.issues.length - 8} more`);
  }
  console.log('');
  process.exit(1);
}

main().catch((e) => {
  console.error('Audit crashed:', e);
  process.exit(2);
});
