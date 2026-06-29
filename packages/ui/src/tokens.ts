/**
 * Altogether Agile brand tokens — the single source of truth for colour, type,
 * radius and spacing across both surfaces (the Next.js Site and the Vite App) and
 * the source the Claude Design sync consumes.
 */

export const colors = {
  white: '#FFFFFF',
  skyTeal: '#F0FAFA',
  paleTeal: '#D9F2F2',
  lightTeal: '#B2DFDF',
  midTeal: '#007A7A',
  deepTeal: '#004D4D',
  /** A teal between mid and deep used for hero/strip backgrounds. */
  heroTeal: '#006666',
  orange: '#FF9715',
  orangeHover: '#E6870E',
  body: '#374151',
  muted: '#6B7280',
  danger: '#DC2626',
} as const;

export const fonts = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  /** The Vite App's historical body font. */
  ui: "'Segoe UI', system-ui, sans-serif",
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  pill: 9999,
} as const;

/** 4px base spacing scale. `space(4)` = 16px. */
export const space = (n: number): number => n * 4;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

export type ColorToken = keyof typeof colors;

/** All tokens under one namespace, handy for spreading into a theme object. */
export const tokens = { colors, fonts, radii, fontWeights, space } as const;
