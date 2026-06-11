# Vision to Value: Tool Pipeline Specification

**Version:** 1.2 (10 June 2026). Supersedes 1.1; adds the Pipeline Registry, the Contracted Mode Switch, and Knowledge Base grounding constraints.
**Audience:** Claude Code, working in `altogetheragile/altogether-home-base`
**Status:** Approved for incremental build. Read alongside `TOOLS.md`, which stays the tool inventory of record.

> Implementation notes (build log)
>
> **Increment 1: DONE and live (commit 530e2517, 11 June 2026).** Migration
> `20260611120000_vision_to_value_increment_1.sql` applied to prod: `project_artifact_links`
> (+RLS), `projects.intent_statement`/`kind`, `backlog_items.user_persona`/`epic`. Pipeline
> Registry at `src/config/pipeline.ts`. Impact Map Send-to-Backlog, Backlog CSV
> (`src/utils/backlog/backlogCsv.ts`), provenance chips, one-question-upstream
> (`src/components/backlog/UpstreamIntentPrompt.tsx`). Verified end-to-end under RLS.
>
> **Known issue found 11 June 2026 (backlog dual-model):** project backlogs have two
> stores that disagree. `/backlog` Save-to-Project writes only the `product-backlog`
> artifact JSON (`createArtifact`); ArtifactViewer edit-mode *loads* from the relational
> `backlog_items` table but *saves* to the artifact JSON; Impact Map Send-to-Backlog writes
> relational rows. Result: edits do not round-trip, and items with a null relational
> `item_type` render as "Story" (e.g. an "Epic" shows as a Story). Recommendation: make the
> relational `backlog_items` table the single source for project backlogs (Save-to-Project
> and the artifact editor read AND write relational rows; the artifact row becomes a pointer
> or is dropped). RESOLVED 11 June 2026: added `useProjectBacklog` (relational CRUD);
> ProductBacklog uses it in project mode (items auto-persist, no Save-to-Project snapshot);
> standalone Save-to-Project now writes relational rows; ArtifactViewer routes backlog
> editing to `/backlog?projectId`. Verified: Epic item_type round-trips relationally.
>
> **Increment 2: DONE and live (11 June 2026).** `coach-reflect` edge fn (coach|guide modes);
> `CellCoach` + reusable `CoachChat` (Contracted Mode Switch); Impact Map stretch + Ask the
> coach; Persona Studio (`/personas`, public `user-uploads` bucket, migration
> `20260611130000`); Canvas catalogue (`/canvases` + `/canvases/:key`) with the data-driven
> coached-canvas engine, Business Case + Product Vision, and the (ungrounded) Canvas Picker.
>
> **Increment 3: DONE and live (11 June 2026), except KB grounding (blocked).** New artifact
> tools, each coached, exported (PNG/PDF/JSON/Markdown) and wired into routes, ArtifactViewer,
> the pipeline registry (`status: 'live'` + `viewerCase`), the AI Tools Hub, Project Tools and
> `prerender.mjs` (now 51 pages):
> - Ways of Working / Retro Coach (`/ways-of-working`, `ways-of-working`).
> - Probe Tracker (`/probes`, `probe-tracker`) — experiment kanban Planned→Running→Kept/Killed.
> - Benefits Scorecard (`/benefits`, `benefits-scorecard`) — readings + trend sparkline +
>   Benefits on a Page PDF.
> - Coaching Studio (`/coach`, `coaching-session`) — free coached conversation (new `session`
>   mode in `coach-reflect`) + harvest-to-pipeline via the new `coach-harvest` edge fn
>   (classifies into goal/backlog/probe/benefit/persona/agreement/note). Send-to-backlog writes
>   a real `backlog_items` row; other destinations open the tool and stay recorded in the
>   session. Both edge fns deployed and verified end-to-end with a temp user.
> - Journey view: `JourneyBand` on `/ai-tools` (public, SEO) and `ProjectJourney` on the
>   project page, both six stages with cascade-down/learning-up styling, driven by the registry.
>
> **Still open in Increment 3:** (a) KB grounding of the coach and Canvas Picker — BLOCKED on
> the `show_knowledge` publish and the `knowledge_items` seed (Technique to Artifact Map);
> nothing to ground against until the KB publishes. (b) Modelling Canvas promote-to-artifact.
> (c) Deferred: recoach the BMC generator (still one-shot AI).
>
> Deviations from this spec found during the build (carry into v1.3):
> 1. §3 claimed `backlog_items` had `user_persona` and `epic`; neither existed. Resolved by
>    adding both columns in the Increment 1 migration.
> 2. §6.4 assumes MoSCoW priorities (Must/Should/Could/Won't). The backlog actually uses
>    critical/high/medium/low. The CSV mapper handles both vocabularies; there is no "Won't"
>    value to exclude, so that toggle is not implemented.

---

## 1. Purpose and Positioning

Turn the five separate AI Tools Hub tools into one pipeline that walks a person from idea to value actualisation, structured on ISA-O3 and delivered as coaching.

Two principles govern every design decision:

1. **The artifact is the container; the coaching conversation is how it fills.** The AI asks open questions, follows the answers, then offers one gentle stretch question per cell. It never writes content first. It reflects the person's own words back as a draft the person edits. The output is always in the user's voice.
2. **The journey is the cascade down and the learning returning up.** Intent, Scope and Approach flow down; Operate, Outputs and Outcomes return evidence up. The right-hand side (probes, indicators, benefits) is what no competitor tool offers and must not be cut from scope.

Do not use the word "aporetic" anywhere user-facing. The stretch questions are presented as coaching. Tone: open, curious, unhurried. Never "CHALLENGE" as a label in these tools.

## 2. The Stage Model

| Stage | Question the coach holds | Primary artifacts |
|---|---|---|
| Intent | Why does this matter, who does it serve, what would be different? | Coaching Studio, Impact Map (goal, actors), canvas catalogue (vision side), Persona Studio |
| Scope | What value, whose needs, which options, what timeframe? | Impact Map (impacts, deliverables), Persona Studio, User Story Canvas, Product Backlog, canvas catalogue (economics) |
| Approach | How will we organise, assure quality, schedule? | Modelling Canvas (artifact brainstorm), future Collaboration and Build canvases (out of scope v1) |
| Operate | How are we working, and what one thing would most improve us? | Retro Coach and Ways of Working (new) |
| Outputs | Which output options are we testing, and what would kill each? | Probe Tracker, an experiment kanban (new) |
| Outcomes and Value | The numbers moved; did anything actually change? | Benefits Scorecard (new) |

Stage names follow ISA-O3 exactly. Operate is about how the team works, not merely whether the solution runs: working agreements, retrospection, improvement.

A **journey lives in the existing Projects container**, but the word "project" must not be assumed. Add `kind` ('project' | 'product' | 'team') to `projects`; all UI copy keys off it (Project, Product, Initiative). The neutral word in shared copy is "initiative". Product-led organisations must never be forced through project language.

Entry at any stage is allowed. When a user starts mid-journey (for example, straight into the Backlog), the coach asks exactly one upstream question ("Before we prioritise: in a sentence, why does this work exist?") and stores the answer as the project's `intent_statement`. Never force a user back to the start.

## 3. Verified Codebase Inventory (what we build on)

Confirmed by direct inspection on 10 June 2026:

- `project_artifacts` table: `id`, `project_id`, `name`, `artifact_type`, `data` (JSON), `created_at`, `created_by`. `src/pages/ArtifactViewer.tsx` switches on `artifact_type` (`bmc`, `project-model`, `product-backlog`, `canvas`, `user_story`, `impact-map`).
- `backlog_items` is a **relational table** (not artifact JSON) with `parent_item_id`, `product_id`, `project_id`, and `fk_backlog_items_user_story`. Item shape includes `title`, `description`, `acceptance_criteria[]`, `priority`, `user_persona`, `tags[]`, `epic`, `source`.
- Impact Map: `src/types/impactMap.ts` has `LEVEL_META` (tag, question, help, colour per level): the coaching pattern already prototyped. Exports: FreeMind, PNG, PDF, JSON, Markdown; JSON import.
- AI: Supabase Edge Functions (Deno) calling Claude Sonnet 4.6 via `supabase/functions/_shared/anthropic.ts` -> `callClaudeJSON`. Auth-gated. Known quirks: no JSON mode, no assistant prefill, so strict-JSON system prompt plus first-balanced-object extraction; set generous `max_tokens` or Sonnet truncates into invalid JSON.
- Knowledge Base and Pattern Builder (unpublished, `show_knowledge = false`): `recommend-pattern` edge function plus `_shared/pattern-grounding.ts`, which already models `horizon`, `isa`, `artifactId` (slugs `org-*`, `coord-*`, `team-*`) and enforces the contract that the model may only reference catalogue ids.
- Canvas tooling shared via `src/hooks/canvas/*` and `src/utils/canvas/canvasExporter.ts` (PNG/PDF).
- SEO: `scripts/prerender.mjs` is the source of truth for crawler meta. Every new or renamed route needs an entry there **and** in the React `SEOHead`.

## 4. Schema Additions

### 4.1 Artifact links (provenance)

New table `project_artifact_links`:

```
id uuid pk
project_id uuid fk
from_type text        -- 'impact-map' | 'business-case' | 'user_story' | 'backlog_item' | 'probe' | 'indicator'
from_id text          -- artifact id, or composite path for nodes inside JSON artifacts, e.g. '<artifact_id>#deliverable:<node_id>'
to_type text
to_id text
link_kind text        -- 'derived_from' | 'measures' | 'tests'
created_at timestamptz
```

Rationale: backlog items are relational while impact map nodes live inside artifact JSON, so a links table with composite ids covers both without migrating either. The existing `source` field on backlog items should also be populated with a human-readable provenance string ("From Impact Map: <goal>") for display without a join.

### 4.2 Container fields

Add `intent_statement text` (nullable) and `kind text default 'project'` to `projects`. Written by the one-question-upstream behaviour; displayed at the top of the journey view and prepended to every coaching prompt as grounding context.

## 5. The Coaching Layer

### 5.1 Cell metadata pattern

Generalise the Impact Map's `LEVEL_META` into a shared type in `src/types/coaching.ts`:

```ts
export interface CellCoach {
  tag: string;        // short label, e.g. 'WHY'
  question: string;   // the open question
  help: string;       // one or two sentences of guidance
  stretch: string;    // the gentle stretch question (aporetic, in coaching voice)
  color: string;      // brand colour
}
```

Add `stretch` to the existing Impact Map levels:

- goal: "If you achieved this and nothing felt different, how would you know?"
- actor: "Whose behaviour are you assuming will not change?"
- impact: "Which of these changes would happen anyway, without you?"
- deliverable: "Which of these are you most attached to, and what would tell you to drop it?"

Stretch questions for every other tool's cells are supplied in Appendix A. House rules for writing more: open form, aimed at the work never the person, one per cell, no jargon.

### 5.2 The coach interaction (new edge function `coach-reflect`)

One reusable function, called by any tool:

- **Input:** `{ tool, cell, intent_statement, conversation: [{role, text}], draft?: string }`
- **Behaviour:** Claude is system-prompted as a coach following ICF-style non-directive practice: ask one open question at a time; follow what the person said; after two or three exchanges offer the cell's `stretch` question; then offer a reflection: "Here is what I heard" as a draft cell value composed only from the user's own words. Never invent facts. Never answer the question for them.
- **Output (strict JSON):** `{ next_question?: string, reflection?: string, done: boolean }`
- Use `callClaudeJSON`; generous `max_tokens` (2000+).
- **Grounding (increment 3+):** pass relevant catalogue context from the Knowledge Base via the `recommend-pattern` grounding contract so questions can reference ISA-O3 patterns by id only. Until then the question ladders are static per cell.

### 5.3 Repositioning existing "Suggest (AI)" buttons

Keep them, but relabel "Ask the coach" and route through `coach-reflect`. Suggestion-style generation remains available as a secondary "Give me examples" action; examples are clearly marked as examples and never auto-inserted.

### 5.4 Pipeline Registry (the extension seam)

A single declarative source of truth, `src/config/pipeline.ts` (v1; may move to a table later), listing: the six stages in order; the artifact types belonging to each stage; each type's route, viewer case, coach metadata reference, and allowed link kinds. The journey view, the Canvas Picker and the coach all read the registry. **Adding a future tool (Collaboration Network, Wardley view, Event Storming board) must require only a registry entry plus its component**, no changes to the journey, picker or coach plumbing. Build increment 1 features against the registry from the start, not hard-coded stage lists.

### 5.5 Contracted Mode Switch (coach versus guide)

Recommending is not coaching. The boundary is a designed, reusable component, not a prompt nuance:

- **Contract at session start:** "This is a coaching conversation. At the end I will ask whether you would like suggestions."
- **Permissioned switch:** the coach only recommends after asking, for example "Would it be useful if I stepped out of coaching for a moment and suggested where these things could live?", and receiving a yes. The harvest step in the Coaching Studio uses this.
- **Legible modes:** coach voice and guide voice are visually distinct (coach in Deep Teal register, Guide badged in Orange). The user must always know which hat is talking.
- **Mid-session "what should I do?":** the coach neither refuses nor slips into advice; it offers the switch.
- **Guide mode is grounded:** recommendations come through the `recommend-pattern` grounding contract, citing catalogue entries only, never improvised.
- Implement as a shared component and a `mode` field in the `coach-reflect` contract (`'coach' | 'guide'`), with the switch event recorded in the session artifact.

## 6. Tool-by-Tool Changes

### 6.1 Impact Map Builder (`/impact-map`): Stages: Intent and Scope
- Add `stretch` to `LEVEL_META`; surface it in the existing coaching panel after the user has content at that level.
- New action on a deliverable and on bulk-select: **Send to Backlog**. Creates `backlog_items` rows (`title` = deliverable label, `source` = provenance string, `project_id` from the open project) plus `project_artifact_links` rows (`derived_from`).
- No export changes (already the standard the others must meet).

### 6.2 Canvas catalogue (`/canvases`): Stages: Intent and Scope economics
The BMC is kept, not replaced. The catalogue offers coached canvases as alternative containers, recommended by context:
- **Business Model Canvas** (`bmc`, existing): repositioned from one-shot generation to cell-by-cell coaching via `coach-reflect`. The generator becomes a secondary "Give me examples" action.
- **Business Case canvas** (`business-case`, new): cells follow the Business Case Edition: Business Vision, Options, Solution Overview, Strategic Alignment, Costs and Benefits as best, expected and worst ranges, Investment Appraisal, Investment Risk, Assumptions Risks and Dependencies.
- **Product Vision canvas** (`product-vision`, new): Vision, Target Group, Needs, Product, Business Goals, after Roman Pichler's Product Vision Board, coached.
- **Canvas Picker:** three or four coach questions ("Is this a new venture, a funded change, or a product direction?") recommend which canvas to open. Increment 3 grounds this in the Knowledge Base via the `recommend-pattern` contract, which is exactly the Pattern Builder's job.
- Each canvas: coached cells (Appendix A), PDF export in the house template (reuse the `fill-bmc-pdf` pattern), `prerender.mjs` and `SEOHead` entries for new routes. No redirects; `/bmc-generator` remains and gains the coaching layer.

### 6.3 User Story Canvas (`/user-story-canvas`): Stage: Scope
- New entry path: **Import deliverables** from a linked Impact Map; each becomes a story card seeded with the deliverable text; `generate-user-story` reframed to coach-then-draft (uses the user's persona and acceptance criteria answers).
- **Push to Backlog** uses the existing `fk_backlog_items_user_story`; write provenance links.

### 6.4 Product Backlog (`/backlog`): Stage: Scope commit
- **CSV export** with three column mappings, selected at export: Jira (Summary, Description, Priority, Labels, Epic Link), Azure DevOps (Title, Description, Priority, Tags, Area Path blank), Trello (Name, Desc, Labels). MoSCoW maps to priority: Must=Highest/1, Should=High/2, Could=Medium/3, Won't=excluded by default with a toggle.
- Show provenance chip on items that carry `source` or links ("From Impact Map").
- One-question-upstream behaviour on first open in a project without `intent_statement`.

### 6.5 Modelling Canvas (`/project-modelling`): team artifact brainstorm, any stage
Repositioned: not a project tool but the team's space to brainstorm which artifacts and elements their work needs, before and while filling them. It already pulls Knowledge Base items; lean into that.
- **Promote to:** a sticky or hexi can become an Impact Map deliverable, a story, a backlog item, **or a new artifact of a chosen type** (opens the Canvas Picker), writing the provenance link.
- UI copy becomes "Modelling Canvas"; the route stays for SEO.

### 6.6 Probe Tracker (new, `/probes`): Stage: Outputs
An **experiment kanban**. Columns: Planned, Running, Decided (Kept / Killed). Each card is an option-as-hypothesis: `{ option, output, probe, signal, status: 'planned'|'running'|'kept'|'killed', decided_at, note }`. artifact_type `probe-tracker`.
- Coached fields: probe ("What is the smallest test?"), signal ("What would prove this wrong?" as the stretch).
- Seed cards from Backlog epics or a canvas Options cell (links, `tests`).
- Drag between columns; deciding a card requires a one-line learning note. Inherits Save to Project, viewer case, auto-save.

### 6.7 Benefits Scorecard (new, `/benefits`): Stage: Outcomes and Value
- artifact_type `benefits-scorecard`. Data: array of `{ outcome, leading_indicator, target, readings: [{date, value, note}] }`, seeded from the Impact Map goal and Business Case Benefits cell via links (`measures`).
- The coach's standing stretch on review: "The numbers moved; did anything actually change?"
- Simple line spark per indicator; PDF one-pager export ("Benefits on a Page").

### 6.8 Persona Studio (new, `/personas`): Stages: Intent and Scope
- artifact_type `persona`. Fields: name, role, context, goals, pains, behaviours, quote. Coached through the Named Character and Jobs to Be Done questions from the ABC Beneficiaries technique guide.
- Links: derived_from an Impact Map actor; stories and backlog items reference it through the existing `user_persona` field.
- Stretch: "Who would be inconvenienced by this succeeding?" lives here, with the persona asked to answer it.

### 6.9 Coaching Studio (new, `/coach`): any stage, often the front door
A standalone coached conversation on any topic, not tied to a cell. ICF-style arc: contract ("what would make this conversation useful?"), explore, one stretch, then **harvest**: the coach proposes where each output lands ("this sounds like a goal; these three are backlog candidates; this concern belongs on the Probe board") with one-tap send-to actions that write artifacts and links.
- artifact_type `coaching-session`: transcript plus harvested items and where they went.
- Reuses `coach-reflect` with a session-level system prompt. This is the headline differentiator: a credentialled coaching practice expressed as software, and the cleanest entry to the whole pipeline.

### 6.10 Retro Coach and Ways of Working (new, `/ways-of-working`): Stage: Operate
- artifact_type `ways-of-working`: `{ agreements: [...], retro_actions: [{date, what_worked, improve_one_thing, action, status}] }`.
- The Retro Coach runs a short coached retrospective: what is working well, what one thing would most improve us, what will we do. Actions can push to the Backlog (link `derived_from`).
- Standing stretch: "What works well that we have quietly become afraid to change?"
- This gives the Development Approach its review mechanism and makes Operate a first-class stage rather than a label.

### 6.11 Journey view (`/ai-tools` rework)
- The hub page becomes the journey: six stages left to right, down-cascade and return-arrow styling consistent with the Aporetic Canvas (Inherited Intent down, Learning Returning up), each stage showing the project's artifacts of that stage with status, plus "start here" affordances. Tool cards remain reachable individually.
- Requires sign-in to start a journey (AI is auth-gated anyway); browsing the page is public for SEO.

## 7. Exports (target state per tool)

| Tool | PDF (house style) | CSV | Markdown | JSON | PNG |
|---|---|---|---|---|---|
| Impact Map | yes (exists) | no | yes (exists) | yes (exists) | yes (exists) |
| Business Case | yes | no | yes | yes | no |
| Story Canvas | no | via Backlog | yes | yes | yes (exists) |
| Backlog | printable wall | **yes: Jira, ADO, Trello** | yes | yes | no |
| Probe Tracker | yes | yes (simple) | yes | yes | no |
| Benefits Scorecard | **yes: Benefits on a Page** | yes (readings) | yes | yes | no |
| Persona Studio | yes (persona card) | no | yes | yes | no |
| Coaching Studio | no | no | yes (session notes) | yes | no |
| Ways of Working | yes (agreement on a page) | no | yes | yes | no |

PDF and CSV remain behind sign-in (already true for anything touching AI; extend to these export buttons). Track export events and tool-to-course-page clicks from day one.

## 8. Build Increments

**Increment 1: the thread of value (smallest end-to-end win)**
1. `project_artifact_links` migration; `intent_statement` on projects.
2. Impact Map: Send to Backlog. Backlog: provenance chips, CSV export (all three mappings), one-question-upstream.
3. `prerender.mjs` untouched routes; verify no SEO regression.
- *Acceptance:* a signed-in user goes from a goal to a Jira-importable CSV without re-typing anything, and every backlog item shows where it came from.

**Increment 2: the coach**
1. `coach-reflect` edge function; `CellCoach` type; `stretch` added to Impact Map levels.
2. Canvas catalogue: BMC recoached, Business Case and Product Vision canvases added, simple (ungrounded) Canvas Picker. PDF exports, SEO entries.
3. Persona Studio, wired to Impact Map actors and the backlog `user_persona` field.
- *Acceptance:* no tool writes user-facing content the user did not say first; every canvas cell can be filled through conversation alone; a persona created from an actor appears on a story.

**Increment 3: value actualisation and the studio**
1. Probe Tracker (experiment kanban) and Benefits Scorecard with links to Options, Backlog and Goal.
2. Coaching Studio with harvest-to-pipeline; Retro Coach and Ways of Working.
3. Journey view rework of `/ai-tools`; Modelling Canvas promote-to-artifact.
4. KB grounding of the coach and the Canvas Picker (behind the existing `show_knowledge` flag until the KB publishes). **Constraints verified in code:** the recommender's catalogue is built live from `knowledge_items` (slug, name, item_type, description, horizon, isa, layer); `pattern-grounding.ts` drops any id not in the catalogue and expects artifact slugs matching `org-*`, `coord-*` or `team-*`. Therefore: (a) every Vision to Value artifact type needs a correctly slugged, horizon-and-ISA-tagged `knowledge_items` row before the Picker can recommend it; (b) descriptions are the matching signal, write them richly; (c) coach question ladders need a KB home (new item_type `question`, or fields on artifact items) before coach grounding; (d) the seed content source is the Technique to Artifact Map (Delivery Usage Map v8, page 3), to be converted to the `import-knowledge-json` format.
- *Acceptance:* an initiative can show, on one screen, intent at the top and indicator readings at the bottom, connected by links; a coaching session can populate three different artifact types without retyping.

## 9. Engineering Notes (carry into every prompt)

- Claude via `callClaudeJSON`: strict-JSON system prompt, first-balanced-object extraction, generous `max_tokens`, no assistant prefill.
- Deploy: `npx supabase functions deploy <name> --project-ref wqaplkypnetifpqrungv`.
- All AI behind auth. `OPENAI_API_KEY` is dead; do not reintroduce.
- House style: British English, no em dashes anywhere (UI copy, code comments, PDFs), "artifact" not "artefact", Title Case for headings, brand colours Deep Teal `#004D4D` and Orange `#FF9715`, DM Sans and DM Serif Display.
- Every new route: `prerender.mjs` AND `SEOHead`.
- New `knowledge_items` slugs must match `org-*`, `coord-*` or `team-*` or grounding silently drops them.
- Build stage-aware features against the Pipeline Registry (5.4), never a hard-coded stage list.

## 10. Out of Scope (v1)

Approach-stage canvases (Collaboration Network, Build and Quality) as tools; sprint or delivery team boards; email-gating separate from auth; multi-user simultaneous editing; Wardley or Event Storming tools.

---

## Appendix A: Stretch Questions by Cell (coaching voice)

**Business Case.** Vision: "What in today's way of working actually works, and might this break it?" Options: "Which option had you already chosen before the others were written down?" Solution Overview: "Which optional part is actually load-bearing?" Strategic Alignment: "If the strategy shifted next quarter, which part of this case would fall?" Costs and Benefits: "What does your worst case still quietly assume will go right?" Investment Appraisal: "When do the costs land against the benefits, and can you survive the gap?" Investment Risk: "Which risk are you leaving out because naming it would weaken the case?" Assumptions: "Which assumption are you relying on most and testing least?"

**Stories.** Persona: "Who would be inconvenienced by this succeeding?" Acceptance: "What would make you reject this even if every criterion passed?"

**Backlog.** Prioritisation: "Which Must would you quietly trade away under pressure?" Scope: "What are you choosing not to build, and who agreed to that?"

**Probes.** "If this probe succeeds, what will you stop doing?"

**Benefits.** "If every number improved and nothing really changed, how would you know?"

**Ways of Working.** "What works well that we have quietly become afraid to change?"

**Coaching Studio (session level).** "What are you hoping I will not ask about?" (use sparingly, only once trust is established in the session).

*End of specification.*
