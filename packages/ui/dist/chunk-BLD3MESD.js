import { ICON_NAMES, ICONS } from './chunk-TWTRORN3.js';
import { useState } from 'react';
import { X } from 'lucide-react';
import { jsxs, jsx } from 'react/jsx-runtime';

function IconPicker({ value, onChange }) {
  const [filter, setFilter] = useState("");
  const shown = filter.trim() ? ICON_NAMES.filter((n) => n.toLowerCase().includes(filter.trim().toLowerCase())) : ICON_NAMES;
  const Chosen = value ? ICONS[value] : null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-muted/40", children: Chosen ? /* @__PURE__ */ jsx(Chosen, { size: 16 }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "none" }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          value: filter,
          placeholder: "Search icons",
          onChange: (e) => setFilter(e.target.value),
          className: "flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
        }
      ),
      value && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => onChange(""),
          "aria-label": "Use no icon",
          className: "rounded border border-border p-1 text-muted-foreground hover:text-destructive",
          children: /* @__PURE__ */ jsx(X, { size: 12 })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid max-h-36 grid-cols-8 gap-1 overflow-y-auto rounded border border-border p-1.5", children: [
      shown.map((name) => {
        const Glyph = ICONS[name];
        return /* @__PURE__ */ jsx(
          "button",
          {
            title: name,
            "aria-label": name,
            "aria-pressed": value === name,
            onClick: () => onChange(name),
            className: `flex aspect-square items-center justify-center rounded hover:bg-muted ${value === name ? "bg-primary/15 text-primary ring-1 ring-primary" : "text-muted-foreground"}`,
            children: /* @__PURE__ */ jsx(Glyph, { size: 15 })
          },
          name
        );
      }),
      shown.length === 0 && /* @__PURE__ */ jsx("p", { className: "col-span-8 py-2 text-center text-xs text-muted-foreground", children: "Nothing matching that." })
    ] })
  ] });
}

export { IconPicker };
