/**
 * Seed `site_copy` from the JSON registries.
 * Run: node scripts/seed-site-copy.mjs [--dry]
 *
 * Inserts any key the table does not have yet, and refreshes the label, hint and sort order of the
 * ones it does. It never touches `value` on an existing row: that column is whatever was last saved
 * in the editor, and the registry is only the wording the site shipped with.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COPY_DIR = resolve(ROOT, 'apps/web/src/lib/copy');
const dry = process.argv.includes('--dry');

function env(name) {
  if (process.env[name]) return process.env[name];
  const line = readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').find((l) => l.startsWith(name + '='));
  return line ? line.slice(name.length + 1).replace(/^['"]|['"]$/g, '').trim() : '';
}

const rows = [];
for (const file of readdirSync(COPY_DIR).filter((f) => f.endsWith('.json'))) {
  const reg = JSON.parse(readFileSync(resolve(COPY_DIR, file), 'utf-8'));
  Object.entries(reg.entries).forEach(([key, e], i) => {
    rows.push({ key, page: reg.page, value: e.value, label: e.label, hint: e.hint, sort: i });
  });
}
console.log(`${rows.length} entries across ${new Set(rows.map((r) => r.page)).size} page(s)`);

const sb = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
const { data: existing, error } = await sb.from('site_copy').select('key');
if (error) {
  console.error('cannot read site_copy:', error.message);
  console.error('has the table been created? see docs/SITE_COPY.md');
  process.exit(1);
}
const have = new Set((existing ?? []).map((r) => r.key));
const fresh = rows.filter((r) => !have.has(r.key));
const known = rows.filter((r) => have.has(r.key));

console.log(`  ${fresh.length} to insert, ${known.length} already present`);
if (dry) { fresh.forEach((r) => console.log('   +', r.key)); process.exit(0); }

if (fresh.length) {
  const { error: e } = await sb.from('site_copy').insert(fresh);
  if (e) { console.error('insert failed:', e.message); process.exit(1); }
  console.log(`  inserted ${fresh.length}`);
}
for (const r of known) {
  // Metadata only. `value` belongs to whoever last edited it.
  await sb.from('site_copy').update({ page: r.page, label: r.label, hint: r.hint, sort: r.sort }).eq('key', r.key);
}
console.log(`  refreshed metadata on ${known.length}`);
console.log('done');
