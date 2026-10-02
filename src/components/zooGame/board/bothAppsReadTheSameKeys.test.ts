import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { copyEntries } from '../copy';

// The two apps cannot import from each other, and they both have to agree about `zoo_copy`.
//
// The game REGISTERS the keys - `copy.ts` issues one per editable string and writes the override
// into its own copy of the board. The Site READS them, server-side, and lays them over its copy.
// Neither can see the other, so a key renamed on one side becomes a field a trainer edits in the
// game that quietly does nothing on the public page, with nothing on either screen to say so.
//
// Nothing here is shared code. What is shared is the shape of the key, and this is what holds it.

const siteReader = readFileSync('apps/web/src/lib/scrumBoard/content.ts', 'utf8');

/** Every key the game hands out for the board. */
const issued = () => copyEntries().filter((e) => e.key.startsWith('board.')).map((e) => e.key);

describe('the keys the game issues for the board', () => {
  it('are shaped the way the Site looks them up', () => {
    // The Site builds its keys rather than listing them, so the agreement is about the SHAPES.
    const shapes = [
      /^board\.(inspects|produces)\.\d+\.\d+$/,
      /^board\.desc\.\d+\.[01]$/,
      /^board\.[a-z0-9-]+\.(title|lede)$/,
      /^board\.[a-z0-9-]+\.fact\.\d+\.[kv]$/,
      /^board\.[a-z0-9-]+\.sec\.\d+\.[hb]$/,
    ];
    const stray = issued().filter((k) => !shapes.some((re) => re.test(k)));
    expect(stray, `the Site has no way to read: ${stray.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('are all of them, with none of the shapes gone unused', () => {
    // A shape the Site reads and the game never issues is dead code on one side; the reverse is a
    // field that does nothing. Both are the same mistake and this catches either.
    for (const part of ['inspects', 'produces', 'desc', 'title', 'lede', 'fact', 'sec']) {
      expect(issued().some((k) => k.includes(`.${part}.`) || k.endsWith(`.${part}`)),
        `the game issues no ${part} keys any more, but the Site still reads them`).toBe(true);
      expect(siteReader, `the Site stopped reading ${part} keys, which the game still issues`)
        .toContain(part);
    }
  });

  it('are enough of them to be worth checking', () => {
    expect(issued().length, 'the board has almost no editable copy').toBeGreaterThan(400);
  });
});
