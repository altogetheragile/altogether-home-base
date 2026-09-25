// ============= Stand up a new site =============
//
//   node scripts/new-site.mjs --name "Her Business" --domain herbusiness.com
//   node scripts/new-site.mjs --name "Her Business" --domain herbusiness.com --apply
//
// Without --apply it creates nothing and prints what it would do. With it, it creates a Supabase
// project, applies every migration, sets the auth redirects, creates both Vercel projects with
// their environment variables, claims the domain, and makes the first admin. Then it prints the
// DNS records to add and the address of the setup wizard.
//
// Needs two tokens in the environment, both revocable, neither stored anywhere:
//
//   SUPABASE_ACCESS_TOKEN   supabase.com/dashboard/account/tokens
//   VERCEL_TOKEN            vercel.com/account/tokens
//
// This is a script and not a page in Admin on purpose. A web tool that provisions other sites
// needs those tokens kept somewhere, and makes Admin on one site a way into all of them. See
// docs/NEW_SITE_SETUP.md section 2.
//
// Idempotent where it can be: each step looks for what it would create before creating it, so a
// run that stopped halfway can be run again rather than leaving a second of everything.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { validate, vercelProjects, steps, dnsInstructions, generatePassword } from './new-site/plan.mjs';

const REPO = 'altogetheragile/altogether-home-base';

// ── What was asked for ──────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2).reduce((out, a, i, all) => {
    if (a.startsWith('--')) out.push([a.slice(2), all[i + 1]?.startsWith('--') === false ? all[i + 1] : true]);
    return out;
  }, []),
);
const APPLY = args.apply === true;

const input = {
  name: args.name,
  domain: args.domain,
  slug: args.slug || String(args.domain ?? '').split('.')[0].replace(/[^a-z0-9-]/g, '-'),
  orgId: args.org || process.env.SUPABASE_ORG_ID,
  region: args.region || 'eu-west-2',
  dbPassword: args['db-password'] || generatePassword(randomBytes(28)),
};

// ── Talking to the two APIs ─────────────────────────────────────────

const tokens = {
  supabase: process.env.SUPABASE_ACCESS_TOKEN,
  vercel: process.env.VERCEL_TOKEN,
};

async function api(which, path, init = {}) {
  const base = which === 'supabase' ? 'https://api.supabase.com' : 'https://api.vercel.com';
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokens[which]}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${which} ${path} answered ${response.status}: ${text.slice(0, 300)}`);
  }
  return body;
}

const say = (s = '') => console.log(s);
const step = (n, total, what) => say(`\n[${n}/${total}] ${what}`);

// ── Before anything ─────────────────────────────────────────────────

const problems = validate(input);
if (problems.length) {
  say('This cannot be run yet:\n');
  for (const p of problems) say(`  - ${p}`);
  say('\n  node scripts/new-site.mjs --name "Her Business" --domain herbusiness.com');
  process.exit(1);
}

const plan = steps(input);
say(`\n=== ${APPLY ? 'Standing up' : 'What would be done for'} ${input.name} ===\n`);
say(`  domain    ${input.domain}`);
say(`  projects  ${input.slug} (the app) and ${input.slug}-web-next (the public pages)`);
say(`  region    ${input.region}`);
say(`  repo      ${REPO}`);
say('\n  Steps:');
for (const [i, s] of plan.entries()) {
  say(`   ${String(i + 1).padStart(2)}. ${s.what}${s.manual ? '   (by hand)' : ''}`);
  if (s.note) say(`       ${s.note}`);
}

if (!APPLY) {
  say('\nNothing was created. Re-run with --apply to do it.');
  say('Needs SUPABASE_ACCESS_TOKEN and VERCEL_TOKEN in the environment.');
  process.exit(0);
}

for (const [which, token] of Object.entries(tokens)) {
  if (!token) { say(`\nNo ${which.toUpperCase()}_ACCESS_TOKEN / TOKEN in the environment. Nothing was created.`); process.exit(1); }
}

// ── Doing it ────────────────────────────────────────────────────────

const total = plan.filter((s) => !s.manual).length;
let n = 0;

// 1. The database.
step(++n, total, `Supabase project "${input.slug}"`);
const existing = (await api('supabase', '/v1/projects')).find((p) => p.name === input.slug);
let project = existing;
if (existing) {
  say(`  already there (${existing.id}), left alone`);
} else {
  project = await api('supabase', '/v1/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: input.slug, organization_id: input.orgId,
      region: input.region, db_pass: input.dbPassword, plan: 'free',
    }),
  });
  say(`  created ${project.id}`);
  say('  waiting for it to come up, which takes a couple of minutes');
  for (let i = 0; i < 60; i++) {
    const p = await api('supabase', `/v1/projects/${project.id}`);
    if (p.status === 'ACTIVE_HEALTHY') { say('  up'); break; }
    await new Promise((r) => setTimeout(r, 10_000));
  }
}
const ref = project.id;
const supabaseUrl = `https://${ref}.supabase.co`;
const keys = await api('supabase', `/v1/projects/${ref}/api-keys`);
const anonKey = (keys.find((k) => k.name === 'anon') ?? keys[0]).api_key;

// 2. The schema. Through the CLI: the Management API has no endpoint that runs SQL.
step(++n, total, 'Applying the migrations');
execFileSync('npx', ['supabase', 'link', '--project-ref', ref, '--password', input.dbPassword],
  { stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: tokens.supabase } });
execFileSync('npx', ['supabase', 'db', 'push', '--linked', '--password', input.dbPassword],
  { stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: tokens.supabase } });

// 3. Where a sign-in link is allowed to land.
step(++n, total, 'Auth site URL and redirect allowlist');
await api('supabase', `/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  body: JSON.stringify({
    site_url: `https://${input.domain}`,
    uri_allow_list: [`https://${input.domain}/**`].join(','),
  }),
});
say(`  sign-in links land on https://${input.domain}`);

// 4 and 5. The two Vercel projects, in the order the plan insists on.
const teamQuery = args.team ? `?teamId=${args.team}` : '';
const made = {};
for (const spec of vercelProjects({ ...input, repo: REPO, supabaseUrl, anonKey })) {
  step(++n, total, `Vercel project "${spec.name}" (${spec.why})`);
  let existingProject = null;
  try { existingProject = await api('vercel', `/v9/projects/${spec.name}${teamQuery}`); } catch { /* not there */ }
  if (existingProject) {
    say('  already there, left alone');
    made[spec.role] = existingProject;
  } else {
    made[spec.role] = await api('vercel', `/v11/projects${teamQuery}`, {
      method: 'POST',
      body: JSON.stringify({
        name: spec.name,
        framework: spec.framework,
        rootDirectory: spec.rootDirectory,
        gitRepository: { type: 'github', repo: spec.repo },
        environmentVariables: Object.entries(spec.env).map(([key, value]) => ({
          key, value, target: ['production', 'preview'], type: 'encrypted',
        })),
      }),
    });
    say(`  created, with ${Object.keys(spec.env).length} environment variables`);
    for (const key of Object.keys(spec.env)) say(`    ${key}`);
  }
  if (spec.domain) {
    step(++n, total, `Pointing ${spec.domain} at it`);
    try {
      await api('vercel', `/v10/projects/${spec.name}/domains${teamQuery}`, {
        method: 'POST', body: JSON.stringify({ name: spec.domain }),
      });
      say('  claimed');
    } catch (e) {
      say(`  ${String(e.message).includes('already') ? 'already claimed' : e.message}`);
    }
  }
}

// 6. Somebody who can open the wizard.
step(++n, total, 'The first admin');
const email = args.email;
if (!email) {
  say('  skipped: pass --email her@example.com to create it');
} else {
  const service = (await api('supabase', `/v1/projects/${ref}/api-keys`)).find((k) => k.name === 'service_role')?.api_key;
  const created = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: input.dbPassword, email_confirm: true }),
  }).then((r) => r.json());
  if (created.id) {
    await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
      method: 'POST',
      headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: created.id, role: 'admin' }),
    });
    say(`  ${email} can sign in and is an admin`);
  } else {
    say(`  could not create the account: ${created.msg ?? created.message ?? 'unknown'}`);
  }
}

// ── What is left for a person ───────────────────────────────────────

say('\n=== Two things left, and they are yours ===\n');
say(`1. At your registrar, point ${input.domain} at Vercel:`);
for (const r of dnsInstructions(input.domain)) say(`     ${r.type.padEnd(6)} ${r.name.padEnd(4)} ${r.value}`);
say('\n2. Then open the wizard and make it theirs:');
say(`     https://${input.domain}/setup`);
say('\nKeep this database password somewhere safe. It is needed for db push and cannot be read back:');
say(`     ${input.dbPassword}\n`);
