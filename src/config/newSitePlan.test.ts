import { describe, it, expect } from 'vitest';
// @ts-expect-error - a plain .mjs module, imported here so the planning can be tested without
// creating a Supabase project and two Vercel projects to find out whether it was right.
import { validate, vercelProjects, steps, dnsInstructions, generatePassword } from '../../scripts/new-site/plan.mjs';

// This script creates real, paid infrastructure. Everything that can be checked before it does
// is checked here, because the alternative is learning the plan was wrong by watching it make
// half a site.

const good = {
  name: 'Bramble & Fern',
  domain: 'brambleandfern.com',
  slug: 'bramble-and-fern',
  orgId: 'abcdefghijklmnopqrst',
  dbPassword: 'a'.repeat(24),
  region: 'eu-west-2',
};

describe('what it refuses before touching anything', () => {
  it('accepts a complete, sensible set of answers', () => {
    expect(validate(good)).toEqual([]);
  });

  it('refuses a domain given as a URL', () => {
    // Pasting the address bar is the obvious mistake, and https://x.com/ as a domain produces a
    // Vercel error three steps later that says nothing about why.
    expect(validate({ ...good, domain: 'https://brambleandfern.com' })).toHaveLength(1);
    expect(validate({ ...good, domain: 'brambleandfern.com/' })).toHaveLength(1);
  });

  it('refuses a project name that is not a slug', () => {
    for (const slug of ['Bramble & Fern', 'bramble_fern', '2fern', 'ab']) {
      expect(validate({ ...good, slug }), slug).toHaveLength(1);
    }
  });

  it('refuses a short database password', () => {
    // It cannot be recovered from the dashboard, and it is needed again for db push.
    expect(validate({ ...good, dbPassword: 'short' })).toHaveLength(1);
  });

  it('collects every problem at once rather than one per run', () => {
    expect(validate({}).length).toBeGreaterThan(4);
  });
});

describe('the two Vercel projects', () => {
  const made = vercelProjects({
    slug: 'bramble-and-fern',
    domain: 'brambleandfern.com',
    repo: 'altogetheragile/altogether-home-base',
    supabaseUrl: 'https://abcdefgh.supabase.co',
    anonKey: 'anon-key',
  });
  // The module is plain JavaScript, so its shape is described here rather than imported.
  type Project = {
    role: string; name: string; order: number; rootDirectory: string | null;
    domain?: string; env: Record<string, string>;
  };
  const site = (made as Project[]).find((p) => p.role === 'site')!;
  const app = (made as Project[]).find((p) => p.role === 'app')!;

  it('makes the Site first, because the App needs its address', () => {
    // The App's routing config reads SITE_DEPLOYMENT_HOST at build time. Built before the Site
    // project exists, every public URL on the new site rewrites to altogetheragile.com.
    expect(site.order).toBeLessThan(app.order);
    expect(app.env.SITE_DEPLOYMENT_HOST).toBe('bramble-and-fern-web-next.vercel.app');
    expect(app.env.SITE_DEPLOYMENT_HOST).toBe(`${site.name}.vercel.app`);
  });

  it('gives the App its own database in the security policy', () => {
    // Without this the site loads, renders, and shows no content at all, with only a console
    // warning to say why.
    expect(app.env.SUPABASE_CSP_HOSTS).toBe('abcdefgh.supabase.co');
    expect(app.env.SUPABASE_CSP_HOSTS).not.toContain('wqaplkyp');
  });

  it('points each project at the right directory', () => {
    expect(site.rootDirectory).toBe('apps/web');
    expect(app.rootDirectory).toBeNull();
  });

  it('never leaves a site URL pointing at this one', () => {
    for (const p of made as Project[]) {
      for (const [key, value] of Object.entries(p.env)) {
        expect(String(value), `${p.name}.${key}`).not.toMatch(/altogetheragile\.com/);
      }
    }
  });

  it('gives both halves the same database', () => {
    expect(site.env.NEXT_PUBLIC_SUPABASE_URL).toBe(app.env.VITE_SUPABASE_URL);
    expect(site.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(app.env.VITE_SUPABASE_ANON_KEY);
  });

  it('only the project that answers the domain claims it', () => {
    expect(app.domain).toBe('brambleandfern.com');
    expect(site.domain).toBeUndefined();
  });
});

describe('the order of the whole thing', () => {
  const plan = steps(good);
  const ids = plan.map((s: { id: string }) => s.id);

  it('never needs something an earlier step has not produced', () => {
    const made = new Set<string>();
    for (const step of plan) {
      for (const need of step.needs ?? []) {
        expect(made.has(need), `${step.id} needs ${need}, which nothing has produced yet`).toBe(true);
      }
      for (const p of step.produces ?? []) made.add(p);
    }
  });

  it('creates the database before anything that writes to it', () => {
    expect(ids.indexOf('supabase-project')).toBeLessThan(ids.indexOf('migrations'));
    expect(ids.indexOf('migrations')).toBeLessThan(ids.indexOf('admin'));
  });

  it('is honest about the two steps a script cannot do', () => {
    const manual = plan.filter((s: { manual: boolean }) => s.manual).map((s: { id: string }) => s.id);
    // DNS is at a registrar and the wizard is a person making decisions. Everything else is an
    // API call, and claiming otherwise would have somebody waiting for a site that never appears.
    expect(manual).toEqual(['dns', 'wizard']);
  });

  it('explains the steps whose failure is silent', () => {
    const quiet = plan.filter((s: { id: string }) => ['auth-config', 'vercel-app', 'admin'].includes(s.id));
    for (const step of quiet) expect(step.note, `${step.id} has no note`).toBeTruthy();
  });
});

describe('the DNS somebody has to type', () => {
  it('gives an apex domain an A record', () => {
    expect(dnsInstructions('brambleandfern.com')).toEqual([{ type: 'A', name: '@', value: '76.76.21.21' }]);
  });

  it('gives a subdomain a CNAME', () => {
    expect(dnsInstructions('www.brambleandfern.com')[0].type).toBe('CNAME');
  });

  it('prefers what Vercel actually returned over the guess', () => {
    const real = [{ type: 'A', name: '@', value: '1.2.3.4' }];
    expect(dnsInstructions('brambleandfern.com', real)).toBe(real);
  });
});

describe('the generated password', () => {
  it('is long enough to pass its own validation', () => {
    const pw = generatePassword(new Uint8Array(24).map((_, i) => i * 7));
    expect(validate({ ...good, dbPassword: pw })).toEqual([]);
  });

  it('avoids the characters that get misread when somebody copies it by hand', () => {
    const pw = generatePassword(new Uint8Array(200).map((_, i) => i));
    expect(pw).not.toMatch(/[0O1lI]/);
  });
});
