import { describe, it, expect } from 'vitest';
import { walkthrough, namesFor } from './walkthrough';
import { vercelProjects, slugFrom } from './plan';

// Somebody following this has no way to tell a right instruction from a wrong one: that is the
// point of being walked through something. So the instructions have to be checked here, because
// the cost of a wrong one is a stranded half-built site and an evening lost.

const answers = { name: 'Bramble & Fern', domain: 'brambleandfern.com', email: 'al@example.com' };
const steps = walkthrough(answers);
const all = JSON.stringify(steps);

describe('the shape of it', () => {
  it('is ten steps, numbered from one', () => {
    expect(steps.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('says something useful at every step', () => {
    for (const s of steps) {
      expect(s.title.trim().length, `step ${s.n} has no title`).toBeGreaterThan(4);
      expect(s.body.trim().length, `step ${s.n} barely says anything`).toBeGreaterThan(60);
    }
  });

  it('never leaves somebody wondering which website they are on', () => {
    // Every step that happens somewhere else links there.
    for (const s of steps.filter((x) => [1, 2, 4, 5, 6, 7, 8, 9].includes(x.n))) {
      expect(s.go?.href, `step ${s.n} says to go somewhere but does not link it`).toMatch(/^https:\/\//);
    }
  });
});

describe('the names it tells you to type', () => {
  const { slug, siteProject, appProject, domain } = namesFor(answers);

  it('works them out from the domain, so nothing has to be invented', () => {
    expect(slug).toBe('brambleandfern');
    expect(siteProject).toBe('brambleandfern-web-next');
    expect(appProject).toBe('brambleandfern');
    expect(domain).toBe('brambleandfern.com');
  });

  it('agrees with what the command line would create', () => {
    // Two routes to the same thing. If they name projects differently, a site half-made one way
    // cannot be finished the other.
    const specs = vercelProjects({ slug: slugFrom(answers.domain), domain, repo: 'x', supabaseUrl: 'https://a.supabase.co', anonKey: 'k' });
    expect(specs.find((s) => s.role === 'site')!.name).toBe(siteProject);
    expect(specs.find((s) => s.role === 'app')!.name).toBe(appProject);
  });

  it('takes a domain somebody pasted with https on the front', () => {
    expect(namesFor({ ...answers, domain: 'https://brambleandfern.com/' }).domain).toBe('brambleandfern.com');
  });
});

describe('the environment variables it asks for', () => {
  const step4 = steps.find((s) => s.n === 4)!;
  const step5 = steps.find((s) => s.n === 5)!;
  const names = (s: typeof step4) => (s.copy ?? []).map((c) => c.label);

  it('gives the public pages project all three of its own', () => {
    for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SITE_URL']) {
      expect(names(step4), `step 4 never mentions ${key}`).toContain(key);
    }
  });

  it('gives the other project the two that decide whether the site works at all', () => {
    // Without SITE_DEPLOYMENT_HOST the new site serves this site's pages. Without
    // SUPABASE_CSP_HOSTS it renders with no content and only a console warning.
    expect(names(step5)).toContain('SITE_DEPLOYMENT_HOST');
    expect(names(step5)).toContain('SUPABASE_CSP_HOSTS');
  });

  it('points SITE_DEPLOYMENT_HOST at the project step 4 just made', () => {
    const value = step5.copy!.find((c) => c.label === 'SITE_DEPLOYMENT_HOST')!.value;
    expect(value).toBe('brambleandfern-web-next.vercel.app');
  });

  it('warns about the one that fails silently', () => {
    expect(step5.watch, 'nothing warns about SITE_DEPLOYMENT_HOST').toMatch(/SITE_DEPLOYMENT_HOST/);
    expect(step5.watch).toMatch(/no error|without|instead/i);
  });

  it('warns about the Root Directory, which is the usual way step 4 goes wrong', () => {
    expect(step4.watch).toMatch(/Root Directory/i);
  });

  it('spells the placeholder one way throughout', () => {
    // Parsing a URL lowercases its host, so SUPABASE_CSP_HOSTS came back as
    // your-project-ref.supabase.co beside a URL saying YOUR-PROJECT-REF. To somebody who has not
    // done this before, that reads as two different values.
    const placeholders = [...steps.flatMap((s) => s.copy ?? [])]
      .map((c) => c.value)
      .filter((v) => /your-project-ref/i.test(v));
    expect(placeholders.length).toBeGreaterThan(1);
    for (const v of placeholders) {
      expect(v, `spelled differently in: ${v}`).not.toMatch(/your-project-ref/);
    }
  });
});

describe('what it must never tell somebody to do', () => {
  it('never asks for a token or a password to be typed into this site', () => {
    // The whole reason this is a walk-through rather than a button. Nothing here is a box to
    // paste a secret into.
    for (const s of steps) {
      for (const c of s.copy ?? []) {
        expect(c.value, `step ${s.n} offers to copy something that looks like a secret`).not.toMatch(/^sbp_|^vercel_|service_role/);
      }
    }
    expect(all).not.toMatch(/paste (your|the) (token|key|password) (here|below|into)/i);
  });

  it('warns people off the service_role key where it could be confused', () => {
    // Step 2 sends somebody to a page showing both keys. Picking the wrong one puts a key that
    // bypasses every security rule into a public website.
    expect(steps.find((s) => s.n === 2)!.watch).toMatch(/service_role/);
  });

  it('never claims the database password can be found again', () => {
    expect(steps.find((s) => s.n === 1)!.body).toMatch(/only time|copy it/i);
  });
});

describe('the step that cannot be done in a browser', () => {
  const step3 = steps.find((s) => s.n === 3)!;

  it('says plainly why it needs a terminal', () => {
    expect(step3.body).toMatch(/terminal/i);
    expect(step3.body).toMatch(/no way|cannot|offers no/i);
  });

  it('gives the commands complete, including where to run them', () => {
    const values = step3.copy!.map((c) => c.value).join('\n');
    expect(values).toMatch(/cd /);
    expect(values).toMatch(/supabase link/);
    expect(values).toMatch(/supabase db push/);
  });
});

describe('making yourself an admin', () => {
  const step8 = steps.find((s) => s.n === 8)!;

  it('uses the email that was given', () => {
    expect(step8.copy![0].value).toContain('al@example.com');
  });

  it('says that signing up is not enough on its own', () => {
    expect(step8.watch).toMatch(/not enough|nothing makes/i);
  });

  it('falls back to a placeholder rather than an empty quoted string', () => {
    const without = walkthrough({ ...answers, email: '' }).find((s) => s.n === 8)!;
    expect(without.copy![0].value).not.toMatch(/=\s*''/);
    expect(without.copy![0].value).toContain('you@example.com');
  });
});
