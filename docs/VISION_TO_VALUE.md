# Vision to Value: Tool Pipeline Specification

**Version:** 1.4 (12 June 2026). Supersedes 1.2 and the unversioned build log.
This is the as-built record: Increments 1 to 3 and sections 6.12 to 6.14 are
live. Remaining gaps and the one external blocker are listed explicitly.
**Audience:** Claude Code, working in `altogetheragile/altogether-home-base`
**Status:** Built and live. Read alongside `TOOLS.md`, which stays the tool
inventory of record.

---

## 0. Status at a Glance

| Increment / feature | State |
|---|---|
| 1: The thread of value | DONE and live |
| 2: The coach | DONE and live |
| 3: Value actualisation and the studio | DONE and live |
| 6.12 Journey Map Studio | DONE and live |
| 6.13 Story Map view | DONE and live |
| 6.14 Prioritisation Schemes | DONE and live (migration applied) |
| Canvas Picker Knowledge Base grounding | DONE and live |
| Per-cell coach grounding | DONE (mechanism live; ladders seeded per tool) |
| Multiple product backlogs per project | DONE and live (migration applied; e2e verified) |

**Outstanding:** none of the original scope. Every spec item is built and every
coached tool's question ladders are seeded. The only optional extra left is adding
RICE as a fourth prioritisation scheme.

Everything in sections 1 to 12 is built and live, including Suggest a Path
(section 6.9a), Modelling Canvas promote-to (section 6.5) and per-cell coach
grounding (section 5.2).

---

## 1. Purpose and Positioning

Turn the separate AI Tools Hub tools into one pipeline that walks a person from
idea to value actualisation, structured on ISA-O3 and delivered as coaching.

Two principles govern every design decision:

1. **The artifact is the container; the coaching conversation is how it fills.**
   The AI asks open questions, follows the answers, then offers one gentle stretch
   question per cell. It never writes content first. It reflects the person's own
   words back as a draft the person edits. The output is always in the user's
   voice.
2. **The journey is the cascade down and the learning returning up.** Intent,
   Scope and Approach flow down; Operate, Outputs and Outcomes return evidence up.
   The right-hand side (probes, indicators, benefits) is what no competitor tool
   offers and must not be cut from scope.

Do not use the word "aporetic" anywhere user-facing. The stretch questions are
presented as coaching. Tone: open, curious, unhurried. Never "CHALLENGE" as a
label in these tools.

## 2. The Stage Model

| Stage | Question the coach holds | Primary artifacts |
|---|---|---|
| Intent | Why does this matter, who does it serve, what would be different? | Coaching Studio, Impact Map (goal, actors), canvas catalogue (vision side), Persona Studio |
| Scope | What value, whose needs, which options, what timeframe? | Impact Map (impacts, deliverables), Persona Studio, Journey Map Studio, User Story Canvas, Product Backlog, canvas catalogue (economics) |
| Approach | How will we organise, assure quality, schedule? | Modelling Canvas (artifact brainstorm) |
| Operate | How are we working, and what one thing would most improve us? | Retro Coach and Ways of Working |
| Outputs | Which output options are we testing, and what would kill each? | Probe Tracker |
| Outcomes and Value | The numbers moved; did anything actually change? | Benefits Scorecard |

Stage names follow ISA-O3 exactly. Operate is about how the team works, not merely
whether the solution runs: working agreements, retrospection, improvement.

A **journey lives in the existing Projects container**, but the word "project"
must not be assumed. `kind` ('project' | 'product' | 'team') is on `projects`; UI
copy keys off it. The neutral word in shared copy is "initiative".

Entry at any stage is allowed. When a user starts mid-journey (for example,
straight into the Backlog), the coach asks exactly one upstream question and
stores the answer as the project's `intent_statement`. Never force a user back to
the start.

### 2.1 The Canonical New-Product Flow

The flow the journey view should teach for a new product, in order: Product Vision
canvas, then a full Impact Map (goal, actors, impacts, deliverables), then Personas
for the primary actors, then a Journey Map per primary persona, then a deliberate
revisit of the Product Vision and Impact Map (the journey almost always sends you
back: a missing actor, an impact that dissolves on contact with reality), then a
Story Map whose backbone comes from the journey stages with the Impact Map Whats as
the cards, and finally a sliced release into the Backlog. Edit-in-place is the
norm: the same artifacts evolve; versions do not multiply. The coach prompts the
re-walks.

## 3. Verified Codebase Inventory (built on)

- `project_artifacts` table: `id`, `project_id`, `name`, `artifact_type`, `data`
  (JSON), `created_at`, `created_by`. `src/pages/ArtifactViewer.tsx` switches on
  `artifact_type`: `bmc`, `project-model`, `product-backlog`, `canvas`,
  `user_story`, `impact-map`, `persona`, `business-case`, `product-vision`,
  `probe-tracker`, `benefits-scorecard`, `coaching-session`, `ways-of-working`,
  `journey-map`.
- `backlog_items` is a relational table with `parent_item_id`, `product_id`,
  `project_id`, `fk_backlog_items_user_story`, `title`, `description`,
  `acceptance_criteria[]`, `priority`, `priority_data` (jsonb, scheme scores),
  `user_persona`, `tags[]`, `epic`, `target_release`, `item_type`, `source`.
- AI: Supabase Edge Functions (Deno) calling Claude Sonnet 4.6 via
  `supabase/functions/_shared/anthropic.ts` -> `callClaudeJSON`. Auth-gated (the
  exception is `recommend-pattern`, which is public with per-user rate limiting).
- Knowledge Base: `recommend-pattern` plus `_shared/pattern-grounding.ts`. The
  catalogue (`knowledge_items` + `knowledge_edges`) is enriched and published.
- Canvas tooling shared via `src/hooks/canvas/*` and
  `src/utils/canvas/canvasExporter.ts` (PNG/PDF).
- SEO: `scripts/prerender.mjs` is the source of truth for crawler meta. Every tool
  route has an entry there and in the React `SEOHead`.

## 4. Schema Additions (built)

### 4.1 Artifact links (provenance)

`project_artifact_links` (with RLS): `id`, `project_id`, `from_type`, `from_id`
(artifact id or composite path `<artifact_id>#deliverable:<node_id>` /
`#stage:<id>:<row>`), `to_type`, `to_id`, `link_kind` ('derived_from' | 'measures'
| 'tests'), `created_at`. The `source` field on backlog items carries a
human-readable provenance string for display without a join.

### 4.2 Container and item fields

`projects.intent_statement` (nullable), `projects.kind` (default 'project'), and
`projects.prioritisation_scheme` (nullable; default computed from `kind`).
`backlog_items.priority_data` (jsonb) holds scheme-specific scores (WSJF).
`backlog_items.backlog_artifact_id` (nullable, FK to `project_artifacts` with
`on delete set null`) ties an item to one product backlog; null means the
project's ungrouped backlog, so legacy items keep showing in the all-items view.

Migrations: `20260611120000` (links table, container fields,
`backlog_items.user_persona`/`epic`); `20260611130000` (Persona Studio, public
`user-uploads` bucket); `20260612160000` (prioritisation schemes);
`20260613130000` (scope `backlog_items` RLS to project/product ownership);
`20260613140000` (multiple backlogs: `backlog_items.backlog_artifact_id`).

## 5. The Coaching Layer (built)

### 5.1 Cell metadata pattern

`CellCoach` in `src/types/coaching.ts` (`tag`, `question`, `help`, `stretch`,
`color`). The Impact Map levels carry their `stretch` questions.

### 5.2 The coach interaction (`coach-reflect` edge function)

Built and deployed. Modes `coach`, `guide`, `session`. **Per-cell grounding is now
live:** coaching questions are Knowledge Base items (`item_type = 'question'`,
columns `coaches_slug` / `cell_key` / `rung` / `ladder_order`, migration
`20260613120000`). `coach-reflect` maps the tool to a KB artifact (`COACH_GROUNDING`),
queries the published ladder for the cell, and uses the KB opening / stretch /
follow-up questions when present, falling back to the static `CellCoach` strings the
app sends when not. `scripts/seed-questions.mjs` upserts the ladders, keyed by tool
so tools that share an ISA-O3 artifact never collide; all nine coached tools
(Persona, Impact Map, Journey Map, Business Case, Product Vision, BMC, Ways of
Working, Probe Tracker, Benefits Scorecard) are seeded.

### 5.3 "Suggest (AI)" buttons

"Ask the coach" routes through `coach-reflect`; example generation is a
clearly-marked secondary action, never auto-inserted.

### 5.4 Pipeline Registry

`src/config/pipeline.ts` lists the six stages and every tool's key, route,
`viewerCase`, stages, allowed link kinds and status. Two sibling registries follow
the same pattern: `src/config/toolIcons.ts` (one icon and brand colour per tool,
read by every surface) and `src/config/prioritisationSchemes.ts` (the backlog
schemes, section 6.14). Adding a tool is a registry entry plus the component.

### 5.5 Contracted Mode Switch (coach versus guide)

Built as the reusable `CoachChat` with a `mode` field. Coach (Deep Teal) and guide
(Orange) voices are visually distinct; the switch is permissioned and recorded in
the session artifact.

## 6. Tool-by-Tool (status per tool)

### 6.1 Impact Map Builder (`/impact-map`): DONE
`stretch` in `LEVEL_META`; Send to Backlog creates `backlog_items` rows plus
`project_artifact_links` (`derived_from`) via `useSendToBacklog`. **Send all to
Backlog** opens `SendToBacklogDialog` to pick an existing product backlog or
create a new one for the project, and each item carries the full story sentence
(`As <actor>, I need <deliverable>, so that <impact>`). Dedup is **per backlog**:
re-sending the same map to the same backlog adds only new What items, while the
same deliverable can still populate a different backlog.

### 6.2 Canvas catalogue (`/canvases`): DONE, now grounded
BMC recoached; Business Case and Product Vision canvases via the coached-canvas
engine. The **Canvas Picker is grounded**: a scenario textarea calls
`recommend-pattern` and maps the returned flow to a canvas (technique
`business-model-canvas` / `business-case` / `product-vision-board`), showing the
grounded diagnosis; the manual radios remain as a fallback.

### 6.3 User Story Canvas (`/user-story-canvas`): DONE
**Import deliverables** from the project's Impact Map artifacts: each deliverable
becomes a story card seeded with the deliverable text (and the actor as persona),
carrying provenance (`importedFrom`). **Push to Backlog** now creates a
`user_stories` row and links the backlog item via `fk_backlog_items_user_story`,
and writes `project_artifact_links` (`user_story` -> `backlog_item`, plus the
originating `impact-map` deliverable when imported), all `derived_from`. Priority is
normalised and persona carried across.

### 6.4 Product Backlog (`/backlog`): DONE
CSV export (Jira, Azure DevOps, Trello); provenance chips; one-question-upstream;
relational single source via `useProjectBacklog`. Now also carries the Story Map
view (6.13) and Prioritisation Schemes (6.14). **Multiple backlogs per project:**
a product backlog is a `project_artifacts` row (`artifact_type 'product-backlog'`),
so it appears as a card on the project page and opens in the ArtifactViewer
scoped to its own items (`backlog_artifact_id`). `/backlog?projectId=&backlogId=`
scopes the full tool to one backlog; without `backlogId` it shows every item in
the project. Verified end-to-end against the live deploy by
`e2e/backlog-flow.deployed.spec.ts`. Multi-select delete is supported.

### 6.5 Modelling Canvas (`/project-modelling`): DONE
Repositioned and renamed in copy; pulls Knowledge Base items. Selecting a single
sticky or hexi shows a **Promote to** bar: **Backlog item** creates a
`backlog_items` row (story) with a `project_artifact_links` provenance link
(`project-model` -> `backlog_item`, `derived_from`), and **New artifact** opens the
Canvas Picker to seed a new artifact of a chosen type. (Direct injection of an
Impact Map deliverable node is deferred; promoting to the backlog covers the
story/backlog target.)

### 6.6 Probe Tracker (`/probes`): DONE
### 6.7 Benefits Scorecard (`/benefits`): DONE
### 6.8 Persona Studio (`/personas`): DONE
Coached fields plus avatar; also has **Import JSON** restore (section 12).

### 6.9 Coaching Studio (`/coach`): DONE
ICF-style arc plus harvest via `coach-harvest`
(goal/backlog/probe/benefit/persona/agreement/note).

### 6.9a Suggest a Path: DONE
A guide-mode extension to the harvest: a permissioned, badged (Orange) end-of-session
offer that synthesises the session (topic, harvest summary, harvested items) into a
scenario with no extra AI call, calls `recommend-pattern`, and renders the grounded
flow. Each step maps to a pipeline tool via `src/config/pathTools.ts` (technique
first, then catalogue artifact); steps with no tool show as guidance. Opening a step
opens the tool and records it on the session; the path persists in `suggested_path`
on the `coaching-session` artifact and appears in the Markdown and JSON exports.

### 6.10 Retro Coach and Ways of Working (`/ways-of-working`): DONE
### 6.11 Journey view (`/ai-tools` rework): DONE
`JourneyBand` (public) and `ProjectJourney`, six stages, registry-driven.

### 6.12 Journey Map Studio (`/journey-map`, `journey-map`): DONE
A coached grid: journey stages across the top, rows for doing, thinking, feeling,
pains and opportunities, anchored to a persona. Each cell is coached. Pains and
opportunities promote to the backlog as candidates with provenance
(`journey-map` -> `backlog_item`, `derived_from`). Exports PNG, PDF, JSON, Markdown.
Wired into the registries, routes, prerender, ArtifactViewer, the AI Tools Hub and
the project Add Tool menu. Standing stretch: "Which stage do we not actually have
evidence for?"

### 6.13 Story Map view (Backlog): DONE
A List / Story Map toggle on `/backlog`. The Story Map is a read-only view over the
existing `backlog_items` (no new data model, after Jeff Patton): backbone columns
are the epics, cards sit beneath their epic ancestor via `parent_item_id`,
horizontal slices are releases (`target_release`, with an Unscheduled row). Each
slice exports its own CSV. Editing stays in the list view.

### 6.14 Prioritisation Schemes (Backlog): DONE
A scheme registry (`src/config/prioritisationSchemes.ts`): each scheme declares its
options or fields, how to rank and sort an item, its CSV behaviour and a coach
stretch.
- **simple**: critical, high, medium, low.
- **moscow**: Must, Should, Could, Won't (Dai Clegg, DSDM). Won't is excluded from
  CSV by default, with a toggle in the export menu.
- **wsjf**: value, time criticality and risk reduction over job size (Cost of
  Delay, after Reinertsen, popularised in SAFe). Four scores stored in
  `backlog_items.priority_data`, with a live computed score.

Per-journey setting `projects.prioritisation_scheme` (nullable; the app computes the
default from `kind`: project -> moscow, otherwise simple). A scheme selector sits on
the backlog header; the Estimation tab renders the active scheme via a scheme
context (`SchemeContext`); CSV ranks and filters by the active scheme. Resolves
deviation 2. RICE is the natural next scheme (KB slug `rice` exists).

## 7. Exports (actual state)

| Tool | PDF | CSV | Markdown | JSON | PNG |
|---|---|---|---|---|---|
| Impact Map | yes | no | yes | yes | yes |
| Business Case / Product Vision | yes | no | yes | yes | no |
| Story Canvas | no | via Backlog | yes | yes | yes |
| Backlog | printable wall | yes: Jira, ADO, Trello, per-slice | yes | yes | no |
| Probe Tracker | yes | yes | yes | yes | no |
| Benefits Scorecard | yes: Benefits on a Page | yes | yes | yes | no |
| Persona Studio | yes | no | yes | yes (export and import) | yes |
| Journey Map Studio | yes | no | yes | yes | yes |
| Coaching Studio | no | no | yes | yes | no |
| Ways of Working | yes | no | yes | yes | no |

PDF and CSV remain behind sign-in.

## 8. Build Increments (as delivered)

- **Increment 1 (DONE, 530e2517):** links table; `intent_statement`/`kind`; Impact
  Map Send to Backlog; Backlog provenance chips, CSV, one-question-upstream.
- **Increment 2 (DONE):** `coach-reflect`; `CellCoach`; Impact Map stretch; Persona
  Studio; Canvas catalogue; BMC recoached.
- **Increment 3 (DONE):** Probe Tracker; Benefits Scorecard; Coaching Studio +
  `coach-harvest`; Ways of Working; Journey view.
- **v1.4 (DONE):** Journey Map Studio (6.12), Story Map view (6.13), Prioritisation
  Schemes (6.14), Canvas Picker grounding (6.2), plus the hardening in section 12.

## 9. Engineering Notes (carry into every prompt)

- Claude via `callClaudeJSON`: strict-JSON system prompt, first-balanced-object
  extraction, generous `max_tokens`, no assistant prefill.
- Deploy edge functions: `npx supabase functions deploy <name> --project-ref wqaplkypnetifpqrungv`.
- All AI behind auth, except `recommend-pattern` (public, rate-limited). Edge
  functions are CORS-locked to the production origin, so browser calls only work in
  production; verify AI UI in prod or via a direct function call, not local dev.
- House style: British English, no em dashes anywhere, "artifact" not "artefact",
  Title Case headings, Deep Teal `#004D4D` and Orange `#FF9715`, DM Sans and DM
  Serif Display.
- Every new route: `prerender.mjs` AND `SEOHead`. Every new tool: a Pipeline
  Registry entry AND a `toolIcons` entry.
- New `knowledge_items` slugs must match `org-*`, `coord-*` or `team-*` or grounding
  silently drops them.
- **Knowledge Base imports:** `scripts/import-knowledge.mjs` (update existing slugs
  only, upsert typed edges) and `scripts/backup-knowledge.mjs` run locally with the
  service role key from `.env`. The `import-knowledge-json` edge function keeps its
  admin gate for the app. The importer writes a whole row per slug, so enrichment
  payloads must carry full entries, not just changed fields.
- **Destructive editor actions:** Clear, New and Load Example pass through
  `confirmReplace` (`src/utils/confirmDiscard.ts`) and are hidden in artifact mode.
  Auto-save must never persist a fully-empty state over a saved artifact.
- **Coached-tool exports:** the export region is a hardcoded white card. Any text
  shown in the export must use an explicit colour (for example `text-slate-900`),
  never a theme token, or it renders invisibly in html2canvas and in dark mode.
  Verify exports against the rendered image in both themes.
- Build stage-aware features against the Pipeline Registry, never a hard-coded
  stage list. Build backlog priority features against the scheme registry.

## 10. Out of Scope (v1)

Approach-stage canvases (Collaboration Network, Build and Quality) as tools; sprint
or delivery team boards; email-gating separate from auth; multi-user simultaneous
editing; Wardley or Event Storming tools.

## 11. Deviations Found During the Build

1. v1.2 claimed `backlog_items` had `user_persona` and `epic`; neither existed.
   Added in the Increment 1 migration.
2. v1.2 assumed MoSCoW priorities; the backlog used critical/high/medium/low.
   Resolved by Prioritisation Schemes (6.14): MoSCoW is now a selectable scheme with
   the Won't-from-CSV toggle.
3. Section 6.3 (User Story Canvas) was never assigned an increment and is recorded
   as partial.

## 12. Hardening and Polish (post-increment, all live)

1. **Dark-mode export fix.** Persona, Business Case, Product Vision, Benefits
   Scorecard and Ways of Working cards rendered value text invisibly in PNG/PDF
   exports (and on screen in dark mode) because they used theme text colours on a
   hardcoded white card. All such text now uses an explicit dark colour. Verified by
   exporting each tool through the real html2canvas and jsPDF path in both themes.
2. **Data-loss guards.** Clear/New/Load Example confirm before discarding
   (`confirmReplace`); artifact-mode auto-save no longer persists a fully-empty
   state; the scratchpad buttons are hidden entirely in artifact mode.
3. **Persona Import JSON.** A restore action paired with the existing JSON export.
4. **Back to Project navigation.** Tools opened from a project's Add Tool menu
   (`?projectId=`) show a Back to Project link instead of only Back to AI Tools.
5. **Centralised tool icons and colours.** `src/config/toolIcons.ts` is the single
   source; the Hub, Add Tool menu, artifact cards and the viewer header read from
   it, each tool in its own brand colour.
6. **My Projects link.** A direct link in the orange Dashboard dropdown and the
   mobile menu to `/dashboard?tab=projects` (signed-in users only); the dashboard
   tabs are URL-driven.
7. **Knowledge Base enrichment and coach grounding.** The catalogue was enriched
   (richer descriptions, technique-to-artifact edges) and imported via the CLI
   importer, grounding the Canvas Picker (6.2). Coaching questions then moved into
   the Knowledge Base as `question` items, grounding the coach per cell (5.2), with
   a static fallback so nothing breaks before a ladder is seeded.
8. **Adversarial red-team review and remediation.** A multi-agent review (six
   dimensions, each finding independently verified by a skeptic) was run over this
   session's changes. It surfaced 22 confirmed findings, all fixed or deliberately
   retained. The most important:
   - **`backlog_items` RLS was fully permissive** (`USING (true)`), so any
     authenticated user could read or write another user's backlog via a tool URL.
     This pre-dated the session; the new write paths broadened it. Fixed with an
     ownership-scoped policy (migration `20260613130000`), mirroring
     `project_artifact_links`.
   - **Coach question ladders are keyed by tool, not artifact slug**, so tools that
     share an ISA-O3 artifact (Persona and Journey Map) no longer collide on a
     ladder.
   - **Ordinal scheme rank is cross-vocabulary**, so legacy critical/high/medium/low
     items rank correctly under MoSCoW.
   - **Provenance links are best-effort** across all promote/push paths (a link
     failure no longer reports total failure or orphans a `user_stories` row), and
     push-to-backlog preserves the scheme priority and `priority_data`.
   Retained by design: the empty-save guard (data-loss safety; destructive buttons
   are already hidden in artifact mode) and manual on-screen backlog ordering (only
   export is scheme-ranked).

---

## Appendix A: Stretch Questions by Cell (coaching voice)

Built into the tools.

**Business Case.** Vision: "What in today's way of working actually works, and might
this break it?" Options: "Which option had you already chosen before the others were
written down?" Solution Overview: "Which optional part is actually load-bearing?"
Strategic Alignment: "If the strategy shifted next quarter, which part of this case
would fall?" Costs and Benefits: "What does your worst case still quietly assume will
go right?" Investment Appraisal: "When do the costs land against the benefits, and
can you survive the gap?" Investment Risk: "Which risk are you leaving out because
naming it would weaken the case?" Assumptions: "Which assumption are you relying on
most and testing least?"

**Stories.** Persona: "Who would be inconvenienced by this succeeding?" Acceptance:
"What would make you reject this even if every criterion passed?"

**Backlog.** Simple/MoSCoW: "Which Must would you quietly trade away under pressure?"
WSJF: "Which of these numbers is a guess wearing a decimal point?" Scope: "What are
you choosing not to build, and who agreed to that?"

**Journey Map.** Per stage: "What is this persona trying to get done here?" Stretch:
"Which stage do we not actually have evidence for?"

**Probes.** "If this probe succeeds, what will you stop doing?"

**Benefits.** "If every number improved and nothing really changed, how would you
know?"

**Ways of Working.** "What works well that we have quietly become afraid to change?"

**Coaching Studio (session level).** "What are you hoping I will not ask about?"
(use sparingly, only once trust is established).

---

## Appendix B: What Remains

Every spec item is built and all nine coached tools' question ladders are seeded.
One optional extra remains:

1. **RICE** as a fourth prioritisation scheme (a `prioritisationSchemes.ts` entry).

*End of specification, version 1.4.*
