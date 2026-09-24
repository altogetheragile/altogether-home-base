import { describe, it, expect } from 'vitest';
import { colors } from '@altogether/ui/tokens';
import { resolveColors, cssVarsFor, hexToHslTriplet, cssVarName, resolveImages, defaultImages, logoOf } from '@altogether/ui/brand';

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

describe('resolving a site logo, favicon and share image', () => {
  it('covers the founder images too, which a site with a founder will replace', () => {
    expect(Object.keys(defaultImages)).toEqual(['logo', 'favicon', 'ogImage', 'founderPhoto', 'founderPortrait']);
  });

  it('is the files this repository ships when nothing is set', () => {
    expect(resolveImages(null)).toEqual(defaultImages);
    expect(resolveImages({ images: {} })).toEqual(defaultImages);
  });

  it('takes an uploaded URL', () => {
    const r = resolveImages({ images: { logo: 'https://cdn.example.com/logo.svg' } });
    expect(r.logo).toBe('https://cdn.example.com/logo.svg');
    expect(r.favicon).toBe(defaultImages.favicon);
  });

  it('takes a path to a file this site serves', () => {
    // This used to be refused, on the grounds that a relative path resolves against whoever is
    // rendering. True of an Open Graph image, which a crawler fetches with nothing but the URL.
    // Not true of anything drawn in a page on this site's own origin, which is how every file in
    // /public is referenced.
    //
    // It cost the live founder photograph to find out: the rule discarded "/images/alun.webp",
    // and nobody noticed for months because the shipped default WAS that file, so a rejected
    // override fell back to the picture it was trying to set.
    expect(resolveImages({ images: { logo: '/brand/lockup.svg' } }).logo).toBe('/brand/lockup.svg');
  });

  it('still refuses one for the social sharing image', () => {
    expect(resolveImages({ images: { ogImage: '/og.png' } }).ogImage).toBe(defaultImages.ogImage);
  });

  it('refuses anything that is not an address at all', () => {
    for (const bad of ['logo.svg', '//cdn/logo.svg', 'javascript:alert(1)', 'data:image/svg+xml,x', '', 42, null]) {
      expect(resolveImages({ images: { logo: bad } }).logo, `accepted ${JSON.stringify(bad)}`).toBe(defaultImages.logo);
    }
  });
});

describe('the logo a site has not chosen', () => {
  it('is the configured image when there is one', () => {
    expect(logoOf({ images: { logo: 'https://cdn.example.com/l.svg' } }, 'Anything')).toEqual({ mode: 'image', src: 'https://cdn.example.com/l.svg' });
  });

  it('is the site\'s own name, not this repository\'s lockup', () => {
    expect(logoOf(null, 'Throwaway Test Co')).toEqual({ mode: 'wordmark', text: 'Throwaway Test Co' });
    expect(logoOf({ images: {} }, 'Her Business')).toEqual({ mode: 'wordmark', text: 'Her Business' });
  });

  it('falls back to the shipped file only when there is no name either', () => {
    // A site with neither has nothing to draw, and an empty header is worse than a placeholder.
    expect(logoOf(null, null)).toEqual({ mode: 'image', src: defaultImages.logo });
    expect(logoOf(null, '   ')).toEqual({ mode: 'image', src: defaultImages.logo });
  });

  it('takes a path, as everywhere else', () => {
    expect(logoOf({ images: { logo: '/logo.svg' } }, 'Co')).toEqual({ mode: 'image', src: '/logo.svg' });
  });

  it('still falls back to the name for something that is not an address', () => {
    expect(logoOf({ images: { logo: 'logo.svg' } }, 'Co')).toEqual({ mode: 'wordmark', text: 'Co' });
  });
});
