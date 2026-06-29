import { colors } from '@altogether/ui/tokens';

// Re-export the shared design-system tokens so Next code imports brand values from one
// place (`@/lib/brand`), sourced from @altogether/ui — the single source of truth.
export { colors, fonts, radii, fontWeights, space, tokens } from '@altogether/ui/tokens';
export type { ColorToken } from '@altogether/ui/tokens';

/** Brand colours as CSS custom properties (e.g. `--aa-deep-teal`), so any Next page or
 *  CSS can reference `var(--aa-deep-teal)` from the shared palette. Spread onto a root
 *  element's `style`. */
export const brandCssVars = Object.fromEntries(
  Object.entries(colors).map(([k, v]) => [`--aa-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`, v]),
) as Record<`--aa-${string}`, string>;
