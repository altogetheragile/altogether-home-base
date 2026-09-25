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
/** The same brand column, read for the wordmark rather than for a picture. */
type BrandWordmarkOverrides = {
    wordmark?: {
        twoTone?: unknown;
    } | null;
} | null | undefined;
/** The brand column as a header reads it: the pictures and the wordmark are one object, and a
 *  component that renders a logo needs both to decide what to draw. Not BrandOverrides, which is
 *  already the colours. */
type BrandLogoOverrides = {
    images?: Partial<Record<string, unknown>> | null;
    wordmark?: {
        twoTone?: unknown;
    } | null;
} | null | undefined;
/** Is this somewhere a picture can actually be?
 *
 *  The rule used to be "absolute http address only", for the Open Graph reason above, applied to
 *  every image. That quietly discarded every path this site serves itself, and it did not show,
 *  because the shipped defaults WERE this site's own files: a rejected override fell back to the
 *  very picture it was trying to set. The moment those defaults went empty, so a second site would
 *  not wear this one's face, the founder photograph disappeared from the live site and the
 *  override meant to keep it turned out never to have been read. */
/** A picture and the words that stand in for it.
 *
 *  Stored together, as one value, deliberately. Alt text kept in a separate key beside the image
 *  is alt text that goes stale the first time somebody changes the picture and not the sentence,
 *  and nobody notices because the only people who read it cannot see the picture. */
type Picture = {
    src: string;
    alt: string;
};
declare function picture(text: string): Picture | null;
declare function isPicture(value: string, name?: ImageName): boolean;
declare function resolveImages(overrides?: BrandImageOverrides): Record<ImageName, string>;
type Logo = {
    mode: 'image';
    src: string;
} | {
    mode: 'wordmark';
    text: string;
};
/** A wordmark in two parts, so the second can be set in the accent colour.
 *
 *  The two-tone look is two rules, not a design: set the name in capitals, and put the last word
 *  in the accent colour against the rest in the darkest one. It is the whole of this site's own
 *  lettering, and a site that has a name and a palette already has everything it needs for it,
 *  with no file to commission and none to keep up to date.
 *
 *  Off unless asked for. It is this site's typographic signature, and a second site should look
 *  like itself by default rather than like ours. */
type Wordmark = {
    first: string;
    second: string;
    gap: boolean;
    twoTone: boolean;
};
/** Where a name comes apart.
 *
 *  On the last space, so "Bramble & Fern" keeps "Bramble &" together and accents "Fern". With no
 *  space at all, on the capital letter that starts the second half, which is how a name like
 *  StreamStrategy is read aloud even though it is written as one word.
 *
 *  It gets some names wrong. "McKenzie" comes apart into "Mc" and "Kenzie", and there is no rule
 *  that tells that apart from "StreamStrategy" without knowing the words. That is why this is a
 *  setting somebody turns on once and looks at, rather than something applied to every site. */
declare function splitWordmark(text: string): {
    first: string;
    second: string;
    gap: boolean;
};
/** The wordmark this site renders where a logo would go, and whether it is set in two colours. */
declare function wordmarkOf(overrides: BrandWordmarkOverrides, companyName?: string | null): Wordmark;
/** What to render where the logo goes. `companyName` is only used when no logo is configured. */
declare function logoOf(overrides: BrandImageOverrides, companyName?: string | null): Logo;
/** The same colour, mixed with white, for a card's header band.
 *
 *  Somebody picking a card colour should pick one colour, not two. Asking for the pale version as
 *  well is asking them to do arithmetic to keep a pair in step, and the pair only ever goes out of
 *  step in one direction: somebody changes the strong one and forgets.
 *
 *  Computed rather than CSS color-mix so it works the same everywhere and can be tested. */
declare function tint(hex: string, strength?: number): string;

export { type BrandImageOverrides, type BrandLogoOverrides, type BrandOverrides, type BrandWordmarkOverrides, type ColorName, type ImageName, type Logo, type Palette, type Picture, type Wordmark, cssVarName, cssVarsFor, defaultImages, hexToHslTriplet, isPicture, logoOf, picture, resolveColors, resolveImages, splitWordmark, tint, wordmarkOf };
