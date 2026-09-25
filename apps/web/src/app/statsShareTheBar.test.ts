import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Each stat used to shrink-wrap its own words, so the row was only as wide as the text happened
// to be and sat in a huddle in the middle of a full-width band. Long labels hid it. A site whose
// stats were still called "Stat 1" showed three icons clustered in the centre of an empty bar.

const css = readFileSync(resolve(__dirname, 'home.css'), 'utf-8');
const rule = (selector: string) => {
  const m = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
};

describe('the stats share the bar', () => {
  it('gives every stat an equal share, whatever its words say', () => {
    // flex-basis 0, so the spacing comes from the bar rather than from the length of the text.
    expect(rule('.aa-stat')).toMatch(/flex:\s*1\s+1\s+0/);
  });

  it('does not let a stat set its own width from its padding', () => {
    // The old rule was padding: 8px 40px on a shrink-wrapped box, which is what did it.
    expect(rule('.aa-stat')).not.toMatch(/padding:[^;]*\b40px/);
  });

  it('keeps the row to a readable measure while the band stays edge to edge', () => {
    // Without this four stats drift absurdly far apart on a wide screen.
    expect(rule('.aa-stats-bar')).toMatch(/padding:[^;]*calc\(/);
    expect(rule('.aa-stats-bar')).toMatch(/background:\s*var\(--aa-sky-teal\)/);
  });

  it('says the two-up phone layout in flex terms, since a width would lose', () => {
    // flex-basis: 0 beats width in a flex row, so `width: 50%` silently stopped working.
    const mobile = css.slice(css.indexOf('@media (max-width: 767px)'));
    expect(mobile).toMatch(/\.aa-stats-bar\s*>\s*div\s*\{[^}]*flex:\s*0\s+0\s+calc\(50%/);
  });
});
