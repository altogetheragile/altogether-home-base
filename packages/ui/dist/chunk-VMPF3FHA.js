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

export { items, lines, list };
