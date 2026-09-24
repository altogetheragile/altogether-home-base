import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ============= The routing, told which site it is deploying =============
//
// This was vercel.json, and it could not be. Every site built from this repository is another
// deployment of this same file, and two things in it are per-site: the address of the Next
// deployment the public URLs are rewritten to, and the database the browser is allowed to talk
// to. Both were written out literally.
//
// The rewrites were the dangerous one. A second site's root project read this file, rewrote its
// own home page, About and Coaching to altogetheragile.com's Next deployment, and served that
// site's pages under the new domain. No error, no log line, nothing to notice: just a convincing
// wrong site. The Content Security Policy failed more honestly, with an empty page and a console
// warning, and was fixed once already by naming every site's database in one list.
//
// Vercel runs this file at build time, so both can come from the deployment's own environment.
// It replaces vercel.json rather than joining it: one configuration file per project.
//
// WHY THE DATA IS STILL JSON, in config/vercel/routing.json rather than inline here. A hundred
// and nine redirects and seventeen rewrites are data, they are read by the sitemap checker and
// by four tests, and none of those can import TypeScript. Keeping them as JSON means one copy
// that everything reads, and leaves this file as the small part that varies: what the hosts are.

type Header = { key: string; value: string };
type Rule = { source: string; destination?: string; headers?: Header[]; [k: string]: unknown };
type Routing = {
  buildCommand: string;
  outputDirectory: string;
  framework: string;
  headers: { source: string; headers: Header[] }[];
  redirects: Rule[];
  rewrites: Rule[];
};

// Resolved from the working directory rather than from import.meta.url: Vercel builds from the
// repository root and so does the test runner, and import.meta.url is not a file URL under every
// transform this file passes through.
const routing: Routing = JSON.parse(
  readFileSync(resolve(process.cwd(), 'config/vercel/routing.json'), 'utf8'),
);

/** The Next deployment that answers the public pages, as written in the data file. Everything
 *  the rewrites point at, so it is what gets replaced. */
export const SHIPPED_SITE_HOST = 'altogether-home-base-web-next.vercel.app';

/** The database named in the shipped policy. */
export const SHIPPED_SUPABASE_HOST = 'wqaplkypnetifpqrungv.supabase.co';

/** This deployment's Next host, from the environment, falling back to the one in the data.
 *
 *  The fallback is what makes this safe to merge: with nothing set, every deployment behaves
 *  exactly as it did when this was vercel.json. A second site sets the variable. */
export const siteHost = (env: NodeJS.ProcessEnv = process.env): string =>
  env.SITE_DEPLOYMENT_HOST?.trim() || SHIPPED_SITE_HOST;

/** The databases this deployment's browser may contact. Comma separated, because a site may talk
 *  to more than one during a migration, and because an environment variable cannot hold a list
 *  any other way. */
export const supabaseHosts = (env: NodeJS.ProcessEnv = process.env): string[] => {
  const given = env.SUPABASE_CSP_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean);
  return given?.length ? given : [SHIPPED_SUPABASE_HOST];
};

/** Point every rewrite at this deployment's own Next app.
 *
 *  Only the host is touched, and only where it is the one the data names. A rewrite to anywhere
 *  else, such as Vercel's analytics script, is left exactly as it is. */
export function rewritesFor(host: string, rules: Rule[] = routing.rewrites): Rule[] {
  return rules.map((rule) => {
    const destination = typeof rule.destination === 'string' ? rule.destination : undefined;
    if (!destination?.includes(SHIPPED_SITE_HOST)) return rule;
    return { ...rule, destination: destination.replace(SHIPPED_SITE_HOST, host) };
  });
}

/** Rewrite the `connect-src` directive in every policy so it names this deployment's databases.
 *
 *  The rest of each policy is untouched. The three differ on purpose elsewhere, and this is the
 *  one directive they have to agree on. */
export function headersFor(
  hosts: string[],
  groups: Routing['headers'] = routing.headers,
): Routing['headers'] {
  const databases = hosts.flatMap((h) => [`https://${h}`, `wss://${h}`]).join(' ');
  return groups.map((group) => ({
    ...group,
    headers: group.headers.map((header) => {
      if (header.key !== 'Content-Security-Policy') return header;
      const value = header.value
        .split(';')
        .map((directive) => {
          const trimmed = directive.trim();
          if (!trimmed.startsWith('connect-src ')) return directive;
          // Everything that is not one of the shipped database entries stays, in its own order:
          // 'self', the IP lookup, and Sentry are the same wherever this is deployed.
          const kept = trimmed
            .split(/\s+/)
            .slice(1)
            .filter((entry) => !/^(https|wss):\/\/\S+\.supabase\.co$/.test(entry));
          return ` connect-src ${kept[0]} ${databases} ${kept.slice(1).join(' ')}`;
        })
        .join(';');
      return { ...header, value };
    }),
  }));
}

/** The whole configuration, for a given environment. Exported so a test can build it for an
 *  environment that is not this one. */
export function buildConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    buildCommand: routing.buildCommand,
    outputDirectory: routing.outputDirectory,
    framework: routing.framework,
    headers: headersFor(supabaseHosts(env)),
    redirects: routing.redirects,
    rewrites: rewritesFor(siteHost(env)),
  };
}

export const config = buildConfig();
