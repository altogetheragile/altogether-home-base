import { groupFields, filterGroups } from '../chunk-UKMXV4ZJ.js';
import { FieldControl } from '../chunk-6PW7SQEO.js';
import '../chunk-M7LVVDUY.js';
import '../chunk-BU4EJGTF.js';
import '../chunk-7W7E3UZ3.js';
import '../chunk-6VYT3VGP.js';
import '../chunk-VMPF3FHA.js';
import '../chunk-L2W3NJKO.js';
import '../chunk-J6O7U55M.js';
import '../chunk-M5XDZR2B.js';
import '../chunk-BLD3MESD.js';
import '../chunk-TWTRORN3.js';
import { useState, useRef, useTransition, useEffect } from 'react';
import { Pencil, X, EyeOff, Eye, Loader2, Search, ChevronDown, Check, Undo2, RotateCcw } from 'lucide-react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

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
  const [open, setOpen] = useState(Boolean(host.openAt));
  const [tab, setTab] = useState(null);
  const [fields, setFields] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState(/* @__PURE__ */ new Set());
  const foldedFor = useRef(null);
  const [pending, startSaving] = useTransition();
  const pageHere = host.pageForPath(pathname);
  const asked = host.openAt && (host.openAt === pageHere || host.alwaysOffered.some((t) => t.page === host.openAt)) ? host.openAt : null;
  const tabs = [
    ...pageHere ? [{ page: pageHere, label: "This Page" }] : [],
    ...host.alwaysOffered
  ];
  const active = tab ?? asked ?? tabs[0].page;
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFields(null);
    host.load(active).then((f) => alive && setFields(f));
    return () => {
      alive = false;
    };
  }, [open, active, host]);
  const arrivedAt = useRef(pathname);
  useEffect(() => {
    if (arrivedAt.current === pathname) return;
    arrivedAt.current = pathname;
    setOpen(false);
    setTab(null);
  }, [pathname]);
  useEffect(() => {
    if (!fields || foldedFor.current === active) return;
    foldedFor.current = active;
    setQuery("");
    const all = groupFields(fields);
    setClosed(all.length > 2 && fields.length > 12 ? new Set(all.slice(1).map((g) => g.name)) : /* @__PURE__ */ new Set());
  }, [fields, active]);
  const draft = drafts[active] ?? {};
  const setField = (key, value) => setDrafts((d) => ({ ...d, [active]: { ...d[active] ?? {}, [key]: value } }));
  const clearDraft = () => setDrafts((d) => ({ ...d, [active]: {} }));
  const changed = Object.keys(draft).length > 0;
  const waiting = (fields ?? []).filter((f) => f.draft);
  const canDraft = Boolean(host.saveDraft);
  const afterWriting = async (result, clearTyping) => {
    if (!result.ok) return setError(result.error);
    if (clearTyping) clearDraft();
    setSaved(true);
    setTimeout(() => setSaved(false), 2e3);
    host.refresh();
    setFields(await host.load(active));
  };
  const groups = groupFields(fields ?? []);
  const shown = filterGroups(groups, query);
  const hits = shown.reduce((n, g) => n + g.fields.length, 0);
  const searchable = (fields?.length ?? 0) > 8;
  const renderField = (f) => {
    const value = draft[f.key] ?? f.value;
    const canRestore = f.shipped.trim() !== "" && f.value !== f.shipped;
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
      f.draft && /* @__PURE__ */ jsxs("p", { className: "mb-1.5 flex items-start gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Draft waiting:" }),
          " ",
          f.type === "sections" ? describeOrder(f.draft.value) : f.type === "items" ? `${countItems(f.draft.value)} item${countItems(f.draft.value) === 1 ? "" : "s"}` : f.draft.value.trim() ? `\u201C${f.draft.value.replace(/\n/g, " ").slice(0, 80)}\u201D` : "empty"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => discard(f.key),
            disabled: pending,
            className: "shrink-0 underline hover:no-underline disabled:opacity-50",
            children: "Discard"
          }
        )
      ] }),
      f.undo && /* @__PURE__ */ jsxs("p", { className: "mb-1.5 truncate text-xs text-muted-foreground/80", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Was:" }),
        " ",
        f.type === "sections" ? describeOrder(f.undo.value) : f.type === "items" ? `${countItems(f.undo.value)} item${countItems(f.undo.value) === 1 ? "" : "s"}` : f.undo.value.trim() ? `\u201C${f.undo.value.replace(/\n/g, " ").slice(0, 90)}\u201D` : "empty"
      ] }),
      /* @__PURE__ */ jsx(
        FieldControl,
        {
          field: f,
          value,
          page: active,
          onChange: (next) => setField(f.key, next),
          upload: host.upload
        }
      )
    ] }, f.key);
  };
  const save = () => {
    setError(null);
    startSaving(() => {
      void (async () => {
        await afterWriting(await host.save(active, draft), true);
      })();
    });
  };
  const saveAsDraft = () => {
    if (!host.saveDraft) return;
    setError(null);
    startSaving(() => {
      void (async () => {
        await afterWriting(await host.saveDraft(active, draft), true);
      })();
    });
  };
  const publish = () => {
    if (!host.publishDrafts) return;
    setError(null);
    startSaving(() => {
      void (async () => {
        await afterWriting(await host.publishDrafts(active), false);
      })();
    });
  };
  const discard = (key) => {
    if (!host.discardDrafts) return;
    setError(null);
    startSaving(() => {
      void (async () => {
        await afterWriting(await host.discardDrafts(active, key), false);
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
    /* @__PURE__ */ jsx("p", { className: "border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground", children: canDraft ? "Saving publishes straight away, and can be undone. Save as draft holds a change back until you publish it." : "Changes save straight to the live site, and every one of them can be undone." }),
    waiting.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border-b border-amber-200 bg-amber-50 px-4 py-2.5", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-xs font-medium text-amber-900", children: [
        waiting.length,
        " ",
        waiting.length === 1 ? "change is" : "changes are",
        " saved as a draft and not on the site yet."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-1.5", children: [
        host.preview && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => host.preview.set(!host.preview.on),
            disabled: pending,
            className: "rounded border border-amber-300 bg-background px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50",
            children: host.preview.on ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(EyeOff, { size: 12, className: "mr-1 inline" }),
              "Stop previewing"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Eye, { size: 12, className: "mr-1 inline" }),
              "Preview them"
            ] })
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: publish,
            disabled: pending,
            className: "rounded bg-amber-900 px-2 py-1 text-xs font-medium text-amber-50 hover:bg-amber-800 disabled:opacity-50",
            children: [
              "Publish ",
              waiting.length === 1 ? "it" : "them"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => discard(),
            disabled: pending,
            className: "rounded border border-amber-300 bg-background px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-50",
            children: "Discard"
          }
        )
      ] })
    ] }),
    host.preview?.on && /* @__PURE__ */ jsx("p", { className: "border-b border-border bg-foreground px-4 py-1.5 text-xs font-medium text-background", children: "You are looking at drafts. Visitors still see the published site." }),
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
      searchable && fields && fields.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { size: 13, className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: `Find among ${fields.length} things you can change`,
              "aria-label": "Find a field",
              className: "w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-7 text-sm"
            }
          ),
          query && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setQuery(""),
              "aria-label": "Clear",
              className: "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground",
              children: /* @__PURE__ */ jsx(X, { size: 12 })
            }
          )
        ] }),
        query && /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-xs text-muted-foreground", children: hits === 0 ? "Nothing here matches that." : `${hits} of ${fields.length}` })
      ] }),
      groups.length === 0 ? fields?.map(renderField) : shown.map((g) => {
        const open2 = query.trim() !== "" || !closed.has(g.name);
        const unsaved = g.fields.some((f) => f.key in draft);
        const offPage = g.fields.length > 0 && g.fields.every((f) => f.notShown);
        return /* @__PURE__ */ jsxs("section", { className: "mb-2 border-b border-border/60 last:border-b-0", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setClosed((c) => {
                const next = new Set(c);
                if (next.has(g.name)) next.delete(g.name);
                else next.add(g.name);
                return next;
              }),
              "aria-expanded": open2,
              className: "flex w-full items-center gap-2 py-2.5 text-left text-sm font-medium text-foreground",
              children: [
                /* @__PURE__ */ jsx(ChevronDown, { size: 13, className: `shrink-0 text-muted-foreground transition-transform ${open2 ? "" : "-rotate-90"}` }),
                /* @__PURE__ */ jsxs("span", { className: "flex-1", children: [
                  g.name,
                  offPage && /* @__PURE__ */ jsx("span", { className: "ml-2 font-normal text-amber-700", children: "not on this page" })
                ] }),
                unsaved && /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-primary", "aria-label": "unsaved changes" }),
                /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs font-normal text-muted-foreground", children: g.fields.length })
              ]
            }
          ),
          open2 && /* @__PURE__ */ jsxs("div", { className: "pb-1 pl-5", children: [
            offPage && /* @__PURE__ */ jsx("p", { className: "mb-3 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-900", children: "This part of the page is switched off, so none of it is showing at the moment. The words are kept, and appear as soon as you switch it back on from the This Site tab." }),
            g.fields.map(renderField)
          ] })
        ] }, g.name);
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
      ),
      canDraft && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: saveAsDraft,
          disabled: !changed || pending,
          className: "mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40",
          children: "Save as draft, do not publish yet"
        }
      ),
      host.setupHref && /* @__PURE__ */ jsx(
        "a",
        {
          href: host.setupHref,
          className: "mt-3 block text-center text-xs text-muted-foreground underline hover:text-foreground",
          children: "What is left to set up on this site"
        }
      )
    ] })
  ] });
}

export { EditDrawer };
