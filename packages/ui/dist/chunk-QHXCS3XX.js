import { colors } from './chunk-63HQX2YB.js';

// src/brand.ts
var HEX = /^#[0-9a-fA-F]{6}$/;
function resolveColors(overrides) {
  const out = { ...colors };
  const given = overrides?.colors;
  if (!given) return out;
  for (const name of Object.keys(colors)) {
    const v = given[name];
    if (typeof v === "string" && HEX.test(v.trim())) out[name] = v.trim().toUpperCase();
  }
  return out;
}
function hexToHslTriplet(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = (g - b) / d % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const round = (n) => String(Math.round(n * 10) / 10);
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}
var cssVarName = (token) => `--aa-${token.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
function cssVarsFor(palette) {
  return Object.fromEntries(
    Object.entries(palette).flatMap(([k, v]) => [
      [cssVarName(k), v],
      [`${cssVarName(k)}-hsl`, hexToHslTriplet(v)]
    ])
  );
}
var defaultImages = {
  logo: "/brand/lockup-horizontal-tight.svg",
  favicon: "/favicon.svg",
  ogImage: "/og-image.png"
};
function resolveImages(overrides) {
  const out = { ...defaultImages };
  const given = overrides?.images;
  if (!given) return out;
  for (const name of Object.keys(defaultImages)) {
    const v = given[name];
    if (typeof v === "string" && /^https?:\/\/\S+$/i.test(v.trim())) out[name] = v.trim();
  }
  return out;
}

export { cssVarName, cssVarsFor, defaultImages, hexToHslTriplet, resolveColors, resolveImages };
