import { colors as tokenColors } from '@altogether/ui/tokens';
import { resolveColors, cssVarsFor, type BrandOverrides } from '@altogether/ui/brand';

// ============= The palette, and why these are not hex values =============
//
// Every colour on this site used to be a compiled constant. `style={{ background: c.deepTeal }}`
// put the literal teal into the server-rendered HTML, so the palette was decided at build time and
// a different brand needed a different build. That is the wrong shape for a site meant to be stood
// up again for someone else.
//
// So `colors` now holds references rather than values. `c.deepTeal` is the string
// `var(--aa-deep-teal)`, and `brandCssVars` below defines what that resolves to, once, on the
// element wrapping the whole page. Nothing else had to change: all 467 uses were already inline
// styles, and a CSS custom property is legal anywhere a colour is.
//
// The point is that the values can now come from somewhere else - a row in site_settings, say -
// without touching a single component.

const cssVarName = (token: string) => `--aa-${token.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

/** The literal values. For the rare place that needs a colour rather than a reference to one:
 *  an SVG presentation attribute, a canvas, an image generated at build time. Styling should use
 *  `colors`, so that it follows the brand. */
export const colorValues = tokenColors;

/** The palette as CSS custom property references. Use this for anything you are styling. */
export const colors = Object.fromEntries(
  Object.keys(tokenColors).map((k) => [k, `var(${cssVarName(k)})`]),
) as Record<keyof typeof tokenColors, string>;

export type ColorToken = keyof typeof tokenColors;
export { fonts, radii, fontWeights, space, tokens } from '@altogether/ui/tokens';

/** What the references above resolve to, for a site with no brand of its own. Spread onto a root
 *  element's `style`. Built from the literal values, never from `colors`, or each property would
 *  define itself. */
export const brandCssVars = cssVarsFor(tokenColors) as Record<`--aa-${string}`, string>;

/** The same, for a site that has set some colours of its own in `site_settings.brand`.
 *
 *  This is the whole point of the palette being references rather than values: the page is
 *  server-rendered with these already resolved, so a site with a different brand paints correctly
 *  on the first frame rather than changing colour once JavaScript arrives. */
export function brandCssVarsFor(overrides: BrandOverrides): Record<`--aa-${string}`, string> {
  return cssVarsFor(resolveColors(overrides)) as Record<`--aa-${string}`, string>;
}
