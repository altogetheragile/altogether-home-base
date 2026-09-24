// ============= Which databases a browser on this deployment may contact =============
//
// The Content Security Policy in vercel.json names the Supabase host explicitly, because a policy
// that says "anywhere" is not doing the job it exists for. That is right, and it has a
// consequence: `vercel.json` lives in this repository, and every site is its own deployment of
// this same repository, so one file has to be true for all of them at once.
//
// Until this list existed, the project ref was typed out three times inside three different
// policy strings. A second site would have loaded, rendered, and then failed every request to its
// own database, in the browser, with a CSP violation rather than an error anyone would recognise
// as this. Nothing would have pointed here.
//
// So: add the new project's host here, and the test beside this file says exactly what
// vercel.json must then contain. Adding a site is one line and a paste. That is the trade chosen
// over `*.supabase.co`, which would need no edit ever and would let injected script talk to a
// database of the attacker's choosing.

/** Every Supabase project any deployment of this repository talks to.
 *
 *  One entry per site. Host only: the scheme is added per protocol, since Supabase is reached
 *  over both https (REST, auth, storage) and wss (realtime), and a policy that allows one and
 *  forgets the other breaks only the feature nobody tests by hand. */
export const SUPABASE_HOSTS = [
  // altogetheragile.com
  'wqaplkypnetifpqrungv.supabase.co',
] as const;

/** The other origins the browser is allowed to reach, which are the same for every site. */
export const SHARED_CONNECT_SRC = [
  "'self'",
  'https://api.ipify.org',
  'https://*.ingest.de.sentry.io',
] as const;

/** The exact `connect-src` directive every policy in vercel.json must carry.
 *
 *  Built here rather than written out, so the three policies cannot drift apart: they are three
 *  different policies (the App needs Credly and YouTube, the Site does not) that have to agree on
 *  this one directive. */
export function connectSrcDirective(hosts: readonly string[] = SUPABASE_HOSTS): string {
  const databases = hosts.flatMap((h) => [`https://${h}`, `wss://${h}`]);
  const [self, ...rest] = SHARED_CONNECT_SRC;
  return ['connect-src', self, ...databases, ...rest].join(' ');
}
