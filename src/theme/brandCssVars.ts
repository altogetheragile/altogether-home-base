import { colors } from '@altogether/ui/tokens';
import { resolveColors, cssVarsFor, hexToHslTriplet, type BrandOverrides } from '@altogether/ui/brand';

export { hexToHslTriplet };

/** Brand colours as CSS custom properties (`--aa-deep-teal` and `--aa-deep-teal-hsl`), for a site
 *  with no brand of its own. Generated from the token package so the palette is written down once.
 *
 *  Each colour is published twice: as the hex value, for anything styled directly, and as an HSL
 *  triplet, for the Tailwind theme in index.css, which is written the shadcn way. index.css
 *  carries the same triplets as static defaults so the first paint is right; these override them,
 *  which is what lets the palette change without a rebuild. brandHslMatchesTokens.test.ts holds
 *  the two in step. */
export const brandCssVars = cssVarsFor(colors) as Record<`--aa-${string}`, string>;

/** Put them on :root, not on a wrapper.
 *
 *  A custom property is inherited, so one declared on a div reaches that div's descendants and
 *  nothing else. Every dialog, tooltip and dropdown in this app is a Radix portal rendered to
 *  document.body, which is OUTSIDE that div - so var(--aa-deep-teal) in a modal would resolve to
 *  nothing and the colour would silently disappear.
 *
 *  Measured before changing it: inside the wrapper --aa-deep-teal gave rgb(0, 77, 77); at body
 *  level it gave nothing. On :root it reaches both.
 *
 *  Called twice on purpose. Once at startup with no argument, so the app paints in the default
 *  brand immediately rather than waiting on the network, and again once `site_settings` arrives
 *  with whatever this site has set. On altogetheragile.com the second call changes nothing,
 *  because its brand IS the tokens. */
export function applyBrandCssVars(overrides?: BrandOverrides) {
  if (typeof document === 'undefined') return;
  for (const [name, value] of Object.entries(cssVarsFor(resolveColors(overrides)))) {
    document.documentElement.style.setProperty(name, value);
  }
}
