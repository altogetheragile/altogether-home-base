import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ZooOrientationBody } from './ZooOrientation';
import { ScrumOnePagerBody } from './ScrumTeaching';
import { copyEntries, type CopyEntry, type CopyGroup } from './copy';

// The copy editor lists the words in the order a player reads them.
//
// Asked with the editor open beside the screen: "can the teaching copy be in the order it appears
// on the pages?"
//
// It could not, and for a reason worth pinning down rather than just correcting. `copyEntries` was
// written in the order the features were BUILT, and the screens have been rearranged several times
// since. The editor renders groups in first-seen order and rows in push order, so that build order
// was what a trainer read. The worst of it was the Sprint loop, whose five lines are each two
// editable pieces side by side: the left-hand labels were filed under the orientation screen and
// the right-hand text under a group named for the screen the loop had MOVED AWAY FROM, so editing
// one line meant finding it twice, under two headings, one of which was a lie.
//
// Correcting the list is a one-off. What stops it drifting again is reading the order back off the
// screens themselves, the way the pins on the example park are measured off the drawing rather than
// worked out from the model: move a panel on a page and forget this file, and the build says so.

/** Where each entry's text first appears in the rendered screen, for the entries that can be found
 *  there unambiguously.
 *
 *  Only the unambiguous ones. A value like "Plan" occurs all over the orientation screen, and an
 *  index for it would be a guess presented as a measurement. Long distinctive sentences - which is
 *  most of the teaching - pin the order on their own, and the count is asserted below so this
 *  cannot quietly degrade into checking nothing. */
function asRendered(entries: CopyEntry[], screen: string) {
  return entries
    .map((e) => ({ key: e.key, at: screen.indexOf(e.value), only: screen.indexOf(e.value) === screen.lastIndexOf(e.value) }))
    .filter((f) => f.at >= 0 && f.only);
}

const inOrder = (found: { key: string; at: number }[]) => {
  const out: string[] = [];
  for (let i = 1; i < found.length; i++) {
    if (found[i].at < found[i - 1].at) out.push(`${found[i].key} is listed after ${found[i - 1].key} but appears above it`);
  }
  return out;
};

const only = (group: CopyGroup) => copyEntries().filter((e) => e.group === group);

describe('the order the editor lists things in', () => {
  it('follows How the zoo works down the page', () => {
    const screen = render(<ZooOrientationBody />).container.textContent ?? '';
    const found = asRendered(only('How the zoo works'), screen);
    expect(found.length, 'almost nothing could be found on the screen, so this proves nothing')
      .toBeGreaterThan(12);
    expect(inOrder(found), 'the editor lists this screen out of order').toEqual([]);
  });

  it('follows Scrum on one page down the page', () => {
    const screen = render(<ScrumOnePagerBody />).container.textContent ?? '';
    const found = asRendered(only('Scrum on one page'), screen);
    expect(found.length, 'almost nothing could be found on the screen, so this proves nothing')
      .toBeGreaterThan(12);
    expect(inOrder(found), 'the editor lists the one-pager out of order').toEqual([]);
  });
});

describe('the groups', () => {
  it('come in the order the screens are met', () => {
    // Before you start, both its tabs, then the screen it hands you to. Everything after that is
    // met during play and has no one page to be in the order of.
    const groups = [...new Set(copyEntries().map((e) => e.group))];
    expect(groups.slice(0, 3)).toEqual(['How the zoo works', 'Scrum on one page', 'Your Product Goal']);
  });

  it('do not name a screen the copy is not on', () => {
    // The group is a heading in the editor, so it is a claim about where to look. "The way in" held
    // the Sprint loop after the loop had moved to the orientation screen: a heading that was true
    // when it was written and quietly false afterwards.
    const loop = copyEntries().filter((e) => /^intro\.loop/.test(e.key));
    expect(loop.length, 'the Sprint loop has no editable copy').toBeGreaterThan(4);
    for (const e of loop) {
      expect(e.group, `${e.key} is filed under ${e.group}, not the screen that draws it`)
        .toBe('How the zoo works');
    }
  });
});

describe('a line that is two pieces', () => {
  it('keeps both halves of each Sprint loop row together', () => {
    // Each row of the loop is when it happens and what it is, side by side, and somebody editing
    // one of them almost always wants the other. They were in different groups; now they are
    // adjacent, in the order they sit on the line.
    const rows = copyEntries()
      .filter((e) => /^orientation\.when\.|^intro\.loop\./.test(e.key))
      .map((e) => e.key);
    const steps = rows.filter((k) => k.startsWith('intro.loop.')).length;
    expect(steps, 'the loop lost its steps').toBeGreaterThan(4);
    for (let i = 0; i < steps; i++) {
      const when = rows.indexOf(`orientation.when.${i}`);
      const what = rows.indexOf(`intro.loop.${i}`);
      if (when < 0) continue; // fewer labels than steps is its own fault, caught elsewhere
      expect(what - when, `step ${i} has its two halves apart in the list`).toBe(1);
    }
  });
});
