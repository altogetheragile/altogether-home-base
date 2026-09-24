import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { REGISTRIES } from './index';
import { COPY_ROUTES, copyPageFor, CHROME_PAGE, SITE_PAGE } from './routes';

// The on-page editor decides what it is editing from the URL. Two ways for that to go quietly
// wrong: a page whose words nobody can reach from the page itself, and a route claiming a registry
// that no longer exists, which shows an admin an empty drawer on a page full of editable words.

describe('every page can be edited from itself', () => {
  const editable = new Set(Object.values(COPY_ROUTES));

  it('offers every registry from somewhere', () => {
    const alwaysOffered = new Set([CHROME_PAGE, SITE_PAGE]);
    const unreachable = REGISTRIES.map((r) => r.page).filter((p) => !alwaysOffered.has(p) && !editable.has(p));
    expect(unreachable, `no URL opens these: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('never points a URL at a registry that does not exist', () => {
    const names = new Set(REGISTRIES.map((r) => r.page));
    const dangling = Object.entries(COPY_ROUTES).filter(([, page]) => !names.has(page));
    expect(dangling, `routes with no registry: ${dangling.map(([u]) => u).join(', ')}`).toEqual([]);
  });

  it('points every URL at a page that answers', () => {
    const missing = Object.keys(COPY_ROUTES).filter((url) => {
      const file = url === '/' ? 'src/app/page.tsx' : `src/app${url}/page.tsx`;
      return !existsSync(file);
    });
    expect(missing, `no page file for: ${missing.join(', ')}`).toEqual([]);
  });

  it('reads a trailing slash as the same page', () => {
    expect(copyPageFor('/about/')).toBe('about');
    expect(copyPageFor('/')).toBe('home');
  });

  it('offers nothing on a page it does not describe', () => {
    // A blog post's words live in the posts table. Offering the listing's headings while standing
    // on an article would be a confusing thing to be offered.
    expect(copyPageFor('/blog/some-post')).toBeNull();
    expect(copyPageFor('/privacy')).toBeNull();
  });

  it('keeps the menu and footer reachable from everywhere', () => {
    // They are on every page, so the editor offers them on every page, including ones with
    // nothing else to edit.
    expect(REGISTRIES.some((r) => r.page === CHROME_PAGE)).toBe(true);
  });
});
