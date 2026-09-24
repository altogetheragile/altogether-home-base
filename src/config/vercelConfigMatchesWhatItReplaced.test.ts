import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildConfig, rewritesFor, headersFor, siteHost, supabaseHosts } from '../../vercel';

// vercel.json became vercel.ts so that two per-site things could come from the environment. The
// whole risk of that change is in one question: does it still produce what it produced before?
//
// A wrong answer is not a broken build. It is a live site whose public URLs rewrite somewhere
// else, or whose browser is refused its own database, discovered by a visitor.

const routing = JSON.parse(readFileSync('config/vercel/routing.json', 'utf8'));

/** No environment at all, which is what every deployment of this site has today. */
const asShipped = buildConfig({} as NodeJS.ProcessEnv);

/** The Content Security Policy of one header group, which every caller here knows is there. */
const policyOf = (built: ReturnType<typeof buildConfig>, group: number): string => {
  const header = built.headers[group].headers.find((h) => h.key === 'Content-Security-Policy');
  if (!header) throw new Error(`no policy on header group ${group}`);
  return header.value;
};

describe('with nothing set, which is how this site deploys', () => {
  it('produces exactly the configuration it replaced', () => {
    // The whole object, compared at once. Anything this migration changed by accident fails here
    // rather than in production.
    expect(asShipped).toEqual(routing);
  });

  it('keeps every redirect, untouched', () => {
    // A hundred and nine of them, most pointing old WordPress URLs somewhere useful. Nothing in
    // this change should have come near them.
    // Equal, not identical: this test parses the file a second time, so they are different
    // objects with the same contents.
    expect(asShipped.redirects).toEqual(routing.redirects);
    expect(asShipped.redirects.length).toBeGreaterThan(100);
  });

  it('still answers the same build settings', () => {
    expect(asShipped.buildCommand).toBe(routing.buildCommand);
    expect(asShipped.outputDirectory).toBe(routing.outputDirectory);
    expect(asShipped.framework).toBe(routing.framework);
  });
});

describe('told it is a different site', () => {
  const env = {
    SITE_DEPLOYMENT_HOST: 'her-site-web-next.vercel.app',
    SUPABASE_CSP_HOSTS: 'abcdefghijklmnop.supabase.co',
  } as unknown as NodeJS.ProcessEnv;
  const hers = buildConfig(env);

  it('sends the public pages to her own Next deployment', () => {
    const site = hers.rewrites.filter((r) => String(r.destination).includes('web-next'));
    expect(site.length).toBeGreaterThan(10);
    for (const rule of site) {
      expect(rule.destination, `${rule.source} still points at this site`).toContain('her-site-web-next.vercel.app');
      expect(rule.destination).not.toContain('altogether-home-base-web-next');
    }
  });

  it('leaves rewrites that point somewhere else alone', () => {
    // Vercel's own analytics script is rewritten too, and has nothing to do with which site this
    // is. A substitution that caught it would break analytics on every site.
    const analytics = hers.rewrites.filter((r) => String(r.destination).includes('vercel-scripts.com'));
    expect(analytics.length).toBeGreaterThan(0);
    for (const rule of analytics) {
      expect(rule.destination).toBe(routing.rewrites.find((r: { source: string }) => r.source === rule.source).destination);
    }
  });

  it('lets her browser reach her database and not this one', () => {
    for (const group of hers.headers) {
      const csp = group.headers.find((h: { key: string }) => h.key === 'Content-Security-Policy');
      if (!csp) continue;
      expect(csp.value, `${group.source} cannot reach her database`).toContain('https://abcdefghijklmnop.supabase.co');
      expect(csp.value, `${group.source} can still reach this one`).not.toContain('wqaplkypnetifpqrungv');
    }
  });

  it('keeps wss beside https, because realtime is the thing that breaks alone', () => {
    const csp = policyOf(hers, 1);
    expect(csp).toContain('wss://abcdefghijklmnop.supabase.co');
  });

  it('leaves everything else in the policy exactly as it was', () => {
    // The three policies differ on purpose: the App needs Credly and YouTube, the Site does not.
    // Only connect-src is per-site, and only the database entries within it.
    for (const [i, group] of hers.headers.entries()) {
      const before = routing.headers[i].headers.find((h: { key: string }) => h.key === 'Content-Security-Policy');
      const after = group.headers.find((h: { key: string }) => h.key === 'Content-Security-Policy');
      if (!before) continue;
      const strip = (v: string) => v.split(';').filter((d: string) => !d.trim().startsWith('connect-src')).join(';');
      expect(strip(after!.value), `${group.source} changed outside connect-src`).toBe(strip(before.value));
    }
  });

  it('keeps self, the IP lookup and Sentry, which are the same everywhere', () => {
    const connect = policyOf(hers, 1).split(';').find((d: string) => d.trim().startsWith('connect-src'));
    expect(connect).toContain("'self'");
    expect(connect).toContain('https://api.ipify.org');
    expect(connect).toContain('https://*.ingest.de.sentry.io');
  });
});

describe('reading the environment', () => {
  it('falls back to this site when nothing is set', () => {
    expect(siteHost({} as NodeJS.ProcessEnv)).toBe('altogether-home-base-web-next.vercel.app');
    expect(supabaseHosts({} as NodeJS.ProcessEnv)).toEqual(['wqaplkypnetifpqrungv.supabase.co']);
  });

  it('ignores a variable that is set but empty', () => {
    // A Vercel project with the variable added and left blank is a likely accident, and taking it
    // literally would rewrite every public URL to https:///about.
    expect(siteHost({ SITE_DEPLOYMENT_HOST: '   ' } as unknown as NodeJS.ProcessEnv)).toBe('altogether-home-base-web-next.vercel.app');
    expect(supabaseHosts({ SUPABASE_CSP_HOSTS: ' , ' } as unknown as NodeJS.ProcessEnv)).toEqual(['wqaplkypnetifpqrungv.supabase.co']);
  });

  it('takes more than one database, for a site part way through a move', () => {
    expect(supabaseHosts({ SUPABASE_CSP_HOSTS: 'a.supabase.co, b.supabase.co' } as unknown as NodeJS.ProcessEnv))
      .toEqual(['a.supabase.co', 'b.supabase.co']);
  });
});

describe('the substitution itself', () => {
  it('changes nothing when the host is the one already there', () => {
    expect(rewritesFor('altogether-home-base-web-next.vercel.app')).toEqual(routing.rewrites);
  });

  it('changes nothing in the headers when the database is the one already there', () => {
    expect(headersFor(['wqaplkypnetifpqrungv.supabase.co'])).toEqual(routing.headers);
  });
});
