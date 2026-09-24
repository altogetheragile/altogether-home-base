import { jsxs, jsx } from 'react/jsx-runtime';

// src/editor/ColourBox.tsx
function ColourBox({ value, onChange }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value.trim());
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "color",
        "aria-label": "Pick a colour",
        value: valid ? value.trim() : "#000000",
        onChange: (e) => onChange(e.target.value.toUpperCase()),
        className: "h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        value,
        placeholder: "#000000",
        onChange: (e) => onChange(e.target.value),
        className: "flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      }
    ),
    value.trim() && !valid && /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs text-destructive", children: "needs six digits" })
  ] });
}

export { ColourBox };
