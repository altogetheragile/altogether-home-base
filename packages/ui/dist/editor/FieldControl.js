import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, Loader2, Upload, X, Camera, Video, Presentation, PieChart, BarChart3, Gauge, Settings, Wrench, Puzzle, Layers, Phone, Mail, MapPin, Globe, Building2, Briefcase, Repeat, ClipboardCheck, ListChecks, CheckCircle2, Clock, Calendar, Smile, Heart, HeartHandshake, MessagesSquare, MessageCircle, TrendingUp, Rocket, Sparkles, Lightbulb, Route, Map as Map$1, Compass, Target, Trophy, Medal, Award, Star, BookOpen, GraduationCap, User, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/editor/ItemRows.tsx

// src/brand.ts
function picture(text) {
  if (!text?.trim()) return null;
  try {
    const p = JSON.parse(text);
    if (p && typeof p === "object" && typeof p.src === "string" && p.src.trim()) {
      return { src: p.src.trim(), alt: typeof p.alt === "string" ? p.alt : "" };
    }
  } catch {
    if (/^(https?:\/\/|\/)\S+$/.test(text.trim())) return { src: text.trim(), alt: "" };
  }
  return null;
}
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
var ICONS = {
  Users,
  User,
  GraduationCap,
  BookOpen,
  Star,
  Award,
  Medal,
  Trophy,
  Target,
  Compass,
  Map: Map$1,
  Route,
  Lightbulb,
  Sparkles,
  Rocket,
  TrendingUp,
  MessageCircle,
  MessagesSquare,
  HeartHandshake,
  Heart,
  Smile,
  Calendar,
  Clock,
  CheckCircle2,
  ListChecks,
  ClipboardCheck,
  Repeat,
  Briefcase,
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  Layers,
  Puzzle,
  Wrench,
  Settings,
  Gauge,
  BarChart3,
  PieChart,
  Presentation,
  Video,
  Camera
};
var ICON_NAMES = Object.keys(ICONS);
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
function ColourBox({
  value,
  onChange,
  placeholder
}) {
  const valid = /^#[0-9a-f]{6}$/i.test(value.trim());
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "color",
        "aria-label": "Pick a colour",
        value: valid ? value.trim() : "#000000",
        onChange: (e) => onChange(e.target.value.toUpperCase()),
        title: valid ? value.trim() : placeholder || "No colour set",
        className: `h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5 ${valid ? "" : "opacity-40"}`
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        value,
        placeholder: placeholder || "#000000",
        onChange: (e) => onChange(e.target.value),
        className: "flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      }
    ),
    value.trim() && !valid && /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs text-destructive", children: "needs six digits" })
  ] });
}
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
        f.type === "image" ? /* @__PURE__ */ jsx(PictureBox, { value: row[f.key] ?? "", onChange: (v) => set(i, f.key, v), upload }) : f.type === "icon" ? /* @__PURE__ */ jsx(IconPicker, { value: row[f.key] ?? "", onChange: (v) => set(i, f.key, v) }) : f.type === "colour" ? /* @__PURE__ */ jsx(ColourBox, { value: row[f.key] ?? "", onChange: (v) => set(i, f.key, v), placeholder: f.placeholder }) : f.type === "textarea" ? /* @__PURE__ */ jsx(
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

// src/editor/sections.ts
function orderedSections(stored, declared) {
  const known = new Map(declared.map((d) => [d.key, d]));
  let saved = [];
  if (stored?.trim()) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        saved = parsed.filter((s) => !!s && typeof s === "object" && typeof s.section === "string").filter((s) => known.has(s.section)).map((s) => ({ section: s.section, visible: s.visible !== false }));
      }
    } catch {
    }
  }
  const seen = new Set(saved.map((s) => s.section));
  for (const d of declared) if (!seen.has(d.key)) saved.push({ section: d.key, visible: true });
  return saved;
}
var HOME_SECTIONS = [
  { key: "hero", label: "Hero", hint: "The headline and the two buttons. Hiding this leaves the page starting abruptly." },
  { key: "stats", label: "Statistics bar", hint: "The figures under the hero." },
  { key: "personas", label: "Who is this for", hint: "The cards naming who you work with." },
  { key: "testimonials", label: "Testimonials", hint: "The strip of quotes. Empty until somebody has left one." },
  { key: "courses", label: "Courses", hint: "The carousel of what you teach." },
  { key: "founder", label: "Founder", hint: "The photograph and the words beside it." },
  { key: "knowledge", label: "Knowledge base", hint: "Only appears when the knowledge base is switched on." },
  { key: "cta", label: "Closing call to action", hint: "The orange band at the bottom." }
];
var ABOUT_SECTIONS = [
  { key: "hero", label: "Hero", hint: "The teal band with the heading and the photograph." },
  { key: "story", label: "Story and credentials", hint: "The written story, the qualifications and the badges." },
  { key: "testimonials", label: "Testimonials", hint: "The quotes. Empty until somebody has left one." },
  { key: "mission", label: "Mission", hint: "The centred paragraphs on teal." },
  { key: "philosophy", label: "Philosophy cards", hint: "The two-up cards." },
  { key: "timeline", label: "Timeline", hint: "The dated list of how it unfolded." },
  { key: "cta", label: "Closing call to action", hint: "The band at the bottom." }
];
var SECTIONS_FOR_PAGE = {
  home: HOME_SECTIONS,
  about: ABOUT_SECTIONS
};
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
  if (field.type === "choice") {
    const options = field.options ?? [];
    const chosen = options.find((o) => o.value === value) ?? options[0];
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "select",
        {
          id: field.key,
          value: chosen?.value ?? "",
          onChange: (e) => set(e.target.value),
          className: "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm",
          children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value))
        }
      ),
      chosen?.note && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: chosen.note })
    ] });
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
