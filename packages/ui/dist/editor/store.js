// src/editor/store.ts
var SETTINGS_ROW = "00000000-0000-0000-0000-000000000001";
var dig = (obj, path) => path.split(".").reduce(
  (at, key) => at && typeof at === "object" ? at[key] : void 0,
  obj
);
function readField(entry, settings) {
  if (entry.store === "brand") {
    const v2 = dig(settings.brand, entry.path ?? "");
    return typeof v2 === "string" ? v2 : "";
  }
  const v = settings[entry.path ?? ""];
  if (entry.type === "switch") return v === false ? "" : v === true ? "on" : "";
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function buildPatch(changes, currentBrand) {
  const patch = {};
  let brand = null;
  for (const { entry, value } of changes) {
    if (entry.store === "brand") {
      brand ?? (brand = JSON.parse(JSON.stringify(currentBrand ?? {})));
      const parts = (entry.path ?? "").split(".");
      let at = brand;
      for (const key of parts.slice(0, -1)) {
        if (typeof at[key] !== "object" || at[key] === null) at[key] = {};
        at = at[key];
      }
      const leaf = parts[parts.length - 1];
      if (value.trim()) at[leaf] = value.trim();
      else delete at[leaf];
    } else if (entry.store === "column") {
      patch[entry.path ?? ""] = entry.type === "switch" ? value === "on" : value.trim() === "" ? null : value.trim();
    }
  }
  if (brand) patch.brand = brand;
  return patch;
}
var registryFor = (registries, page) => registries.find((r) => r.page === page);
async function loadPage(db, registries, page) {
  const registry = registryFor(registries, page);
  if (!registry) return [];
  let saved = {};
  const undo = {};
  let settings = {};
  const needsSettings = Object.values(registry.entries).some((e) => e.store && e.store !== "copy");
  try {
    if (needsSettings) {
      const { data } = await db.from("site_settings").select("*").limit(1).maybeSingle();
      settings = data ?? {};
    }
    const [current, history] = await Promise.all([
      db.from("site_copy").select("key, value").eq("page", page),
      db.from("site_copy_revisions").select("key, value, replaced_at").eq("page", page).order("replaced_at", { ascending: false })
    ]);
    saved = Object.fromEntries((current.data ?? []).map((r) => [r.key, r.value]));
    for (const r of history.data ?? []) {
      if (!(r.key in undo)) undo[r.key] = { value: r.value, at: r.replaced_at };
    }
  } catch {
  }
  const drafts = await loadDrafts(db, page);
  return Object.entries(registry.entries).map(([key, e]) => ({
    key,
    label: e.label,
    hint: e.hint,
    // A settings field never set shows the shipped value, so a colour box shows the colour in use
    // rather than black, and "Original" has somewhere to go back to.
    value: e.store && e.store !== "copy" ? readField(e, settings) || e.value : saved[key] ?? e.value,
    shipped: e.value,
    ...e.type ? { type: e.type } : {},
    ...e.fields ? { fields: e.fields } : {},
    ...e.says ? { says: e.says } : {},
    ...e.group ? { group: e.group } : {},
    ...e.options ? { options: e.options } : {},
    ...undo[key] ? { undo: undo[key] } : {},
    ...drafts[key] ? { draft: drafts[key] } : {}
  }));
}
async function savePage(db, registries, page, changes, userId) {
  const registry = registryFor(registries, page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };
  const unknown = Object.keys(changes).filter((k) => !(k in registry.entries));
  if (unknown.length) return { ok: false, error: `Not part of this page: ${unknown.join(", ")}` };
  const settingsChanges = Object.entries(changes).map(([key, value]) => ({ key, value, entry: registry.entries[key] })).filter((c) => c.entry.store && c.entry.store !== "copy");
  if (settingsChanges.length) {
    const { data: before2 } = await db.from("site_settings").select("*").limit(1).maybeSingle();
    const current2 = before2 ?? {};
    const { error: error2 } = await db.from("site_settings").update(buildPatch(settingsChanges, current2.brand)).eq("id", SETTINGS_ROW);
    if (error2) return { ok: false, error: error2.message };
    const rows2 = settingsChanges.map((c) => ({ key: c.key, page, value: readField(c.entry, current2), replaced_by: userId })).filter((r, i) => r.value !== settingsChanges[i].value);
    if (rows2.length) await db.from("site_copy_revisions").insert(rows2);
  }
  const keys = Object.keys(changes).filter((k) => {
    const e = registry.entries[k];
    return !e.store || e.store === "copy";
  });
  if (!keys.length) return { ok: true };
  const { data: before } = await db.from("site_copy").select("key, value").in("key", keys);
  const current = Object.fromEntries((before ?? []).map((r) => [r.key, r.value]));
  const rows = keys.map((key) => ({
    page,
    key,
    value: changes[key].trim(),
    label: registry.entries[key].label,
    hint: registry.entries[key].hint,
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_by: userId
  }));
  const tooLong = rows.find((r) => r.value.length > 2e4);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };
  const { error } = await db.from("site_copy").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  const replaced = rows.filter((r) => (current[r.key] ?? registry.entries[r.key].value) !== r.value).map((r) => ({ key: r.key, page, value: current[r.key] ?? registry.entries[r.key].value, replaced_by: userId }));
  if (replaced.length) await db.from("site_copy_revisions").insert(replaced);
  return { ok: true };
}
async function resetField(db, page, key, userId) {
  const { data: before } = await db.from("site_copy").select("value").eq("key", key).maybeSingle();
  const { error } = await db.from("site_copy").delete().eq("page", page).eq("key", key);
  if (error) return { ok: false, error: error.message };
  if (before?.value) {
    await db.from("site_copy_revisions").insert({ key, page, value: before.value, replaced_by: userId });
  }
  return { ok: true };
}
async function undoField(db, registries, page, key, userId) {
  const registry = registryFor(registries, page);
  if (!registry || !(key in registry.entries)) return { ok: false, error: `Not part of this page: ${key}` };
  const { data: last } = await db.from("site_copy_revisions").select("id, value").eq("key", key).order("replaced_at", { ascending: false }).limit(1).maybeSingle();
  if (!last) return { ok: false, error: "There is nothing to undo here." };
  const entry = registry.entries[key];
  if (entry.store && entry.store !== "copy") {
    const { data: before } = await db.from("site_settings").select("brand").limit(1).maybeSingle();
    const { error: error2 } = await db.from("site_settings").update(buildPatch([{ entry, value: last.value }], (before ?? {}).brand)).eq("id", SETTINGS_ROW);
    if (error2) return { ok: false, error: error2.message };
    await db.from("site_copy_revisions").delete().eq("id", last.id);
    return { ok: true };
  }
  const { error } = await db.from("site_copy").upsert(
    {
      page,
      key,
      value: last.value,
      label: entry.label,
      hint: entry.hint,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_by: userId
    },
    { onConflict: "key" }
  );
  if (error) return { ok: false, error: error.message };
  await db.from("site_copy_revisions").delete().eq("id", last.id);
  return { ok: true };
}
async function loadDrafts(db, page) {
  try {
    const { data } = await db.from("site_copy_drafts").select("key, value, updated_at").eq("page", page);
    return Object.fromEntries(
      (data ?? []).map((r) => [r.key, { value: r.value, at: r.updated_at }])
    );
  } catch {
    return {};
  }
}
async function saveDraft(db, registries, page, changes, userId) {
  const registry = registryFor(registries, page);
  if (!registry) return { ok: false, error: `There is no page called "${page}".` };
  const unknown = Object.keys(changes).filter((k) => !(k in registry.entries));
  if (unknown.length) return { ok: false, error: `Not part of this page: ${unknown.join(", ")}` };
  const rows = Object.entries(changes).map(([key, value]) => ({
    key,
    page,
    value: value.trim(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_by: userId
  }));
  if (!rows.length) return { ok: true };
  const tooLong = rows.find((r) => r.value.length > 2e4);
  if (tooLong) return { ok: false, error: `"${registry.entries[tooLong.key].label}" is longer than a page should carry.` };
  const { error } = await db.from("site_copy_drafts").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
async function publishDrafts(db, registries, page, userId) {
  const drafts = await loadDrafts(db, page);
  const keys = Object.keys(drafts);
  if (!keys.length) return { ok: false, error: "There is nothing waiting to be published here." };
  const result = await savePage(
    db,
    registries,
    page,
    Object.fromEntries(keys.map((k) => [k, drafts[k].value])),
    userId
  );
  if (!result.ok) return result;
  const { error } = await db.from("site_copy_drafts").delete().eq("page", page).in("key", keys);
  if (error) return { ok: false, error: `Published, but the drafts did not clear: ${error.message}` };
  return { ok: true };
}
async function discardDrafts(db, page, key) {
  const query = db.from("site_copy_drafts").delete().eq("page", page);
  const { error } = await (key ? query.eq("key", key) : query);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { buildPatch, discardDrafts, loadDrafts, loadPage, publishDrafts, readField, resetField, saveDraft, savePage, undoField };
