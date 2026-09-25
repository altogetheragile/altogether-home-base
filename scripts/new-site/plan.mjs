// ============= What standing up a site actually consists of =============
//
// Pure. No network, no tokens, no side effects: given what somebody typed, work out every call
// that would be made and in what order. The executor in ../new-site.mjs does them.
//
// Separated because this is the part worth testing. The alternative is finding out the plan was
// wrong by watching it create half a site and stop, and a half-created site is worse than none:
// the second run has to know what already exists.
//
// NOT a tool on the site. docs/NEW_SITE_SETUP.md rules that out, and the reason holds here: a web
// page that provisions other sites needs the Supabase and Vercel tokens stored somewhere, and
// makes Admin on one site a way into all of them. A script reads them from the shell, uses them
// once, and forgets them.

/** A project reference is eight to twenty lowercase letters. Checked here because the message
 *  "invalid ref" arriving from an API halfway through is a worse way to learn it. */
const SLUG = /^[a-z][a-z0-9-]{2,39}$/;
const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function validate({ name, domain, slug, orgId, dbPassword, region }) {
  const problems = [];
  if (!name?.trim()) problems.push('A business name is needed: it is what the site calls itself.');
  if (!DOMAIN.test(domain ?? '')) problems.push(`"${domain}" is not a domain. Give it without a scheme, as herbusiness.com.`);
  if (!SLUG.test(slug ?? '')) problems.push(`"${slug}" is not a usable project name: lowercase letters, digits and dashes, starting with a letter.`);
  if (!orgId?.trim()) problems.push('A Supabase organisation id is needed. The script lists yours if you leave it out.');
  if ((dbPassword ?? '').length < 16) problems.push('The database password should be at least 16 characters. It is generated for you unless you pass one.');
  if (!region?.trim()) problems.push('A region is needed, for example eu-west-2.');
  return problems;
}

/** The two Vercel projects, in the order they have to be made.
 *
 *  The Site first. The App's routing config reads SITE_DEPLOYMENT_HOST to know where to send the
 *  public pages, and that host does not exist until the Site project does. Creating them the
 *  other way round gives an App that rewrites every public URL to altogetheragile.com, which is
 *  the exact fault vercel.ts was written to remove.
 */
export function vercelProjects({ slug, domain, repo, supabaseUrl, anonKey }) {
  const siteName = `${slug}-web-next`;
  const siteHost = `${siteName}.vercel.app`;
  const url = `https://${domain}`;
  const supabaseHost = new URL(supabaseUrl).host;

  return [
    {
      order: 1,
      role: 'site',
      name: siteName,
      rootDirectory: 'apps/web',
      framework: 'nextjs',
      repo,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        NEXT_PUBLIC_SITE_URL: url,
      },
      why: 'Serves the public pages. Made first because the other project needs its address.',
    },
    {
      order: 2,
      role: 'app',
      name: slug,
      rootDirectory: null,
      framework: 'vite',
      repo,
      domain,
      env: {
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: anonKey,
        VITE_SITE_URL: url,
        // Read by vercel.ts at build time. Without the first, every public URL on this site
        // rewrites to altogetheragile.com. Without the second, the browser is refused its own
        // database and the site renders with no content at all.
        SITE_DEPLOYMENT_HOST: siteHost,
        SUPABASE_CSP_HOSTS: supabaseHost,
      },
      why: 'Answers the domain, and rewrites the public pages to the Site project.',
    },
  ];
}

/** Every step, in order, with what it needs and what it produces.
 *
 *  `needs` names an earlier step's output, so the executor can refuse to run a step whose input
 *  is missing rather than sending undefined to an API. */
export function steps(input) {
  const { name, domain, slug, region } = input;
  return [
    { id: 'supabase-project', what: `Create the Supabase project "${slug}" in ${region}`, produces: ['ref', 'supabaseUrl', 'anonKey'], manual: false },
    { id: 'migrations', what: 'Apply every migration to it', needs: ['ref'], produces: [], manual: false,
      note: 'Through the CLI: the Management API has no endpoint that runs SQL.' },
    { id: 'auth-config', what: `Set the auth Site URL and redirect allowlist to https://${domain}`, needs: ['ref'], produces: [], manual: false,
      note: 'Until this is set, a password reset link sends people to the wrong site.' },
    { id: 'vercel-site', what: 'Create the Vercel project for the public pages', needs: ['supabaseUrl', 'anonKey'], produces: ['siteHost'], manual: false },
    { id: 'vercel-app', what: 'Create the Vercel project that answers the domain', needs: ['siteHost', 'supabaseUrl', 'anonKey'], produces: [], manual: false,
      note: 'Carries SITE_DEPLOYMENT_HOST and SUPABASE_CSP_HOSTS, which the routing config reads at build time.' },
    { id: 'domain', what: `Add ${domain} to that project`, needs: [], produces: ['dnsRecords'], manual: false },
    { id: 'dns', what: `Point ${domain} at Vercel with the records printed at the end`, needs: ['dnsRecords'], produces: [], manual: true,
      note: 'At your registrar. Not in anybody’s API, and the only step here that cannot be automated.' },
    { id: 'admin', what: `Create the first account and make it an admin`, needs: ['ref'], produces: [], manual: false,
      note: 'The signup trigger grants "user" and nothing promotes anybody, so this is done directly.' },
    { id: 'wizard', what: `Open https://${domain}/setup and work through it`, needs: [], produces: [], manual: true,
      note: `The five steps that make it ${name} rather than a copy of this one.` },
  ];
}

/** What to tell somebody to type at their registrar. Vercel returns these; this is the shape. */
export function dnsInstructions(domain, records = []) {
  if (records.length) return records;
  const apex = domain.split('.').length === 2;
  return apex
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' }];
}

/** A password nobody has to invent. Generated locally and printed once, because it is needed
 *  again for `supabase db push` and is not recoverable from the dashboard. */
export function generatePassword(bytes) {
  return Array.from(bytes, (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[b % 57]).join('');
}
