import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BeforeYouStart } from './BeforeYouStart';
import { ZooIntro } from './ZooIntro';
import { GameLinks } from './GameLinks';

// Every screen of this game offers a way off it.
//
// Reported while looking at the way in: "how can I navigate to / from the game - there is no header
// at all."
//
// True, and only for the way in. The zoo is the one game on this site that does not render the site
// navigation, because it is the one whose frame never scrolls: `/flow-game` and `/scrum-game` are
// `min-h-dvh` pages with a header, a main and a footer stacked down them, and this one is a `h-dvh`
// frame with a park in it that scrolls internally. The board earns that by carrying the mark in its
// own strip. The two screens BEFORE the board carried nothing at all - no strip, no header, no link
// - so somebody who opened the game and thought better of it had the browser's back button and
// nothing the page offered them.
//
// So the rule this holds is not "render the site header"; it is "top left is the way out, on every
// screen", which is what the board already did and the way in did not.

const inRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>).container;

describe('the way out', () => {
  it('is on Before you start', () => {
    const c = inRouter(<BeforeYouStart tab="zoo" onTab={() => {}} onDone={() => {}} />);
    const out = c.querySelector('[data-part="way-home"]');
    expect(out, 'there is no way off this screen except the browser').toBeTruthy();
    expect(out?.getAttribute('href'), 'it does not lead home').toBe('/');
  });

  it('is on Your Product Goal', () => {
    const c = inRouter(<ZooIntro productGoal="" onSetGoal={() => {}} onStart={() => {}} onSetGoalShape={() => {}} />);
    expect(c.querySelector('[data-part="way-home"]')?.getAttribute('href')).toBe('/');
  });

  it('says where it goes, not only whose game this is', () => {
    // The board's strip has room for a glyph and no more. These screens have room for the name, and
    // a bare 皆 is the right size for a strip and the wrong thing to be somebody's only way out: it
    // says whose game this is, and it does not say "this is the way back".
    const c = inRouter(<GameLinks variant="home" />);
    expect(c.textContent ?? '').toContain('Altogether Agile');
  });

  it('is listed in the site menu, and off until it is asked for', async () => {
    // The other half of the question, and the half that was invisible: there was no link to
    // /zoo-game anywhere on this site. Not in the navigation, not on the front page, not in
    // Resources beside the Flow Game - the only way in was typing the URL.
    //
    // Built and held back, deliberately: publishing a game on a professional site is a decision,
    // not a fix. The entry exists and the flag is off, so flipping one value publishes it.
    // Read off the source rather than rendered, and the assertion is scoped to what that can
    // honestly show: that the entry is there, and that its default is off.
    const src = await import('node:fs').then((fs) => fs.readFileSync('src/components/Navigation.tsx', 'utf8'));
    expect(src, 'the zoo is in no menu at all').toContain("to: '/zoo-game'");
    expect(src, 'it went live without being asked for').toMatch(/show_zoo_game:\s*false/);
  });

  it('still leaves the board its glyph', () => {
    // Unchanged, and deliberately: the strip is the densest row in the game, and the mark has been
    // the way home from it since before any of this.
    const c = inRouter(<GameLinks />);
    const link = c.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.getAttribute('aria-label')).toMatch(/back to/i);
  });
});
