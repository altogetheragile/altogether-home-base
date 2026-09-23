import { describe, it, expect } from 'vitest';
import { colors } from '@altogether/ui/tokens';
import { resolveColors, cssVarsFor, hexToHslTriplet, cssVarName } from '@altogether/ui/brand';

// Lives here rather than in packages/ui because the root suite only collects src/**.
//
// This is what a second site's brand goes through on every render, in both apps. It reads values
// somebody typed into an admin form, so the interesting cases are the malformed ones.

describe('resolving a site brand', () => {
  it('is the tokens when nothing is set', () => {
    expect(resolveColors(null)).toEqual(colors);
    expect(resolveColors(undefined)).toEqual(colors);
    expect(resolveColors({})).toEqual(colors);
    expect(resolveColors({ colors: {} })).toEqual(colors);
  });

  it('applies what is set and leaves the rest alone', () => {
    const r = resolveColors({ colors: { orange: '#123456' } });
    expect(r.orange).toBe('#123456');
    expect(r.deepTeal).toBe(colors.deepTeal);
  });

  it('normalises case, so two sites do not differ by typing', () => {
    expect(resolveColors({ colors: { orange: '#abcdef' } }).orange).toBe('#ABCDEF');
    expect(resolveColors({ colors: { orange: '  #abcdef  ' } }).orange).toBe('#ABCDEF');
  });

  it('drops anything that is not a six-digit hex, rather than rendering it', () => {
    // A typo should cost one colour, not the site. Each of these falls back to the token.
    for (const bad of ['red', '#FFF', '#GGGGGG', '#1234567', 'var(--x)', '', '   ', 42, null, {}, ['#FFFFFF']]) {
      expect(resolveColors({ colors: { orange: bad } }).orange, `accepted ${JSON.stringify(bad)}`).toBe(colors.orange);
    }
  });

  it('ignores keys that are not colours in this palette', () => {
    const r = resolveColors({ colors: { notAColour: '#FFFFFF', orange: '#123456' } });
    expect(r).not.toHaveProperty('notAColour');
    expect(r.orange).toBe('#123456');
  });
});

describe('the custom properties both apps render from', () => {
  it('names them from the token, kebab-cased', () => {
    expect(cssVarName('deepTeal')).toBe('--aa-deep-teal');
    expect(cssVarName('orangeHover')).toBe('--aa-orange-hover');
  });

  it('publishes each colour as hex and as an HSL triplet', () => {
    const vars = cssVarsFor(resolveColors({ colors: { orange: '#FF9715' } }));
    expect(vars['--aa-orange']).toBe('#FF9715');
    expect(vars['--aa-orange-hsl']).toBe('33.3 100% 54.1%');
  });

  it('covers every token, so nothing resolves to nothing', () => {
    const vars = cssVarsFor(resolveColors(null));
    for (const name of Object.keys(colors)) {
      expect(vars[cssVarName(name)], `${name} has no value`).toMatch(/^#[0-9A-F]{6}$/i);
      expect(vars[`${cssVarName(name)}-hsl`], `${name} has no triplet`).toMatch(/^[\d.]+ [\d.]+% [\d.]+%$/);
    }
  });

  it('converts a changed colour to a triplet too, or Tailwind would keep the old one', () => {
    const vars = cssVarsFor(resolveColors({ colors: { orange: '#7C3AED' } }));
    expect(vars['--aa-orange']).toBe('#7C3AED');
    expect(vars['--aa-orange-hsl']).toBe(hexToHslTriplet('#7C3AED'));
    expect(vars['--aa-orange-hsl']).not.toBe('33.3 100% 54.1%');
  });
});
