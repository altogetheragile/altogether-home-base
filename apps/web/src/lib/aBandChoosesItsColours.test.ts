import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { orderedSections, BANDS, HOME_SECTIONS } from '@altogether/ui/editor/sections';
import { colors as tokens } from '@altogether/ui/tokens';
import { siteRegistry } from '@altogether/ui/editor/registries';

// A section chooses a ground by name and the text colours come with it. The alternative, a colour
// picker per element, lets somebody write deep teal on deep teal, or orange on white at 2.17:1.
// The point of naming the four is that the unreadable combinations cannot be expressed.

// Paths from the project root, the way the sections test reads its sources.
const css = readFileSync('src/app/globals.css', 'utf8');
const home = readFileSync('src/app/home.css', 'utf8');
const page = readFileSync('src/app/page.tsx', 'utf8');

describe('a band chooses its colours', () => {
  it('defines a ground and both inks for every band on offer', () => {
    // A band the editor offers and the stylesheet does not define is a section with no ground.
    for (const band of BANDS) {
      const block = css.match(new RegExp(`\\.aa-band--${band.key}\\s*\\{([^}]*)\\}`));
      expect(block, `no rule for the ${band.label} band`).toBeTruthy();
      for (const prop of ['--aa-band-bg', '--aa-band-ink', '--aa-band-ink-soft', '--aa-band-accent']) {
        expect(block![1], `${band.label} sets no ${prop}`).toContain(prop);
      }
    }
  });

  it('never puts a ground and its ink on the same colour', () => {
    // The failure this whole shape exists to prevent.
    for (const band of BANDS) {
      const block = css.match(new RegExp(`\\.aa-band--${band.key}\\s*\\{([^}]*)\\}`))![1];
      const read = (p: string) => block.match(new RegExp(`${p}:\\s*var\\(--aa-([a-z-]+)\\)`))![1];
      expect(read('--aa-band-bg'), `${band.label} writes its ink in its own ground`)
        .not.toBe(read('--aa-band-ink'));
      // The accent band drew accent icons on an accent ground: they were not there at all.
      expect(read('--aa-band-bg'), `${band.label} draws its highlight in its own ground`)
        .not.toBe(read('--aa-band-accent'));
    }
  });

  it('keeps a band across a save, and drops one that is not on offer', () => {
    const saved = JSON.stringify([
      { section: 'stats', visible: true, band: 'deep' },
      { section: 'hero', visible: true, band: 'chartreuse' },
    ]);
    const got = orderedSections(saved, HOME_SECTIONS);
    expect(got.find((s) => s.section === 'stats')?.band).toBe('deep');
    // An unknown name would render a class nothing defines: a section with no ground at all.
    expect(got.find((s) => s.section === 'hero')?.band).toBeUndefined();
  });

  it('leaves a section that has chosen nothing with no band at all', () => {
    // Not a fifth name meaning "as designed". Absent, so the page renders as it always did.
    expect(orderedSections('', HOME_SECTIONS).every((s) => s.band === undefined)).toBe(true);
  });

  it('falls back to the colour it already had everywhere it reads a band', () => {
    // This is what makes the change invisible until somebody uses it. A bare var(--aa-band-bg)
    // anywhere would paint a section with nothing the moment no band is set.
    for (const file of [home, page]) {
      const bare = file.match(/var\(--aa-band-(?:bg|ink|ink-soft|accent)\)/g);
      expect(bare, `a band variable with no fallback: ${bare?.join(', ')}`).toBeNull();
    }
  });

  it('paints the statistics bar from the band, which is where this started', () => {
    expect(home).toContain('background: var(--aa-band-bg, var(--aa-sky-teal));');
  });
});

describe('every colour has an owner', () => {
  const fields = Object.entries(siteRegistry.entries as Record<string, { type?: string; path?: string; label: string; group?: string }>);
  const colourFields = fields.filter(([, f]) => f.type === 'colour');

  it('offers every colour the site paints with', () => {
    // Seven of the twelve had no control at all, body text and quiet text among them: the two
    // most-read colours on the site could not be changed.
    const offered = colourFields.map(([, f]) => f.path?.replace('colors.', ''));
    for (const token of Object.keys(tokens)) {
      expect(offered, `${token} is painted with and cannot be edited`).toContain(token);
    }
  });

  it('files each one under what it paints', () => {
    for (const [key, f] of colourFields) {
      expect(['Text', 'Backgrounds', 'Accents'], `${key} is in ${f.group}`).toContain(f.group);
    }
  });

  it('names them for what they do, not for what colour they happen to be', () => {
    // "Mid colour" and "Pale colour" told you nothing about what changing them would move.
    for (const [, f] of colourFields) expect(f.label).not.toMatch(/teal/i);
  });
});
