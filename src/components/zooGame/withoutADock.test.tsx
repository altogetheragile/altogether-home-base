import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DOCK_GUTTER, DOCKED_BAR_PX } from './ActionBar';

// Room at the foot for the thing that is always there.
//
// Every screen in the game ends in the same dock: one pill, bottom right, fixed to the WINDOW
// rather than to whatever is scrolling. So a pane that scrolls and reserves nothing at its foot
// ends flush against the window, and its last control sits under the pill.
//
// Found by measuring rather than by looking. With the Product Backlog wizard scrolled to the
// bottom at an ordinary window size, the fourth area you can choose - Forest - was underneath the
// dock: its box and the pill's box overlapped. Nothing about it looked broken.
//
// This reads the sources, because the rule is about every screen and a render only covers the one
// it mounted, and because jsdom has no layout to measure: the check is that a pane which renders
// an ActionBar also reserves the gutter, which is the thing that was missing.

const DIR = __dirname;
const PAGES = join(DIR, '..', '..', 'pages');

/** Where each screen's scroll container lives. The wizard and the final screen render outside the
 *  shell, so their panes are in the page rather than in a component. */
const HOSTS = [
  { f: join(DIR, 'ZooShell.tsx'), why: 'the Product Backlog tab, the Sprint tab and the takeover panel' },
  { f: join(DIR, 'ZooFinal.tsx'), why: 'the screen you reach by finishing the game' },
  { f: join(PAGES, 'ZooGame.tsx'), why: 'the Product Backlog wizard, which renders without the shell' },
];

describe('the dock never lies over the last control', () => {
  it('reserves the room where the panes are', () => {
    for (const { f, why } of HOSTS) {
      const text = readFileSync(f, 'utf8');
      expect(text.includes('DOCK_GUTTER'), `${why} reserves nothing for the dock`).toBe(true);
    }
  });

  it('reserves it as the shared measure, not a number somebody typed', () => {
    // Three different paddings were in use - 52, 80, 96 - for one pill of one height. The point of
    // the token is that the next screen cannot pick a fourth.
    for (const { f, why } of HOSTS) {
      const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const stray = [...text.matchAll(/\bpb-(1[6-9]|2\d|3\d)\b/g)].map((m) => m[0]);
      expect(stray, `${why} still hard-codes a bottom gutter: ${stray.join(', ')}`).toEqual([]);
    }
  });

  it('is at least as deep as the pill is tall', () => {
    // The pill measures 58 and sits 16 up from the foot of the window. pb-24 is 96.
    const px = Number(DOCK_GUTTER.replace('pb-', '')) * 4;
    expect(px, 'the gutter is shallower than the dock it is reserving for').toBeGreaterThanOrEqual(74);
    expect(DOCKED_BAR_PX, 'the pane reservation is shallower than the dock').toBeGreaterThanOrEqual(74);
  });
});
