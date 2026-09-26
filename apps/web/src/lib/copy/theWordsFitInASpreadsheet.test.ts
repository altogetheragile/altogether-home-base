import { describe, it, expect } from 'vitest';
import { toCsv, parseCsv, readSheet, rowsFor, byPage, isWords, COLUMNS, type SheetRow } from './sheet';
import type { CopyField } from '@altogether/ui/editor/store';

// Filling a site in the drawer is 204 boxes behind three tabs, one page at a time, signed in as an
// administrator. That is the right tool for changing a heading and the wrong one for writing a
// site from nothing. One file out, one file back.

const field = (over: Partial<CopyField> & { key: string }): CopyField =>
  ({ label: over.key, hint: '', value: '', shipped: '', ...over });

describe('what goes in the file', () => {
  it('takes the words and leaves everything else', () => {
    // A spreadsheet that can turn a module off is one that can take a site down by accident, and
    // the mistake would arrive as two hundred quiet rows.
    const rows = rowsFor('home', 'Home', [
      field({ key: 'home.hero.heading' }),
      field({ key: 'home.hero.body', type: 'textarea' }),
      field({ key: 'home.hero.tags', type: 'lines' }),
      field({ key: 'home.visible', type: 'switch' }),
      field({ key: 'home.brand.colour', type: 'colour' }),
      field({ key: 'home.hero.picture', type: 'image' }),
      field({ key: 'home.stats.items', type: 'items' }),
      field({ key: 'home.sections', type: 'sections' }),
      field({ key: 'home.hero.target', type: 'choice' }),
    ]);
    expect(rows.map((r) => r.key)).toEqual(['home.hero.heading', 'home.hero.body', 'home.hero.tags']);
  });

  it('leaves out a section this site does not render', () => {
    // Asking somebody to write knowledge base copy for a site with no knowledge base is asking
    // for work with no purpose.
    const rows = rowsFor('home', 'Home', [
      field({ key: 'home.hero.heading' }),
      field({ key: 'home.kb.heading', notShown: true }),
    ]);
    expect(rows.map((r) => r.key)).toEqual(['home.hero.heading']);
  });

  it('says where each row lives, so it can be found again by hand', () => {
    const [row] = rowsFor('home', 'Home', [field({ key: 'home.hero.heading', group: 'Hero' })]);
    expect(row.where).toBe('Home / Hero');
    expect(rowsFor('site', 'This Site', [field({ key: 'site.name' })])[0].where).toBe('This Site');
  });

  it('knows a words field from the rest', () => {
    expect(isWords({ key: 'a' })).toBe(true);
    expect(isWords({ key: 'a', type: 'textarea' })).toBe(true);
    expect(isWords({ key: 'a', type: 'switch' })).toBe(false);
  });
});

describe('the file itself', () => {
  const row = (over: Partial<SheetRow>): SheetRow =>
    ({ key: 'k', page: 'home', where: 'Home', label: 'L', hint: 'H', current: '', fresh: '', ...over });

  it('survives everything real copy contains', () => {
    // Commas, quotes, and a two-line heading, which is one cell containing a line break.
    const awkward = 'Work better together,\n"properly" this time';
    const [, back] = parseCsv(toCsv([row({ current: awkward })]));
    expect(back[5]).toBe(awkward);
  });

  it('round-trips every row without losing one', () => {
    const rows = [row({ key: 'a' }), row({ key: 'b', current: 'x,y' }), row({ key: 'c', current: 'line\nbreak' })];
    const back = parseCsv(toCsv(rows));
    expect(back.length).toBe(rows.length + 1); // the header
    expect(back.slice(1).map((r) => r[0])).toEqual(['a', 'b', 'c']);
  });

  it('names its columns in the order it writes them', () => {
    expect(parseCsv(toCsv([]))[0]).toEqual([...COLUMNS]);
  });

  it('opens correctly in a spreadsheet that assumes Latin-1', () => {
    // Without this Excel turns every apostrophe in the copy into mojibake.
    expect(toCsv([])[0]).toBe('﻿');
  });
});

describe('reading one back', () => {
  const known = new Map([
    ['home.hero.heading', { page: 'home', value: 'Old heading' }],
    ['about.story.p1', { page: 'about', value: 'Old story' }],
  ]);
  const sheet = (rows: string[][]) =>
    toCsv(rows.map(([key, current, fresh]) => ({
      key, page: '', where: '', label: '', hint: '', current, fresh,
    })));

  it('takes only what was actually written', () => {
    const read = readSheet(sheet([
      ['home.hero.heading', 'Old heading', 'New heading'],
      ['about.story.p1', 'Old story', ''],
    ]), known);
    expect(read.changes).toEqual([
      { key: 'home.hero.heading', page: 'home', from: 'Old heading', to: 'New heading' },
    ]);
  });

  it('treats a blank cell as “leave it alone”, never as “empty this”', () => {
    // A sheet full of blanks is the normal state of a half-finished one.
    const read = readSheet(sheet([['home.hero.heading', 'Old heading', '   ']]), known);
    expect(read.changes).toEqual([]);
  });

  it('counts a row retyped identically rather than writing it again', () => {
    const read = readSheet(sheet([['home.hero.heading', 'Old heading', 'Old heading']]), known);
    expect(read.changes).toEqual([]);
    expect(read.unchanged).toBe(1);
  });

  it('says out loud when a row names a field this site does not have', () => {
    // A renamed key, or a row somebody typed by hand, should be reported rather than dropped.
    const read = readSheet(sheet([['home.invented.key', '', 'Something']]), known);
    expect(read.unknown).toEqual(['home.invented.key']);
    expect(read.changes).toEqual([]);
  });

  it('ignores the header row without being told which one it is', () => {
    expect(readSheet(toCsv([]), known).changes).toEqual([]);
  });

  it('groups the changes the way they are saved, one write per page', () => {
    const read = readSheet(sheet([
      ['home.hero.heading', 'Old heading', 'A'],
      ['about.story.p1', 'Old story', 'B'],
    ]), known);
    expect(byPage(read.changes)).toEqual({ home: { 'home.hero.heading': 'A' }, about: { 'about.story.p1': 'B' } });
  });
});
