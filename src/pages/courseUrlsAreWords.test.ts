import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A course's address is words, not a uuid.
//
// Course pages were `/training/0a8cc86f-9e9a-4f30-9d46-42bf49d8c464` - forty-odd characters of hex
// carrying nothing anybody would search for, in a result that has to compete with Reed and The
// Knowledge Academy for "agile training london". They are `/training/agilepm-foundation` now.
//
// The uuid form still resolves, and must: four of them are indexed. They are sent to the slug with
// a permanent redirect rather than dropped, because Google has to fetch the old address to be told
// where it went. Serving the same course at two addresses would be worse than either.
//
// Held at the source, and against BOTH copies of the site: `/training/:path*` is rewritten to the
// Next app. The SPA used to carry its own near-identical listing pages and they were checked here
// too; those are gone, because the Site owns those URLs outright now and a second implementation of
// a page nobody is served was only ever somewhere for a bug to hide.

const read = (f: string) => readFileSync(f, 'utf8');

const LINK_BUILDERS = [
  ['the Next course-card model', 'apps/web/src/lib/events-types.ts'],
  ['the Next home carousel', 'apps/web/src/app/HomeCarousel.tsx'],
  // The sitemap. There is one of these now, and there were three: a serverless function that a
  // static file silently shadowed, and a Next route that served a different, shorter list on the
  // preview domain. Shipping a change to the function alone left the live sitemap advertising
  // uuids while every page on the site had moved to slugs, which is what three of anything buys
  // you.
  ['the sitemap', 'scripts/prerender.mjs'],
] as const;

describe('every place that builds a course link', () => {
  it.each(LINK_BUILDERS)('prefers the slug in %s', (_name, file) => {
    const src = read(file);
    const byId = src.match(/\/training\/\$\{[^}]*\}/g) ?? [];
    expect(byId.length, `${file} builds no course links at all any more`).toBeGreaterThan(0);
    for (const link of byId) {
      expect(link, `${file} still addresses a course by its uuid alone: ${link}`)
        .toMatch(/slug/);
    }
  });
});

describe('the course page', () => {
  const page = () => read('apps/web/src/app/training/[slug]/page.tsx');

  it('sends a uuid to the slug permanently', () => {
    // `permanentRedirect` answers 308, verified against a running server, not the 301 you might
    // expect. Google treats 308 as a permanent redirect exactly as it treats 301, so the uuid is
    // dropped from the index and its equity passed on. What matters is that it is not a 302: a
    // temporary redirect would leave the uuid in the index indefinitely.
    expect(page()).toMatch(/permanentRedirect\(`\/training\/\$\{course\.slug\}`\)/);
  });

  it('only redirects when there is somewhere to send it', () => {
    // A row with no slug has to keep working at its uuid rather than redirecting to /training/null.
    expect(page()).toMatch(/course\.slug && id !== course\.slug/);
  });

  it('points its canonical at the slug, not at whatever was asked for', () => {
    // Metadata is built before the redirect runs. A canonical naming the address we are redirecting
    // away from is a canonical that argues with itself.
    expect(page()).toMatch(/path: `\/training\/\$\{course\.slug \|\| id\}`/);
  });
});

describe('resolving a course', () => {
  const lib = () => read('apps/web/src/lib/events.ts');

  it('accepts either a slug or the uuid the old URLs used', () => {
    expect(lib()).toMatch(/UUID\.test\(idOrSlug\) \? 'id' : 'slug'/);
  });

  it('asks for the slug column, or the page could never redirect', () => {
    expect(lib().split('TEMPLATE_FIELDS')[1] ?? '').toMatch(/\bslug\b/);
  });
});
