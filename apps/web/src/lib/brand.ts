import { colors as tokenColors } from '@altogether/ui/tokens';
import { resolveColors, cssVarsFor, resolveImages, type BrandOverrides } from '@altogether/ui/brand';

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

/** The logo, favicon and share image this site uses. Defaults to the files in `public/`. */
export function brandImagesFor(overrides: Parameters<typeof resolveImages>[0]) {
  return resolveImages(overrides);
}

/** A site that has not said who founded it does not get given a founder. This was one person's
 *  name, so a second site with the founder section on and no name filled in introduced its owner
 *  as him, in the hero, the alt text and the Person structured data. Empty means the caller must
 *  decide, and every caller already falls back to the company name. */
export const DEFAULT_FOUNDER_NAME = '';

/** Who this site's founder is, and whether it has one.
 *
 *  `show_founder` defaults to true so that this site is unchanged, and a new site turns it off
 *  rather than being asked to fill it in. A site with it off renders no portrait, no bio and no
 *  Person structured data: the block is not there, rather than there and empty. */
export function founderOf(settings: { show_founder?: boolean | null; founder_name?: string | null; company_name?: string | null; brand?: Parameters<typeof resolveImages>[0] }) {
  const images = resolveImages(settings.brand);
  // The company name, not this repository's founder. A site that has not said who founded it is
  // not making a claim about a person, so nothing here should invent one.
  const name = settings.founder_name?.trim() || settings.company_name?.trim() || DEFAULT_FOUNDER_NAME;
  return {
    // Named or not shown. A founder block with no name is a photograph of nobody.
    shown: settings.show_founder !== false && name !== '',
    name,
    photo: images.founderPhoto,
    portrait: images.founderPortrait,
  };
}
