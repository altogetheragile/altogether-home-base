// src/tokens.ts
var colors = {
  white: "#FFFFFF",
  skyTeal: "#F0FAFA",
  paleTeal: "#D9F2F2",
  lightTeal: "#B2DFDF",
  midTeal: "#007A7A",
  deepTeal: "#004D4D",
  /** A teal between mid and deep used for hero/strip backgrounds. */
  heroTeal: "#006666",
  orange: "#FF9715",
  orangeHover: "#E6870E",
  body: "#374151",
  muted: "#6B7280",
  danger: "#DC2626"
};
var fonts = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  /** The Vite App's historical body font. */
  ui: "'Segoe UI', system-ui, sans-serif"
};
var radii = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  pill: 9999
};
var space = (n) => n * 4;
var fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800
};
var tokens = { colors, fonts, radii, fontWeights, space };

export { colors, fontWeights, fonts, radii, space, tokens };
