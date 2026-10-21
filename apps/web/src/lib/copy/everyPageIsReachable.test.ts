import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { REGISTRIES } from './index';
import { COPY_ROUTES, COPY_ROUTE_PREFIXES, copyPageFor, CHROME_PAGE, SITE_PAGE } from './routes';

// The on-page editor decides what it is editing from the URL. Two ways for that to go quietly
// wrong: a page whose words nobody can reach from the page itself, and a route claiming a registry
// that no longer exists, which shows an admin an empty drawer on a page full of editable words.

describe('every page can be edited from itself', () => {
  const editable = new Set([...Object.values(COPY_ROUTES), ...Object.values(COPY_ROUTE_PREFIXES)]);

  it('offers every registry from somewhere', () => {
    const alwaysOffered = new Set([CHROME_PAGE, SITE_PAGE]);
    const unreachable = REGISTRIES.map((r) => r.page).filter((p) => !alwaysOffered.has(p) && !editable.has(p));
    expect(unreachable, `no URL opens these: ${unreachable.join(', ')}`).toEqual([]);
  });

  it('never points a URL at a registry that does not exist', () => {
    const names = new Set(REGISTRIES.map((r) => r.page));
    const dangling = [...Object.entries(COPY_ROUTES), ...Object.entries(COPY_ROUTE_PREFIXES)].filter(([, page]) => !names.has(page));
    expect(dangling, `routes with no registry: ${dangling.map(([u]) => u).join(', ')}`).toEqual([]);
  });

  it('points every URL at a page that answers', () => {
    const missing = Object.keys(COPY_ROUTES).filter((url) => {
      const file = url === '/' ? 'src/app/page.tsx' : `src/app${url}/page.tsx`;
      return !existsSync(file);
    });
    expect(missing, `no page file for: ${missing.join(', ')}`).toEqual([]);
  });

  it('points every family of URLs at a page that answers them', () => {
    // A prefix is a folder holding one dynamic segment, [slug] or similar, with a page in it.
    const missing = Object.keys(COPY_ROUTE_PREFIXES).filter((prefix) => {
      const dir = `src/app${prefix.replace(/\/$/, '')}`;
      if (!existsSync(dir)) return true;
      return !readdirSync(dir).some((name) => /^\[[^\]]+\]$/.test(name) && existsSync(`${dir}/${name}/page.tsx`));
    });
    expect(missing, `no page answers: ${missing.join(', ')}`).toEqual([]);
  });

  it('reads any course page as the course pages, and the folder alone as nothing', () => {
    expect(copyPageFor('/training/agilepm-foundation')).toBe('training');
    expect(copyPageFor('/training/agilepm-foundation/')).toBe('training');
    expect(copyPageFor('/training')).toBeNull();
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
