import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The game says SIZE, not estimate.
//
// Asked for while playing it: "can we say 'Size' rather than 'Estimate'?" Yes, and it is worth
// holding. The 2020 Scrum Guide puts sizing on the Developers - "the people who will be doing the
// work" - and "estimate" is the word that turns into a commitment in people's heads: an estimate
// gets held against you, a size is a shape you agreed the work has. A game about forecasting has to
// be careful which of those it teaches.
//
// The field is still called `estimate` in the code and the points are still points. This is about
// what a person reads, which is the only place the word does any teaching.

const DIR = 'src/components/zooGame';

/** Every line of a component with the comments taken out.
 *
 *  Comments are where the reasoning lives, and the reasoning is allowed to say "estimate" - it is
 *  the word the Scrum Guide uses for the practice this is a form of, and half of these files explain
 *  themselves by quoting it. A block comment is followed to its end rather than judged a line at a
 *  time, because a wrapped sentence's second line starts with an ordinary word. */
const readable = (src: string): string[] => {
  const out: string[] = [];
  let inBlock = false;
  for (const line of src.split('\n')) {
    const bare = line.trim();
    if (inBlock) { if (bare.includes('*/')) inBlock = false; continue; }
    // `{/* ... */}` as well as `/* ... */`: a JSX comment is the commonest kind in these files.
    if (bare.startsWith('/*') || bare.startsWith('{/*')) { if (!bare.includes('*/')) inBlock = true; continue; }
    if (bare.startsWith('//') || bare.startsWith('*')) continue;
    out.push(line.replace(/\/\/.*$/, ''));
  }
  return out;
};

describe('what a person reads', () => {
  it('never offers to estimate anything', () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith('.tsx') && !f.includes('.test.'));
    const found: string[] = [];
    for (const f of files) {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const line of readable(src)) {
        // The word itself, in words - not `item.estimate`, `onEstimate`, or ESTIMATE_ITEM, which are
        // the field and the action and are nobody's reading matter.
        const said = line.match(/(?<![.\w])(Estimate|Estimating|estimate|estimating|estimation)(?![\w(])/);
        if (!said) continue;
        // ...and not a property being read off an item, which is a number.
        if (/\.estimate\b/.test(line)) continue;
        found.push(`${f}: ${line.trim().slice(0, 100)}`);
      }
    }
    expect(found, 'the screen offers to estimate something; it should say size').toEqual([]);
  });

  it('says what a size is for where it asks for one', () => {
    const poker = readFileSync(join(DIR, 'Board.tsx'), 'utf8');
    expect(poker, 'the sizing workspace stopped saying whose job it is')
      .toMatch(/The Developers size the work, because they are the ones who will do it/);
  });
});
