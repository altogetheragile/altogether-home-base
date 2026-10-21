import { describe, it, expect, vi, beforeEach } from 'vitest';

// The App's fallbacks were this repository's identity: the lockup in the header, "Altogether
// Agile" in a tab title, "AltogetherAgile" in the footer. Right on our site, and on another site
// a claim it never made, or a broken image once its build had stripped the lockup out.

let site = 'https://altogetheragile.com';
vi.mock('@/config/featureFlags', () => ({ get SITE_URL() { return site; } }));

const load = async () => {
  vi.resetModules();
  return import('./ourSite');
};

beforeEach(() => { site = 'https://altogetheragile.com'; });

describe('a site with no name is not us', () => {
  it('is its own name wherever it has one', async () => {
    site = 'https://www.streamstrategy.co.uk';
    const { siteNameOr, logoNameOr } = await load();
    expect(siteNameOr('Stream Strategy')).toBe('Stream Strategy');
    expect(logoNameOr('Stream Strategy')).toBe('Stream Strategy');
  });

  it('is its own address on another site, never ours', async () => {
    site = 'https://www.streamstrategy.co.uk';
    const { siteNameOr, logoNameOr, isOurSite } = await load();
    expect(isOurSite()).toBe(false);
    expect(siteNameOr(null)).toBe('streamstrategy.co.uk');
    expect(logoNameOr('  ')).toBe('streamstrategy.co.uk');
  });

  it('keeps our name and our lockup on our own site', async () => {
    const { siteNameOr, logoNameOr, isOurSite } = await load();
    expect(isOurSite()).toBe(true);
    expect(siteNameOr(null)).toBe('Altogether Agile');
    // No name means logoOf draws the lockup, which is what ours should show.
    expect(logoNameOr(null)).toBeNull();
  });
});
