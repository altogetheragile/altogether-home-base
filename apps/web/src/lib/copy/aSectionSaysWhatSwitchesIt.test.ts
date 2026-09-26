import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTRIES } from './index';
import { MODULE_DEFAULTS } from '@altogether/ui/modules';
import type { CopyEntry } from './fields';

// A page that renders a section conditionally and a registry that offers its words unconditionally
// disagree, and the editor is the one that looks broken: somebody with the knowledge base off was
// shown its heading, body and examples while looking at a home page with no such section.
//
// `shownWhen` closes that gap, which only works if it names the module the page actually checks.

const PAGES: Record<string, string> = {
  home: 'src/app/page.tsx',
  about: 'src/app/about/page.tsx',
  coaching: 'src/app/coaching/page.tsx',
  contact: 'src/app/contact/page.tsx',
  events: 'src/app/events/page.tsx',
  exams: 'src/app/exams/page.tsx',
  blog: 'src/app/blog/page.tsx',
  testimonials: 'src/app/testimonials/page.tsx',
};

const marked = REGISTRIES.flatMap((r) =>
  Object.entries(r.entries)
    .map(([key, e]) => ({ page: r.page, key, entry: e as CopyEntry }))
    .filter(({ entry }) => entry.shownWhen),
);

describe('a section says what switches it', () => {
  it('marks something, or this test is watching an empty room', () => {
    expect(marked.length).toBeGreaterThan(0);
  });

  it('names a module that exists', () => {
    // A typo here is silent: an unknown module reads as off, so the words would be marked
    // "not on this page" on every site forever.
    for (const { page, key, entry } of marked) {
      expect(Object.keys(MODULE_DEFAULTS), `${page}/${key} names "${entry.shownWhen}"`)
        .toContain(entry.shownWhen);
    }
  });

  it('names a module the page really checks', () => {
    // The other direction: a field claiming to depend on a switch the page ignores would say a
    // section is missing while it sits there on screen.
    for (const { page, key, entry } of marked) {
      const file = PAGES[page];
      expect(file, `no page mapped for ${page}`).toBeTruthy();
      const src = readFileSync(file, 'utf8');
      expect(src, `${page}/${key} depends on show_${entry.shownWhen}, which ${file} never reads`)
        .toContain(`show_${entry.shownWhen}`);
    }
  });

  it('marks whole sections rather than odd fields within one', () => {
    // The drawer says it once, at the group, and only when every field in the group is off. A
    // half-marked section would say nothing at all and look like the bug this replaces.
    const bySection = new Map<string, { total: number; marked: number }>();
    for (const registry of REGISTRIES) {
      for (const [key, e] of Object.entries(registry.entries) as [string, CopyEntry][]) {
        const parts = key.split('.');
        if (parts.length < 3) continue;
        const section = `${registry.page}.${parts[1]}`;
        const at = bySection.get(section) ?? { total: 0, marked: 0 };
        at.total += 1;
        if (e.shownWhen) at.marked += 1;
        bySection.set(section, at);
      }
    }
    const partial = [...bySection.entries()]
      .filter(([, n]) => n.marked > 0 && n.marked !== n.total)
      .map(([s, n]) => `${s} (${n.marked} of ${n.total})`);
    expect(partial, `marked in part: ${partial.join(', ')}`).toEqual([]);
  });
});
