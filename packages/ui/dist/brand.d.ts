import { colors } from './tokens.js';

type ColorName = keyof typeof colors;
type Palette = Record<ColorName, string>;
/** What a site may override. Anything absent or invalid falls back to the token, so an empty
 *  object renders the default brand and a half-filled one renders a half-changed brand. */
type BrandOverrides = {
    colors?: Partial<Record<string, unknown>> | null;
} | null | undefined;
/** The palette this site actually uses: the tokens, with any valid overrides applied.
 *
 *  Invalid values are dropped rather than rejected. This runs on every page render, and a typo in
 *  one colour should cost that colour, not the site. */
declare function resolveColors(overrides?: BrandOverrides): Palette;
/** A hex colour as the space-separated HSL triplet Tailwind's theme expects.
 *
 *  The App's theme is written the shadcn way, `--primary: 33.3 100% 54.1%`, wrapped by Tailwind as
 *  `hsl(var(--primary) / <alpha-value>)`. The triplet rather than a colour is what makes
 *  `bg-primary/90` work, so the brand has to arrive in that shape or the opacity modifiers break. */
declare function hexToHslTriplet(hex: string): string;
declare const cssVarName: (token: string) => string;
/** Every colour as two custom properties: the hex, for anything styled directly, and the HSL
 *  triplet, for the Tailwind theme. Spread onto a root element's style, or written with
 *  setProperty. Both apps use this, so a site's brand reaches both the same way. */
declare function cssVarsFor(palette: Palette): Record<string, string>;
type ImageName = 'logo' | 'favicon' | 'ogImage' | 'founderPhoto' | 'founderPortrait';
/** The files this repository ships. A site that sets nothing gets these.
 *
 *  The two founder images are a photograph, used on the About page, and an illustration, used in
 *  the home page's portrait block. A site with `show_founder` off never asks for either. */
declare const defaultImages: Record<ImageName, string>;
type BrandImageOverrides = {
    images?: Partial<Record<string, unknown>> | null;
} | null | undefined;
/** Only absolute http(s) URLs are accepted. An uploaded file has one; a relative path would be
 *  resolved against whichever site is rendering, which for an Open Graph image means a crawler
 *  fetching a path that does not exist. */
declare function resolveImages(overrides?: BrandImageOverrides): Record<ImageName, string>;

export { type BrandImageOverrides, type BrandOverrides, type ColorName, type ImageName, type Palette, cssVarName, cssVarsFor, defaultImages, hexToHslTriplet, resolveColors, resolveImages };
