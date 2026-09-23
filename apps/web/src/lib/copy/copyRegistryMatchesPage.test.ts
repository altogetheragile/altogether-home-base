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
  about: 'src/app/about/page.tsx',
  coaching: 'src/app/coaching/page.tsx',
  contact: 'src/app/contact/page.tsx',
  testimonials: 'src/app/testimonials/page.tsx',
  blog: 'src/app/blog/page.tsx',
  events: 'src/app/events/page.tsx',
  exams: 'src/app/exams/page.tsx',
  // Not a page: the menu and the footer, which share one registry because they name the same
  // links and a site that renames Coaching to Services should rename it once.
  navigation: 'src/components/Navigation.tsx',
};

/** Components a page hands its `t` to, which therefore read its keys on its behalf. A page that
 *  renders `<AboutSection t={t} />` is reading every key that component asks for, and the naive
 *  version of this test called all of them unused. */
const DELEGATES: Record<string, string[]> = {
  home: ['src/components/AboutSection.tsx'],
  navigation: ['src/components/Footer.tsx'],
};

/** The copy keys a page actually asks for.
 *
 *  Two shapes. A plain t('a.b.c'), and a template literal with an index in it, which is how a page
 *  reads a numbered pair of cards: t(`about.philosophy.${n}.body`). The second is returned as a
 *  regex so a declared key can be matched against it. */
function keysRead(file: string, delegates: string[] = []): { exact: Set<string>; patterns: RegExp[] } {
  const src = [file, ...delegates].map((f) => readFileSync(f, 'utf8')).join('\n');
  const exact = new Set([...src.matchAll(/\b(?:t|label)\('([A-Za-z0-9._]+)'\)/g)].map((m) => m[1]));
  // The menu reads its keys from a list rather than inline, because the same list also carries
  // each link's URL and its module flag: `{ key: 'nav.coaching', href: '/coaching', ... }`.
  for (const m of src.matchAll(/\bkey: '([A-Za-z0-9._]+)'/g)) exact.add(m[1]);
  // Anything inside the backticks, because the expression in ${...} can be `n` or `i + 1` or
  // whatever the page finds readable. Only the shape around it matters.
  const patterns = [...src.matchAll(/\bt\(`([^`]+)`\)/g)].map(
    (m) => new RegExp('^' + m[1].replace(/\./g, '\\.').replace(/\$\{[^}]*\}/g, '[A-Za-z0-9]+') + '$'),
  );
  return { exact, patterns };
}

const isRead = (key: string, read: ReturnType<typeof keysRead>) =>
  read.exact.has(key) || read.patterns.some((p) => p.test(key));

describe('each page registry', () => {
  for (const registry of REGISTRIES) {
    const file = PAGES[registry.page];

    it(`${registry.page}: is wired to a page this test knows about`, () => {
      expect(file, `no page file mapped for registry "${registry.page}"`).toBeTruthy();
    });

    it(`${registry.page}: declares every key the page reads`, () => {
      const read = keysRead(file, DELEGATES[registry.page] ?? []);
      const missing = [...read.exact].filter((k) => !(k in registry.entries));
      expect(missing, `read but not declared: ${missing.join(', ')}`).toEqual([]);
    });

    it(`${registry.page}: declares nothing the page ignores`, () => {
      const read = keysRead(file, DELEGATES[registry.page] ?? []);
      const unused = Object.keys(registry.entries).filter((k) => !isRead(k, read));
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
