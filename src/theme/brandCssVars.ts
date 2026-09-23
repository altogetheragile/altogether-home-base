import { colors } from '@altogether/ui/tokens';

const cssVarName = (token: string) => `--aa-${token.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

/** A hex colour as the space-separated HSL triplet Tailwind's theme expects.
 *
 *  The theme in index.css is written the shadcn way: `--primary: 24 95% 53%`, wrapped by Tailwind
 *  as `hsl(var(--primary) / <alpha-value>)`. The triplet rather than a colour is what makes
 *  `bg-primary/90` work, and this app uses that in a lot of places, so the brand has to arrive in
 *  that shape or the opacity modifiers break. */
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

/** Brand colours as CSS custom properties (`--aa-deep-teal` and friends), generated from the token
 *  package so the palette is written down once.
 *
 *  Each colour is published twice: as the hex value, for anything styled directly, and as an HSL
 *  triplet (`--aa-orange-hsl`), for the Tailwind theme. index.css carries the same triplets as
 *  static defaults so the first paint is right; these override them, which is what lets the
 *  palette change without a rebuild. brandHslMatchesTokens.test.ts holds the two in step. */
export const brandCssVars = Object.fromEntries(
  Object.entries(colors).flatMap(([k, v]) => [
    [cssVarName(k), v],
    [`${cssVarName(k)}-hsl`, hexToHslTriplet(v)],
  ]),
) as Record<`--aa-${string}`, string>;

/** Put them on :root, not on a wrapper.
 *
 *  A custom property is inherited, so one declared on a div reaches that div's descendants and
 *  nothing else. Every dialog, tooltip and dropdown in this app is a Radix portal rendered to
 *  document.body, which is OUTSIDE that div - so var(--aa-deep-teal) in a modal would resolve to
 *  nothing and the colour would silently disappear.
 *
 *  Measured before changing it: inside the wrapper --aa-deep-teal gave rgb(0, 77, 77); at body
 *  level it gave nothing. On :root it reaches both. */
export function applyBrandCssVars() {
  if (typeof document === 'undefined') return;
  for (const [name, value] of Object.entries(brandCssVars)) {
    document.documentElement.style.setProperty(name, value);
  }
}
