// Tear down the throwaway E2E test initiatives that the deployed Playwright
// write-specs (story-map-push, backlog-flow, pattern-save) create on the LIVE
// database. Each such spec names its project `E2E <thing> <run-id>`, so
// `E2E %` catches them all.
//
// Runs automatically as the deployed config's globalTeardown (see
// e2e/deployed.config.ts), and can be run standalone: `node scripts/.e2e-cleanup.mjs`.
//
// Auth: signs in as the e2e account (same creds the specs use) and deletes ITS
// OWN projects via RLS - no service-role key needed. Deleting a projects row
// cascades to project_artifacts, project_artifact_links and backlog_items.
//
// Creds: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment or .env;
// E2E_EMAIL / E2E_PASSWORD from the environment or .env.e2e. Missing creds -> it
// logs and no-ops (never throws), so it can never fail a test run.

import { readFileSync, existsSync, rmSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const root = new URL('../', import.meta.url);

function fromFile(file, name) {
  try {
    for (const line of readFileSync(new URL(file, root), 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i !== -1 && t.slice(0, i).trim() === name) {
        return t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* file optional */ }
  return undefined;
}
const readEnv = (name, file) => process.env[name] || fromFile(file, name);

export default async function cleanup() {
  const url = readEnv('VITE_SUPABASE_URL', '.env') || readEnv('SUPABASE_URL', '.env');
  const anon = readEnv('VITE_SUPABASE_ANON_KEY', '.env');
  const email = readEnv('E2E_EMAIL', '.env.e2e');
  const password = readEnv('E2E_PASSWORD', '.env.e2e');
  if (!url || !anon || !email || !password) {
    console.log('[e2e-cleanup] missing creds (VITE_SUPABASE_URL/ANON_KEY + E2E_EMAIL/PASSWORD) - skipping');
    return;
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.log('[e2e-cleanup] sign-in failed:', authErr.message, '- skipping');
    return;
  }

  // RLS scopes select/delete to this account's own rows; the FK cascade clears
  // each project's artifacts, backlog items and provenance links.
  const { data: doomed, error: selErr } = await supabase
    .from('projects').select('id, name').like('name', 'E2E %');
  if (selErr) {
    console.log('[e2e-cleanup] select failed:', selErr.message);
  } else if (!doomed || doomed.length === 0) {
    console.log('[e2e-cleanup] no E2E test projects to remove');
  } else {
    const { error: delErr } = await supabase.from('projects').delete().like('name', 'E2E %');
    if (delErr) console.log('[e2e-cleanup] delete failed:', delErr.message);
    else console.log(`[e2e-cleanup] removed ${doomed.length} E2E test project(s): ${doomed.map((p) => p.name).join(', ')}`);
  }

  // Drop the run marker so a stale project id is not left behind.
  try {
    const marker = new URL('e2e/.last-run.json', root);
    if (existsSync(marker)) rmSync(marker);
  } catch { /* ignore */ }

  await supabase.auth.signOut();
}

// Standalone entrypoint: `node scripts/.e2e-cleanup.mjs`
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  cleanup().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
