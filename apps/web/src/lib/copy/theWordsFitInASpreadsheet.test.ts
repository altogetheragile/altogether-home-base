import { describe, it, expect } from 'vitest';
import { toCsv, parseCsv, readSheet, rowsFor, byPage, isWords, whyNothing, separatorOf, COLUMNS, STATUS, type SheetRow, type Known } from './sheet';
import type { CopyField } from '@altogether/ui/editor/store';

// Filling a site in the drawer is 204 boxes behind three tabs, one page at a time, signed in as an
// administrator. That is the right tool for changing a heading and the wrong one for writing a
// site from nothing. One file out, one file back.

const field = (over: Partial<CopyField> & { key: string }): CopyField =>
  ({ label: over.key, hint: '', value: '', shipped: '', ...over });

describe('what goes in the file', () => {
  it('lists words and pictures, and writes only words', () => {
    // A spreadsheet that can turn a module off is one that can take a site down by accident, and
    // the mistake would arrive as two hundred quiet rows. Pictures are listed so the file accounts
    // for everything, marked so nobody expects an edit to one to land.
    const rows = rowsFor('home', 'Home', [
      field({ key: 'home.hero.heading' }),
      field({ key: 'home.hero.body', type: 'textarea' }),
      field({ key: 'home.hero.tags', type: 'lines' }),
      field({ key: 'home.visible', type: 'switch' }),
      field({ key: 'home.brand.colour', type: 'colour' }),
      field({ key: 'home.hero.picture', type: 'image' }),
      field({ key: 'home.sections', type: 'sections' }),
      field({ key: 'home.hero.target', type: 'choice' }),
    ]);
    expect(rows.map((r) => [r.key, r.kind])).toEqual([
      ['home.hero.heading', 'words'], ['home.hero.body', 'words'], ['home.hero.tags', 'words'],
      ['home.hero.picture', 'picture'],
    ]);
  });

  it('lists what is switched off, and says so', () => {
    // It used to leave these out, and "not in the file" could not be told from "not on the site".
    const rows = rowsFor('home', 'Home', [
      field({ key: 'home.hero.heading' }),
      field({ key: 'home.kb.heading', notShown: true }),
    ]);
    expect(rows.map((r) => [r.key, r.status])).toEqual([
      ['home.hero.heading', STATUS.on], ['home.kb.heading', STATUS.sectionOff],
    ]);
    expect(rowsFor('exams', 'Exams', [field({ key: 'exams.hero.heading' })], false)[0].status).toBe(STATUS.pageOff);
  });

  it('gives each box inside a list a row with its own ID', () => {
    const services = field({
      key: 'coaching.services', label: 'Service', type: 'items',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'body', label: 'Body', type: 'textarea' },
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'picture', label: 'Picture', type: 'image' },
      ],
      value: JSON.stringify([{ title: 'Focus Groups', body: 'Small rooms.', icon: 'users', picture: '/a.webp' }, { title: 'Depth Interviews' }]),
    });
    const rows = rowsFor('coaching', 'Coaching', [services]);
    expect(rows.map((r) => [r.key, r.kind, r.current])).toEqual([
      ['coaching.services.1.title', 'words', 'Focus Groups'],
      ['coaching.services.1.body', 'words', 'Small rooms.'],
      ['coaching.services.1.picture', 'picture', '/a.webp'],
      ['coaching.services.2.title', 'words', 'Depth Interviews'],
      ['coaching.services.2.body', 'words', ''],
      ['coaching.services.2.picture', 'picture', ''],
    ]);
    expect(rows[3].where).toBe('Coaching / Service 2');
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
    ({ key: 'k', page: 'home', where: 'Home', label: 'L', kind: 'words', status: STATUS.on, hint: 'H', current: '', fresh: '', ...over });

  it('survives everything real copy contains', () => {
    // Commas, quotes, and a two-line heading, which is one cell containing a line break.
    const awkward = 'Work better together,\n"properly" this time';
    const [, back] = parseCsv(toCsv([row({ current: awkward })]));
    expect(back[COLUMNS.indexOf('current words')]).toBe(awkward);
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
  const known = new Map<string, Known>([
    ['home.hero.heading', { page: 'home', value: 'Old heading' }],
    ['about.story.p1', { page: 'about', value: 'Old story' }],
  ]);
  const sheet = (rows: string[][]) =>
    toCsv(rows.map(([key, current, fresh]) => ({
      key, page: '', where: '', label: '', kind: 'words' as const, status: STATUS.on, hint: '', current, fresh,
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

// "Nothing in that file is different from what the site already says" was the only answer for four
// different situations, three of which are a file that did not work rather than a file with no
// edits. Somebody who has just spent ten minutes typing deserves better than that.
describe('why nothing happened', () => {
  const known = new Map<string, Known>([['home.hero.heading', { page: 'home', value: 'Old heading' }]]);
  const one = (over: Partial<SheetRow>): SheetRow =>
    ({ key: 'home.hero.heading', page: 'home', where: '', label: '', kind: 'words', status: STATUS.on, hint: '', current: 'Old heading', fresh: '', ...over });
  const read = (text: string) => readSheet(text, known);

  it('spots a spreadsheet that wrote semicolons, in a file from before the status column', () => {
    // Excel does this wherever the system list separator is one. The file still says .csv and
    // still opens correctly for whoever saved it.
    const semi = '"key";"page";"where";"label";"hint";"current words";"new words"\r\n'
      + '"home.hero.heading";"home";"Home";"Heading";"";"Old heading";"New heading"\r\n';
    expect(read(semi).changes).toEqual([
      { key: 'home.hero.heading', page: 'home', from: 'Old heading', to: 'New heading' },
    ]);
  });

  it('says so when the columns did not survive', () => {
    const short = 'key,page\nhome.hero.heading,home\n';
    expect(whyNothing(read(short))).toMatch(/column/i);
  });

  it('says so when nothing in the file names anything here', () => {
    const wrong = toCsv([one({ key: 'not.a.key', current: '', fresh: 'x' })]);
    expect(whyNothing(read(wrong))).toMatch(/names anything this site has/i);
  });

  it('says so when the last column was never filled in', () => {
    // The commonest mistake: typing into "current words", which is what the site says now.
    const untouched = toCsv([one({})]);
    expect(whyNothing(read(untouched))).toMatch(/last column/i);
    expect(whyNothing(read(untouched))).toMatch(/new words/);
  });

  it('says so when the words came back the same', () => {
    const same = toCsv([one({ fresh: 'Old heading' })]);
    expect(whyNothing(read(same))).toMatch(/same words/i);
  });

  it('says nothing at all when there is something to save', () => {
    const good = toCsv([one({ fresh: 'New' })]);
    expect(whyNothing(read(good))).toBeNull();
  });
});

// Pictures listed, read-only. List contents writable, by position, and only while the position
// still means the same card.
describe('pictures and lists coming back', () => {
  const LIST = JSON.stringify([{ title: 'Focus Groups', body: 'Small rooms.' }, { title: 'Depth Interviews', body: '' }], null, 2);
  const place = (n: number, sub: string, drafted = false) =>
    ({ key: 'coaching.services', n, sub, value: LIST, drafted });
  const known = (drafted = false) => new Map<string, Known>([
    ['home.hero.picture', { page: 'home', value: '/old.webp', kind: 'picture' }],
    ['coaching.services.1.title', { page: 'coaching', value: 'Focus Groups', list: place(1, 'title', drafted) }],
    ['coaching.services.2.body', { page: 'coaching', value: '', list: place(2, 'body', drafted) }],
  ]);
  const row = (key: string, current: string, fresh: string, kind: 'words' | 'picture' = 'words'): SheetRow =>
    ({ key, page: '', where: '', label: '', kind, status: STATUS.on, hint: '', current, fresh });

  it('leaves a picture alone and says so', () => {
    const read = readSheet(toCsv([row('home.hero.picture', '/old.webp', '/new.webp', 'picture')]), known());
    expect(read.changes).toEqual([]);
    expect(read.pictures).toEqual(['home.hero.picture']);
    expect(whyNothing(read)).toMatch(/pictures are changed on the page/i);
  });

  it('writes the words inside a list into that list, all at once', () => {
    const read = readSheet(toCsv([
      row('coaching.services.1.title', 'Focus Groups', 'Group Discussions'),
      row('coaching.services.2.body', '', 'One person, one hour.'),
    ]), known());
    expect(read.refused).toEqual([]);
    const written = byPage(read.changes);
    expect(Object.keys(written)).toEqual(['coaching']);
    expect(JSON.parse(written.coaching['coaching.services'])).toEqual([
      { title: 'Group Discussions', body: 'Small rooms.' },
      { title: 'Depth Interviews', body: 'One person, one hour.' },
    ]);
  });

  it('refuses a list row whose card has moved since the file went out', () => {
    // The file says the first service was "Depth Interviews"; the site now says "Focus Groups".
    // Writing it would put the new words on the wrong card.
    const read = readSheet(toCsv([row('coaching.services.1.title', 'Depth Interviews', 'Interviews')]), known());
    expect(read.changes).toEqual([]);
    expect(read.refused[0].key).toBe('coaching.services.1.title');
    expect(whyNothing(read)).toMatch(/changed since the file was downloaded/);
  });

  it('refuses a list row while that list has unpublished changes', () => {
    // Writing into the live list would quietly replace whatever is waiting.
    const read = readSheet(toCsv([row('coaching.services.1.title', 'Focus Groups', 'Groups')]), known(true));
    expect(read.changes).toEqual([]);
    expect(read.refused[0].why).toMatch(/unpublished/);
  });

  it('reads its columns by name, so one moved in a spreadsheet still reads', () => {
    const moved = '"new words","id","current words"\r\n"Group Discussions","coaching.services.1.title","Focus Groups"\r\n';
    const read = readSheet(moved, known());
    expect(read.changes.map((c) => [c.key, c.to])).toEqual([['coaching.services.1.title', 'Group Discussions']]);
  });
});
