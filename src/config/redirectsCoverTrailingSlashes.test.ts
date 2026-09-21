import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Old WordPress URLs end in a slash, and the wildcard redirects did not.
//
// Found while chasing why the site answers 200 to URLs that should be dead. Measured against
// production:
//
//   /portfolio-items/agilepm-foundation-practice-exam-foundation    301 -> /
//   /portfolio-items/agilepm-foundation-practice-exam-foundation/   200          <-- the leak
//   /tag/anything/            200      /author/someone/   200      /category/whatever/   200
//
// `:path*` does not match a path with a trailing slash. Somebody had noticed the symptom and been
// fixing it one URL at a time - `/portfolio-items/introduction-to-agile/` and
// `/portfolio-items/m30-foundation-workshop/` both have hand-written trailing-slash rules beside
// their slashless twins - without the pattern being spotted. Everything not on that hand-written
// list fell through to the SPA, which answers 200 to anything and renders its Not Found page in
// the browser afterwards.
//
// That is a soft 404: Google gets a 200, keeps the URL, and spends crawl budget re-checking a page
// that has not existed since the WordPress site did. WordPress emitted trailing slashes as standard,
// so this was most of the old site.

const rules = (): { source: string; destination: string; statusCode?: number }[] =>
  JSON.parse(readFileSync('vercel.json', 'utf8')).redirects;

describe('the wildcard redirects', () => {
  it('each have a trailing-slash twin', () => {
    const all = rules();
    const sources = new Set(all.map((r) => r.source));
    const missing = all
      .filter((r) => r.source.includes(':path*') && !r.source.endsWith('/'))
      .filter((r) => !sources.has(`${r.source}/`))
      .map((r) => r.source);
    expect(missing, `these answer 200 to any URL of theirs that ends in a slash:\n${missing.join('\n')}`)
      .toEqual([]);
  });

  it('cover the WordPress shapes the old site used', () => {
    // The prefixes an old WordPress install leaves indexed behind it. Each needs both forms.
    const sources = new Set(rules().map((r) => r.source));
    for (const prefix of ['tag', 'category', 'author', 'portfolio-items', 'wp-content', 'wp-admin']) {
      expect(sources, `/${prefix} has no wildcard redirect`).toContain(`/${prefix}/:path*`);
      expect(sources, `/${prefix}/ leaks on a trailing slash`).toContain(`/${prefix}/:path*/`);
    }
  });

  it('send them somewhere permanent, so the old URL is dropped rather than followed forever', () => {
    for (const r of rules().filter((x) => x.source.includes(':path*'))) {
      expect(r.statusCode, `${r.source} is not a permanent redirect`).toBe(301);
    }
  });
});
