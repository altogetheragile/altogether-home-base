import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolveFonts, fontVarsFor, TYPEFACES, DEFAULT_TYPEFACES } from '@altogether/ui/brand';
import { brandCssVarsFor, fonts } from '@/lib/brand';

// Colour was made a site's own and type was not, so every second site said what it wanted in this
// one's voice. Asked for as "how do I change the font", which had no answer.
//
// A named choice rather than a free-form field, for the same reason colour is five tokens rather
// than a picker per heading: the site holds together because the decisions are few.

describe('the type is the site’s own', () => {
  it('ships this repository’s own faces when a site has chosen none', () => {
    const shipped = resolveFonts(null);
    expect(shipped.heading).toContain('DM Serif Display');
    expect(shipped.body).toContain('DM Sans');
    expect(resolveFonts({})).toEqual(shipped);
  });

  it('uses what a site chose', () => {
    const chosen = resolveFonts({ fonts: { heading: 'georgia', body: 'system' } });
    expect(chosen.heading).toContain('Georgia');
    expect(chosen.body).toContain('system-ui');
  });

  it('falls back rather than failing on a face that is not there', () => {
    // This runs on every render. A typeface that has been withdrawn should cost a site its look,
    // not its text.
    for (const bad of [{ heading: 'comic-sans' }, { heading: 42 }, { heading: null }, {}]) {
      expect(resolveFonts({ fonts: bad as never }).heading).toContain('DM Serif Display');
    }
  });

  it('every face offered has somewhere to fall back to', () => {
    // Three font files ship. The rest must name something already on the device, or a site that
    // picks one gets whatever the browser feels like.
    for (const face of TYPEFACES) {
      expect(face.stack.split(',').length, `${face.id} names one family and no fallback`).toBeGreaterThan(1);
      expect(face.note.trim().length, `${face.id} says nothing about how it looks`).toBeGreaterThan(20);
    }
    expect(TYPEFACES.map((f) => f.id)).toContain(DEFAULT_TYPEFACES.heading);
    expect(TYPEFACES.map((f) => f.id)).toContain(DEFAULT_TYPEFACES.body);
  });

  it('emits two custom properties and no more', () => {
    // A heading face and a body face are the whole decision. Anything finer belongs to the
    // design rather than to the site's owner.
    expect(Object.keys(fontVarsFor(null))).toEqual(['--aa-font-heading', '--aa-font-body']);
  });

  it('sends the type out with the colours, so the first frame is already right', () => {
    const vars = brandCssVarsFor({ fonts: { heading: 'georgia' } } as never);
    expect(vars['--aa-font-heading']).toContain('Georgia');
    // And the colours are still there: one block, not two.
    expect(vars['--aa-orange']).toBeTruthy();
  });

  it('points the tokens at the properties, with today’s faces as the fallback', () => {
    expect(fonts.serif).toContain('var(--aa-font-heading');
    expect(fonts.sans).toContain('var(--aa-font-body');
    // The fallback matters: it is what a page uses before the brand block is parsed.
    expect(fonts.serif).toContain('DM Serif Display');
  });

  it('leaves no typeface written into the Site, or the choice reaches only some of it', () => {
    // The whole failure this prevents: a site picks Georgia, most of the page changes, and the
    // pages that named the family directly quietly carry on in DM Serif.
    const out = execSync(
      `grep -rn "DM Serif Display\\|DM Sans\\|Segoe UI" src --include=*.tsx --include=*.ts --include=*.css | grep -v "@font-face" | grep -v "var(--aa-font" | grep -v "\.test\." || true`,
      { encoding: 'utf8' },
    ).trim();
    expect(out, `a typeface is named directly here:\n${out}`).toBe('');
  });

  it('still declares the faces it ships, or nothing can load them', () => {
    const globals = readFileSync('src/app/globals.css', 'utf8');
    for (const family of ['DM Sans', 'DM Serif Display']) {
      expect(globals, `${family} has no @font-face`).toContain(`font-family: '${family}'`);
    }
  });
});
