import { picture } from './chunk-JOXPSQS6.js';
import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { jsxs, jsx } from 'react/jsx-runtime';

var MAX_BYTES = 4 * 1024 * 1024;
function PictureBox({
  value,
  onChange,
  upload: putFile
}) {
  const current = picture(value);
  const file = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const write = (src, alt) => onChange(src ? JSON.stringify({ src, alt }) : "");
  const upload = async (f) => {
    setError(null);
    if (f.size > MAX_BYTES) {
      setError(`That is ${(f.size / 1024 / 1024).toFixed(1)}MB. Images need to be under 4MB, or the page will crawl.`);
      return;
    }
    setBusy(true);
    try {
      write(await putFile(f), current?.alt ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That upload did not work.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/40", children: current ? /* @__PURE__ */ jsx("img", { src: current.src, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "No picture" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => file.current?.click(),
              disabled: busy,
              className: "flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50",
              children: [
                busy ? /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx(Upload, { size: 12 }),
                current ? "Replace" : "Upload"
              ]
            }
          ),
          current && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => write("", ""),
              className: "flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-destructive",
              children: [
                /* @__PURE__ */ jsx(X, { size: 12 }),
                " Remove"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: current?.src ?? "",
            placeholder: "or paste a web address",
            onChange: (e) => write(e.target.value.trim(), current?.alt ?? ""),
            className: "w-full rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
          }
        )
      ] })
    ] }),
    current && /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "mb-0.5 block text-xs text-muted-foreground", children: "Describe the picture, for people who cannot see it" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          value: current.alt,
          placeholder: "Two people talking across a table",
          onChange: (e) => write(current.src, e.target.value),
          className: "w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: error }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: file,
        type: "file",
        accept: "image/*",
        hidden: true,
        onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }
      }
    )
  ] });
}

export { PictureBox };
