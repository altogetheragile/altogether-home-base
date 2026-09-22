import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE_OWNED, isSiteOwned } from './siteOwnedRoutes';

// vercel.json decides who answers a URL. This list has to say the same thing, or the App will
// either render a second implementation of a Site page or send someone on a full page load to a
// URL it owns perfectly well itself.

const rewrites = (): string[] =>
  JSON.parse(readFileSync('vercel.json', 'utf8')).rewrites
    .filter((r: { destination: string }) => r.destination.includes('web-next'))
    .map((r: { source: string }) => r.source);

/** `/blog/:path*` and `/blog` are the same claim as far as this list is concerned. */
const base = (source: string) => source.replace(/\/:.*$/, '') || '/';

describe('the list of Site-owned URLs', () => {
  it('matches what vercel.json actually rewrites', () => {
    const rewritten = new Set(
      rewrites().filter((s) => !s.startsWith('/_next') && !s.startsWith('/api')).map(base),
    );
    const declared = new Set<string>(SITE_OWNED);
    const missing = [...rewritten].filter((r) => !declared.has(r));
    const extra = [...declared].filter((d) => !rewritten.has(d));
    expect(missing, `rewritten to the Site but not declared here: ${missing.join(', ')}`).toEqual([]);
    expect(extra, `declared here but not rewritten: ${extra.join(', ')}`).toEqual([]);
  });

  it('claims the pages under a prefix rewrite', () => {
    expect(isSiteOwned('/blog/pdca-cycle-explained')).toBe(true);
    expect(isSiteOwned('/exams/agilepm-practitioner-paper-1')).toBe(true);
    expect(isSiteOwned('/courses/agilepm-foundation')).toBe(true);
  });

  // vercel.json rewrites `/events` alone, so the detail pages under it are still the App's. Getting
  // this wrong sends a working page on a full load to a URL the Site does not answer.
  it('leaves the event detail pages with the App', () => {
    expect(isSiteOwned('/events')).toBe(true);
    expect(isSiteOwned('/events/some-id')).toBe(false);
    expect(isSiteOwned('/events/learn/a-course')).toBe(false);
  });

  it('does not claim App routes that merely start the same way', () => {
    expect(isSiteOwned('/aboutus')).toBe(false);
    expect(isSiteOwned('/contacts')).toBe(false);
    expect(isSiteOwned('/flow-game')).toBe(false);
  });
});
