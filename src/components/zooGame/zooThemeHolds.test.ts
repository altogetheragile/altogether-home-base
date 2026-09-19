import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The zoo keeps its own daylight, all of it.
//
// Found by checking the game in dark mode: the board was WHITE ON WHITE. Not low contrast -
// measured at 1.01:1 on the column headings and the card titles, which is invisible.
//
// The cause is worth writing down, because it is the kind of thing that comes back. `.zoo-theme`
// repaints the site's tokens so the game can be a light surface on a marketing site that has a
// dark mode - and every token it set was a BACKGROUND or a border. The colour of the words was
// left to be inherited, and it was inherited from `body`, which is outside the class and wearing
// the dark theme's near-white text. So the game kept its own white cards and took somebody else's
// white text.
//
// A stylesheet is not something the other tests can see - jsdom never loads it - so this reads the
// file. It is a blunt instrument for a fault that cost the whole board.

const CSS = readFileSync(join(__dirname, '..', '..', 'index.css'), 'utf8');

/** The `.zoo-theme` rule, from its brace to its close. */
function zooTheme(): string {
  const at = CSS.indexOf('.zoo-theme {');
  expect(at, 'the zoo has no theme of its own any more').toBeGreaterThan(-1);
  const end = CSS.indexOf('\n}', at);
  return CSS.slice(at, end);
}

describe('the zoo theme', () => {
  it('says what colour the words are, rather than inheriting them', () => {
    // The one line that fixes the whole game: every component inside it that does not name a colour
    // takes this one, whatever the page outside is wearing.
    expect(zooTheme(), 'the text colour is inherited from outside the game again')
      .toMatch(/color:\s*hsl\(var\(--foreground\)\)/);
  });

  it('sets a foreground for that colour to be', () => {
    expect(zooTheme()).toMatch(/--foreground:/);
  });

  it('paints its own ground, so the words have something to sit on', () => {
    for (const token of ['--background', '--card', '--border', '--muted']) {
      expect(zooTheme(), `${token} is not set, so the game borrows the page's`).toContain(token);
    }
  });
});

describe('there is no dark inside the zoo', () => {
  // The other half of the same idea, and the half that was still broken after the first fix.
  //
  // `.zoo-theme` makes the game a light surface in both themes. Every `dark:text-*` inside it
  // therefore lightens its text for a ground that never arrives - measured on the board in dark
  // mode, "Needs Lion Enclosure built first" fell from 5.02:1 to 1.67:1 and "Hand it back to the
  // Product Backlog" from 4.84:1 to 1.39:1, both amber on a card that is white either way. There
  // are about seventy more `dark:` variants in the game behind those two.
  //
  // Said once in the Tailwind config rather than stripped from seventy places: the dark variant
  // does not apply inside the zoo. Held here because it is one line in a config file that nothing
  // else would notice the loss of.
  const CONFIG = readFileSync(join(__dirname, '..', '..', '..', 'tailwind.config.ts'), 'utf8');

  it('leaves the dark variant at the gate', () => {
    const dark = CONFIG.match(/darkMode:\s*\[[^\]]*\][^,]*,/s)?.[0] ?? '';
    expect(dark, 'the dark variant applies inside the game again').toContain('zoo-theme');
    expect(dark, 'it is not excluded, only mentioned').toMatch(/:not\(/);
  });

  it('still lets the rest of the site go dark', () => {
    const dark = CONFIG.match(/darkMode:\s*\[[^\]]*\][^,]*,/s)?.[0] ?? '';
    expect(dark, 'dark mode is driven by something other than the class').toContain('.dark');
  });
});
