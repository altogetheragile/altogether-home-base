import { describe, it, expect } from 'vitest';
import { REGISTRIES } from './index';
import { readField, buildPatch } from '@/lib/settings-store';
import type { CopyEntry } from './fields';

// One editor, three stores. A field that names the wrong store, or a column that does not exist,
// fails in the quietest possible way: the box shows empty, the save appears to work, and nothing
// on the site changes.

const entries = REGISTRIES.flatMap((r) => Object.entries(r.entries));
const offSite = entries.filter(([, e]) => e.store && e.store !== 'copy');

describe('one way to change the site', () => {
  it('has fields that live outside site_copy', () => {
    expect(offSite.length).toBeGreaterThan(0);
  });

  it('tells every one of them where it lives', () => {
    const lost = offSite.filter(([, e]) => !e.path?.trim()).map(([k]) => k);
    expect(lost, 'a store with no path writes nowhere').toEqual([]);
  });

  it('keeps brand paths inside the brand object', () => {
    // A brand path is dotted and relative to the brand column: "images.logo", never "brand.images.logo".
    const wrong = offSite.filter(([, e]) => e.store === 'brand' && e.path!.startsWith('brand.')).map(([k]) => k);
    expect(wrong).toEqual([]);
  });

  it('never points two fields at the same place', () => {
    // Two boxes writing one value is the duplication this was meant to end.
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const [key, e] of offSite) {
      const where = `${e.store}:${e.path}`;
      if (seen.has(where)) clashes.push(`${key} and ${seen.get(where)} both write ${where}`);
      seen.set(where, key);
    }
    expect(clashes).toEqual([]);
  });

  it('folds several brand changes into one object rather than losing all but the last', () => {
    const colour = offSite.find(([, e]) => e.store === 'brand' && e.path?.startsWith('colors.'))![1] as CopyEntry;
    const image = offSite.find(([, e]) => e.store === 'brand' && e.path?.startsWith('images.'))![1] as CopyEntry;
    const patch = buildPatch(
      [{ entry: colour, value: '#123456' }, { entry: image, value: 'https://example.test/l.png' }],
      { images: { favicon: '/keep-me.ico' } },
    );
    const brand = patch.brand as { colors: Record<string, string>; images: Record<string, string> };
    expect(Object.values(brand.colors)[0]).toBe('#123456');
    expect(Object.values(brand.images)).toContain('https://example.test/l.png');
    expect(brand.images.favicon, 'an untouched key was dropped').toBe('/keep-me.ico');
  });

  it('removes an emptied brand key rather than storing an empty string', () => {
    // An empty string would render as a picture with no address; removing it lets the shipped
    // default take over again.
    const image = offSite.find(([, e]) => e.store === 'brand' && e.path === 'images.logo')![1] as CopyEntry;
    const patch = buildPatch([{ entry: image, value: '  ' }], { images: { logo: 'https://old.test/l.png' } });
    expect((patch.brand as { images: Record<string, string> }).images.logo).toBeUndefined();
  });

  it('reads a switch as on, off, or unset', () => {
    const sw = offSite.find(([, e]) => e.type === 'switch')![1] as CopyEntry;
    expect(readField(sw, { [sw.path!]: true })).toBe('on');
    expect(readField(sw, { [sw.path!]: false })).toBe('');
    expect(readField(sw, {})).toBe('');
    expect(buildPatch([{ entry: sw, value: 'on' }], {})[sw.path!]).toBe(true);
    expect(buildPatch([{ entry: sw, value: '' }], {})[sw.path!]).toBe(false);
  });

  it('writes an emptied column as null, not as an empty string', () => {
    // "" and null read differently everywhere that falls back on a default.
    const text = offSite.find(([, e]) => e.store === 'column' && !e.type)![1] as CopyEntry;
    expect(buildPatch([{ entry: text, value: '   ' }], {})[text.path!]).toBeNull();
  });
});
