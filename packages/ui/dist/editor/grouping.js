// src/editor/grouping.ts
var UNGROUPED = "This page";
var NICER = {
  meta: "Search and sharing",
  cta: "Call to action",
  kb: "Knowledge base",
  faq: "Questions people ask",
  why: "Why it works",
  seo: "Search and sharing"
};
var humanise = (segment) => NICER[segment] ?? segment.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
function groupOf(field) {
  if (field.group?.trim()) return field.group.trim();
  const parts = field.key.split(".");
  return parts.length >= 3 ? humanise(parts[1]) : UNGROUPED;
}
function groupFields(fields) {
  const out = [];
  const at = /* @__PURE__ */ new Map();
  for (const field of fields) {
    const name = groupOf(field);
    let group = at.get(name);
    if (!group) {
      group = { name, fields: [] };
      at.set(name, group);
      out.push(group);
    }
    group.fields.push(field);
  }
  return out.length > 1 ? out : [];
}
function matches(field, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [field.label, field.hint, field.key].some((s) => s?.toLowerCase().includes(q));
}
function filterGroups(groups, query) {
  if (!query.trim()) return groups;
  return groups.map((g) => ({ name: g.name, fields: g.fields.filter((f) => matches(f, query)) })).filter((g) => g.fields.length > 0);
}

export { UNGROUPED, filterGroups, groupFields, groupOf, matches };
