import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
// @ts-expect-error - a build script, deliberately plain JS with no types
import { OUR_FACE, removeOurFace } from '../scripts/lib/ourFace.mjs';

// public/ is copied wholesale into every build, so this repository's face was deployed to every
// site made from it. Nothing on a second site linked to those files any more, but the kanji was
// still sitting on her domain at /favicon.svg - which is exactly the path a browser fetches when
// a page names no icon.

describe('our face does not ship to somebody else’s site', () => {
  it('names files that are really in public/', () => {
    // A path that has drifted is a removal that silently does nothing, and the build still says
    // it worked. The same failure the shell's literals had.
    for (const path of OUR_FACE) {
      expect(existsSync(resolve(__dirname, '..', 'public', path)), `public/${path} is not there`).toBe(true);
    }
  });

  it('takes them out of a build that is not ours', () => {
    const removed: string[] = [];
    const gone = removeOurFace('/dist', false, {
      join: (...p: string[]) => p.join('/'),
      existsSync: () => true,
      rmSync: (p: string) => removed.push(p),
    });
    expect(gone).toEqual(OUR_FACE);
    expect(removed).toContain('/dist/favicon.svg');
    expect(removed).toContain('/dist/brand');
  });

  it('touches nothing on our own build', () => {
    // These are the files this site is made of. Its own favicon is /favicon.svg.
    const removed: string[] = [];
    const gone = removeOurFace('/dist', true, {
      join: (...p: string[]) => p.join('/'),
      existsSync: () => true,
      rmSync: (p: string) => removed.push(p),
    });
    expect(gone).toEqual([]);
    expect(removed).toEqual([]);
  });

  it('passes over what a build has not got, rather than failing', () => {
    const gone = removeOurFace('/dist', false, {
      join: (...p: string[]) => p.join('/'),
      existsSync: () => false,
      rmSync: () => { throw new Error('should not be called'); },
    });
    expect(gone).toEqual([]);
  });

  it('leaves the share picture and the hero pattern alone', () => {
    // Both deliberate. The share image is an illustration rather than a mark, and a link shared
    // with no picture looks worse than one shared with a generic one. The hero pattern is a
    // pattern, and a second site may legitimately paste its path into the picture box.
    expect(OUR_FACE).not.toContain('og-image.png');
    expect(OUR_FACE.some((p: string) => p.includes('hero-bg'))).toBe(false);
  });

  it('covers the mark a browser goes looking for on its own', () => {
    expect(OUR_FACE).toContain('favicon.svg');
  });
});
