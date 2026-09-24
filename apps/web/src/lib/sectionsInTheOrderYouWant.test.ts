import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { orderedSections, HOME_SECTIONS, ABOUT_SECTIONS, SECTIONS_FOR_PAGE } from './sections';

// The merge is the whole risk. A section added in code but absent from a saved order must still
// appear, or shipping a new section silently does nothing on every site that has ever reordered.
// A section removed from the code must drop out, or the editor offers to move something that is
// not there.

describe('sections in the order you want', () => {
  const saved = (rows: { section: string; visible?: boolean }[]) => JSON.stringify(rows);

  it('uses the code order when nothing has been saved', () => {
    expect(orderedSections('', HOME_SECTIONS).map((s) => s.section)).toEqual(HOME_SECTIONS.map((c) => c.key));
    expect(orderedSections(undefined, HOME_SECTIONS).every((s) => s.visible)).toBe(true);
  });

  it('keeps a saved order', () => {
    const order = saved([{ section: 'cta' }, { section: 'hero' }]);
    const got = orderedSections(order, HOME_SECTIONS).map((s) => s.section);
    expect(got.slice(0, 2)).toEqual(['cta', 'hero']);
  });

  it('appends a section the code has and the saved order does not', () => {
    // Otherwise shipping a new section does nothing for anybody who has ever reordered.
    const order = saved(HOME_SECTIONS.slice(0, 3).map((c) => ({ section: c.key })));
    const got = orderedSections(order, HOME_SECTIONS);
    expect(got).toHaveLength(HOME_SECTIONS.length);
    expect(got[got.length - 1].section).toBe(HOME_SECTIONS[HOME_SECTIONS.length - 1].key);
    expect(got.find((s) => s.section === 'cta')?.visible, 'a newly appearing section arrives shown').toBe(true);
  });

  it('drops a saved section the code no longer has', () => {
    const order = saved([{ section: 'hero' }, { section: 'a-section-that-was-deleted' }]);
    expect(orderedSections(order, HOME_SECTIONS).map((s) => s.section)).not.toContain('a-section-that-was-deleted');
  });

  it('remembers which are hidden, and treats a missing flag as shown', () => {
    const order = saved([{ section: 'stats', visible: false }, { section: 'hero' }]);
    const got = orderedSections(order, HOME_SECTIONS);
    expect(got.find((s) => s.section === 'stats')?.visible).toBe(false);
    expect(got.find((s) => s.section === 'hero')?.visible).toBe(true);
  });

  it('falls back to the code order rather than throwing on a mangled value', () => {
    // A saved order is one text column. It should not be able to take a page down.
    for (const bad of ['{', 'null', '"a string"', '[1,2,3]', '[{"nope":true}]']) {
      expect(orderedSections(bad, HOME_SECTIONS).map((s) => s.section)).toEqual(HOME_SECTIONS.map((c) => c.key));
    }
  });

  it.each([
    ['home', 'src/app/page.tsx', HOME_SECTIONS],
    ['about', 'src/app/about/page.tsx', ABOUT_SECTIONS],
  ])('names every section %s actually renders', (_page, file, declared) => {
    // A key in the list with no node behind it is a row in the editor that moves nothing, which
    // is worse than not offering it: it looks like the feature is broken.
    const src = readFileSync(file, 'utf8');
    const inCode = [...src.matchAll(/^    ([a-z]+): \(/gm)].map((m) => m[1]);
    expect(inCode.sort(), 'the map and the list have drifted').toEqual(declared.map((c) => c.key).sort());
  });

  it('offers the control only for pages that render from it', () => {
    // SECTIONS_FOR_PAGE drives the editor. A page listed there but still rendering its sections
    // in a fixed order would show a reorder control that does nothing.
    for (const page of Object.keys(SECTIONS_FOR_PAGE)) {
      const file = page === 'home' ? 'src/app/page.tsx' : `src/app/${page}/page.tsx`;
      expect(readFileSync(file, 'utf8'), `${page} does not render from its order`).toContain('sectionNodes(order');
    }
  });

  it('offers a list for every page that claims one', () => {
    for (const [page, list] of Object.entries(SECTIONS_FOR_PAGE)) {
      expect(list.length, `${page} declares no sections`).toBeGreaterThan(0);
      const keys = list.map((c) => c.key);
      expect(new Set(keys).size, `${page} repeats a section key`).toBe(keys.length);
      expect(list.every((c) => c.label.trim()), `${page} has an unlabelled section`).toBe(true);
    }
    expect(ABOUT_SECTIONS.length).toBeGreaterThan(0);
  });
});
