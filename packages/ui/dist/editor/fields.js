// src/brand.ts
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

// src/editor/fields.ts
var lines = (text) => text.split("\n");
var list = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);
function items(text, required = []) {
  if (!text?.trim()) return [];
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (row) => !!row && typeof row === "object" && !Array.isArray(row) && required.every((f) => typeof row[f] === "string" && row[f].trim())
  );
}

export { items, lines, list, picture };
