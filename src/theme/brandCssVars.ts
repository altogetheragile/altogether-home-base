import { colors } from '@altogether/ui/tokens';

/** Brand colours as CSS custom properties (`--aa-deep-teal` and friends), generated from the
 *  token package so there is one place the palette is written down.
 *
 *  The Next Site has had this since it was built (`apps/web/src/lib/brand.ts`); the App did not,
 *  so `var(--aa-*)` only resolved inside the one stylesheet that declared its own copy of them.
 *  Spread onto the element that wraps the app, exactly as the Site does. */
export const brandCssVars = Object.fromEntries(
  Object.entries(colors).map(([k, v]) => [`--aa-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`, v]),
) as Record<`--aa-${string}`, string>;
