# Admin UI Audit & Consolidation Plan

Method: read-only audit of all ~30 `/admin/*` sections (2026-07-01), classified
keep / fix / redundant / dead against whether their data is still consumed by the
live site (Next app or SPA). The public marketing pages moved to the Next app in
the strangler-fig migration; admin sections that edit data the live site still
reads are KEEP even though rendering moved.

## Headline

The admin isn't rotten — it's **sprawled and duplicated**. Most sections are
legitimate data managers. The "mess" is three things:
1. **Post-migration dead weight** — subsystems the migration hollowed out but
   nobody removed (`/admin/pages`, two of the System Logs tabs).
2. **Copy-paste duplication** — six near-identical taxonomy editors; three editors
   of the same `event_templates` table; duplicate routes to one component.
3. **Systemic UX drift** — no shared table, two toast systems, hardcoded colours,
   inconsistent delete dialogs, label mismatches.

Retiring the dead weight + collapsing duplicates removes ~8 nav/route entries and
6 page files with near-zero risk.

---

## Tier 1 — Retire (dead weight; high clarity, low risk)

| Item | Why | Effort |
|---|---|---|
| **`/admin/pages` (CMS Pages)** | DEAD. 4 of 7 pages shadowed by Next; the UI is gutted to a single non-functional "Home Page Configuration" card whose "View" link opens the *Next* home. Editing it changes nothing live. | S — remove route + nav; keep `DynamicPageRenderer`/`PageEditor` only if `features`/`beta` CMS pages are still wanted (confirm). |
| **System Logs → Database & Auth tabs** (+ `AdminLogsDatabaseRoute`, `AdminLogsAuthRoute`, and the duplicate `AdminLogsApplicationRoute` wrappers) | DEAD. They query `public.postgres_logs` / `public.auth_logs` — ordinary app tables nothing writes to → permanently "No logs." Real logs now live in Sentry + Supabase's dashboard. All three route wrappers render the same component anyway. | S — delete the two tabs + wrapper files. |
| **`/admin/event-blueprints` (Blueprints)** | REDUNDANT. A second, weaker editor of the same `event_templates` table Courses owns; carries a "being replaced" banner; **deletes rows with no confirmation** (dangerous — those rows *are* courses). | S — delete route + nav; fold any unique field into Courses. |
| **`/admin/moderation`** | ~~Orphaned (not in nav), "view in context" link is broken post-migration~~ — ✅ **KEPT & FIXED** (PR #12): KB comment-reporting is live, so it was surfaced in the nav (Community group) and the "view in context" link repointed to the real KB item pages. | Done. |

## Tier 2 — Foot-guns / safety (fix or remove regardless)

| Risk | Location | Action |
|---|---|---|
| Unguarded delete of `event_templates` (= a course) with no confirm | AdminEventBlueprints | Resolved by retiring it (Tier 1). |
| System Logs "Clear" button **hard-deletes all `admin_logs`** — wipes the audit-trail source | AdminLogs.tsx:224 | Remove the button (or gate + confirm) when consolidating logs. |
| `show_admin_routes` toggle can switch off the admin section you're in (self-lockout) | AdminSettings + routes.tsx | Guard: never let an admin disable admin routes for themselves, or remove the toggle. |
| Contacts delete depends on an admin DELETE RLS policy | AdminContacts | **Already applied this session** — verify once, then it's fine. |

## Tier 3 — Consolidate redundancy (structural, medium effort)

| Item | Why | Effort |
|---|---|---|
| **Six taxonomy editors → one `TaxonomyManager`** (Categories, Types, Levels, Formats, Certification Bodies, Locations) | Near-identical single-field CRUD clones (same hook-trio + Card>Table + SimpleForm). Collapse to one config-driven component + a registry. Biggest single win; also fixes their inconsistent delete affordances in one place. | M |
| **Decouple Site Settings ↔ CMS `pages`** | `useSiteSettings.ts:79-123` silently writes `is_published`/`show_in_main_menu` on `pages` rows when you flip `show_blog`/`show_events`/`show_knowledge` — a "why did my page disappear?" trap and dual source of truth. Once `/admin/pages` is retired (Tier 1), this write-through can largely be deleted. | S–M |
| **Merge Audit Logs + System-Logs "Application" tab** | Both read admin-action rows. Make one "Admin Activity / Audit" screen and promote it out of the (mostly dead) System Logs tree. | S–M |
| **Move testimonial-display toggles into Settings** | AdminFeedback also writes `site_settings` (display toggles) — an admin looks for that in Settings, not Feedback. | M |
| **Collapse duplicate routes** | `AdminAssets` mounted at `/admin/assets` + `/admin/knowledge/templates` + orphan `/admin/media` (`AdminMedia`); `AdminKnowledgeImport` at both `/import` and `/imports`; plus a placeholder `/admin/imports`. One entry point each. | S |

## Tier 4 — UX consistency sweep (makes it feel coherent)

- **Shared admin `DataTable`** — ✅ **DONE** (PRs #13–#15, 2026-07-02). Built
  `src/components/admin/DataTable.tsx` (config-driven columns + client-side
  sort/search/pagination, loading skeletons, empty state, row-click, optional
  selection with select-all), covered by `DataTable.test.tsx` (10 tests). It is
  a thin wrapper over the shadcn `Table` primitives — no `@tanstack/react-table`
  dependency; each page keeps owning its own data and mutations. Adopted in:
  AdminAuditLogs, AdminExams, AdminInstructors, AdminUsers, AdminContacts,
  FeedbackManagementTable, AdminSEO (Health/Meta/Index), AdminEvents,
  AdminKnowledgeCategories, AdminActivityDomains, AdminTaxonomy,
  KnowledgeItemsTable, CourseDatesTab, EventRegistrationsDialog.
  Tables with server-side search/pagination (AdminUsers, KnowledgeItemsTable)
  use DataTable for rendering/selection only.
  **Intentionally left on raw tables** (DataTable would remove behaviour):
  AdminBlog + AdminCourses (drag-to-reorder via dnd-kit), AdminExamQuestions
  (expandable rows + inline edit), the CSV import mapping tables
  (ColumnMapper/ImportPreview), and AdminSelfPacedCourses.
- **One toast system** — `sonner` (Courses, Contacts) vs shadcn `use-toast` (most). Pick one.
- **Theme tokens, not hardcoded colours** — Training area + AdminSEO hardcode `text-gray-*`/`bg-white`/`text-red-*` (dark-mode hazard). Sweep to `foreground`/`muted-foreground`/`destructive`.
- **Standard destructive dialog** — mix of `AlertDialog`, raw `window.confirm()`, ghost-trash-icon, labelled Delete, and no-confirm. Standardise on `AlertDialog` + downstream-impact warning.
- **Loading / error / empty scaffold** — some sections handle all three, Analytics shows fake zeros on failure, Self-paced has no error handling. Shared wrapper.
- **Safe CSV util** — ✅ **DONE**. Extracted `src/utils/csv.ts` (`toCsv()` with RFC-4180 quoting + formula-injection guard); AdminUsers uses it.
- **Label alignment** — "Users Management"/"Users", "Course Feedback Management"/"Feedback", "Question Bank"/"Exams", "Comment Moderation"/"Moderation". Align headers to nav labels.
- **Dashboard quick-links** — point to dead/placeholder destinations (`/knowledge`, Import placeholder, Moderation). Fix or drop.
- **Nav prune** — Events submenu self-duplicates "Events"; Feedback mis-grouped under Community; Backlog dev tool under Operations.

## Also flagged (verge of dead — confirm intent)

- **`/admin/self-paced-courses`** — read-only list, no create/edit/delete, no link to any editor. Either wire it to a real manager or remove.
- **`/admin/imports`** (`AdminImports`) — a ~3-line placeholder promoted from the Dashboard.

## Recommended sequence

1. **Tier 1 retirements** (safe deletions) — instantly shrinks the surface and removes traps. Start here.
2. **Tier 2 foot-guns** — the dangerous clear/delete/lockout paths.
3. **Tier 3 consolidation** — TaxonomyManager + Settings decouple + logs merge.
4. **Tier 4 UX sweep** — shared DataTable, toast, tokens, dialogs (biggest polish, largest effort).

Decisions needed before removing: (a) are the `features`/`beta` CMS pages still
wanted? (b) is KB comment-reporting (Moderation) live? (c) keep or drop
Self-paced Courses and the Import placeholder?
