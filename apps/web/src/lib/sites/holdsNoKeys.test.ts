import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hostOf, isThisSite, linksFor, troubleWith, statusOf } from './managed';

// This page exists to look at other people's sites. The property worth testing is not that it
// renders: it is that it cannot reach into them.

describe('what this page is allowed to know', () => {
  const source = readFileSync('src/lib/sites/managed.ts', 'utf8') + readFileSync('src/app/sites/page.tsx', 'utf8');

  it('never reads a key, a token or a password', () => {
    // A page that could edit another site would need that site's keys kept here, and an admin
    // account on this site would become the key to every site listed. For a client's site that
    // is a professional liability, and it would be inherited by every site after.
    for (const forbidden of ['SERVICE_ROLE', 'service_role', 'ANON_KEY', 'SUPABASE_ACCESS_TOKEN', 'VERCEL_TOKEN', 'password']) {
      expect(source, `names ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('only ever asks a site for what it tells everybody', () => {
    // /api/health and the home page. Both are public on every deployment.
    const fetched = [...source.matchAll(/https:\/\/\$\{host\}([^`]*)`/g)].map((m) => m[1]);
    expect(fetched.sort()).toEqual(['/', '/api/health']);
  });

  it('creates no Supabase client of its own', () => {
    expect(source).not.toContain('createClient');
  });
});

describe('the address, however it was typed', () => {
  it('takes a pasted URL and keeps the host', () => {
    for (const given of ['herbusiness.com', 'https://herbusiness.com', 'https://herbusiness.com/', 'HerBusiness.com', 'https://herbusiness.com/about']) {
      expect(hostOf(given), given).toBe('herbusiness.com');
    }
  });

  it('knows which of them is the site you are on', () => {
    expect(isThisSite('altogetheragile.com', 'https://altogetheragile.com')).toBe(true);
    expect(isThisSite('https://altogetheragile.com/', 'https://altogetheragile.com')).toBe(true);
    expect(isThisSite('herbusiness.com', 'https://altogetheragile.com')).toBe(false);
  });

  it('sends every link to the site itself, never to this one', () => {
    for (const link of linksFor('herbusiness.com')) {
      expect(link.href).toMatch(/^https:\/\/herbusiness\.com/);
    }
  });
});

describe('what it says when something is wrong', () => {
  // Three things actually go wrong when a site is being stood up, and they have three different
  // answers. A status code tells somebody nothing they can act on.

  it('no answer at all means the domain is probably not pointed yet', () => {
    expect(troubleWith(null, null)).toMatch(/not be pointed/i);
  });

  it('a 404 means the domain is on the wrong project', () => {
    expect(troubleWith(404, null)).toMatch(/wrong Vercel project|right Vercel project/i);
  });

  it('up but no database names the two things that cause it', () => {
    const said = troubleWith(503, { status: 'degraded', checks: { app: 'ok', supabase: 'degraded' } });
    expect(said).toMatch(/SUPABASE_CSP_HOSTS/);
    expect(said).toMatch(/paused/);
  });

  it('says nothing at all when a site is fine', () => {
    expect(troubleWith(200, { status: 'ok', checks: { app: 'ok', supabase: 'ok' } })).toBeNull();
  });
});

describe('asking a site how it is', () => {
  const reply = (status: number, body: unknown) =>
    ({ status, json: async () => body, text: async () => '<title>Her Business</title>' }) as unknown as Response;

  it('reports a healthy site as healthy, and what it calls itself', async () => {
    const s = await statusOf({ name: 'Hers', domain: 'herbusiness.com' }, (async () =>
      reply(200, { status: 'ok', checks: { app: 'ok', supabase: 'ok' } })) as unknown as typeof fetch);
    expect(s.healthy).toBe(true);
    expect(s.callsItself).toBe('Her Business');
    expect(s.trouble).toBeNull();
  });

  it('survives a site that does not answer, rather than failing the page', async () => {
    // One site being down must not take the list down with it.
    const s = await statusOf({ name: 'Hers', domain: 'herbusiness.com' }, (async () => {
      throw new Error('getaddrinfo ENOTFOUND');
    }) as unknown as typeof fetch);
    expect(s.reachable).toBe(false);
    expect(s.trouble).toMatch(/not be pointed/i);
    expect(s.links.length).toBeGreaterThan(0);
  });

  it('does not ask a site that is down what it calls itself', async () => {
    let calls = 0;
    await statusOf({ name: 'Hers', domain: 'herbusiness.com' }, (async () => {
      calls++; return reply(503, { status: 'degraded' });
    }) as unknown as typeof fetch);
    expect(calls, 'asked twice for a site that is already known to be down').toBe(1);
  });
});
