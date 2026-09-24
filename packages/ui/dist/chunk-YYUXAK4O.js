import { PictureBox } from './chunk-EMPC6OPA.js';
import { IconPicker } from './chunk-BLD3MESD.js';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { jsxs, jsx } from 'react/jsx-runtime';

function parse(value) {
  if (!value.trim()) return [];
  try {
    const out = JSON.parse(value);
    return Array.isArray(out) ? out.filter((r) => r && typeof r === "object" && !Array.isArray(r)) : [];
  } catch {
    return [];
  }
}
var emptyRequired = (row, fields) => fields.filter((f) => f.required && !(row[f.key] ?? "").trim()).map((f) => f.label);
var readable = (names) => names.length <= 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
function ItemRows({
  value,
  fields,
  onChange,
  upload
}) {
  const rows = parse(value);
  const missing = (row) => emptyRequired(row, fields);
  const write = (next) => onChange(next.length ? JSON.stringify(next, null, 2) : "");
  const set = (i, key, v) => write(rows.map((r, n) => n === i ? { ...r, [key]: v } : r));
  const remove = (i) => write(rows.filter((_, n) => n !== i));
  const add = () => write([...rows, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const move = (i, by) => {
    const to = i + by;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[i], next[to]] = [next[to], next[i]];
    write(next);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    rows.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-2.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: i + 1 }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => move(i, -1),
              disabled: i === 0,
              "aria-label": `Move ${i + 1} up`,
              className: "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30",
              children: /* @__PURE__ */ jsx(ChevronUp, { size: 13 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => move(i, 1),
              disabled: i === rows.length - 1,
              "aria-label": `Move ${i + 1} down`,
              className: "rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30",
              children: /* @__PURE__ */ jsx(ChevronDown, { size: 13 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => remove(i),
              "aria-label": `Remove ${i + 1}`,
              className: "rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive",
              children: /* @__PURE__ */ jsx(Trash2, { size: 13 })
            }
          )
        ] })
      ] }),
      missing(row).length > 0 && /* @__PURE__ */ jsxs("p", { className: "mb-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900", children: [
        "This one will not appear on the page until ",
        readable(missing(row)),
        " ",
        missing(row).length === 1 ? "is" : "are",
        " filled in."
      ] }),
      fields.map((f) => /* @__PURE__ */ jsxs("label", { className: "mb-1.5 block last:mb-0", children: [
        /* @__PURE__ */ jsxs("span", { className: "mb-0.5 block text-xs text-muted-foreground", children: [
          f.label,
          f.required && /* @__PURE__ */ jsx("span", { className: "ml-1 text-amber-600", title: "The page needs this", children: "needed" })
        ] }),
        f.type === "image" ? /* @__PURE__ */ jsx(PictureBox, { value: row[f.key] ?? "", onChange: (v) => set(i, f.key, v), upload }) : f.type === "icon" ? /* @__PURE__ */ jsx(IconPicker, { value: row[f.key] ?? "", onChange: (v) => set(i, f.key, v) }) : f.type === "textarea" ? /* @__PURE__ */ jsx(
          "textarea",
          {
            value: row[f.key] ?? "",
            placeholder: f.placeholder,
            rows: Math.min(7, Math.max(2, Math.ceil((row[f.key] ?? "").length / 48))),
            onChange: (e) => set(i, f.key, e.target.value),
            className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          }
        ) : /* @__PURE__ */ jsx(
          "input",
          {
            value: row[f.key] ?? "",
            placeholder: f.placeholder,
            onChange: (e) => set(i, f.key, e.target.value),
            className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          }
        )
      ] }, f.key))
    ] }, i)),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: add,
        className: "flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground",
        children: [
          /* @__PURE__ */ jsx(Plus, { size: 13 }),
          " Add"
        ]
      }
    )
  ] });
}

export { ItemRows };
