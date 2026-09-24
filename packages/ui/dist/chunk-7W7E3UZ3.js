import { orderedSections } from './chunk-6VYT3VGP.js';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { jsx, jsxs } from 'react/jsx-runtime';

function SectionOrder({
  value,
  choices,
  onChange
}) {
  const rows = orderedSections(value, choices);
  const label = (key) => choices.find((c) => c.key === key)?.label ?? key;
  const hint = (key) => choices.find((c) => c.key === key)?.hint;
  const write = (next) => onChange(JSON.stringify(next, null, 2));
  const move = (i, by) => {
    const to = i + by;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[i], next[to]] = [next[to], next[i]];
    write(next);
  };
  const toggle = (i) => write(rows.map((r, n) => n === i ? { ...r, visible: !r.visible } : r));
  return /* @__PURE__ */ jsx("div", { className: "divide-y divide-border rounded-md border border-border", children: rows.map((row, i) => /* @__PURE__ */ jsxs("div", { className: `flex items-start gap-2 p-2 ${row.visible ? "" : "bg-muted/40"}`, children: [
    /* @__PURE__ */ jsx(GripVertical, { size: 13, className: "mt-1 shrink-0 text-muted-foreground/50" }),
    /* @__PURE__ */ jsxs("label", { className: "flex-1 cursor-pointer", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: row.visible,
            onChange: () => toggle(i),
            className: "h-3.5 w-3.5 rounded border-border"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: `text-sm ${row.visible ? "font-medium text-foreground" : "text-muted-foreground"}`, children: label(row.section) }),
        !row.visible && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "not shown" })
      ] }),
      hint(row.section) && /* @__PURE__ */ jsx("span", { className: "mt-0.5 block pl-5 text-xs text-muted-foreground", children: hint(row.section) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-col", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => move(i, -1),
          disabled: i === 0,
          "aria-label": `Move ${label(row.section)} up`,
          className: "rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25",
          children: /* @__PURE__ */ jsx(ChevronUp, { size: 13 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => move(i, 1),
          disabled: i === rows.length - 1,
          "aria-label": `Move ${label(row.section)} down`,
          className: "rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25",
          children: /* @__PURE__ */ jsx(ChevronDown, { size: 13 })
        }
      )
    ] })
  ] }, row.section)) });
}

export { SectionOrder };
