import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SUPABASE_HOSTS, connectSrcDirective } from './supabaseHosts';

// A CSP failure is quiet in a way most breakage is not.
//
// The page loads. It renders. Then every call to the database is refused by the browser, and what
// the person sees is a site where nothing has any content in it. The only sign of the real cause
// is a violation line in the console, which nobody is reading on the day they point a new domain
// at a new deployment for the first time.
//
// This checks the one directive that decides that, in every policy the file declares.

const policies = (): { source: string; value: string }[] =>
  JSON.parse(readFileSync('vercel.json', 'utf8'))
    .headers.flatMap((h: { source: string; headers: { key: string; value: string }[] }) =>
      h.headers
        .filter((x) => x.key === 'Content-Security-Policy')
        .map((x) => ({ source: h.source, value: x.value })),
    );

/** The connect-src directive out of one policy, normalised for whitespace so a reformat of the
 *  file is not reported as a policy change. */
const connectSrc = (policy: string): string | undefined =>
  policy
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .find((d) => d.startsWith('connect-src'));

describe('the content security policy', () => {
  it('declares a policy for every route, so nothing is left unprotected by accident', () => {
    expect(policies().length).toBeGreaterThan(0);
  });

  it('lets the browser reach every site database this repository deploys', () => {
    // The failing case this exists for: a second site, its own Supabase project, this file still
    // naming only the first one.
    for (const { source, value } of policies()) {
      const directive = connectSrc(value);
      expect(directive, `${source} has no connect-src, so it falls back to default-src 'self'`).toBeTruthy();
      for (const host of SUPABASE_HOSTS) {
        expect(directive, `${source} cannot reach ${host} over https`).toContain(`https://${host}`);
        // Realtime is the one that breaks alone, because it is the only thing on wss and the only
        // feature you do not notice is missing until something should have updated and did not.
        expect(directive, `${source} cannot reach ${host} over wss`).toContain(`wss://${host}`);
      }
    }
  });

  it('names no database that is not in the list', () => {
    // Otherwise a decommissioned project stays reachable in the policy forever, and the list stops
    // being the thing that tells you which databases exist.
    const allowed = new Set<string>(SUPABASE_HOSTS);
    for (const { source, value } of policies()) {
      const named = [...(connectSrc(value) ?? '').matchAll(/(?:https|wss):\/\/([a-z0-9-]+\.supabase\.co)/g)]
        .map((m) => m[1])
        .filter((h) => !allowed.has(h));
      expect([...new Set(named)], `${source} allows a database not in SUPABASE_HOSTS`).toEqual([]);
    }
  });

  it('says the same thing in every policy', () => {
    // Three policies, because the App needs Credly and YouTube and the Site does not. They differ
    // on purpose elsewhere and must not differ here: the copies were kept in step by hand until
    // this test existed, which works right up until the day somebody edits two of the three.
    const found = policies().map(({ source, value }) => ({ source, directive: connectSrc(value) }));
    const expected = connectSrcDirective();
    for (const { source, directive } of found) {
      expect(directive, `${source} is out of step. vercel.json should carry:\n\n  ${expected}\n`).toBe(expected);
    }
  });
});
