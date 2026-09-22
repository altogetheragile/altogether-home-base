import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES } from './index';

// A registry and the page it describes have to stay in step.
//
// Two ways to go wrong, and both are quiet. An entry nobody reads shows up in the editor, gets
// carefully written, and changes nothing on the site. A key the page reads with no entry behind it
// renders an empty string, so a heading silently disappears the first time the fetch misses.

const PAGES: Record<string, string> = {
  home: 'src/app/page.tsx',
};

/** The copy keys a page actually asks for. */
function keysRead(file: string): Set<string> {
  const src = readFileSync(file, 'utf8');
  return new Set([...src.matchAll(/\bt\('([A-Za-z0-9.]+)'\)/g)].map((m) => m[1]));
}

describe('each page registry', () => {
  for (const registry of REGISTRIES) {
    const file = PAGES[registry.page];

    it(`${registry.page}: is wired to a page this test knows about`, () => {
      expect(file, `no page file mapped for registry "${registry.page}"`).toBeTruthy();
    });

    it(`${registry.page}: declares every key the page reads`, () => {
      const missing = [...keysRead(file)].filter((k) => !(k in registry.entries));
      expect(missing, `read but not declared: ${missing.join(', ')}`).toEqual([]);
    });

    it(`${registry.page}: declares nothing the page ignores`, () => {
      const read = keysRead(file);
      const unused = Object.keys(registry.entries).filter((k) => !read.has(k));
      expect(unused, `declared but never read: ${unused.join(', ')}`).toEqual([]);
    });

    it(`${registry.page}: gives every entry a label and a hint for the editor`, () => {
      const thin = Object.entries(registry.entries)
        .filter(([, e]) => !e.label?.trim() || !e.hint?.trim())
        .map(([k]) => k);
      expect(thin, `no label or hint: ${thin.join(', ')}`).toEqual([]);
    });
  }
});
