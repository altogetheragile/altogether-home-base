# Scrum Simulation: Build Notes and Roadmap

**Route:** `/scrum-game` (`src/pages/ScrumGame.tsx`)
**Code:** `src/components/scrumGame/`
**Audience:** Claude Code, working in `altogetheragile/altogether-home-base`.
This is the as-built record plus the agreed next steps, so any session (laptop
or a fresh browser session) can pick up where we left off. It is a separate game
from the Kanban Flow game (`docs/kanban-flow-game-spec.md`), built on the same
proven patterns.

**Status:** Built and live on `altogetheragile.com/scrum-game`.

---

## 0. How to Continue Here

A new session does not have our conversation history. Read this file, skim the
code under `src/components/scrumGame/`, and check `git log` (commit messages are
descriptive). Then continue with the next slice in section 5.

Working agreement for this game (from the product owner, Al):

- Content rules apply: no em dashes, never "certified", say "events" not
  "ceremonies", Title Case for headings.
- Ship in small slices. Each slice: branch, keep `eslint` at or under 134
  warnings, run `tsc -b --force` and the scrum tests, open a PR, wait for CI
  green, squash-merge, confirm a fresh Vercel production deploy.
- Prompt before push and deploy. Al reviews on the Vercel preview or the live
  URL on an iPhone, so lean on tests plus the preview deployment.
- Scrum fidelity matters more than game flash. When in doubt, match the current
  Scrum Guide, and flag any deliberate divergence in-game as a teaching point.

---

## 1. Architecture

One engine, many skins.

- **Pure reducer engine.** `engine.ts` holds all rules as pure functions over
  `ScrumState` (`types.ts`); `useScrumGame.ts` wires them to a `useReducer`.
  No effects in the engine, so every rule is unit-testable.
- **Deterministic RNG.** A seeded mulberry32 (`SPRINT_SEED = 0x5bd1e995`) keyed
  by (sprint, day, developer) makes dice, impediments, change requests and event
  cards reproducible. Tests assert exact outcomes.
- **Theme config.** `theme.ts` defines `ThemeConfig` (Product Goal, Definition
  of Done, backlog items with value/effort/visualKey/tags, stakeholders, event
  cards). `ACTIVE_THEME = bookingTheme` today. Swapping the theme re-skins the
  whole game without touching the engine. This is what a second theme proves.
- **Config and tuning.** `config.ts` holds constants and the initial state.
  Balance is guarded by `scrum.balance.test.ts`; behaviour by `scrum.test.ts`
  (60 tests at time of writing).

Key components: `ScrumIntro`, `RefinementScreen`, `SprintPlanning`,
`SprintBoard` (three-pane flow: Product Backlog left, board plus charts middle,
`BuildCanvas` right), `SprintReview`, `SprintRetro`, `ScrumFinal`, plus panels
(`DailyScrum`, `ScrumMasterPanel`, `ChangeRequestPanel`, `EventCardPanel`,
`StakeholderPanel`, `DaySummary`, `BacklogSidebar`, `FloatingBar`, `LearningTip`).

---

## 2. Phase Flow

`intro -> refine -> planning -> sprint -> review -> retro -> planning -> ...`

- **Refinement is a one-time bootstrap before Sprint 1 only.** You need a rough
  Backlog to start, so `RefinementScreen` readies it just enough (order plus
  split big items until a few are Ready). From Sprint 2 on there is no separate
  refinement step: the Retrospective goes straight to Planning, because the team
  refines during each Sprint (see section 4).
- Planning's Back button returns to Refinement only before the first Sprint.
- Each phase resets scroll to the top (`ScrumGame.tsx` effect on `state.phase`).

---

## 3. Scrum Fidelity Rules (locked in)

These were corrected during the build and must be preserved:

- **The Sprint Review is not an acceptance gate.** Work is Done when it meets the
  Definition of Done during the Sprint. There is no product owner accept/reject
  step. Velocity counts Done points. The Review inspects the Increment and
  progress toward the **Product Goal**.
- **The Retrospective is about the team and quality.** The **Definition of Done**
  is inspected and can be strengthened here, not at the Review.
- **There is no Product Backlog Refinement inside Sprint Planning selection.**
  Planning selects items that are already Ready (Topic 2). Refinement is its own
  bootstrap step and then continuous during the Sprint.
- **Impediments impact progress.** Residual cost even when addressed; blockers
  persist across days unless escalated.
- **Unfinished work is re-estimated.** At the Review, incomplete stories return
  to the Product Backlog sized to the work that is LEFT, not the original whole.
- **The Daily Scrum is a performed event.** Running a day is the Daily Scrum:
  inspect toward the Sprint Goal, decide who swarms what (team-driven, not
  assigned from above), the Scrum Master clears the impediment.
- **Sprint length is the player's choice** (one, two or four weeks). The intro
  must not imply a fixed two-week Sprint.

Deliberate divergence to keep flagged: the current Guide allows scope to be
renegotiated with the product owner mid-Sprint while the Sprint Goal stays fixed.
The sim follows this (pull-in, change requests, event scope injection) rather
than the stricter "commitment cannot be changed" wording in Sutherland's 2014
book. The committed baseline (`committedStoryIds`) stays fixed for scoring.

---

## 4. Key Mechanics

- **Dev-days.** `devDays = workingDays x 0.9` (events take about a tenth of the
  timebox): 5 -> 4.5, 10 -> 9, 20 -> 18. `Sprint.length = ceil(devDays)`; the
  final day is weighted when `devDays` is fractional.
- **Effort and dice.** Each assigned Developer rolls 1..2 per day onto their
  story (`devRoll`). Swarming finishes work fast; the bench contributes nothing.
  A story is Done when `effortRemaining` reaches 0. Kaizen adds a small capped
  daily bonus to the most-swarmed story.
- **Burndown** tracks remaining WORK (effort), not points of unfinished stories,
  so partial daily progress shows on the chart.
- **Impediments.** `IMPEDIMENT_EFFECT` residual costs: distraction
  {addressed 0.85, ignored 0.5}, blocker {addressed 0.6, ignored 0.25}. Blockers
  take `BLOCKER_RESOLVE_DAYS = 2` escalated days to clear. Tracks
  `impedimentsHit` and `impedimentsIgnored`.
- **Change requests** (product owner adapting) and **event-card dilemmas** (theme
  narrative, no right answer, effects on satisfaction and/or a scope injection):
  at most one per Sprint (an event only if there is no change request).
- **Stakeholders.** Satisfaction meters 0..100 (start 50). At the Review each
  stakeholder moves by the value of the Increment weighted by their `tagWeights`,
  or decays by `neglectDecay` if nothing on their agenda shipped. Conflicting
  weights are the prioritisation tension.
- **Refinement.** `REFINE_MAX = 13` (Ready threshold); `SPLIT_MAP`
  21 -> [13,8], 13 -> [8,5], 8 -> [5,3] (Fibonacci; value splits
  proportionally). Splitting in the bootstrap Refinement step is free. Splitting
  DURING a running Sprint charges `REFINE_COST = 2` against the next Run Day
  (spread across work in progress, then cleared), surfaced in the day recap and
  the Backlog sidebar. Refinement is real work that takes team time.
- **Learning layer.** `learning.ts` holds short coaching points surfaced at the
  moment they matter, grounded in the Professional Scrum Master exam areas but
  paraphrased in our own words. Do NOT reproduce the exam's own questions or
  answers verbatim, so the exam keeps its value.

---

## 5. Roadmap

Shipped so far: bigger configurable team, Scrum Master plus impediments, active
product owner plus change requests, Product Goal thread plus ending, editable
Definition of Done, juice plus Sprint scorecard, exam learning layer, theme-config
refactor, build canvas, stakeholders plus satisfaction meters, event-card
dilemmas, refinement bootstrap plus in-Sprint refinement cost.

**Next up: Estimation.** This is the agreed next slice, and it closes the clearest
gap against Sutherland's "How to Begin" checklist ("the people who are actually
going to complete the items estimate how much effort they will take", by relative
size or Fibonacci points, never hours). Design sketch:

- Some backlog items start un-sized (no point estimate).
- The team sizes them before they can be Ready, on the Fibonacci scale
  (1, 2, 3, 5, 8, 13, 21). Optionally a light planning-poker reveal for juice.
- Estimation happens in the Refinement step and can be revisited during the
  Sprint. Only sized items can become Ready and be pulled into Planning.
- Teach relative sizing over hours, and that the doers estimate, not the manager.

Then the rest of the gamification deck:

- **A second theme** (for example Wonder Park or Mission: Orbit). Mostly content
  in a new `ThemeConfig`; proves one engine, many skins end to end. Watch for any
  engine assumption baked to the booking theme.
- **Meters plus quality and debt plus scoring.** Morale and tech-debt meters;
  cutting corners creates debt (framed for fidelity, not just points); a
  cumulative or finale scoring win condition.

Optional later: iPad or PWA packaging (tablet-first responsive pass; Capacitor
only if a store listing is wanted).

---

## 6. Known Gaps (from the Sutherland "How to Begin" review)

1. **Team estimation** is missing (addressed by the Estimation slice above).
2. **Kaizen as a tracked item.** Sutherland wants the improvement carried into the
   next Sprint as a backlog item with acceptance tests, to verify it was done and
   its effect on velocity. The sim currently auto-applies it as a velocity nudge.
3. **The Daily Scrum's three questions** are modelled in purpose but not surfaced
   literally. Could add as framing to make the event instantly recognisable.
4. Minor: team size caps at 7 (book says 3 to 9; current Guide says typically 10
   or fewer).

---

## 7. Build, Test and Deploy

- Tests: `npx vitest run src/components/scrumGame/` (behaviour plus balance).
- Type check: `npx tsc -b --force`. Lint budget: `eslint` at or under 134
  warnings.
- Deploy: push branch, open a PR via the GitHub REST API (no `gh` CLI here; use
  the git credential token with `curl`), wait for the `ci` check plus the Vercel
  checks to go green, squash-merge, then confirm BOTH production projects
  (`altogether-home-base` and `altogether-home-base-web-next`) report a
  successful deploy for the merged SHA via the GitHub deployments API.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
  PR body ends with the Claude Code generated-with line.
