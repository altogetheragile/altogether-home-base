import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveImages, defaultImages } from '@altogether/ui/brand';

// A second site wore this repository's kanji in its tab, in its owner's bookmarks and in search
// results, and the way it came to light was somebody asking what that icon was. Small, but it is
// the mark a browser repeats everywhere it names a site.

describe('a tab icon is a face', () => {
  it('ships no default icon, the way it ships no default logo', () => {
    expect(defaultImages.favicon).toBe('');
  });

  it('still ships a default share image, which is a picture rather than a mark', () => {
    // A link shared with no picture looks worse than one shared with a generic picture, and the
    // illustration says nothing about whose site it is.
    expect(defaultImages.ogImage).toBeTruthy();
  });

  it('gives a site that has chosen one its own', () => {
    const images = resolveImages({ images: { favicon: 'https://cdn.example/dandelion.png' } });
    expect(images.favicon).toBe('https://cdn.example/dandelion.png');
  });

  it('gives a site that has not chosen one nothing at all', () => {
    expect(resolveImages({ images: {} }).favicon).toBe('');
    expect(resolveImages(undefined).favicon).toBe('');
  });

  it('declares no icon rather than an empty one', () => {
    // An empty href is a broken link, not an absent one: the browser asks for the page itself
    // and draws whatever comes back.
    const layout = readFileSync('src/app/layout.tsx', 'utf8');
    expect(layout, 'the icon block is no longer conditional').toMatch(/\.\.\.\(favicon\s*\n?\s*\?/);
  });
});
