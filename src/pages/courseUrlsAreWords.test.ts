import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A course's address is words, not a uuid.
//
// Course pages were `/courses/0a8cc86f-9e9a-4f30-9d46-42bf49d8c464` - forty-odd characters of hex
// carrying nothing anybody would search for, in a result that has to compete with Reed and The
// Knowledge Academy for "agile training london". They are `/courses/agilepm-foundation` now.
//
// The uuid form still resolves, and must: four of them are indexed. They are sent to the slug with
// a permanent redirect rather than dropped, because Google has to fetch the old address to be told
// where it went. Serving the same course at two addresses would be worse than either.
//
// Held at the source, and against BOTH copies of the site: `/courses/:path*` is rewritten to the
// Next app, and the Vite SPA carries its own near-identical listing pages. Updating one and not the
// other is the trap the home page hero already fell into once.

const read = (f: string) => readFileSync(f, 'utf8');

const LINK_BUILDERS = [
  ['the Next course-card model', 'apps/web/src/lib/events-types.ts'],
  ['the Next home carousel', 'apps/web/src/app/HomeCarousel.tsx'],
  ['the SPA home page', 'src/pages/Home.tsx'],
  ['the SPA events page', 'src/pages/Events.tsx'],
  ['the sitemap', 'api/sitemap.xml.ts'],
] as const;

describe('every place that builds a course link', () => {
  it.each(LINK_BUILDERS)('prefers the slug in %s', (_name, file) => {
    const src = read(file);
    const byId = src.match(/\/courses\/\$\{[^}]*\}/g) ?? [];
    expect(byId.length, `${file} builds no course links at all any more`).toBeGreaterThan(0);
    for (const link of byId) {
      expect(link, `${file} still addresses a course by its uuid alone: ${link}`)
        .toMatch(/slug/);
    }
  });
});

describe('the course page', () => {
  const page = () => read('apps/web/src/app/courses/[id]/page.tsx');

  it('sends a uuid to the slug permanently', () => {
    // `permanentRedirect` answers 308, verified against a running server, not the 301 you might
    // expect. Google treats 308 as a permanent redirect exactly as it treats 301, so the uuid is
    // dropped from the index and its equity passed on. What matters is that it is not a 302: a
    // temporary redirect would leave the uuid in the index indefinitely.
    expect(page()).toMatch(/permanentRedirect\(`\/courses\/\$\{course\.slug\}`\)/);
  });

  it('only redirects when there is somewhere to send it', () => {
    // A row with no slug has to keep working at its uuid rather than redirecting to /courses/null.
    expect(page()).toMatch(/course\.slug && id !== course\.slug/);
  });

  it('points its canonical at the slug, not at whatever was asked for', () => {
    // Metadata is built before the redirect runs. A canonical naming the address we are redirecting
    // away from is a canonical that argues with itself.
    expect(page()).toMatch(/path: `\/courses\/\$\{course\.slug \|\| id\}`/);
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
