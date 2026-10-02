import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// What belongs to this practice, and what a second site inherits.
//
// `/scrum-on-one-page` went out on streamstrategy.co.uk, titled "Scrum on One Page - Stream
// Strategy", with this practice's icons and 28 pages of its course material behind it. The only
// thing covering it was her holding page, which is on the list to be turned off.
//
// It was gated on `show_zoo_game`, which defaults to false - and a site stood up from this one
// starts with a COPY of the settings, so hers was true. A flag describes what a site wants. It
// cannot describe what the content is.

const load = async (siteUrl?: string) => {
  vi.resetModules();
  if (siteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
  return import('./ourSite');
};

const was = process.env.NEXT_PUBLIC_SITE_URL;
beforeEach(() => { delete process.env.NEXT_PUBLIC_SITE_URL; });
afterEach(() => { if (was === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = was; });

describe('whose deployment this is', () => {
  it('is ours when nothing says otherwise, because that is what this repository builds', async () => {
    const { isOurSite } = await load(undefined);
    expect(isOurSite()).toBe(true);
  });

  it('is ours on our own address, with or without a trailing slash', async () => {
    expect((await load('https://altogetheragile.com')).isOurSite()).toBe(true);
    expect((await load('https://altogetheragile.com/')).isOurSite()).toBe(true);
  });

  it('is NOT ours on somebody else\'s', async () => {
    for (const url of ['https://www.streamstrategy.co.uk', 'https://streamstrategy.co.uk', 'https://example.com']) {
      expect((await load(url)).isOurSite(), `${url} was taken for ours`).toBe(false);
    }
  });

  it('is not fooled by a domain that merely contains ours', async () => {
    expect((await load('https://altogetheragile.com.example.net')).isOurSite()).toBe(false);
    expect((await load('https://notaltogetheragile.com')).isOurSite()).toBe(false);
  });
});

describe('the pages that are ours alone', () => {
  const sources = ['src/app/scrum-on-one-page/page.tsx', 'src/app/scrum-on-one-page/[slug]/page.tsx'];

  it('ask before rendering', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of sources) {
      const src = readFileSync(f, 'utf8');
      expect(src, `${f} does not check whose site it is on`).toContain('isOurSite()');
      expect(src, `${f} checks but does nothing about it`).toMatch(/if \(!isOurSite\(\)\) notFound\(\)/);
    }
  });

  it('ask before naming themselves, too', async () => {
    // The title is written by `generateMetadata`, which runs whatever the gate below it is about to
    // decide. On this Site that is the rule rather than the exception - /exams on a site with
    // show_exams false still answers "Practice Exams - Stream Strategy" - and for a module that is
    // somebody's own choice it is only untidy. For a page that is OURS it puts the name of this
    // practice's course material in the <title> on another company's domain.
    const { readFileSync } = await import('node:fs');
    for (const f of sources) {
      const src = readFileSync(f, 'utf8');
      const meta = src.slice(src.indexOf('export async function generateMetadata'));
      const body = meta.slice(0, meta.indexOf('\nexport default'));
      expect(body, `${f} names itself before asking whose site it is on`)
        .toMatch(/if \(!isOurSite\(\)\) return \{\}/);
    }
  });
});
