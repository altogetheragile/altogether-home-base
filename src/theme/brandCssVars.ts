import { colors } from '@altogether/ui/tokens';

/** Brand colours as CSS custom properties (`--aa-deep-teal` and friends), generated from the token
 *  package so the palette is written down once. */
export const brandCssVars = Object.fromEntries(
  Object.entries(colors).map(([k, v]) => [`--aa-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`, v]),
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
