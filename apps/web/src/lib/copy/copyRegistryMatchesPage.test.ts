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

// A field that says what it is has to say it correctly, because the editor draws whatever the
// entry claims. An "items" field with no fields declared renders rows of nothing.
describe('fields that declare a type', () => {
  const entries = REGISTRIES.flatMap((r) => Object.entries(r.entries));

  it('gives every items field a set of named boxes', () => {
    const broken = entries
      .filter(([, e]) => e.type === 'items')
      .filter(([, e]) => !e.fields?.length || e.fields.some((f) => !f.key?.trim() || !f.label?.trim()));
    expect(broken.map(([k]) => k), 'declared as items with no usable fields').toEqual([]);
  });

  it('does not declare fields on anything that is not a list of items', () => {
    // Otherwise the fields are written, reviewed, and silently ignored.
    const stray = entries.filter(([, e]) => e.fields && e.type !== 'items');
    expect(stray.map(([k]) => k), 'fields declared but nothing draws them').toEqual([]);
  });

  it('ships items fields empty, because JSON is not something to hand somebody as a default', () => {
    const seeded = entries.filter(([, e]) => e.type === 'items' && e.value.trim());
    for (const [key, e] of seeded) {
      expect(() => JSON.parse(e.value), `${key} ships unparseable JSON`).not.toThrow();
    }
  });

  it('only uses types the editor knows how to draw', () => {
    const known = new Set(['text', 'textarea', 'lines', 'items', 'image', 'icon']);
    const odd = entries.filter(([, e]) => e.type && !known.has(e.type));
    expect(odd.map(([k]) => k)).toEqual([]);
  });
});

// Pictures and icons are content now, which means two new ways for a field to lie about itself.
describe('pictures and icons', () => {
  const entries = REGISTRIES.flatMap((r) => Object.entries(r.entries));

  it('never ships a picture of its own', () => {
    // A shipped picture is somebody's photograph on everybody's site, which is the whole lesson
    // of the founder portrait.
    const shipped = entries.filter(([, e]) => e.type === 'image' && e.value.trim());
    expect(shipped.map(([k]) => k)).toEqual([]);
  });

  it('only offers icons the site can actually draw', () => {
    // A name that is not in the registry renders nothing, silently, which looks like a bug in
    // the page rather than a stale default.
    const iconFields = entries.flatMap(([, e]) => (e.fields ?? []).filter((f) => f.type === 'icon'));
    expect(iconFields.every((f) => f.key.trim() && f.label.trim())).toBe(true);
  });

  it('gives every box inside an item a type the row can draw', () => {
    const known = new Set([undefined, 'text', 'textarea', 'image', 'icon']);
    const odd = entries.flatMap(([k, e]) =>
      (e.fields ?? []).filter((f) => !known.has(f.type)).map((f) => `${k}.${f.key}`),
    );
    expect(odd).toEqual([]);
  });
});
