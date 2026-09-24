import { SectionOrder } from '../chunk-7W7E3UZ3.js';
import { SECTIONS_FOR_PAGE } from '../chunk-6VYT3VGP.js';
import { ColourBox } from '../chunk-GMS5HY7T.js';
import { ItemRows } from '../chunk-SHDZKI2W.js';
import { PictureBox } from '../chunk-EMPC6OPA.js';
import '../chunk-JOXPSQS6.js';
import { IconPicker } from '../chunk-BLD3MESD.js';
import '../chunk-TWTRORN3.js';
import { useState, useTransition, useEffect } from 'react';
import { Pencil, X, Loader2, Undo2, RotateCcw, Check } from 'lucide-react';
import { jsxs, jsx } from 'react/jsx-runtime';

function describeOrder(value) {
  try {
    const rows = JSON.parse(value || "[]");
    if (!Array.isArray(rows) || rows.length === 0) return "the order the page was built in";
    const hidden = rows.filter((r) => r && r.visible === false).length;
    const first = rows.find((r) => r && r.visible !== false)?.section;
    return `${rows.length} sections${first ? `, starting with ${first}` : ""}${hidden ? `, ${hidden} hidden` : ""}`;
  } catch {
    return "the order the page was built in";
  }
}
function countItems(value) {
  try {
    const out = JSON.parse(value || "[]");
    return Array.isArray(out) ? out.length : 0;
  } catch {
    return 0;
  }
}
function EditDrawer({ host }) {
  const { pathname } = host;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(null);
  const [fields, setFields] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pending, startSaving] = useTransition();
  const pageHere = host.pageForPath(pathname);
  const tabs = [
    ...pageHere ? [{ page: pageHere, label: "This Page" }] : [],
    ...host.alwaysOffered
  ];
  const active = tab ?? tabs[0].page;
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFields(null);
    host.load(active).then((f) => alive && setFields(f));
    return () => {
      alive = false;
    };
  }, [open, active, host]);
  useEffect(() => {
    setOpen(false);
    setTab(null);
  }, [pathname]);
  const draft = drafts[active] ?? {};
  const setField = (key, value) => setDrafts((d) => ({ ...d, [active]: { ...d[active] ?? {}, [key]: value } }));
  const clearDraft = () => setDrafts((d) => ({ ...d, [active]: {} }));
  const changed = Object.keys(draft).length > 0;
  const save = () => {
    setError(null);
    startSaving(() => {
      void (async () => {
        const result = await host.save(active, draft);
        if (!result.ok) return setError(result.error);
        clearDraft();
        setSaved(true);
        setTimeout(() => setSaved(false), 2e3);
        host.refresh();
        setFields(await host.load(active));
      })();
    });
  };
  const undo = (key) => {
    setError(null);
    startSaving(() => {
      void (async () => {
        const result = await host.undo(active, key);
        if (!result.ok) return setError(result.error);
        setDrafts((d) => {
          const { [key]: _dropped, ...rest } = d[active] ?? {};
          return { ...d, [active]: rest };
        });
        host.refresh();
        setFields(await host.load(active));
      })();
    });
  };
  const putBack = (key) => {
    startSaving(() => {
      void (async () => {
        const result = await host.reset(active, key);
        if (!result.ok) return setError(result.error);
        setDrafts((d) => {
          const { [key]: _dropped, ...rest } = d[active] ?? {};
          return { ...d, [active]: rest };
        });
        host.refresh();
        setFields(await host.load(active));
      })();
    });
  };
  if (!open) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen(true),
        className: "fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg transition-transform hover:scale-105",
        children: [
          /* @__PURE__ */ jsx(Pencil, { size: 16 }),
          " Edit This Page"
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("aside", { className: "fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold", children: [
        "Editing ",
        pathname
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => setOpen(false), "aria-label": "Close the editor", className: "rounded p-1 hover:bg-muted", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground", children: "Changes save straight to the live site, and every one of them can be undone." }),
    tabs.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex gap-1 border-b border-border px-3 py-2", children: tabs.map((t) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setTab(t.page),
        className: `rounded-md px-3 py-1.5 text-sm ${active === t.page ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`,
        children: [
          t.label,
          Object.keys(drafts[t.page] ?? {}).length > 0 && /* @__PURE__ */ jsx("span", { className: "ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle", "aria-label": "unsaved changes" })
        ]
      },
      t.page
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4", children: [
      fields === null && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }),
        " Reading this page\u2019s words"
      ] }),
      fields?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "There is nothing editable on this page yet." }),
      fields?.map((f) => {
        const value = draft[f.key] ?? f.value;
        const canRestore = f.shipped.trim() !== "" && f.value !== f.shipped;
        const rows = Math.min(8, Math.max(2, Math.ceil(value.length / 60)));
        return /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-baseline justify-between gap-2", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: f.key, className: "text-sm font-medium text-foreground", children: f.label }),
            f.undo && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => undo(f.key),
                disabled: pending,
                className: "flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground",
                title: `Go back to: ${f.undo.value.slice(0, 120) || "(empty)"}`,
                children: [
                  /* @__PURE__ */ jsx(Undo2, { size: 11 }),
                  " Undo"
                ]
              }
            ),
            canRestore && /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => putBack(f.key),
                disabled: pending,
                className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground",
                title: "Back to the wording this site was built with, in one step",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { size: 11 }),
                  " Original"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mb-1.5 text-xs text-muted-foreground", children: f.hint }),
          f.undo && /* @__PURE__ */ jsxs("p", { className: "mb-1.5 truncate text-xs text-muted-foreground/80", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Was:" }),
            " ",
            f.type === "sections" ? describeOrder(f.undo.value) : f.type === "items" ? `${countItems(f.undo.value)} item${countItems(f.undo.value) === 1 ? "" : "s"}` : f.undo.value.trim() ? `\u201C${f.undo.value.replace(/\n/g, " ").slice(0, 90)}\u201D` : "empty"
          ] }),
          f.type === "sections" ? /* @__PURE__ */ jsx(
            SectionOrder,
            {
              value,
              choices: SECTIONS_FOR_PAGE[active] ?? [],
              onChange: (next) => setField(f.key, next)
            }
          ) : f.type === "items" && f.fields ? /* @__PURE__ */ jsx(ItemRows, { value, fields: f.fields, onChange: (next) => setField(f.key, next), upload: host.upload }) : f.type === "image" ? /* @__PURE__ */ jsx(PictureBox, { value, onChange: (next) => setField(f.key, next), upload: host.upload }) : f.type === "icon" ? /* @__PURE__ */ jsx(IconPicker, { value, onChange: (next) => setField(f.key, next) }) : f.type === "colour" ? /* @__PURE__ */ jsx(ColourBox, { value, onChange: (next) => setField(f.key, next) }) : f.type === "switch" ? /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: value === "on",
                onChange: (e) => setField(f.key, e.target.checked ? "on" : ""),
                className: "h-4 w-4 rounded border-border"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: value === "on" ? "" : "font-medium text-amber-700", children: value === "on" ? "Visible to everyone" : "Hidden from visitors" })
          ] }) : /* @__PURE__ */ jsx(
            "textarea",
            {
              id: f.key,
              rows,
              value,
              onChange: (e) => setField(f.key, e.target.value),
              className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            }
          )
        ] }, f.key);
      })
    ] }),
    /* @__PURE__ */ jsxs("footer", { className: "border-t border-border px-4 py-3", children: [
      error && /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm text-destructive", children: error }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: save,
          disabled: !changed || pending,
          className: "flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40",
          children: [
            pending ? /* @__PURE__ */ jsx(Loader2, { size: 15, className: "animate-spin" }) : saved ? /* @__PURE__ */ jsx(Check, { size: 15 }) : null,
            pending ? "Saving" : saved ? "Saved" : changed ? `Save ${Object.keys(draft).length} change${Object.keys(draft).length === 1 ? "" : "s"}` : "Nothing changed yet"
          ]
        }
      )
    ] })
  ] });
}

export { EditDrawer };
