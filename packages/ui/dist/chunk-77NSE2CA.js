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
  ogImage: "/og-image.png",
  // No default face. These were one person's photograph and portrait, so every site built from
  // this repository showed him wherever a founder appeared. A site that has not uploaded a
  // photograph renders no photograph, and the layout closes up around it.
  founderPhoto: "",
  founderPortrait: ""
};
var ABSOLUTE = /^https?:\/\/\S+$/i;
var OWN_PATH = /^\/[^\s/][^\s]*$/;
var mustBeAbsolute = (name) => name === "ogImage";
function isPicture(value, name) {
  const v = value.trim();
  if (ABSOLUTE.test(v)) return true;
  return name ? !mustBeAbsolute(name) && OWN_PATH.test(v) : OWN_PATH.test(v);
}
function resolveImages(overrides) {
  const out = { ...defaultImages };
  const given = overrides?.images;
  if (!given) return out;
  for (const name of Object.keys(defaultImages)) {
    const v = given[name];
    if (typeof v === "string" && isPicture(v, name)) out[name] = v.trim();
  }
  return out;
}
function splitWordmark(text) {
  const name = text.trim().replace(/\s+/g, " ");
  const space = name.lastIndexOf(" ");
  if (space > 0) return { first: name.slice(0, space), second: name.slice(space + 1), gap: true };
  for (let i = name.length - 1; i > 0; i--) {
    if (/[A-Z]/.test(name[i]) && /[a-z]/.test(name[i - 1])) {
      return { first: name.slice(0, i), second: name.slice(i), gap: false };
    }
  }
  return { first: name, second: "", gap: false };
}
function wordmarkOf(overrides, companyName) {
  const name = companyName?.trim() ?? "";
  const twoTone = overrides?.wordmark?.twoTone === "on";
  const parts = splitWordmark(name);
  return { ...parts, twoTone: twoTone && parts.second.length > 0 };
}
function logoOf(overrides, companyName) {
  const given = overrides?.images?.logo;
  if (typeof given === "string" && isPicture(given, "logo")) {
    return { mode: "image", src: given.trim() };
  }
  const text = companyName?.trim();
  return text ? { mode: "wordmark", text } : { mode: "image", src: defaultImages.logo };
}
function tint(hex, strength = 0.12) {
  const v = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(v)) return hex;
  const mix = (c) => Math.round(c * strength + 255 * (1 - strength));
  const [r, g, b] = [0, 2, 4].map((i) => mix(parseInt(v.slice(i, i + 2), 16)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export { cssVarName, cssVarsFor, defaultImages, hexToHslTriplet, isPicture, logoOf, resolveColors, resolveImages, splitWordmark, tint, wordmarkOf };
