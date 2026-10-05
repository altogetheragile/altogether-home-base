import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The editor's launcher does not sit on top of the game.
//
// Reported twice. First with a screenshot of the Retrospective - "The Edit this Page button blocks
// the game buttons bottom right" - because the games pin their own action bar there and the
// launcher is fixed above everything at z-60. It was moved to the bottom-LEFT, which held until
// the games put the team's chat panel in that corner: "The Edit button is in the way again, can it
// be hidden?"
//
// Both fixes were the same move - find the empty corner - and a game screen has not got one:
// header, tabs, seat band, board, park, the thread, the action bar. So on those pages it is not in
// a corner at all. It is a sliver against the edge of the window that opens out under the pointer,
// which is on top of nothing and is still one click.
//
// The drawer cannot know which pages are like that; the app rendering them can, and says so. These
// hold both halves of that agreement, which is the sort of thing that is easy to half remove.

const drawer = () => readFileSync('packages/ui/src/editor/EditDrawer.tsx', 'utf8');
const app = () => readFileSync('src/components/edit/EditThisSite.tsx', 'utf8');

/** The launcher's markup, whichever branch draws it. A window either side of the marker, because
 *  the handler sits above it in one branch and below it in the other. */
const launchers = (): string[] => {
  const src = drawer();
  const out: string[] = [];
  for (let at = src.indexOf('data-part="edit-this-page"'); at > -1;
    at = src.indexOf('data-part="edit-this-page"', at + 1)) {
    out.push(src.slice(Math.max(0, at - 300), at + 900));
  }
  return out;
};

describe('the launcher', () => {
  it('can be told where the host has room for it', () => {
    expect(drawer(), 'the drawer no longer takes a position from its host').toContain('launcher?:');
    for (const mode of ['clear-of-a-bottom-bar', 'tucked-away']) {
      expect(drawer(), `there is no way to ask for "${mode}"`).toContain(`'${mode}'`);
    }
  });

  it('is still only ever one button, wherever it is', () => {
    const all = launchers();
    expect(all.length, 'the launcher is gone').toBeGreaterThan(0);
    for (const one of all) {
      expect(one, 'a launcher that cannot be opened').toMatch(/setOpen\(true\)/);
    }
  });

  it('keeps a bottom corner for a page that has only one thing pinned', () => {
    // Still the right answer for a page with a bar on one side and nothing on the other.
    const corners = launchers().find((one) => /bottom-6/.test(one))!;
    expect(corners, 'the launcher is pinned bottom-right whatever the host says').toMatch(/left-6/);
    expect(corners, 'it no longer has a default position').toMatch(/right-6/);
  });

  it('leaves the corners alone entirely when it is tucked away', () => {
    const tucked = launchers().find((one) => !/bottom-6/.test(one));
    expect(tucked, 'there is no tucked-away launcher, so a game has it over something').toBeTruthy();
    expect(tucked!, 'it is still sitting in a corner').not.toMatch(/bottom-\d|right-\d/);
    expect(tucked!, 'it is not against the edge of the window').toMatch(/left-0/);
    // Still reachable without reading the source: it says what it is to a pointer and to a reader.
    expect(tucked!, 'a sliver with no label is a sliver nobody will press').toMatch(/aria-label="Edit This Page"/);
  });
});

describe('the game pages', () => {
  it('ask to be left alone', () => {
    const src = app();
    expect(src, 'the app never tells the drawer what it has pinned').toContain('tucked-away');
    for (const game of ['zoo-game', 'flow-game', 'scrum-game']) {
      expect(src, `${game} still has the launcher over its own screen`).toContain(game);
    }
  });

  it('and the ordinary pages do not, because nothing is down there', () => {
    // The Site's pages end with a footer, not a pinned bar. Moving the launcher everywhere would
    // be fixing one screen by changing forty.
    const src = app();
    const line = src.split('\n').find((l) => l.includes('launcher:'))!;
    expect(line, 'every page now gets the moved launcher').toMatch(/undefined/);
  });
});
