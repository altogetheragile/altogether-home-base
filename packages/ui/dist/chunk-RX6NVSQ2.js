import { ItemRows } from './chunk-7ZDCJ4HW.js';
import { PictureBox } from './chunk-EMPC6OPA.js';
import { SectionOrder } from './chunk-7W7E3UZ3.js';
import { SECTIONS_FOR_PAGE } from './chunk-6VYT3VGP.js';
import { ColourBox } from './chunk-M5XDZR2B.js';
import { IconPicker } from './chunk-BLD3MESD.js';
import { jsx, jsxs } from 'react/jsx-runtime';

function FieldControl({
  field,
  value,
  page,
  onChange,
  upload
}) {
  const set = (next) => onChange(next);
  if (field.type === "sections") {
    return /* @__PURE__ */ jsx(SectionOrder, { value, choices: SECTIONS_FOR_PAGE[page] ?? [], onChange: set });
  }
  if (field.type === "items" && field.fields) {
    return /* @__PURE__ */ jsx(ItemRows, { value, fields: field.fields, onChange: set, upload });
  }
  if (field.type === "image") {
    return /* @__PURE__ */ jsx(PictureBox, { value, onChange: set, upload });
  }
  if (field.type === "icon") {
    return /* @__PURE__ */ jsx(IconPicker, { value, onChange: set });
  }
  if (field.type === "colour") {
    return /* @__PURE__ */ jsx(ColourBox, { value, onChange: set });
  }
  if (field.type === "switch") {
    return /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "checkbox",
          checked: value === "on",
          onChange: (e) => set(e.target.checked ? "on" : ""),
          className: "h-4 w-4 rounded border-border"
        }
      ),
      /* @__PURE__ */ jsx("span", { className: value === "on" || field.says ? "" : "font-medium text-amber-700", children: value === "on" ? field.says?.on ?? "Visible to everyone" : field.says?.off ?? "Hidden from visitors" })
    ] });
  }
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      id: field.key,
      rows: rowsFor(field, value),
      value,
      onChange: (e) => set(e.target.value),
      className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    }
  );
}
function rowsFor(field, value) {
  if (field.type === "text") return 1;
  return Math.min(12, Math.max(2, Math.ceil((value.length || 1) / 60) + (value.match(/\n/g)?.length ?? 0)));
}

export { FieldControl };
