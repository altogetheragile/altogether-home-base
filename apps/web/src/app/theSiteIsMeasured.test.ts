import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Every public page moved out of the SPA and into this app. The SPA has carried Vercel Analytics
// for a long time; this app carried nothing, so the pages that exist to be found by strangers
// were the only ones on the site nobody was counting.

const layout = readFileSync('src/app/layout.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const routing = JSON.parse(readFileSync('../../config/vercel/routing.json', 'utf8'));

describe('the site is measured', () => {
  it('mounts analytics on every page, not on one of them', () => {
    // In the layout, so a page added later is counted without anyone remembering to.
    expect(layout).toContain('<Analytics');
  });

  it('installs what it imports, in the project that installs alone', () => {
    // apps/web has its own lockfile and installs without the root, here and on Vercel.
    expect(pkg.dependencies['@vercel/analytics'], 'imported but not a dependency here').toBeTruthy();
  });

  it('loads the script from this site rather than from the host every blocker knows', () => {
    expect(layout).toMatch(/scriptSrc=["']\/va\/script\.js["']/);
  });

  it('has that proxy to load it from', () => {
    // The rewrite lives in the SPA's config, which owns the domain and answers first, so it
    // covers pages served from this app too. If it ever moves, this is measured by nothing.
    const proxied = (routing.rewrites ?? []).some(
      (r: { source: string; destination: string }) =>
        r.source === '/va/script.js' && r.destination.includes('vercel-scripts.com'),
    );
    expect(proxied, 'the /va proxy is gone, so the script would be blocked').toBe(true);
  });

  it('counts a visitor without asking them anything', () => {
    // Cookieless and no identifier, which is why there is no consent banner to go with it.
    expect(layout).not.toMatch(/Analytics[^>]*mode=["']development["']/);
    expect(layout).not.toContain('beforeSend');
  });
});
