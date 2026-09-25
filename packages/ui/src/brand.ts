import { colors as defaultColors } from './tokens';

export type ColorName = keyof typeof defaultColors;
export type Palette = Record<ColorName, string>;

/** What a site may override. Anything absent or invalid falls back to the token, so an empty
 *  object renders the default brand and a half-filled one renders a half-changed brand. */
export type BrandOverrides = { colors?: Partial<Record<string, unknown>> | null } | null | undefined;

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The palette this site actually uses: the tokens, with any valid overrides applied.
 *
 *  Invalid values are dropped rather than rejected. This runs on every page render, and a typo in
 *  one colour should cost that colour, not the site. */
export function resolveColors(overrides?: BrandOverrides): Palette {
  const out = { ...defaultColors } as Palette;
  const given = overrides?.colors;
  if (!given) return out;
  for (const name of Object.keys(defaultColors) as ColorName[]) {
    const v = given[name];
    if (typeof v === 'string' && HEX.test(v.trim())) out[name] = v.trim().toUpperCase();
  }
  return out;
}

/** A hex colour as the space-separated HSL triplet Tailwind's theme expects.
 *
 *  The App's theme is written the shadcn way, `--primary: 33.3 100% 54.1%`, wrapped by Tailwind as
 *  `hsl(var(--primary) / <alpha-value>)`. The triplet rather than a colour is what makes
 *  `bg-primary/90` work, so the brand has to arrive in that shape or the opacity modifiers break. */
export function hexToHslTriplet(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const round = (n: number) => String(Math.round(n * 10) / 10);
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}

export const cssVarName = (token: string) => `--aa-${token.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

/** Every colour as two custom properties: the hex, for anything styled directly, and the HSL
 *  triplet, for the Tailwind theme. Spread onto a root element's style, or written with
 *  setProperty. Both apps use this, so a site's brand reaches both the same way. */
export function cssVarsFor(palette: Palette): Record<string, string> {
  return Object.fromEntries(
    Object.entries(palette).flatMap(([k, v]) => [
      [cssVarName(k), v],
      [`${cssVarName(k)}-hsl`, hexToHslTriplet(v)],
    ]),
  );
}

// ============= The images =============
//
// Three files carry a brand as much as its colours do: the lockup on every page, the icon in the
// tab, and the picture that appears when somebody shares a link. They live in the repository as
// defaults, which is right for this site and wrong for anyone else's.

export type ImageName = 'logo' | 'favicon' | 'ogImage' | 'founderPhoto' | 'founderPortrait';

/** The files this repository ships. A site that sets nothing gets these.
 *
 *  The two founder images are a photograph, used on the About page, and an illustration, used in
 *  the home page's portrait block. A site with `show_founder` off never asks for either. */
export const defaultImages: Record<ImageName, string> = {
  logo: '/brand/lockup-horizontal-tight.svg',
  favicon: '/favicon.svg',
  ogImage: '/og-image.png',
  // No default face. These were one person's photograph and portrait, so every site built from
  // this repository showed him wherever a founder appeared. A site that has not uploaded a
  // photograph renders no photograph, and the layout closes up around it.
  founderPhoto: '',
  founderPortrait: '',
};

export type BrandImageOverrides = { images?: Partial<Record<string, unknown>> | null } | null | undefined;

/** The same brand column, read for the wordmark rather than for a picture. */
export type BrandWordmarkOverrides = { wordmark?: { twoTone?: unknown } | null } | null | undefined;

/** The brand column as a header reads it: the pictures and the wordmark are one object, and a
 *  component that renders a logo needs both to decide what to draw. Not BrandOverrides, which is
 *  already the colours. */
export type BrandLogoOverrides =
  | { images?: Partial<Record<string, unknown>> | null; wordmark?: { twoTone?: unknown } | null }
  | null
  | undefined;

const ABSOLUTE = /^https?:\/\/\S+$/i;
/** A path on this site: a leading slash and no spaces. Not "//host", which is a URL. */
const OWN_PATH = /^\/[^\s/][^\s]*$/;

/** The social sharing image is fetched by a crawler that has only the URL, so a path would send it
 *  somewhere that does not exist. Everything else is rendered in a page on this site's own origin,
 *  where a path is exactly right and is how every file in /public is referenced. */
const mustBeAbsolute = (name: ImageName) => name === 'ogImage';

/** Is this somewhere a picture can actually be?
 *
 *  The rule used to be "absolute http address only", for the Open Graph reason above, applied to
 *  every image. That quietly discarded every path this site serves itself, and it did not show,
 *  because the shipped defaults WERE this site's own files: a rejected override fell back to the
 *  very picture it was trying to set. The moment those defaults went empty, so a second site would
 *  not wear this one's face, the founder photograph disappeared from the live site and the
 *  override meant to keep it turned out never to have been read. */
export function isPicture(value: string, name?: ImageName): boolean {
  const v = value.trim();
  if (ABSOLUTE.test(v)) return true;
  return name ? !mustBeAbsolute(name) && OWN_PATH.test(v) : OWN_PATH.test(v);
}

export function resolveImages(overrides?: BrandImageOverrides): Record<ImageName, string> {
  const out = { ...defaultImages };
  const given = overrides?.images;
  if (!given) return out;
  for (const name of Object.keys(defaultImages) as ImageName[]) {
    const v = given[name];
    if (typeof v === 'string' && isPicture(v, name)) out[name] = v.trim();
  }
  return out;
}

// ============= The logo a site has not chosen =============
//
// `resolveImages` falls back to the files in public/, which is right for a favicon and a share
// image: a placeholder is better than nothing and nobody reads a favicon as a claim.
//
// A logo is different. Falling back to this repository's lockup means a site that has not chosen
// one renders Altogether Agile's name in Altogether Agile's colours, in its header and its footer,
// as if that were whose site it is. Standing up a second site made that obvious in about four
// seconds.
//
// So: a site with no logo of its own gets its own name set as a wordmark. It looks unfinished,
// which it is, rather than looking like somebody else's.

export type Logo = { mode: 'image'; src: string } | { mode: 'wordmark'; text: string };

/** A wordmark in two parts, so the second can be set in the accent colour.
 *
 *  The two-tone look is two rules, not a design: set the name in capitals, and put the last word
 *  in the accent colour against the rest in the darkest one. It is the whole of this site's own
 *  lettering, and a site that has a name and a palette already has everything it needs for it,
 *  with no file to commission and none to keep up to date.
 *
 *  Off unless asked for. It is this site's typographic signature, and a second site should look
 *  like itself by default rather than like ours. */
export type Wordmark = { first: string; second: string; gap: boolean; twoTone: boolean };

/** Where a name comes apart.
 *
 *  On the last space, so "Bramble & Fern" keeps "Bramble &" together and accents "Fern". With no
 *  space at all, on the capital letter that starts the second half, which is how a name like
 *  StreamStrategy is read aloud even though it is written as one word.
 *
 *  It gets some names wrong. "McKenzie" comes apart into "Mc" and "Kenzie", and there is no rule
 *  that tells that apart from "StreamStrategy" without knowing the words. That is why this is a
 *  setting somebody turns on once and looks at, rather than something applied to every site. */
export function splitWordmark(text: string): { first: string; second: string; gap: boolean } {
  const name = text.trim().replace(/\s+/g, ' ');
  const space = name.lastIndexOf(' ');
  // `gap` carries the space the split consumed. Without it "Altogether Agile" renders as
  // AltogetherAgile, and "StreamStrategy" would gain a space it never had.
  if (space > 0) return { first: name.slice(0, space), second: name.slice(space + 1), gap: true };

  // A capital that follows a lower-case letter: the join in StreamStrategy, and not the S it
  // starts with. Searched from the end so AltogetherAgileCoaching accents only the last part.
  for (let i = name.length - 1; i > 0; i--) {
    if (/[A-Z]/.test(name[i]) && /[a-z]/.test(name[i - 1])) {
      return { first: name.slice(0, i), second: name.slice(i), gap: false };
    }
  }
  return { first: name, second: '', gap: false };
}

/** The wordmark this site renders where a logo would go, and whether it is set in two colours. */
export function wordmarkOf(overrides: BrandWordmarkOverrides, companyName?: string | null): Wordmark {
  const name = companyName?.trim() ?? '';
  // Stored as a string because the brand column holds strings, which is what the editor writes
  // and what readField gives back. A boolean here would read as empty and silently stay off.
  const twoTone = overrides?.wordmark?.twoTone === 'on';
  const parts = splitWordmark(name);
  // One word and no join means nothing to set in a second colour, so it stays in one.
  return { ...parts, twoTone: twoTone && parts.second.length > 0 };
}

/** What to render where the logo goes. `companyName` is only used when no logo is configured. */
export function logoOf(overrides: BrandImageOverrides, companyName?: string | null): Logo {
  const given = overrides?.images?.logo;
  if (typeof given === 'string' && isPicture(given, 'logo')) {
    return { mode: 'image', src: given.trim() };
  }
  const text = companyName?.trim();
  return text ? { mode: 'wordmark', text } : { mode: 'image', src: defaultImages.logo };
}

/** The same colour, mixed with white, for a card's header band.
 *
 *  Somebody picking a card colour should pick one colour, not two. Asking for the pale version as
 *  well is asking them to do arithmetic to keep a pair in step, and the pair only ever goes out of
 *  step in one direction: somebody changes the strong one and forgets.
 *
 *  Computed rather than CSS color-mix so it works the same everywhere and can be tested. */
export function tint(hex: string, strength = 0.12): string {
  const v = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(v)) return hex;
  const mix = (c: number) => Math.round(c * strength + 255 * (1 - strength));
  const [r, g, b] = [0, 2, 4].map((i) => mix(parseInt(v.slice(i, i + 2), 16)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
