// ============= What creating a site consists of =============
//
// The same planning as scripts/new-site/plan.mjs, which the command line uses. Two copies because
// a .mjs script cannot import TypeScript and this app cannot import a file outside its own
// directory, and a test compares the two so they cannot drift.
//
// Pure: no network, no tokens. Given what somebody typed, work out what would be created.

const SLUG = /^[a-z][a-z0-9-]{2,39}$/;
const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export type NewSite = { name: string; domain: string; slug: string; region: string };

export function validate(input: Partial<NewSite> & { orgId?: string; dbPassword?: string }): string[] {
  const problems: string[] = [];
  if (!input.name?.trim()) problems.push('A business name is needed: it is what the site calls itself.');
  if (!DOMAIN.test(input.domain ?? '')) problems.push(`"${input.domain ?? ''}" is not a domain. Give it without a scheme, as herbusiness.com.`);
  if (!SLUG.test(input.slug ?? '')) problems.push(`"${input.slug ?? ''}" is not a usable project name: lowercase letters, digits and dashes, starting with a letter.`);
  if (!input.orgId?.trim()) problems.push('A Supabase organisation id is needed. It is on the settings page of any project.');
  if ((input.dbPassword ?? '').length < 16) problems.push('The database password should be at least 16 characters. It is generated for you.');
  if (!input.region?.trim()) problems.push('A region is needed, for example eu-west-2.');
  return problems;
}

export type ProjectSpec = {
  order: number;
  role: 'site' | 'app';
  name: string;
  rootDirectory: string | null;
  framework: string;
  domain?: string;
  env: Record<string, string>;
  why: string;
};

/** The two Vercel projects, in the order they must be made.
 *
 *  The Site first. The App's routing config reads SITE_DEPLOYMENT_HOST at build time, and that
 *  host does not exist until the Site project does. The other way round gives a site whose every
 *  public URL rewrites to altogetheragile.com. */
export function vercelProjects(input: {
  slug: string; domain: string; repo: string; supabaseUrl: string; anonKey: string;
}): ProjectSpec[] {
  const siteName = `${input.slug}-web-next`;
  const url = `https://${input.domain}`;
  const supabaseHost = new URL(input.supabaseUrl).host;

  return [
    {
      order: 1, role: 'site', name: siteName, rootDirectory: 'apps/web', framework: 'nextjs',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: input.supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: input.anonKey,
        NEXT_PUBLIC_SITE_URL: url,
      },
      why: 'Serves the public pages. Made first because the other project needs its address.',
    },
    {
      order: 2, role: 'app', name: input.slug, rootDirectory: null, framework: 'vite',
      domain: input.domain,
      env: {
        VITE_SUPABASE_URL: input.supabaseUrl,
        VITE_SUPABASE_ANON_KEY: input.anonKey,
        VITE_SITE_URL: url,
        SITE_DEPLOYMENT_HOST: `${siteName}.vercel.app`,
        SUPABASE_CSP_HOSTS: supabaseHost,
      },
      why: 'Answers the domain, and rewrites the public pages to the Site project.',
    },
  ];
}

/** A slug from a domain, so somebody typing herbusiness.com does not also have to invent one. */
export function slugFrom(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('.')[0].replace(/[^a-z0-9-]/g, '-');
}

/** A password nobody has to invent, avoiding characters that get misread when copied by hand. */
export function generatePassword(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[b % 57]).join('');
}

/** What to add at the registrar. The one step nobody's API can do. */
export function dnsFor(domain: string): { type: string; name: string; value: string }[] {
  return domain.split('.').length === 2
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' }];
}
