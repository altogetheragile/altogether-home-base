import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// A hidden page is kept for an admin and marked. "Kept and marked" has to hold in every list that
// draws it, and there are five: the desktop menu, the resources drop-down, both mobile lists, and
// the footer. The first version of this marked one of them, so a page hidden from the menu
// vanished from the footer entirely and read as deleted.
//
// This is the same shape of mistake as gating AboutSection and forgetting FounderPortrait: the
// change is right and applied in fewer places than it needed to be.

const nav = readFileSync('src/components/Navigation.tsx', 'utf8');
const footer = readFileSync('src/components/Footer.tsx', 'utf8');
const layout = readFileSync('src/app/layout.tsx', 'utf8');

describe('hidden is marked everywhere', () => {
  it('marks every list the menu draws', () => {
    const drawn = (nav.match(/\{label\(l\.key\)\}/g) ?? []).length;
    const marked = (nav.match(/<HiddenDot \/>/g) ?? []).length;
    expect(marked, `${drawn} lists draw a label, ${marked} mark a hidden one`).toBe(drawn);
  });

  it('keeps hidden entries rather than filtering them out for an admin', () => {
    expect(nav).toMatch(/flag\(l\.flag\) \|\| signedInAsAdmin/);
    expect(footer).toMatch(/l\.show \|\| signedInAsAdmin/);
  });

  it('marks them in the footer too', () => {
    expect(footer).toMatch(/Hidden from visitors/);
  });

  it('tells both of them who is looking', () => {
    // Either one left without it silently reverts to the visitor's view for everybody.
    expect(layout).toMatch(/<Navigation[^>]*signedInAsAdmin=\{admin\}/s);
    expect(layout).toMatch(/<Footer[^>]*signedInAsAdmin=\{admin\}/s);
  });

  it('defaults to the visitor view when nobody says otherwise', () => {
    // A default of true would show every hidden page to everybody.
    expect(nav).toMatch(/signedInAsAdmin = false/);
    expect(footer).toMatch(/signedInAsAdmin = false/);
  });
});
