import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { copyEntries } from '../copy';
import { ScrumBoard } from './ScrumBoard';
import { BOARD_PAGES, pageById } from './boardPages';
import { BOARD_DESC } from './boardLabels';

// Editable means it reaches the screen, not that it appears in a list.
//
// Asked for in one line - "the copy all needs to be editable too" - and the trap in it is that
// registering four hundred entries is easy and proves nothing. An entry whose `apply` writes
// somewhere the screen never reads is a field a trainer types into at 9pm and watches do nothing.

const entry = (key: string) => {
  const e = copyEntries().find((x) => x.key === key);
  expect(e, `there is no editable entry called ${key}`).toBeTruthy();
  return e!;
};

/** Put a value in, the way the override layer does, and give it back afterwards. */
const edits: (() => void)[] = [];
const edit = (key: string, value: string) => {
  const e = entry(key);
  const was = e.value;
  edits.push(() => e.apply(was));
  e.apply(value);
};
afterEach(() => { while (edits.length) edits.pop()!(); });

describe('a word changed in the editor', () => {
  it('reaches the board itself', () => {
    // The Daily Scrums column, because it is the wide one. The board wraps its text to the column
    // it is in, so a line under Sprint Planning - 150 units across - comes out as two <text>
    // elements and never appears as one string, whatever it says.
    // Taken by value. `BOARD_DESC` is what `apply` writes into, so reading it after the edit gives
    // the NEW wording back and an assertion against it checks nothing.
    const shipped = BOARD_DESC[1][0];
    const before = render(<ScrumBoard />).container.textContent ?? '';
    expect(before, 'the board does not say this to begin with').toContain(shipped);

    edit('board.desc.1.0', 'Look hard at how far the Sprint Goal has got');
    const after = render(<ScrumBoard />).container.textContent ?? '';
    expect(after, 'the edit never reached the board').toContain('Look hard at how far the Sprint Goal has got');
    expect(after, 'the old wording is still on the board').not.toContain(shipped);
  });

  it('reaches a page behind the board', () => {
    const page = BOARD_PAGES.find((p) => p.id === 'sprint-review')!;
    edit('board.sprint-review.lede', 'A working session, not a presentation.');
    expect(pageById('sprint-review')!.lede, 'the lede was written somewhere nothing reads')
      .toBe('A working session, not a presentation.');
    expect(page.lede, 'two copies of the same page went out of step').toBe('A working session, not a presentation.');
  });

  it('is put back when the override is removed, so a bad edit is one click from the shipped words', () => {
    const e = entry('board.sprint-review.title');
    const shipped = e.value;
    e.apply('Show and Tell');
    expect(pageById('sprint-review')!.title).toBe('Show and Tell');
    e.apply(shipped);
    expect(pageById('sprint-review')!.title, 'there is no way back to what was shipped').toBe(shipped);
  });
});

describe('every page behind the board', () => {
  it('has every one of its words registered', () => {
    // Title, opening line, each fact both halves, each section heading and body. Counted rather
    // than trusted, because "all of it" was the requirement.
    const keys = new Set(copyEntries().map((e) => e.key));
    const missing: string[] = [];
    for (const p of BOARD_PAGES) {
      const want = [`board.${p.id}.title`, `board.${p.id}.lede`,
        ...p.facts.flatMap((_, i) => [`board.${p.id}.fact.${i}.k`, `board.${p.id}.fact.${i}.v`]),
        ...p.secs.flatMap((_, i) => [`board.${p.id}.sec.${i}.h`, `board.${p.id}.sec.${i}.b`])];
      for (const k of want) if (!keys.has(k)) missing.push(k);
    }
    expect(missing, `not editable: ${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('and so does every chip and line on the board', () => {
    const n = copyEntries().filter((e) => /^board\.(inspects|produces|desc)\./.test(e.key)).length;
    expect(n, 'the board\'s own words are not editable').toBeGreaterThan(20);
  });
});
