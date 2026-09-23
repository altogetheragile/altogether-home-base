import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { colors } from '@altogether/ui/tokens';
import { hexToHslTriplet, brandCssVars } from './brandCssVars';

// The App's Tailwind theme is written the shadcn way, as HSL triplets. The brand is written as
// hex. So the palette exists twice in this app: once as the static defaults in index.css, which
// decide the first paint, and once as what applyBrandCssVars writes at startup.
//
// Two copies of a palette is how the App ended up with --primary: 24 95% 53%, which is Tailwind's
// orange and not this brand's, while every component confidently called it the brand colour.
// This is the test that stops it happening again.

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

/** The `--aa-*-hsl` defaults declared in index.css. */
function declaredInCss(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/(--aa-[a-z-]+-hsl):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const expected = Object.fromEntries(
  Object.entries(colors).map(([k, v]) => [
    `--aa-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}-hsl`,
    hexToHslTriplet(v),
  ]),
);

describe('converting the brand to what Tailwind expects', () => {
  it('turns hex into an HSL triplet', () => {
    expect(hexToHslTriplet('#FF9715')).toBe('33.3 100% 54.1%');
    expect(hexToHslTriplet('#004D4D')).toBe('180 100% 15.1%');
    expect(hexToHslTriplet('#FFFFFF')).toBe('0 0% 100%');
  });

  it('handles a grey, where hue is undefined rather than zero by accident', () => {
    expect(hexToHslTriplet('#808080')).toBe('0 0% 50.2%');
  });
});

describe('the palette the App starts with', () => {
  const declared = declaredInCss();

  it('declares every brand colour as a triplet', () => {
    const missing = Object.keys(expected).filter((k) => !(k in declared));
    expect(missing, `index.css is missing: ${missing.join(', ')}`).toEqual([]);
  });

  it('matches the tokens exactly, so the first paint is not a different brand', () => {
    for (const [name, value] of Object.entries(expected)) {
      expect(declared[name], `${name} in index.css does not match the token`).toBe(value);
    }
  });

  it('is the same palette applyBrandCssVars writes at runtime', () => {
    for (const [name, value] of Object.entries(expected)) {
      expect(brandCssVars[name as `--aa-${string}`]).toBe(value);
    }
  });
});

describe('the theme takes its brand colours from the brand', () => {
  it('no longer hard-codes a primary', () => {
    expect(css).not.toMatch(/--primary:\s*24 95% 53%/);
    // Three: the light theme, the (unreachable) dark one, and .zoo-theme, which had the brand
    // transcribed by hand with comments naming the very tokens it duplicated.
    expect(css.match(/--primary:\s*var\(--aa-orange-hsl\)/g)?.length, 'every theme should use it').toBe(3);
  });

  it('points the rest of the brand-coloured tokens at the palette too', () => {
    for (const decl of ['--primary-foreground: var(--aa-white-hsl)', '--bmc-orange: var(--aa-orange-hsl)', '--destructive: var(--aa-danger-hsl)']) {
      expect(css, `${decl} not found`).toContain(decl);
    }
  });

  it('leaves the neutral scale alone, which is deliberate', () => {
    // A second site changes its brand colours, not its grey. If this starts failing because
    // somebody pointed --border or --background at a brand token, that is a design decision to
    // make on purpose rather than a drift to fix.
    expect(css).toMatch(/--border:\s*214\.3 31\.8% 91\.4%/);
  });
});
