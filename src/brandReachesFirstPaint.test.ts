import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
// @ts-expect-error - a build script, deliberately plain JS with no types
import { withBrand } from '../scripts/lib/brandShell.mjs';

/** The App is client-rendered. Without this, a site whose brand is not the shipped default
 *  paints Altogether Agile's colours on every first load and corrects itself a moment later.
 *  Nobody sees that on altogetheragile.com, which is why it survived so long. */
describe('the brand reaches the first paint', () => {
  const shell = [
    '<!doctype html><html><head>',
    '<meta charset="utf-8" />',
    '<link rel="stylesheet" href="/assets/index-abc123.css" />',
    '</head><body><div id="root"></div></body></html>',
  ].join('\n');

  const css = '--aa-orange:#123456;--aa-orange-hsl:210 100% 20%';

  it('puts the palette after the stylesheet, so it wins the cascade', () => {
    const out = withBrand(shell, { css });
    // index.css carries its own :root defaults at the same specificity. Later wins.
    expect(out.indexOf('id="aa-brand"')).toBeGreaterThan(out.indexOf('index-abc123.css'));
    expect(out).toContain('--aa-orange:#123456');
  });

  it('preloads a logo that is an uploaded image, and never a wordmark', () => {
    expect(withBrand(shell, { css, logo: 'https://cdn.example/logo.png' })).toContain('rel="preload"');
    expect(withBrand(shell, { css, logo: "Someone Else's Company" })).not.toContain('rel="preload"');
  });

  it('is idempotent, because the shell is written twice', () => {
    const once = withBrand(shell, { css });
    expect(withBrand(once, { css })).toBe(once);
  });

  it('leaves the page alone when there is no brand to apply', () => {
    expect(withBrand(shell, { css: '' })).toBe(shell);
  });

  it('is actually wired into both copies of the shell', () => {
    // dist/index.html and dist/_spa.html are separate files and both are somebody's first load.
    const src = readFileSync(resolve(__dirname, '../scripts/prerender.mjs'), 'utf-8');
    expect(src).toContain('brandHead(identityHead(readFileSync');
    expect(src).toContain('shell = brandHead(shell)');
  });
});
