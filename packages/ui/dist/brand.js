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
function picture(text) {
  if (!text?.trim()) return null;
  try {
    const p = JSON.parse(text);
    if (p && typeof p === "object" && typeof p.src === "string" && p.src.trim()) {
      return { src: p.src.trim(), alt: typeof p.alt === "string" ? p.alt : "" };
    }
  } catch {
    if (/^(https?:\/\/|\/)\S+$/.test(text.trim())) return { src: text.trim(), alt: "" };
  }
  return null;
}
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
    const src = typeof v === "string" ? picture(v)?.src : void 0;
    if (src && isPicture(src, name)) out[name] = src;
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
  const src = typeof given === "string" ? picture(given)?.src : void 0;
  if (src && isPicture(src, "logo")) {
    return { mode: "image", src };
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
var TYPEFACES = [
  {
    id: "dm-serif",
    label: "DM Serif Display",
    note: "Warm and editorial. Good for headings, heavy going for paragraphs.",
    stack: "'DM Serif Display', Georgia, serif"
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    note: "Plain and modern. Reads well at any size.",
    stack: "'DM Sans', system-ui, sans-serif"
  },
  {
    id: "georgia",
    label: "Georgia",
    note: "A classic serif, already on nearly every device. Steady and unshowy.",
    stack: "Georgia, 'Times New Roman', serif"
  },
  {
    id: "system",
    label: "The reader\u2019s own",
    note: "Whatever their device uses. The fastest to load and the least distinctive.",
    stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  }
];
var DEFAULT_TYPEFACES = { heading: "dm-serif", body: "dm-sans" };
var faceById = (id) => typeof id === "string" ? TYPEFACES.find((f) => f.id === id.trim()) : void 0;
function resolveFonts(overrides) {
  const given = overrides?.fonts;
  return {
    heading: (faceById(given?.heading) ?? faceById(DEFAULT_TYPEFACES.heading)).stack,
    body: (faceById(given?.body) ?? faceById(DEFAULT_TYPEFACES.body)).stack
  };
}
function fontVarsFor(overrides) {
  const { heading, body } = resolveFonts(overrides);
  return { "--aa-font-heading": heading, "--aa-font-body": body };
}

export { DEFAULT_TYPEFACES, TYPEFACES, cssVarName, cssVarsFor, defaultImages, fontVarsFor, hexToHslTriplet, isPicture, logoOf, picture, resolveColors, resolveFonts, resolveImages, splitWordmark, tint, wordmarkOf };
