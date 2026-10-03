import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The editor's launcher does not sit on the button the game is asking you to press.
//
// Reported with a screenshot of the Retrospective: "The Edit this Page button blocks the game
// buttons bottom right." The games pin their own action bar there - Back, "Pick one improvement to
// carry forward", "Start Sprint 2" - and the launcher is fixed above everything at z-60, so it
// covered the primary action.
//
// The drawer cannot know which pages have a bar of their own; the app rendering them can, and says
// so. These hold both halves of that agreement, which is the sort of thing that is easy to half
// remove later.

const drawer = () => readFileSync('packages/ui/src/editor/EditDrawer.tsx', 'utf8');
const app = () => readFileSync('src/components/edit/EditThisSite.tsx', 'utf8');

describe('the launcher', () => {
  it('can be told to keep clear of a page\'s own bottom bar', () => {
    expect(drawer(), 'the drawer no longer takes a position from its host').toContain('launcher?:');
    expect(drawer(), 'there is no way to ask it to move').toContain("'clear-of-a-bottom-bar'");
  });

  it('moves out of the bottom-right when it is', () => {
    const src = drawer();
    const at = src.indexOf('data-part="edit-this-page"');
    expect(at, 'the launcher is gone').toBeGreaterThan(-1);
    const button = src.slice(at, at + 700);
    expect(button, 'it is pinned bottom-right whatever the host says').toMatch(/left-6/);
    expect(button, 'it no longer has a default position').toMatch(/right-6/);
  });
});

describe('the game pages', () => {
  it('ask for it', () => {
    const src = app();
    expect(src, 'the app never tells the drawer it has a bar of its own').toContain('clear-of-a-bottom-bar');
    for (const game of ['zoo-game', 'flow-game', 'scrum-game']) {
      expect(src, `${game} still has the launcher over its action bar`).toContain(game);
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
