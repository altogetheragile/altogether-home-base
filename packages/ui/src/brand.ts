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

export type ImageName = 'logo' | 'favicon' | 'ogImage';

/** The files this repository ships. A site that sets nothing gets these. */
export const defaultImages: Record<ImageName, string> = {
  logo: '/brand/lockup-horizontal-tight.svg',
  favicon: '/favicon.svg',
  ogImage: '/og-image.png',
};

export type BrandImageOverrides = { images?: Partial<Record<string, unknown>> | null } | null | undefined;

/** Only absolute http(s) URLs are accepted. An uploaded file has one; a relative path would be
 *  resolved against whichever site is rendering, which for an Open Graph image means a crawler
 *  fetching a path that does not exist. */
export function resolveImages(overrides?: BrandImageOverrides): Record<ImageName, string> {
  const out = { ...defaultImages };
  const given = overrides?.images;
  if (!given) return out;
  for (const name of Object.keys(defaultImages) as ImageName[]) {
    const v = given[name];
    if (typeof v === 'string' && /^https?:\/\/\S+$/i.test(v.trim())) out[name] = v.trim();
  }
  return out;
}
